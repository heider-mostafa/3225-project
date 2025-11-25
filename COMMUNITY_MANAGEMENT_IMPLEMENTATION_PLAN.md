# Community Management App Implementation Plan

## 🎯 IMPLEMENTATION STATUS: PHASE 3 MOBILE - IN PROGRESS ⚡

### ✅ COMPLETED ACHIEVEMENTS (Phase 1, 2 & 3A)
1. **Database Foundation** - All 18 community management tables created successfully
2. **User Role System** - Extended with 5 new community roles (`developer`, `compound_manager`, `resident_owner`, `resident_tenant`, `security_guard`)
3. **TypeScript Types** - Complete type definitions for all new tables including user_roles
4. **RLS Security** - Performance-optimized Row Level Security policies implemented (130 warnings resolved)
5. **Admin Access** - Super admin access configured across all community tables
6. **🆕 COMPLETE API ECOSYSTEM** - All 12 core API endpoint groups implemented:
   - **Compounds Management** (`/api/community/compounds`)
   - **Residents Management** (`/api/community/residents`)  
   - **Units Management** (`/api/community/units`)
   - **Amenities & Bookings** (`/api/community/amenities`, `/api/community/amenities/bookings`)
   - **Visitor Management** (`/api/community/visitor-passes` + QR check-in)
   - **Service Requests** (`/api/community/service-requests`)
   - **Community Fees** (`/api/community/fees` + payment processing)
   - **Announcements** (`/api/community/announcements`)
   - **Developers Management** (`/api/community/developers`)
   - **Community Events** (`/api/community/events` + registration system)
   - **Community Polls** (`/api/community/polls` + voting system)
   - **Community Marketplace** (`/api/community/marketplace`)
7. **🆕 MOBILE APP FOUNDATION** - Core mobile infrastructure implemented:
   - **CommunityService** (`/mobile/src mobile/services/CommunityService.ts`) - Complete API integration service
   - **Community Redux Slice** (`/mobile/src mobile/store/slices/communitySlice.ts`) - State management with async thunks
   - **Conditional Navigation** - Community tab appears only for residents/community users
   - **Core Screens** - CommunityHomeScreen, AmenityBookingScreen, VisitorManagementScreen, ServiceRequestsScreen
   - **TypeScript Integration** - All community types and interfaces defined
   - **API Client Extension** - Added `communityRequest()` method for all community endpoints

### 🚧 CURRENT PHASE: Phase 3B - Mobile Feature Implementation
- **Backend**: 100% Complete ✅
- **Infrastructure**: 100% Complete ✅
- **Security**: 100% Complete ✅  
- **Performance**: All RLS optimizations applied ✅
- **API Coverage**: All business logic endpoints implemented ✅
- **Mobile Foundation**: 100% Complete ✅

### 🎯 CURRENT PRIORITIES (Phase 3B)
1. **Resident Access Initialization** - Auto-check resident status on app launch
2. **Real Community Data Integration** - Connect screens to actual API data
3. **QR Code Implementation** - Add QR generation/scanning for visitor passes
4. **Amenity Booking Calendar** - Interactive date/time picker
5. **Push Notifications** - Community announcements and booking confirmations
6. **Payment Integration** - Community fees payment through existing Paymob system

### ⚠️ REMAINING IMPLEMENTATION TASKS
- **User Onboarding**: Resident registration and verification flow
- **Notifications System**: Mailgun integration hooks are ready but need implementation  
- **Advanced UI Components**: Calendar pickers, QR scanners, payment forms
- **Seed Data**: Test data for development and testing
- **Web Dashboard**: Admin interfaces for compound managers and developers

---

## Executive Summary
This document outlines the implementation plan for building a comprehensive community management app that integrates with our existing real estate platform. The app will serve property developers, compound managers, residents, and service providers with features including amenity booking, visitor management, service requests, and community communications.

## Current Infrastructure Analysis

### What We Already Have ✅

#### 1. **Authentication & User Management**
- **Supabase Auth**: Complete authentication system
- **User Roles**: `admin`, `super_admin`, `broker`, `appraiser`, `photographer`
- **User Profiles**: Comprehensive profile system with verification
- **Row Level Security**: Implemented across all tables

#### 2. **Database Architecture**
- **Properties Table**: Complete property management system
- **Rental Marketplace**: Full booking, payment, and review system
- **Payment Integration**: Paymob integration with multiple methods
- **Service Provider Network**: Existing network for maintenance/services
- **File Storage**: S3 integration for images and documents

#### 3. **Mobile Infrastructure**
- **React Native App**: Foundation with authentication
- **Navigation**: Tab and stack navigation setup
- **Real-time Features**: WebSocket integration
- **Push Notifications**: Firebase Cloud Messaging

#### 4. **Web Platform**
- **Next.js 15**: Modern web framework with TypeScript
- **Admin Dashboards**: Comprehensive admin interfaces
- **API Routes**: RESTful API structure
- **Real-time Updates**: WebSocket support

#### 5. **Business Logic**
- **Booking System**: Advanced booking with calendar integration
- **Payment Processing**: Multi-method payment support
- **Service Matching**: Provider assignment algorithms
- **Analytics**: Comprehensive reporting system

### What We Need to Add 🆕

#### 1. **Community-Specific Data Models**
- Developer organizations
- Compounds/communities
- Units within compounds
- Resident management
- Amenity booking system
- Visitor management with QR codes

#### 2. **New User Types**
- Community Developer (`developer`)
- Compound Manager (`compound_manager`)
- Resident Owner (`resident_owner`)
- Resident Tenant (`resident_tenant`)
- Security Staff (`security_guard`)

#### 3. **Community Features**
- Amenity booking calendar
- Visitor pass generation
- Community announcements
- Service request integration
- Community fee management

## User Type Integration Strategy

### Current User Types (Existing)
1. `admin` - Platform administrators (existing)
2. `super_admin` - System administrators (existing)
3. `broker` - Property brokers (existing)
4. `appraiser` - Property appraisers (existing)
5. `photographer` - Property photographers (existing)

### New User Types to Add
6. `developer` - Property developers (Mountain View, Emaar, etc.)
7. `compound_manager` - Community managers
8. `resident_owner` - Property owners living in compounds
9. `resident_tenant` - Tenants living in compounds
10. `security_guard` - Security personnel

### Detailed User Authentication & Dashboard Flow

#### Enhanced Auth System Integration

Our existing auth already handles multiple user types. We need to extend the user role detection and dashboard routing:

```typescript
// lib/auth/enhanced-user-detection.ts
export async function determineUserDashboards(userId: string) {
  const userRoles = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  const userProfile = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const dashboardAccess = {
    primary: null,
    secondary: [],
    features: []
  };

  // Determine primary dashboard based on role hierarchy
  if (userRoles.data?.some(role => role.role === 'super_admin')) {
    dashboardAccess.primary = '/admin/super-dashboard';
    dashboardAccess.secondary = ['/admin/community', '/admin/properties'];
  } else if (userRoles.data?.some(role => role.role === 'developer')) {
    dashboardAccess.primary = '/developer/dashboard';
    dashboardAccess.features = ['compound_management', 'analytics', 'billing'];
  } else if (userRoles.data?.some(role => role.role === 'compound_manager')) {
    dashboardAccess.primary = '/compound-manager/dashboard';
    dashboardAccess.features = ['resident_management', 'amenity_management', 'visitor_approval'];
  } else if (userRoles.data?.some(role => ['resident_owner', 'resident_tenant'].includes(role.role))) {
    dashboardAccess.primary = '/community/home';
    
    // Check if they also have rental properties
    const hasRentalProperties = await checkUserHasRentalProperties(userId);
    if (hasRentalProperties) {
      dashboardAccess.secondary.push('/rental-dashboard');
      dashboardAccess.features.push('rental_management');
    }
    
    // Check if they're also property seekers/buyers
    const hasPropertyInquiries = await checkUserHasPropertyInquiries(userId);
    if (hasPropertyInquiries) {
      dashboardAccess.secondary.push('/properties');
      dashboardAccess.features.push('property_search');
    }

    dashboardAccess.features.push('amenity_booking', 'visitor_management', 'service_requests');
  } else {
    // Default customer/property seeker
    dashboardAccess.primary = '/';
    dashboardAccess.features = ['property_search', 'saved_properties'];
  }

  return dashboardAccess;
}
```

### Critical User Journey Scenarios

#### Scenario 1: Existing Customer → Rental Guest → Resident
```
1. User browses properties on main platform
2. Books short-term rental in compound (existing flow)
3. During rental stay:
   - Receives temporary community access QR
   - Can use amenities during stay
   - Experiences community firsthand
4. Decides to rent long-term / buy in same compound
5. Upgrades to full resident status:
   - Existing rental booking data retained
   - Payment history maintained
   - Temporary access → Permanent access
   - New role added: resident_tenant or resident_owner
```

**Technical Implementation:**
```sql
-- When user becomes permanent resident
UPDATE rental_bookings 
SET booking_status = 'completed'
WHERE guest_user_id = ? AND rental_listing_id = ?;

INSERT INTO compound_residents (
  user_id, unit_id, resident_type, move_in_date
) VALUES (?, ?, 'tenant', NOW());

-- Link existing data
UPDATE guest_community_access 
SET access_status = 'upgraded_to_resident'
WHERE guest_user_id = ?;
```

#### Scenario 2: Property Owner → Compound Resident
```
1. User owns property listed on platform
2. Property is in compound (linked via property.compound_id)
3. Owner decides to live in their property:
   - Change property status from 'for_rent' to 'owner_occupied'
   - Create resident record with type 'owner'
   - Maintain all existing rental income data
   - Add community access
```

**Dashboard Integration:**
```typescript
// Multi-role dashboard for property owners who are also residents
export function PropertyOwnerResidentDashboard() {
  const [activeView, setActiveView] = useState('community'); // community | rental | property

  return (
    <div>
      <TabNavigation>
        <Tab onClick={() => setActiveView('community')}>Community</Tab>
        <Tab onClick={() => setActiveView('rental')}>Rental Income</Tab>
        <Tab onClick={() => setActiveView('property')}>Property Management</Tab>
      </TabNavigation>

      {activeView === 'community' && <CommunityResidentView />}
      {activeView === 'rental' && <RentalIncomeView />}
      {activeView === 'property' && <PropertyManagementView />}
    </div>
  );
}
```

#### Scenario 3: Multi-Property Owner Across Compounds
```
1. User owns properties in multiple compounds
2. Lives in one compound, rents others
3. Dashboard needs to handle:
   - Primary residence community features
   - Secondary properties rental management
   - Cross-compound analytics
```

**Complex Role Management:**
```sql
-- User can have multiple compound associations
INSERT INTO user_roles (user_id, role, compound_id) VALUES
(?, 'resident_owner', 'compound_1_id'),
(?, 'property_owner', 'compound_2_id'),
(?, 'property_owner', 'compound_3_id');
```

### Advanced User Type Considerations

#### Compound Manager Who Is Also Resident
```typescript
// Some managers live in the compound they manage
export async function getCompoundManagerAccess(userId: string) {
  const managerRole = await supabase
    .from('user_roles')
    .select('compound_id')
    .eq('user_id', userId)
    .eq('role', 'compound_manager')
    .single();

  const residentRole = await supabase
    .from('compound_residents')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (managerRole.data && residentRole.data) {
    return {
      type: 'manager_resident',
      managedCompound: managerRole.data.compound_id,
      residesIn: residentRole.data.unit_id,
      permissions: ['all_manager_permissions', 'resident_permissions']
    };
  }
}
```

#### Service Provider With Compound Access
```typescript
// Service providers may work in multiple compounds
export function ServiceProviderCompoundAccess() {
  // Providers get temporary access when assigned to jobs
  // Access expires when job is completed
  // Can have recurring access for maintenance contracts
}
```

### Critical Data Migration & Integrity

#### User Role Migration Strategy
```sql
-- Phase 1: Add new columns safely
ALTER TABLE user_roles 
ADD COLUMN compound_id UUID REFERENCES compounds(id),
ADD COLUMN developer_id UUID REFERENCES community_developers(id),
ADD COLUMN access_expires_at TIMESTAMP WITH TIME ZONE;

-- Phase 2: Migrate existing property owners
INSERT INTO user_roles (user_id, role, compound_id)
SELECT DISTINCT 
  p.owner_user_id,
  'resident_owner',
  p.compound_id
FROM properties p
WHERE p.compound_id IS NOT NULL 
AND p.owner_user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = p.owner_user_id 
  AND ur.role = 'resident_owner'
  AND ur.compound_id = p.compound_id
);

-- Phase 3: Link rental tenants
INSERT INTO compound_residents (user_id, unit_id, resident_type)
SELECT 
  rb.guest_user_id,
  cu.id,
  'tenant'
FROM rental_bookings rb
JOIN rental_listings rl ON rl.id = rb.rental_listing_id
JOIN community_units cu ON cu.property_id = rl.property_id
WHERE rb.booking_status = 'confirmed'
AND rb.check_out_date > NOW()
AND NOT EXISTS (
  SELECT 1 FROM compound_residents cr
  WHERE cr.user_id = rb.guest_user_id
  AND cr.unit_id = cu.id
);
```

#### Property-Compound Linking
```sql
-- Link existing properties to compounds
UPDATE properties 
SET compound_id = (
  -- Logic to match properties to compounds based on address/coordinates
  SELECT c.id FROM compounds c
  WHERE ST_DWithin(
    ST_Point(properties.longitude, properties.latitude)::geography,
    ST_Point(c.location_lng, c.location_lat)::geography,
    500  -- 500 meter radius
  )
  LIMIT 1
)
WHERE properties.compound_id IS NULL;
```

### Dashboard Route Integration

#### Enhanced Middleware for Route Protection
```typescript
// middleware.ts - Extended for community features
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Existing route protections
  if (pathname.startsWith('/admin/')) {
    return await checkAdminAccess(request);
  }

  // New community route protections
  if (pathname.startsWith('/developer/')) {
    return await checkDeveloperAccess(request);
  }

  if (pathname.startsWith('/compound-manager/')) {
    return await checkCompoundManagerAccess(request);
  }

  if (pathname.startsWith('/community/')) {
    return await checkResidentAccess(request);
  }

  return NextResponse.next();
}

async function checkResidentAccess(request: NextRequest) {
  const user = await getUser(request);
  
  if (!user) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const isResident = await supabase
    .from('compound_residents')
    .select('id')
    .eq('user_id', user.id)
    .eq('verification_status', 'approved')
    .single();

  if (!isResident.data) {
    return NextResponse.redirect(new URL('/community/register', request.url));
  }

  return NextResponse.next();
}
```

#### Dynamic Navigation Based on User Roles
```typescript
// components/navbar.tsx - Enhanced with community navigation
export function EnhancedNavbar() {
  const { user, userRoles } = useAuth();
  const [primaryDashboard, setPrimaryDashboard] = useState(null);

  useEffect(() => {
    if (user && userRoles) {
      determineUserDashboards(user.id).then(setPrimaryDashboard);
    }
  }, [user, userRoles]);

  const navigationItems = useMemo(() => {
    const items = [];

    // Always show main platform
    items.push({ label: 'Properties', href: '/properties' });

    // Add community navigation for residents
    if (userRoles?.some(role => ['resident_owner', 'resident_tenant'].includes(role.role))) {
      items.push({ 
        label: 'Community', 
        href: '/community',
        submenu: [
          { label: 'Home', href: '/community/home' },
          { label: 'Amenities', href: '/community/amenities' },
          { label: 'Visitors', href: '/community/visitors' },
          { label: 'Services', href: '/community/services' },
          { label: 'Announcements', href: '/community/announcements' }
        ]
      });
    }

    // Add management navigation
    if (userRoles?.some(role => role.role === 'compound_manager')) {
      items.push({ 
        label: 'Management', 
        href: '/compound-manager',
        submenu: [
          { label: 'Dashboard', href: '/compound-manager/dashboard' },
          { label: 'Residents', href: '/compound-manager/residents' },
          { label: 'Amenities', href: '/compound-manager/amenities' },
          { label: 'Reports', href: '/compound-manager/reports' }
        ]
      });
    }

    // Add developer navigation
    if (userRoles?.some(role => role.role === 'developer')) {
      items.push({ 
        label: 'Developer', 
        href: '/developer',
        submenu: [
          { label: 'Compounds', href: '/developer/compounds' },
          { label: 'Analytics', href: '/developer/analytics' },
          { label: 'Billing', href: '/developer/billing' }
        ]
      });
    }

    return items;
  }, [userRoles]);

  return <Navigation items={navigationItems} />;
}
```

### Edge Cases & Error Handling

#### Compound Transfer Scenarios
```typescript
// When resident moves between compounds
export async function transferResidentBetweenCompounds(
  userId: string, 
  fromCompoundId: string, 
  toCompoundId: string,
  newUnitId: string
) {
  // 1. Archive old residency
  await supabase
    .from('compound_residents')
    .update({ 
      is_active: false, 
      move_out_date: new Date().toISOString() 
    })
    .eq('user_id', userId)
    .eq('unit_id', fromUnitId);

  // 2. Create new residency
  const newResident = await supabase
    .from('compound_residents')
    .insert({
      user_id: userId,
      unit_id: newUnitId,
      resident_type: 'tenant', // or 'owner'
      verification_status: 'pending'
    });

  // 3. Transfer relevant data
  await transferAmenityBookings(userId, fromCompoundId, toCompoundId);
  await transferVisitorPasses(userId, fromCompoundId, toCompoundId);
  
  // 4. Update user roles
  await supabase
    .from('user_roles')
    .update({ compound_id: toCompoundId })
    .eq('user_id', userId)
    .eq('compound_id', fromCompoundId);

  // 5. Notify new compound manager for approval
  await notifyCompoundManager(toCompoundId, 'new_resident_transfer', {
    userId,
    fromCompound: fromCompoundId
  });
}
```

#### Multiple Unit Ownership
```typescript
// User owns multiple units in same compound
export function MultiUnitOwnerDashboard() {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const userUnits = useUserUnits();

  return (
    <div>
      <UnitSelector 
        units={userUnits}
        selected={selectedUnit}
        onChange={setSelectedUnit}
      />
      
      {selectedUnit && (
        <>
          <UnitSpecificFeatures unitId={selectedUnit.id} />
          <TenantManagement unitId={selectedUnit.id} />
          <MaintenanceRequests unitId={selectedUnit.id} />
        </>
      )}
    </div>
  );
}
```

#### Service Provider Compound Access
```typescript
// Temporary access for service providers
export async function grantServiceProviderAccess(
  providerId: string, 
  compoundId: string, 
  serviceRequestId: string
) {
  const accessDuration = 8; // hours
  const expiresAt = new Date(Date.now() + accessDuration * 60 * 60 * 1000);

  await supabase
    .from('user_roles')
    .insert({
      user_id: providerId,
      role: 'service_provider',
      compound_id: compoundId,
      access_expires_at: expiresAt.toISOString(),
      metadata: { service_request_id: serviceRequestId }
    });

  // Generate temporary QR code
  const accessQR = await generateQRCode({
    type: 'service_access',
    provider_id: providerId,
    compound_id: compoundId,
    expires_at: expiresAt
  });

  return accessQR;
}
```

## Detailed Database Schema Extensions

### Core Tables Architecture

#### 1. **User Role Enhancement**
```sql
-- Extend existing user_roles table
ALTER TABLE user_roles 
ADD COLUMN compound_id UUID REFERENCES compounds(id),
ADD COLUMN developer_id UUID REFERENCES community_developers(id);

-- Add new role types
UPDATE user_roles SET role = 'developer' WHERE role = 'developer';
-- (Additional role insertions)
```

#### 2. **Property Integration**
```sql
-- Link existing properties to compounds
ALTER TABLE properties 
ADD COLUMN compound_id UUID REFERENCES compounds(id),
ADD COLUMN unit_number TEXT,
ADD COLUMN is_community_unit BOOLEAN DEFAULT false;
```

#### 3. **Rental Integration**
```sql
-- Link rental listings to community units
ALTER TABLE rental_listings 
ADD COLUMN community_unit_id UUID REFERENCES community_units(id);
```

## Complete SQL Extensions

### File: `sql-extensions.sql`

The complete SQL schema is documented in the separate `sql-extensions.sql` file that includes:

1. **Community Developers Table** - Property developer companies
2. **Compounds Table** - Individual communities/compounds
3. **Community Units Table** - Units within compounds
4. **Compound Residents Table** - Residents (owners/tenants)
5. **Resident Vehicles Table** - Vehicle registration
6. **Compound Amenities Table** - Community amenities
7. **Amenity Bookings Table** - Booking system integration
8. **Visitor Management Tables** - QR code visitor system
9. **Community Fees Table** - Fee management
10. **Service Requests Table** - Maintenance integration
11. **Announcements Table** - Community communications
12. **Integration Tables** - Links to existing systems

## API Architecture Integration

### Existing API Patterns to Leverage

#### 1. **Authentication Middleware**
```typescript
// Leverage existing auth patterns
import { createServerClient } from '@supabase/ssr'

// Reuse existing role checking
export async function checkUserRole(requiredRoles: string[]) {
  // Use existing implementation from admin routes
}
```

#### 2. **Payment Integration**
```typescript
// Extend existing Paymob integration
// app/api/community/fees/pay/route.ts
export async function POST(request: NextRequest) {
  // Reuse existing payment intention logic from rental payments
  // Add community-specific fee handling
}
```

#### 3. **Service Provider Integration**
```typescript
// app/api/community/services/route.ts
export async function POST(request: NextRequest) {
  // Integrate with existing service provider matching system
  // Extend location-based provider assignment
}
```

### New API Routes to Create

#### Community Management Routes
```
/api/community/developers/ - Developer management
/api/community/compounds/ - Compound CRUD operations
/api/community/compounds/[id]/residents/ - Resident management
/api/community/compounds/[id]/amenities/ - Amenity management
/api/community/amenities/[id]/book/ - Booking system
/api/community/visitors/ - Visitor management
/api/community/visitors/[id]/qr/ - QR code generation
/api/community/announcements/ - Community communications
/api/community/fees/ - Fee management
/api/community/services/ - Service request integration
```

## Mobile App Integration Strategy

### Existing Mobile Structure to Leverage

#### 1. **Navigation Enhancement**
```typescript
// mobile/src/navigation/AppNavigator.tsx
// Add community tab to existing structure

const CommunityStack = createStackNavigator({
  CommunityHome: CommunityHomeScreen,
  AmenityBooking: AmenityBookingScreen,
  VisitorManagement: VisitorManagementScreen,
  ServiceRequests: ServiceRequestsScreen,
});

// Conditional tab based on user type
{userType.includes('resident') && (
  <Tab.Screen name="Community" component={CommunityStack} />
)}
```

#### 2. **Service Integration**
```typescript
// mobile/src/services/CommunityService.ts
// Extend existing API service patterns

export class CommunityService extends BaseAPIService {
  // Reuse existing authentication headers
  // Leverage existing error handling
  // Use existing offline caching strategy
}
```

#### 3. **State Management Integration**
```typescript
// mobile/src/store/slices/communitySlice.ts
// Extend existing Redux structure

interface CommunityState {
  compound: Compound | null;
  unit: Unit | null;
  amenities: Amenity[];
  bookings: AmenityBooking[];
  visitors: VisitorPass[];
  announcements: Announcement[];
}
```

### New Mobile Screens to Create

#### 1. **Onboarding Flow**
- `ResidentRegistrationScreen` - Extends existing registration
- `UnitVerificationScreen` - QR code/verification code input
- `ProfileCompletionScreen` - Reuse existing profile components

#### 2. **Community Features**
- `CommunityHomeScreen` - Dashboard with quick actions
- `AmenityBookingScreen` - Reuse rental booking UI patterns
- `VisitorManagementScreen` - QR code generation and history
- `ServiceRequestScreen` - Integrate with existing service UI
- `AnnouncementsScreen` - Community communications
- `PaymentHistoryScreen` - Extend existing payment UI

## Web Dashboard Integration

### Existing Admin Architecture to Leverage

#### 1. **Dashboard Framework**
```typescript
// app/admin/community/ - New admin section
// Reuse existing admin layout and components
// Leverage existing data tables and filtering
// Use existing modal and form patterns
```

#### 2. **Role-Based Access**
```typescript
// Extend existing admin middleware
export async function checkCommunityAccess(userRole: string, compoundId?: string) {
  // Developer: Access to their compounds only
  // Compound Manager: Access to assigned compound
  // Admin: Access to all compounds
}
```

### New Dashboard Pages

#### Developer Dashboard
```
/admin/community/developer/ - Developer overview
/admin/community/compounds/ - Compound management
/admin/community/compounds/[id]/ - Specific compound dashboard
/admin/community/analytics/ - Cross-compound analytics
```

#### Compound Manager Dashboard
```
/community-manager/dashboard/ - Manager-specific dashboard
/community-manager/residents/ - Resident management
/community-manager/amenities/ - Amenity management
/community-manager/visitors/ - Visitor approvals
/community-manager/announcements/ - Communication tools
```

## Integration Points with Existing Systems

### 1. **Rental Marketplace Integration**

#### Scenario: Rental Property in Compound
```sql
-- Link rental listings to community units
INSERT INTO rental_listings (
  property_id,
  community_unit_id,  -- New field
  owner_user_id
) VALUES (...);

-- When booking rental, also check community access
-- Grant temporary community access to guests
```

#### User Experience Flow
```
Guest books rental → Receives booking confirmation + community access QR
→ Can access amenities during stay → Community access expires with checkout
```

### 2. **Service Provider Integration**

#### Enhanced Service Matching
```typescript
// Extend existing provider matching algorithm
export async function findProvidersForCommunityRequest(request: {
  serviceType: string;
  compoundId: string;
  urgency: 'emergency' | 'urgent' | 'normal';
  unitId: string;
}) {
  // 1. Check compound-preferred providers (new)
  // 2. Use existing location-based matching
  // 3. Consider community-specific pricing
  // 4. Factor in compound access permissions
}
```

### 3. **Payment System Integration**

#### Community Fees + Rental Income
```typescript
// For property owners who are also residents
export async function getOwnerFinancialDashboard(userId: string) {
  return {
    rentalIncome: await getRentalIncome(userId),      // Existing
    communityFees: await getCommunityFees(userId),    // New
    serviceCharges: await getServiceCharges(userId),  // Existing
    netIncome: /* calculated */
  };
}
```

### 4. **Authentication Flow Integration**

#### Enhanced User Type Detection
```typescript
// lib/auth/user-type-detection.ts
export async function determineUserDashboard(userId: string) {
  const roles = await getUserRoles(userId);
  
  if (roles.includes('resident_owner') || roles.includes('resident_tenant')) {
    // Check if also has rental properties
    const hasRentals = await checkUserRentals(userId);
    return {
      primaryDashboard: 'community',
      secondaryDashboards: hasRentals ? ['rental'] : [],
      accessibleFeatures: [
        'amenity_booking',
        'visitor_management',
        'service_requests',
        ...(hasRentals ? ['rental_management'] : [])
      ]
    };
  }
  
  // Continue with existing logic for other user types
}
```

## Edge Cases and Integration Considerations

### 1. **Multi-Role Users**
```typescript
// User who is both property owner and tenant elsewhere
interface UserContext {
  primaryRole: string;
  compounds: {
    compoundId: string;
    role: 'owner' | 'tenant';
    unitId: string;
    permissions: string[];
  }[];
  activeCompound?: string; // User can switch between compounds
}
```

### 2. **Compound Transfer Scenarios**
```sql
-- When resident moves between compounds
-- Maintain history, transfer relevant data
-- Handle security access changes
-- Update payment responsibilities
```

### 3. **Service Provider Compound Access**
```typescript
// Temporary access for service providers
export async function grantTemporaryAccess(providerId: string, compoundId: string, duration: number) {
  // Generate temporary QR code
  // Set expiration
  // Log entry/exit
  // Auto-revoke access
}
```

### 4. **Guest Access for Rental Properties**
```typescript
// Short-term rental guests get temporary community access
export async function createGuestCommunityAccess(bookingId: string) {
  // Link to rental booking
  // Generate community QR code
  // Set access level (amenities, facilities)
  // Auto-expire with checkout
}
```

## Detailed Screen & Interaction Specifications

### Mobile App Screens (Resident View)

#### 1. Onboarding Flow

**Splash Screen**
```
┌─────────────────────────────────────┐
│             [App Logo]              │
│        Community Living             │
│         Made Easy                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    🏠 I'm a Resident        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    🔧 I'm a Service         │   │
│  │         Provider            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    👮 I'm Facility Staff    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Skip - Browse Properties Instead] │
└─────────────────────────────────────┘
```

**Phone Verification Screen**
```
┌─────────────────────────────────────┐
│  ← Back          Verify Phone       │
├─────────────────────────────────────┤
│                                     │
│    Enter your Egyptian mobile      │
│           number                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  +20 │ [1xxxxxxxxx]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  We'll send you a verification     │
│        code via SMS                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Send Code             │   │
│  └─────────────────────────────┘   │
│                                     │
│   Or sign up with email instead    │
│                                     │
│  Terms of Service & Privacy Policy │
└─────────────────────────────────────┘
```

**OTP Verification Screen**
```
┌─────────────────────────────────────┐
│  ← Back         Enter Code          │
├─────────────────────────────────────┤
│                                     │
│    We sent a 6-digit code to       │
│        +20 10X XXX XXXX             │
│                                     │
│  ┌───┬───┬───┬───┬───┬───┐         │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │         │
│  └───┴───┴───┴───┴───┴───┘         │
│                                     │
│    Code expires in 04:32            │
│                                     │
│   Didn't receive code?              │
│     [Resend Code]                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Verify               │   │
│  └─────────────────────────────┘   │
│                                     │
│    [Change Phone Number]            │
└─────────────────────────────────────┘
```

**Home Registration Screen**
```
┌─────────────────────────────────────┐
│  ← Back      Register Your Home     │
├─────────────────────────────────────┤
│                                     │
│  🏠 Find Your Compound              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search compounds...      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Popular Compounds:                 │
│  • Al Maqsad New Capital           │
│  • Mivida New Cairo                │
│  • Mountain View iCity             │
│  • Palm Hills October             │
│                                     │
│  ────────── OR ──────────          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    📷 Scan QR Code          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📍 Can't Find Your         │   │
│  │     Compound? Add It        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Unit Selection Screen**
```
┌─────────────────────────────────────┐
│  ← Back      Al Maqsad New Capital  │
├─────────────────────────────────────┤
│                                     │
│  📍 R3, New Administrative Capital  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search unit number...    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Your Unit:                         │
│                                     │
│  Building: [Tower A ▼]              │
│  Floor: [5th Floor ▼]               │
│  Unit: [Unit 504 ▼]                 │
│                                     │
│  Verification Code:                 │
│  ┌─────────────────────────────┐   │
│  │ Enter 6-digit code...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  💡 Get code from compound          │
│     management office               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       Continue              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Profile Completion Screen**
```
┌─────────────────────────────────────┐
│  ← Back      Complete Profile       │
├─────────────────────────────────────┤
│                                     │
│       👤 Add Profile Photo          │
│                                     │
│  Full Name (Arabic):                │
│  ┌─────────────────────────────┐   │
│  │ محمد أحمد حسن               │   │
│  └─────────────────────────────┘   │
│                                     │
│  Full Name (English):               │
│  ┌─────────────────────────────┐   │
│  │ Mohamed Ahmed Hassan        │   │
│  └─────────────────────────────┘   │
│                                     │
│  National ID:                       │
│  ┌─────────────────────────────┐   │
│  │ 29801234567890              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Date of Birth:                     │
│  ┌─────────────────────────────┐   │
│  │ 15 / 03 / 1990              │   │
│  └─────────────────────────────┘   │
│                                     │
│  Residency Type:                    │
│  ○ Owner  ○ Tenant                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Submit for Approval     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 2. Main App Interface

**Home Screen (Resident Dashboard)**
```
┌─────────────────────────────────────┐
│ 👤 Mohamed    Al Maqsad    🔔 3     │
├─────────────────────────────────────┤
│                                     │
│ 🏠 Tower A, Unit 504                │
│ Good morning, Mohamed!              │
│                                     │
│ Quick Actions:                      │
│ ┌─────────┬─────────┬─────────┐   │
│ │   🏊    │   🔧    │   👥    │   │
│ │ Book    │Request  │  Add    │   │
│ │Amenity  │Service  │Visitor  │   │
│ └─────────┼─────────┼─────────┤   │
│ │   📦    │   💰    │   📢    │   │
│ │Packages │ Pay     │Announce-│   │
│ │         │ Fees    │ments    │   │
│ └─────────┴─────────┴─────────┘   │
│                                     │
│ 📋 Today's Updates:                 │
│ ┌─────────────────────────────┐   │
│ │ 📌 Water maintenance 9-11AM │   │
│ │ 📅 Eid Festival - Oct 30    │   │
│ │ 🚗 Ahmed's guest arrived    │   │
│ └─────────────────────────────┘   │
│                                     │
│ ≡ [Home] [Services] [Amenities]    │
│   [Community] [More]               │
└─────────────────────────────────────┘
```

**Amenities Screen**
```
┌─────────────────────────────────────┐
│ ← Back           Amenities          │
├─────────────────────────────────────┤
│                                     │
│ [All] [Available] [Bookings] [★]    │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏊 Swimming Pool            │   │
│ │ ████████████░░ 70% booked   │   │
│ │ Hours: 6 AM - 10 PM         │   │
│ │ Current: 35/50 people       │   │
│ │ Fee: Free                   │   │
│ │ [View Calendar] [Book Now]  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏋️ Gym & Fitness Center     │   │
│ │ ██████████████████░ 85%     │   │
│ │ Hours: 5 AM - 11 PM         │   │
│ │ Current: 42/50 people       │   │
│ │ Fee: Free                   │   │
│ │ [View Calendar] [Book Now]  │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🎾 Tennis Courts            │   │
│ │ ██████░░░░ 34% booked       │   │
│ │ Hours: 6 AM - 9 PM          │   │
│ │ Courts: 2 available         │   │
│ │ Fee: EGP 50/hour            │   │
│ │ [View Calendar] [Book Now]  │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Amenity Booking Flow - Calendar**
```
┌─────────────────────────────────────┐
│ ← Back      Book Swimming Pool      │
├─────────────────────────────────────┤
│                                     │
│ Select Date:                        │
│                                     │
│     October 2024                    │
│ S  M  T  W  T  F  S                │
│       1  2  3  4  5                │
│ 6  7  8  9  10 11 12               │
│ 13 14 15 16 17 18 19               │
│ 20 21 22 23 24 🟢 26               │
│ 27 28 29 30 31                     │
│                                     │
│ 🟢 Available                        │
│ 🟡 Limited (< 20% capacity)        │
│ 🔴 Full                            │
│ ⚫ Closed                          │
│                                     │
│ Selected: Thursday, Oct 25, 2024   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │     View Time Slots         │   │
│ └─────────────────────────────┘   │
│                                     │
│ Pool Rules:                         │
│ • Max 2 hours per booking          │
│ • Up to 5 guests allowed          │
│ • No food in pool area            │
└─────────────────────────────────────┘
```

**Time Slot Selection**
```
┌─────────────────────────────────────┐
│ ← Back    Oct 25 - Swimming Pool    │
├─────────────────────────────────────┤
│                                     │
│ Morning Slots:                      │
│ ┌─────────────────────────────┐   │
│ │ ⭕ 6:00 AM - 8:00 AM         │   │
│ │    Available (12/50)         │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ ⭕ 8:00 AM - 10:00 AM        │   │
│ │    Available (18/50)         │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ 🟡 10:00 AM - 12:00 PM       │   │
│ │    Limited (46/50)           │   │
│ └─────────────────────────────┘   │
│                                     │
│ Afternoon Slots:                    │
│ ┌─────────────────────────────┐   │
│ │ 🔴 12:00 PM - 2:00 PM        │   │
│ │    Fully Booked              │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ ⭕ 2:00 PM - 4:00 PM         │   │
│ │    Available (23/50)         │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ ⭕ 4:00 PM - 6:00 PM         │   │
│ │    Available (15/50)         │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Booking Details Form**
```
┌─────────────────────────────────────┐
│ ← Back      Booking Details         │
├─────────────────────────────────────┤
│                                     │
│ 🏊 Swimming Pool                    │
│ Oct 25, 2024 • 2:00 PM - 4:00 PM   │
│                                     │
│ Number of People:                   │
│ ┌─────┬─────────────┬─────┐       │
│ │  -  │      3      │  +  │       │
│ └─────┴─────────────┴─────┘       │
│ (Max 10 per booking)                │
│                                     │
│ Bringing Guests?                    │
│ ○ No  ⭕ Yes                        │
│                                     │
│ Guest Names:                        │
│ ┌─────────────────────────────┐   │
│ │ Ahmed Hassan (Family)       │   │
│ │ Fatma Hassan (Family)       │   │
│ └─────────────────────────────┘   │
│                                     │
│ Need Guest Parking?                 │
│ ○ No  ⭕ Yes (2 passes)             │
│                                     │
│ Special Requests:                   │
│ ┌─────────────────────────────┐   │
│ │ Kids will be swimming...    │   │
│ └─────────────────────────────┘   │
│                                     │
│ Total Fee: EGP 0                    │
│                                     │
│ ┌─────────────────────────────┐   │
│ │     Confirm Booking         │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Booking Confirmation**
```
┌─────────────────────────────────────┐
│           ✅ Booking Confirmed!      │
├─────────────────────────────────────┤
│                                     │
│        [QR CODE IMAGE]              │
│                                     │
│ Confirmation: #SP-2024-10-001       │
│                                     │
│ 🏊 Swimming Pool                    │
│ 📅 Oct 25, 2024                    │
│ 🕐 2:00 PM - 4:00 PM               │
│ 👥 3 People + 2 Guests             │
│ 🅿️ 2 Guest Parking Passes         │
│                                     │
│ Show this QR code at the pool       │
│ entrance for access.                │
│                                     │
│ ┌─────────┬─────────┬─────────┐   │
│ │Add to   │  Share  │ Cancel  │   │
│ │Calendar │         │Booking  │   │
│ └─────────┴─────────┴─────────┘   │
│                                     │
│ Pool Rules Reminder:                │
│ • Lifeguard on duty                │
│ • Children under 12 supervised     │
│ • No outside food/drinks           │
│                                     │
│ ┌─────────────────────────────┐   │
│ │        Done                 │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 3. Service Request Interface

**Service Categories**
```
┌─────────────────────────────────────┐
│ ← Back        Request Service       │
├─────────────────────────────────────┤
│                                     │
│ What do you need help with?         │
│                                     │
│ ┌───────────┬───────────┐         │
│ │    🔧     │    💡     │         │
│ │ Plumbing  │Electrical │         │
│ └───────────┼───────────┤         │
│ │    🎨     │    ❄️     │         │
│ │ Painting  │AC Repair │         │
│ └───────────┼───────────┤         │
│ │    🪛     │    🧹     │         │
│ │Carpentry  │ Cleaning  │         │
│ └───────────┼───────────┤         │
│ │    🌿     │    📺     │         │
│ │Landscape  │Electronics│         │
│ └───────────┴───────────┘         │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ + Request Custom Service    │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🕐 Emergency? Call directly:        │
│    📞 +20 2 XXXX XXXX              │
└─────────────────────────────────────┘
```

**Problem Description**
```
┌─────────────────────────────────────┐
│ ← Back       Plumbing Issue         │
├─────────────────────────────────────┤
│                                     │
│ Common Issues:                      │
│ ☐ Leaking Pipe                     │
│ ⭕ Clogged Drain                    │
│ ☐ Water Heater Issue               │
│ ☐ Toilet Problem                   │
│ ☐ Faucet Repair                    │
│ ☐ Other                            │
│                                     │
│ Describe the problem:               │
│ ┌─────────────────────────────┐   │
│ │ Kitchen sink is completely  │   │
│ │ blocked. Water won't drain  │   │
│ │ at all. Started yesterday.  │   │
│ └─────────────────────────────┘   │
│ 500 characters remaining            │
│                                     │
│ Add Photos (0/5):                  │
│ ┌─────────┬─────────┬─────────┐   │
│ │   📷    │   🖼️    │         │   │
│ │ Camera  │Gallery  │         │   │
│ └─────────┴─────────┴─────────┘   │
│                                     │
│ Location: [Kitchen ▼]               │
│                                     │
│ Urgency:                            │
│ ○ Emergency  ⭕ Urgent             │
│ ○ Normal     ○ Scheduled           │
│                                     │
│ ┌─────────────────────────────┐   │
│ │        Continue             │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Service Provider Selection**
```
┌─────────────────────────────────────┐
│ ← Back    Available Providers       │
├─────────────────────────────────────┤
│                                     │
│ Sort: [Nearest ▼]                   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ⭐ Ahmed's Plumbing          │   │
│ │ ⭐ 4.8 (127 reviews)         │   │
│ │ 📍 15 min away              │   │
│ │ 💰 EGP 150 starting fee     │   │
│ │ ✅ Verified • ✅ Insured    │   │
│ │ Available: Now              │   │
│ │ [Select Provider]           │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏆 Mohamed Plumbing         │   │
│ │ ⭐ 4.6 (89 reviews)          │   │
│ │ 📍 25 min away              │   │
│ │ 💰 EGP 120 starting fee     │   │
│ │ ✅ Verified                 │   │
│ │ 🏅 Compound Preferred       │   │
│ │ Available: In 2 hours       │   │
│ │ [Select Provider]           │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🔧 Quick Fix Services       │   │
│ │ ⭐ 4.4 (156 reviews)         │   │
│ │ 📍 30 min away              │   │
│ │ 💰 EGP 100 starting fee     │   │
│ │ Available: In 1 hour        │   │
│ │ [Select Provider]           │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Service Tracking**
```
┌─────────────────────────────────────┐
│ ← Back      Service Request         │
├─────────────────────────────────────┤
│                                     │
│ Ahmed's Plumbing                    │
│ Request: #SRQ-2024-10-001           │
│                                     │
│ Provider: Ahmed Hassan              │
│ 📞 +20 10X XXX XXXX [Call]          │
│ License: PL-12345                   │
│                                     │
│ Estimated Arrival: 15-20 min        │
│                                     │
│      [Live Map View]                │
│   📍 Provider location updating     │
│                                     │
│ Status Updates:                     │
│ ✅ Request Received                 │
│ ✅ Provider Assigned                │
│ 🟡 Provider En Route                │
│ ⏸️ At Your Location                │
│ ⏸️ Work in Progress                 │
│ ⏸️ Completed                       │
│                                     │
│ ┌─────────┬─────────┬─────────┐   │
│ │  Chat   │ Call    │ Cancel  │   │
│ │Provider │Provider │Request  │   │
│ └─────────┴─────────┴─────────┘   │
│                                     │
│ Need help? Contact support:         │
│ 📞 +20 2 XXXX XXXX                 │
└─────────────────────────────────────┘
```

#### 4. Visitor Management

**Add Visitor Screen**
```
┌─────────────────────────────────────┐
│ ← Back        Add Visitor           │
├─────────────────────────────────────┤
│                                     │
│ Visitor Type:                       │
│ ⭕ One-time Guest                   │
│ ○ Recurring Visitor                 │
│ ○ Service Provider                  │
│ ○ Delivery Person                   │
│                                     │
│ Guest Information:                  │
│ Full Name: *                        │
│ ┌─────────────────────────────┐   │
│ │ Mohamed Ali                 │   │
│ └─────────────────────────────┘   │
│                                     │
│ Phone Number:                       │
│ ┌─────────────────────────────┐   │
│ │ +20 101 234 5678            │   │
│ └─────────────────────────────┘   │
│                                     │
│ National ID (optional):             │
│ ┌─────────────────────────────┐   │
│ │ 29801234567890              │   │
│ └─────────────────────────────┘   │
│                                     │
│ Visit Details:                      │
│ Date: [Today ▼]                     │
│ Arrival: [3:00 PM ▼]                │
│ Duration: [3-4 hours ▼]             │
│                                     │
│ Vehicle (optional):                 │
│ Plate: [ABC 1234] Model: [Corolla]  │
│                                     │
│ Guests: [1 ▼]                       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │      Send Invitation        │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Visitor Pass Created**
```
┌─────────────────────────────────────┐
│           ✅ Invitation Sent!       │
├─────────────────────────────────────┤
│                                     │
│ Your guest will receive:            │
│ • SMS with QR code                  │
│ • WhatsApp message (if enabled)     │
│ • Email (if provided)               │
│                                     │
│ ┌─────────────────────────────┐   │
│ │        [QR CODE]            │   │
│ │                             │   │
│ │ Pass #: VIS-2024-1234       │   │
│ │ Valid: Oct 25, 3-7 PM       │   │
│ │ Unit: Tower A - 504         │   │
│ │ Guest: Mohamed Ali          │   │
│ │ Parking: Slot V-23          │   │
│ └─────────────────────────────┘   │
│                                     │
│ Guest Instructions:                 │
│ 1. Show QR code at main gate        │
│ 2. Security will scan to verify     │
│ 3. Automatic entry granted          │
│                                     │
│ ┌─────────┬─────────┬─────────┐   │
│ │Copy Link│  Share  │View All │   │
│ │         │ Again   │Visitors │   │
│ └─────────┴─────────┴─────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │         Done                │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Active Visitors Dashboard**
```
┌─────────────────────────────────────┐
│ ← Back       Your Visitors          │
├─────────────────────────────────────┤
│                                     │
│ 🟢 Current Visitors (1):            │
│ ┌─────────────────────────────┐   │
│ │ 👤 Mohamed Ali              │   │
│ │ Arrived: 3:15 PM            │   │
│ │ Expected to leave: 7:00 PM  │   │
│ │ 🅿️ Parking: Slot V-23       │   │
│ │ [Extend Time] [Check Out]   │   │
│ └─────────────────────────────┘   │
│                                     │
│ 📅 Upcoming Visitors (2):           │
│ • Mona Ahmed (Tomorrow, 3 PM)       │
│ • DHL Delivery (Today, 6 PM)        │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ + Add New Visitor           │   │
│ └─────────────────────────────┘   │
│                                     │
│ 📚 Visitor History:                 │
│ [View Last 30 Days]                 │
│                                     │
│ Most Frequent Visitors:             │
│ • Ahmed Hassan (Family) - 12 visits │
│ • Sarah Mohamed (Friend) - 8 visits │
│ • Careem Driver - 5 visits          │
│                                     │
│ 📊 Visitor Stats:                   │
│ This Month: 23 visitors             │
│ Avg Duration: 3.2 hours             │
│ Peak Time: 6-8 PM                   │
└─────────────────────────────────────┘
```

#### 5. Community Features

**Community Home Screen**
```
┌─────────────────────────────────────┐
│ ← Back        Community             │
├─────────────────────────────────────┤
│                                     │
│ [Feed] [Events] [Directory] [Polls] │
│                                     │
│ ✍️ What's on your mind?              │
│ ┌─────────────────────────────┐   │
│ │ Share something with your   │   │
│ │ neighbors...                │   │
│ └─────────────────────────────┘   │
│ [📝 Post] [📷 Photo] [📊 Poll]      │
│                                     │
│ ───────────────────────────         │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 📌 PINNED - Management      │   │
│ │ Water maintenance tomorrow  │   │
│ │ Water shut off 9-11 AM      │   │
│ │ Oct 26, 2024                │   │
│ │ 👍 45  💬 12  📤 Share      │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Sarah M. • Building A       │   │
│ │ 2 hours ago                 │   │
│ │                             │   │
│ │ Does anyone have a good     │   │
│ │ tutor recommendation?       │   │
│ │                             │   │
│ │ [📷 Photo attached]         │   │
│ │                             │   │
│ │ 👍 8  💬 15  📤 Share       │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Load More Posts...]                │
└─────────────────────────────────────┘
```

**Events Tab**
```
┌─────────────────────────────────────┐
│ ← Back         Events               │
├─────────────────────────────────────┤
│                                     │
│ [Upcoming] [This Week] [Calendar]   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🎉 Eid Festival             │   │
│ │ Oct 30, 2024 • 5:00 PM      │   │
│ │ @ Compound Clubhouse        │   │
│ │                             │   │
│ │ Free entry for all residents│   │
│ │ Food, games, entertainment  │   │
│ │                             │   │
│ │ 👥 128 going • 45 interested│   │
│ │                             │   │
│ │ [✅ Going] [❓ Maybe] [📤]   │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🏃 Morning Jogging Club     │   │
│ │ Daily • 6:00 AM             │   │
│ │ @ Main Gate                 │   │
│ │                             │   │
│ │ Join our daily fitness      │   │
│ │ routine. All levels welcome │   │
│ │                             │   │
│ │ 👥 23 members               │   │
│ │                             │   │
│ │ [Join Group]                │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 📚 Kids Book Club           │   │
│ │ Nov 5, 2024 • 4:00 PM       │   │
│ │ @ Compound Library          │   │
│ │                             │   │
│ │ 👥 12 going • 8 interested  │   │
│ │                             │   │
│ │ [Maybe] [Share]             │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Directory Tab**
```
┌─────────────────────────────────────┐
│ ← Back        Directory             │
├─────────────────────────────────────┤
│                                     │
│ 🔍 Search residents, services...     │
│ ┌─────────────────────────────┐   │
│ │ Search...                   │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🚨 Emergency Contacts:              │
│ ┌─────────────────────────────┐   │
│ │ 🚑 Ambulance: 123           │   │
│ │ 🚒 Fire Dept: +20 2 XXX     │   │
│ │ 👮 Police: 122              │   │
│ │ 🔧 Emergency Maintenance    │   │
│ │    +20 10X XXX XXXX         │   │
│ └─────────────────────────────┘   │
│                                     │
│ 👥 Management Team:                 │
│ • Ahmed Hassan - Compound Manager   │
│ • Fatma Ali - Assistant Manager     │
│ • Mohamed Reda - Security Chief     │
│                                     │
│ 🏥 Nearby Services:                 │
│ ┌─────────────────────────────┐   │
│ │ 🏥 Cairo Medical Center     │   │
│ │ 📞 +20 2 XXXX XXXX          │   │
│ │ 📍 2.5 km away              │   │
│ │ 🕐 24/7 Emergency           │   │
│ │ [📞 Call] [🗺️ Directions]   │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🤝 Resident Directory (Opt-in):     │
│ [View Residents]                    │
│                                     │
│ ⚙️ [Privacy Settings]               │
└─────────────────────────────────────┘
```

#### 6. Payment Interface

**Payments Dashboard**
```
┌─────────────────────────────────────┐
│ ← Back         Payments             │
├─────────────────────────────────────┤
│                                     │
│ 💰 Your Balance: EGP 0              │
│                                     │
│ 🔔 Outstanding Payments:            │
│ ┌─────────────────────────────┐   │
│ │ Maintenance Fee - October   │   │
│ │ Due: Oct 31, 2024           │   │
│ │ Amount: EGP 1,200           │   │
│ │ ⚠️ 3 days overdue           │   │
│ │ [💳 Pay Now]                │   │
│ └─────────────────────────────┘   │
│                                     │
│ 📚 Payment History:                 │
│ ✅ Sept 2024: EGP 1,200 - Paid     │
│ ✅ Aug 2024: EGP 1,200 - Paid      │
│ ✅ July 2024: EGP 1,200 - Paid     │
│ [View All History]                  │
│                                     │
│ 📄 Receipts & Invoices:             │
│ [📥 Download Latest Receipt]        │
│ [📧 Email Invoice]                  │
│                                     │
│ 🔄 Auto-Pay Settings:               │
│ Currently: ❌ OFF                   │
│ ┌─────────────────────────────┐   │
│ │      Enable Auto-Pay        │   │
│ └─────────────────────────────┘   │
│                                     │
│ 📊 Annual Summary:                  │
│ 2024: EGP 12,000 paid               │
│ [View Detailed Report]              │
└─────────────────────────────────────┘
```

**Payment Flow**
```
┌─────────────────────────────────────┐
│ ← Back    Pay Maintenance Fee       │
├─────────────────────────────────────┤
│                                     │
│ 🧾 Invoice Details:                 │
│ Maintenance Fee - October 2024      │
│ Due Date: Oct 31, 2024              │
│                                     │
│ Amount Breakdown:                   │
│ • Base Maintenance: EGP 1,000       │
│ • Security Services: EGP 150        │
│ • Common Areas: EGP 100             │
│ • Amenities: EGP 80                 │
│ • Management: EGP 70                │
│ ─────────────────────               │
│ Subtotal: EGP 1,400                 │
│ ⚠️ Late Fee (3%): EGP 42            │
│ ═══════════════════                 │
│ Total Due: EGP 1,442                │
│                                     │
│ 💳 Payment Method:                  │
│ ⭕ Credit/Debit Card                │
│    [+ Add New Card]                 │
│    •••• •••• •••• 4532             │
│                                     │
│ ○ Fawry                             │
│   Pay at any Fawry machine          │
│                                     │
│ ○ Bank Transfer                     │
│   Get account details               │
│                                     │
│ ○ Wallet Balance: EGP 0             │
│                                     │
│ ┌─────────────────────────────┐   │
│ │     Process Payment         │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Web Dashboard Screens (Manager View)

#### 1. Manager Main Dashboard

**Dashboard Overview**
```
┌────────────────────────────────────────────────────────┐
│ 🏠 Al Maqsad New Capital                    👤 Ahmed Hassan │
│ 📍 R3, New Administrative Capital           [Logout]        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Key Metrics (Today):                                   │
│ ┌────────────┬────────────┬────────────┬─────────────┐ │
│ │    847     │    92%     │     23     │     156     │ │
│ │   Units    │  Occupied  │  Pending   │  Services   │ │
│ │            │            │ Approvals  │   Today     │ │
│ └────────────┴────────────┴────────────┴─────────────┘ │
│                                                        │
│ 📊 Quick Actions:                                      │
│ [Approve Residents] [Post Announcement] [View Reports] │
│                                                        │
│ 📈 Recent Activity Feed:                               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🏠 New resident registration: Unit B12-405       │ │
│ │    Mohamed Ali Hassan • 2 hours ago              │ │
│ │                                                  │ │
│ │ ✅ Service completed: Plumbing - Unit A5-201    │ │
│ │    Ahmed's Plumbing • 3 hours ago               │ │
│ │                                                  │ │
│ │ 🏊 Amenity booked: Tennis Court                 │ │
│ │    Sarah Ahmed • Tomorrow 4 PM                  │ │
│ │                                                  │ │
│ │ 💰 Payment received: Unit C3-102 - EGP 1,500   │ │
│ │    Fatma Hassan • 5 hours ago                   │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ [View All Activity] [Export Daily Report]              │
│                                                        │
│ Navigation: [Dashboard] [Residents] [Amenities]        │
│           [Services] [Reports] [Settings]              │
└────────────────────────────────────────────────────────┘
```

#### 2. Unit Management Interface

**Units Grid View**
```
┌────────────────────────────────────────────────────────┐
│ 🏠 Unit Management                                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Filters: [Building ▼] [Floor ▼] [Status ▼] [Type ▼]   │
│ 🔍 Search: Unit number or resident name               │
│                                                        │
│ ┌─────┬────────┬──────────┬───────────┬─────────────┐ │
│ │Unit │Building│Resident  │Status     │Actions      │ │
│ ├─────┼────────┼──────────┼───────────┼─────────────┤ │
│ │A1-  │Tower A │Mohamed   │🟢Occupied │[👁️View]    │ │
│ │101  │        │Hassan    │Owner      │[✏️Edit]     │ │
│ ├─────┼────────┼──────────┼───────────┼─────────────┤ │
│ │A1-  │Tower A │Sarah     │🟢Occupied │[👁️View]    │ │
│ │102  │        │Ahmed     │Tenant     │[✏️Edit]     │ │
│ ├─────┼────────┼──────────┼───────────┼─────────────┤ │
│ │A1-  │Tower A │-         │⚪Vacant   │[👤Assign]   │ │
│ │103  │        │          │           │             │ │
│ ├─────┼────────┼──────────┼───────────┼─────────────┤ │
│ │A1-  │Tower A │Ahmed     │🟡Pending  │[✅Approve]  │ │
│ │104  │        │Mohamed   │Approval   │[❌Reject]   │ │
│ └─────┴────────┴──────────┴───────────┴─────────────┘ │
│                                                        │
│ 📄 Export: [📊Excel] [📄PDF] [📧Email Report]         │
│                                                        │
│ 📈 Unit Statistics:                                    │
│ • Total Units: 847                                     │
│ • Occupied: 778 (92%)                                  │
│ • Vacant: 46 (5%)                                      │
│ • Pending: 23 (3%)                                     │
│                                                        │
│ [+ Add New Unit] [Bulk Import] [Sync with Database]   │
└────────────────────────────────────────────────────────┘
```

**Unit Detail View**
```
┌────────────────────────────────────────────────────────┐
│ ← Back to Units        Unit A1-101 Details             │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 🏠 Basic Information:                                  │
│ • Building: Tower A                                    │
│ • Floor: 1st Floor                                     │
│ • Unit Type: 2BR Apartment                            │
│ • Area: 120 sqm                                        │
│ • Orientation: North-facing                            │
│ • Balconies: 2                                         │
│                                                        │
│ 👤 Current Resident:                                   │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Name: Mohamed Hassan (Owner)                     │ │
│ │ Phone: +20 10X XXX XXXX                         │ │
│ │ Email: mohamed.hassan@email.com                 │ │
│ │ Move-in: Jan 15, 2023                           │ │
│ │ National ID: 29801234567890                     │ │
│ │                                                  │ │
│ │ Family Members:                                  │ │
│ │ • Fatma Hassan (Spouse)                         │ │
│ │ • Ahmed Hassan (Child, 8 years)                 │ │
│ │ • Laila Hassan (Child, 5 years)                 │ │
│ │                                                  │ │
│ │ Vehicles:                                        │ │
│ │ • Toyota Corolla - ABC 1234                     │ │
│ │ • Honda CR-V - XYZ 5678                         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ 💰 Payment Status:                                     │
│ ✅ All payments up to date                            │
│ Last payment: Oct 1, 2024 - EGP 1,200                │
│ [View Payment History] [Send Invoice]                  │
│                                                        │
│ 🔧 Service History (Last 6 months):                   │
│ • Sep 15, 2024: Plumbing repair (Completed)           │
│ • Aug 3, 2024: AC maintenance (Completed)             │
│ • June 20, 2024: Electrical outlet (Completed)        │
│ [View All History]                                     │
│                                                        │
│ 👥 Visitor Log:                                        │
│ [View Last 30 Days] [Export Log]                      │
│                                                        │
│ Actions: [📧Send Message] [📝Add Note] [📄Documents]  │
└────────────────────────────────────────────────────────┘
```

#### 3. Resident Approval Queue

**Approval Queue Interface**
```
┌────────────────────────────────────────────────────────┐
│ 👥 Resident Approvals                    🔔 12 Pending │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Priority Queue (Sorted by request date):               │
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🟡 URGENT - Mohamed Ali Hassan                   │ │
│ │ Unit: B5-308 • Requested: 2 hours ago           │ │
│ │                                                  │ │
│ │ Residency Type: Tenant                          │ │
│ │ Owner: Fatma Khalil (B5-308) ✅ Approved        │ │
│ │ Move-in Date: Nov 1, 2024                       │ │
│ │ Lease Duration: 1 year                          │ │
│ │                                                  │ │
│ │ 📄 Documents Status:                            │ │
│ │ ✅ National ID Card                             │ │
│ │ ✅ Lease Agreement                              │ │
│ │ ✅ Owner Authorization Letter                   │ │
│ │ ❌ Police Clearance Certificate (Missing)       │ │
│ │ ❌ Salary Certificate (Missing)                 │ │
│ │                                                  │ │
│ │ 🔐 Verification Status:                         │ │
│ │ ✅ Phone verified (+20 101 234 5678)           │ │
│ │ ✅ Email verified (m.ali@email.com)            │ │
│ │ 🟡 Background check: In progress                │ │
│ │                                                  │ │
│ │ [📄Request More Info] [✅Approve] [❌Reject]    │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🟢 READY - Sara Mohamed Ahmed                    │ │
│ │ Unit: C2-205 • Requested: 5 hours ago           │ │
│ │                                                  │ │
│ │ Residency Type: Owner                           │ │
│ │ Property purchased: Sep 15, 2024                │ │
│ │                                                  │ │
│ │ ✅ All documents complete                       │ │
│ │ ✅ All verifications passed                     │ │
│ │                                                  │ │
│ │ [✅Approve Immediately] [👁️Review Details]     │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ Approval Actions Checklist:                           │
│ When approving, system will automatically:            │
│ ✓ Create resident account with app access            │
│ ✓ Grant building access permissions                  │
│ ✓ Send welcome email with app download links         │
│ ✓ Add to unit directory and compound database        │
│ ✓ Register vehicles for parking access               │
│ ✓ Issue physical and digital parking passes          │
│ ✓ Send notification to security team                 │
│                                                        │
│ [Bulk Actions ▼] [Export Queue] [Print Applications] │
└────────────────────────────────────────────────────────┘
```

#### 4. Amenity Management

**Amenity Dashboard**
```
┌────────────────────────────────────────────────────────┐
│ 🏊 Amenity Management                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Today's Overview - October 25, 2024:                  │
│                                                        │
│ ┌──────────────┬────────────┬────────────┬──────────┐ │
│ │Amenity       │Today's     │This Week   │Actions   │ │
│ │              │Bookings    │Revenue     │          │ │
│ ├──────────────┼────────────┼────────────┼──────────┤ │
│ │🏊 Swimming   │8 bookings  │EGP 0       │[⚙️Manage]│ │
│ │   Pool       │70% full    │(Free)      │[📋Rules] │ │
│ ├──────────────┼────────────┼────────────┼──────────┤ │
│ │🏋️ Gym        │15 bookings │EGP 0       │[⚙️Manage]│ │
│ │              │90% full    │(Free)      │[📋Rules] │ │
│ ├──────────────┼────────────┼────────────┼──────────┤ │
│ │🎾 Tennis     │5 bookings  │EGP 500     │[⚙️Manage]│ │
│ │   Courts     │45% full    │            │[📋Rules] │ │
│ ├──────────────┼────────────┼────────────┼──────────┤ │
│ │🎪 Event      │2 bookings  │EGP 4,000   │[⚙️Manage]│ │
│ │   Hall       │Fully Booked│            │[📋Rules] │ │
│ └──────────────┴────────────┴────────────┴──────────┘ │
│                                                        │
│ 📊 Performance Metrics:                               │
│ • Total bookings this month: 287                      │
│ • Average utilization: 68%                            │
│ • Revenue generated: EGP 28,500                       │
│ • No-show rate: 3.2%                                  │
│ • Peak hours: 6-8 PM weekdays, 10 AM-2 PM weekends   │
│                                                        │
│ 🚨 Alerts & Issues:                                   │
│ • Pool chlorine levels need checking                  │
│ • Gym equipment maintenance due                       │
│ • Tennis court 2 lighting reported faulty             │
│                                                        │
│ [➕Add New Amenity] [📊Analytics] [📄Generate Report] │
└────────────────────────────────────────────────────────┘
```

**Amenity Settings (Swimming Pool Example)**
```
┌────────────────────────────────────────────────────────┐
│ ← Back              🏊 Swimming Pool Settings           │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 🏊 Basic Information:                                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Name: Main Swimming Pool                         │ │
│ │ Location: Central Recreation Area                │ │
│ │ Type: Outdoor, Heated, Olympic-size             │ │
│ │ Capacity: 50 people maximum                     │ │
│ │ Current Status: 🟢 Active                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ 📷 Pool Photos: [📁 Upload/Manage Photos]             │
│ [View Current Photos (12)]                             │
│                                                        │
│ 🕐 Operating Schedule:                                 │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Monday - Friday:    6:00 AM - 10:00 PM         │ │
│ │ Saturday - Sunday:  7:00 AM - 9:00 PM          │ │
│ │ Public Holidays:    Closed                     │ │
│ │ Maintenance:        5:00 AM - 6:00 AM daily    │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ 📋 Booking Rules & Restrictions:                       │
│ ☑️ Advance booking required (minimum 2 hours)         │
│ ☑️ Maximum booking duration: 2 hours                  │
│ ☐ Requires manager approval for all bookings          │
│ ☑️ Allow recurring weekly bookings                    │
│ ☐ Charge usage fee: [___] EGP per hour               │
│                                                        │
│ 👥 Capacity Management:                               │
│ • Maximum people per booking: 10                      │
│ • Guest limit per resident: 5 guests                  │
│ • Send overcapacity alerts at: 45 people              │
│                                                        │
│ 🚫 Pool Rules & Safety:                               │
│ ☑️ Residents only (no external guests)               │
│ ☐ Age restriction: [__] years and above              │
│ ☑️ Lifeguard must be present during all hours        │
│ ☑️ No outside food or drinks allowed                 │
│ ☑️ Proper swimming attire required                   │
│ ☑️ Children under 12 must be supervised              │
│                                                        │
│ 📱 Notification Settings:                             │
│ ☑️ Email booking confirmations to residents          │
│ ☑️ SMS reminders 1 hour before bookings             │
│ ☑️ Push notifications for important updates          │
│ ☐ WhatsApp notifications (Premium feature)           │
│                                                        │
│ 👨‍🏊 Staff Assignments:                                │
│ • Head Lifeguard: Ahmed Mohamed (6 AM - 2 PM)        │
│ • Assistant Lifeguard: Khaled Ali (2 PM - 10 PM)     │
│ • Pool Maintenance: Hassan Ibrahim (Daily 5 AM)       │
│ • Weekend Coverage: Rotating staff                    │
│                                                        │
│ [💾 Save Changes] [📅 View Booking Calendar]          │
│ [📊 Generate Usage Report] [🔄 Reset to Defaults]    │
└────────────────────────────────────────────────────────┘
```

### Security Staff Mobile App Interface

**Security Guard Dashboard**
```
┌─────────────────────────────────────┐
│ 🔐 Gate A - Main Entrance          │
│ Guard: Ahmed Mohamed                │
│ Shift: 6:00 AM - 2:00 PM            │
├─────────────────────────────────────┤
│                                     │
│ Current Status:                     │
│ ┌─────────────────────────────┐   │
│ │ 🟢 Gate Open & Operational  │   │
│ │ Last Entry: 2 minutes ago   │   │
│ │ Today's Traffic: 127 cars   │   │
│ │ Temperature: 28°C           │   │
│ └─────────────────────────────┘   │
│                                     │
│ Quick Actions:                      │
│ ┌─────────┬─────────┬─────────┐   │
│ │ 📱 Scan │ ✋ Manual│ 🚨 Alert│   │
│ │QR Code  │  Entry  │Emergency│   │
│ └─────────┼─────────┼─────────┤   │
│ │ 📋 View │ 📦 Log  │ 📞 Call │   │
│ │Schedule │Package │Manager  │   │
│ └─────────┴─────────┴─────────┘   │
│                                     │
│ 🔔 Pending Approvals (2):          │
│ • Delivery for Unit B5-308         │
│   📦 DHL - 3 minutes ago           │
│                                     │
│ • Service provider at entrance      │
│   🔧 Ahmed's Plumbing - Now        │
│                                     │
│ 📅 Today's Expected Visitors:       │
│ 23 pre-registered guests           │
│ [📋 View Full List]                 │
│                                     │
│ 📊 Shift Summary:                  │
│ • Entries: 89 vehicles, 156 people │
│ • Visitor passes: 23 issued        │
│ • Incidents: 0                     │
│ • Deliveries: 15 logged            │
└─────────────────────────────────────┘
```

**QR Code Scanner Interface**
```
┌─────────────────────────────────────┐
│ ← Back        Scan Visitor QR       │
├─────────────────────────────────────┤
│                                     │
│ Point camera at visitor's QR code   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ │     [CAMERA VIEWFINDER]     │   │
│ │                             │   │
│ │    ┌─────────────────┐      │   │
│ │    │     QR CODE     │      │   │
│ │    │   SCAN AREA     │      │   │
│ │    └─────────────────┘      │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                     │
│ 💡 Scanning Instructions:           │
│ • Hold phone steady                 │
│ • Ensure good lighting              │
│ • QR code must be fully visible     │
│                                     │
│ [🔦 Toggle Flashlight]              │
│                                     │
│ Can't scan? [✋ Manual Entry]        │
│                                     │
│ Recent Scans:                       │
│ • Mohamed Ali - Unit B12-304 ✅     │
│ • Sarah Ahmed - Unit A5-201 ✅      │
│ • DHL Delivery - Unit C3-102 ✅     │
└─────────────────────────────────────┘
```

**Visitor Verification Result**
```
┌─────────────────────────────────────┐
│           ✅ Visitor Verified!      │
├─────────────────────────────────────┤
│                                     │
│ Guest Information:                  │
│ ┌─────────────────────────────┐   │
│ │ Name: Mohamed Ali           │   │
│ │ Phone: +20 101 234 5678     │   │
│ │ Visiting: Unit B12-304      │   │
│ │ Host: Sarah Ahmed           │   │
│ │ Valid Until: 5:00 PM        │   │
│ │ Pass #: VIS-2024-1234       │   │
│ │                             │   │
│ │ Vehicle: Toyota Corolla     │   │
│ │ Plate: ABC 1234             │   │
│ │ Parking: Assigned Slot V-23 │   │
│ └─────────────────────────────┘   │
│                                     │
│ Special Instructions:               │
│ "Visitor for birthday party.        │
│ May stay until late evening."       │
│                                     │
│ Actions:                            │
│ ┌─────────────────────────────┐   │
│ │      🟢 Allow Entry         │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │      ❌ Deny Entry          │   │
│ └─────────────────────────────┘   │
│                                     │
│ Auto-Actions on Allow:              │
│ ✓ Gate opens automatically         │
│ ✓ Visitor entry logged             │
│ ✓ Host notification sent           │
│ ✓ Parking pass printed             │
│ ✓ Access valid until 5:00 PM       │
│                                     │
│ [📋 View Visitor History]           │
└─────────────────────────────────────┘
```

## Technical Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Run database migration with all new tables
- [ ] Update TypeScript types for new schema
- [ ] Extend user role system
- [ ] Test data integration points

### Phase 2: Core APIs (Week 2)
- [ ] Implement community management APIs
- [ ] Extend authentication middleware
- [ ] Create service integration endpoints
- [ ] Build payment integration extensions

### Phase 3: Mobile App (Weeks 3-4)
- [ ] Add community navigation
- [ ] Build resident onboarding
- [ ] Create amenity booking interface
- [ ] Implement visitor management with QR
- [ ] Integrate service requests

### Phase 4: Web Dashboards (Weeks 5-6)
- [ ] Developer admin interface
- [ ] Compound manager dashboard
- [ ] Resident management tools
- [ ] Analytics and reporting

### Phase 5: Integration Testing (Week 7)
- [ ] End-to-end user journeys
- [ ] Cross-system data flow testing
- [ ] Performance optimization
- [ ] Security audit

## Success Metrics and KPIs

### Technical Metrics
- Database migration success rate: 100%
- API response times: <200ms average
- Mobile app crash rate: <1%
- Integration data accuracy: 99.5%

### Business Metrics
- Pilot compound onboarding: 1 compound, 100-200 units
- Resident adoption rate: >80% in pilot
- Feature usage: Visitor management >60%, Amenities >40%
- Service request resolution time: <4 hours average

### User Experience Metrics
- Onboarding completion rate: >90%
- Monthly active users: >75% of residents
- User satisfaction score: >4.5/5
- Support ticket reduction: >50% for community-related issues

## Risk Mitigation

### Technical Risks
1. **Data Migration Issues**: Extensive testing with backup/rollback procedures
2. **Performance Impact**: Database indexing and query optimization
3. **Integration Conflicts**: Staged deployment with feature flags

### Business Risks
1. **User Adoption**: Comprehensive onboarding and training
2. **Compound Manager Buy-in**: Clear ROI demonstration and support
3. **Service Provider Integration**: Gradual rollout with incentives

### Operational Risks
1. **Support Overhead**: Self-service tools and comprehensive documentation
2. **Scalability Concerns**: Cloud-native architecture and auto-scaling
3. **Security Vulnerabilities**: Regular audits and penetration testing

## Conclusion

This implementation plan leverages 80% of our existing infrastructure while adding specialized community management capabilities. The phased approach ensures minimal disruption to current operations while building a comprehensive solution for the Egyptian property management market.

The integration strategy maintains backward compatibility while extending functionality for multi-role users and complex property relationships. This approach positions us to capture the significant market opportunity in community management while strengthening our core real estate platform.

│ > " // TODO: Send notification to visitor with pass details                                              │   │
│   │                                                                                                          │
│   │ │     // TODO: If high security, send notification to compound manager for approval                      │
│   │ │                                                                                                        │
│   │ │                                                                                                " we    │
│   have mailgin implemented in our app how could we complete the implementation in                            │
│   app/api/community/visitor-passes/route.ts and (app/api/community/service-requests/route.ts) for the        │
│   service layer we're gonna build      