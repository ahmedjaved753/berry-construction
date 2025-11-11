"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import { PurchaseOrderList } from "./purchase-order-list";
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

interface PurchaseOrdersClientProps {
  initialPurchaseOrders: PurchaseOrderWithCount[];
  initialStatus: string;
}

export function PurchaseOrdersClient({
  initialPurchaseOrders,
  initialStatus,
}: PurchaseOrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(initialStatus);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    const params = new URLSearchParams(searchParams);
    params.set("status", value);
    router.push(`/purchase-orders?${params.toString()}`);
  };

  // Calculate statistics
  const stats = {
    total: initialPurchaseOrders.length,
    totalAmount: initialPurchaseOrders.reduce((sum, po) => sum + po.total, 0),
    draft: initialPurchaseOrders.filter((po) => po.status === "DRAFT").length,
    submitted: initialPurchaseOrders.filter((po) => po.status === "SUBMITTED")
      .length,
    authorised: initialPurchaseOrders.filter((po) => po.status === "AUTHORISED")
      .length,
    billed: initialPurchaseOrders.filter((po) => po.status === "BILLED").length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarToggle isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all purchase orders from Xero
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.total} {stats.total === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Draft</p>
          <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Submitted</p>
          <p className="text-2xl font-bold text-foreground">{stats.submitted}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Authorised</p>
          <p className="text-2xl font-bold text-foreground">{stats.authorised}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Billed</p>
          <p className="text-2xl font-bold text-foreground">{stats.billed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-foreground"
          >
            Status:
          </label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="AUTHORISED">Authorised</SelectItem>
              <SelectItem value="BILLED">Billed</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

          {/* Purchase orders list */}
          <PurchaseOrderList purchaseOrders={initialPurchaseOrders} />
        </div>
      </div>
    </>
  );
}
