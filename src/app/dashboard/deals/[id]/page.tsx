import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Building2, Euro, Percent, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { createClient } from '@/lib/supabase/server';

interface DealDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getDeal(id: string) {
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      *,
      stage:deal_stages(*),
      contact:contacts(*)
    `)
    .eq('id', id)
    .single();

  if (error || !deal) return null;

  return deal;
}

export async function generateMetadata({ params }: DealDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);

  return {
    title: deal ? `${deal.title} | Manyleads.io` : 'Deal nicht gefunden',
  };
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;
  const deal = await getDeal(id);

  if (!deal) {
    notFound();
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageColor = deal.stage?.color || '#6B7280';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/deals">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{deal.title}</h1>
              <Badge
                style={{
                  backgroundColor: stageColor,
                  color: '#fff',
                }}
              >
                {deal.stage?.name || 'Unbekannt'}
              </Badge>
            </div>
            {deal.contact && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <Link
                  href={`/dashboard/kontakte/${deal.contact.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {deal.contact.company}
                </Link>
              </div>
            )}
          </div>
        </div>
        <Link href={`/dashboard/deals/${id}/bearbeiten`}>
          <Button variant="outline">Bearbeiten</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Euro className="h-4 w-4" />
                    Deal-Wert
                  </div>
                  <p className="text-2xl font-semibold">{formatCurrency(deal.value)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    Wahrscheinlichkeit
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{deal.probability || 0}%</span>
                    </div>
                    <Progress value={deal.probability || 0} className="h-2" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Erwartetes Closing
                  </div>
                  <p className="font-medium">
                    {deal.expected_close_date
                      ? format(new Date(deal.expected_close_date), 'dd. MMMM yyyy', { locale: de })
                      : '-'}
                  </p>
                </div>

                {deal.actual_close_date && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Tatsächliches Closing
                    </div>
                    <p className="font-medium">
                      {format(new Date(deal.actual_close_date), 'dd. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                )}
              </div>

              {deal.is_won !== null && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ergebnis</p>
                    <Badge
                      variant={deal.is_won ? 'default' : 'secondary'}
                      className={`text-lg px-3 py-1 ${
                        deal.is_won ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {deal.is_won ? 'Gewonnen' : 'Verloren'}
                    </Badge>
                    {deal.close_reason && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Grund: {deal.close_reason}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {deal.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{deal.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontakt</CardTitle>
            </CardHeader>
            <CardContent>
              {deal.contact ? (
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/kontakte/${deal.contact.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{deal.contact.name}</p>
                      <p className="text-sm text-muted-foreground">{deal.contact.company}</p>
                    </div>
                  </Link>
                  {deal.contact.email && (
                    <a
                      href={`mailto:${deal.contact.email}`}
                      className="text-sm text-primary hover:underline block"
                    >
                      {deal.contact.email}
                    </a>
                  )}
                  {deal.contact.phone && (
                    <a
                      href={`tel:${deal.contact.phone}`}
                      className="text-sm text-primary hover:underline block"
                    >
                      {deal.contact.phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Kein Kontakt verknüpft</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Erstellt</span>
                <span>
                  {format(new Date(deal.created_at), 'dd.MM.yyyy', { locale: de })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zuletzt geändert</span>
                <span>
                  {format(new Date(deal.updated_at), 'dd.MM.yyyy', { locale: de })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
