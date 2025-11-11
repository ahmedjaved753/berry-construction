import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Purchase Orders API Endpoint
 *
 * GET /api/purchase-orders
 * Query params:
 * - status: Filter by status (DRAFT, SUBMITTED, AUTHORISED, BILLED, DELETED, or "all")
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status") || "all";

    // Build query
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
      .eq("user_id", user.id)
      .order("date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    // Apply status filter
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: purchaseOrders, error } = await query;

    if (error) {
      console.error("Error fetching purchase orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch purchase orders" },
        { status: 500 }
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
    const enrichedPOs = purchaseOrders?.map((po) => ({
      ...po,
      line_items_count: lineItemCounts[po.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedPOs || [],
      count: enrichedPOs?.length || 0,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
