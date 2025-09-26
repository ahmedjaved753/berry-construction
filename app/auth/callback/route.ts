import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const timestamp = new Date().toISOString();

  console.log(`[AUTH-CALLBACK-DEBUG ${timestamp}] 🔄 Processing auth callback`);
  console.log(`[AUTH-CALLBACK-DEBUG ${timestamp}] Code present: ${!!code}`);
  console.log(`[AUTH-CALLBACK-DEBUG ${timestamp}] Next URL: ${next}`);

  if (code) {
    const supabase = await createClient();
    console.log(
      `[AUTH-CALLBACK-DEBUG ${timestamp}] 🔑 Exchanging code for session`
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.log(
        `[AUTH-CALLBACK-DEBUG ${timestamp}] ❌ Session exchange failed:`,
        error
      );
      return NextResponse.redirect(
        `${origin}/auth/error?message=session_exchange_failed`
      );
    }

    if (data.session?.user) {
      const user = data.session.user;
      console.log(
        `[AUTH-CALLBACK-DEBUG ${timestamp}] ✅ Session created for user: ${user.id}`
      );
      console.log(
        `[AUTH-CALLBACK-DEBUG ${timestamp}] User email: ${user.email}`
      );
      console.log(
        `[AUTH-CALLBACK-DEBUG ${timestamp}] Email confirmed: ${
          user.email_confirmed_at ? "YES" : "NO"
        }`
      );
      console.log(
        `[AUTH-CALLBACK-DEBUG ${timestamp}] Confirmed at: ${
          user.email_confirmed_at || "null"
        }`
      );

      // Verify email confirmation status
      if (user.email_confirmed_at) {
        console.log(
          `[AUTH-CALLBACK-DEBUG ${timestamp}] 📧 Email confirmation detected - verifying sync`
        );

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
            console.log(
              `[AUTH-CALLBACK-DEBUG ${timestamp}] Email confirmation status:`,
              {
                userConfirmed: status.user_confirmed,
                profileConfirmed: status.profile_confirmed,
                confirmedAt: status.confirmed_at,
                needsSync: status.needs_sync,
              }
            );

            if (status.needs_sync) {
              console.log(
                `[AUTH-CALLBACK-DEBUG ${timestamp}] 🔧 Profile needs sync - updating`
              );
              const { error: syncError } = await supabase
                .from("profiles")
                .update({
                  email_confirmed_at: user.email_confirmed_at,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

              if (syncError) {
                console.log(
                  `[AUTH-CALLBACK-DEBUG ${timestamp}] ⚠️ Profile sync failed:`,
                  syncError
                );
              } else {
                console.log(
                  `[AUTH-CALLBACK-DEBUG ${timestamp}] ✅ Profile synced with email confirmation`
                );
              }
            }
          }
        } catch (verificationError) {
          console.log(
            `[AUTH-CALLBACK-DEBUG ${timestamp}] ⚠️ Email confirmation verification failed:`,
            verificationError
          );
        }
      } else {
        console.log(
          `[AUTH-CALLBACK-DEBUG ${timestamp}] ⚠️ User logged in but email not confirmed`
        );
      }

      // Determine redirect based on user role and confirmation status
      if (user.email_confirmed_at) {
        console.log(
          `[AUTH-CALLBACK-DEBUG ${timestamp}] 🔄 Redirecting confirmed user to: ${next}`
        );
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.log(
          `[AUTH-CALLBACK-DEBUG ${timestamp}] 🔄 Redirecting unconfirmed user to verify-email`
        );
        return NextResponse.redirect(
          `${origin}/auth/verify-email?status=pending`
        );
      }
    }

    console.log(
      `[AUTH-CALLBACK-DEBUG ${timestamp}] ⚠️ Session exchange succeeded but no user data`
    );
  }

  console.log(
    `[AUTH-CALLBACK-DEBUG ${timestamp}] ❌ No auth code provided or other error occurred`
  );
  return NextResponse.redirect(`${origin}/auth/error?message=invalid_callback`);
}
