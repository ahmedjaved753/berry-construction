import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch budget for a specific stage
export async function GET(
  request: NextRequest,
  { params }: { params: { departmentId: string; stageId: string } }
) {
  try {
    const { departmentId, stageId } = params;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch budget from budget_summary_stage table
    const { data: budget, error: budgetError } = await supabase
      .from("budget_summary_stage")
      .select("budgeted_amount, actual_cost, remaining")
      .eq("user_id", user.id)
      .eq("department_id", departmentId)
      .eq("stage_id", stageId)
      .single();

    if (budgetError && budgetError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json(
        { error: `Failed to fetch budget: ${budgetError.message}` },
        { status: 400 }
      );
    }

    // Return null values if no budget exists yet
    return NextResponse.json({
      budgeted_amount: budget?.budgeted_amount || 0,
      actual_cost: budget?.actual_cost || 0,
      remaining: budget?.remaining || 0,
    });
  } catch (error: any) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT: Update/create budget for a specific stage
export async function PUT(
  request: NextRequest,
  { params }: { params: { departmentId: string; stageId: string } }
) {
  try {
    const { departmentId, stageId } = params;
    const body = await request.json();
    const { budgeted_amount } = body;

    if (typeof budgeted_amount !== "number" || budgeted_amount < 0) {
      return NextResponse.json(
        { error: "Invalid budget amount. Must be a non-negative number." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Calculate actual_cost from invoice_line_items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .select(
        `
                line_amount,
                invoices!inner(
                    status,
                    type
                )
            `
      )
      .eq("department_id", departmentId)
      .eq("stage_id", stageId)
      .in("invoices.status", ["PAID", "AUTHORISED"])
      .eq("invoices.type", "ACCPAY"); // Only expenses

    if (lineItemsError) {
      return NextResponse.json(
        { error: `Failed to calculate actual cost: ${lineItemsError.message}` },
        { status: 400 }
      );
    }

    const actual_cost =
      lineItems?.reduce(
        (sum, item) => sum + parseFloat(item.line_amount.toString()),
        0
      ) || 0;

    // Upsert budget_summary_stage
    const { data: budget, error: budgetError } = await supabase
      .from("budget_summary_stage")
      .upsert(
        {
          user_id: user.id,
          department_id: departmentId,
          stage_id: stageId,
          budgeted_amount,
          actual_cost,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id,department_id,stage_id",
        }
      )
      .select()
      .single();

    if (budgetError) {
      return NextResponse.json(
        { error: `Failed to update budget: ${budgetError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      budget: {
        budgeted_amount: budget.budgeted_amount,
        actual_cost: budget.actual_cost,
        remaining: budget.remaining,
      },
    });
  } catch (error: any) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
