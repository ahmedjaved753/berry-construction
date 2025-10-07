"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Calculator,
    DollarSign,
    FileText,
    TrendingUp,
    TrendingDown,
    Clock,
    User,
    Package,
    BarChart3,
    Activity
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
    stage_name: string | null;
    invoice_type: string;
    invoice_date: string;
    contact_name: string;
    created_at: string;
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const departmentId = params.departmentId as string;
    const statusFilter = searchParams.get('status') || 'paid_authorized';

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
                <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

                <div className="md:ml-64 min-h-screen flex items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 text-center">
                            <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Department Not Found</h3>
                            <p className="text-gray-600 mb-4">{error || 'The department you are looking for does not exist.'}</p>
                            <Button onClick={() => router.back()} variant="outline">
                                Go Back
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const netProfit = (invoiceSummary?.total_income || 0) - (invoiceSummary?.total_expenses || 0);
    const stageBreakdown = lineItems
        .filter(item => item.stage_name)
        .reduce((acc, item) => {
            const stageName = item.stage_name!;
            if (!acc[stageName]) {
                acc[stageName] = {
                    name: stageName,
                    total: 0,
                    items: 0,
                    income: 0,
                    expenses: 0
                };
            }
            acc[stageName].total += parseFloat(item.line_amount.toString());
            acc[stageName].items += 1;
            if (item.invoice_type === 'ACCREC') {
                acc[stageName].income += parseFloat(item.line_amount.toString());
            } else {
                acc[stageName].expenses += parseFloat(item.line_amount.toString());
            }
            return acc;
        }, {} as Record<string, any>);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

            <div className="md:ml-64 min-h-screen">
                <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="mb-4 hover:bg-blue-50"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Expenses
                    </Button>

                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-1">{departmentInfo.name}</h1>
                            <div className="flex items-center space-x-4 text-gray-600">
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">Income</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600 mb-1">
                                {formatCurrency(invoiceSummary?.total_income || 0)}
                            </p>
                            <p className="text-sm text-emerald-700">
                                {invoiceSummary?.income_invoices || 0} invoices
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingDown className="h-6 w-6 text-red-600" />
                                <span className="text-sm font-medium text-red-700">Expenses</span>
                            </div>
                            <p className="text-2xl font-bold text-red-600 mb-1">
                                {formatCurrency(invoiceSummary?.total_expenses || 0)}
                            </p>
                            <p className="text-sm text-red-700">
                                {invoiceSummary?.expense_invoices || 0} invoices
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${netProfit >= 0
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                        : 'bg-gradient-to-br from-orange-50 to-orange-100'
                        }`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                                <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                    Net Profit
                                </span>
                            </div>
                            <p className={`text-2xl font-bold mb-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatCurrency(netProfit)}
                            </p>
                            <p className={`text-sm ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                {netProfit >= 0 ? 'Profitable' : 'Loss'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Package className="h-6 w-6 text-purple-600" />
                                <span className="text-sm font-medium text-purple-700">Line Items</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600 mb-1">
                                {invoiceSummary?.total_line_items || 0}
                            </p>
                            <p className="text-sm text-purple-700">
                                Total items
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stages Breakdown */}
                {Object.keys(stageBreakdown).length > 0 && (
                    <Card className="border-0 shadow-xl bg-white mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                                <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                                Construction Stages Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.values(stageBreakdown).map((stage: any) => (
                                    <div key={stage.name} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-2">{stage.name}</h4>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total:</span>
                                                <span className="font-medium text-gray-900">{formatCurrency(stage.total)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-emerald-600">Income:</span>
                                                <span className="font-medium text-emerald-600">{formatCurrency(stage.income)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-red-600">Expenses:</span>
                                                <span className="font-medium text-red-600">{formatCurrency(stage.expenses)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                                                <span className="text-gray-600">Items:</span>
                                                <span className="font-medium text-blue-600">{stage.items}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Line Items */}
                <Card className="border-0 shadow-xl bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl font-bold text-gray-900">
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
                                <div key={item.id} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.description}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Calculator className="h-3 w-3 mr-1" />
                                                    Qty: {item.quantity}
                                                </div>
                                                <div className="flex items-center">
                                                    <DollarSign className="h-3 w-3 mr-1" />
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
        </div>
    );
}
