import { supabase } from "@/integrations/supabase/client";

export async function refreshAndAnalyze() {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  if (!token) {
    throw new Error("User not authenticated");
  }

  const base = "https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1";

  const call = (fn: string) =>
    fetch(`${base}/${fn}`, { 
      method: "POST", 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    });

  try {
    console.log("Starting reviews refresh and analysis...");
    
    // 1. Collect Google reviews
    const syncResponse = await call("sync-google-reviews");
    const syncResult = await syncResponse.json();
    console.log("Sync result:", syncResult);
    
    if (!syncResult.ok) {
      throw new Error(`Sync failed: ${syncResult.error}`);
    }

    // 2. Analyze with AI
    const analyzeResponse = await call("analyze-reviews");
    const analyzeResult = await analyzeResponse.json();
    console.log("Analysis result:", analyzeResult);
    
    if (!analyzeResult.ok) {
      throw new Error(`Analysis failed: ${analyzeResult.error}`);
    }

    return {
      synced: syncResult.inserted || 0,
      analyzed: analyzeResult.analyzed || 0
    };
  } catch (error) {
    console.error("Error in refreshAndAnalyze:", error);
    throw error;
  }
}