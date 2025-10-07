import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Generate a random state parameter for CSRF protection
    const state = crypto.randomUUID();

    // Store state in session/cookie for validation (you might want to use a more secure storage)
    const response = NextResponse.json({ success: true });
    response.cookies.set("xero_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
    });

    // Xero OAuth URL
    const clientId = process.env.XERO_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Xero client ID not configured" },
        { status: 500 }
      );
    }

    const redirectUri = `${request.nextUrl.origin}/api/xero/callback`;
    const scope =
      "openid profile email offline_access accounting.transactions accounting.contacts accounting.settings";

    const authUrl = new URL(
      "https://login.xero.com/identity/connect/authorize"
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error("Xero connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Xero connection" },
      { status: 500 }
    );
  }
}
