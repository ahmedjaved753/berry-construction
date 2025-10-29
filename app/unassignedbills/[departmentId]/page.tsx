"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar, SidebarToggle } from "@/components/navigation/sidebar";
import { UnassignedBillsList } from "@/components/expenses/unassigned-bills-list";
import {
  ArrowLeft,
  Building2,
  AlertCircle,
  FileWarning,
} from "lucide-react";

interface DepartmentInfo {
  id: string;
  name: string;
  status: string;
}

interface UnassignedBill {
  xero_invoice_id: string;
  contact_name: string;
  invoice_date: string;
  total_amount: number;
  reference: string | null;
  status: string;
  line_items_count: number;
}

interface Summary {
  total_bills: number;
  total_amount: number;
  department_name: string;
}

export default function UnassignedBillsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [departmentInfo, setDepartmentInfo] = useState<DepartmentInfo | null>(null);
  const [bills, setBills] = useState<UnassignedBill[]>([]);
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

    fetchUnassignedBills();
  }, [user, departmentId, statusFilter]);

  const fetchUnassignedBills = async () => {
    try {
      setLoading(true);
      console.log("🚀 Fetching unassigned bills for department:", departmentId);

      const response = await fetch(
        `/api/departments/${departmentId}/unassigned-bills?status=${statusFilter}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch unassigned bills");
      }

      const data = await response.json();
      console.log("✅ Unassigned bills data received:", data);

      setDepartmentInfo(data.department);
      setBills(data.unassignedBills || []);
      setSummary(data.summary);
    } catch (err: any) {
      console.error("💥 Error fetching unassigned bills:", err);
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
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

        <div className="md:ml-64 min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to Load Unassigned Bills
              </h3>
              <p className="text-muted-foreground mb-4">
                {error || "Unable to load unassigned bills for this department."}
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
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <SidebarToggle isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => router.push(`/expenses/${departmentId}`)}
              variant="outline"
              className="mb-4 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Department
            </Button>

            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl shadow-lg">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-1">
                  {departmentInfo.name} - Unassigned Bills
                </h1>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-200"
                  >
                    {departmentInfo.status}
                  </Badge>
                  <span className="flex items-center">
                    <FileWarning className="h-4 w-4 mr-1" />
                    {summary?.total_bills || 0} unassigned bills
                  </span>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-full w-32"></div>
          </div>

          {/* Summary Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-amber-100 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 mb-2">
                    Total Unassigned Amount
                  </p>
                  <p className="text-4xl font-bold text-amber-900">
                    {formatCurrency(summary?.total_amount || 0)}
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    From {summary?.total_bills || 0}{" "}
                    {summary?.total_bills === 1 ? "bill" : "bills"}
                  </p>
                </div>
                <div className="p-4 bg-amber-500 rounded-2xl">
                  <AlertCircle className="h-12 w-12 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unassigned Bills List */}
          <Card className="border-0 shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-foreground">
                <FileWarning className="h-6 w-6 mr-3 text-amber-600" />
                Unassigned Bills
                <Badge
                  variant="outline"
                  className="ml-auto bg-amber-100 text-amber-800 border-amber-200"
                >
                  {bills.length} bills
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <UnassignedBillsList bills={bills} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
