"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Profile {
  full_name: string;
  avatar_url?: string;
}

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (user && isMounted) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        
        if (data && isMounted) {
          setProfile(data);
        }
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, [supabase]);

  return (
    <header className="flex justify-between items-center px-4 h-16 w-full sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-manrope text-lg font-bold text-blue-700 leading-tight">
            Phòng khám BS Hồng Xuyến
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/notifications" className="p-2 rounded-full hover:bg-slate-50 transition-colors duration-200">
          <span className="material-symbols-outlined text-slate-500">
            notifications
          </span>
        </Link>
      </div>
    </header>
  );
}
