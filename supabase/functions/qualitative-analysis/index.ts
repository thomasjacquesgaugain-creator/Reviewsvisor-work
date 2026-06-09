import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SERVICE_ROLE = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function discoverStopWordsAndCandidates(reviews: string[]): Promise<{
  stop_words: string[];
  candidate_keywords: string[];
}> {
  // Deduplicate words across all reviews — we only need vocabulary, not sentences
  const allWords = reviews
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëîïôùûüçœæ'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

  // Unique words only — massively reduces token count vs full text
  const uniqueWords = [...new Set(allWords)]
    .filter((w) => w.length > 1)
    // .slice(0, 600) // 600 unique words is plenty
    .join(", ");

  const prompt = [
    {
      role: "system",
      content: `
          You are given a list of customer reviews.

          Your task is to identify stop words ONLY in the language(s) actually present in the provided reviews list.

          A stop word is a linguistic filler word that carries little semantic meaning by itself.

          Examples:
          - pronouns
          - articles
          - conjunctions
          - auxiliary verbs
          - greetings
          - common adverbs
          - generic filler expressions

          Do NOT classify business nouns, products, issues, locations, services, customer observations, or operational attributes as stop words.

          Examples:

          English stop words:
          I, me, my, we, our, you, he, she, it, they,
          a, an, the,you,
          and, or, but, because, if, when,
          is, are, was, were, be, been, being,
          very, really, quite, just, also, still,good,excellent,found,sent
          hello,goodbye,thank, welcome,
          something, anything, everything,owner names,me,my brother,my friend,like,must

          French stop words:
          je, tu, il, elle, nous, vous, ils, elles,
          le, la, les, un, une, des,
          de, du, au, aux, dans, sur, avec,
          et, ou, mais, donc,
          est, sont, était, être,
          très, vraiment, assez,
          bonjour, merci,
          chose, rien, tout, cela, ça


          IMPORTANT:
          - Detect the language automatically from the provided words.
          - Return stop words ONLY from the language(s) found in the input.
          - Never invent stop words from a language that is not present.
          - If reviews are English, return English stop words only.
          - If reviews are French, return French stop words only.
          - If reviews contain multiple languages, return stop words from those languages only.
          - Do NOT translate words.
          - Preserve original spelling and accents.
          - Only return words that actually appear in the provided reviews text.
          - Exclude business-relevant words such as service, staff, food, quality, ambience, price, delivery, support, cleanliness, product, experience, restaurant, cuisine, accueil, service client, personnel, etc.

          Return ONLY unique stop words.

          CRITICAL:

          You are NOT generating a stop-word dictionary.

          You are selecting stop words ONLY from the provided reviews text.

          Every returned word must exactly match a word present in the review text.

          Do not invent new words.
          Do not return multi-word expressions unless they appear exactly in the review text.
          Do not return standard language stop-word lists.

          Rules:
          - Each word may appear only once.
          - No duplicates.
          - Maximum 150 words.
          - Comma-separated.
          - No JSON.
          - No markdown.
          - No explanations.
          `,
    },
    {
      role: "user",
      content: `User reviews:\n\n${reviews}\n\nReturn stop words as a comma-separated list.`,
    },
  ];

  try {
    const resp = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.1,
          max_tokens: 800,
          messages: prompt,
        }),
      },
      25000,
    );

    const data = await resp.json();

    const content = data.choices?.[0]?.message?.content ?? "";

    const stopWords: string[] = content
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    const stopWordSet = new Set(stopWords.map((w) => w.toLowerCase().trim()));

    const candidateKeywords = [
      ...new Set(
        allWords.filter(
          (word) =>
            word.length > 2 && !stopWordSet.has(word.toLowerCase().trim()),
        ),
      ),
    ];

    return {
      stop_words: stopWords,
      candidate_keywords: candidateKeywords,
    };
  } catch (err) {
    console.error("[discoverStopWords] failed:", err);
    return { stop_words: [], candidate_keywords: [] };
  }
}

async function extractKeywords(
  candidateKeywords: string[],
  themes: any[],
): Promise<any[]> {
  if (themes.length === 0) return [];

  const prompt = [
    {
      role: "system",
      content: `
        You are validating business keywords extracted from customer reviews.

        INPUT:
        - Existing theme keys
        - Candidate keywords extracted from reviews

        For each theme_key:

        1. Select only keywords relevant to that theme.
        2. Remove generic words.
        3. Remove duplicates.
        4. Keep only meaningful business insights.
        5. Return 3-5 keywords per theme.
        6. Keywords MUST come directly from the candidate keyword list.
        7. Keywords MUST originate from the review content.
        8. Prefer concrete observations over abstract concepts.
        9. Exclude standalone numbers.Exclude numeric values unless they are part of a meaningful phrase.

        DO NOT:
        - Create new themes.
        - Invent keywords.
        - Translate keywords.
        - Return theme names.
        - Return synonyms of theme names.
        - Return generic praise words.
        - Return generic sentiment words.

        BAD EXAMPLES:

        Theme: food_quality
        food_quality, food, quality, amazing, great, best, awesome

        Theme: service
        service, hospitality, experience

        Theme:price
        2000,4500

        Theme: ambiance
        ambiance, atmosphere quality

        GOOD EXAMPLES:

        Theme: food_quality
        pizza, spicy, peri peri, momos, hard base, pasta

        Theme: service
        friendly, professional, attentive, responsive

        Theme: cleanliness
        cockroach, maintained, hygienic

        Theme: price
        discount, offer, expensive, affordable

        Theme: ambiance
        vibes, party hall, seating, music

        IMPORTANT:

        If a keyword merely repeats the theme name, exclude it.

        Prefer:
        - products
        - issues
        - attributes
        - customer observations

        over:

        - generic feelings
        - generic praise
        - generic review language


        Return JSON:

        {
          "keywords": [
            {
              "theme_key": "",
              "keywords": []
            }
          ]
        }
        `,
            },
            {
              role: "user",
              content: `
        Theme keys: ${themes.map((t: any) => t.key).join(", ")}

        Candidate Keywords:
        ${candidateKeywords.join(", ")}

        Return keywords as JSON.
        `,
    },
  ];

  try {
    const resp = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.1,
          max_tokens: 800,
          response_format: { type: "json_object" },
          messages: prompt,
        }),
      },
      25000,
    );

    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return parsed.keywords ?? [];
  } catch (err) {
    console.error("[extractKeywords] failed:", err);
    return [];
  }
}

async function analyzeQualitativeData(
  reviews: string[],
  themesUniversal: { en: any[]; fr: any[] },
  themesIndustry: { en: any[]; fr: any[] },
  existingStopWords: string[] = [],
) {
  const allThemes = [
    ...(themesUniversal?.en || []),
    ...(themesIndustry?.en || []),
  ];

  const { stop_words, candidate_keywords } =
    await discoverStopWordsAndCandidates(reviews);
  const allStopWords = new Set(
    [...existingStopWords, ...stop_words].map((w) => w.toLowerCase().trim()),
  );

  const filteredCandidateKeywords = candidate_keywords.filter(
    (keyword) => !allStopWords.has(keyword.toLowerCase().trim()),
  );

  const keywords = await extractKeywords(filteredCandidateKeywords, allThemes);

  return {
    stop_words,
    keywords,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { userId, placeId, reviews, themesUniversal, themesIndustry } =
      await req.json();

    const cleanReviews: string[] = (
      Array.isArray(reviews) ? reviews : []
    ).filter((r: any) => typeof r === "string" && r.trim().length > 5);

    console.log(
      `[qualitative-analysis] Processing ${cleanReviews.length} reviews`,
    );

    const { data: existingInsight } = await supabase
      .from("review_insights")
      .select("qualitative_stop_words")
      .eq("user_id", userId)
      .eq("place_id", placeId)
      .single();

    const existingStopWords = existingInsight?.qualitative_stop_words ?? [];

    const result = await analyzeQualitativeData(
      cleanReviews,
      themesUniversal,
      themesIndustry,
      existingStopWords,
    );

    const mergedStopWords = [
      ...new Set([...existingStopWords, ...(result?.stop_words ?? [])]),
    ];

    await supabase
      .from("review_insights")
      .update({
        qualitative_stop_words: mergedStopWords,
        qualitative_keywords: result?.keywords ?? [],
      })
      .eq("user_id", userId)
      .eq("place_id", placeId);

    console.log("[qualitative-analysis] Saved successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        ...cors,
      },
    });
  } catch (err) {
    console.error("[qualitative-analysis]", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...cors,
        },
      },
    );
  }
});
