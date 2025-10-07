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

    console.log("🏗️ [DEPT API] Fetching department:", departmentId, "with status filter:", statusFilter);

    // Determine invoice statuses based on filter
    const invoiceStatuses = statusFilter === 'paid' ? ['PAID'] : ['PAID', 'AUTHORISED'];

    // Get authenticated user and create server-side Supabase client
    console.log("🔧 [DEPT API] Creating server-side Supabase client...");
    const supabase = await createClient();

    if (!supabase) {
      console.log("❌ [DEPT API] Failed to create Supabase client");
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    console.log("✅ [DEPT API] Supabase client created successfully");
    console.log("🔐 [DEPT API] Getting authenticated user...");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("🔐 [DEPT API] Auth result:", {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError?.message || null,
    });

    if (authError) {
      console.log("🚫 [DEPT API] Authentication error:", authError);
      return NextResponse.json(
        { error: `Authentication failed: ${authError.message}` },
        { status: 401 }
      );
    }

    if (!user) {
      console.log("🚫 [DEPT API] No authenticated user found");
      return NextResponse.json(
        { error: "No authenticated user - please log in" },
        { status: 401 }
      );
    }

    console.log("✅ [DEPT API] Authenticated user:", user.id);

    // Fetch department info (centralized model - no user_id filter)
    const { data: department, error: deptError } = await supabase
      .from("departments")
      .select(
        "id, name, status, xero_tracking_option_id, created_at, updated_at"
      )
      .eq("id", departmentId)
      .single();

    if (deptError) {
      console.log("❌ [DEPT API] Department query failed:", deptError);
      return NextResponse.json(
        { error: `Department query failed: ${deptError.message}` },
        { status: 400 }
      );
    }

    if (!department) {
      console.log("❌ [DEPT API] Department not found");
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    console.log("✅ [DEPT API] Department found:", department.name);

    // Fetch line items (filter by status) - centralized model, no user_id filter
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select(
        `
                id,
                description,
                quantity,
                unit_amount,
                line_amount,
                tax_amount,
                created_at,
                stages!left(name),
                invoices!inner(
                    id,
                    type,
                    status,
                    invoice_date,
                    contact_name
                )
            `
      )
      .eq("department_id", departmentId)
      .in("invoices.status", invoiceStatuses) // 🔑 Dynamic filter based on status param
      .order("created_at", { ascending: false });

    if (lineItemsError) {
      console.log("⚠️ [DEPT API] Line items query failed:", lineItemsError);
      // Return department with empty line items instead of failing
    }

    console.log("✅ [DEPT API] Line items found:", lineItems?.length || 0);

    // Process line items
    const processedLineItems = (lineItems || []).map((item: any) => {
      const invoice = item.invoices;
      const stage = item.stages;

      return {
        id: item.id,
        description: item.description || "No description",
        quantity: parseFloat(item.quantity) || 1,
        unit_amount: parseFloat(item.unit_amount) || 0,
        line_amount: parseFloat(item.line_amount) || 0,
        tax_amount: parseFloat(item.tax_amount) || 0,
        stage_name: stage?.name || null,
        invoice_id: invoice?.id || null,
        invoice_type: invoice?.type || "ACCPAY",
        invoice_date:
          invoice?.invoice_date || new Date().toISOString().split("T")[0],
        contact_name: invoice?.contact_name || "Unknown Contact",
        created_at: item.created_at,
      };
    });

    // Calculate summary
    const totalIncome = processedLineItems
      .filter((item) => item.invoice_type === "ACCREC")
      .reduce((sum, item) => sum + item.line_amount, 0);

    const totalExpenses = processedLineItems
      .filter((item) => item.invoice_type === "ACCPAY")
      .reduce((sum, item) => sum + item.line_amount, 0);

    const incomeInvoices = new Set(
      lineItems
        ?.filter((item: any) => item.invoices?.type === "ACCREC")
        .map((item: any) => item.invoices.id) || []
    ).size;

    const expenseInvoices = new Set(
      lineItems
        ?.filter((item: any) => item.invoices?.type === "ACCPAY")
        .map((item: any) => item.invoices.id) || []
    ).size;

    const dates = processedLineItems
      .map((item) => item.invoice_date)
      .filter((date) => date)
      .sort();

    const summary = {
      total_invoices: incomeInvoices + expenseInvoices,
      income_invoices: incomeInvoices,
      expense_invoices: expenseInvoices,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      total_line_items: processedLineItems.length,
      latest_invoice_date: dates[dates.length - 1] || "",
      earliest_invoice_date: dates[0] || "",
    };

    console.log("🎉 [DEPT API] Success! Returning data for:", department.name);

    return NextResponse.json({
      department,
      lineItems: processedLineItems,
      summary,
    });
  } catch (error: any) {
    console.error("💥 [DEPT API] Unexpected error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
