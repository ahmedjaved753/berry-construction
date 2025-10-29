"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, DollarSign, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface DepartmentExpense {
    department_name: string;
    department_id: string;
    total_invoices: number;
    income_received: number;
    expenses_spent: number;
    net_profit: number;
    latest_activity: string | null;
    income_invoices: number;
    expense_invoices: number;
    stages: any[];
}

export default function SimpleExpensesPage() {
    const [departments, setDepartments] = useState<DepartmentExpense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("🔵 [SIMPLE PAGE] useEffect started");
        console.log("🔵 [SIMPLE PAGE] Initial loading state:", loading);
        console.log("🔵 [SIMPLE PAGE] Initial departments state:", departments);

        // Set loading to false immediately to test if skeleton is the issue
        console.log("🔵 [SIMPLE PAGE] Setting loading to false immediately");
        setLoading(false);

        // Also set test data immediately
        const testData: DepartmentExpense[] = [
            {
                department_name: "23 St Marys Gate",
                department_id: "9a082bdd-b32e-455e-b5ab-2f4d7db370cb",
                income_received: 15000,
                expenses_spent: 8500,
                net_profit: 6500,
                total_invoices: 8,
                income_invoices: 3,
                expense_invoices: 5,
                latest_activity: "2024-01-15",
                stages: [
                    {
                        stage_name: "11 - Dry Lining / Plastering",
                        stage_total_spent: 3200,
                        line_items_count: 12
                    },
                    {
                        stage_name: "4 - Superstructure",
                        stage_total_spent: 5300,
                        line_items_count: 8
                    }
                ]
            },
            {
                department_name: "Slack Lane",
                department_id: "622d24c8-d499-40ac-8105-f6c3f25b43ae",
                income_received: 8000,
                expenses_spent: 12000,
                net_profit: -4000,
                total_invoices: 5,
                income_invoices: 2,
                expense_invoices: 3,
                latest_activity: "2024-01-10",
                stages: [
                    {
                        stage_name: "3 - Drainage",
                        stage_total_spent: 7200,
                        line_items_count: 15
                    }
                ]
            }
        ];

        console.log("🔵 [SIMPLE PAGE] Setting test data:", testData);
        setDepartments(testData);

        console.log("🔵 [SIMPLE PAGE] useEffect completed");
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    console.log("🔴 [SIMPLE PAGE RENDER] Current state:", { loading, departmentsLength: departments.length });
    console.log("🔴 [SIMPLE PAGE RENDER] Departments data:", departments);

    const totalIncome = departments.reduce((sum, dept) => sum + dept.income_received, 0);
    const totalExpenses = departments.reduce((sum, dept) => sum + dept.expenses_spent, 0);
    const totalNet = totalIncome - totalExpenses;

    console.log("🔴 [SIMPLE PAGE RENDER] Calculated totals:", { totalIncome, totalExpenses, totalNet });

    if (loading) {
        console.log("🔴 [SIMPLE PAGE RENDER] Showing loading skeleton");
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto p-6">
                    {/* Header Skeleton */}
                    <div className="mb-10">
                        <div className="flex items-center space-x-4 mb-4">
                            <Skeleton className="h-14 w-14 rounded-2xl" />
                            <div>
                                <Skeleton className="h-10 w-64 mb-2" />
                                <Skeleton className="h-6 w-48" />
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-0 shadow-xl">
                                <CardContent className="p-6">
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Department Cards Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {[1, 2].map((i) => (
                            <Card key={i} className="border-0 shadow-xl">
                                <CardHeader>
                                    <Skeleton className="h-24 w-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-32 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-foreground mb-1">Department Expenses</h1>
                                <p className="text-muted-foreground text-lg">Track financial performance across all departments</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="px-4 py-2 text-sm">
                            Simple Version - Test Data
                        </Badge>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full w-32"></div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="bg-card border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-400 mb-2">TOTAL INCOME</p>
                                    <p className="text-3xl font-bold text-foreground">{formatCurrency(totalIncome)}</p>
                                    <p className="text-xs text-emerald-400/80 mt-2">All departments</p>
                                </div>
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center ring-2 ring-emerald-500/30">
                                    <TrendingUp className="w-7 h-7 text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-l-4 border-rose-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-rose-400 mb-2">TOTAL EXPENSES</p>
                                    <p className="text-3xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
                                    <p className="text-xs text-rose-400/80 mt-2">All departments</p>
                                </div>
                                <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center ring-2 ring-rose-500/30">
                                    <TrendingDown className="w-7 h-7 text-rose-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`bg-card border-l-4 ${totalNet >= 0 ? "border-blue-500" : "border-orange-500"} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden hover:scale-105`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${totalNet >= 0 ? "from-blue-500/10" : "from-orange-500/10"} to-transparent pointer-events-none`}></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${totalNet >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                                        NET TOTAL
                                    </p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCurrency(totalNet)}
                                    </p>
                                    <p className={`text-xs mt-2 ${totalNet >= 0 ? "text-blue-400/80" : "text-orange-400/80"}`}>
                                        {totalNet >= 0 ? "Profit" : "Loss"}
                                    </p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-2 ${totalNet >= 0 ? "bg-blue-500/20 ring-blue-500/30" : "bg-orange-500/20 ring-orange-500/30"}`}>
                                    {totalNet >= 0 ? (
                                        <TrendingUp className="w-7 h-7 text-blue-400" />
                                    ) : (
                                        <TrendingDown className="w-7 h-7 text-orange-400" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Department Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {departments.map((dept) => (
                        <Card key={dept.department_id} className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-card border-0 shadow-md">
                            <CardHeader className="pb-4 bg-card/50 border-b border-border">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-blue-100 rounded-xl">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg font-semibold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                                                {dept.department_name}
                                            </CardTitle>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <span>{dept.total_invoices} invoices</span>
                                                {dept.latest_activity && (
                                                    <span>Last activity: {new Date(dept.latest_activity).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={dept.net_profit >= 0 ? "default" : "destructive"}>
                                        {dept.net_profit >= 0 ? "Profitable" : "Loss"}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                {/* Financial Overview */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <p className="text-sm font-medium text-emerald-700 mb-1">Income</p>
                                        <p className="text-xl font-bold text-emerald-600">
                                            {formatCurrency(dept.income_received)}
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-1">{dept.income_invoices} invoices</p>
                                    </div>

                                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-sm font-medium text-red-700 mb-1">Expenses</p>
                                        <p className="text-xl font-bold text-red-600">
                                            {formatCurrency(dept.expenses_spent)}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">{dept.expense_invoices} invoices</p>
                                    </div>

                                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-sm font-medium text-blue-700 mb-1">Net</p>
                                        <p className={`text-xl font-bold ${dept.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {formatCurrency(dept.net_profit)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {dept.net_profit >= 0 ? 'Profit' : 'Loss'}
                                        </p>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <Link
                                    href={`/expenses/${dept.department_id}`}
                                    className="group/btn flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 mb-4"
                                >
                                    View Department Details
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>

                                {/* Stages */}
                                {dept.stages.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground mb-2">Construction Stages</h4>
                                        {dept.stages.slice(0, 3).map((stage, index) => (
                                            <div key={index} className="p-3 bg-secondary rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-foreground text-sm">{stage.stage_name}</span>
                                                    <div className="text-right">
                                                        <p className="font-bold text-red-600">{formatCurrency(stage.stage_total_spent)}</p>
                                                        <p className="text-xs text-muted-foreground">{stage.line_items_count} line items</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {dept.stages.length > 3 && (
                                            <p className="text-xs text-muted-foreground text-center mt-2">
                                                +{dept.stages.length - 3} more stages
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {departments.length === 0 && (
                    <div className="text-center py-12">
                        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No Department Data</h3>
                        <p className="text-muted-foreground mb-4">No expense data found. Connect to Xero to sync your financial data.</p>
                        <Link
                            href="/integrations"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Connect Xero Integration
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

