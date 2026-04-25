"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface LoginResult {
  error?: string;
}

/**
 * Server action: sign in with email and password.
 * On success, redirects to the appropriate dashboard based on role (Req 1.1, 1.3).
 * On failure, returns an error message (Req 1.2).
 */
export async function login(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email và mật khẩu không được để trống." };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  // Fetch role to determine redirect target
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Không thể xác thực người dùng." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const destination =
    profile?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  redirect(destination);
}

/**
 * Server action: sign out and redirect to login page (Req 1.5).
 */
export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
