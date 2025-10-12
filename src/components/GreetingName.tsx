import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function GreetingName({ className = "" }: { className?: string }) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const first = session?.user?.user_metadata?.first_name as string | undefined;
      const last = session?.user?.user_metadata?.last_name as string | undefined;
      const email = session?.user?.email || "";
      const fallback = email ? email.split("@")[0] : "Utilisateur";
      const full = [first, last].filter(Boolean).join(" ").trim();
      setName(full || fallback);
    };
    load();
  }, []);

  return (
    <div className={className}>Bonjour, {name}</div>
  );
}
