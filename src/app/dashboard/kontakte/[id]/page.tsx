import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Building2, Mail, Phone, MapPin, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { InteractionTimeline } from '@/components/crm/interaction-timeline';
import { ContactNotes } from '@/components/crm/contact-notes';
import { ContactDeals } from '@/components/crm/contact-deals';
import { createClient } from '@/lib/supabase/server';

interface ContactDetailPageProps {
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

  // Transform tags
  const tags = contact.tags
    ?.map((t: any) => t.tag)
    .filter(Boolean) || [];

  return { ...contact, tags };
}

export async function generateMetadata({ params }: ContactDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const contact = await getContact(id);

  return {
    title: contact ? `${contact.name} | Manyleads.io` : 'Kontakt nicht gefunden',
  };
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  const initials = contact.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/kontakte">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{contact.company}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.tags?.map((tag: any) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color, color: '#fff' }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/kontakte/${id}/bearbeiten`}>
          <Button variant="outline">
            Bearbeiten
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Kontaktdaten</TabsTrigger>
          <TabsTrigger value="interactions">Interaktionen</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {contact.phone}
                  </a>
                )}
                {contact.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{contact.address}</span>
                  </div>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {contact.website}
                  </a>
                )}
                {!contact.email && !contact.phone && !contact.address && !contact.website && (
                  <p className="text-sm text-muted-foreground">Keine Kontaktdaten vorhanden</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactNotes contactId={id} initialNotes={contact.notes || ''} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions">
          <InteractionTimeline contactId={id} />
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>Verknüpfte Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactDeals contactId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
