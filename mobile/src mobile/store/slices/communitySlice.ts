import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import CommunityService, { 
  Compound, 
  Amenity, 
  AmenityBooking, 
  VisitorPass, 
  ServiceRequest, 
  CommunityAnnouncement,
  CommunityFee,
  ResidentProfile 
} from '../../services/CommunityService';

// Async thunks for API calls
export const fetchResidentProfile = createAsyncThunk(
  'community/fetchResidentProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getResidentProfile(userId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchResidentCompounds = createAsyncThunk(
  'community/fetchResidentCompounds',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getResidentCompounds(userId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCompoundAmenities = createAsyncThunk(
  'community/fetchCompoundAmenities',
  async (compoundId: string, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getCompoundAmenities(compoundId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserBookings = createAsyncThunk(
  'community/fetchUserBookings',
  async ({ userId, filters }: { userId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getAmenityBookings(userId, filters);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchVisitorPasses = createAsyncThunk(
  'community/fetchVisitorPasses',
  async ({ userId, filters }: { userId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getVisitorPasses(userId, filters);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchServiceRequests = createAsyncThunk(
  'community/fetchServiceRequests',
  async ({ userId, filters }: { userId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getServiceRequests(userId, filters);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAnnouncements = createAsyncThunk(
  'community/fetchAnnouncements',
  async ({ compoundId, filters }: { compoundId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getCommunityAnnouncements(compoundId, filters);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCommunityFees = createAsyncThunk(
  'community/fetchCommunityFees',
  async ({ userId, filters }: { userId: string; filters?: any }, { rejectWithValue }) => {
    try {
      const response = await CommunityService.getCommunityFees(userId, filters);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkResidentAccess = createAsyncThunk(
  'community/checkResidentAccess',
  async (userId: string, { rejectWithValue }) => {
    try {
      const access = await CommunityService.checkResidentAccess(userId);
      return access;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface CommunityState {
  // User resident status
  isResident: boolean;
  residentProfile: ResidentProfile | null;
  accessibleCompounds: string[];
  userRoles: string[];

  // Current compound data
  compounds: Compound[];
  currentCompound: Compound | null;
  amenities: Amenity[];

  // Bookings and requests
  bookings: AmenityBooking[];
  visitorPasses: VisitorPass[];
  serviceRequests: ServiceRequest[];
  announcements: CommunityAnnouncement[];
  fees: CommunityFee[];

  // UI state
  selectedAmenity: Amenity | null;
  selectedBooking: AmenityBooking | null;
  selectedVisitorPass: VisitorPass | null;
  selectedServiceRequest: ServiceRequest | null;

  // Loading states
  loading: {
    profile: boolean;
    compounds: boolean;
    amenities: boolean;
    bookings: boolean;
    visitorPasses: boolean;
    serviceRequests: boolean;
    announcements: boolean;
    fees: boolean;
    access: boolean;
  };

  // Error handling
  error: {
    profile: string | null;
    compounds: string | null;
    amenities: string | null;
    bookings: string | null;
    visitorPasses: string | null;
    serviceRequests: string | null;
    announcements: string | null;
    fees: string | null;
    access: string | null;
  };

  // Cache timestamps
  lastUpdated: {
    compounds: number | null;
    amenities: number | null;
    bookings: number | null;
    announcements: number | null;
  };
}

const initialState: CommunityState = {
  isResident: false,
  residentProfile: null,
  accessibleCompounds: [],
  userRoles: [],

  compounds: [],
  currentCompound: null,
  amenities: [],

  bookings: [],
  visitorPasses: [],
  serviceRequests: [],
  announcements: [],
  fees: [],

  selectedAmenity: null,
  selectedBooking: null,
  selectedVisitorPass: null,
  selectedServiceRequest: null,

  loading: {
    profile: false,
    compounds: false,
    amenities: false,
    bookings: false,
    visitorPasses: false,
    serviceRequests: false,
    announcements: false,
    fees: false,
    access: false,
  },

  error: {
    profile: null,
    compounds: null,
    amenities: null,
    bookings: null,
    visitorPasses: null,
    serviceRequests: null,
    announcements: null,
    fees: null,
    access: null,
  },

  lastUpdated: {
    compounds: null,
    amenities: null,
    bookings: null,
    announcements: null,
  },
};

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    // UI state management
    setCurrentCompound: (state, action: PayloadAction<Compound>) => {
      state.currentCompound = action.payload;
    },

    setSelectedAmenity: (state, action: PayloadAction<Amenity | null>) => {
      state.selectedAmenity = action.payload;
    },

    setSelectedBooking: (state, action: PayloadAction<AmenityBooking | null>) => {
      state.selectedBooking = action.payload;
    },

    setSelectedVisitorPass: (state, action: PayloadAction<VisitorPass | null>) => {
      state.selectedVisitorPass = action.payload;
    },

    setSelectedServiceRequest: (state, action: PayloadAction<ServiceRequest | null>) => {
      state.selectedServiceRequest = action.payload;
    },

    // Data updates (for optimistic updates)
    addBooking: (state, action: PayloadAction<AmenityBooking>) => {
      state.bookings.unshift(action.payload);
      state.lastUpdated.bookings = Date.now();
    },

    updateBooking: (state, action: PayloadAction<{ id: string; updates: Partial<AmenityBooking> }>) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...action.payload.updates };
      }
    },

    addVisitorPass: (state, action: PayloadAction<VisitorPass>) => {
      state.visitorPasses.unshift(action.payload);
    },

    updateVisitorPass: (state, action: PayloadAction<{ id: string; updates: Partial<VisitorPass> }>) => {
      const index = state.visitorPasses.findIndex(vp => vp.id === action.payload.id);
      if (index !== -1) {
        state.visitorPasses[index] = { ...state.visitorPasses[index], ...action.payload.updates };
      }
    },

    addServiceRequest: (state, action: PayloadAction<ServiceRequest>) => {
      state.serviceRequests.unshift(action.payload);
    },

    updateServiceRequest: (state, action: PayloadAction<{ id: string; updates: Partial<ServiceRequest> }>) => {
      const index = state.serviceRequests.findIndex(sr => sr.id === action.payload.id);
      if (index !== -1) {
        state.serviceRequests[index] = { ...state.serviceRequests[index], ...action.payload.updates };
      }
    },

    updateFeePaymentStatus: (state, action: PayloadAction<{ id: string; status: string; payment_reference?: string }>) => {
      const index = state.fees.findIndex(fee => fee.id === action.payload.id);
      if (index !== -1) {
        state.fees[index] = { 
          ...state.fees[index], 
          payment_status: action.payload.status as any,
          payment_reference: action.payload.payment_reference,
          payment_date: action.payload.status === 'paid' ? new Date().toISOString() : undefined
        };
      }
    },

    // Mark announcements as read
    markAnnouncementRead: (state, action: PayloadAction<string>) => {
      // Could add read status tracking here
    },

    // Clear errors
    clearError: (state, action: PayloadAction<keyof CommunityState['error']>) => {
      state.error[action.payload] = null;
    },

    clearAllErrors: (state) => {
      Object.keys(state.error).forEach(key => {
        state.error[key as keyof typeof state.error] = null;
      });
    },

    // Reset state (for logout)
    resetCommunityState: (state) => {
      return { ...initialState };
    },

    // Set user roles
    setUserRoles: (state, action: PayloadAction<string[]>) => {
      state.userRoles = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Check resident access
    builder
      .addCase(checkResidentAccess.pending, (state) => {
        state.loading.access = true;
        state.error.access = null;
      })
      .addCase(checkResidentAccess.fulfilled, (state, action) => {
        state.loading.access = false;
        state.isResident = action.payload.isResident;
        state.accessibleCompounds = action.payload.compoundIds;
      })
      .addCase(checkResidentAccess.rejected, (state, action) => {
        state.loading.access = false;
        state.error.access = action.payload as string;
        state.isResident = false;
        state.accessibleCompounds = [];
      });

    // Fetch resident profile
    builder
      .addCase(fetchResidentProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchResidentProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.residentProfile = action.payload;
      })
      .addCase(fetchResidentProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload as string;
      });

    // Fetch compounds
    builder
      .addCase(fetchResidentCompounds.pending, (state) => {
        state.loading.compounds = true;
        state.error.compounds = null;
      })
      .addCase(fetchResidentCompounds.fulfilled, (state, action) => {
        state.loading.compounds = false;
        state.compounds = action.payload;
        state.lastUpdated.compounds = Date.now();
        
        // Set current compound if not set
        if (!state.currentCompound && action.payload.length > 0) {
          state.currentCompound = action.payload[0];
        }
      })
      .addCase(fetchResidentCompounds.rejected, (state, action) => {
        state.loading.compounds = false;
        state.error.compounds = action.payload as string;
      });

    // Fetch amenities
    builder
      .addCase(fetchCompoundAmenities.pending, (state) => {
        state.loading.amenities = true;
        state.error.amenities = null;
      })
      .addCase(fetchCompoundAmenities.fulfilled, (state, action) => {
        state.loading.amenities = false;
        state.amenities = action.payload;
        state.lastUpdated.amenities = Date.now();
      })
      .addCase(fetchCompoundAmenities.rejected, (state, action) => {
        state.loading.amenities = false;
        state.error.amenities = action.payload as string;
      });

    // Fetch bookings
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading.bookings = true;
        state.error.bookings = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading.bookings = false;
        state.bookings = action.payload;
        state.lastUpdated.bookings = Date.now();
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading.bookings = false;
        state.error.bookings = action.payload as string;
      });

    // Fetch visitor passes
    builder
      .addCase(fetchVisitorPasses.pending, (state) => {
        state.loading.visitorPasses = true;
        state.error.visitorPasses = null;
      })
      .addCase(fetchVisitorPasses.fulfilled, (state, action) => {
        state.loading.visitorPasses = false;
        state.visitorPasses = action.payload;
      })
      .addCase(fetchVisitorPasses.rejected, (state, action) => {
        state.loading.visitorPasses = false;
        state.error.visitorPasses = action.payload as string;
      });

    // Fetch service requests
    builder
      .addCase(fetchServiceRequests.pending, (state) => {
        state.loading.serviceRequests = true;
        state.error.serviceRequests = null;
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        state.loading.serviceRequests = false;
        state.serviceRequests = action.payload;
      })
      .addCase(fetchServiceRequests.rejected, (state, action) => {
        state.loading.serviceRequests = false;
        state.error.serviceRequests = action.payload as string;
      });

    // Fetch announcements
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading.announcements = true;
        state.error.announcements = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading.announcements = false;
        state.announcements = action.payload;
        state.lastUpdated.announcements = Date.now();
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading.announcements = false;
        state.error.announcements = action.payload as string;
      });

    // Fetch fees
    builder
      .addCase(fetchCommunityFees.pending, (state) => {
        state.loading.fees = true;
        state.error.fees = null;
      })
      .addCase(fetchCommunityFees.fulfilled, (state, action) => {
        state.loading.fees = false;
        state.fees = action.payload;
      })
      .addCase(fetchCommunityFees.rejected, (state, action) => {
        state.loading.fees = false;
        state.error.fees = action.payload as string;
      });
  },
});

export const {
  setCurrentCompound,
  setSelectedAmenity,
  setSelectedBooking,
  setSelectedVisitorPass,
  setSelectedServiceRequest,
  addBooking,
  updateBooking,
  addVisitorPass,
  updateVisitorPass,
  addServiceRequest,
  updateServiceRequest,
  updateFeePaymentStatus,
  markAnnouncementRead,
  clearError,
  clearAllErrors,
  resetCommunityState,
  setUserRoles,
} = communitySlice.actions;

export default communitySlice.reducer;