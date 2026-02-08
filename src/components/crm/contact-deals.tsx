'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DealList } from './deal-list';

interface ContactDealsProps {
  contactId: string;
}

export function ContactDeals({ contactId }: ContactDealsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/dashboard/deals/neu?contact=${contactId}`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Deal erstellen
          </Button>
        </Link>
      </div>
      <DealList filters={{ contact_id: contactId }} />
    </div>
  );
}
