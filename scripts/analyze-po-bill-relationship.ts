#!/usr/bin/env tsx

/**
 * Analyze Purchase Order to Bill Relationship
 *
 * This script examines the relationship between Purchase Orders and Bills in Xero
 * to understand if POs are converted to bills or if they remain as separate entities.
 *
 * Usage: npx tsx scripts/analyze-po-bill-relationship.ts
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
  Status: string;
  Total?: number;
  Contact?: { Name: string };
  Reference?: string;
}

interface Bill {
  xero_invoice_id: string;
  reference: string | null;
  contact_name: string;
  total: number;
  status: string;
  invoice_date: string;
}

async function analyzePOBillRelationship() {
  console.log("\n🔍 ANALYZING PO-BILL RELATIONSHIP IN XERO\n");
  console.log("==========================================\n");

  try {
    // Step 1: Get Xero connection
    const { data: connection } = await supabase
      .from("xero_connections")
      .select("*")
      .limit(1)
      .single();

    if (!connection) {
      console.log("❌ No Xero connection found!\n");
      return;
    }

    console.log("✅ Connected to Xero\n");

    // Step 2: Fetch Purchase Orders
    console.log("📥 Fetching Purchase Orders from Xero...");
    const poResponse = await fetch(
      "https://api.xero.com/api.xro/2.0/PurchaseOrders",
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Xero-Tenant-Id": connection.tenant_id,
          Accept: "application/json",
        },
      }
    );

    if (!poResponse.ok) {
      console.log(`❌ Failed to fetch POs: ${poResponse.status}\n`);
      return;
    }

    const poData = await poResponse.json();
    const purchaseOrders: PurchaseOrder[] = poData.PurchaseOrders || [];
    console.log(`   Found ${purchaseOrders.length} Purchase Orders\n`);

    // Step 3: Fetch Bills from database
    console.log("📥 Fetching Bills from database...");
    const { data: bills, error } = await supabase
      .from("invoices")
      .select("xero_invoice_id, reference, contact_name, total, status, invoice_date")
      .eq("type", "ACCPAY");

    if (error) {
      console.log(`❌ Database error: ${error.message}\n`);
      return;
    }

    console.log(`   Found ${bills?.length || 0} Bills in database\n`);

    // Step 4: Analyze relationships
    console.log("🔬 ANALYSIS RESULTS\n");
    console.log("===================\n");

    // Count POs by status
    const poByStatus = purchaseOrders.reduce((acc, po) => {
      acc[po.Status] = (acc[po.Status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("📊 Purchase Order Status Breakdown:");
    Object.entries(poByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();

    // Look for potential matches based on PO numbers in bill references
    console.log("🔗 Checking for PO references in Bills...\n");

    const poNumbers = new Set(
      purchaseOrders.map((po) => po.PurchaseOrderNumber).filter(Boolean)
    );

    let matchedBills = 0;
    const matches: Array<{ po: string; bill: Bill }> = [];

    bills?.forEach((bill) => {
      if (bill.reference) {
        // Check if the reference contains a PO number
        const foundPO = Array.from(poNumbers).find((poNum) =>
          bill.reference?.includes(poNum)
        );
        if (foundPO) {
          matchedBills++;
          matches.push({ po: foundPO, bill });
        }
      }
    });

    console.log(`   Bills with PO references: ${matchedBills} out of ${bills?.length || 0}`);
    console.log(`   Match rate: ${bills?.length ? ((matchedBills / bills.length) * 100).toFixed(2) : 0}%\n`);

    // Show sample matches
    if (matches.length > 0) {
      console.log("📋 SAMPLE MATCHED BILLS (First 5):\n");
      matches.slice(0, 5).forEach((match, i) => {
        console.log(`${i + 1}. Bill Reference: ${match.bill.reference}`);
        console.log(`   PO Number: ${match.po}`);
        console.log(`   Contact: ${match.bill.contact_name}`);
        console.log(`   Amount: $${match.bill.total.toFixed(2)}`);
        console.log(`   Status: ${match.bill.status}`);
        console.log();
      });
    }

    // Step 5: Conclusion
    console.log("\n💡 INSIGHTS\n");
    console.log("===========\n");

    console.log("Based on the analysis:\n");

    if (poByStatus.BILLED && poByStatus.BILLED > 0) {
      console.log(`1. ✓ ${poByStatus.BILLED} POs have status "BILLED"`);
      console.log("   This indicates these POs have been converted to bills.\n");
    }

    if (matchedBills > 0) {
      console.log(`2. ✓ ${matchedBills} bills have PO references in their reference field`);
      console.log("   This suggests a workflow where PO numbers are tracked in bills.\n");
    } else {
      console.log("2. ✗ No bills found with PO references in the reference field");
      console.log("   POs and Bills may not be explicitly linked in your workflow.\n");
    }

    console.log("3. XERO WORKFLOW:\n");
    console.log("   In Xero, Purchase Orders are typically:");
    console.log("   a) Created first as a commitment to purchase");
    console.log("   b) Converted to Bills when goods/services are received");
    console.log("   c) The PO status changes to 'BILLED' after conversion");
    console.log("   d) The PO number is often saved in the Bill's reference field\n");

    console.log("4. API LIMITATION:\n");
    console.log("   Xero's API does NOT provide a direct field linking Bills to POs.");
    console.log("   The connection must be inferred from:");
    console.log("   - PO status (BILLED)");
    console.log("   - Bill reference field (may contain PO number)");
    console.log("   - Matching amounts, dates, and contacts\n");

    // Step 6: Recommendations
    console.log("\n💼 RECOMMENDATIONS\n");
    console.log("==================\n");

    console.log("To track PO-Bill relationships, you could:\n");
    console.log("1. Add a purchase_order_number field to your invoices table");
    console.log("2. Parse the reference field to extract PO numbers");
    console.log("3. Match POs to Bills based on:");
    console.log("   - Same contact/vendor");
    console.log("   - Similar amounts");
    console.log("   - Bill date after PO date");
    console.log("   - PO reference in bill reference field\n");

  } catch (error: any) {
    console.log("❌ ERROR:\n");
    console.log(`   ${error.message}\n`);
    console.error(error);
  }
}

// Run the analysis
analyzePOBillRelationship().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
