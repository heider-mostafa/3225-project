import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_meters: number;
  address: string;
  city: string;
  property_type: string;
  status: string;
  virtual_tour_url?: string;
  property_photos?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    order_index: number;
  }>;
}

interface PropertiesState {
  properties: Property[];
  selectedProperty: Property | null;
  favoriteProperties: Property[];
  loading: boolean;
  error: string | null;
  filters: {
    city: string;
    propertyType: string;
    minPrice: number | null;
    maxPrice: number | null;
    searchQuery: string;
  };
  pagination: {
    page: number;
    hasMore: boolean;
    total: number;
  };
}

const initialState: PropertiesState = {
  properties: [],
  selectedProperty: null,
  favoriteProperties: [],
  loading: false,
  error: null,
  filters: {
    city: '',
    propertyType: '',
    minPrice: null,
    maxPrice: null,
    searchQuery: '',
  },
  pagination: {
    page: 1,
    hasMore: true,
    total: 0,
  },
};

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProperties: (state, action: PayloadAction<Property[]>) => {
      state.properties = action.payload;
      state.loading = false;
      state.error = null;
    },
    appendProperties: (state, action: PayloadAction<Property[]>) => {
      state.properties = [...state.properties, ...action.payload];
      state.loading = false;
      state.error = null;
    },
    setSelectedProperty: (state, action: PayloadAction<Property | null>) => {
      state.selectedProperty = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<PropertiesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action: PayloadAction<Partial<PropertiesState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addToFavorites: (state, action: PayloadAction<Property>) => {
      const exists = state.favoriteProperties.find(p => p.id === action.payload.id);
      if (!exists) {
        state.favoriteProperties.push(action.payload);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favoriteProperties = state.favoriteProperties.filter(p => p.id !== action.payload);
    },
    setFavoriteProperties: (state, action: PayloadAction<Property[]>) => {
      state.favoriteProperties = action.payload;
    },
  },
});

export const {
  setLoading,
  setProperties,
  appendProperties,
  setSelectedProperty,
  setError,
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  addToFavorites,
  removeFromFavorites,
  setFavoriteProperties,
} = propertiesSlice.actions;

export default propertiesSlice.reducer; 