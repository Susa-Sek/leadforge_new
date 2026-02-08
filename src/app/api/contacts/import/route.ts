// Contact Import API Route (Pro+ feature)
// POST /api/contacts/import - Import leads from collection

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ImportSchema = z.object({
  collection_id: z.string().uuid('Ungültige Sammlungs-ID'),
  lead_indices: z.array(z.number().int().min(0)).min(1, 'Mindestens ein Lead auswählen'),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Check user plan
    const { data: planData, error: planError } = await supabase.rpc('get_user_plan', {
      p_user_id: user.id
    })

    if (planError) {
      console.error('Error getting user plan:', planError)
    }

    const userPlan = planData || 'free'

    // Import is Pro+ only
    if (userPlan === 'free') {
      return NextResponse.json(
        {
          error: 'Pro-Funktion erforderlich',
          code: 'PRO_REQUIRED',
          message: 'Der Import aus Sammlungen ist eine Pro-Funktion. Upgrade zu Pro, um Kontakte zu importieren.'
        },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await request.json()
    const validated = ImportSchema.parse(body)
    const { collection_id, lead_indices, tag_ids } = validated

    // Fetch the collection
    const { data: collection, error: collectionError } = await supabase
      .from('search_history')
      .select('*')
      .eq('id', collection_id)
      .eq('user_id', user.id)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json(
        { error: 'Sammlung nicht gefunden' },
        { status: 404 }
      )
    }

    // Parse results
    const results = collection.results || []
    const selectedLeads = lead_indices.map(index => results[index]).filter(Boolean)

    if (selectedLeads.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Leads ausgewählt' },
        { status: 400 }
      )
    }

    // Check current contact count and limit
    const { data: currentCount, error: countError } = await supabase.rpc('get_user_contact_count', {
      p_user_id: user.id
    })

    if (countError) {
      console.error('Error counting contacts:', countError)
    }

    const maxContacts = userPlan === 'pro' ? 500 : 1000000
    const availableSlots = maxContacts - (currentCount || 0)

    if (availableSlots <= 0) {
      return NextResponse.json(
        {
          error: 'Kontakt-Limit erreicht',
          code: 'PLAN_LIMIT_REACHED',
          message: `Sie haben das Limit von ${maxContacts} Kontakten erreicht.`
        },
        { status: 403 }
      )
    }

    // Limit the number of leads to import based on available slots
    const leadsToImport = selectedLeads.slice(0, availableSlots)

    // Get existing emails for duplicate detection
    const { data: existingContacts, error: existingError } = await supabase
      .from('contacts')
      .select('email')
      .eq('user_id', user.id)
      .not('email', 'is', null)

    if (existingError) {
      console.error('Error fetching existing contacts:', existingError)
    }

    const existingEmails = new Set(
      (existingContacts || []).map(c => c.email?.toLowerCase()).filter(Boolean)
    )

    // Prepare contacts to insert
    const contactsToInsert = []
    const duplicates = []

    for (const lead of leadsToImport) {
      const email = lead.email?.toLowerCase()

      // Check for duplicate
      if (email && existingEmails.has(email)) {
        duplicates.push({
          name: lead.title || lead.name,
          email: lead.email,
          reason: 'E-Mail-Adresse existiert bereits'
        })
        continue
      }

      contactsToInsert.push({
        user_id: user.id,
        name: lead.title || lead.name || 'Unbekannt',
        company: lead.company || lead.address?.split(',')[0] || 'Unbekannt',
        email: lead.email || null,
        phone: lead.phone || null,
        address: typeof lead.address === 'string' ? lead.address : null,
        website: lead.website || null,
        notes: null,
        source_collection_id: collection_id,
      })

      // Add to existing emails set to prevent duplicates within this import
      if (email) {
        existingEmails.add(email)
      }
    }

    if (contactsToInsert.length === 0) {
      return NextResponse.json(
        {
          error: 'Alle ausgewählten Leads existieren bereits als Kontakte',
          duplicates,
          imported_count: 0,
        },
        { status: 409 }
      )
    }

    // Insert contacts
    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(contactsToInsert)
      .select()

    if (insertError) {
      // Check for plan limit error
      if (insertError.message?.includes('Kontakt-Limit erreicht')) {
        return NextResponse.json(
          {
            error: 'Kontakt-Limit erreicht',
            code: 'PLAN_LIMIT_REACHED',
            message: insertError.message
          },
          { status: 403 }
        )
      }
      console.error('Error importing contacts:', insertError)
      return NextResponse.json(
        { error: 'Fehler beim Importieren der Kontakte' },
        { status: 500 }
      )
    }

    // Add tags to imported contacts if provided
    if (tag_ids && tag_ids.length > 0 && insertedContacts && insertedContacts.length > 0) {
      const tagAssignments = []
      for (const contact of insertedContacts) {
        for (const tagId of tag_ids) {
          tagAssignments.push({
            contact_id: contact.id,
            tag_id: tagId,
          })
        }
      }

      const { error: tagError } = await supabase
        .from('contact_tag_assignments')
        .insert(tagAssignments)

      if (tagError) {
        console.error('Error adding tags:', tagError)
      }
    }

    // Create interaction records for import
    const interactionsToInsert = insertedContacts?.map(contact => ({
      contact_id: contact.id,
      user_id: user.id,
      type: 'note' as const,
      notes: `Importiert aus Sammlung "${collection.search_name || 'Unbenannt'}"`,
    })) || []

    if (interactionsToInsert.length > 0) {
      const { error: interactionError } = await supabase
        .from('interactions')
        .insert(interactionsToInsert)

      if (interactionError) {
        console.error('Error creating import interactions:', interactionError)
      }
    }

    return NextResponse.json({
      message: `${insertedContacts?.length || 0} Kontakte erfolgreich importiert`,
      imported_count: insertedContacts?.length || 0,
      total_selected: selectedLeads.length,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      skipped_duplicates: duplicates.length,
      contacts: insertedContacts,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in contacts import:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
