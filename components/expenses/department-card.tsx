"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BudgetEditDialog } from "./budget-edit-dialog";
import {
    Calendar,
    Calculator,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Building2,
    PoundSterling,
    ArrowRight,
    Eye,
    Pencil,
    AlertTriangle
} from "lucide-react";

interface Stage {
    stage_name: string;
    stage_id: string;
    line_items_count: number;
    stage_total_spent: number;
    budgeted_amount: number;
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
    const router = useRouter();
    const [editingStage, setEditingStage] = useState<Stage | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleEditBudget = (stage: Stage) => {
        setEditingStage(stage);
        setIsDialogOpen(true);
    };

    const handleSaveBudget = async (amount: number) => {
        if (!editingStage) return;

        try {
            const response = await fetch(
                `/api/departments/${department_id}/stages/${editingStage.stage_id}/budget`,
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
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
                    <div
                        onClick={() => router.push(`/departmentincome/${department_id}`)}
                        className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
                            <p className="text-sm font-medium text-emerald-700">Income</p>
                        </div>
                        <p className="text-xl font-bold text-emerald-600 mb-1">
                            {formatCurrency(income_received)}
                        </p>
                        <p className="text-xs text-emerald-600/70">{income_invoices} invoices</p>
                        <p className="text-xs text-emerald-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View details →
                        </p>
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
                            <PoundSterling className={`h-4 w-4 mr-1 ${getProfitabilityColor(net_profit)}`} />
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

                        <div className="space-y-3">
                            {stages.map((stage, index) => {
                                const hasBudget = stage.budgeted_amount > 0;
                                const budgetPercentage = hasBudget
                                    ? Math.min((stage.stage_total_spent / stage.budgeted_amount) * 100, 150)
                                    : 0;
                                const isOverBudget = hasBudget && stage.stage_total_spent > stage.budgeted_amount;
                                const overBudgetAmount = isOverBudget
                                    ? stage.stage_total_spent - stage.budgeted_amount
                                    : 0;

                                return (
                                    <div key={`${stage.stage_id || index}-${stage.stage_name}`} className="relative">
                                        {/* Stage Progress Bar Background */}
                                        <div className={`h-16 rounded-lg border overflow-hidden ${
                                            !hasBudget
                                                ? 'bg-gray-50 border-dashed border-gray-300'
                                                : isOverBudget
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-gray-50 border-gray-200'
                                        }`}>
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
                                        </div>

                                        {/* Stage Content */}
                                        <div className="absolute inset-0 flex items-center justify-between p-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-gray-900 text-sm truncate">
                                                        {stage.stage_name}
                                                    </p>
                                                    {isOverBudget && (
                                                        <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                        {stage.line_items_count} items
                                                    </span>
                                                    {hasBudget ? (
                                                        <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                            {budgetPercentage.toFixed(0)}% of budget
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 font-medium">No budget set</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right ml-4 flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <p className={`font-bold text-sm ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {formatCurrency(stage.stage_total_spent)}
                                                        </p>
                                                        {hasBudget && (
                                                            <p className="text-xs text-gray-500">
                                                                of {formatCurrency(stage.budgeted_amount)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleEditBudget(stage)}
                                                        className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                                                        title="Edit budget"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                                    </button>
                                                </div>
                                                {isOverBudget && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        +{formatCurrency(overBudgetAmount)} over
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>

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
                    departmentId={department_id}
                    stageId={editingStage.stage_id}
                />
            )}
        </Card>
    );
}
