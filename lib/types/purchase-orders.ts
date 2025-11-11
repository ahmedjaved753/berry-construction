// Purchase Order Types - matching database schema and Xero API structure

// Database type for purchase_orders table
export interface PurchaseOrder {
  id: string;
  user_id: string;
  xero_po_id: string;
  xero_contact_id: string | null;
  xero_tenant_id: string | null;
  po_number: string | null;
  status: string; // DRAFT, SUBMITTED, AUTHORISED, BILLED, DELETED
  reference: string | null;
  contact_name: string | null;
  total: number;
  sub_total: number | null;
  total_tax: number | null;
  currency_code: string;
  date: string | null;
  delivery_date: string | null;
  has_attachments: boolean;
  department_id: string | null;
  stage_id: string | null;
  created_at: string;
  updated_at: string;
}

// Database type for purchase_order_line_items table
export interface PurchaseOrderLineItem {
  id: string;
  user_id: string;
  purchase_order_id: string;
  xero_line_item_id: string | null;
  description: string;
  quantity: number;
  unit_amount: number | null;
  line_amount: number;
  tax_amount: number;
  item_code: string | null;
  account_code: string | null;
  tax_type: string | null;
  department_id: string | null;
  stage_id: string | null;
  xero_tracking_data: any;
  created_at: string;
  updated_at: string;
}

// Xero API response types
export interface XeroPurchaseOrder {
  PurchaseOrderID: string;
  PurchaseOrderNumber: string;
  DateString?: string;
  Date?: string;
  DeliveryDateString?: string;
  DeliveryDate?: string;
  Status: string;
  LineAmountTypes?: string;
  SubTotal?: number;
  TotalTax?: number;
  Total?: number;
  UpdatedDateUTC?: string;
  CurrencyCode?: string;
  Contact?: {
    ContactID: string;
    Name: string;
  };
  Reference?: string;
  HasAttachments?: boolean;
  LineItems?: XeroLineItem[];
}

export interface XeroLineItem {
  LineItemID?: string;
  Description: string;
  Quantity?: number;
  UnitAmount?: number;
  LineAmount: number;
  TaxAmount?: number;
  ItemCode?: string;
  AccountCode?: string;
  TaxType?: string;
  Tracking?: XeroTracking[];
}

export interface XeroTracking {
  TrackingCategoryID: string;
  TrackingOptionID: string;
  Name: string;
  Option: string;
}

// Extended type for display with related data
export interface PurchaseOrderWithDetails extends PurchaseOrder {
  line_items?: PurchaseOrderLineItem[];
  department?: {
    id: string;
    name: string;
  };
  stage?: {
    id: string;
    name: string;
  };
}

// Status enum for type safety
export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  AUTHORISED = "AUTHORISED",
  BILLED = "BILLED",
  DELETED = "DELETED",
}

// Filter options for the UI
export type StatusFilter = "all" | PurchaseOrderStatus;
