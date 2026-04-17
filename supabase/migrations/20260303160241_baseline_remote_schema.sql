create extension if not exists "pg_cron" with schema "pg_catalog";
create extension if not exists "pg_net" with schema "public";

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";



CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'moderator',
    'worker',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_expired_subscriptions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status IN ('trialing', 'active')
    AND current_period_end < now()
    AND NOT cancel_at_period_end;
END;
$$;


ALTER FUNCTION "public"."check_expired_subscriptions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") RETURNS TABLE("deleted" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count BIGINT := 0;
BEGIN
    -- Delete duplicates, keeping the oldest record for each dedup_key
    WITH duplicates_to_delete AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY COALESCE(dedup_key, id::text)
                   ORDER BY inserted_at ASC
               ) AS rn
        FROM reviews
        WHERE place_id = p_place_id 
          AND user_id = p_user_id
    )
    DELETE FROM reviews 
    WHERE id IN (
        SELECT d.id 
        FROM duplicates_to_delete d 
        WHERE d.rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unique_reviews"("p_place_id" "text", "p_user_id" "uuid") RETURNS TABLE("count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(DISTINCT COALESCE(dedup_key, id::text))::BIGINT
    FROM reviews
    WHERE place_id = p_place_id 
      AND user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."count_unique_reviews"("p_place_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_reviews_summary_with_duplicates"("p_place_id" "text", "p_user_id" "uuid") RETURNS TABLE("total_all" bigint, "total_unique" bigint, "duplicates" bigint, "avg_rating" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_all,
        COUNT(DISTINCT COALESCE(dedup_key, id::text))::BIGINT as total_unique,
        (COUNT(*) - COUNT(DISTINCT COALESCE(dedup_key, id::text)))::BIGINT as duplicates,
        COALESCE(AVG(rating), 0)::NUMERIC as avg_rating
    FROM reviews
    WHERE place_id = p_place_id 
      AND user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_reviews_summary_with_duplicates"("p_place_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_active_establishment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.établissements
    SET is_active = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_active_establishment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    first_name,
    last_name,
    company,
    role
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company', ''),
    'worker'
  );

  RETURN NEW;
END;$function$
;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."identify_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") RETURNS TABLE("duplicate_id" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH ranked_reviews AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY dedup_key 
                   ORDER BY inserted_at ASC
               ) AS rn
        FROM reviews
        WHERE place_id = p_place_id 
          AND user_id = p_user_id
          AND dedup_key IS NOT NULL
    )
    SELECT r.id
    FROM ranked_reviews r
    WHERE r.rn > 1;
END;
$$;


ALTER FUNCTION "public"."identify_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$function$
;


ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end 
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."establishments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "place_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "formatted_address" "text",
    "lat" double precision,
    "lng" double precision,
    "phone" "text",
    "website" "text",
    "rating" numeric,
    "user_ratings_total" integer,
    "types" "jsonb",
    "source" "text" DEFAULT 'google'::"text" NOT NULL,
    "raw" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "icon_type" "text" DEFAULT 'Restaurant'::"text",
    "google_account_id" "text",
    "google_location_id" "text",
    "organization_id" "uuid",
    "city" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'FR'::"text",
    "category" "text",
    "timezone" "text" DEFAULT 'Europe/Paris'::"text",
    "rating_avg_cached" numeric,
    "nom" "text",
    "type" "text",
    "ville" "text",
    "pays" "text",
    "gamme_prix" "text",
    "latitude" "text"
);


ALTER TABLE "public"."establishments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."establishments"."nom" IS 'Nom de l’établissement';



COMMENT ON COLUMN "public"."establishments"."type" IS 'Type d’établissement (bar, restaurant, hôtel…)';



COMMENT ON COLUMN "public"."establishments"."ville" IS 'Ville de l’établissement';



COMMENT ON COLUMN "public"."establishments"."pays" IS 'Pays de l’établissement';



COMMENT ON COLUMN "public"."establishments"."gamme_prix" IS 'Niveau de prix (€, €€, €€€)';



COMMENT ON COLUMN "public"."establishments"."latitude" IS 'Latitude du lieu';



CREATE TABLE IF NOT EXISTS "public"."google_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'google'::"text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scope" "text" DEFAULT 'https://www.googleapis.com/auth/business.manage'::"text"
);


ALTER TABLE "public"."google_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "place_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "inserted_count" integer DEFAULT 0,
    "updated_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."import_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organization_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_establishment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'worker'::"text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "first_name" "text",
    "last_name" "text",
    "display_name" "text" GENERATED ALWAYS AS (TRIM(BOTH FROM ((COALESCE("first_name", ''::"text") || ' '::"text") || COALESCE("last_name", ''::"text")))) STORED,
    "company" "text",
    "monthly_report_enabled" boolean DEFAULT true,
    "report_frequency" "text" DEFAULT 'monthly'::"text",
    "postal_address" "text",
    "avatar_url" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['worker'::"text", 'client'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reponses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "avis_id" "text" NOT NULL,
    "contenu" "text",
    "statut" "text" DEFAULT 'valide'::"text" NOT NULL,
    "validated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "etablissement_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reponses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."review_insights" (
    "user_id" "uuid" NOT NULL,
    "place_id" "text" NOT NULL,
    "total_count" integer,
    "avg_rating" numeric,
    "positive_ratio" numeric,
    "top_praises" "jsonb",
    "top_issues" "jsonb",
    "themes" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "summary" "jsonb" DEFAULT '{}'::"jsonb",
    "last_analyzed_at" timestamp with time zone,
    "business_type" "text",
    "business_type_confidence" numeric,
    "business_type_candidates" "jsonb",
    "business_type_source" "text",
    "analysis_version" "text",
    "themes_universal" "jsonb",
    "themes_industry" "jsonb",
    "pain_points_prioritized" "jsonb",
    "recommendations_quick_wins" "jsonb",
    "recommendations_projects" "jsonb",
    "reply_templates" "jsonb",
    "summary_one_liner" "text",
    "summary_what_customers_love" "text",
    "summary_what_customers_hate" "text"
);


ALTER TABLE "public"."review_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "place_id" "text" NOT NULL,
    "source" "text" NOT NULL,
    "source_review_id" "text" NOT NULL,
    "author" "text",
    "rating" numeric,
    "language" "text",
    "text" "text",
    "published_at" timestamp with time zone,
    "url" "text",
    "raw" "jsonb",
    "inserted_at" timestamp with time zone DEFAULT "now"(),
    "dedup_key" "text",
    "fingerprint" "text",
    "responded_at" timestamp with time zone,
    "ai_response_text" "text",
    "review_id_ext" "text",
    "author_name" "text",
    "language_code" "text",
    "reviewer_profile_url" "text",
    "owner_reply_text" "text",
    "owner_reply_time" timestamp with time zone,
    "create_time" timestamp with time zone,
    "update_time" timestamp with time zone
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reviews_id_seq" OWNED BY "public"."reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."reviews_raw" (
    "id" bigint NOT NULL,
    "place_id" "text" NOT NULL,
    "source" "text" NOT NULL,
    "author" "text",
    "rating" numeric,
    "text" "text",
    "reviewed_at" timestamp with time zone,
    "raw" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "hash" "text",
    "source_ref" "text"
);


ALTER TABLE "public"."reviews_raw" OWNER TO "postgres";


ALTER TABLE "public"."reviews_raw" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."reviews_raw_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "plan_code" "text" DEFAULT 'FREE'::"text" NOT NULL,
    "status" "text" DEFAULT 'trialing'::"text" NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_period_end" timestamp with time zone DEFAULT ("now"() + '14 days'::interval) NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "provider" "text",
    "provider_customer_id" "text",
    "provider_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_check" CHECK ((("user_id" IS NOT NULL) OR ("organization_id" IS NOT NULL))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_entitlements" (
    "user_id" "uuid" NOT NULL,
    "pro_plan_key" "text",
    "pro_status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "pro_current_period_end" timestamp with time zone,
    "addon_multi_etablissements_status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "addon_multi_etablissements_period_end" timestamp with time zone,
    "addon_multi_etablissements_qty" integer DEFAULT 0 NOT NULL,
    "source" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_entitlements_addon_multi_etablissements_status_check" CHECK (("addon_multi_etablissements_status" = ANY (ARRAY['active'::"text", 'inactive'::"text"]))),
    CONSTRAINT "user_entitlements_pro_status_check" CHECK (("pro_status" = ANY (ARRAY['active'::"text", 'inactive'::"text"]))),
    CONSTRAINT "user_entitlements_source_check" CHECK (("source" = ANY (ARRAY['stripe'::"text", 'creator_bypass'::"text"])))
);


ALTER TABLE "public"."user_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_establishment" (
    "user_id" "uuid" NOT NULL,
    "place_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "lat" double precision,
    "lng" double precision,
    "url" "text",
    "website" "text",
    "phone" "text",
    "rating" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_establishment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "place_id" "text",
    "phone_number" "text",
    "website" "text",
    "google_rating" numeric(3,2),
    "opening_hours" "jsonb",
    "location" "public"."geography"(Point,4326),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."établissements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "place_id" "text" NOT NULL,
    "nom" "text" NOT NULL,
    "adresse" "text",
    "telephone" "text",
    "email" "text",
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "website" "text",
    "rating" numeric,
    "google_maps_url" "text",
    "lat" double precision,
    "lng" double precision,
    "user_ratings_total" integer,
    "is_active" boolean DEFAULT false,
    "raw_place_json" "jsonb",
    "type_etablissement" "text"
);


ALTER TABLE "public"."établissements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_connections"
    ADD CONSTRAINT "google_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_connections"
    ADD CONSTRAINT "google_connections_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."reponses"
    ADD CONSTRAINT "reponses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."review_insights"
    ADD CONSTRAINT "review_insights_pkey" PRIMARY KEY ("place_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews_raw"
    ADD CONSTRAINT "reviews_raw_hash_key" UNIQUE ("hash");



ALTER TABLE ONLY "public"."reviews_raw"
    ADD CONSTRAINT "reviews_raw_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_review_id_ext_key" UNIQUE ("review_id_ext");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_place_id_source_source_review_id_key" UNIQUE ("user_id", "place_id", "source", "source_review_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "uniq_user_place" UNIQUE ("user_id", "place_id");



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "unique_user_place" UNIQUE ("user_id", "place_id");



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_establishment"
    ADD CONSTRAINT "user_establishment_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_place_id_key" UNIQUE ("place_id");



ALTER TABLE ONLY "public"."établissements"
    ADD CONSTRAINT "établissements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."établissements"
    ADD CONSTRAINT "établissements_user_id_place_id_key" UNIQUE ("user_id", "place_id");



CREATE INDEX "idx_establishments_org" ON "public"."establishments" USING "btree" ("organization_id");



CREATE INDEX "idx_establishments_place_id" ON "public"."establishments" USING "btree" ("place_id");



CREATE INDEX "idx_etablissements_place" ON "public"."établissements" USING "btree" ("place_id");



CREATE INDEX "idx_etablissements_user" ON "public"."établissements" USING "btree" ("user_id");



CREATE INDEX "idx_import_logs_user_place" ON "public"."import_logs" USING "btree" ("user_id", "place_id", "started_at" DESC);



CREATE UNIQUE INDEX "idx_one_active_per_user" ON "public"."établissements" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX "idx_org_members_org" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_org_members_user" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_owner" ON "public"."organizations" USING "btree" ("owner_user_id");



CREATE INDEX "idx_review_insights_place" ON "public"."review_insights" USING "btree" ("place_id");



CREATE INDEX "idx_reviews_ext_id" ON "public"."reviews" USING "btree" ("review_id_ext");



CREATE UNIQUE INDEX "idx_reviews_fingerprint_unique" ON "public"."reviews" USING "btree" ("place_id", "fingerprint") WHERE ("fingerprint" IS NOT NULL);



CREATE INDEX "idx_reviews_place_create" ON "public"."reviews" USING "btree" ("place_id", "create_time");



CREATE INDEX "idx_reviews_place_id" ON "public"."reviews" USING "btree" ("place_id");



CREATE INDEX "idx_reviews_raw_place" ON "public"."reviews_raw" USING "btree" ("place_id");



CREATE INDEX "idx_reviews_raw_reviewed_at" ON "public"."reviews_raw" USING "btree" ("reviewed_at");



CREATE INDEX "idx_reviews_responded_at" ON "public"."reviews" USING "btree" ("responded_at") WHERE ("responded_at" IS NULL);



CREATE UNIQUE INDEX "idx_reviews_unique_fingerprint" ON "public"."reviews" USING "btree" ("place_id", "user_id", "fingerprint") WHERE ("fingerprint" IS NOT NULL);



CREATE INDEX "idx_subscriptions_org" ON "public"."subscriptions" USING "btree" ("organization_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_user_entitlements_user_id" ON "public"."user_entitlements" USING "btree" ("user_id");



CREATE INDEX "reponses_avis_id_idx" ON "public"."reponses" USING "btree" ("avis_id");



CREATE INDEX "reponses_etab_idx" ON "public"."reponses" USING "btree" ("etablissement_id");



CREATE UNIQUE INDEX "reponses_unique_avis_etabl" ON "public"."reponses" USING "btree" ("avis_id", "etablissement_id");



CREATE UNIQUE INDEX "reponses_unique_validation" ON "public"."reponses" USING "btree" ("avis_id", "user_id", "etablissement_id");



CREATE INDEX "reponses_user_idx" ON "public"."reponses" USING "btree" ("user_id");



CREATE INDEX "reviews_raw_hash_idx" ON "public"."reviews_raw" USING "btree" ("hash");



CREATE UNIQUE INDEX "uniq_review_insights_user_place" ON "public"."review_insights" USING "btree" (COALESCE(("user_id")::"text", ''::"text"), "place_id");



CREATE UNIQUE INDEX "ux_reviews_est_dedup" ON "public"."reviews" USING "btree" ("place_id", "dedup_key") WHERE ("dedup_key" IS NOT NULL);



CREATE UNIQUE INDEX "ux_reviews_place_dedup" ON "public"."reviews" USING "btree" ("place_id", "dedup_key") WHERE ("dedup_key" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trg_etablissements_updated" BEFORE UPDATE ON "public"."établissements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_handle_active_establishment" BEFORE INSERT OR UPDATE ON "public"."établissements" FOR EACH ROW EXECUTE FUNCTION "public"."handle_active_establishment"();



CREATE OR REPLACE TRIGGER "update_establishments_updated_at" BEFORE UPDATE ON "public"."establishments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_google_connections_updated_at" BEFORE UPDATE ON "public"."google_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_entitlements_updated_at" BEFORE UPDATE ON "public"."user_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_establishment_updated_at" BEFORE UPDATE ON "public"."user_establishment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."establishments"
    ADD CONSTRAINT "establishments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_connections"
    ADD CONSTRAINT "google_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_current_establishment_id_fkey" FOREIGN KEY ("current_establishment_id") REFERENCES "public"."establishments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."review_insights"
    ADD CONSTRAINT "review_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_entitlements"
    ADD CONSTRAINT "user_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_establishment"
    ADD CONSTRAINT "user_establishment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."établissements"
    ADD CONSTRAINT "établissements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all roles" ON "public"."user_roles" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Members can view their organizations" ON "public"."organization_members" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Org owners can manage members" ON "public"."organization_members" USING (("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"()))));



CREATE POLICY "Service can insert reviews" ON "public"."reviews_raw" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."user_entitlements" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create their own establishment" ON "public"."user_establishment" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own establishments" ON "public"."establishments" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own organizations" ON "public"."organizations" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can create their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own establishment" ON "public"."user_establishment" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own establishments" ON "public"."establishments" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own google connections" ON "public"."google_connections" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own insights" ON "public"."review_insights" FOR DELETE USING ((("auth"."uid"() = "user_id") AND ("user_id" IS NOT NULL)));



CREATE POLICY "Users can delete their own organizations" ON "public"."organizations" FOR DELETE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can delete their own reviews" ON "public"."reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert reviews for their establishments" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own google connections" ON "public"."google_connections" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own import logs" ON "public"."import_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own insights" ON "public"."review_insights" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("user_id" IS NOT NULL)));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own entitlements" ON "public"."user_entitlements" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own establishment" ON "public"."user_establishment" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own establishments" ON "public"."establishments" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own google connections" ON "public"."google_connections" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own insights" ON "public"."review_insights" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("user_id" IS NOT NULL))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("user_id" IS NOT NULL)));



CREATE POLICY "Users can update their own organizations" ON "public"."organizations" FOR UPDATE USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view import logs for their establishments" ON "public"."import_logs" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("place_id" IN ( SELECT "establishments"."place_id"
   FROM "public"."establishments"
  WHERE ("establishments"."user_id" = "auth"."uid"()))) OR ("place_id" IN ( SELECT "e"."place_id"
   FROM ("public"."establishments" "e"
     JOIN "public"."organizations" "o" ON (("e"."organization_id" = "o"."id")))
  WHERE ("o"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view reviews for their establishments" ON "public"."reviews" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("place_id" IN ( SELECT "establishments"."place_id"
   FROM "public"."establishments"
  WHERE ("establishments"."user_id" = "auth"."uid"()))) OR ("place_id" IN ( SELECT "e"."place_id"
   FROM ("public"."establishments" "e"
     JOIN "public"."organizations" "o" ON (("e"."organization_id" = "o"."id")))
  WHERE ("o"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view reviews for their establishments" ON "public"."reviews_raw" FOR SELECT USING (("place_id" IN ( SELECT "user_establishment"."place_id"
   FROM "public"."user_establishment"
  WHERE ("user_establishment"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own entitlements" ON "public"."user_entitlements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own establishment" ON "public"."user_establishment" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own establishments" ON "public"."establishments" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own google connections" ON "public"."google_connections" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own insights" ON "public"."review_insights" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("user_id" IS NOT NULL)));



CREATE POLICY "Users can view their own organizations" ON "public"."organizations" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("organization_id" IN ( SELECT "organizations"."id"
   FROM "public"."organizations"
  WHERE ("organizations"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "client insert venues" ON "public"."venues" FOR INSERT WITH CHECK ((("owner_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "client read venues" ON "public"."venues" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "client update venues" ON "public"."venues" FOR UPDATE USING ((("owner_id" = "auth"."uid"()) OR "public"."is_admin"("auth"."uid"())));



CREATE POLICY "delete_own" ON "public"."établissements" FOR DELETE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."establishments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_own" ON "public"."établissements" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_own_reponse" ON "public"."reponses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "r_select_by_user" ON "public"."reviews" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "read_own" ON "public"."établissements" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."reponses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."review_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews_raw" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_reponses" ON "public"."reponses" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own" ON "public"."établissements" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "update_own_reponse" ON "public"."reponses" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_establishment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."établissements" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_expired_subscriptions"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_expired_subscriptions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_expired_subscriptions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unique_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_unique_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unique_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reviews_summary_with_duplicates"("p_place_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_reviews_summary_with_duplicates"("p_place_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reviews_summary_with_duplicates"("p_place_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_active_establishment"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_active_establishment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_active_establishment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."identify_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."identify_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."identify_duplicate_reviews"("p_place_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."establishments" TO "anon";
GRANT ALL ON TABLE "public"."establishments" TO "authenticated";
GRANT ALL ON TABLE "public"."establishments" TO "service_role";



GRANT ALL ON TABLE "public"."google_connections" TO "anon";
GRANT ALL ON TABLE "public"."google_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."google_connections" TO "service_role";



GRANT ALL ON TABLE "public"."import_logs" TO "anon";
GRANT ALL ON TABLE "public"."import_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_logs" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reponses" TO "anon";
GRANT ALL ON TABLE "public"."reponses" TO "authenticated";
GRANT ALL ON TABLE "public"."reponses" TO "service_role";



GRANT ALL ON TABLE "public"."review_insights" TO "anon";
GRANT ALL ON TABLE "public"."review_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."review_insights" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reviews_raw" TO "anon";
GRANT ALL ON TABLE "public"."reviews_raw" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews_raw" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_raw_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_raw_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_raw_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."user_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."user_establishment" TO "anon";
GRANT ALL ON TABLE "public"."user_establishment" TO "authenticated";
GRANT ALL ON TABLE "public"."user_establishment" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



GRANT ALL ON TABLE "public"."établissements" TO "anon";
GRANT ALL ON TABLE "public"."établissements" TO "authenticated";
GRANT ALL ON TABLE "public"."établissements" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






