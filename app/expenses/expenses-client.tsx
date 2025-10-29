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
    PoundSterling,
    BarChart3,
    Filter,
    X,
    Check,
    ChevronDown,
    Receipt,
    Wallet,
    AlertCircle,
    Star,
} from "lucide-react";

interface DepartmentExpense {
    department_name: string;
    department_id: string;
    department_status: string;
    total_invoices: number;
    income_received: number;
    expenses_spent: number;
    expenses_excl_overheads: number;
    overheads: number;
    unassigned_bills: number;
    gross_profit: number;
    net_profit: number;
    latest_activity: string | null;
    income_invoices: number;
    expense_invoices: number;
    stages: {
        stage_name: string;
        stage_id: string;
        line_items_count: number;
        stage_total_spent: number;
        budgeted_amount: number;
        avg_line_amount: number;
        latest_stage_activity: string;
    }[];
}

interface OverallStats {
    totalIncome: number;
    totalExpenses: number;
    totalExpensesExclOverheads: number;
    totalOverheads: number;
    totalUnassignedBills: number;
    grossProfit: number;
    netProfit: number;
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
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [loadingFavorites, setLoadingFavorites] = useState(true);

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

    // Fetch user's favorite departments on mount
    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await fetch('/api/favorites/departments');
                if (response.ok) {
                    const data = await response.json();
                    setFavoriteIds(data.favoriteIds || []);
                }
            } catch (error) {
                console.error('Failed to fetch favorites:', error);
            } finally {
                setLoadingFavorites(false);
            }
        };

        fetchFavorites();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
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

    // Toggle favorite status for a department
    const toggleFavorite = async (departmentId: string) => {
        const isFavorited = favoriteIds.includes(departmentId);

        // Optimistic update
        setFavoriteIds(prev =>
            isFavorited
                ? prev.filter(id => id !== departmentId)
                : [...prev, departmentId]
        );

        try {
            if (isFavorited) {
                // Remove from favorites
                await fetch(`/api/favorites/departments?departmentId=${departmentId}`, {
                    method: 'DELETE',
                });
            } else {
                // Add to favorites
                await fetch('/api/favorites/departments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ departmentId }),
                });
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            // Revert on error
            setFavoriteIds(prev =>
                isFavorited
                    ? [...prev, departmentId]
                    : prev.filter(id => id !== departmentId)
            );
        }
    };

    // Filter departments based on favorites view and manual selection
    const filteredDepartments = useMemo(() => {
        let filtered = departments;

        // Apply favorites filter if enabled
        if (showOnlyFavorites) {
            filtered = filtered.filter(dept => favoriteIds.includes(dept.department_id));
        }

        // Apply manual department selection filter
        if (selectedDepartmentIds.length > 0) {
            filtered = filtered.filter(dept => selectedDepartmentIds.includes(dept.department_id));
        }

        return filtered;
    }, [departments, showOnlyFavorites, favoriteIds, selectedDepartmentIds]);

    // Stats always show ALL departments (not filtered)
    // This is the key requirement: financial overview remains complete
    const displayStats = overallStats;

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
        <div className="min-h-screen bg-background">
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
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                Department Expenses
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Track income, expenses, and profitability by construction project
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Favorites Toggle */}
                        <div className="inline-flex items-center rounded-md border bg-background p-1 shadow-sm">
                            <Button
                                variant={!showOnlyFavorites ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setShowOnlyFavorites(false)}
                                className="h-8 px-3"
                            >
                                <Building2 className="h-4 w-4 mr-2" />
                                All Projects
                            </Button>
                            <Button
                                variant={showOnlyFavorites ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setShowOnlyFavorites(true)}
                                className="h-8 px-3"
                                disabled={loadingFavorites}
                            >
                                <Star className="h-4 w-4 mr-2" />
                                Favorites
                                {favoriteIds.length > 0 && (
                                    <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                                        {favoriteIds.length}
                                    </Badge>
                                )}
                            </Button>
                        </div>

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

                {/* Overall Stats Cards - 6 cards in 2 rows */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Row 1: Total Income, Total Expenses (excl. overheads), Gross Profit */}

                    {/* Total Income */}
                    <Card className="bg-card border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-400 mb-2">TOTAL INCOME</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCompactCurrency(displayStats.totalIncome)}
                                    </p>
                                    <p className="text-xs text-emerald-400/80 mt-2">
                                        From {displayStats.totalDepartments} departments
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center ring-2 ring-emerald-500/30">
                                    <TrendingUp className="w-7 h-7 text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Expenses (excl. overheads) */}
                    <Card className="bg-card border-l-4 border-rose-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-rose-400 mb-2">TOTAL EXPENSES</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCompactCurrency(displayStats.totalExpensesExclOverheads)}
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
                    <Card className={`bg-card border-l-4 ${displayStats.grossProfit >= 0 ? "border-blue-500" : "border-orange-500"} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${displayStats.grossProfit >= 0 ? "from-blue-500/10" : "from-orange-500/10"} to-transparent pointer-events-none`}></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${displayStats.grossProfit >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                                        GROSS PROFIT
                                    </p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {displayStats.grossProfit >= 0 ? "" : "-"}
                                        {formatCompactCurrency(Math.abs(displayStats.grossProfit))}
                                    </p>
                                    <p className={`text-xs mt-2 ${displayStats.grossProfit >= 0 ? "text-blue-400/80" : "text-orange-400/80"}`}>
                                        Income - Expenses (excl. overheads)
                                    </p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-2 ${displayStats.grossProfit >= 0 ? "bg-blue-500/20 ring-blue-500/30" : "bg-orange-500/20 ring-orange-500/30"}`}>
                                    <BarChart3 className={`w-7 h-7 ${displayStats.grossProfit >= 0 ? "text-blue-400" : "text-orange-400"}`} />
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
                                        {formatCompactCurrency(displayStats.totalOverheads)}
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
                    <Card className={`bg-card border-l-4 ${displayStats.netProfit >= 0 ? "border-indigo-500" : "border-red-500"} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${displayStats.netProfit >= 0 ? "from-indigo-500/10" : "from-red-500/10"} to-transparent pointer-events-none`}></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${displayStats.netProfit >= 0 ? "text-indigo-400" : "text-red-400"}`}>
                                        NET PROFIT
                                    </p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {displayStats.netProfit >= 0 ? "" : "-"}
                                        {formatCompactCurrency(Math.abs(displayStats.netProfit))}
                                    </p>
                                    <p className={`text-xs mt-2 ${displayStats.netProfit >= 0 ? "text-indigo-400/80" : "text-red-400/80"}`}>
                                        {displayStats.netProfit >= 0 ? "Profit" : "Loss"} after overheads
                                    </p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-2 ${displayStats.netProfit >= 0 ? "bg-indigo-500/20 ring-indigo-500/30" : "bg-red-500/20 ring-red-500/30"}`}>
                                    <PoundSterling className={`w-7 h-7 ${displayStats.netProfit >= 0 ? "text-indigo-400" : "text-red-400"}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unassigned Bills */}
                    <Card className="bg-card border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-400 mb-2">UNASSIGNED BILLS</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCompactCurrency(displayStats.totalUnassignedBills)}
                                    </p>
                                    <p className="text-xs text-amber-400/80 mt-2">
                                        Missing department or stage
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center ring-2 ring-amber-500/30">
                                    <AlertCircle className="w-7 h-7 text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Department Cards */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-foreground" />
                        <h2 className="text-2xl font-semibold text-foreground">
                            Projects ({filteredDepartments.length})
                        </h2>
                        {selectedDepartmentIds.length > 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Filtered
                            </Badge>
                        )}
                    </div>

                    {filteredDepartments.length === 0 ? (
                        <Card className="border-2 border-dashed border-border bg-card/50">
                            <CardContent className="p-12 text-center">
                                {showOnlyFavorites ? (
                                    <>
                                        <Star className="w-16 h-16 mx-auto text-amber-400 mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            No favorite departments yet
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Click the star icon on any department card to add it to your favorites
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowOnlyFavorites(false)}
                                            className="mt-4"
                                        >
                                            <Building2 className="h-4 w-4 mr-2" />
                                            Show All Projects
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            {selectedDepartmentIds.length > 0 ? "No matching departments" : "No departments found"}
                                        </h3>
                                        <p className="text-muted-foreground">
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
                                    </>
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
                                    isFavorited={favoriteIds.includes(department.department_id)}
                                    onToggleFavorite={() => toggleFavorite(department.department_id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <Card className="bg-muted border-border">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-foreground">Financial Data Status</h3>
                                <p className="text-sm text-muted-foreground">
                                    Showing <Badge variant="outline" className="mx-1">PAID</Badge> and{" "}
                                    <Badge variant="outline" className="mx-1">AUTHORISED</Badge> invoices only.
                                    Excludes voided and deleted transactions.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
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








