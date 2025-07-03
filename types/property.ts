export interface PropertyPhoto {
  id: string;
  property_id: string;
  url: string;
  filename?: string;
  file_size?: number;
  mime_type?: string;
  category: string;
  is_primary: boolean;
  order_index: number;
  storage_path?: string;
  thumbnail_url?: string;
  alt_text?: string;
  caption?: string;
  created_at: string;
}

export interface PropertyVideo {
  id: string;
  property_id: string;
  url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  duration?: number; // in seconds
  file_size?: number;
  mime_type?: string;
  storage_path?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  url: string;
  filename: string;
  file_size?: number;
  mime_type?: string;
  document_type: string; // floor_plan, brochure, contract, etc.
  storage_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  property_type: string;
  status: string;
  features?: string[];
  amenities?: string[];
  property_photos?: PropertyPhoto[];
  virtual_tour_url?: string;
  year_built?: number;
  lot_size?: number;
  hoa_fee?: number;
  property_tax?: number;
  parking_spaces?: number;
  garage_type?: string;
  cooling_type?: string;
  heating_type?: string;
  flooring_type?: string;
  architectural_style?: string;
  view_type?: string;
  water_view?: boolean;
  waterfront?: boolean;
  pool?: boolean;
  spa?: boolean;
  tennis_court?: boolean;
  golf_course?: boolean;
  mountain_view?: boolean;
  city_view?: boolean;
  furnished?: boolean;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  utilities_included?: boolean;
  internet_included?: boolean;
  cable_included?: boolean;
  laundry_type?: string;
  lease_terms?: string;
  security_deposit?: number;
  broker_id?: string;
  mls_number?: string;
  listing_agent?: string;
  listing_office?: string;
  square_meters_living?: number;
  square_meters_lot?: number;
  neighborhood?: string;
  school_district?: string;
  zoning?: string;
  longitude?: number;
  latitude?: number;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  compound?: string;
  distance_to_metro?: number;
  distance_to_airport?: number;
  distance_to_mall?: number;
  distance_to_hospital?: number;
  has_pool?: boolean;
  has_garden?: boolean;
  has_security?: boolean;
  has_parking?: boolean;
  has_gym?: boolean;
  has_playground?: boolean;
  has_community_center?: boolean;
  
  // Optional display properties for frontend components
  location?: string;
  isHot?: boolean;
  priceChange?: {
    amount: number;
    percentage: number;
  };
  daysOnMarket?: number;
  views?: number;
}

// Database row type for Supabase
export interface PropertyRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters: number | null;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  property_type: string;
  status: string;
  year_built: number | null;
  lot_size: number | null;
  hoa_fee: number | null;
  property_tax: number | null;
  parking_spaces: number | null;
  garage_type: string | null;
  cooling_type: string | null;
  heating_type: string | null;
  flooring_type: string | null;
  architectural_style: string | null;
  view_type: string | null;
  water_view: boolean | null;
  waterfront: boolean | null;
  pool: boolean | null;
  spa: boolean | null;
  tennis_court: boolean | null;
  golf_course: boolean | null;
  mountain_view: boolean | null;
  city_view: boolean | null;
  furnished: boolean | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;
  utilities_included: boolean | null;
  internet_included: boolean | null;
  cable_included: boolean | null;
  laundry_type: string | null;
  lease_terms: string | null;
  security_deposit: number | null;
  broker_id: string | null;
  mls_number: string | null;
  listing_agent: string | null;
  listing_office: string | null;
  neighborhood: string | null;
  school_district: string | null;
  zoning: string | null;
  longitude: number | null;
  latitude: number | null;
  virtual_tour_url: string | null;
  features: string[] | null;
  amenities: string[] | null;
  created_at: string;
  updated_at: string;
  view_count: number | null;
  compound: string | null;
  distance_to_metro: number | null;
  distance_to_airport: number | null;
  distance_to_mall: number | null;
  distance_to_hospital: number | null;
  has_pool: boolean | null;
  has_garden: boolean | null;
  has_security: boolean | null;
  has_parking: boolean | null;
  has_gym: boolean | null;
  has_playground: boolean | null;
  has_community_center: boolean | null;
}

// Database property type (matches Supabase schema exactly)
export interface DatabaseProperty {
  id: string;
  title: string;
  description: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  status: string;
  created_at: string;
  updated_at: string;
} 