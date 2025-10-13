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

    console.log("💰 [INCOME API] Fetching income for department:", departmentId, "with status filter:", statusFilter);

    // Determine invoice statuses based on filter
    const invoiceStatuses = statusFilter === 'paid' ? ['PAID'] : ['PAID', 'AUTHORISED'];

    // Create server-side Supabase client
    const supabase = await createClient();

    if (!supabase) {
      console.log("❌ [INCOME API] Failed to create Supabase client");
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
      console.log("🚫 [INCOME API] Authentication error");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("✅ [INCOME API] Authenticated user:", user.id);

    // Fetch department info
    const { data: department, error: deptError } = await supabase
      .from("departments")
      .select("id, name, status")
      .eq("id", departmentId)
      .single();

    if (deptError || !department) {
      console.log("❌ [INCOME API] Department not found");
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    console.log("✅ [INCOME API] Department found:", department.name);

    // Fetch income invoice line items (ACCREC type only)
    const { data: incomeLineItems, error: lineItemsError } = await supabase
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
      .in("invoices.status", invoiceStatuses)
      .eq("invoices.type", "ACCREC"); // Only income invoices

    if (lineItemsError) {
      console.log("⚠️ [INCOME API] Income line items query failed:", lineItemsError);
      return NextResponse.json(
        { error: `Failed to fetch income data: ${lineItemsError.message}` },
        { status: 400 }
      );
    }

    console.log("✅ [INCOME API] Income line items found:", incomeLineItems?.length || 0);

    // Aggregate line items by invoice
    const invoicesMap = new Map<string, any>();

    incomeLineItems?.forEach((item: any) => {
      const invoice = item.invoices;
      const xeroId = invoice.xero_invoice_id;

      if (!invoicesMap.has(xeroId)) {
        invoicesMap.set(xeroId, {
          xero_invoice_id: xeroId,
          contact_name: invoice.contact_name,
          invoice_date: invoice.invoice_date,
          reference: invoice.reference,
          status: invoice.status,
          total_amount: parseFloat(item.line_amount) || 0,
        });
      } else {
        // Aggregate line amounts for same invoice
        const existing = invoicesMap.get(xeroId);
        existing.total_amount += parseFloat(item.line_amount) || 0;
      }
    });

    // Convert to array and sort by date (newest first)
    const invoices = Array.from(invoicesMap.values()).sort((a, b) =>
      new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
    );

    // Calculate summary
    const totalIncome = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const invoiceCount = invoices.length;

    const summary = {
      total_income: totalIncome,
      invoice_count: invoiceCount,
      department_name: department.name,
    };

    console.log("🎉 [INCOME API] Success! Returning", invoiceCount, "income invoices");

    return NextResponse.json({
      department,
      invoices,
      summary,
    });
  } catch (error: any) {
    console.error("💥 [INCOME API] Unexpected error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
