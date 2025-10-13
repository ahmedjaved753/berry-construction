"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import { DepartmentIncomeList } from "@/components/expenses/department-income-list";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Receipt,
  FileText,
} from "lucide-react";

interface DepartmentInfo {
  id: string;
  name: string;
  status: string;
}

interface IncomeInvoice {
  xero_invoice_id: string;
  contact_name: string;
  invoice_date: string;
  total_amount: number;
  reference: string | null;
  status: string;
}

interface Summary {
  total_income: number;
  invoice_count: number;
  department_name: string;
}

export default function DepartmentIncomePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [departmentInfo, setDepartmentInfo] = useState<DepartmentInfo | null>(null);
  const [invoices, setInvoices] = useState<IncomeInvoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const departmentId = params.departmentId as string;
  const statusFilter = searchParams.get('status') || 'paid_authorized';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (!departmentId) {
      return;
    }

    // Wait for user authentication to be resolved
    if (user === undefined) {
      return;
    }

    fetchIncomeData();
  }, [user, departmentId, statusFilter]);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      console.log("🚀 Fetching income data for department:", departmentId);

      const response = await fetch(
        `/api/departments/${departmentId}/income?status=${statusFilter}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch income data");
      }

      const data = await response.json();
      console.log("✅ Income data received:", data);

      setDepartmentInfo(data.department);
      setInvoices(data.invoices || []);
      setSummary(data.summary);
    } catch (err: any) {
      console.error("💥 Error fetching income data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
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
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load Income Data
              </h3>
              <p className="text-gray-600 mb-4">
                {error || "Unable to load income data for this department."}
              </p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => router.push(`/expenses/${departmentId}`)}
              variant="outline"
              className="mb-4 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Department
            </Button>

            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  {departmentInfo.name} - Income
                </h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-800 border-emerald-200"
                  >
                    {departmentInfo.status}
                  </Badge>
                  <span className="flex items-center">
                    <Receipt className="h-4 w-4 mr-1" />
                    {summary?.invoice_count || 0} income invoices
                  </span>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-full w-32"></div>
          </div>

          {/* Summary Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-2">
                    Total Income
                  </p>
                  <p className="text-4xl font-bold text-emerald-900">
                    {formatCurrency(summary?.total_income || 0)}
                  </p>
                  <p className="text-sm text-emerald-700 mt-2">
                    From {summary?.invoice_count || 0}{" "}
                    {summary?.invoice_count === 1 ? "invoice" : "invoices"}
                  </p>
                </div>
                <div className="p-4 bg-emerald-500 rounded-2xl">
                  <TrendingUp className="h-12 w-12 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income Invoices List */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                <FileText className="h-6 w-6 mr-3 text-emerald-600" />
                Income Invoices
                <Badge
                  variant="outline"
                  className="ml-auto bg-emerald-100 text-emerald-800 border-emerald-200"
                >
                  {invoices.length} invoices
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DepartmentIncomeList invoices={invoices} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
