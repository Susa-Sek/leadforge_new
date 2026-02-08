import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/crm/contact-form';

export const metadata: Metadata = {
  title: 'Neuer Kontakt | Manyleads.io',
  description: 'Erstelle einen neuen Kontakt',
};

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/kontakte">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuer Kontakt</h1>
          <p className="text-muted-foreground">
            Erstelle einen neuen Kontakt mit allen relevanten Informationen
          </p>
        </div>
      </div>

      <ContactForm mode="create" />
    </div>
  );
}
