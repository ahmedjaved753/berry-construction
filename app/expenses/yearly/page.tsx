// Server Component - Fetches yearly financial snapshot
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import YearlyClient from "./yearly-client";

interface YearlyLineItem {
    id: string;
    description: string;
    quantity: number;
    unit_amount: number;
    line_amount: number;
    tax_amount: number;
    department: { id: string; name: string } | null;
    stage: { id: string; name: string } | null;
}

interface YearlyInvoice {
    id: string;
    xero_invoice_id: string;
    type: "ACCREC" | "ACCPAY";
    status: string;
    reference: string | null;
    contact_name: string;
    total: number;
    sub_total: number;
    total_tax: number;
    invoice_date: string;
    line_items: YearlyLineItem[];
}

interface YearlySnapshot {
    year: number;
    summary: {
        total_income: number;
        total_expenses: number;
        net_total: number;
        invoice_count: number;
        line_item_count: number;
        income_invoice_count: number;
        expense_invoice_count: number;
    };
    invoices: YearlyInvoice[];
}

async function fetchYearlySnapshot(
    userId: string,
    year: number,
    statusFilter: string = "paid_authorized"
): Promise<YearlySnapshot> {
    const supabase = await createClient();

    console.log("🔵 [YEARLY] Fetching snapshot for:", {
        userId,
        year,
        status: statusFilter,
    });

    // Determine invoice statuses based on filter
    const invoiceStatuses =
        statusFilter === "paid" ? ["PAID"] : ["PAID", "AUTHORISED"];

    // Calculate year start and end dates
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;

    // 1. Query invoices for specific year
    const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select(
            `
            id,
            xero_invoice_id,
            type,
            status,
            reference,
            contact_name,
            total,
            sub_total,
            total_tax,
            invoice_date
        `
        )
        .gte("invoice_date", yearStart)
        .lt("invoice_date", yearEnd)
        .in("status", invoiceStatuses)
        .order("invoice_date", { ascending: true })
        .order("type", { ascending: false }) // ACCREC first, then ACCPAY
        .order("contact_name");

    if (invoicesError) {
        console.error("❌ [YEARLY] Error fetching invoices:", invoicesError);
        return {
            year,
            summary: {
                total_income: 0,
                total_expenses: 0,
                net_total: 0,
                invoice_count: 0,
                line_item_count: 0,
                income_invoice_count: 0,
                expense_invoice_count: 0,
            },
            invoices: [],
        };
    }

    console.log(`✅ [YEARLY] Found ${invoices?.length || 0} invoices`);

    if (!invoices || invoices.length === 0) {
        return {
            year,
            summary: {
                total_income: 0,
                total_expenses: 0,
                net_total: 0,
                invoice_count: 0,
                line_item_count: 0,
                income_invoice_count: 0,
                expense_invoice_count: 0,
            },
            invoices: [],
        };
    }

    // 2. Fetch all line items for these invoices
    const invoiceIds = invoices.map((inv) => inv.id);

    const { data: lineItems, error: lineItemsError } = await supabase
        .from("invoice_line_items")
        .select(
            `
            id,
            invoice_id,
            description,
            quantity,
            unit_amount,
            line_amount,
            tax_amount,
            departments(id, name),
            stages(id, name)
        `
        )
        .in("invoice_id", invoiceIds);

    if (lineItemsError) {
        console.error("❌ [YEARLY] Error fetching line items:", lineItemsError);
    }

    console.log(`✅ [YEARLY] Found ${lineItems?.length || 0} line items`);

    // 3. Group line items by invoice
    const lineItemsByInvoice = new Map<string, any[]>();
    lineItems?.forEach((item: any) => {
        if (!lineItemsByInvoice.has(item.invoice_id)) {
            lineItemsByInvoice.set(item.invoice_id, []);
        }
        lineItemsByInvoice.get(item.invoice_id)!.push({
            id: item.id,
            description: item.description || "No description",
            quantity: parseFloat(item.quantity) || 1,
            unit_amount: parseFloat(item.unit_amount) || 0,
            line_amount: parseFloat(item.line_amount) || 0,
            tax_amount: parseFloat(item.tax_amount) || 0,
            department: item.departments,
            stage: item.stages,
        });
    });

    // 4. Build final invoice list with line items
    const processedInvoices: YearlyInvoice[] = invoices.map((invoice: any) => ({
        id: invoice.id,
        xero_invoice_id: invoice.xero_invoice_id,
        type: invoice.type,
        status: invoice.status,
        reference: invoice.reference,
        contact_name: invoice.contact_name || "Unknown Contact",
        total: parseFloat(invoice.total) || 0,
        sub_total: parseFloat(invoice.sub_total) || 0,
        total_tax: parseFloat(invoice.total_tax) || 0,
        invoice_date: invoice.invoice_date,
        line_items: lineItemsByInvoice.get(invoice.id) || [],
    }));

    // 5. Calculate summary
    const incomeInvoices = processedInvoices.filter(
        (inv) => inv.type === "ACCREC"
    );
    const expenseInvoices = processedInvoices.filter(
        (inv) => inv.type === "ACCPAY"
    );

    const totalIncome = incomeInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = expenseInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const summary = {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_total: totalIncome - totalExpenses,
        invoice_count: processedInvoices.length,
        line_item_count: lineItems?.length || 0,
        income_invoice_count: incomeInvoices.length,
        expense_invoice_count: expenseInvoices.length,
    };

    console.log("✅ [YEARLY] Summary:", summary);

    return {
        year,
        summary,
        invoices: processedInvoices,
    };
}

export default async function YearlySnapshotPage({
    searchParams,
}: {
    searchParams: { year?: string; status?: string };
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

    // Get year from searchParams or default to current year
    const now = new Date();
    const selectedYear = searchParams.year
        ? parseInt(searchParams.year)
        : now.getFullYear();
    const statusFilter = searchParams.status || "paid_authorized";

    // Fetch yearly snapshot
    const snapshot = await fetchYearlySnapshot(
        user.id,
        selectedYear,
        statusFilter
    );

    return <YearlyClient snapshot={snapshot} />;
}
