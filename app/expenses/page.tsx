// Server Component - Fetches data directly from Supabase
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExpensesClient from "./expenses-client";

interface DepartmentExpense {
    department_name: string;
    department_id: string;
    department_status: string;
    total_invoices: number;
    income_received: number;
    expenses_spent: number;
    net_profit: number;
    latest_activity: string | null;
    income_invoices: number;
    expense_invoices: number;
    stages: {
        stage_name: string;
        stage_id: string;
        line_items_count: number;
        stage_total_spent: number;
        budgeted_amount: number;
        avg_line_amount: number;
        latest_stage_activity: string;
    }[];
}

async function fetchExpensesSummary(userId: string, statusFilter: string = 'paid_authorized'): Promise<DepartmentExpense[]> {
    const supabase = await createClient();

    console.log("🔵 [SERVER] Fetching centralized expenses summary with status filter:", statusFilter);

    // Determine invoice statuses based on filter
    const invoiceStatuses = statusFilter === 'paid' ? ['PAID'] : ['PAID', 'AUTHORISED'];

    // Fetch budget data for all stages
    const { data: budgetData, error: budgetError } = await supabase
        .from("budget_summary_stage")
        .select("department_id, stage_id, budgeted_amount");

    if (budgetError) {
        console.error("❌ [SERVER] Error fetching budget data:", budgetError);
    }

    // Create budget lookup map: key = "deptId:stageId", value = budgeted_amount
    const budgetMap = new Map<string, number>();
    budgetData?.forEach((budget: any) => {
        const key = `${budget.department_id}:${budget.stage_id}`;
        budgetMap.set(key, parseFloat(budget.budgeted_amount) || 0);
    });

    console.log(`✅ [SERVER] Found ${budgetData?.length || 0} budget entries`);

    // If using default filter, use materialized view for performance
    if (statusFilter === 'paid_authorized') {
        const { data: departmentSummaries, error: summaryError} = await supabase
            .from("department_expense_summary")
            .select("*")
            .order("department_name");

        if (summaryError) {
            console.error("❌ [SERVER] Error fetching department summary:", summaryError);
            return [];
        }

        console.log(`✅ [SERVER] Found ${departmentSummaries?.length || 0} departments from materialized view`);

        // Fetch stage breakdown
        const { data: stageLineItems, error: stageError } = await supabase
            .from("invoice_line_items")
            .select(`
                id,
                department_id,
                stage_id,
                line_amount,
                stages (
                    id,
                    name
                ),
                invoices!inner (
                    type,
                    status,
                    invoice_date
                )
            `)
            .in("invoices.status", invoiceStatuses)
            .eq("invoices.type", "ACCPAY")
            .not("department_id", "is", null)
            .not("stage_id", "is", null);

        if (stageError) {
            console.error("❌ [SERVER] Error fetching stage data:", stageError);
        }

        console.log(`✅ [SERVER] Found ${stageLineItems?.length || 0} stage line items`);

        // Process stages by department
        const stageMap = new Map<string, Map<string, any>>();

        stageLineItems?.forEach((item: any) => {
            const deptId = item.department_id;
            const stage = item.stages;

            if (!deptId || !stage) return;

            if (!stageMap.has(deptId)) {
                stageMap.set(deptId, new Map());
            }

            const deptStages = stageMap.get(deptId)!;
            const stageId = stage.id;

            if (!deptStages.has(stageId)) {
                deptStages.set(stageId, {
                    stage_name: stage.name,
                    stage_id: stageId,
                    line_items_count: 0,
                    stage_total_spent: 0,
                    latest_stage_activity: null,
                });
            }

            const stageData = deptStages.get(stageId);
            stageData.line_items_count += 1;
            stageData.stage_total_spent += parseFloat(item.line_amount) || 0;

            if (item.invoices?.invoice_date) {
                if (
                    !stageData.latest_stage_activity ||
                    item.invoices.invoice_date > stageData.latest_stage_activity
                ) {
                    stageData.latest_stage_activity = item.invoices.invoice_date;
                }
            }
        });

        // Combine summary data with stages
        const result: DepartmentExpense[] = (departmentSummaries || []).map((summary: any) => {
            const stages = stageMap.get(summary.department_id);

            return {
                department_name: summary.department_name,
                department_id: summary.department_id,
                department_status: summary.department_status,
                total_invoices: summary.total_invoices || 0,
                income_received: parseFloat(summary.income_received) || 0,
                expenses_spent: parseFloat(summary.expenses_spent) || 0,
                net_profit: parseFloat(summary.net_profit) || 0,
                latest_activity: summary.latest_activity,
                income_invoices: summary.income_invoices || 0,
                expense_invoices: summary.expense_invoices || 0,
                stages: stages
                    ? Array.from(stages.values()).map((stage) => {
                        const budgetKey = `${summary.department_id}:${stage.stage_id}`;
                        return {
                            ...stage,
                            budgeted_amount: budgetMap.get(budgetKey) || 0,
                            avg_line_amount: stage.line_items_count > 0
                                ? stage.stage_total_spent / stage.line_items_count
                                : 0,
                        };
                    })
                    : [],
            };
        });

        console.log("✅ [SERVER] Processed expenses summary from materialized view:", {
            departments: result.length,
            totalIncome: result.reduce((sum, d) => sum + d.income_received, 0),
            totalExpenses: result.reduce((sum, d) => sum + d.expenses_spent, 0),
        });

        return result;
    }

    // For PAID-only filter, query directly
    console.log("🔵 [SERVER] Using direct query for PAID-only filter");

    // Fetch departments
    const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select("id, name, status")
        .order("name");

    if (deptError) {
        console.error("❌ [SERVER] Error fetching departments:", deptError);
        return [];
    }

    console.log(`✅ [SERVER] Found ${departments?.length || 0} departments`);

    // Fetch ALL line items with invoice data for PAID status only
    const { data: lineItems, error: lineError } = await supabase
        .from("invoice_line_items")
        .select(`
            id,
            department_id,
            stage_id,
            line_amount,
            created_at,
            invoices!inner (
                id,
                type,
                status,
                invoice_date
            ),
            stages (
                id,
                name
            )
        `)
        .eq("invoices.status", "PAID")
        .not("department_id", "is", null);

    if (lineError) {
        console.error("❌ [SERVER] Error fetching line items:", lineError);
    }

    console.log(`✅ [SERVER] Found ${lineItems?.length || 0} line items (PAID only)`);

    // Process data: Group by department
    const departmentMap = new Map<string, DepartmentExpense>();

    // Initialize all departments
    departments?.forEach((dept) => {
        departmentMap.set(dept.id, {
            department_name: dept.name,
            department_id: dept.id,
            department_status: dept.status,
            total_invoices: 0,
            income_received: 0,
            expenses_spent: 0,
            net_profit: 0,
            latest_activity: null,
            income_invoices: 0,
            expense_invoices: 0,
            stages: [],
        });
    });

    // Track unique invoices per department
    const departmentInvoices = new Map<string, { income: Set<string>; expense: Set<string> }>();

    // Process line items
    lineItems?.forEach((item: any) => {
        const deptId = item.department_id;
        if (!deptId) return;

        const dept = departmentMap.get(deptId);
        if (!dept) return;

        const invoice = item.invoices;
        if (!invoice) return;

        // Initialize invoice tracking for this department
        if (!departmentInvoices.has(deptId)) {
            departmentInvoices.set(deptId, { income: new Set(), expense: new Set() });
        }
        const invoiceTracking = departmentInvoices.get(deptId)!;

        const lineAmount = parseFloat(item.line_amount) || 0;

        // Calculate income and expenses based on invoice type
        if (invoice.type === "ACCREC") {
            dept.income_received += lineAmount;
            invoiceTracking.income.add(invoice.id);
        } else if (invoice.type === "ACCPAY") {
            dept.expenses_spent += lineAmount;
            invoiceTracking.expense.add(invoice.id);
        }

        // Track latest activity
        if (invoice.invoice_date) {
            if (!dept.latest_activity || invoice.invoice_date > dept.latest_activity) {
                dept.latest_activity = invoice.invoice_date;
            }
        }
    });

    // Update invoice counts and calculate net profit
    departmentInvoices.forEach((tracking, deptId) => {
        const dept = departmentMap.get(deptId);
        if (dept) {
            dept.income_invoices = tracking.income.size;
            dept.expense_invoices = tracking.expense.size;
            dept.total_invoices = dept.income_invoices + dept.expense_invoices;
            dept.net_profit = dept.income_received - dept.expenses_spent;
        }
    });

    // Process stages for each department
    const stageMap = new Map<string, Map<string, any>>();

    lineItems?.forEach((item: any) => {
        const deptId = item.department_id;
        const stage = item.stages;

        if (!deptId || !stage || !item.invoices) return;

        // Only process ACCPAY for stage expenses
        if (item.invoices.type !== "ACCPAY") return;

        if (!stageMap.has(deptId)) {
            stageMap.set(deptId, new Map());
        }

        const deptStages = stageMap.get(deptId)!;
        const stageId = stage.id;

        if (!deptStages.has(stageId)) {
            deptStages.set(stageId, {
                stage_name: stage.name,
                stage_id: stageId,
                line_items_count: 0,
                stage_total_spent: 0,
                latest_stage_activity: null,
            });
        }

        const stageData = deptStages.get(stageId);
        stageData.line_items_count += 1;
        stageData.stage_total_spent += parseFloat(item.line_amount) || 0;

        if (item.invoices.invoice_date) {
            if (
                !stageData.latest_stage_activity ||
                item.invoices.invoice_date > stageData.latest_stage_activity
            ) {
                stageData.latest_stage_activity = item.invoices.invoice_date;
            }
        }
    });

    // Add stages to departments
    stageMap.forEach((stages, deptId) => {
        const dept = departmentMap.get(deptId);
        if (dept) {
            dept.stages = Array.from(stages.values()).map((stage) => {
                const budgetKey = `${deptId}:${stage.stage_id}`;
                return {
                    ...stage,
                    budgeted_amount: budgetMap.get(budgetKey) || 0,
                    avg_line_amount: stage.line_items_count > 0
                        ? stage.stage_total_spent / stage.line_items_count
                        : 0,
                };
            });
        }
    });

    const result = Array.from(departmentMap.values()).sort((a, b) =>
        a.department_name.localeCompare(b.department_name)
    );

    console.log("✅ [SERVER] Processed expenses summary (PAID only):", {
        departments: result.length,
        totalIncome: result.reduce((sum, d) => sum + d.income_received, 0),
        totalExpenses: result.reduce((sum, d) => sum + d.expenses_spent, 0),
    });

    return result;
}

export default async function ExpensesPage({
    searchParams,
}: {
    searchParams: { status?: string };
}) {
    const supabase = await createClient();

    // Get authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth/login");
    }

    // Get status filter from searchParams
    const statusFilter = searchParams.status || 'paid_authorized';

    // Fetch expenses data server-side
    const departments = await fetchExpensesSummary(user.id, statusFilter);

    // Calculate overall totals
    const totalIncome = departments.reduce((sum, d) => sum + d.income_received, 0);
    const totalExpenses = departments.reduce((sum, d) => sum + d.expenses_spent, 0);
    const netTotal = totalIncome - totalExpenses;

    const overallStats = {
        totalIncome,
        totalExpenses,
        netTotal,
        totalDepartments: departments.length,
        totalInvoices: departments.reduce((sum, d) => sum + d.total_invoices, 0),
    };

    // Pass data to client component
    return <ExpensesClient departments={departments} overallStats={overallStats} />;
}








