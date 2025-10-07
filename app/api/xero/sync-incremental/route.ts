import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Incremental Xero Sync Endpoint
 *
 * This endpoint syncs Xero data incrementally:
 * - 60-second timeout
 * - Can process ~100-200 invoices per run
 * - Only syncs invoices updated in last 24 hours
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
            currency_code: invoice.CurrencyCode || "USD",
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

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ [Sync] Centralized sync completed in ${duration}s`);

      return NextResponse.json({
        success: true,
        duration_seconds: parseFloat(duration),
        invoices_synced: invoices.length,
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








