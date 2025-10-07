"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import {
    Calendar as CalendarIcon,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Receipt,
    FileText,
    ChevronDown,
    Building2,
    Package,
} from "lucide-react";
import { format } from "date-fns";

interface DailyLineItem {
    id: string;
    description: string;
    quantity: number;
    unit_amount: number;
    line_amount: number;
    tax_amount: number;
    department: { id: string; name: string } | null;
    stage: { id: string; name: string } | null;
}

interface DailyInvoice {
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
    line_items: DailyLineItem[];
}

interface DailySnapshot {
    date: string;
    summary: {
        total_income: number;
        total_expenses: number;
        net_total: number;
        invoice_count: number;
        line_item_count: number;
        income_invoice_count: number;
        expense_invoice_count: number;
    };
    invoices: DailyInvoice[];
}

interface DailyClientProps {
    snapshot: DailySnapshot;
}

export default function DailyClient({ snapshot }: DailyClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [date, setDate] = useState<Date>(new Date(snapshot.date));
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const statusFilter = searchParams.get("status") || "paid_authorized";

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Debug logging
    console.log("📅 [DAILY CLIENT] Component rendered:", {
        snapshotDate: snapshot.date,
        currentDate: date,
        calendarOpen,
        statusFilter,
        invoiceCount: snapshot.invoices.length,
    });

    // Track calendar open state changes
    useEffect(() => {
        console.log("⚡ [EFFECT] Calendar open state changed to:", calendarOpen);
    }, [calendarOpen]);

    // Track date changes
    useEffect(() => {
        console.log("⚡ [EFFECT] Date state changed to:", date);
    }, [date]);

    // Track snapshot changes
    useEffect(() => {
        console.log("⚡ [EFFECT] Snapshot data changed:", {
            date: snapshot.date,
            invoiceCount: snapshot.invoices.length,
            totalIncome: snapshot.summary.total_income,
            totalExpenses: snapshot.summary.total_expenses,
        });
    }, [snapshot]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatCompactCurrency = (amount: number) => {
        if (Math.abs(amount) >= 1000000) {
            return `£${(amount / 1000000).toFixed(2)}M`;
        } else if (Math.abs(amount) >= 1000) {
            return `£${(amount / 1000).toFixed(2)}K`;
        } else {
            return `£${amount.toFixed(2)}`;
        }
    };

    const handleDateChange = (newDate: Date | undefined) => {
        console.log("📅 [DATE CHANGE] Handler called:", {
            newDate,
            currentDate: date,
        });

        if (!newDate) {
            console.log("⚠️ [DATE CHANGE] No date provided, returning");
            return;
        }

        setDate(newDate);
        const dateString = format(newDate, "yyyy-MM-dd");
        console.log("📅 [DATE CHANGE] Formatted date:", dateString);

        const params = new URLSearchParams(searchParams.toString());
        params.set("date", dateString);
        const newUrl = `/expenses/daily?${params.toString()}`;

        console.log("🔄 [DATE CHANGE] Navigating to:", newUrl);
        router.push(newUrl);
        setCalendarOpen(false);
    };

    const handleStatusFilterChange = (newStatus: string) => {
        console.log("🔧 [STATUS FILTER] Changing from", statusFilter, "to", newStatus);
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", newStatus);
        router.push(`/expenses/daily?${params.toString()}`);
    };

    const handlePopoverOpenChange = (open: boolean) => {
        console.log("🚪 [POPOVER] Open state changing from", calendarOpen, "to", open);
        setCalendarOpen(open);
    };

    const handleButtonClick = () => {
        console.log("🔘 [BUTTON CLICK] Calendar button clicked. Current state:", {
            calendarOpen,
            date,
        });
    };

    const incomeInvoices = snapshot.invoices.filter(
        (inv) => inv.type === "ACCREC"
    );
    const expenseInvoices = snapshot.invoices.filter(
        (inv) => inv.type === "ACCPAY"
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

            <div className="md:ml-64 min-h-screen p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <CalendarIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Daily Financial Snapshot
                            </h1>
                            <p className="text-slate-600 mt-1">
                                View complete financial picture for any day
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Date Picker */}
                        <Popover open={calendarOpen} onOpenChange={handlePopoverOpenChange}>
                            <PopoverTrigger asChild>
                                <button
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-[240px] justify-start text-left font-normal"
                                    onClick={(e) => {
                                        console.log("📅 [BUTTON] Date picker button clicked");
                                        handleButtonClick();
                                    }}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(date, "PPP")}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(selectedDate) => {
                                        console.log("📅 [CALENDAR] Date selected in calendar:", selectedDate);
                                        handleDateChange(selectedDate);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={handleStatusFilterChange}
                        >
                            <SelectTrigger className="w-[180px]">
                                <Receipt className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid_authorized">
                                    Paid & Authorized
                                </SelectItem>
                                <SelectItem value="paid">Paid Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Income */}
                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 mb-2">
                                        TOTAL INCOME
                                    </p>
                                    <p className="text-3xl font-bold text-emerald-900">
                                        {formatCompactCurrency(snapshot.summary.total_income)}
                                    </p>
                                    <p className="text-xs text-emerald-600 mt-2">
                                        {snapshot.summary.income_invoice_count} invoice
                                        {snapshot.summary.income_invoice_count !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Expenses */}
                    <Card className="bg-gradient-to-br from-rose-50 to-red-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-rose-700 mb-2">
                                        TOTAL EXPENSES
                                    </p>
                                    <p className="text-3xl font-bold text-rose-900">
                                        {formatCompactCurrency(snapshot.summary.total_expenses)}
                                    </p>
                                    <p className="text-xs text-rose-600 mt-2">
                                        {snapshot.summary.expense_invoice_count} invoice
                                        {snapshot.summary.expense_invoice_count !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center">
                                    <TrendingDown className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Total */}
                    <Card
                        className={`bg-gradient-to-br ${
                            snapshot.summary.net_total >= 0
                                ? "from-blue-50 to-indigo-50"
                                : "from-orange-50 to-amber-50"
                        } border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p
                                        className={`text-sm font-medium mb-2 ${
                                            snapshot.summary.net_total >= 0
                                                ? "text-blue-700"
                                                : "text-orange-700"
                                        }`}
                                    >
                                        NET TOTAL
                                    </p>
                                    <p
                                        className={`text-3xl font-bold ${
                                            snapshot.summary.net_total >= 0
                                                ? "text-blue-900"
                                                : "text-orange-900"
                                        }`}
                                    >
                                        {snapshot.summary.net_total >= 0 ? "" : "-"}
                                        {formatCompactCurrency(
                                            Math.abs(snapshot.summary.net_total)
                                        )}
                                    </p>
                                    <p
                                        className={`text-xs mt-2 ${
                                            snapshot.summary.net_total >= 0
                                                ? "text-blue-600"
                                                : "text-orange-600"
                                        }`}
                                    >
                                        {snapshot.summary.net_total >= 0 ? "Profit" : "Loss"}
                                    </p>
                                </div>
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                        snapshot.summary.net_total >= 0
                                            ? "bg-blue-500"
                                            : "bg-orange-500"
                                    }`}
                                >
                                    <DollarSign className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoice Summary */}
                <div className="flex items-center gap-3 text-slate-600">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">
                        {snapshot.summary.invoice_count} Invoice
                        {snapshot.summary.invoice_count !== 1 ? "s" : ""} |{" "}
                        {snapshot.summary.line_item_count} Line Item
                        {snapshot.summary.line_item_count !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Empty State */}
                {snapshot.invoices.length === 0 && (
                    <Card className="border-2 border-dashed border-slate-300 bg-white/50">
                        <CardContent className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                No invoices found
                            </h3>
                            <p className="text-slate-500">
                                There are no invoices for{" "}
                                {format(date, "MMMM d, yyyy")}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Income Invoices */}
                {incomeInvoices.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-800">
                                Income Invoices ({incomeInvoices.length})
                            </h2>
                        </div>

                        <Accordion type="multiple" className="space-y-4">
                            {incomeInvoices.map((invoice) => (
                                <AccordionItem
                                    key={invoice.id}
                                    value={invoice.id}
                                    className="border-0"
                                >
                                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all">
                                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                            <div className="flex items-center justify-between w-full text-left">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-lg text-slate-800">
                                                            {invoice.contact_name}
                                                        </span>
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            {invoice.status}
                                                        </Badge>
                                                    </div>
                                                    {invoice.reference && (
                                                        <p className="text-sm text-slate-500 mt-1">
                                                            Ref: {invoice.reference}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {invoice.line_items.length} line item
                                                        {invoice.line_items.length !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                                <div className="text-right mr-4">
                                                    <p className="text-2xl font-bold text-emerald-600">
                                                        {formatCurrency(invoice.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="px-6 pb-4 space-y-2">
                                                {invoice.line_items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-800">
                                                                {item.description}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-sm text-slate-500">
                                                                    Qty: {item.quantity} × {formatCurrency(item.unit_amount)}
                                                                </span>
                                                                {item.department && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        <Building2 className="w-3 h-3 mr-1" />
                                                                        {item.department.name}
                                                                    </Badge>
                                                                )}
                                                                {item.stage && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        <Package className="w-3 h-3 mr-1" />
                                                                        {item.stage.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-slate-800">
                                                                {formatCurrency(item.line_amount)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}

                {/* Expense Invoices */}
                {expenseInvoices.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-800">
                                Expense Invoices ({expenseInvoices.length})
                            </h2>
                        </div>

                        <Accordion type="multiple" className="space-y-4">
                            {expenseInvoices.map((invoice) => (
                                <AccordionItem
                                    key={invoice.id}
                                    value={invoice.id}
                                    className="border-0"
                                >
                                    <Card className="border-l-4 border-l-rose-500 hover:shadow-lg transition-all">
                                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                            <div className="flex items-center justify-between w-full text-left">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold text-lg text-slate-800">
                                                            {invoice.contact_name}
                                                        </span>
                                                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                                            {invoice.status}
                                                        </Badge>
                                                    </div>
                                                    {invoice.reference && (
                                                        <p className="text-sm text-slate-500 mt-1">
                                                            Ref: {invoice.reference}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {invoice.line_items.length} line item
                                                        {invoice.line_items.length !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                                <div className="text-right mr-4">
                                                    <p className="text-2xl font-bold text-rose-600">
                                                        {formatCurrency(invoice.total)}
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="px-6 pb-4 space-y-2">
                                                {invoice.line_items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-800">
                                                                {item.description}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-sm text-slate-500">
                                                                    Qty: {item.quantity} × {formatCurrency(item.unit_amount)}
                                                                </span>
                                                                {item.department && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        <Building2 className="w-3 h-3 mr-1" />
                                                                        {item.department.name}
                                                                    </Badge>
                                                                )}
                                                                {item.stage && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        <Package className="w-3 h-3 mr-1" />
                                                                        {item.stage.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-slate-800">
                                                                {formatCurrency(item.line_amount)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
