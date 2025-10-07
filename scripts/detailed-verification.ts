#!/usr/bin/env tsx

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verify() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("\n🔍 DETAILED BATCH VERIFICATION");
  console.log("===============================\n");

  const { data: connection } = await supabase
    .from("xero_connections")
    .select("user_id")
    .eq("is_active", true)
    .single();

  const userId = connection?.user_id;

  // Get ALL line items ordered by creation time
  const { data: allLineItems } = await supabase
    .from("invoice_line_items")
    .select("id, invoice_id, xero_line_item_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  console.log(`📊 TOTAL DATABASE STATE:`);
  console.log(`   Total line items: ${allLineItems?.length || 0}`);

  // Check for duplicates
  const xeroIds = new Set<string>();
  const invoiceIds = new Set<string>();
  let duplicateCount = 0;

  allLineItems?.forEach(item => {
    if (item.xero_line_item_id) {
      if (xeroIds.has(item.xero_line_item_id)) {
        duplicateCount++;
        console.log(`   ⚠️  Duplicate: ${item.xero_line_item_id}`);
      }
      xeroIds.add(item.xero_line_item_id);
    }
    invoiceIds.add(item.invoice_id);
  });

  console.log(`   Unique invoices with line items: ${invoiceIds.size}`);
  console.log(`   Unique Xero line item IDs: ${xeroIds.size}`);
  console.log(`   Duplicate line items: ${duplicateCount}\n`);

  // Show the two most recent batch runs based on timestamp clustering
  if (allLineItems && allLineItems.length > 0) {
    console.log("📅 MOST RECENT LINE ITEMS (last 400):");

    const recent400 = allLineItems.slice(0, 400);
    const invoicesInRecent = new Set(recent400.map(i => i.invoice_id));

    console.log(`   Line items: ${recent400.length}`);
    console.log(`   Unique invoices: ${invoicesInRecent.size}`);
    console.log(`   Date range: ${recent400[recent400.length - 1]?.created_at} to ${recent400[0]?.created_at}\n`);

    // Show first 10 and last 10 invoice IDs to verify they're different
    const firstBatchInvoices = new Set(allLineItems.slice(0, 200).map(i => i.invoice_id));
    const secondBatchInvoices = new Set(allLineItems.slice(200, 400).map(i => i.invoice_id));

    const overlap = new Set([...firstBatchInvoices].filter(x => secondBatchInvoices.has(x)));

    console.log("🔄 BATCH COMPARISON:");
    console.log(`   First 200 items: ${firstBatchInvoices.size} unique invoices`);
    console.log(`   Next 200 items: ${secondBatchInvoices.size} unique invoices`);
    console.log(`   Overlapping invoices: ${overlap.size}\n`);

    if (overlap.size > 0) {
      console.log("   ⚠️  WARNING: Some invoices appear in both batches!");
      console.log(`   This could mean invoices were reprocessed.\n`);
    } else {
      console.log("   ✅ No overlap - batches processed different invoices!\n");
    }
  }

  // Final verdict
  console.log("✅ FINAL VERDICT:");
  if (duplicateCount === 0) {
    console.log("   ✅ NO DUPLICATES - Each line item exists exactly once");
  } else {
    console.log(`   ⚠️  ${duplicateCount} DUPLICATE LINE ITEMS FOUND`);
  }

  console.log(`   ✅ Database has ${invoiceIds.size} invoices with line items`);
  console.log(`   ✅ Total ${allLineItems?.length || 0} line items stored\n`);
}

verify().catch(console.error);
