import { useEffect, useState, useCallback } from "react";
import { checkSubscription, type SubscriptionStatus } from "@/lib/stripe";
import { syncEstablishmentBilling } from "@/lib/establishmentBilling";
import { useAuth } from "@/contexts/AuthProvider";

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ subscribed: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription({ subscribed: false });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const status = await checkSubscription();
      setSubscription(status);
      
      // Auto-sync billing if needed
      if (status.billing_sync_needed) {
        console.log('Billing sync needed, syncing...');
        const syncResult = await syncEstablishmentBilling();
        if (syncResult.success) {
          // Refresh subscription status after sync
          const updatedStatus = await checkSubscription();
          setSubscription(updatedStatus);
        }
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(refresh, 60000);
    
    return () => clearInterval(interval);
  }, [refresh]);

  return { subscription, loading, refresh };
}
