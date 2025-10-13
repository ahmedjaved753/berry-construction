"use client";

import { ExternalLink, FileWarning } from "lucide-react";

interface UnassignedBill {
  xero_invoice_id: string;
  contact_name: string;
  invoice_date: string;
  total_amount: number;
  reference: string | null;
  status: string;
  line_items_count: number;
}

interface UnassignedBillsListProps {
  bills: UnassignedBill[];
}

export function UnassignedBillsList({ bills }: UnassignedBillsListProps) {
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
    // Bills use AccountsPayable view
    return `https://go.xero.com/AccountsPayable/View.aspx?InvoiceID=${xeroInvoiceId}`;
  };

  if (bills.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-dashed border-green-300">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 text-lg font-semibold mb-2">
            All Bills Assigned!
          </p>
          <p className="text-green-600 text-sm">
            All bills for this department have been assigned to stages
          </p>
        </div>
      </div>
    );
  }

  const totalAmount = bills.reduce((sum, bill) => sum + bill.total_amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700">Total Unassigned Amount</p>
            <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-amber-700">Bills</p>
            <p className="text-2xl font-bold text-amber-900">{bills.length}</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
        <div className="flex items-start">
          <FileWarning className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800 mb-1">
              Action Required: Assign Bills to Stages
            </h3>
            <p className="text-sm text-amber-700">
              These bills need to be assigned to a construction stage in Xero. Click on any bill to open it in Xero and update the tracking categories.
            </p>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {bills.map((bill) => (
          <a
            key={bill.xero_invoice_id}
            href={getXeroLink(bill.xero_invoice_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 bg-white border border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {bill.contact_name}
                  </h3>
                  <ExternalLink className="h-4 w-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(bill.invoice_date)}
                  </span>
                  {bill.reference && (
                    <span className="flex items-center text-gray-500">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {bill.reference}
                    </span>
                  )}
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                    {bill.status}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {bill.line_items_count} {bill.line_items_count === 1 ? 'line item' : 'line items'}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(bill.total_amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">View in Xero</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Showing {bills.length} {bills.length === 1 ? "bill" : "bills"} •
          Total: <span className="font-semibold text-amber-700">{formatCurrency(totalAmount)}</span>
        </p>
      </div>
    </div>
  );
}
