"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import { BudgetEditDialog } from "@/components/expenses/budget-edit-dialog";
import { StageInvoiceList } from "@/components/expenses/stage-invoice-list";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Calculator,
    PoundSterling,
    FileText,
    TrendingUp,
    TrendingDown,
    Clock,
    User,
    Package,
    BarChart3,
    Activity,
    Pencil,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Wallet,
    AlertCircle,
} from "lucide-react";

interface DepartmentInfo {
    id: string;
    name: string;
    status: string;
    xero_tracking_option_id: string;
    created_at: string;
    updated_at: string;
}

interface InvoiceSummary {
    total_invoices: number;
    income_invoices: number;
    expense_invoices: number;
    total_income: number;
    total_expenses: number;
    expenses_excl_overheads: number;
    overheads: number;
    unassigned_bills: number;
    gross_profit: number;
    net_profit: number;
    total_line_items: number;
    latest_invoice_date: string;
    earliest_invoice_date: string;
}

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unit_amount: number;
    line_amount: number;
    tax_amount: number;
    stage_id: string | null;
    stage_name: string | null;
    invoice_type: string;
    invoice_date: string;
    contact_name: string;
    created_at: string;
}

interface StageBreakdown {
    stage_id: string;
    stage_name: string;
    expenses: number;
    income: number;
    items: number;
    budgeted_amount: number;
}

interface StageInvoice {
    xero_invoice_id: string;
    contact_name: string;
    invoice_date: string;
    line_amount: number;
    reference: string | null;
}

export default function DepartmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const componentId = useRef(`dept-${Math.random().toString(36).substr(2, 9)}`);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingRef = useRef(false);

    const [departmentInfo, setDepartmentInfo] = useState<DepartmentInfo | null>(null);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [stageBreakdown, setStageBreakdown] = useState<StageBreakdown[]>([]);
    const [stageInvoices, setStageInvoices] = useState<Record<string, StageInvoice[]>>({});
    const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<StageBreakdown | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const departmentId = params.departmentId as string;
    const statusFilter = searchParams.get('status') || 'paid_authorized';

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const toggleStageExpanded = (stageId: string) => {
        setExpandedStages((prev) => {
            const next = new Set(prev);
            if (next.has(stageId)) {
                next.delete(stageId);
            } else {
                next.add(stageId);
            }
            return next;
        });
    };

    const handleEditBudget = (stage: StageBreakdown) => {
        setEditingStage(stage);
        setIsDialogOpen(true);
    };

    const handleSaveBudget = async (amount: number) => {
        if (!editingStage) return;

        try {
            const response = await fetch(
                `/api/departments/${departmentId}/stages/${editingStage.stage_id}/budget`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ budgeted_amount: amount }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update budget");
            }

            // Refresh the page to show updated budget
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to save budget:", error);
            throw error;
        }
    };

    // Enhanced logging with component ID
    const log = (message: string, data?: any) => {
        console.log(`🔍 [DEPT DETAIL ${componentId.current}]`, message, data || '');
    };

    useEffect(() => {
        log('useEffect triggered', {
            departmentId,
            user: user?.id || 'no-user',
            loading,
            currentDeptInfo: departmentInfo?.name || 'none'
        });

        if (!departmentId) {
            log('❌ No department ID provided');
            return;
        }

        // Wait for user authentication to be resolved
        if (user === undefined) {
            log('⏳ Waiting for user authentication to resolve...');
            return;
        }

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Use authenticated user ID, fall back to known test user if needed
        const effectiveUserId = user?.id || 'dc75a8ef-acd2-4930-bbe5-d6a8a2d4c5e5';
        log('Auth user:', user?.id || 'null');
        log('Using effective user ID:', effectiveUserId);
        log('Department ID:', departmentId);

        // Set up 20-second emergency timeout
        timeoutRef.current = setTimeout(() => {
            log('🚨 EMERGENCY TIMEOUT: 20 seconds reached - using fallback data');
            if (loading) {
                setDepartmentInfo({
                    id: departmentId,
                    name: "Timeout - Test Department",
                    status: "active",
                    xero_tracking_option_id: "timeout-id",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                setInvoiceSummary({
                    total_invoices: 1,
                    income_invoices: 0,
                    expense_invoices: 1,
                    total_income: 0,
                    total_expenses: 100,
                    total_line_items: 1,
                    latest_invoice_date: new Date().toISOString().split('T')[0],
                    earliest_invoice_date: new Date().toISOString().split('T')[0]
                });
                setLineItems([{
                    id: 'timeout-1',
                    description: 'Timeout - Unable to load real data',
                    quantity: 1,
                    unit_amount: 100,
                    line_amount: 100,
                    tax_amount: 0,
                    stage_name: 'Test Stage',
                    invoice_type: 'ACCPAY',
                    invoice_date: new Date().toISOString().split('T')[0],
                    contact_name: 'Timeout Test',
                    created_at: new Date().toISOString()
                }]);
                setError('Request timed out after 20 seconds - using test data');
                setLoading(false);
            }
        }, 20000);

        fetchDepartmentDetails(effectiveUserId);

        return () => {
            log('🧹 Component cleanup - clearing timeout');
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [user, departmentId, statusFilter]);

    const fetchDepartmentDetails = async (userId: string) => {
        if (isFetchingRef.current) {
            log('🔄 Already fetching, skipping duplicate call');
            return;
        }

        isFetchingRef.current = true;

        try {
            log('🚀 Starting fetchDepartmentDetails via API route', { userId, departmentId });
            log('📊 Current loading state:', loading);

            // Call our server-side API route instead of direct Supabase queries
            log('🌐 Calling API route: /api/departments/' + departmentId);

            const apiResponse = await Promise.race([
                fetch(`/api/departments/${departmentId}?status=${statusFilter}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('API request timeout after 15 seconds')), 15000)
                )
            ]);

            log('🌐 API response status:', apiResponse.status);

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                log('❌ API request failed:', errorData);
                throw new Error(`API request failed: ${errorData.error || apiResponse.statusText}`);
            }

            const data = await apiResponse.json();
            log('🌐 API response data received:', {
                department: data.department?.name,
                lineItemsCount: data.lineItems?.length || 0,
                summary: data.summary
            });

            // Set department info
            if (data.department) {
                log('✅ Setting department info:', data.department);
                setDepartmentInfo(data.department);
            } else {
                throw new Error('No department data received from API');
            }

            // Set line items
            if (data.lineItems) {
                log('✅ Setting line items:', { count: data.lineItems.length });
                setLineItems(data.lineItems);
            } else {
                log('⚠️ No line items received, setting empty array');
                setLineItems([]);
            }

            // Set summary
            if (data.summary) {
                log('✅ Setting summary:', data.summary);
                setInvoiceSummary(data.summary);
            } else {
                log('⚠️ No summary received, setting empty summary');
                setInvoiceSummary({
                    total_invoices: 0,
                    income_invoices: 0,
                    expense_invoices: 0,
                    total_income: 0,
                    total_expenses: 0,
                    total_line_items: 0,
                    latest_invoice_date: '',
                    earliest_invoice_date: ''
                });
            }

            // Set stage breakdown
            if (data.stageBreakdown) {
                log('✅ Setting stage breakdown:', { count: data.stageBreakdown.length });
                setStageBreakdown(data.stageBreakdown);
            } else {
                log('⚠️ No stage breakdown received, setting empty array');
                setStageBreakdown([]);
            }

            // Set stage invoices
            if (data.stageInvoices) {
                log('✅ Setting stage invoices:', { stagesWithInvoices: Object.keys(data.stageInvoices).length });
                setStageInvoices(data.stageInvoices);
            } else {
                log('⚠️ No stage invoices received, setting empty object');
                setStageInvoices({});
            }

            // Clear timeout on success
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
                log('✅ Cleared emergency timeout - data loaded successfully');
            }

            log('🎉 FETCH COMPLETED SUCCESSFULLY via API route');

        } catch (err: any) {
            log('💥 FETCH ERROR:', {
                message: err.message,
                name: err.name,
                stack: err.stack?.substring(0, 300),
                cause: err.cause
            });
            console.error('Error fetching department details via API:', err);

            // Set error but don't leave in loading state
            setError(`Failed to load department: ${err.message}`);
            setDepartmentInfo(null);
            setLineItems([]);
            setInvoiceSummary(null);
        } finally {
            log('🏁 FETCH FINALLY BLOCK - setting loading=false');
            setLoading(false);
            isFetchingRef.current = false;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No date';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
                <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

                <div className="md:ml-64 min-h-screen">
                    <div className="max-w-7xl mx-auto p-6">
                    <div className="mb-8">
                        <Skeleton className="h-10 w-48 mb-4" />
                        <Skeleton className="h-8 w-96 mb-2" />
                        <Skeleton className="h-6 w-64" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {Array(3).fill(0).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !departmentInfo) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
                <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

                <div className="md:ml-64 min-h-screen flex items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 text-center">
                            <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">Department Not Found</h3>
                            <p className="text-muted-foreground mb-4">{error || 'The department you are looking for does not exist.'}</p>
                            <Button onClick={() => router.back()} variant="outline">
                                Go Back
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

            <div className="md:ml-64 min-h-screen">
                <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="mb-4 hover:bg-accent"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Expenses
                    </Button>

                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-1">{departmentInfo.name}</h1>
                            <div className="flex items-center space-x-4 text-muted-foreground">
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    {departmentInfo.status}
                                </Badge>
                                <span className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Created {formatDate(departmentInfo.created_at)}
                                </span>
                                <span className="flex items-center">
                                    <Activity className="h-4 w-4 mr-1" />
                                    Updated {formatDate(departmentInfo.updated_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full w-32"></div>
                </div>

                {/* Summary Cards - 6 cards in 2 rows */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Row 1: Total Income, Total Expenses (excl. overheads), Gross Profit */}

                    {/* Total Income - Clickable link to income detail page */}
                    <Link href={`/departmentincome/${departmentId}`} className="block group">
                        <Card className="bg-card border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
                            <CardContent className="p-6 relative">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-emerald-400 mb-2">TOTAL INCOME</p>
                                        <p className="text-3xl font-bold text-foreground">
                                            {formatCurrency(invoiceSummary?.total_income || 0)}
                                        </p>
                                        <p className="text-xs text-emerald-400/80 mt-2">
                                            {invoiceSummary?.income_invoices || 0} invoices
                                        </p>
                                        <p className="text-xs text-emerald-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to view details →
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center ring-2 ring-emerald-500/30">
                                        <TrendingUp className="w-7 h-7 text-emerald-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Total Expenses (excl. overheads) */}
                    <Card className="bg-card border-l-4 border-rose-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-rose-400 mb-2">TOTAL EXPENSES</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCurrency(invoiceSummary?.expenses_excl_overheads || 0)}
                                    </p>
                                    <p className="text-xs text-rose-400/80 mt-2">
                                        Excludes overheads
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center ring-2 ring-rose-500/30">
                                    <TrendingDown className="w-7 h-7 text-rose-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gross Profit */}
                    <Card className={`bg-card border-l-4 ${(invoiceSummary?.gross_profit || 0) >= 0 ? "border-blue-500" : "border-orange-500"} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${(invoiceSummary?.gross_profit || 0) >= 0 ? "from-blue-500/10" : "from-orange-500/10"} to-transparent pointer-events-none`}></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${(invoiceSummary?.gross_profit || 0) >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                                        GROSS PROFIT
                                    </p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {(invoiceSummary?.gross_profit || 0) >= 0 ? '' : '-'}
                                        {formatCurrency(Math.abs(invoiceSummary?.gross_profit || 0))}
                                    </p>
                                    <p className={`text-xs mt-2 ${(invoiceSummary?.gross_profit || 0) >= 0 ? "text-blue-400/80" : "text-orange-400/80"}`}>
                                        Income - Expenses (excl. overheads)
                                    </p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-2 ${(invoiceSummary?.gross_profit || 0) >= 0 ? "bg-blue-500/20 ring-blue-500/30" : "bg-orange-500/20 ring-orange-500/30"}`}>
                                    <BarChart3 className={`w-7 h-7 ${(invoiceSummary?.gross_profit || 0) >= 0 ? "text-blue-400" : "text-orange-400"}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Row 2: Overheads, Net Profit, Unassigned Bills */}

                    {/* Overheads */}
                    <Card className="bg-card border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-400 mb-2">OVERHEADS</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCurrency(invoiceSummary?.overheads || 0)}
                                    </p>
                                    <p className="text-xs text-purple-400/80 mt-2">
                                        Stage: 21 - Overheads
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center ring-2 ring-purple-500/30">
                                    <Wallet className="w-7 h-7 text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Profit */}
                    <Card className={`bg-card border-l-4 ${(invoiceSummary?.net_profit || 0) >= 0 ? "border-indigo-500" : "border-red-500"} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${(invoiceSummary?.net_profit || 0) >= 0 ? "from-indigo-500/10" : "from-red-500/10"} to-transparent pointer-events-none`}></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${(invoiceSummary?.net_profit || 0) >= 0 ? "text-indigo-400" : "text-red-400"}`}>
                                        NET PROFIT
                                    </p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {(invoiceSummary?.net_profit || 0) >= 0 ? '' : '-'}
                                        {formatCurrency(Math.abs(invoiceSummary?.net_profit || 0))}
                                    </p>
                                    <p className={`text-xs mt-2 ${(invoiceSummary?.net_profit || 0) >= 0 ? "text-indigo-400/80" : "text-red-400/80"}`}>
                                        {(invoiceSummary?.net_profit || 0) >= 0 ? 'Profit' : 'Loss'} after overheads
                                    </p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-2 ${(invoiceSummary?.net_profit || 0) >= 0 ? "bg-indigo-500/20 ring-indigo-500/30" : "bg-red-500/20 ring-red-500/30"}`}>
                                    <PoundSterling className={`w-7 h-7 ${(invoiceSummary?.net_profit || 0) >= 0 ? "text-indigo-400" : "text-red-400"}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unassigned Bills - Clickable link to unassigned bills page */}
                    <Link href={`/unassignedbills/${departmentId}`} className="block group">
                        <Card className="bg-card border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
                            <CardContent className="p-6 relative">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-amber-400 mb-2">UNASSIGNED BILLS</p>
                                        <p className="text-3xl font-bold text-foreground">
                                            {formatCurrency(invoiceSummary?.unassigned_bills || 0)}
                                        </p>
                                        <p className="text-xs text-amber-400/80 mt-2">
                                            Missing stage assignment
                                        </p>
                                        <p className="text-xs text-amber-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to view details →
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center ring-2 ring-amber-500/30">
                                        <AlertCircle className="w-7 h-7 text-amber-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Stages Breakdown */}
                {stageBreakdown.length > 0 && (
                    <Card className="border-0 shadow-xl bg-card mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-bold text-foreground">
                                <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                                Construction Stages Budget Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {stageBreakdown.map((stage) => {
                                    const hasBudget = stage.budgeted_amount > 0;
                                    const budgetPercentage = hasBudget
                                        ? Math.min((stage.expenses / stage.budgeted_amount) * 100, 150)
                                        : 0;
                                    const isOverBudget = hasBudget && stage.expenses > stage.budgeted_amount;
                                    const overBudgetAmount = isOverBudget
                                        ? stage.expenses - stage.budgeted_amount
                                        : 0;

                                    const isExpanded = expandedStages.has(stage.stage_id);
                                    const invoices = stageInvoices[stage.stage_id] || [];
                                    const invoiceCount = invoices.length;

                                    return (
                                        <div key={stage.stage_id} className="border border-border rounded-lg overflow-hidden bg-card">
                                            {/* Stage Progress Bar Background - Clickable */}
                                            <div
                                                onClick={() => toggleStageExpanded(stage.stage_id)}
                                                className={`relative h-20 rounded-t-lg border-b cursor-pointer transition-all duration-200 hover:shadow-md ${
                                                    !hasBudget
                                                        ? 'bg-secondary border-dashed border-gray-300'
                                                        : isOverBudget
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-secondary border-border'
                                                }`}
                                            >
                                                {/* Progress Bar */}
                                                {hasBudget && (
                                                    <div
                                                        className={`h-full transition-all duration-500 ${
                                                            isOverBudget
                                                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                                                : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                        }`}
                                                        style={{
                                                            width: `${budgetPercentage}%`,
                                                            opacity: 0.15
                                                        }}
                                                    />
                                                )}

                                                {/* Stage Content */}
                                                <div className="absolute inset-0 flex items-center justify-between p-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold text-foreground text-base truncate">
                                                                {stage.stage_name}
                                                            </h4>
                                                            {isOverBudget && (
                                                                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                                            )}
                                                            {invoiceCount > 0 && (
                                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                                    {invoiceCount} {invoiceCount === 1 ? 'bill' : 'bills'}
                                                                </Badge>
                                                            )}
                                                            {/* Expand/Collapse Chevron */}
                                                            <div className="ml-auto">
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center text-sm text-muted-foreground space-x-3">
                                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium text-xs">
                                                                {stage.items} items
                                                            </span>
                                                            {hasBudget ? (
                                                                <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-700 font-medium'}>
                                                                    {budgetPercentage.toFixed(0)}% of budget used
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-600 font-semibold">⚠️ No budget set</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right ml-6 flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className={`font-bold text-base ${isOverBudget ? 'text-red-600' : 'text-foreground'}`}>
                                                                    {formatCurrency(stage.expenses)}
                                                                </p>
                                                                {hasBudget && (
                                                                    <p className="text-sm text-gray-500">
                                                                        of {formatCurrency(stage.budgeted_amount)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditBudget(stage);
                                                                }}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="p-2 hover:bg-blue-100"
                                                            title="Edit budget"
                                                        >
                                                            <Pencil className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </div>
                                                    {isOverBudget && (
                                                        <Badge variant="destructive" className="text-xs font-semibold">
                                                            +{formatCurrency(overBudgetAmount)} over budget
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            </div>

                                            {/* Invoice List - Expandable Section */}
                                            {invoiceCount > 0 && (
                                                <div className="p-4 bg-secondary">
                                                    <StageInvoiceList
                                                        invoices={invoices}
                                                        isExpanded={isExpanded}
                                                        maxInitialItems={5}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Line Items */}
                <Card className="border-0 shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl font-bold text-foreground">
                            <FileText className="h-6 w-6 mr-3 text-blue-600" />
                            Recent Line Items
                            <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800 border-blue-200">
                                {lineItems.length} items
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {lineItems.map((item) => (
                                <div key={item.id} className="p-4 bg-card/50 rounded-xl border border-border hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground mb-2 line-clamp-2">{item.description}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center">
                                                    <Calculator className="h-3 w-3 mr-1" />
                                                    Qty: {item.quantity}
                                                </div>
                                                <div className="flex items-center">
                                                    <PoundSterling className="h-3 w-3 mr-1" />
                                                    Unit: {formatCurrency(item.unit_amount)}
                                                </div>
                                                <div className="flex items-center">
                                                    <User className="h-3 w-3 mr-1" />
                                                    {item.contact_name}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatDate(item.invoice_date)}
                                                </div>
                                            </div>
                                            {item.stage_name && (
                                                <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                                                    {item.stage_name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className={`text-lg font-bold ${item.invoice_type === 'ACCREC' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                {item.invoice_type === 'ACCREC' ? '+' : '-'}{formatCurrency(item.line_amount)}
                                            </p>
                                            <Badge
                                                variant={item.invoice_type === 'ACCREC' ? 'default' : 'destructive'}
                                                className="text-xs"
                                            >
                                                {item.invoice_type === 'ACCREC' ? 'Income' : 'Expense'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* Budget Edit Dialog */}
            {editingStage && (
                <BudgetEditDialog
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setEditingStage(null);
                    }}
                    onSave={handleSaveBudget}
                    currentBudget={editingStage.budgeted_amount}
                    stageName={editingStage.stage_name}
                    departmentId={departmentId}
                    stageId={editingStage.stage_id}
                />
            )}
        </div>
    );
}
