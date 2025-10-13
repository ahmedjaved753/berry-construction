import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { departmentId: string } }
) {
  try {
    const { departmentId } = params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'paid_authorized';

    console.log("🚨 [UNASSIGNED BILLS API] Fetching unassigned bills for department:", departmentId, "with status filter:", statusFilter);

    // Determine invoice statuses based on filter
    const invoiceStatuses = statusFilter === 'paid' ? ['PAID'] : ['PAID', 'AUTHORISED'];

    // Create server-side Supabase client
    const supabase = await createClient();

    if (!supabase) {
      console.log("❌ [UNASSIGNED BILLS API] Failed to create Supabase client");
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("🚫 [UNASSIGNED BILLS API] Authentication error");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("✅ [UNASSIGNED BILLS API] Authenticated user:", user.id);

    // Fetch department info
    const { data: department, error: deptError } = await supabase
      .from("departments")
      .select("id, name, status")
      .eq("id", departmentId)
      .single();

    if (deptError || !department) {
      console.log("❌ [UNASSIGNED BILLS API] Department not found");
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    console.log("✅ [UNASSIGNED BILLS API] Department found:", department.name);

    // Fetch unassigned bill line items (ACCPAY type, no stage_id)
    const { data: unassignedLineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select(
        `
        line_amount,
        invoices!inner(
          xero_invoice_id,
          contact_name,
          invoice_date,
          type,
          status,
          reference
        )
      `
      )
      .eq("department_id", departmentId)
      .is("stage_id", null)  // Only items without stage assignment
      .in("invoices.status", invoiceStatuses)
      .eq("invoices.type", "ACCPAY"); // Only bills (expenses)

    if (lineItemsError) {
      console.log("⚠️ [UNASSIGNED BILLS API] Unassigned bills query failed:", lineItemsError);
      return NextResponse.json(
        { error: `Failed to fetch unassigned bills: ${lineItemsError.message}` },
        { status: 400 }
      );
    }

    console.log("✅ [UNASSIGNED BILLS API] Unassigned line items found:", unassignedLineItems?.length || 0);

    // Aggregate line items by invoice
    const billsMap = new Map<string, any>();

    unassignedLineItems?.forEach((item: any) => {
      const invoice = item.invoices;
      const xeroId = invoice.xero_invoice_id;

      if (!billsMap.has(xeroId)) {
        billsMap.set(xeroId, {
          xero_invoice_id: xeroId,
          contact_name: invoice.contact_name,
          invoice_date: invoice.invoice_date,
          reference: invoice.reference,
          status: invoice.status,
          total_amount: parseFloat(item.line_amount) || 0,
          line_items_count: 1,
        });
      } else {
        // Aggregate line amounts for same invoice
        const existing = billsMap.get(xeroId);
        existing.total_amount += parseFloat(item.line_amount) || 0;
        existing.line_items_count += 1;
      }
    });

    // Convert to array and sort by date (newest first)
    const unassignedBills = Array.from(billsMap.values()).sort((a, b) =>
      new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
    );

    // Calculate summary
    const totalAmount = unassignedBills.reduce((sum, bill) => sum + bill.total_amount, 0);
    const totalBills = unassignedBills.length;

    const summary = {
      total_bills: totalBills,
      total_amount: totalAmount,
      department_name: department.name,
    };

    console.log("🎉 [UNASSIGNED BILLS API] Success! Returning", totalBills, "unassigned bills");

    return NextResponse.json({
      department,
      unassignedBills,
      summary,
    });
  } catch (error: any) {
    console.error("💥 [UNASSIGNED BILLS API] Unexpected error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
