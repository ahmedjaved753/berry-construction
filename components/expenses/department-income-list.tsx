"use client";

import { ExternalLink } from "lucide-react";

interface IncomeInvoice {
  xero_invoice_id: string;
  contact_name: string;
  invoice_date: string;
  total_amount: number;
  reference: string | null;
  status: string;
}

interface DepartmentIncomeListProps {
  invoices: IncomeInvoice[];
}

export function DepartmentIncomeList({ invoices }: DepartmentIncomeListProps) {
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
    // Income invoices use AccountsReceivable (not AccountsPayable)
    return `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${xeroInvoiceId}`;
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-secondary rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-muted-foreground text-lg">No income invoices found for this department</p>
      </div>
    );
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Total Income</p>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-700">Invoices</p>
            <p className="text-2xl font-bold text-emerald-900">{invoices.length}</p>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <a
            key={invoice.xero_invoice_id}
            href={getXeroLink(invoice.xero_invoice_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 bg-card border border-border rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-base truncate">
                    {invoice.contact_name}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(invoice.invoice_date)}
                  </span>
                  {invoice.reference && (
                    <span className="flex items-center text-muted-foreground">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {invoice.reference}
                    </span>
                  )}
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                    {invoice.status}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(invoice.total_amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">View in Xero</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          Showing {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} •
          Total: <span className="font-semibold text-emerald-700">{formatCurrency(totalAmount)}</span>
        </p>
      </div>
    </div>
  );
}
