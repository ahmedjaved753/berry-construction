"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function ExpensesTestPage() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const testDepartments = [
        {
            department_name: "23 St Marys Gate",
            department_id: "9a082bdd-b32e-455e-b5ab-2f4d7db370cb",
            income_received: 15000,
            expenses_spent: 8500,
            net_profit: 6500,
            total_invoices: 8,
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
            stages: [
                {
                    stage_name: "3 - Drainage",
                    stage_total_spent: 7200,
                    line_items_count: 15
                }
            ]
        }
    ];

    const totalIncome = testDepartments.reduce((sum, dept) => sum + dept.income_received, 0);
    const totalExpenses = testDepartments.reduce((sum, dept) => sum + dept.expenses_spent, 0);
    const totalNet = totalIncome - totalExpenses;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-1">Expenses Test Page</h1>
                            <p className="text-muted-foreground text-lg">Static test data to verify UI is working</p>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full w-32"></div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-emerald-700 mb-2 uppercase tracking-wide">Total Income</p>
                                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                                    <TrendingUp className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">Total Expenses</p>
                                    <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                                    <TrendingDown className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${totalNet >= 0
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                            : 'bg-gradient-to-br from-orange-50 to-orange-100'
                        }`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-semibold mb-2 uppercase tracking-wide ${totalNet >= 0 ? 'text-blue-700' : 'text-orange-700'
                                        }`}>
                                        Net Total
                                    </p>
                                    <p className={`text-3xl font-bold ${totalNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                        {formatCurrency(totalNet)}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-2xl shadow-lg ${totalNet >= 0
                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                        : 'bg-gradient-to-br from-orange-500 to-orange-600'
                                    }`}>
                                    {totalNet >= 0 ? (
                                        <TrendingUp className="h-7 w-7 text-white" />
                                    ) : (
                                        <TrendingDown className="h-7 w-7 text-white" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Department Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {testDepartments.map((dept) => (
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
                                            <div className="text-sm text-muted-foreground">
                                                {dept.total_invoices} invoices
                                            </div>
                                        </div>
                                    </div>
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
                                    </div>

                                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-sm font-medium text-red-700 mb-1">Expenses</p>
                                        <p className="text-xl font-bold text-red-600">
                                            {formatCurrency(dept.expenses_spent)}
                                        </p>
                                    </div>

                                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-sm font-medium text-blue-700 mb-1">Net</p>
                                        <p className={`text-xl font-bold ${dept.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {formatCurrency(dept.net_profit)}
                                        </p>
                                    </div>
                                </div>

                                {/* Test Button */}
                                <div className="mb-4">
                                    <a
                                        href={`/expenses/${dept.department_id}`}
                                        className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg text-center font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        View Department Details
                                    </a>
                                </div>

                                {/* Stages */}
                                {dept.stages.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground mb-2">Stages</h4>
                                        {dept.stages.map((stage, index) => (
                                            <div key={index} className="p-3 bg-secondary rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-foreground text-sm">{stage.stage_name}</span>
                                                    <div className="text-right">
                                                        <p className="font-bold text-red-600">{formatCurrency(stage.stage_total_spent)}</p>
                                                        <p className="text-xs text-muted-foreground">{stage.line_items_count} items</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}


