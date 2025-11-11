import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { XeroPurchaseOrder, XeroLineItem } from "@/lib/types/purchase-orders";

/**
 * Incremental Xero Sync Endpoint
 *
 * This endpoint syncs Xero data incrementally:
 * - 60-second timeout
 * - Can process ~100-200 invoices per run
 * - Only syncs invoices and purchase orders updated in last 24 hours
 *
 * Can be triggered manually or by Supabase cron jobs
 */
export async function GET(request: NextRequest) {
  // Verify request is authorized (security)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  console.log("🚀 [Sync] Starting centralized admin Xero sync...");

  try {
    const supabase = await createClient();

    // Get admin users
    const { data: adminProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (profileError || !adminProfiles || adminProfiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No admin users found",
      });
    }

    const adminIds = adminProfiles.map(p => p.id);

    // Get THE FIRST active admin Xero connection (centralized model)
    const { data: connection, error: connError } = await supabase
      .from("xero_connections")
      .select("*")
      .in("user_id", adminIds)
      .eq("is_active", true)
      .order("connected_at", { ascending: false })
      .limit(1)
      .single();

    if (connError || !connection) {
      return NextResponse.json({
        success: false,
        message: "No active admin Xero connection found. An admin must connect to Xero first.",
      });
    }

    console.log(`✅ Using centralized admin connection from user ${connection.user_id}`);

    // Sync from the ONE admin connection (centralized model)
    try {
      // Refresh token if needed
      const accessToken = await refreshTokenIfNeeded(connection);

      // Fetch only invoices updated in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      const xeroUrl = `https://api.xero.com/api.xro/2.0/Invoices?where=UpdatedDateUTC>=DateTime(${yesterdayStr.split("T")[0]})&order=UpdatedDateUTC DESC`;

      console.log(`📥 Fetching recent invoices from admin connection...`);

      const response = await fetch(xeroUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Xero-Tenant-Id": connection.tenant_id,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Xero API error: ${response.status}`);
      }

      const data = await response.json();
      const invoices = data.Invoices || [];

      console.log(`   Found ${invoices.length} updated invoices`);

      // Sync to Supabase (all users will see this data)
      if (invoices.length > 0) {
        const invoiceData = invoices
          .filter((inv) => inv.InvoiceID && inv.Status !== "DELETED")
          .map((invoice) => ({
            user_id: connection.user_id, // Admin user ID for tracking only
            xero_invoice_id: invoice.InvoiceID,
            xero_contact_id: invoice.Contact?.ContactID || null,
            type: invoice.Type || "UNKNOWN",
            status: invoice.Status || "UNKNOWN",
            reference: invoice.Reference || null,
            contact_name: invoice.Contact?.Name || null,
            total: parseFloat(invoice.Total) || 0,
            sub_total: parseFloat(invoice.SubTotal) || 0,
            total_tax: parseFloat(invoice.TotalTax) || 0,
            currency_code: invoice.CurrencyCode || "GBP",
            invoice_date: parseDate(invoice.Date),
            due_date: parseDate(invoice.DueDate),
            updated_at: new Date().toISOString(),
          }));

        const { error: syncError } = await supabase
          .from("invoices")
          .upsert(invoiceData, {
            onConflict: "user_id,xero_invoice_id",
          });

        if (syncError) {
          throw syncError;
        }

        console.log(`   ✅ Synced ${invoiceData.length} invoices to centralized database`);
      }

      // Sync Purchase Orders
      console.log(`📥 Fetching recent purchase orders from admin connection...`);

      const poUrl = `https://api.xero.com/api.xro/2.0/PurchaseOrders?where=UpdatedDateUTC>=DateTime(${yesterdayStr.split("T")[0]})`;

      const poResponse = await fetch(poUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Xero-Tenant-Id": connection.tenant_id,
          Accept: "application/json",
        },
      });

      let posSynced = 0;
      let poLineItemsSynced = 0;

      if (poResponse.ok) {
        const poData = await poResponse.json();
        const purchaseOrders: XeroPurchaseOrder[] = poData.PurchaseOrders || [];

        console.log(`   Found ${purchaseOrders.length} updated purchase orders`);

        if (purchaseOrders.length > 0) {
          // Sync purchase orders (including DELETED status)
          const poDataToSync = purchaseOrders
            .filter((po) => po.PurchaseOrderID)
            .map((po) => ({
              user_id: connection.user_id,
              xero_po_id: po.PurchaseOrderID,
              xero_contact_id: po.Contact?.ContactID || null,
              xero_tenant_id: connection.tenant_id,
              po_number: po.PurchaseOrderNumber || null,
              status: po.Status || "UNKNOWN",
              reference: po.Reference || null,
              contact_name: po.Contact?.Name || null,
              total: po.Total || 0,
              sub_total: po.SubTotal || 0,
              total_tax: po.TotalTax || 0,
              currency_code: po.CurrencyCode || "GBP",
              date: parseDate(po.Date || po.DateString),
              delivery_date: parseDate(po.DeliveryDate || po.DeliveryDateString),
              has_attachments: po.HasAttachments || false,
              updated_at: new Date().toISOString(),
            }));

          const { data: syncedPOs, error: poSyncError } = await supabase
            .from("purchase_orders")
            .upsert(poDataToSync, {
              onConflict: "user_id,xero_po_id",
            })
            .select("id, xero_po_id");

          if (poSyncError) {
            console.error(`   ⚠️ Error syncing purchase orders:`, poSyncError.message);
          } else {
            posSynced = syncedPOs?.length || 0;
            console.log(`   ✅ Synced ${posSynced} purchase orders to database`);

            // Sync purchase order line items
            if (syncedPOs && syncedPOs.length > 0) {
              // Create a map of xero_po_id to database id
              const poIdMap = new Map(
                syncedPOs.map(po => [po.xero_po_id, po.id])
              );

              // Get department and stage mappings
              const { data: departments } = await supabase
                .from("departments")
                .select("id, xero_tracking_option_id")
                .eq("user_id", connection.user_id);

              const { data: stages } = await supabase
                .from("stages")
                .select("id, xero_tracking_option_id")
                .eq("user_id", connection.user_id);

              const deptMap = new Map(
                (departments || []).map(d => [d.xero_tracking_option_id, d.id])
              );
              const stageMap = new Map(
                (stages || []).map(s => [s.xero_tracking_option_id, s.id])
              );

              const lineItemsToSync: any[] = [];

              for (const po of purchaseOrders) {
                const dbPoId = poIdMap.get(po.PurchaseOrderID);
                if (!dbPoId || !po.LineItems) continue;

                for (const lineItem of po.LineItems) {
                  let departmentId = null;
                  let stageId = null;

                  // Map tracking categories to departments and stages
                  if (lineItem.Tracking) {
                    for (const tracking of lineItem.Tracking) {
                      if (deptMap.has(tracking.TrackingOptionID)) {
                        departmentId = deptMap.get(tracking.TrackingOptionID);
                      }
                      if (stageMap.has(tracking.TrackingOptionID)) {
                        stageId = stageMap.get(tracking.TrackingOptionID);
                      }
                    }
                  }

                  lineItemsToSync.push({
                    user_id: connection.user_id,
                    purchase_order_id: dbPoId,
                    xero_line_item_id: lineItem.LineItemID || null,
                    description: lineItem.Description || "",
                    quantity: lineItem.Quantity || 1,
                    unit_amount: lineItem.UnitAmount || null,
                    line_amount: lineItem.LineAmount || 0,
                    tax_amount: lineItem.TaxAmount || 0,
                    item_code: lineItem.ItemCode || null,
                    account_code: lineItem.AccountCode || null,
                    tax_type: lineItem.TaxType || null,
                    department_id: departmentId,
                    stage_id: stageId,
                    xero_tracking_data: lineItem.Tracking || null,
                  });
                }
              }

              if (lineItemsToSync.length > 0) {
                // Delete existing line items for these POs and insert new ones
                const poIds = Array.from(poIdMap.values());
                await supabase
                  .from("purchase_order_line_items")
                  .delete()
                  .in("purchase_order_id", poIds);

                const { error: lineItemError } = await supabase
                  .from("purchase_order_line_items")
                  .insert(lineItemsToSync);

                if (lineItemError) {
                  console.error(`   ⚠️ Error syncing PO line items:`, lineItemError.message);
                } else {
                  poLineItemsSynced = lineItemsToSync.length;
                  console.log(`   ✅ Synced ${poLineItemsSynced} PO line items`);
                }
              }
            }
          }
        }
      } else {
        console.log(`   ⚠️ Failed to fetch purchase orders: ${poResponse.status}`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ [Sync] Centralized sync completed in ${duration}s`);

      return NextResponse.json({
        success: true,
        duration_seconds: parseFloat(duration),
        invoices_synced: invoices.length,
        purchase_orders_synced: posSynced,
        po_line_items_synced: poLineItemsSynced,
        admin_user_id: connection.user_id,
        centralized: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`❌ Error in centralized sync:`, error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          centralized: true,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ [Sync] Failed:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        centralized: true,
      },
      { status: 500 }
    );
  }
}

// Helper function to refresh Xero token if needed
async function refreshTokenIfNeeded(connection: any): Promise<string> {
  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 60000;

  // Refresh if expires in less than 5 minutes
  if (minutesUntilExpiry < 5) {
    console.log("🔄 Refreshing token...");

    const response = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens = await response.json();

    // Update connection in Supabase
    const supabase = await createClient();
    await supabase
      .from("xero_connections")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString(),
      })
      .eq("id", connection.id);

    return tokens.access_token;
  }

  return connection.access_token;
}

// Helper to parse Xero dates
function parseDate(dateString: any): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

// Route configuration
export const runtime = "nodejs"; // Use Node.js runtime for longer timeout
export const maxDuration = 60; // Maximum 60 seconds








