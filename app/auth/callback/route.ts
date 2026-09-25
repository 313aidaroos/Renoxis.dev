import { safeLocalRedirect } from "@/lib/apixis-redirect";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = searchParams.get("next") ?? "/";
  const next = safeLocalRedirect(requested);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if user has ever set a password (user_metadata.has_password or last_sign_in_at with password)
      // New users from magic link won't have a password set
      const hasPassword = data.user.user_metadata?.has_password;
      
      if (!hasPassword) {
        // First magic-link sign-in, offer password setup
        const setPasswordUrl = new URL(`${origin}/set-password`);
        setPasswordUrl.searchParams.set("next", next);
        return NextResponse.redirect(setPasswordUrl.toString());
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
