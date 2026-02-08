import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/crm/contact-form';
import { createClient } from '@/lib/supabase/server';

interface EditContactPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getContact(id: string) {
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      *,
      tags:contact_tag_assignments(tag:contact_tags(*))
    `)
    .eq('id', id)
    .single();

  if (error || !contact) return null;

  const tags = contact.tags
    ?.map((t: any) => t.tag)
    .filter(Boolean) || [];

  return { ...contact, tags };
}

export async function generateMetadata({ params }: EditContactPageProps): Promise<Metadata> {
  const { id } = await params;
  const contact = await getContact(id);

  return {
    title: contact ? `${contact.name} bearbeiten | Manyleads.io` : 'Kontakt nicht gefunden',
  };
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/kontakte/${id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kontakt bearbeiten</h1>
          <p className="text-muted-foreground">
            Bearbeite die Informationen von {contact.name}
          </p>
        </div>
      </div>

      <ContactForm contact={contact} mode="edit" />
    </div>
  );
}
