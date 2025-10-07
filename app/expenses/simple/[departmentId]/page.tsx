"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, DollarSign, FileText, Users, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface DepartmentInfo {
    id: string;
    name: string;
    status: string;
    created_at: string;
}

interface LineItem {
    id: string;
    description: string;
    line_amount: number;
    invoice_type: string;
    invoice_date: string;
    contact_name: string;
    stage_name?: string;
}

interface InvoiceSummary {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    total_line_items: number;
    latest_invoice_date: string;
    earliest_invoice_date: string;
}

export default function SimpleDepartmentDetailPage({
    params,
}: {
    params: { departmentId: string };
}) {
    const [departmentInfo, setDepartmentInfo] = useState<DepartmentInfo | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const departmentId = params.departmentId as string;

    useEffect(() => {
        // Simulate loading and set test data
        setTimeout(() => {
            // Test data based on department ID
            if (departmentId === "9a082bdd-b32e-455e-b5ab-2f4d7db370cb") {
                setDepartmentInfo({
                    id: departmentId,
                    name: "23 St Marys Gate",
                    status: "Active",
                    created_at: "2024-01-01T00:00:00Z"
                });

                setLineItems([
                    {
                        id: "1",
                        description: "Plasterboard supplies - main bedroom",
                        line_amount: 850.00,
                        invoice_type: "ACCPAY",
                        invoice_date: "2024-01-15",
                        contact_name: "BuildCorp Supplies",
                        stage_name: "11 - Dry Lining / Plastering"
                    },
                    {
                        id: "2",
                        description: "Labour - dry lining team (3 days)",
                        line_amount: 1200.00,
                        invoice_type: "ACCPAY",
                        invoice_date: "2024-01-14",
                        contact_name: "Expert Dry Liners Ltd",
                        stage_name: "11 - Dry Lining / Plastering"
                    },
                    {
                        id: "3",
                        description: "Steel beams - main structural work",
                        line_amount: 3400.00,
                        invoice_type: "ACCPAY",
                        invoice_date: "2024-01-10",
                        contact_name: "Steel Solutions Ltd",
                        stage_name: "4 - Superstructure"
                    },
                    {
                        id: "4",
                        description: "Progress payment - Phase 1 completion",
                        line_amount: 15000.00,
                        invoice_type: "ACCREC",
                        invoice_date: "2024-01-12",
                        contact_name: "Property Development Client",
                    },
                ]);

                setInvoiceSummary({
                    total_income: 15000,
                    total_expenses: 5450,
                    net_profit: 9550,
                    total_line_items: 4,
                    latest_invoice_date: "2024-01-15",
                    earliest_invoice_date: "2024-01-10"
                });

            } else if (departmentId === "622d24c8-d499-40ac-8105-f6c3f25b43ae") {
                setDepartmentInfo({
                    id: departmentId,
                    name: "Slack Lane",
                    status: "Active",
                    created_at: "2024-01-01T00:00:00Z"
                });

                setLineItems([
                    {
                        id: "5",
                        description: "Drainage pipes and fittings",
                        line_amount: 2800.00,
                        invoice_type: "ACCPAY",
                        invoice_date: "2024-01-08",
                        contact_name: "Drainage Specialists Ltd",
                        stage_name: "3 - Drainage"
                    },
                    {
                        id: "6",
                        description: "Excavation work - drainage trenches",
                        line_amount: 4400.00,
                        invoice_type: "ACCPAY",
                        invoice_date: "2024-01-06",
                        contact_name: "Ground Works Pro",
                        stage_name: "3 - Drainage"
                    },
                    {
                        id: "7",
                        description: "Client advance payment",
                        line_amount: 8000.00,
                        invoice_type: "ACCREC",
                        invoice_date: "2024-01-05",
                        contact_name: "Residential Client",
                    },
                ]);

                setInvoiceSummary({
                    total_income: 8000,
                    total_expenses: 7200,
                    net_profit: 800,
                    total_line_items: 3,
                    latest_invoice_date: "2024-01-08",
                    earliest_invoice_date: "2024-01-05"
                });
            } else {
                // Unknown department
                setDepartmentInfo({
                    id: departmentId,
                    name: "Unknown Department",
                    status: "Unknown",
                    created_at: "2024-01-01T00:00:00Z"
                });

                setLineItems([]);
                setInvoiceSummary({
                    total_income: 0,
                    total_expenses: 0,
                    net_profit: 0,
                    total_line_items: 0,
                    latest_invoice_date: "",
                    earliest_invoice_date: ""
                });
            }

            setLoading(false);
        }, 800);
    }, [departmentId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-24 bg-gray-300 rounded"></div>
                            ))}
                        </div>
                        <div className="h-64 bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/expenses/simple"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to All Departments
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">
                                    {departmentInfo?.name}
                                </h1>
                                <div className="flex items-center space-x-3 mt-2">
                                    <Badge variant={departmentInfo?.status === 'Active' ? 'default' : 'secondary'}>
                                        {departmentInfo?.status}
                                    </Badge>
                                    <span className="text-gray-600">
                                        Department ID: {departmentId.slice(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Badge variant="secondary" className="px-4 py-2">
                            Simple Test Version
                        </Badge>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 mb-1">Total Income</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(invoiceSummary?.total_income || 0)}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-700 mb-1">Total Expenses</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(invoiceSummary?.total_expenses || 0)}
                                    </p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-0 shadow-lg ${(invoiceSummary?.net_profit || 0) >= 0
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                            : 'bg-gradient-to-br from-orange-50 to-orange-100'
                        }`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium mb-1 ${(invoiceSummary?.net_profit || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
                                        }`}>
                                        Net Profit
                                    </p>
                                    <p className={`text-2xl font-bold ${(invoiceSummary?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
                                        }`}>
                                        {formatCurrency(invoiceSummary?.net_profit || 0)}
                                    </p>
                                </div>
                                <DollarSign className={`h-8 w-8 ${(invoiceSummary?.net_profit || 0) >= 0 ? 'text-blue-500' : 'text-orange-500'
                                    }`} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-700 mb-1">Total Line Items</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {invoiceSummary?.total_line_items || 0}
                                    </p>
                                </div>
                                <FileText className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Line Items */}
                <Card className="border-0 shadow-xl bg-white">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                            <FileText className="h-6 w-6 mr-2 text-blue-600" />
                            Recent Line Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lineItems.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {lineItems.map((item) => (
                                    <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                                    {item.description}
                                                </h4>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span className="flex items-center">
                                                        <Users className="h-4 w-4 mr-1" />
                                                        {item.contact_name}
                                                    </span>
                                                    <span>
                                                        {formatDate(item.invoice_date)}
                                                    </span>
                                                    {item.stage_name && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.stage_name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-bold ${item.invoice_type === 'ACCREC' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                    {item.invoice_type === 'ACCREC' ? '+' : '-'}{formatCurrency(Math.abs(item.line_amount))}
                                                </p>
                                                <Badge variant={item.invoice_type === 'ACCREC' ? 'default' : 'destructive'}>
                                                    {item.invoice_type === 'ACCREC' ? 'Income' : 'Expense'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Line Items Found</h3>
                                <p className="text-gray-600">No financial data available for this department.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


