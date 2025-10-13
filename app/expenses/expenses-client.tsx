"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DepartmentCard } from "@/components/expenses/department-card";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import {
    TrendingUp,
    TrendingDown,
    Building2,
    DollarSign,
    BarChart3,
    Filter,
    X,
    Check,
    ChevronDown,
    Receipt,
} from "lucide-react";

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
        avg_line_amount: number;
        latest_stage_activity: string;
    }[];
}

interface OverallStats {
    totalIncome: number;
    totalExpenses: number;
    netTotal: number;
    totalDepartments: number;
    totalInvoices: number;
}

interface ExpensesClientProps {
    departments: DepartmentExpense[];
    overallStats: OverallStats;
}

export default function ExpensesClient({ departments, overallStats }: ExpensesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Get status filter from URL or default to paid_authorized
    const statusFilter = searchParams.get('status') || 'paid_authorized';

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Debug logging
    console.log("🔍 [EXPENSES CLIENT] Render:", {
        departmentsCount: departments.length,
        selectedCount: selectedDepartmentIds.length,
        searchQuery
    });

    // Log when departments data changes
    useEffect(() => {
        console.log("📦 [EFFECT] Departments data loaded:", {
            count: departments.length,
            firstThree: departments.slice(0, 3).map(d => d.department_name)
        });
    }, [departments]);

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

    // Filter departments based on selection
    const filteredDepartments = useMemo(() => {
        if (selectedDepartmentIds.length === 0) {
            return departments;
        }
        return departments.filter(dept => selectedDepartmentIds.includes(dept.department_id));
    }, [departments, selectedDepartmentIds]);

    // Calculate filtered stats
    const filteredStats = useMemo(() => {
        const totalIncome = filteredDepartments.reduce((sum, d) => sum + d.income_received, 0);
        const totalExpenses = filteredDepartments.reduce((sum, d) => sum + d.expenses_spent, 0);
        return {
            totalIncome,
            totalExpenses,
            netTotal: totalIncome - totalExpenses,
            totalDepartments: filteredDepartments.length,
            totalInvoices: filteredDepartments.reduce((sum, d) => sum + d.total_invoices, 0),
        };
    }, [filteredDepartments]);

    const toggleDepartment = (departmentId: string) => {
        console.log("📍 [TOGGLE DEPT] departmentId:", departmentId);
        setSelectedDepartmentIds(prev => {
            const newValue = prev.includes(departmentId)
                ? prev.filter(id => id !== departmentId)
                : [...prev, departmentId];
            console.log("📍 [TOGGLE DEPT] Updated selection:", newValue);
            return newValue;
        });
    };

    const clearFilters = () => {
        console.log("🧹 [CLEAR FILTERS] Clearing all filters");
        setSelectedDepartmentIds([]);
        setSearchQuery("");
    };

    const handleStatusFilterChange = (newStatus: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', newStatus);
        router.push(`/expenses?${params.toString()}`);
    };

    // Filter departments for search
    const searchFilteredDepartments = useMemo(() => {
        if (!searchQuery.trim()) return departments;
        const query = searchQuery.toLowerCase();
        return departments.filter(dept =>
            dept.department_name.toLowerCase().includes(query)
        );
    }, [departments, searchQuery]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

            <div className="md:ml-64 min-h-screen p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Department Expenses
                            </h1>
                            <p className="text-slate-600 mt-1">
                                Track income, expenses, and profitability by construction project
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                            <SelectTrigger className="w-[200px]">
                                <Receipt className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid_authorized">Paid & Approved</SelectItem>
                                <SelectItem value="paid">Paid Only</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Department Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full md:min-w-[200px] justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        {selectedDepartmentIds.length === 0
                                            ? "All Departments"
                                            : `${selectedDepartmentIds.length} Selected`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[300px]"
                            >
                                <div className="p-2">
                                    <Input
                                        placeholder="Search departments..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            console.log("🔍 [SEARCH] Query:", e.target.value);
                                            setSearchQuery(e.target.value);
                                        }}
                                        className="h-9"
                                    />
                                </div>
                                <DropdownMenuSeparator />
                                <div className="max-h-[300px] overflow-y-auto">
                                    {searchFilteredDepartments.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-slate-500">
                                            No departments found.
                                        </div>
                                    ) : (
                                        searchFilteredDepartments.slice(0, 50).map((dept) => {
                                            const isSelected = selectedDepartmentIds.includes(dept.department_id);
                                            return (
                                                <DropdownMenuItem
                                                    key={dept.department_id}
                                                    onSelect={(e) => {
                                                        console.log("🎯 [MENU ITEM] onSelect triggered for:", dept.department_name);
                                                        e.preventDefault();
                                                        toggleDepartment(dept.department_id);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <Checkbox
                                                            checked={isSelected}
                                                        />
                                                        <span className="flex-1">{dept.department_name}</span>
                                                        {isSelected && (
                                                            <Check className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )}
                                    {searchFilteredDepartments.length > 50 && (
                                        <div className="p-2 text-xs text-center text-slate-500">
                                            Showing first 50 of {searchFilteredDepartments.length} departments. Use search to find more.
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {selectedDepartmentIds.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-10 px-3"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Overall Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Income */}
                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-700 mb-2">TOTAL INCOME</p>
                                    <p className="text-3xl font-bold text-emerald-900">
                                        {formatCompactCurrency(filteredStats.totalIncome)}
                                    </p>
                                    <p className="text-xs text-emerald-600 mt-2">
                                        From {filteredStats.totalDepartments} departments
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
                                    <p className="text-sm font-medium text-rose-700 mb-2">TOTAL EXPENSES</p>
                                    <p className="text-3xl font-bold text-rose-900">
                                        {formatCompactCurrency(filteredStats.totalExpenses)}
                                    </p>
                                    <p className="text-xs text-rose-600 mt-2">
                                        {filteredStats.totalInvoices} total invoices
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
                        className={`bg-gradient-to-br ${filteredStats.netTotal >= 0
                                ? "from-blue-50 to-indigo-50"
                                : "from-orange-50 to-amber-50"
                            } border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p
                                        className={`text-sm font-medium mb-2 ${filteredStats.netTotal >= 0 ? "text-blue-700" : "text-orange-700"
                                            }`}
                                    >
                                        NET TOTAL
                                    </p>
                                    <p
                                        className={`text-3xl font-bold ${filteredStats.netTotal >= 0 ? "text-blue-900" : "text-orange-900"
                                            }`}
                                    >
                                        {filteredStats.netTotal >= 0 ? "" : "-"}
                                        {formatCompactCurrency(Math.abs(filteredStats.netTotal))}
                                    </p>
                                    <p
                                        className={`text-xs mt-2 ${filteredStats.netTotal >= 0 ? "text-blue-600" : "text-orange-600"
                                            }`}
                                    >
                                        {filteredStats.netTotal >= 0 ? "Profit" : "Loss"}
                                    </p>
                                </div>
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${filteredStats.netTotal >= 0 ? "bg-blue-500" : "bg-orange-500"
                                        }`}
                                >
                                    <DollarSign className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Department Cards */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-slate-700" />
                        <h2 className="text-2xl font-semibold text-slate-800">
                            Projects ({filteredDepartments.length})
                        </h2>
                        {selectedDepartmentIds.length > 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Filtered
                            </Badge>
                        )}
                    </div>

                    {filteredDepartments.length === 0 ? (
                        <Card className="border-2 border-dashed border-slate-300 bg-white/50">
                            <CardContent className="p-12 text-center">
                                <Building2 className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                    {selectedDepartmentIds.length > 0 ? "No matching departments" : "No departments found"}
                                </h3>
                                <p className="text-slate-500">
                                    {selectedDepartmentIds.length > 0
                                        ? "Try clearing your filters to see all departments"
                                        : "Connect your Xero account to sync department data"}
                                </p>
                                {selectedDepartmentIds.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="mt-4"
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredDepartments.map((department) => (
                                <DepartmentCard
                                    key={department.department_id}
                                    department_id={department.department_id}
                                    department_name={department.department_name}
                                    total_invoices={department.total_invoices}
                                    income_received={department.income_received}
                                    expenses_spent={department.expenses_spent}
                                    net_profit={department.net_profit}
                                    latest_activity={department.latest_activity}
                                    income_invoices={department.income_invoices}
                                    expense_invoices={department.expense_invoices}
                                    stages={department.stages}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-slate-800">Financial Data Status</h3>
                                <p className="text-sm text-slate-600">
                                    Showing <Badge variant="outline" className="mx-1">PAID</Badge> and{" "}
                                    <Badge variant="outline" className="mx-1">AUTHORISED</Badge> invoices only.
                                    Excludes voided and deleted transactions.
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Data syncs automatically from Xero every 10 minutes
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
    );
}








