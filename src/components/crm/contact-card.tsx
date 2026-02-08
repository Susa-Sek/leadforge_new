'use client';

import { Mail, Phone, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import type { Contact } from '@/lib/crm/types';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/kontakte/${contact.id}`}
              className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
            >
              {contact.name}
            </Link>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <Building2 className="h-3 w-3" />
              <span className="line-clamp-1">{contact.company}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3" />
              <span className="line-clamp-1">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span className="line-clamp-1">{contact.phone}</span>
            </a>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {contact.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: tag.color,
                  color: '#fff',
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {contact.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{contact.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
