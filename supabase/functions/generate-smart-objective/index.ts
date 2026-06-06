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
  return `All output text values in the JSON must be in BOTH English and French as shown in the JSON shape. Keep JSON keys exactly as requested and do not translate field names.`;
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
  if (impact === "High"   && effort === "Low")    return "quick_win";
  if (impact === "High"   && effort === "Medium") return "quick_win";
  if (impact === "High"   && effort === "High")   return "strategic";
  if (impact === "Medium" && effort === "Low")    return "minor";
  if (impact === "Medium" && effort === "Medium") return "minor";
  if (impact === "Low"    && effort === "High")   return "avoid";
  return "minor";
}

/* ─────────────────────────────────────────────
   SYSTEM PROMPT — consultant persona
   Injected as the system message so the persona
   frames every single token the AI generates.
───────────────────────────────────────────── */
const CONSULTANT_SYSTEM_PROMPT = `
You are Reviewsvisor AI — a specialized field consultant who analyzes Google reviews for restaurants, cafés, bars, salons, gyms, and other customer-facing businesses.

Your role is NOT to summarize reviews. Your role is to diagnose operational problems from customer feedback and provide concrete, immediately actionable guidance — exactly as a seasoned on-the-ground consultant would.

You understand: kitchen operations, service flow, the pass, front-of-house management, wait times, mise en place, cleanliness, team organization, and customer experience.

STRICT RULES — violations are not acceptable:
1. NEVER write vague statements such as:
   - "Consult your team"
   - "Talk to your team about it"
   - "Have a meeting"
   - "Improve the service"
   - "Needs analysis"
   - "Worth considering"
   - "To be analyzed"
   If you mention a meeting you MUST specify: with whom, when, on what subject, and what concrete action follows.

2. EVERY recommendation must be:
   - A concrete, specific action
   - Something that can be implemented TODAY or THIS WEEK
   - Tied to actual review evidence (cite counts where available)

3. Speak like a field expert guiding the owner step by step — not like a chatbot generating generic advice.

4. Do not repeat the same idea across different action_plan items.

5. Do not use marketing language or corporate platitudes.

6. All output must be in BOTH English and French, in the exact JSON structure requested.
`;

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
      language,                 // raw 5M scores object or null
    } = body;

    const establishmentId = establishment_id ?? body.establishmentId;
    if (!establishmentId || !pareto_cause) {
      return json({ ok: false, error: "missing required params: place_id, pareto_cause" }, 400);
    }

    /* ── Fetch place_id from establishments ── */
    const { data: estab, error: estabError } = await supabase
      .from("establishments")
      .select("place_id")
      .eq("id", establishmentId)
      .eq("user_id", user.id)
      .single();

    console.log("estab", estab);

    if (!estab?.place_id) {
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

    const outputLanguage = normalizeLanguage(language);
    const paretoCauseEn = pareto_cause?.en || "";
    const paretoCauseFr = pareto_cause?.fr || "";
    const localizedParetoCause = outputLanguage === "fr" ? paretoCauseFr : paretoCauseEn;

    /* ── Extract relevant complaints ── */
    const localizedComplaints = insight.summary_what_customers_hate?.[outputLanguage] || [];
    const complaints = Array.isArray(localizedComplaints) ? localizedComplaints : [];

    const relevantComplaints = complaints
      .filter((c: any) => {
        const theme = typeof c === "string" ? c : c?.theme ?? "";
        return theme.toLowerCase().includes(localizedParetoCause.toLowerCase());
      })
      .slice(0, 5);

    const complaintsText = relevantComplaints.length > 0
      ? relevantComplaints.map((c: any) =>
          typeof c === "string" ? c : `${c.theme}: ${c.reason ?? ""} (${c.count ?? "?"} mentions)`
        ).join("\n")
      : "General dissatisfaction mentioned in reviews";

    /* ── Related quick wins from existing analysis ── */
    const localizedQuickWins = insight.recommendations_quick_wins?.[outputLanguage] || [];
    const relatedActions = (Array.isArray(localizedQuickWins) ? localizedQuickWins : [])
      .filter((r: any) =>
        r.title?.toLowerCase().includes(localizedParetoCause.toLowerCase()) ||
        r.details?.toLowerCase().includes(localizedParetoCause.toLowerCase())
      )
      .slice(0, 3);

    /* ── Pain points context ── */
    const localizedPainPoints = insight.pain_points_prioritized?.[outputLanguage] || [];
    const relevantPainPoint = (Array.isArray(localizedPainPoints) ? localizedPainPoints : [])
      .find((p: any) => p.issue?.toLowerCase().includes(localizedParetoCause.toLowerCase()));

    /* ── Questionnaire context ── */
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

    /* ── Deadline ── */
    const deadlineMonths = computed_deadline_months ?? DEADLINE_BY_EFFORT[computed_effort] ?? 3;
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + deadlineMonths);
    const deadlineStr = deadline.toISOString().split("T")[0];

    /* ── AI PROMPT ──────────────────────────────────────────────────────────
       AI only writes prose — all numbers are pre-computed and injected as facts.
    ─────────────────────────────────────────────────────────────────────── */
    const prompt = `
You are analyzing reviews for a ${insight.business_type} with an average rating of ${insight.avg_rating?.toFixed(1) ?? "N/A"}/5 based on ${insight.total_count ?? "?"} reviews.

FIXED VALUES — do not change these numbers, they are computed from real review data:
- Problem area EN: "${paretoCauseEn}"
- Problem area FR: "${paretoCauseFr}"
- Current negative mentions: ${computed_count}
- Reduction target: ${computed_target} mentions (50% reduction formula)
- Impact level: ${computed_impact} (based on ${computed_count} mentions out of total negatives)
- Effort level: ${computed_effort}
- Deadline: ${deadlineMonths} months (${deadlineStr})
- Priority quadrant: ${computed_quadrant}

${questionnaireContext}

Customer complaints specifically about "${paretoCauseEn}":
${complaintsText}

Related improvement actions already identified from review analysis:
${relatedActions.map((a: any) => `- ${a.title}: ${a.details}`).join("\n") || "None identified yet"}

${relevantPainPoint ? `Pain point context: ${relevantPainPoint.why_it_matters ?? ""} — First step suggested: ${relevantPainPoint.first_step ?? ""}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK: Generate the following sections.
All text must be in BOTH English ("en") and French ("fr").
Do not change any numbers. Return ONLY valid JSON.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — SYNTHESIS
A strategic reading of the reviews focused on "${paretoCauseEn}".
Must include:
- primary_friction: the exact operational breakdown with review count as evidence — name WHERE it occurs (e.g. "at the kitchen pass", "during order taking", "at reception")
- secondary_issues: 2–3 other issues linked to this cause, each specific and operational
- strengths_to_preserve: what is working well that must not be disrupted
- top_priority: the #1 thing to fix and the precise operational reason why
Do NOT write: "There are issues with service." Write exactly what the issue is and where it occurs.

SECTION 2 — SMART OBJECTIVE FIELDS
- problem: one precise sentence naming the operational mechanism that needs to improve for this ${insight.business_type} — not the symptom, the mechanism
- kpi_label: the specific metric being tracked (e.g. "Negative reviews mentioning wait time at the pass")
- unit: unit of measurement
- relevance_note: why reducing this specific issue improves experience and rating — cite the count ${computed_count}

SECTION 3 — ACTION PLAN (4–5 items)
Each item is one complete sentence that covers WHAT to do (specific and concrete), WHY it matters (cite review count as evidence), WHEN exactly to do it, and WHO by role name is responsible.
Rules:
- Every sentence must address a DIFFERENT operational angle of "${paretoCauseEn}"
- Never write "consult your team", "improve service", "discuss with staff" — always name the specific action, the specific role, the specific timing
- Each sentence must be executable THIS WEEK in a ${insight.business_type}
- action_plan.en and action_plan.fr must have the same number of items
- actions array must have exactly one checklist task per action_plan item — same count, same order, action_plan_index must match
- Priority per item: High / Medium / Low based on impact on "${paretoCauseEn}"

Good sentence example for wait time:
"Install a bell at the kitchen pass this week — 24 reviews report cold and late dishes because plates sit uncollected for 5–10 minutes with no alert system — the kitchen manager purchases and installs it before Friday and briefs the kitchen team on firing it every time a dish is plated."

Bad example (never do this):
"Improve coordination between kitchen and dining room."

SECTION 4 — OPERATIONAL CHECKLIST (5–7 items)
Short, verifiable tasks derived directly from the action_plan above.
Each task must be:
- Completable in one shift or one day
- Binary: either done or not — no ambiguity
- Mapped to its action_plan item via action_plan_index (0-based)
Examples: "Verify pass bell works before opening", "Fill in server zone sheet before service", "Log timing for 5 tables per service"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return EXACTLY this JSON shape:
{
  "synthesis": {
    "en": {
      "primary_friction": "<specific operational friction with review count>",
      "secondary_issues": ["<specific issue 1>", "<specific issue 2>"],
      "strengths_to_preserve": ["<strength 1>", "<strength 2>"],
      "top_priority": "<#1 priority and precise operational reason>"
    },
    "fr": {
      "primary_friction": "<friction opérationnelle spécifique avec nombre d'avis>",
      "secondary_issues": ["<problème 1>", "<problème 2>"],
      "strengths_to_preserve": ["<force 1>", "<force 2>"],
      "top_priority": "<priorité n°1 et raison opérationnelle précise>"
    }
  },
  "problem": {
    "en": "<one precise sentence — operational mechanism to improve>",
    "fr": "<version française>"
  },
  "kpi_label": {
    "en": "<specific metric>",
    "fr": "<métrique spécifique>"
  },
  "unit": {
    "en": "negative reviews | mentions | percent",
    "fr": "avis négatifs | mentions | pourcentage"
  },
  "relevance_note": {
    "en": "<why this matters — cite count, explain operational impact>",
    "fr": "<pourquoi cela compte — citer le nombre, expliquer l'impact>"
  },
  "action_plan": {
    "en": [
      { "text": "<one complete sentence: what + why with count + when + who>", "priority": "High | Medium | Low" },
      { "text": "<second action sentence — different operational angle>", "priority": "High | Medium | Low" },
      { "text": "<third action sentence>", "priority": "High | Medium | Low" },
      { "text": "<fourth action sentence>", "priority": "Medium | Low" }
    ],
    "fr": [
      { "text": "<même contenu en français : quoi + pourquoi avec nombre + quand + qui>", "priority": "High | Medium | Low" },
      { "text": "<deuxième phrase d'action>", "priority": "High | Medium | Low" },
      { "text": "<troisième phrase d'action>", "priority": "High | Medium | Low" },
      { "text": "<quatrième phrase d'action>", "priority": "Medium | Low" }
    ]
  },
  "actions": [
    {
      "text": {
        "en": "<short verifiable task derived from action_plan.en[0] — completable in one shift>",
        "fr": "<tâche courte et vérifiable>"
      },
      "frequency": "daily | weekly | monthly | once",
      "action_plan_index": 0,
      "completed": false
    },
    {
      "text": {
        "en": "<short verifiable task derived from action_plan.en[1]>",
        "fr": "<tâche courte et vérifiable>"
      },
      "frequency": "daily | weekly | monthly | once",
      "action_plan_index": 1,
      "completed": false
    },
    {
      "text": {
        "en": "<short verifiable task derived from action_plan.en[2]>",
        "fr": "<tâche courte et vérifiable>"
      },
      "frequency": "daily | weekly | monthly | once",
      "action_plan_index": 2,
      "completed": false
    },
    {
      "text": {
        "en": "<short verifiable task derived from action_plan.en[3]>",
        "fr": "<tâche courte et vérifiable>"
      },
      "frequency": "daily | weekly | monthly | once",
      "action_plan_index": 3,
      "completed": false
    }
  ],
  "ai_confidence": <0.0 to 1.0>
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
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: CONSULTANT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
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
      establishment_id: establishmentId,
      user_id:          user.id,
      place_id:         estab.place_id,

      // Source
      pareto_cause,
      pareto_count:      computed_count,
      pareto_percentage: pareto_percentage,

      // Ishikawa / Questionnaire
      ishikawa_top_category: ishikawa_top_category ?? null,
      questionnaire_scores:  questionnaire_scores  ?? null,
      effort:                computed_effort,
      effort_source:         effort_source ?? "auto_detected",

      // Impact / Matrix
      impact:   computed_impact,
      quadrant: computed_quadrant ?? getQuadrant(computed_impact, computed_effort),

      // SMART — deterministic numbers (never from AI)
      current_value:            computed_count,
      target_value:             computed_target,
      computed_target:          computed_target,
      computed_deadline_months: deadlineMonths,
      deadline:                 deadlineStr,
      duration_months:          deadlineMonths,
      target_source:            "computed",
      deadline_source:          "computed",

      // SMART — AI prose fields
      problem: aiFields.problem ?? {
        en: `Reduce ${paretoCauseEn} issues`,
        fr: `Réduire les problèmes de ${paretoCauseFr}`,
      },
      kpi_label: aiFields.kpi_label ?? {
        en: `${paretoCauseEn} mentions`,
        fr: `Mentions ${paretoCauseFr}`,
      },
      unit: aiFields.unit ?? {
        en: "negative reviews",
        fr: "avis négatifs",
      },
      relevance_note: aiFields.relevance_note ?? {
        en: "Improving this issue may increase customer satisfaction and loyalty.",
        fr: "L'amélioration de ce problème peut augmenter la satisfaction et la fidélité des clients.",
      },

      // Synthesis — strategic reading of reviews
      synthesis: aiFields.synthesis ?? {
        en: { primary_friction: "", secondary_issues: [], strengths_to_preserve: [], top_priority: "" },
        fr: { primary_friction: "", secondary_issues: [], strengths_to_preserve: [], top_priority: "" },
      },

      // Action plan — bilingual { en: [{text, priority}], fr: [{text, priority}] }
      action_plan: aiFields.action_plan ?? { en: [], fr: [] },

      // Checklist — short verifiable tasks mapped to action_plan items
      actions: aiFields.actions ?? [],

      // Status
      status:           "todo",
      priority:         PRIORITY_BY_EFFORT[computed_effort] ?? "medium",
      current_progress: computed_count,

      // AI metadata
      ai_generated:  true,
      ai_confidence: aiFields.ai_confidence ?? null,
    };

    /* ── Upsert to smart_objectives table ── */
    const { data: existing } = await supabase
      .from("smart_objectives")
      .select("id")
      .eq("establishment_id", establishmentId)
      .eq("pareto_cause->>key", pareto_cause.key)
      .single();

    let saved;
    let saveError;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("smart_objectives")
        .update(smartObjective)
        .eq("id", existing.id)
        .select()
        .single();
      saved     = data;
      saveError = error;
    } else {
      const { data, error } = await supabase
        .from("smart_objectives")
        .insert(smartObjective)
        .select()
        .single();
      saved     = data;
      saveError = error;
    }

    if (saveError) {
      return json({ ok: false, error: saveError.message }, 500);
    }

    return json({ ok: true, smart_objective: saved });

  } catch (err: any) {
    return json({ ok: false, error: err.message ?? "unexpected error" }, 500);
  }
});