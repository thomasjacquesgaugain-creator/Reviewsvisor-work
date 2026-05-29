// supabase/functions/generate-smart-objective/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
type OutputLanguage = 'fr' | 'en';


/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

function getOutputLanguageName(language: OutputLanguage): string {
  return language === 'fr' ? 'French' : 'English';
}

function normalizeLanguage(code: string | null | undefined): OutputLanguage {
  const normalized = String(code || '').trim().toLowerCase();

  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('fr')) return 'fr';

  return 'fr';
}

function getLanguageInstruction(language: OutputLanguage): string {
  return `All output text values in the JSON must be in ${getOutputLanguageName(language)}. Keep JSON keys exactly as requested and do not translate the field names.`;
}


// Spec §7.2 — effort → deadline months lookup table
const DEADLINE_BY_EFFORT: Record<string, number> = {
  Low:    2,
  Medium: 3,
  High:   6,
};

// Spec §7.2 — effort → priority
const PRIORITY_BY_EFFORT: Record<string, string> = {
  Low:    "low",
  Medium: "medium",
  High:   "high",
};

// Spec §7.2 — impact + effort → quadrant
function getQuadrant(impact: string, effort: string): string {
  if (impact === "High" && effort === "Low")    return "quick_win";
  if (impact === "High" && effort === "Medium") return "quick_win";
  if (impact === "High" && effort === "High")   return "strategic";
  if (impact === "Medium" && effort === "Low")  return "minor";
  if (impact === "Medium" && effort === "Medium") return "minor";
  if (impact === "Low"    && effort === "High") return "avoid";
  return "minor";
}

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    /* ── Auth ── */
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    /* ── Parse body ── */
    const body = await req.json();
    const {
      establishment_id,
      pareto_cause,
      // Deterministic values computed by computePriorities() on frontend
      // AI never changes these — it only writes prose
      computed_count,
      computed_target,
      computed_impact,
      computed_effort,          // from questionnaire if submitted, else auto
      computed_deadline_months, // from effort lookup table
      computed_quadrant,
      pareto_percentage,
      // Questionnaire data
      ishikawa_top_category,
      effort_source,            // "user_questionnaire" | "auto_detected"
      questionnaire_scores, 
      language    // raw 5M scores object or null
    } = body;
    const establishmentId = establishment_id ?? body.establishmentId;
    if (!establishmentId || !pareto_cause) {
      return json({ ok: false, error: "missing required params: place_id, pareto_cause" }, 400);
    }


    //fetching place id from establishment table first with user _>auth and to use place id to fetch review insight

      const { data: estab, error: estabError } = await supabase
      .from("establishments")
      .select(`
        place_id
      `)
      .eq("id", establishmentId)
      .eq("user_id", user.id)
      .single();

      console.log("estab",estab)

      if(!estab.place_id){
        return json({ ok: false, error: "unable to fetch place id" }, 400);
      }

    /* ── Fetch review_insights — no re-analysis needed ── */
    const { data: insight, error: insightError } = await supabase
      .from("review_insights")
      .select(`
        business_type,
        avg_rating,
        total_count,
        top_issues,
        summary_what_customers_hate,
        recommendations_quick_wins,
        pain_points_prioritized
      `)
      .eq("place_id", estab.place_id)
      .eq("user_id", user.id)
      .single();

    if (insightError || !insight) {
      return json({ ok: false, error: "no review insights found for this establishment" }, 404);
    }


    const complaintsRaw = insight.summary_what_customers_hate;
    let complaints: string[] = [];
    if (Array.isArray(complaintsRaw)) {
      complaints = complaintsRaw;
    } else if (typeof complaintsRaw === "string") {
      try {
        complaints = JSON.parse(complaintsRaw);
      } catch {
        complaints = [complaintsRaw]; // fallback: single string
      }
    }
    const complaintsText =
    complaints
      .filter((c) =>
        c.toLowerCase().includes(pareto_cause.toLowerCase())
      )
      .slice(0, 5)
      .join("\n") || "General dissatisfaction mentioned in reviews";

      // language extractions
    const outputLanguage = normalizeLanguage(language);
    const languageInstruction = getLanguageInstruction(outputLanguage);
    /* ── Build deadline from effort ── */
    const deadlineMonths = computed_deadline_months
      ?? DEADLINE_BY_EFFORT[computed_effort]
      ?? 3;

    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + deadlineMonths);
    const deadlineStr = deadline.toISOString().split("T")[0];

    /* ── Related quick wins from existing analysis ── */
    const relatedActions = (insight.recommendations_quick_wins ?? [])
      .filter((r: any) =>
        r.title?.toLowerCase().includes(pareto_cause.toLowerCase()) ||
        r.details?.toLowerCase().includes(pareto_cause.toLowerCase())
      )
      .slice(0, 3);

    /* ── Questionnaire context for AI prompt ── */
    const questionnaireContext = questionnaire_scores
      ? `
User questionnaire responses (5M Ishikawa):
- Manpower (staff/training): ${questionnaire_scores.manpower ?? "not answered"}/4
- Method (procedures): ${questionnaire_scores.method ?? "not answered"}/4
- Machine (tools/equipment): ${questionnaire_scores.machine ?? "not answered"}/4
- Material (products): ${questionnaire_scores.material ?? "not answered"}/4
- Measurement (environment): ${questionnaire_scores.measurement ?? "not answered"}/4
Dominant root cause identified by user: ${ishikawa_top_category}
Effort level (user-validated): ${computed_effort}
`
      : `Effort level (auto-detected from Ishikawa category): ${computed_effort}`;

    /* ── AI prompt ── 
       AI only writes prose — all numbers are pre-computed and injected as facts
       This solves the "inconsistent prioritization" critique from the other AI
    ── */
    const prompt = `
You are a business improvement consultant writing a SMART objective for a ${insight.business_type}${languageInstruction}.


FIXED VALUES — do not change these numbers, they are computed from real review data:
- Problem area: "${pareto_cause}"
- Current negative mentions: ${computed_count}
- Target (50% reduction formula): ${computed_target}
- Impact level: ${computed_impact} (based on ${computed_count} mentions out of total negatives)
- Effort level: ${computed_effort}
- Deadline: ${deadlineMonths} months (${deadlineStr})
- Priority quadrant: ${computed_quadrant}

${questionnaireContext}

Customer complaints about this issue:
${complaintsText}

Related improvement actions already identified:
${relatedActions.map((a: any) => `- ${a.title}: ${a.details}`).join("\n") || "None identified yet"}

YOUR JOB: Write only the descriptive text fields. Do not suggest different numbers.
Return ONLY valid JSON, no markdown,7. ${languageInstruction}:
{
  "problem": "one clear sentence — what specifically needs to improve for this ${insight.business_type}",
  "kpi_label": "metric name to track (4 words max)",
  "unit": "negative reviews | mentions | percent",
  "relevance_note": "one sentence — direct impact on revenue or customer loyalty",
  "actions": [
    { "text": "concrete action using vocabulary of a ${insight.business_type}", "frequency": "daily|weekly|monthly|once", "completed": false },
    { "text": "second action step", "frequency": "daily|weekly|monthly|once", "completed": false },
    { "text": "third action step", "frequency": "daily|weekly|monthly|once", "completed": false }
  ],
  "ai_confidence": <0.0 to 1.0 — how clear the review signals were>
}`;

    /* ── Call OpenAI ── */
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,        // low temp = consistent output
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write SMART objective descriptions for business improvement plans. Never change the provided numbers. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return json({ ok: false, error: `OpenAI error: ${errText}` }, 500);
    }

    const aiData = await aiResp.json();
    const aiFields = JSON.parse(
      aiData.choices?.[0]?.message?.content ?? "{}"
    );

    /* ── Build final smart_objective object
       Deterministic fields = source of truth
       AI fields = prose only
    ── */
    const smartObjective = {
      // Identity
      establishment_id:establishmentId,
      user_id: user.id,
      place_id:estab.place_id,

      // Source
      pareto_cause,
      pareto_count:       computed_count,
      pareto_percentage:  pareto_percentage,

      // Ishikawa / Questionnaire
      ishikawa_top_category: ishikawa_top_category ?? null,
      questionnaire_scores:  questionnaire_scores  ?? null,
      effort:                computed_effort,
      effort_source:         effort_source ?? "auto_detected",

      // Impact / Matrix
      impact:   computed_impact,
      quadrant: computed_quadrant ?? getQuadrant(computed_impact, computed_effort),

      // SMART — deterministic numbers
      current_value:           computed_count,
      target_value:            computed_target,
      computed_target:         computed_target,
      computed_deadline_months: deadlineMonths,
      deadline:                deadlineStr,
      duration_months:         deadlineMonths,
      target_source:           "computed",
      deadline_source:         "computed",

      // SMART — AI prose
      problem:        aiFields.problem        ?? `Reduce ${pareto_cause} issues`,
      kpi_label:      aiFields.kpi_label      ?? `${pareto_cause} mentions`,
      unit:           aiFields.unit           ?? "negative reviews",
      relevance_note: aiFields.relevance_note ?? null,
      actions:        aiFields.actions        ?? [],

      // Status
      status:           "todo",
      priority:         PRIORITY_BY_EFFORT[computed_effort] ?? "medium",
      current_progress: computed_count,   // starts at current value

      // AI metadata
      ai_generated:  true,
      ai_confidence: aiFields.ai_confidence ?? null,
    };

    /* ── Save to smart_objectives table ── */
  
   // In generate-smart-objective/index.ts — replace the upsert block

// Check if a row already exists for this establishment + cause
    const { data: existing } = await supabase
      .from("smart_objectives")
      .select("id")
      .eq("establishment_id", establishmentId)
      .eq("pareto_cause", pareto_cause)
      .single();

  let saved;
  let saveError;

if (existing?.id) {
  // Row exists → update it
  const { data, error } = await supabase
    .from("smart_objectives")
    .update(smartObjective)
    .eq("id", existing.id)
    .select()
    .single();
  saved      = data;
  saveError  = error;
} else {
  // No row → insert new
  const { data, error } = await supabase
    .from("smart_objectives")
    .insert(smartObjective)
    .select()
    .single();
  saved      = data;
  saveError  = error;
}

if (saveError) {
  return json({ ok: false, error: saveError.message }, 500);
}

return json({ ok: true, smart_objective: saved });
} catch (err: any) {                                          
    return json({ ok: false, error: err.message ?? "unexpected error" }, 500);
  }
});    