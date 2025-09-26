import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/error?message=session_exchange_failed`
      );
    }

    if (data.session?.user) {
      const user = data.session.user;

      // Verify email confirmation status
      if (user.email_confirmed_at) {
        try {
          // Check if profile is in sync with email confirmation
          const { data: verification } = await supabase.rpc(
            "verify_email_confirmation",
            {
              user_id: user.id,
            }
          );

          if (verification && verification.length > 0) {
            const status = verification[0];

            if (status.needs_sync) {
              await supabase
                .from("profiles")
                .update({
                  email_confirmed_at: user.email_confirmed_at,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);
            }
          }
        } catch (verificationError) {
          // Handle verification error silently
        }
      }

      // Determine redirect based on user role and confirmation status
      if (user.email_confirmed_at) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(
          `${origin}/auth/verify-email?status=pending`
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?message=invalid_callback`);
}
