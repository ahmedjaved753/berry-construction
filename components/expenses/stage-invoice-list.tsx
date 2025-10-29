"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface StageInvoice {
  xero_invoice_id: string;
  contact_name: string;
  invoice_date: string;
  line_amount: number;
  reference: string | null;
}

interface StageInvoiceListProps {
  invoices: StageInvoice[];
  isExpanded: boolean;
  maxInitialItems?: number;
}

export function StageInvoiceList({
  invoices,
  isExpanded,
  maxInitialItems = 5,
}: StageInvoiceListProps) {
  const [showAll, setShowAll] = useState(false);

  if (!isExpanded || invoices.length === 0) {
    return null;
  }

  const displayedInvoices = showAll
    ? invoices
    : invoices.slice(0, maxInitialItems);
  const hasMore = invoices.length > maxInitialItems;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const getXeroLink = (xeroInvoiceId: string) => {
    return `https://go.xero.com/AccountsPayable/View.aspx?InvoiceID=${xeroInvoiceId}`;
  };

  return (
    <div className="mt-3 pt-3 border-t border-border animate-in slide-in-from-top-2 duration-300">
      <div className="space-y-2">
        {displayedInvoices.map((invoice) => (
          <a
            key={invoice.xero_invoice_id}
            href={getXeroLink(invoice.xero_invoice_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-foreground text-sm truncate">
                  {invoice.contact_name}
                </p>
                <ExternalLink className="h-3 w-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(invoice.invoice_date)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-foreground text-sm">
                {formatCurrency(invoice.line_amount)}
              </p>
            </div>
          </a>
        ))}
      </div>

      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(true);
          }}
          className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Show all {invoices.length} invoices
        </Button>
      )}

      {hasMore && showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowAll(false);
          }}
          className="w-full mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          Show less
        </Button>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} •{" "}
          Total: {formatCurrency(invoices.reduce((sum, inv) => sum + inv.line_amount, 0))}
        </p>
      </div>
    </div>
  );
}
