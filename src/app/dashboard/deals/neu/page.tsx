'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DealForm } from '@/components/crm/deal-form';

export default function NewDealPage() {
  const searchParams = useSearchParams();
  const stageId = searchParams.get('stage') || undefined;
  const contactId = searchParams.get('contact') || undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/deals">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Neuer Deal</h1>
          <p className="text-muted-foreground">
            Erstelle eine neue Verkaufschance
          </p>
        </div>
      </div>

      <DealForm mode="create" initialStageId={stageId} />
    </div>
  );
}
