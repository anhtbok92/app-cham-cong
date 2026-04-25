import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createNotification({
  userId,
  title,
  message,
  type = "system"
}: {
  userId: string;
  title: string;
  message: string;
  type?: "attendance" | "leave" | "system";
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      },
    }
  );

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type
  });

  if (error) console.error("Notification Error:", error);
}
