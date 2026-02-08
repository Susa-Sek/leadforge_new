"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  FileX,
  Calendar,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: InvoiceStatus;
  description?: string;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  invoiceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  itemsPerPage?: number;
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: any }> = {
  draft: { label: "Entwurf", variant: "secondary" },
  open: { label: "Ausstehend", variant: "outline" },
  paid: { label: "Bezahlt", variant: "default" },
  uncollectible: { label: "Uneinbringlich", variant: "destructive" },
  void: { label: "Storniert", variant: "secondary" },
};

export function InvoiceList({ invoices, isLoading, itemsPerPage = 10 }: InvoiceListProps) {
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter invoices
  const filteredInvoices = filter === "all"
    ? invoices
    : invoices.filter((inv) => inv.status === filter);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const handleDownload = (invoice: Invoice) => {
    const url = invoice.invoicePdf || invoice.hostedInvoiceUrl;
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Rechnungsverlauf
        </CardTitle>
        <Select value={filter} onValueChange={(v) => { setFilter(v as InvoiceStatus | "all"); setCurrentPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="paid">Bezahlt</SelectItem>
            <SelectItem value="open">Ausstehend</SelectItem>
            <SelectItem value="draft">Entwurf</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Rechnungen</h3>
            <p className="text-muted-foreground text-sm">
              Upgrade für einen Rechnungsverlauf mit PDF-Download.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(invoice.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {invoice.description || `${invoice.invoiceNumber || "Rechnung"}`}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(invoice.amountPaid, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[invoice.status].variant}>
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(invoice.invoicePdf || invoice.hostedInvoiceUrl) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(invoice)}
                            title="PDF herunterladen"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Zeige {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredInvoices.length)} von{" "}
                  {filteredInvoices.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(cents: number, currency: string = "eur"): string {
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
