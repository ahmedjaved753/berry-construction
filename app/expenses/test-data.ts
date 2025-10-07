// Test data for expenses page development
export const mockDepartmentData = [
  {
    department_name: "23 St Marys Gate",
    department_id: "dept-1",
    total_invoices: 8,
    income_received: 15000,
    expenses_spent: 8500,
    net_profit: 6500,
    latest_activity: "2025-10-01",
    income_invoices: 3,
    expense_invoices: 5,
    stages: [
      {
        stage_name: "11 - Dry Lining / Plastering",
        stage_id: "stage-1",
        line_items_count: 12,
        stage_total_spent: 3200,
        avg_line_amount: 266.67,
        latest_stage_activity: "2025-10-01T10:30:00Z",
      },
      {
        stage_name: "4 - Superstructure",
        stage_id: "stage-2",
        line_items_count: 8,
        stage_total_spent: 5300,
        avg_line_amount: 662.5,
        latest_stage_activity: "2025-09-28T14:15:00Z",
      },
    ],
  },
  {
    department_name: "Slack Lane",
    department_id: "dept-2",
    total_invoices: 5,
    income_received: 8000,
    expenses_spent: 12000,
    net_profit: -4000,
    latest_activity: "2025-09-28",
    income_invoices: 2,
    expense_invoices: 3,
    stages: [
      {
        stage_name: "3 - Drainage",
        stage_id: "stage-3",
        line_items_count: 15,
        stage_total_spent: 7200,
        avg_line_amount: 480,
        latest_stage_activity: "2025-09-28T09:45:00Z",
      },
      {
        stage_name: "2 - Substructures",
        stage_id: "stage-4",
        line_items_count: 6,
        stage_total_spent: 4800,
        avg_line_amount: 800,
        latest_stage_activity: "2025-09-25T16:20:00Z",
      },
    ],
  },
];

export const mockSummaryData = {
  totalIncome: 23000,
  totalExpenses: 20500,
  totalNet: 2500,
  totalDepartments: 2,
};


