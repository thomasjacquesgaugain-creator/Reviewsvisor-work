/**
 * Mapping COMPLET des types Google Places vers nos catégories Reviewsvisor
 * 
 * Sources:
 * - https://developers.google.com/maps/documentation/places/web-service/supported_types
 * - https://developers.google.com/maps/documentation/places/web-service/place-types
 */

export const ESTABLISHMENT_TYPE_OPTIONS = [
  "Restaurant",
  "Bar",
  "Café",
  "Hôtel",
  "Boulangerie",
  "Salon de coiffure",
  "Spa / Bien-être",
  "Commerce de détail",
  "Autre",
] as const;

export type EstablishmentTypeOption = (typeof ESTABLISHMENT_TYPE_OPTIONS)[number];

// =============================================================================
// MAPPING COMPLET DES TYPES GOOGLE
// =============================================================================

const GOOGLE_TYPE_TO_CATEGORY: Record<string, EstablishmentTypeOption> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // RESTAURANT (50+ types)
  // ═══════════════════════════════════════════════════════════════════════════
  "restaurant": "Restaurant",
  "food": "Restaurant",
  "meal_delivery": "Restaurant",
  "meal_takeaway": "Restaurant",
  "fast_food_restaurant": "Restaurant",
  "fine_dining_restaurant": "Restaurant",
  "casual_dining_restaurant": "Restaurant",
  "family_restaurant": "Restaurant",
  "buffet_restaurant": "Restaurant",
  "seafood_restaurant": "Restaurant",
  "steak_house": "Restaurant",
  "steakhouse": "Restaurant",
  "sushi_restaurant": "Restaurant",
  "pizza_restaurant": "Restaurant",
  "pizzeria": "Restaurant",
  "chinese_restaurant": "Restaurant",
  "japanese_restaurant": "Restaurant",
  "indian_restaurant": "Restaurant",
  "italian_restaurant": "Restaurant",
  "french_restaurant": "Restaurant",
  "mexican_restaurant": "Restaurant",
  "thai_restaurant": "Restaurant",
  "vietnamese_restaurant": "Restaurant",
  "korean_restaurant": "Restaurant",
  "middle_eastern_restaurant": "Restaurant",
  "greek_restaurant": "Restaurant",
  "american_restaurant": "Restaurant",
  "mediterranean_restaurant": "Restaurant",
  "vegetarian_restaurant": "Restaurant",
  "vegan_restaurant": "Restaurant",
  "brunch_restaurant": "Restaurant",
  "breakfast_restaurant": "Restaurant",
  "hamburger_restaurant": "Restaurant",
  "ramen_restaurant": "Restaurant",
  "barbecue_restaurant": "Restaurant",
  "bbq_restaurant": "Restaurant",
  "sandwich_shop": "Restaurant",
  "deli": "Restaurant",
  "diner": "Restaurant",
  "food_court": "Restaurant",
  "asian_restaurant": "Restaurant",
  "african_restaurant": "Restaurant",
  "spanish_restaurant": "Restaurant",
  "turkish_restaurant": "Restaurant",
  "lebanese_restaurant": "Restaurant",
  "brazilian_restaurant": "Restaurant",
  "peruvian_restaurant": "Restaurant",
  "indonesian_restaurant": "Restaurant",
  "malaysian_restaurant": "Restaurant",
  "filipino_restaurant": "Restaurant",
  "caribbean_restaurant": "Restaurant",
  "soul_food_restaurant": "Restaurant",
  "southern_restaurant": "Restaurant",
  "tex_mex_restaurant": "Restaurant",
  "tapas_restaurant": "Restaurant",
  "fondue_restaurant": "Restaurant",
  "creole_restaurant": "Restaurant",
  "cajun_restaurant": "Restaurant",
  "dim_sum_restaurant": "Restaurant",
  "hot_pot_restaurant": "Restaurant",
  "noodle_shop": "Restaurant",
  "dumpling_restaurant": "Restaurant",
  "poke_restaurant": "Restaurant",
  "acai_shop": "Restaurant",
  "ice_cream_shop": "Restaurant",
  "frozen_yogurt_shop": "Restaurant",
  "dessert_shop": "Restaurant",
  "creperie": "Restaurant",
  "pancake_restaurant": "Restaurant",
  "waffle_restaurant": "Restaurant",
  "juice_bar": "Restaurant",
  "smoothie_shop": "Restaurant",
  "salad_shop": "Restaurant",
  "soup_restaurant": "Restaurant",
  "food_truck": "Restaurant",
  "caterer": "Restaurant",
  "catering_service": "Restaurant",

  // ═══════════════════════════════════════════════════════════════════════════
  // BAR
  // ═══════════════════════════════════════════════════════════════════════════
  "bar": "Bar",
  "night_club": "Bar",
  "nightclub": "Bar",
  "wine_bar": "Bar",
  "cocktail_bar": "Bar",
  "pub": "Bar",
  "brewery": "Bar",
  "sports_bar": "Bar",
  "beer_garden": "Bar",
  "beer_hall": "Bar",
  "beer_bar": "Bar",
  "whiskey_bar": "Bar",
  "champagne_bar": "Bar",
  "lounge": "Bar",
  "karaoke_bar": "Bar",
  "dive_bar": "Bar",
  "speakeasy": "Bar",
  "rooftop_bar": "Bar",
  "pool_hall": "Bar",
  "billiard_hall": "Bar",
  "hookah_bar": "Bar",
  "shisha_lounge": "Bar",
  "dance_club": "Bar",
  "disco": "Bar",
  "liquor_store": "Bar",

  // ═══════════════════════════════════════════════════════════════════════════
  // CAFÉ
  // ═══════════════════════════════════════════════════════════════════════════
  "cafe": "Café",
  "coffee_shop": "Café",
  "coffee": "Café",
  "tea_house": "Café",
  "tea_room": "Café",
  "internet_cafe": "Café",
  "espresso_bar": "Café",
  "bubble_tea_shop": "Café",
  "boba_shop": "Café",

  // ═══════════════════════════════════════════════════════════════════════════
  // SALON DE COIFFURE
  // ═══════════════════════════════════════════════════════════════════════════
  "hair_care": "Salon de coiffure",
  "hair_salon": "Salon de coiffure",
  "hairdresser": "Salon de coiffure",
  "barber_shop": "Salon de coiffure",
  "barber": "Salon de coiffure",
  "barbershop": "Salon de coiffure",

  // ═══════════════════════════════════════════════════════════════════════════
  // SPA / BIEN-ÊTRE (inclut ongleries, esthétique, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  "spa": "Spa / Bien-être",
  "beauty_salon": "Spa / Bien-être",
  "nail_salon": "Spa / Bien-être",
  "skin_care_clinic": "Spa / Bien-être",
  "skin_care": "Spa / Bien-être",
  "massage": "Spa / Bien-être",
  "massage_therapist": "Spa / Bien-être",
  "massage_therapy": "Spa / Bien-être",
  "wellness_center": "Spa / Bien-être",
  "wellness": "Spa / Bien-être",
  "yoga_studio": "Spa / Bien-être",
  "pilates_studio": "Spa / Bien-être",
  "gym": "Spa / Bien-être",
  "fitness_center": "Spa / Bien-être",
  "health_club": "Spa / Bien-être",
  "tanning_salon": "Spa / Bien-être",
  "tattoo_parlor": "Spa / Bien-être",
  "tattoo_shop": "Spa / Bien-être",
  "piercing_shop": "Spa / Bien-être",
  "waxing_salon": "Spa / Bien-être",
  "laser_hair_removal": "Spa / Bien-être",
  "esthetician": "Spa / Bien-être",
  "aesthetician": "Spa / Bien-être",
  "cosmetics": "Spa / Bien-être",
  "beauty_supply_store": "Spa / Bien-être",
  "day_spa": "Spa / Bien-être",
  "medical_spa": "Spa / Bien-être",
  "health": "Spa / Bien-être",
  "sauna": "Spa / Bien-être",
  "turkish_bath": "Spa / Bien-être",
  "hammam": "Spa / Bien-être",
  "reflexology": "Spa / Bien-être",
  "acupuncture": "Spa / Bien-être",
  "chiropractor": "Spa / Bien-être",
  "physical_therapy": "Spa / Bien-être",
  "physiotherapy": "Spa / Bien-être",

  // ═══════════════════════════════════════════════════════════════════════════
  // HÔTEL
  // ═══════════════════════════════════════════════════════════════════════════
  "lodging": "Hôtel",
  "hotel": "Hôtel",
  "motel": "Hôtel",
  "resort_hotel": "Hôtel",
  "resort": "Hôtel",
  "bed_and_breakfast": "Hôtel",
  "guest_house": "Hôtel",
  "hostel": "Hôtel",
  "extended_stay_hotel": "Hôtel",
  "campground": "Hôtel",
  "camping": "Hôtel",
  "rv_park": "Hôtel",
  "vacation_rental": "Hôtel",
  "cottage": "Hôtel",
  "chalet": "Hôtel",
  "inn": "Hôtel",
  "lodge": "Hôtel",
  "apartment_hotel": "Hôtel",
  "serviced_apartment": "Hôtel",
  "youth_hostel": "Hôtel",
  "boutique_hotel": "Hôtel",
  "luxury_hotel": "Hôtel",
  "casino_hotel": "Hôtel",

  // ═══════════════════════════════════════════════════════════════════════════
  // BOULANGERIE
  // ═══════════════════════════════════════════════════════════════════════════
  "bakery": "Boulangerie",
  "pastry_shop": "Boulangerie",
  "patisserie": "Boulangerie",
  "cake_shop": "Boulangerie",
  "cupcake_shop": "Boulangerie",
  "donut_shop": "Boulangerie",
  "bagel_shop": "Boulangerie",
  "bread_shop": "Boulangerie",
  "confectionery": "Boulangerie",
  "chocolate_shop": "Boulangerie",
  "candy_store": "Boulangerie",

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMERCE DE DÉTAIL
  // ═══════════════════════════════════════════════════════════════════════════
  "store": "Commerce de détail",
  "shop": "Commerce de détail",
  "shopping_mall": "Commerce de détail",
  "department_store": "Commerce de détail",
  "supermarket": "Commerce de détail",
  "grocery_store": "Commerce de détail",
  "grocery_or_supermarket": "Commerce de détail",
  "convenience_store": "Commerce de détail",
  "clothing_store": "Commerce de détail",
  "shoe_store": "Commerce de détail",
  "jewelry_store": "Commerce de détail",
  "electronics_store": "Commerce de détail",
  "hardware_store": "Commerce de détail",
  "furniture_store": "Commerce de détail",
  "home_goods_store": "Commerce de détail",
  "home_improvement_store": "Commerce de détail",
  "book_store": "Commerce de détail",
  "bookstore": "Commerce de détail",
  "pet_store": "Commerce de détail",
  "florist": "Commerce de détail",
  "flower_shop": "Commerce de détail",
  "pharmacy": "Commerce de détail",
  "drugstore": "Commerce de détail",
  "optician": "Commerce de détail",
  "eyewear_store": "Commerce de détail",
  "gift_shop": "Commerce de détail",
  "souvenir_shop": "Commerce de détail",
  "toy_store": "Commerce de détail",
  "sporting_goods_store": "Commerce de détail",
  "bicycle_store": "Commerce de détail",
  "music_store": "Commerce de détail",
  "record_store": "Commerce de détail",
  "art_gallery": "Commerce de détail",
  "antique_store": "Commerce de détail",
  "thrift_store": "Commerce de détail",
  "second_hand_store": "Commerce de détail",
  "pawn_shop": "Commerce de détail",
  "cell_phone_store": "Commerce de détail",
  "mobile_phone_store": "Commerce de détail",
  "computer_store": "Commerce de détail",
  "office_supply_store": "Commerce de détail",
  "stationery_store": "Commerce de détail",
  "car_dealer": "Commerce de détail",
  "car_rental": "Commerce de détail",
  "car_repair": "Commerce de détail",
  "car_wash": "Commerce de détail",
  "gas_station": "Commerce de détail",
  "laundry": "Commerce de détail",
  "dry_cleaner": "Commerce de détail",
  "tailor": "Commerce de détail",
  "shoe_repair": "Commerce de détail",
  "locksmith": "Commerce de détail",
  "print_shop": "Commerce de détail",
  "copy_shop": "Commerce de détail",
  "photo_studio": "Commerce de détail",
  "photography_studio": "Commerce de détail",
  "frame_shop": "Commerce de détail",
  "garden_center": "Commerce de détail",
  "nursery": "Commerce de détail",
  "building_materials_store": "Commerce de détail",
  "lumber_store": "Commerce de détail",
  "plumbing_supply_store": "Commerce de détail",
  "electrical_supply_store": "Commerce de détail",
  "appliance_store": "Commerce de détail",
  "mattress_store": "Commerce de détail",
  "carpet_store": "Commerce de détail",
  "tile_store": "Commerce de détail",
  "paint_store": "Commerce de détail",
  "wallpaper_store": "Commerce de détail",
  "kitchen_supply_store": "Commerce de détail",
  "cookware_store": "Commerce de détail",
  "wine_shop": "Commerce de détail",
  "cheese_shop": "Commerce de détail",
  "butcher_shop": "Commerce de détail",
  "fish_market": "Commerce de détail",
  "farmers_market": "Commerce de détail",
  "market": "Commerce de détail",
  "wholesale_store": "Commerce de détail",
  "warehouse_store": "Commerce de détail",
  "outlet_store": "Commerce de détail",
  "discount_store": "Commerce de détail",
  "dollar_store": "Commerce de détail",
  "variety_store": "Commerce de détail",
  "general_store": "Commerce de détail",
  "tobacco_shop": "Commerce de détail",
  "vape_shop": "Commerce de détail",
  "head_shop": "Commerce de détail",
  "video_game_store": "Commerce de détail",
  "comic_book_store": "Commerce de détail",
  "hobby_store": "Commerce de détail",
  "craft_store": "Commerce de détail",
  "fabric_store": "Commerce de détail",
  "sewing_shop": "Commerce de détail",
  "yarn_store": "Commerce de détail",
  "bead_store": "Commerce de détail",
  "party_supply_store": "Commerce de détail",
  "costume_shop": "Commerce de détail",
  "uniform_store": "Commerce de détail",
  "workwear_store": "Commerce de détail",
  "bridal_shop": "Commerce de détail",
  "formal_wear_store": "Commerce de détail",
  "children_clothing_store": "Commerce de détail",
  "baby_store": "Commerce de détail",
  "maternity_store": "Commerce de détail",
  "plus_size_clothing_store": "Commerce de détail",
  "lingerie_store": "Commerce de détail",
  "swimwear_store": "Commerce de détail",
  "athletic_wear_store": "Commerce de détail",
  "outdoor_clothing_store": "Commerce de détail",
  "leather_goods_store": "Commerce de détail",
  "luggage_store": "Commerce de détail",
  "handbag_store": "Commerce de détail",
  "watch_store": "Commerce de détail",
  "sunglasses_store": "Commerce de détail",
  "perfume_store": "Commerce de détail",
  "cosmetics_store": "Commerce de détail",
  "health_food_store": "Commerce de détail",
  "organic_store": "Commerce de détail",
  "vitamin_store": "Commerce de détail",
  "supplement_store": "Commerce de détail",
  "medical_supply_store": "Commerce de détail",
  "hearing_aid_store": "Commerce de détail",
  "wheelchair_store": "Commerce de détail",
  "mobility_store": "Commerce de détail",
};

// =============================================================================
// MOTS-CLÉS POUR ANALYSE DU NOM (fallback)
// =============================================================================

const NAME_KEYWORDS: { keywords: string[]; category: EstablishmentTypeOption }[] = [
  // Restaurant
  {
    keywords: ["restaurant", "resto", "brasserie", "bistro", "bistrot", "trattoria", "osteria", "pizzeria", "grill", "rôtisserie", "rotisserie", "cantine", "table", "cuisine", "gastronomie", "gastronomique", "auberge"],
    category: "Restaurant"
  },
  // Bar
  {
    keywords: ["bar", "pub", "taverne", "tavern", "brewery", "cocktail", "lounge", "club", "discothèque", "discotheque", "nightclub"],
    category: "Bar"
  },
  // Café
  {
    keywords: ["café", "cafe", "coffee", "tea", "thé", "salon de thé"],
    category: "Café"
  },
  // Salon de coiffure
  {
    keywords: ["coiffure", "coiffeur", "coiffeuse", "hair", "cheveux", "barber", "barbier", "barbershop", "coupe", "brushing", "coloration", "mèches", "meches"],
    category: "Salon de coiffure"
  },
  // Spa / Bien-être
  {
    keywords: ["spa", "bien-être", "bien être", "bienetre", "wellness", "beauté", "beaute", "beauty", "esthétique", "esthetique", "onglerie", "ongles", "nail", "nails", "manucure", "pédicure", "pedicure", "massage", "relaxation", "détente", "detente", "yoga", "pilates", "fitness", "gym", "musculation", "sport", "institut", "soin", "soins", "épilation", "epilation", "bronzage", "solarium", "tatouage", "tattoo", "piercing"],
    category: "Spa / Bien-être"
  },
  // Hôtel
  {
    keywords: ["hôtel", "hotel", "motel", "auberge", "gîte", "gite", "chambre d'hôte", "chambre d'hotes", "hostel", "resort", "lodge", "camping", "b&b", "bed and breakfast"],
    category: "Hôtel"
  },
  // Boulangerie
  {
    keywords: ["boulangerie", "boulanger", "pâtisserie", "patisserie", "pâtissier", "patissier", "bakery", "pain", "viennoiserie", "croissant", "brioche", "gâteau", "gateau", "cake", "cupcake", "donut", "chocolaterie", "confiserie"],
    category: "Boulangerie"
  },
  // Commerce de détail
  {
    keywords: ["magasin", "boutique", "shop", "store", "commerce", "supermarché", "supermarche", "épicerie", "epicerie", "marché", "marche", "pharmacie", "optique", "opticien", "fleuriste", "librairie", "papeterie", "quincaillerie", "bricolage", "électroménager", "electromenager", "meuble", "décoration", "decoration", "vêtement", "vetement", "chaussure", "bijouterie", "joaillerie", "horlogerie", "parfumerie"],
    category: "Commerce de détail"
  },
];

// =============================================================================
// TYPES GÉNÉRIQUES À IGNORER
// =============================================================================

const GENERIC_TYPES_TO_IGNORE = new Set([
  "point_of_interest",
  "establishment",
  "premise",
  "street_address",
  "route",
  "locality",
  "political",
  "sublocality",
  "sublocality_level_1",
  "sublocality_level_2",
  "neighborhood",
  "postal_code",
  "country",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "administrative_area_level_4",
  "administrative_area_level_5",
  "colloquial_area",
  "floor",
  "room",
  "post_box",
  "parking",
  "plus_code",
  "geocode",
]);

// =============================================================================
// FONCTION PRINCIPALE
// =============================================================================

/**
 * Mappe les types Google Places vers une catégorie Reviewsvisor
 * 
 * @param types - Tableau de types retournés par Google Places API
 * @param establishmentName - Nom de l'établissement (optionnel, utilisé en fallback)
 * @returns La catégorie correspondante
 */
export function mapGoogleTypeToCategory(
  types: string[],
  establishmentName?: string
): EstablishmentTypeOption {
  console.log("[mapGoogleTypeToCategory] === DÉBUT MAPPING ===");
  console.log("[mapGoogleTypeToCategory] Types reçus:", types);
  console.log("[mapGoogleTypeToCategory] Nom établissement:", establishmentName);

  if (!types || !Array.isArray(types) || types.length === 0) {
    console.log("[mapGoogleTypeToCategory] Pas de types, tentative avec le nom...");
    if (establishmentName) {
      return detectFromName(establishmentName);
    }
    return "Autre";
  }

  // Normaliser les types en minuscules
  const normalizedTypes = types.map(t => String(t).toLowerCase().trim());
  
  // Filtrer les types génériques
  const relevantTypes = normalizedTypes.filter(t => !GENERIC_TYPES_TO_IGNORE.has(t));
  console.log("[mapGoogleTypeToCategory] Types pertinents (après filtrage):", relevantTypes);

  // Chercher un match dans les types pertinents d'abord
  for (const type of relevantTypes) {
    const category = GOOGLE_TYPE_TO_CATEGORY[type];
    if (category) {
      console.log(`[mapGoogleTypeToCategory] ✅ Match trouvé: "${type}" -> "${category}"`);
      return category;
    }
  }

  // Chercher aussi dans tous les types (au cas où)
  for (const type of normalizedTypes) {
    const category = GOOGLE_TYPE_TO_CATEGORY[type];
    if (category) {
      console.log(`[mapGoogleTypeToCategory] ✅ Match trouvé (fallback): "${type}" -> "${category}"`);
      return category;
    }
  }

  // Fallback: analyser le nom de l'établissement
  if (establishmentName) {
    console.log("[mapGoogleTypeToCategory] Aucun match dans les types, analyse du nom...");
    const categoryFromName = detectFromName(establishmentName);
    if (categoryFromName !== "Autre") {
      console.log(`[mapGoogleTypeToCategory] ✅ Match via nom: "${categoryFromName}"`);
      return categoryFromName;
    }
  }

  console.log("[mapGoogleTypeToCategory] ❌ Aucun match trouvé, retourne: Autre");
  console.log("[mapGoogleTypeToCategory] Types non reconnus:", relevantTypes);
  return "Autre";
}

/**
 * Détecte la catégorie à partir du nom de l'établissement
 */
function detectFromName(name: string): EstablishmentTypeOption {
  const lowerName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const { keywords, category } of NAME_KEYWORDS) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lowerName.includes(normalizedKeyword)) {
        console.log(`[detectFromName] Match keyword "${keyword}" -> "${category}"`);
        return category;
      }
    }
  }
  
  return "Autre";
}

/**
 * Version simplifiée pour rétrocompatibilité (sans nom)
 */
export function mapGoogleTypeToCategorySimple(types: string[]): string {
  return mapGoogleTypeToCategory(types);
}