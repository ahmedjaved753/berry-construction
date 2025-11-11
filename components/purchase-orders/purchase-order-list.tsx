"use client";

import { ExternalLink, Package, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PurchaseOrder } from "@/lib/types/purchase-orders";

interface PurchaseOrderWithCount extends PurchaseOrder {
  line_items_count: number;
  departments?: {
    id: string;
    name: string;
  } | null;
  stages?: {
    id: string;
    name: string;
  } | null;
}

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrderWithCount[];
}

export function PurchaseOrderList({ purchaseOrders }: PurchaseOrderListProps) {
  const formatCurrency = (amount: number, currencyCode: string = "GBP") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const getXeroLink = (xeroPOId: string) => {
    return `https://go.xero.com/organisationlogin/default.aspx?shortcode=/PurchaseOrders/View/${xeroPOId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "AUTHORISED":
        return "bg-green-100 text-green-800 border-green-300";
      case "BILLED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "DELETED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (purchaseOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Purchase Orders Found
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No purchase orders match your current filter. Try selecting a different
          status or check back after syncing with Xero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchaseOrders.map((po) => (
        <div
          key={po.id}
          className="bg-card border border-border rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">
                  PO #{po.po_number || po.xero_po_id.substring(0, 8)}
                </h3>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(po.status)} text-xs`}
                >
                  {po.status}
                </Badge>
                {po.has_attachments && (
                  <FileText className="h-4 w-4 text-blue-600" />
                )}
              </div>

              <p className="text-sm font-medium text-foreground mb-1">
                {po.contact_name || "Unknown Contact"}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Date: {formatDate(po.date)}</span>
                </div>
                {po.delivery_date && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>Delivery: {formatDate(po.delivery_date)}</span>
                  </div>
                )}
                {po.reference && (
                  <span className="text-muted-foreground">
                    Ref: {po.reference}
                  </span>
                )}
                <span>
                  {po.line_items_count}{" "}
                  {po.line_items_count === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Department and Stage */}
              {(po.departments || po.stages) && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {po.departments && (
                    <Badge variant="secondary" className="text-xs">
                      {po.departments.name}
                    </Badge>
                  )}
                  {po.stages && (
                    <Badge variant="outline" className="text-xs">
                      {po.stages.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Amount and link */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(po.total, po.currency_code)}
                </p>
                {po.sub_total && po.total_tax && (
                  <p className="text-xs text-muted-foreground">
                    Subtotal: {formatCurrency(po.sub_total, po.currency_code)} +{" "}
                    {formatCurrency(po.total_tax, po.currency_code)} tax
                  </p>
                )}
              </div>

              <a
                href={getXeroLink(po.xero_po_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>View in Xero</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
