import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PurchaseOrdersClient } from "@/components/purchase-orders/purchase-orders-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get query parameters
  const params = await searchParams;
  const statusFilter = (params.status as string) || "all";

  // Build query - centralized model, all users see same data
  let query = supabase
    .from("purchase_orders")
    .select(
      `
      *,
      departments (
        id,
        name
      ),
      stages (
        id,
        name
      )
    `
    )
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Apply status filter
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: purchaseOrders, error } = await query;

  if (error) {
    console.error("Error fetching purchase orders:", error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-muted-foreground mt-2">
          Failed to load purchase orders. Please try again later.
        </p>
      </div>
    );
  }

  // Get line items counts for each PO
  const poIds = purchaseOrders?.map((po) => po.id) || [];

  let lineItemCounts: Record<string, number> = {};

  if (poIds.length > 0) {
    const { data: lineItems } = await supabase
      .from("purchase_order_line_items")
      .select("purchase_order_id")
      .in("purchase_order_id", poIds);

    // Count line items per PO
    lineItems?.forEach((item) => {
      lineItemCounts[item.purchase_order_id] =
        (lineItemCounts[item.purchase_order_id] || 0) + 1;
    });
  }

  // Add line item counts to each PO
  const enrichedPOs = (purchaseOrders || []).map((po) => ({
    ...po,
    line_items_count: lineItemCounts[po.id] || 0,
  }));

  return (
    <PurchaseOrdersClient
      initialPurchaseOrders={enrichedPOs}
      initialStatus={statusFilter}
    />
  );
}
