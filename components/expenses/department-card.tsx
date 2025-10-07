"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Calendar,
    Calculator,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Building2,
    DollarSign,
    ArrowRight,
    Eye
} from "lucide-react";

interface Stage {
    stage_name: string;
    stage_id: string;
    line_items_count: number;
    stage_total_spent: number;
    avg_line_amount: number;
    latest_stage_activity: string;
}

interface DepartmentCardProps {
    department_name: string;
    department_id: string;
    income_received: number;
    expenses_spent: number;
    net_profit: number;
    latest_activity: string | null;
    total_invoices: number;
    income_invoices: number;
    expense_invoices: number;
    stages: Stage[];
}

export function DepartmentCard({
    department_name,
    department_id,
    income_received,
    expenses_spent,
    net_profit,
    latest_activity,
    total_invoices,
    income_invoices,
    expense_invoices,
    stages
}: DepartmentCardProps) {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No activity';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    const getProfitabilityColor = (profit: number) => {
        if (profit > 0) return 'text-emerald-600';
        if (profit < 0) return 'text-red-500';
        return 'text-gray-600';
    };

    const getProfitabilityBgColor = (profit: number) => {
        if (profit > 0) return 'bg-emerald-50 border-emerald-200';
        if (profit < 0) return 'bg-red-50 border-red-200';
        return 'bg-gray-50 border-gray-200';
    };

    return (
        <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-white border-0 shadow-md">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {department_name}
                            </CardTitle>
                            <div className="flex items-center text-sm text-gray-500 space-x-3">
                                <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(latest_activity)}
                                </span>
                                <span className="flex items-center">
                                    <Calculator className="h-3 w-3 mr-1" />
                                    {total_invoices} invoices
                                </span>
                            </div>
                        </div>
                    </div>
                    <Badge
                        variant={net_profit >= 0 ? "default" : "destructive"}
                        className={`font-medium ${net_profit >= 0
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                    >
                        {net_profit >= 0 ? 'Profitable' : 'Loss'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Financial Overview */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Income */}
                    <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
                            <p className="text-sm font-medium text-emerald-700">Income</p>
                        </div>
                        <p className="text-xl font-bold text-emerald-600 mb-1">
                            {formatCurrency(income_received)}
                        </p>
                        <p className="text-xs text-emerald-600/70">{income_invoices} invoices</p>
                    </div>

                    {/* Expenses */}
                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center justify-center mb-2">
                            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                            <p className="text-sm font-medium text-red-700">Expenses</p>
                        </div>
                        <p className="text-xl font-bold text-red-600 mb-1">
                            {formatCurrency(expenses_spent)}
                        </p>
                        <p className="text-xs text-red-600/70">{expense_invoices} invoices</p>
                    </div>

                    {/* Net Profit */}
                    <div className={`text-center p-4 rounded-xl border ${getProfitabilityBgColor(net_profit)}`}>
                        <div className="flex items-center justify-center mb-2">
                            <DollarSign className={`h-4 w-4 mr-1 ${getProfitabilityColor(net_profit)}`} />
                            <p className={`text-sm font-medium ${getProfitabilityColor(net_profit)}`}>Net</p>
                        </div>
                        <p className={`text-xl font-bold mb-1 ${getProfitabilityColor(net_profit)}`}>
                            {formatCurrency(net_profit)}
                        </p>
                        <div className="flex items-center justify-center">
                            {net_profit >= 0 ? (
                                <TrendingUp className={`h-3 w-3 ${getProfitabilityColor(net_profit)}`} />
                            ) : (
                                <TrendingDown className={`h-3 w-3 ${getProfitabilityColor(net_profit)}`} />
                            )}
                        </div>
                    </div>
                </div>

                {/* View Details Button */}
                <div className="mb-6">
                    <Link href={`/expenses/${department_id}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                            <Eye className="h-4 w-4 mr-2" />
                            View Detailed Analytics
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>

                {/* Construction Stages */}
                {stages.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                                Construction Stages
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {stages.length} stages
                            </span>
                        </div>

                        <div className="space-y-2">
                            {stages.map((stage, index) => {
                                const maxSpent = Math.max(...stages.map(s => s.stage_total_spent));
                                const widthPercentage = maxSpent > 0 ? (stage.stage_total_spent / maxSpent) * 100 : 0;

                                return (
                                    <div key={`${stage.stage_id || index}-${stage.stage_name}`} className="relative">
                                        {/* Stage Progress Bar Background */}
                                        <div className="h-14 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                                            {/* Progress Bar */}
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-10 transition-all duration-500"
                                                style={{ width: `${widthPercentage}%` }}
                                            />
                                        </div>

                                        {/* Stage Content */}
                                        <div className="absolute inset-0 flex items-center justify-between p-3">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 text-sm mb-1">{stage.stage_name}</p>
                                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                        {stage.line_items_count} items
                                                    </span>
                                                    <span>Avg: {formatCurrency(stage.avg_line_amount)}</span>
                                                </div>
                                            </div>

                                            <div className="text-right ml-4">
                                                <p className="font-bold text-gray-900 text-sm">
                                                    {formatCurrency(stage.stage_total_spent)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(stage.latest_stage_activity)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
