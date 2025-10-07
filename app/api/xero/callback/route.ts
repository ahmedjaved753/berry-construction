import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Extract OAuth parameters
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      console.error("Xero OAuth error:", error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/profile?xero_error=${error}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/profile?xero_error=missing_parameters`
      );
    }

    // Verify state parameter to prevent CSRF attacks
    const storedState = request.cookies.get("xero_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/profile?xero_error=invalid_state`
      );
    }

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/auth/login?message=authentication_required`
      );
    }

    // Exchange authorization code for tokens
    const clientId = process.env.XERO_CLIENT_ID;
    const clientSecret = process.env.XERO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Xero OAuth credentials");
      return NextResponse.redirect(
        `${request.nextUrl.origin}/profile?xero_error=configuration_error`
      );
    }

    const redirectUri = `${request.nextUrl.origin}/api/xero/callback`;

    const tokenResponse = await fetch(
      "https://identity.xero.com/connect/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error("Token exchange failed:", tokenError);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/profile?xero_error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();

    // Get Xero connections (tenants) to extract organization info
    const connectionsResponse = await fetch(
      "https://api.xero.com/connections",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    let orgId = "";
    let orgName = "";
    let tenantId = "";
    let tenantName = "";

    if (connectionsResponse.ok) {
      const connections = await connectionsResponse.json();
      if (connections && connections.length > 0) {
        const connection = connections[0]; // Use first connection
        orgId = connection.id;
        orgName = connection.tenantName;
        tenantId = connection.tenantId;
        tenantName = connection.tenantName;
      }
    }

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Store tokens in database
    const { error: dbError } = await supabase.from("xero_connections").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        org_id: orgId,
        org_name: orgName,
        tenant_id: tenantId,
        tenant_name: tenantName,
        connected_at: new Date().toISOString(),
        last_refreshed_at: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (dbError) {
      console.error("Database error storing Xero connection:", dbError);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/profile?xero_error=database_error`
      );
    }

    // Clear the state cookie
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/profile?xero_connected=true`
    );
    response.cookies.delete("xero_oauth_state");

    return response;
  } catch (error) {
    console.error("Xero callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/profile?xero_error=unexpected_error`
    );
  }
}
