import { useEffect, useState } from "react";
import { checkSubscription, type SubscriptionStatus } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthProvider";

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ subscribed: false });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setSubscription({ subscribed: false });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const status = await checkSubscription();
      setSubscription(status);
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(refresh, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  return { subscription, loading, refresh };
}
