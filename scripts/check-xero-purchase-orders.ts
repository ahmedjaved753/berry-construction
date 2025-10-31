#!/usr/bin/env tsx

/**
 * Check Xero Purchase Orders Script
 *
 * This script fetches purchase orders from Xero and displays them.
 *
 * Usage: npx tsx scripts/check-xero-purchase-orders.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PurchaseOrder {
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
  BrandingThemeID?: string;
  Reference?: string;
  SentToContact?: boolean;
  DeliveryAddress?: string;
  AttentionTo?: string;
  Telephone?: string;
  DeliveryInstructions?: string;
  HasAttachments?: boolean;
  LineItems?: any[];
}

interface XeroResponse {
  Id: string;
  Status: string;
  ProviderName: string;
  DateTimeUTC: string;
  PurchaseOrders: PurchaseOrder[];
}

async function checkPurchaseOrders() {
  console.log("\n🔍 CHECKING XERO PURCHASE ORDERS\n");
  console.log("=================================\n");

  try {
    // Step 1: Get Xero connection
    console.log("📡 Fetching Xero connection...");
    const { data: connection, error: connectionError } = await supabase
      .from("xero_connections")
      .select("*")
      .limit(1)
      .single();

    if (connectionError || !connection) {
      console.log("❌ No Xero connection found!");
      console.log("   Please connect to Xero first from the /integrations page.\n");
      return;
    }

    console.log(`✅ Found connection for tenant: ${connection.tenant_id}\n`);

    // Step 2: Fetch purchase orders
    console.log("📥 Fetching purchase orders from Xero...");
    console.log("   Endpoint: GET /PurchaseOrders\n");

    const response = await fetch(
      "https://api.xero.com/api.xro/2.0/PurchaseOrders",
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Xero-Tenant-Id": connection.tenant_id,
          Accept: "application/json",
        },
      }
    );

    // Step 3: Check response
    if (response.status === 401) {
      console.log("🔑 AUTHENTICATION ERROR!\n");
      console.log("   Your access token may have expired.");
      console.log("   Try connecting to Xero again from /integrations page.\n");
      return;
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retrySeconds = parseInt(retryAfter || "0");
      console.log("❌ RATE LIMITED!\n");
      console.log(`   Retry after: ${retrySeconds} seconds\n`);
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ ERROR: ${response.status}\n`);
      console.log(`   ${errorText.substring(0, 200)}\n`);
      return;
    }

    const data: XeroResponse = await response.json();
    const purchaseOrders = data.PurchaseOrders || [];

    console.log(`✅ SUCCESS!\n`);
    console.log("📊 PURCHASE ORDER SUMMARY\n");
    console.log("=========================\n");
    console.log(`Total Purchase Orders: ${purchaseOrders.length}\n`);

    if (purchaseOrders.length === 0) {
      console.log("   No purchase orders found in Xero.\n");
      return;
    }

    // Group by status
    const statusCounts: Record<string, number> = {};
    purchaseOrders.forEach((po) => {
      statusCounts[po.Status] = (statusCounts[po.Status] || 0) + 1;
    });

    console.log("By Status:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();

    // Calculate totals
    const totalAmount = purchaseOrders.reduce(
      (sum, po) => sum + (po.Total || 0),
      0
    );
    console.log(`Total Amount: $${totalAmount.toFixed(2)}\n`);

    // Display first 10 purchase orders
    const displayCount = Math.min(10, purchaseOrders.length);
    console.log(`\n📋 FIRST ${displayCount} PURCHASE ORDERS:\n`);
    console.log("=" .repeat(80) + "\n");

    purchaseOrders.slice(0, displayCount).forEach((po, index) => {
      console.log(`${index + 1}. PO #${po.PurchaseOrderNumber || "N/A"}`);
      console.log(`   ID: ${po.PurchaseOrderID}`);
      console.log(`   Contact: ${po.Contact?.Name || "N/A"}`);
      console.log(`   Status: ${po.Status}`);
      console.log(`   Total: $${(po.Total || 0).toFixed(2)}`);
      console.log(`   Date: ${po.Date || po.DateString || "N/A"}`);
      if (po.Reference) {
        console.log(`   Reference: ${po.Reference}`);
      }
      console.log(`   Updated: ${po.UpdatedDateUTC || "N/A"}`);
      console.log();
    });

    if (purchaseOrders.length > displayCount) {
      console.log(
        `... and ${purchaseOrders.length - displayCount} more purchase orders\n`
      );
    }

    // Display detailed breakdown
    console.log("\n💡 TIP: To see all purchase orders, modify the script to save to a file.\n");

  } catch (error: any) {
    console.log("❌ ERROR:\n");
    console.log(`   ${error.message}\n`);
    console.error(error);
  }
}

// Run the check
checkPurchaseOrders().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
