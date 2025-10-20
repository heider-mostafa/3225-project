import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Language resources (comprehensive translations based on mobile app)
const resources = {
  en: {
    translation: {
      // Common
      common: {
        ok: 'OK',
        cancel: 'Cancel',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        remove: 'Remove',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        optional: 'optional',
        required: 'required',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        viewAll: 'View All',
        viewMore: 'View More',
        showLess: 'Show Less',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        done: 'Done',
        retry: 'Retry',
        refresh: 'Refresh',
        share: 'Share',
        at: 'at',
        filterBy: 'Filter by',
        sortBy: 'Sort by',
        browseAllProperties: 'Browse All Properties',
        closePreview: 'Close Preview',
        previewTour: 'Preview Tour',
        highlights: 'Highlights',
        contactAgent: 'Contact an Agent',
        bed: 'bed',
        bath: 'bath',
        sqm: 'sqm',
        views: 'views',
        
        // Room types
        livingRoom: 'Living Room',
        kitchen: 'Kitchen',
        masterBedroom: 'Master Bedroom',
        guestBedroom: 'Guest Bedroom',
        bathroom: 'Bathroom',
        bathrooms: 'Bathrooms',
        garden: 'Garden',
        openLivingSpace: 'Open Living Space',
        masterSuite: 'Master Suite',
        bedrooms: 'Bedrooms',
        poolArea: 'Pool Area',
        terrace: 'Terrace',
        
        // Highlights
        cityViews: 'City Views',
        modernKitchen: 'Modern Kitchen',
        spaciousRooms: 'Spacious Rooms',
        privateGarden: 'Private Garden',
        familyFriendly: 'Family Friendly',
        parkingSpace: 'Parking Space',
        buildingAmenities: 'Building Amenities',
        security: 'Security',
        modernDesign: 'Modern Design',
        multiLevelLiving: 'Multi-level Living',
        privateEntrance: 'Private Entrance',
        communityFeatures: 'Community Features',
        efficientLayout: 'Efficient Layout',
        primeLocation: 'Prime Location',
        swimmingPool: 'Swimming Pool',
        luxuryFeatures: 'Luxury Features',
        rooftopTerrace: 'Rooftop Terrace',
        panoramicViews: 'Panoramic Views',
        luxuryFinishes: 'Luxury Finishes',
        modernFeatures: 'Modern Features',
        greatLocation: 'Great Location',
        wellMaintained: 'Well Maintained',
      },

      // App
      app: {
        name: 'VirtualEstate',
        tagline: 'Your Gateway to Egyptian Properties',
        version: 'Version',
      },

      // Navigation
      nav: {
        home: 'Home',
        properties: 'Properties',
        virtualTours: 'Virtual Tours',
        auctions: 'Auctions',
        about: 'About',
        contact: 'Contact',
        profile: 'Profile',
        signIn: 'Sign In',
        signOut: 'Sign Out',
        admin: 'Admin',
        settings: 'Settings',
        notifications: 'Notifications',
        saved: 'Saved',
        appraisers: 'Find Appraisers',
        rentals: 'Rentals',
      },

      // Virtual Tours
      virtualTours: {
        pageDescription: 'Explore properties from anywhere in the world with our immersive 3D virtual tours.',
        fullDescription: 'Explore properties from anywhere in the world with our immersive 3D virtual tours. Experience every room, every detail, as if you were there.',
        toursAvailable: 'virtual tours available',
        noToursFound: 'No virtual tours found',
        tryAdjustingFilters: 'Try adjusting your filters or check back later for new tours.',
        roomsToExplore: 'Rooms to Explore',
        startFullTour: 'Start Full Tour',
        startVirtualTour: 'Start Virtual Tour',
        viewProperty: 'View Property',
        duration: 'Duration',
        minutes: 'minutes',
        ctaTitle: 'Ready to Find Your Dream Home?',
        ctaDescription: 'Browse our complete property collection and schedule virtual tours with AI assistance.',
      },

      // Auctions
      auction: {
        pageTitle: 'Property Auctions',
        pageDescription: 'Discover exclusive properties through our live auction platform. Bid in real-time with virtual tours.',
        totalAuctions: 'Total Auctions',
        liveAuctions: 'Live Auctions',
        endedAuctions: 'Ended Auctions',
        preview: 'Preview',
        live: 'Live',
        ended: 'Ended',
        sold: 'Sold',
        cancelled: 'Cancelled',
        liveNow: 'Live Now',
        currentBid: 'Current Bid',
        reservePrice: 'Reserve Price',
        buyNowPrice: 'Buy Now Price',
        noBids: 'No bids',
        bidCount: 'bids',
        timeRemaining: 'Time Remaining',
        startingSoon: 'Starting Soon',
        virtualTour: '3D Tour',
        reserveMet: 'Reserve Met',
        reserveNotMet: 'Reserve Not Met',
        placeBid: 'Place Bid',
        buyNow: 'Buy Now',
        viewDetails: 'View Details',
        howItWorks: 'How Property Auctions Work',
        step1Title: '7-Day Preview',
        step1Description: 'Explore properties with virtual tours and prepare for the auction. Buy now option available.',
        step2Title: 'Live Auction',
        step2Description: 'Compete in real-time during the 1-hour live auction while viewing the virtual tour.',
        step3Title: 'Win & Purchase',
        step3Description: 'Winning bidders get the property, with overprice shared between platform and developers.',
        ctaTitle: 'Ready to Start Bidding?',
        ctaDescription: 'Join thousands of buyers competing for exclusive properties in our live auctions.',
        allTypes: 'All Types',
        house: 'House',
        apartment: 'Apartment',
        condo: 'Condo',
        townhouse: 'Townhouse',
        land: 'Land',
        selectPropertyType: 'Select type',
        sortBy: 'Sort By',
        filters: 'Filters',
        advancedFilters: 'Advanced Filters',
        loadMore: 'Load More',
        noAuctions: 'No auctions found',
        tryAdjustingFilters: 'Try adjusting your filters or check back later for new auctions.',
      },

      // Search filters
      search: {
        allPropertyTypes: 'All Property Types',
        apartments: 'Apartments',
        houses: 'Houses',
        villas: 'Villas',
        penthouses: 'Penthouses',
        studios: 'Studios',
        condos: 'Condos',
        townhouses: 'Townhouses',
        mostPopular: 'Most Popular',
        highestRated: 'Highest Rated',
        shortestFirst: 'Shortest First',
        priceLowToHigh: 'Price: Low to High',
        priceHighToLow: 'Price: High to Low',
        newestFirst: 'Newest First',
        
        // Advanced search specific
        compound: 'Compound',
        advancedPropertySearch: 'Advanced Property Search',
        activeFilters: '{{count}} filters active',
        findPerfectProperty: 'Find your perfect property',
        clearAll: 'Clear All',
        searchKeywords: 'Search Keywords',
        searchPlaceholder: 'Location, property type, features...',
        budgetFinancing: 'Budget & Financing',
        popular: 'Popular',
        totalPriceRange: 'Total Price Range',
        apartment: 'Apartment',
        villa: 'Villa',
        penthouse: 'Penthouse',
        townhouse: 'Townhouse',
        condominium: 'Condominium',
        swimmingPool: 'Swimming Pool',
        garden: 'Garden',
        security247: '24/7 Security',
        parking: 'Parking',
        gymFitness: 'Gym/Fitness',
        playground: 'Playground',
        communityCenter: 'Community Center',
        balcony: 'Balcony',
        terrace: 'Terrace',
        maidRoom: 'Maid Room',
        storageRoom: 'Storage Room',
        laundryRoom: 'Laundry Room',
        studyRoom: 'Study Room',
        walkInCloset: 'Walk-in Closet',
        builtInWardrobes: 'Built-in Wardrobes',
        centralAC: 'Central AC',
        floorHeating: 'Floor Heating',
        smartHome: 'Smart Home',
        solarPanels: 'Solar Panels',
        searchProperties: 'Search Properties',
        
        // Additional search fields
        downPaymentRange: 'Down Payment Range',
        monthlyInstallment: 'Monthly Installment',
        paymentPlanOptions: 'Payment Plan Options',
        propertyBasics: 'Property Basics',
        propertyTypes: 'Property Types',
        bedrooms: 'Bedrooms',
        bathrooms: 'Bathrooms',
        squareFeet: 'Square Feet',
        locationProximity: 'Location & Proximity',
        preferredCities: 'Preferred Cities',
        maximumDistanceTo: 'Maximum Distance To',
        amenitiesFeatures: 'Amenities & Features',
        communityAmenities: 'Community Amenities',
        propertyFeatures: 'Property Features',
        additionalOptions: 'Additional Options',
        compoundDevelopment: 'Compound/Development',
        sortResults: 'Sort Results',
        sortOrder: 'Sort Order',
        cashPayment: 'Cash Payment',
        installments: 'Installments',
        mortgage: 'Mortgage',
        rentToOwn: 'Rent to Own',
        anyDistance: 'Any distance',
        compoundPlaceholder: 'e.g., Palm Hills, Mivida, Katameya Heights...',
        sortByPlaceholder: 'Sort by...',
        orderPlaceholder: 'Order...',
        resetAll: 'Reset All',
        noFiltersApplied: 'No filters applied',
        useAdvancedFilters: 'Use advanced filters to find your perfect property',
      },

      // Authentication
      auth: {
        // Common auth terms
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        fullName: 'Full Name',
        phone: 'Phone Number',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
        login: 'Login',
        register: 'Register',
        createAccount: 'Create Account',
        forgotPassword: 'Forgot Password?',
        rememberMe: 'Remember Me',
        
        // Placeholders
        emailPlaceholder: 'Enter your email address',
        passwordPlaceholder: 'Enter your password',
        confirmPasswordPlaceholder: 'Confirm your password',
        fullNamePlaceholder: 'Enter your full name',
        phonePlaceholder: 'Enter your phone number',
        
        // Welcome messages
        welcomeBack: 'Welcome back! Sign in to your account',
        joinCommunity: 'Join thousands of property seekers',
        
        // Loading states
        signingIn: 'Signing In...',
        creatingAccount: 'Creating Account...',
        sending: 'Sending...',
        
        // Error messages
        error: 'Authentication Error',
        loginFailed: 'Login Failed',
        registrationFailed: 'Registration Failed',
        socialLoginFailed: 'Social Login Failed',
        unknownError: 'An unexpected error occurred',
        fillAllFields: 'Please fill in all required fields',
        
        // Password requirements
        passwordRequirements: {
          minLength: 'At least 8 characters',
          hasNumber: 'Contains a number',
          hasSpecial: 'Contains a special character',
          hasUpper: 'Contains uppercase letter',
          hasLower: 'Contains lowercase letter',
        },
        
        // Validation messages
        validation: {
          fullNameRequired: 'Full name is required',
          emailRequired: 'Email address is required',
          emailInvalid: 'Please enter a valid email address',
          phoneInvalid: 'Please enter a valid phone number',
          passwordRequired: 'Password is required',
          passwordWeak: 'Password does not meet requirements',
          passwordMismatch: 'Passwords do not match',
          termsRequired: 'You must agree to terms and conditions',
        },
        
        // Terms and conditions
        agreeToTerms: 'I agree to the',
        termsOfService: 'Terms of Service',
        and: ' and ',
        privacyPolicy: 'Privacy Policy',
        
        // Account status
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        
        // Social login
        orContinueWith: 'or continue with',
        orRegisterWith: 'or register with',
        redirecting: 'Redirecting...',
        
        // Password reset
        resetEmailSent: 'Reset Email Sent',
        resetEmailSentMessage: 'Check your email for password reset instructions',
        forgotPasswordMessage: 'Enter your email address and we\'ll send you a link to reset your password',
        sendResetLink: 'Send Reset Link',
        backToLogin: 'Back to Login',
        rememberPassword: 'Remember your password?',
        
        // Authentication
        confirmSignOut: 'Are you sure you want to sign out?',
        pleaseSignIn: 'Please sign in to view your profile',
        
        // Missing auth keys from analysis
        passwordRequirementsTitle: 'Password Requirements:',
        passwordLengthRequirement: 'Password must be at least 6 characters long',
        chooseAccountType: 'Choose Your Account Type',
        completingSignIn: 'Completing sign in...',
        
        // Additional placeholders
        confirmNewPassword: 'Confirm new password',
      },

      // Properties
      properties: {
        title: 'Properties',
        search: 'Search properties...',
        filters: 'Filters',
        sortBy: 'Sort By',
        noResults: 'No properties found',
        loadMore: 'Load More',
        topCompounds: 'Top Compounds',
        topCompoundsDesc: 'Discover the most sought-after residential communities in Egypt',
        hottestListings: 'Hottest Listings This Week',
        hottestListingsDesc: 'Properties with the highest interest and price growth',
        featuredProperties: 'Explore Our Featured Properties',
        featuredPropertiesDesc: 'Experience immersive virtual tours with AI-powered assistance. Get instant answers about properties while exploring in 3D.',
        featuredDescription: 'Experience immersive virtual tours with AI-powered assistance. Get instant answers about properties while exploring in 3D.',
        
        // Property Valuation Section
        propertyValuation: {
          title: 'Know Your Property\'s',
          titleHighlight: 'True Worth',
          description: 'Get professional property valuation from certified experts. Make confident decisions with accurate market data.',
          professionalAssessment: 'Professional Assessment',
          certifiedAppraisalReport: 'Certified Appraisal Report',
          whyGetValuation: 'Why Get Professional Valuation?',
          sellingProperty: 'Selling Your Property',
          sellingPropertyDesc: 'Price it right to attract serious buyers',
          buyingProperty: 'Buying Property',
          buyingPropertyDesc: 'Ensure you\'re paying fair market value',
          refinancing: 'Refinancing',
          refinancingDesc: 'Get accurate value for loan applications',
          insuranceClaims: 'Insurance Claims',
          insuranceClaimsDesc: 'Document property value for coverage',
          findCertifiedAppraiser: 'Find Certified Appraiser',
          turnaround48Hours: '48 Hour Turnaround',
          turnaroundDesc: 'Quick professional reports',
          licensedProfessionals: 'Licensed Professionals',
          licensedDesc: 'Certified property appraisers',
          detailedReports: 'Detailed Reports',
          detailedDesc: 'Comprehensive market analysis',
        },
        startVirtualTour: 'Start Virtual Tour',
        searchPlaceholder: 'Search properties by location, type, or features...',
        topCompoundsDescription: 'Discover the most sought-after residential communities in Egypt',
        viewAllCompounds: 'View All Compounds',
        hottestListingsDescription: 'Properties with the highest interest and price growth',
        viewAllTrending: 'View All Trending',
        viewDetails: 'View Details',
        viewProperties: 'View Properties',
        browseAll: 'Browse All Properties',
        apartments: 'Apartments',
        villas: 'Villas',
        penthouses: 'Penthouses',
        townhouses: 'Townhouses',
        studios: 'Studios',
        
        // Properties page specific
        pageTitle: 'All Properties',
        pageDescription: 'Discover your perfect home with immersive virtual tours',
        searchPlaceholder: 'Search by location, property type, or features...',
        advancedFilters: 'Advanced Filters',
        propertyType: 'Property Type',
        allTypes: 'All Types',
        apartment: 'Apartment',
        villa: 'Villa',
        penthouse: 'Penthouse',
        townhouse: 'Townhouse',
        condominium: 'Condominium',
        house: 'House',
        bedrooms: 'Bedrooms',
        any: 'Any',
        bedroom: 'Bedroom',
        status: 'Status',
        allStatus: 'All Status',
        available: 'Available',
        pending: 'Pending',
        sold: 'Sold',
        sortBy: 'Sort By',
        priceLowToHigh: 'Price: Low to High',
        priceHighToLow: 'Price: High to Low',
        newestFirst: 'Newest First',
        mostBedrooms: 'Most Bedrooms',
        largestFirst: 'Largest First',
        priceRange: 'Price Range',
        savedSearches: 'Saved Searches',
        activeFilters: 'Active Filters',
        clearAll: 'Clear All',
        searching: 'Searching...',
        smartSearch: 'Smart Search',
        examples: 'Try: "3 bedroom villa in New Cairo" or "apartment under $500k with pool"',
        showingResults: 'Showing {{count}} of {{total}} properties',
        showingProperties: 'Showing {{count}} properties',
        saveSearch: 'Save Search',
        virtualTour: 'Virtual Tour',
        beds: 'beds',
        baths: 'baths',
        sqm: 'sqm',
        noPropertiesFound: 'No properties found',
        noPropertiesDescription: 'Try adjusting your search criteria or filters',
        clearFilters: 'Clear Filters',
        loadingMoreProperties: 'Loading more properties...',
        scrollToLoadMore: 'Scroll down to load more properties',
        popularLocations: 'Popular Locations',
        showingOf: 'Showing {{current}} of {{total}} properties',
        reachedEnd: 'You\'ve reached the end!',
        enterSearchName: 'Enter a name for this search:',
        gridView: 'Grid view',
        listView: 'List view',
        mapView: 'Map view',
        inquireNow: 'Inquire Now',
        hot: 'HOT',
        daysAgo: 'd ago',
        
        // Property types (updated to avoid duplicates)
        house: 'House',
        studio: 'Studio',
        penthouse: 'Penthouse',
        townhouse: 'Townhouse',
        duplex: 'Duplex',
        
        // Property status
        forSale: 'For Sale',
        forRent: 'For Rent',
        sold: 'Sold',
        rented: 'Rented',
        
        // Features
        bedrooms: 'Bedrooms',
        bathrooms: 'Bathrooms',
        area: 'Area',
        price: 'Price',
        location: 'Location',
        
        // Details
        description: 'Description',
        features: 'Features',
        amenities: 'Amenities',
        contact: 'Contact',
        
        // Actions
        viewDetails: 'View Details',
        bookViewing: 'Book Viewing',
        contactAgent: 'Contact Agent',
        saveProperty: 'Save Property',
        shareProperty: 'Share Property',
        scheduleTour: 'Schedule Tour',
        
        // Missing property keys from analysis
        loadingProperty: 'Loading property...',
        translating: 'Translating...',
        browseProperties: 'Browse Properties',
        backToHome: 'Back to Home',
        
        // Appraiser section
        licensedPropertyAppraiser: 'Licensed Property Appraiser',
        experience: 'Experience:',
        specialties: 'Specialties:',
        serviceAreas: 'Service Areas:',
        verified: 'Verified',
        noAppraiser: 'No appraiser assigned to this property',
        contactForAppraisal: 'Contact us for professional appraisal services',
      },

      // Search & Filters
      searchFilters: {
        priceRange: 'Price Range',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        propertyType: 'Property Type',
        bedrooms: 'Bedrooms',
        bathrooms: 'Bathrooms',
        area: 'Area',
        location: 'Location',
        clearFilters: 'Clear Filters',
        applyFilters: 'Apply Filters',
        sortBy: 'Sort By',
        newest: 'Newest',
        oldest: 'Oldest',
        priceLowToHigh: 'Price: Low to High',
        priceHighToLow: 'Price: High to Low',
        areaSmallToLarge: 'Area: Small to Large',
        areaLargeToSmall: 'Area: Large to Small',
      },

      // Cities (Egyptian cities)
      cities: {
        cairo: 'Cairo',
        giza: 'Giza',
        alexandria: 'Alexandria',
        newCairo: 'New Cairo',
        sheikhZayed: 'Sheikh Zayed',
        maadi: 'Maadi',
        zamalek: 'Zamalek',
        heliopolis: 'Heliopolis',
        nasr: 'Nasr City',
        shorouk: 'Shorouk',
        rehab: 'Rehab',
        october: '6th of October',
        newCapital: 'New Administrative Capital',
        fifthSettlement: 'Fifth Settlement',
        katameya: 'Katameya',
      },

      // Currency
      currency: {
        egp: 'EGP',
        egpFull: 'Egyptian Pound',
        million: 'Million',
        thousand: 'Thousand',
        priceRange: 'Price Range',
        from: 'From',
        to: 'To',
      },

      // Contact & Communication
      contact: {
        callAgent: 'Call Agent',
        emailAgent: 'Email Agent',
        whatsapp: 'WhatsApp',
        schedule: 'Schedule Viewing',
        inquiry: 'Send Inquiry',
        message: 'Message',
        phone: 'Phone',
        email: 'Email',
        sendMessage: 'Send Message',
        messageTitle: 'Property Inquiry',
        messagePlaceholder: 'Hello, I\'m interested in this property...',
        selectTime: 'Select Time',
        selectDate: 'Select Date',
        viewingScheduled: 'Viewing scheduled successfully',
        inquirySent: 'Inquiry sent successfully',
      },

      // Media
      media: {
        photos: 'Photos',
        video: 'Video',
        virtualTour: '360° Virtual Tour',
        floorPlan: 'Floor Plan',
        gallery: 'Gallery',
      },

      // Property Details
      propertyDetails: {
        overview: 'Overview',
        details: 'Details',
        features: 'Features',
        amenities: 'Amenities',
        location: 'Location',
        similarProperties: 'Similar Properties',
        propertyId: 'Property ID',
        yearBuilt: 'Year Built',
        parkingSpaces: 'Parking Spaces',
        furnished: 'Furnished',
        unfurnished: 'Unfurnished',
        semifurnished: 'Semi-Furnished',
        utilities: 'Utilities',
        maintenance: 'Maintenance',
        security: 'Security',
        garden: 'Garden',
        balcony: 'Balcony',
        terrace: 'Terrace',
        pool: 'Swimming Pool',
        gym: 'Gym',
        elevator: 'Elevator',
        centralAc: 'Central AC',
        heating: 'Heating',
        internetWifi: 'Internet/WiFi',
        
        // Property page specific
        backToProperties: 'Back to Properties',
        share: 'Share',
        aboutThisProperty: 'About This Property',
        keyHighlights: 'Key Highlights',
        propertyType: 'Property Type',
        bedrooms: 'Bedrooms',
        bathrooms: 'Bathrooms',
        condition: 'Condition',
        lotSize: 'Lot Size',
        floor: 'Floor',
        balconies: 'Balconies',
        availableDate: 'Available Date',
        financialInformation: 'Financial Information',
        monthlyHOA: 'Monthly HOA',
        annualPropertyTax: 'Annual Property Tax',
        annualInsurance: 'Annual Insurance',
        premiumAmenities: 'Premium Amenities',
        swimmingPool: 'Swimming Pool',
        security247: '24/7 Security',
        fitnessCenter: 'Fitness Center',
        elevatorAccess: 'Elevator Access',
        storageSpace: 'Storage Space',
        maidsRoom: "Maid's Room",
        driversRoom: "Driver's Room",
        nearbyServices: 'Nearby Services',
        locationInfrastructure: 'Location & Infrastructure',
        distanceToKeyLocations: 'Distance to Key Locations',
        metroStation: 'Metro Station',
        airport: 'Airport',
        shoppingMall: 'Shopping Mall',
        hospital: 'Hospital',
        infrastructure: 'Infrastructure',
        cooling: 'Cooling',
        waterSource: 'Water Source',
        internet: 'Internet',
        policies: 'Policies',
        petPolicy: 'Pet Policy',
        scheduleShowing: 'Schedule Showing',
        sendMessage: 'Send Message',
        licensedRealEstateBroker: 'Licensed Real Estate Broker',
        experience: 'Experience',
        years: 'years',
        specialties: 'Specialties',
        languages: 'Languages',
        primary: 'Primary',
        additionalBrokers: 'Additional Brokers',
        moreBrokersAvailable: 'more brokers available',
        noBrokersAssigned: 'No brokers assigned',
        contactUsForAssistance: 'Contact us for assistance',
        tourProgress: 'Tour Progress',
        currentRoom: 'Current Room',
        timeInRoom: 'Time in Room',
        roomsVisited: 'Rooms Visited',
        askAIAssistant: 'Ask AI Assistant',
        getInstantAnswers: 'Get instant answers about this property',
        virtualTour: 'Virtual Tour',
        exploreEveryRoom: 'Explore every room in 3D',
        current: 'Current',
        clickToExpand: 'Click to expand',
        virtualTour3D: '3D Virtual Tour',
        viewInFullscreen: 'View in Fullscreen',
        bookingConfirmed: 'Booking Confirmed! 🎉',
        viewingScheduled: 'Your viewing is scheduled for',
        checkEmailForDetails: 'Check your email for details.',
        confirmationCode: 'Confirmation Code:',
        saveCodeForRecords: 'Save this code for your records. You can use it to manage your booking.',
        bookingFailed: 'Booking Failed',
        bookingError: 'Booking Error',
        missingBookingInfo: 'Missing booking information. Please try again.',
        somethingWentWrong: 'Something went wrong. Please try again.',
        linkCopiedToClipboard: 'Link copied to clipboard!',
        parking: 'parking',
        reviews: 'reviews',
        more: 'more',
        km: 'km',
        sqm: 'sqm',
        na: 'N/A',
        of: 'of',
        propertyNotFound: 'Property not found',
        failedToLoadProperty: 'Failed to load property',
        
        // Property conditions
        excellent: 'Excellent',
        veryGood: 'Very Good',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor',
        
        // Pet policies
        allowed: 'Allowed',
        depositRequired: 'Deposit Required',
        notAllowed: 'Not Allowed',
        
        // Commute Analysis
        commuteAnalysis: 'Commute Analysis & Lifestyle Compatibility',
        commuteDescription: 'Add your daily destinations to see commute times, costs, and get a lifestyle compatibility score for this location.',
        
        // Appraiser & Professional Services
        professionalAppraiser: 'Professional Appraiser',
        licensedPropertyAppraiser: 'Licensed Property Appraiser',
        bookAppraisal: 'Book Appraisal',
        propertyManager: 'Property Manager',
        noAppraiserAssigned: 'No appraiser assigned to this property',
        contactForAppraisal: 'Contact us for professional appraisal services',
        noDescriptionAvailable: 'No description available.',
        
        // Virtual Tours
        virtualTours: 'Virtual Tours',
        'threeDVirtualTour': '3D Virtual Tour',
        videoTour: 'Video Tour',
        virtualTourTitle: 'Virtual Tour Experience',
        
        // Property Content
        aboutThisPlace: 'About this place',
        propertyHighlights: 'Property Highlights',
        builtIn: 'Built in',
        modernConstruction: 'Modern construction',
        fullyFurnished: 'Fully Furnished',
        moveInReady: 'Move-in ready',
        floorLevel: 'Floor',
        outdoorSpace: 'Outdoor space',
        secureParking: 'Secure parking included',
        petFriendly: 'Pet Friendly',
        petsWelcome: 'Pets welcome',
        
        
        // Booking Flow
        bookYourStay: 'Book Your Stay',
        guestInformation: 'Guest Information',
        numberOfGuests: 'Number of Guests',
        paymentConfirmation: 'Payment & Confirmation',
        bookingSummary: 'Booking Summary',
        guests: 'Guests',
        availablePaymentMethods: 'Available Payment Methods',
        bookingConfirmed: 'Booking Confirmed',
        confirmPay: 'Confirm & Pay',
        
        // Guest Experience Properties
        brandNewBuilding: 'Brand new building',
        modernInfrastructure: 'with modern infrastructure',
        moveInReadyNoHassle: 'Move-in ready, no hassle',
        stunningViews: 'Stunning city views from your windows',
        primeLocation: 'Prime downtown location in the heart of Cairo',
        exclusiveSpaAccess: 'Exclusive spa access with luxury wellness facilities',
        professionalSecurity: 'Professional security - 24/7 building security for peace of mind',
        spaciousLayout: 'Spacious layout',
        generousForDowntown: 'generous for downtown',
        contemporaryDesign: 'Contemporary design with stylish modern finishes',
        locationAndInfrastructure: 'Location & Infrastructure',
        notSpecified: 'Not specified',
        highSpeedFiberInternet: 'High-speed fiber internet',
        smartHomeAutomation: 'Smart home automation',
        premiumBedding: 'Premium bedding',
      },

      // Favorites
      favorites: {
        title: 'Favorites',
        addToFavorites: 'Add to Favorites',
        removeFromFavorites: 'Remove from Favorites',
        noFavorites: 'No favorite properties yet',
        favoriteAdded: 'Added to favorites',
        favoriteRemoved: 'Removed from favorites',
        confirmRemove: 'Are you sure you want to remove this property from favorites?',
        browseProperties: 'Browse Properties',
      },

      // Rentals
      rentals: {
        title: 'Rentals',
        pageTitle: 'Property Rentals',
        monthlyRate: 'Monthly rate',
        yearlyRate: 'Yearly rate',
        nightlyRate: 'Nightly rate',
        minimumStay: 'Minimum stay',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        cleaningFee: 'Cleaning fee',
        securityDeposit: 'Security deposit',
        extraGuestFee: 'Extra guest fee',
        perGuest: 'per guest',
        nights: 'nights',
        perNight: 'per night',
        checkAvailability: 'Check Availability',
        requestToBook: 'Request to Book',
        bookNow: 'Book Now',
        instantBook: 'Instant Book',
        share: 'Share',
        virtualTour: 'Virtual Tour',
        amenities: 'Amenities',
        location: 'Location',
        infrastructure: 'Infrastructure',
        guestExperienceHighlights: 'Guest Experience Highlights',
        propertyHighlights: 'Property Highlights',
        aboutThisPlace: 'About this place',
        propertyManager: 'Property Manager',
        distanceToKeyLocations: 'Distance to Key Locations',
        metroStation: 'Metro Station',
        airport: 'Airport',
        shoppingMall: 'Shopping Mall',
        hospital: 'Hospital',
        locationInformation: 'Location Information',
        city: 'City',
        propertyType: 'Property Type',
        compound: 'Compound',
        heating: 'Heating',
        cooling: 'Cooling',
        waterSource: 'Water Source',
        internet: 'Internet',
        bedrooms: 'Bedrooms',
        bathrooms: 'Bathrooms',
        guests: 'Guests',
        upTo: 'Up to',
        noDescriptionAvailable: 'No description available',
        builtIn: 'Built in',
        modernConstruction: 'Modern construction',
        fullyFurnished: 'Fully Furnished',
        moveInReady: 'Move-in ready',
        floorLevel: 'Floor',
        outdoorSpace: 'Outdoor space',
        secureParking: 'Secure parking included',
        parkingSpaces: 'Parking Space(s)',
        secureIncluded: 'Secure parking included',
        balcony: 'Balcony',
        balconies: 'Balconies',
        petFriendly: 'Pet Friendly',
        petsWelcome: 'Pets welcome',
        call: 'Call',
        email: 'Email',
        license: 'License',
        viewOnGoogleMaps: 'View on Google Maps',
        reviews: 'Reviews',
        bookingComplete: 'Booking completed successfully!',
        
        // Additional amenities
        hasWifi: 'WiFi',
        hasAc: 'Air Conditioning',
        hasKitchen: 'Kitchen',
        hasParking: 'Parking',
        hasSwimmingPool: 'Swimming Pool',
        hasGym: 'Gym',
        hasElevator: 'Elevator',
        hasSeaView: 'Sea View',
        hasNileView: 'Nile View',
        hasBalcony: 'Balcony',
      },

      // Amenities
      amenities: {
        wifi: 'WiFi',
        airConditioning: 'Air Conditioning',
        heating: 'Heating',
        kitchen: 'Kitchen',
        tv: 'TV',
        washingMachine: 'Washing Machine',
        parking: 'Parking',
        swimmingPool: 'Swimming Pool',
        gym: 'Gym',
        securityGuard: 'Security Guard',
        elevator: 'Elevator',
        balcony: 'Balcony',
        seaView: 'Sea View',
        nileView: 'Nile View',
        cityView: 'City View',
        cctvSecurity: 'CCTV Security',
        conciergeService: 'Concierge Service',
        valetParking: 'Valet Parking',
        spa: 'Spa',
        beachAccess: 'Beach Access',
        safe: 'Safe',
        satelliteTV: 'Satellite TV',
      },

      // Agent Profile
      agent: {
        profile: 'Agent Profile',
        experience: 'Years of Experience',
        listings: 'Active Listings',
        reviews: 'Reviews',
        rating: 'Rating',
        languages: 'Languages Spoken',
        specialties: 'Specialties',
        contactAgent: 'Contact Agent',
        viewAllListings: 'View All Listings',
        aboutAgent: 'About Agent',
        verifiedAgent: 'Verified Agent',
        topAgent: 'Top Agent',
      },

      // Errors
      errors: {
        networkError: 'Network connection error',
        serverError: 'Server error, please try again',
        notFound: 'Resource not found',
        unauthorized: 'Unauthorized access',
        validationError: 'Validation error',
        unknownError: 'An unknown error occurred',
      },

      // Language switcher
      language: {
        switch: 'Switch Language',
        english: 'English',
        arabic: 'العربية',
      },

      // Mortgage Calculator
      mortgageCalculator: {
        title: 'Mortgage Calculator',
        subtitle: 'Calculate your monthly payment with Egyptian banks',
        loanCalculator: 'Loan Calculator',
        affordabilityCalculator: 'Affordability Calculator',
        
        // Form fields
        propertyPrice: 'Property Price (EGP)',
        downPaymentPercent: 'Down Payment (%)',
        loanTerm: 'Loan Term (years)',
        selectBank: 'Select Bank',
        monthlyIncome: 'Monthly Income (EGP)',
        
        // Placeholders
        propertyPricePlaceholder: 'e.g., 2000000',
        downPaymentPlaceholder: '20',
        loanTermPlaceholder: '25',
        monthlyIncomePlaceholder: 'e.g., 25000',
        
        // Results
        resultsTitle: 'Calculation Results',
        monthlyPayment: 'Monthly Payment',
        downPaymentRequired: 'Down Payment Required',
        loanAmount: 'Loan Amount',
        totalInterest: 'Total Interest',
        totalAmount: 'Total Amount',
        
        // Bank details
        interestRate: 'Interest Rate',
        maxLoanAmount: 'Max Amount',
        minDownPayment: 'Min Down Payment',
        selectedBankDetails: 'Selected Bank Details',
        bankName: 'Bank',
        termYears: 'Loan Term',
        
        // Actions
        calculatePayment: 'Calculate Monthly Payment',
        calculateAffordability: 'Calculate Affordability',
        paymentSchedule: 'Payment Schedule',
        shareCalculation: 'Share',
        saveCalculation: 'Save',
        savedCalculations: 'Saved Calculations',
        
        // Payment schedule modal
        paymentScheduleTitle: 'Payment Schedule (First 5 Years)',
        scheduleMonth: 'Month',
        schedulePayment: 'Payment',
        schedulePrincipal: 'Principal',
        scheduleInterest: 'Interest',
        scheduleBalance: 'Balance',
        
        // Affordability section
        affordabilityTitle: 'Affordability Calculator',
        affordabilitySubtitle: 'Find out how much you can afford',
        affordabilityTips: 'Affordability Tips',
        tip1: '• Monthly payment should not exceed 33% of monthly income',
        tip2: '• Calculate all your other monthly financial obligations',
        tip3: '• Keep an emergency fund of at least 6 months of salary',
        tip4: '• Consider maintenance and insurance costs',
        tip5: '• Think about future investments and savings',
        
        // Egyptian banks
        nationalBankEgypt: 'National Bank of Egypt',
        cib: 'Commercial International Bank',
        qnbAlAhli: 'QNB Al Ahli Bank',
        aaib: 'Arab African International Bank',
        banqueMisr: 'Banque Misr',
        
        // Bank features
        bankFeature1: 'Egypt\'s first bank',
        bankFeature2: 'Flexible terms',
        bankFeature3: 'Excellent customer service',
        bankFeature4: 'Competitive interest rates',
        bankFeature5: 'Fast procedures',
        bankFeature6: 'Financing up to 85%',
        bankFeature7: 'Low administrative fees',
        bankFeature8: 'Payment flexibility',
        bankFeature9: 'Advanced digital services',
        bankFeature10: 'Real estate financing experience',
        bankFeature11: 'Free consultation',
        bankFeature12: 'Quick property evaluation',
        bankFeature13: 'Trusted government bank',
        bankFeature14: 'Branches in all governorates',
        
        // Alerts and messages
        missingDataAlert: 'Please enter all required data and select a bank',
        loanLimitExceeded: 'Loan amount exceeds bank limit. Max',
        downPaymentTooLow: 'Down payment below bank minimum. Required',
        enterMonthlyIncome: 'Please enter monthly income for affordability calculation',
        calculationSaved: 'Calculation saved successfully',
        calculationNotSaved: 'Calculation could not be saved',
        linkCopied: 'Details copied to clipboard',
        
        // Affordability result
        affordabilityResult: 'Affordability Estimation',
        affordabilityResultText: 'Based on your monthly income:',
        maxPropertyPrice: 'Max property price',
        maxAffordableLoanAmount: 'Max loan amount',
        recommendedPayment: 'Recommended monthly payment',
        estimateNote: 'Note: This is an approximate estimate',
        
        // Property and loan details header
        propertyLoanDetails: 'Property and Loan Details',
        
        // App credit
        appCredit: 'Egyptian Real Estate App 🇪🇬'
      },

      // About page
      about: {
        pageTitle: 'About VirtualEstate',
        pageDescription: "We're revolutionizing real estate with immersive virtual tours and AI-powered assistance.",
        heroTitle: 'Revolutionizing Real Estate',
        heroDescription: "We're transforming how people discover, explore, and connect with properties through cutting-edge virtual reality and AI technology.",
        
        // Stats
        stats: {
          propertiesLabel: 'Properties Toured',
          citiesLabel: 'Cities Covered',
          languagesLabel: 'Languages Supported',
          satisfactionLabel: 'Customer Satisfaction',
        },
        
        // Mission
        missionTitle: 'Our Mission',
        missionDescription1: 'At VirtualEstate, we believe that finding the perfect home shouldn\'t be limited by distance, time zones, or language barriers. Our mission is to democratize property exploration through immersive virtual tours and intelligent AI assistance, making real estate accessible to everyone, everywhere.',
        missionDescription2: 'We\'re not just showing properties – we\'re creating experiences that help people make informed decisions about one of life\'s most important investments: their home.',
        
        // Values
        valuesTitle: 'Our Values',
        valuesDescription: 'These core values guide everything we do and shape how we build products for our users.',
        values: {
          accessibility: {
            title: 'Global Accessibility',
            description: 'Making property viewing accessible to anyone, anywhere in the world, breaking down geographical barriers.',
          },
          innovation: {
            title: 'Innovation First',
            description: 'Constantly pushing the boundaries of technology to create the most immersive property experiences.',
          },
          trust: {
            title: 'Trust & Security',
            description: 'Ensuring secure, reliable, and transparent property information for all our users.',
          },
          customer: {
            title: 'Customer Focused',
            description: 'Every feature we build is designed with our users\' needs and experiences at the center.',
          },
        },
        
        // Team
        teamTitle: 'Meet Our Team',
        teamDescription: 'Our diverse team of experts combines deep real estate knowledge with cutting-edge technology expertise.',
        team: {
          ceo: {
            name: 'Sarah Ahmed',
            role: 'CEO & Founder',
            bio: 'Former real estate executive with 15+ years of experience in property technology and virtual reality.',
          },
          cto: {
            name: 'Mohamed Hassan',
            role: 'CTO',
            bio: 'AI and 3D technology expert, previously led engineering teams at major tech companies.',
          },
          design: {
            name: 'Layla Mansour',
            role: 'Head of Design',
            bio: 'Award-winning UX designer specializing in immersive experiences and virtual environments.',
          },
          ai: {
            name: 'Ahmed Farouk',
            role: 'Head of AI',
            bio: 'Machine learning researcher focused on natural language processing and conversational AI.',
          },
        },
        
        // Technology
        technologyTitle: 'Powered by Advanced Technology',
        technologyDescription: 'We leverage the latest in 3D visualization, artificial intelligence, and cloud computing to deliver unparalleled property experiences.',
        technology: {
          vr: {
            title: '3D Virtual Reality',
            description: 'Photorealistic 3D environments powered by advanced rendering technology and professional photography equipment.',
          },
          ai: {
            title: 'AI Assistance',
            description: 'Intelligent virtual assistants trained on property data and real estate expertise to answer questions in real-time.',
          },
          global: {
            title: 'Global Platform',
            description: 'Cloud-based infrastructure supporting multiple languages and currencies for seamless international property exploration.',
          },
        },
        
        // CTA
        ctaTitle: 'Ready to Experience the Future of Real Estate?',
        ctaDescription: 'Join thousands of users who have already discovered their dream properties through our platform.',
        exploreProperties: 'Explore Properties',
        getInTouch: 'Get in Touch',
      },

      // Contact page
      contact: {
        pageTitle: 'Get in Touch',
        pageDescription: 'Have questions about our virtual tours or need help finding the perfect property? We\'re here to help you every step of the way.',
        
        // Form section
        formTitle: 'Send us a Message',
        fullName: 'Full Name',
        emailAddress: 'Email Address',
        phoneNumber: 'Phone Number',
        preferredContactMethod: 'Preferred Contact Method',
        subject: 'Subject',
        message: 'Message',
        sendMessage: 'Send Message',
        
        // Form placeholders
        fullNamePlaceholder: 'Your full name',
        emailPlaceholder: 'your.email@example.com',
        phonePlaceholder: '+20 123 456 7890',
        subjectPlaceholder: 'Select a subject',
        messagePlaceholder: 'Tell us how we can help you...',
        
        // Contact methods
        contactMethods: {
          email: 'Email',
          phone: 'Phone',
          whatsapp: 'WhatsApp',
        },
        
        // Subject options
        subjects: {
          propertyInquiry: 'Property Inquiry',
          virtualTour: 'Virtual Tour Support',
          technicalSupport: 'Technical Support',
          partnership: 'Partnership Opportunities',
          general: 'General Question',
        },
        
        // Form validation
        validation: {
          fillAllFields: 'Please fill in all required fields',
          invalidEmail: 'Please enter a valid email address',
          thankYouMessage: 'Thank you for your message! We\'ll get back to you soon.',
        },
        
        // Contact information
        contactInfo: {
          title: 'Contact Information',
          address: 'Address',
          addressDetails: '123 Business District\nNew Cairo, Egypt\n11835',
          phone: 'Phone',
          email: 'Email',
          businessHours: 'Business Hours',
          businessHoursDetails: 'Sunday - Thursday: 9:00 AM - 6:00 PM\nFriday - Saturday: 10:00 AM - 4:00 PM',
        },
        
        // Map section
        map: {
          title: 'Find Us',
          placeholder: 'Interactive Map Would Be Here',
        },
        
        // Quick actions
        quickActions: {
          title: 'Quick Actions',
          scheduleVirtualTour: 'Schedule a Virtual Tour',
          liveChatSupport: 'Live Chat Support',
          browseProperties: 'Browse Properties',
          calendarBooking: 'Calendar booking feature would open here',
          liveChatAlert: 'Live chat would open here',
        },
        
        // FAQ section
        faq: {
          title: 'Frequently Asked Questions',
          questions: {
            virtualTours: {
              question: 'How do virtual tours work?',
              answer: 'Our 3D virtual tours allow you to explore properties remotely using your computer or mobile device.',
            },
            aiAssistant: {
              question: 'Is the AI assistant free?',
              answer: 'Yes! Our AI assistant is completely free and available 24/7 to answer your property questions.',
            },
            physicalViewing: {
              question: 'Can I schedule a physical viewing?',
              answer: 'Contact us to arrange an in-person viewing after exploring virtually.',
            },
            coverage: {
              question: 'What areas do you cover?',
              answer: 'We currently operate in New Cairo and surrounding areas, with plans to expand to other prime locations in Egypt.',
            },
          },
        },
      },

      // Testimonials
      testimonials: {
        title: 'What Our Clients Say',
        description: 'Hear from satisfied customers who found their dream properties through VirtualEstate',
        client1: {
          name: 'Sarah Ahmed',
          role: 'First-time Buyer',
          text: 'VirtualEstate made finding my dream apartment so easy! The 3D tours saved me countless hours, and the AI assistant answered all my questions instantly. Highly recommended!',
          property: 'Luxury Apartment - New Cairo'
        },
        client2: {
          name: 'Mohamed Hassan',
          role: 'Property Investor', 
          text: 'As an investor, I need to view multiple properties quickly. The virtual tours and detailed analytics helped me make informed decisions without traveling. Exceptional service!',
          property: 'Modern Villa - Sheikh Zayed'
        },
        client3: {
          name: 'Layla Mansour',
          role: 'Relocating Professional',
          text: 'Moving to Cairo from abroad was stressful until I found VirtualEstate. The multilingual AI support and immersive tours made me feel confident about my choice.',
          property: 'Penthouse - Downtown Cairo'
        },
        client4: {
          name: 'Ahmed Mahmoud',
          role: 'Property Developer',
          text: 'We used VirtualEstate to showcase our new projects. Interest increased by 200% and sales doubled. Amazing platform for real estate marketing.',
          property: 'Residential Project - New Capital'
        },
        client5: {
          name: 'Fatima Ali',
          role: 'Real Estate Broker',
          text: 'As a real estate broker, VirtualEstate transformed my workflow. Clients love the virtual tours and closing time has significantly decreased.',
          property: 'Family Apartment - Nasr City'
        }
      },

      // CTA Section
      cta: {
        exclusiveOffer: 'EXCLUSIVE OFFER',
        getYourFree: 'Get Your FREE',
        virtualTour3D: '3D Virtual Tour',
        worth: 'Worth',
        priceEGP: '50,000 EGP',
        hundredPercentFree: '100% FREE',
        sellFasterDescription: 'Sell your property 73% faster with immersive virtual tours that captivate serious buyers',
        professionalPhotography: 'Professional Photography',
        hdrDroneShots: 'HDR & Drone shots',
        interactive3DTour: 'Interactive 3D Tour',
        dollhouseFloorPlans: 'Dollhouse & Floor plans',
        brokerNetwork: 'Broker Network',
        activeAgents: '1000+ active agents',
        claimFreeVirtualTour: 'Claim My FREE Virtual Tour',
        spotsLeft: 'Only 42 spots left',
        noCreditCard: 'No credit card required',
        claimedThisMonth: '8 of 50 claimed this month',
        limitedTimeOffer: 'Limited Time Offer',
        professionalTourWorth: 'Professional 3D virtual tour worth',
        completelyFree: 'Completely FREE!',
        sellFasterStunning: 'Sell your property faster with stunning virtual tours that attract serious buyers',
        virtualTourCreation: '3D Virtual Tour Creation',
        brokerNetworkMarketing: 'Broker Network Marketing',
        only50Applications: 'Only taking 50 applications this month',
        freeVirtualTour: 'FREE Virtual Tour'
      },

      // Stats
      stats: {
        // New realistic performance metrics - Option B (Efficiency & Performance Focus)
        fasterPropertySales: '73% Faster Property Sales',
        aiAssistantActive: '24/7 AI Assistant Active',
        appraisalTurnaround: '48hr Appraisal Turnaround',
        freeVirtualTours: '100% Free Virtual Tours',
        // Descriptions for each stat
        withVirtualTours: 'With virtual tours',
        alwaysAvailableSupport: 'Always available support',
        professionalValuations: 'Professional valuations',
        zeroCostToSellers: 'Zero cost to sellers',
        // Legacy stats (kept for compatibility)
        propertieslisted: 'Properties Listed',
        happyclients: 'Happy Clients', 
        virtualtours: 'Virtual Tours',
        citiescovered: 'Cities Covered',
        virtualTourscreated: 'Virtual Tours Created',
        activeListings: 'Active listings',
        experiences3d: '3D experiences',
        satisfiedCustomers: 'Satisfied customers',
        acrossEgypt: 'Across Egypt',
        // New premium stats section
        headerBadge: "Egypt's #1 PropTech Platform",
        headerTitle: "Powering Egypt's Real Estate Future",
        headerDescription: "Join thousands of property owners and buyers who trust OpenBeit's AI-powered platform for seamless real estate experiences",
        liveStatsLabel: 'Live Stats',
        updatedRealtime: 'Updated in real-time'
      },

      // Filters
      filters: {
        findIdealProperty: 'Find Your Ideal Property',
        advancedFilters: 'Advanced Filters',
        useFiltersDescription: 'Use filters and categories to get personalized recommendations',
        advancedFiltersNote: '(Your advanced filter options go here. You can add more controls as needed.)',
        price_under_500k: 'Under $500K',
        new_listing: 'New Listing',
        luxury: 'Luxury',
        villa: 'Villa',
        apartment: 'Apartment',
        pet_friendly: 'Pet Friendly',
        pool: 'Pool',
        garden: 'Garden',
        aiRecommendations: 'AI Recommendations',
        aiRecommendationsDescription: 'Select a filter and property type to get',
        smartRecommendations: '3 smart recommendations',
        fromOurAI: 'from our AI!'
      },

      // Features
      features: {
        revolutionaryExperience: 'Revolutionary Property Viewing Experience',
        revolutionaryDescription: 'Our platform combines cutting-edge 3D technology with AI assistance to provide the most immersive property viewing experience.',
        immersive3DTours: 'Immersive 3D Tours',
        immersive3DDescription: 'Explore properties in stunning 3D detail from the comfort of your home.',
        aiPoweredAssistance: 'AI-Powered Assistance',
        aiAssistanceDescription: 'Get instant answers about properties with our intelligent virtual assistant.',
        multiLanguageSupport: 'Multi-Language Support',
        multiLanguageDescription: 'Communicate in your preferred language with our multilingual AI agents.'
      },

      // Areas
      areas: {
        topAreas: 'Top Areas',
        topAreasDescription: 'Explore the most popular neighborhoods and districts',
        viewAllAreas: 'View All Areas',
        properties: 'Properties',
        exploreArea: 'Explore Area'
      },

      // Lifestyle Compatibility Tool
      lifestyle: {
        yourLifeFromHere: 'Your Life From Here',
        getStarted: 'Get Started',
        instructions: 'Add places you visit regularly to analyze commute times and lifestyle compatibility.',
        searchToAdd: 'Search for places to add destinations',
        clickToAdd: 'Click anywhere on map to add a location',
        savedLocations: 'Saved Locations',
        analyzing: 'Analyzing...',
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor',
        quickStats: 'Quick Stats',
        avgCommute: 'Avg Commute',
        dailyCost: 'Daily Cost',
        locationName: 'Location Name',
        enterLocationName: 'Enter location name',
        category: 'Category',
        importance: 'Importance',
        addLocation: 'Add Location',
        cancel: 'Cancel',
        success: 'Success',
        error: 'Error',
        destinationRemoved: 'Destination removed successfully',
        removeDestinationError: 'Failed to remove destination',
        categories: {
          work: 'Work',
          education: 'Education',
          health: 'Health',
          shopping: 'Shopping',
          fitness: 'Fitness',
          dining: 'Dining',
          entertainment: 'Entertainment',
          other: 'Other'
        }
      },

      // Coming Soon Page
      comingSoon: {
        launchDate: 'LAUNCHING SEPTEMBER 1ST',
        heroTitle: 'Sell Your Properties',
        heroTitleHighlight: '73% Faster',
        heroTitleEnd: 'With FREE Virtual Tours',
        heroDescription: 'Our AI answers all client questions 24/7, and interested buyers can schedule viewings instantly. Sell faster with qualified leads.',
        urgencyWarning: 'Limited Availability',
        limitedSlots: 'Only 42 FREE virtual tour slots remaining this month',
        afterLaunchPrice: 'After September 1st, this service costs 50,000 EGP. Reserve your FREE slot now.',
        feature1: 'Free 3D Virtual Tours',
        feature2: '24/7 AI Assistant',
        feature3: 'Instant Lead Qualification',
        emailPlaceholder: 'Enter your email for early access',
        notifyMe: 'Get Early Access',
        successTitle: "You're on the VIP list!",
        successMessage: "We'll notify you with exclusive early access on September 1st",
        sneakPeekBadge: 'EXPERIENCE THE DIFFERENCE',
        sneakPeekTitle: 'Preview Our Technology',
        sneakPeekDescription: 'Experience our revolutionary virtual tour technology with these interactive property previews',
        clickToLoad: 'Click to Load Virtual Tour',
        clickToExplore: 'Click to Explore',
        liveTour: 'Live Tour',
        launchDateShort: 'Sept 1st',
        viewInFullscreen: 'View in Fullscreen',
        countdownTitle: 'LAUNCH COUNTDOWN',
        countdownSubtitle: 'Get ready for the future of real estate development',
        days: 'Days',
        hours: 'Hours',
        minutes: 'Min',
        seconds: 'Sec'
      },

      // Value Proposition Section
      valueProposition: {
        title: 'What We Do',
        subtitle: 'We revolutionize property showcasing with cutting-edge technology that transforms how developers sell real estate',
        benefit1: {
          title: 'Free Professional 3D Virtual Tours',
          description: 'Complete property filming and 3D tour creation at no cost. Professional-grade immersive experiences that captivate buyers.'
        },
        benefit2: {
          title: '24/7 AI Property Assistant',
          description: 'Intelligent AI agent handles inquiries, qualifies leads, and provides detailed property information around the clock.'
        },
        benefit3: {
          title: 'Instant Lead Qualification',
          description: 'Advanced algorithms instantly identify and prioritize serious buyers, maximizing your time and conversion rates.'
        }
      },

      // How It Works Section
      howItWorks: {
        title: 'How It Works',
        subtitle: 'Three simple steps to transform your property marketing',
        step1: {
          title: 'We Film Your Property',
          subtitle: '(Free)',
          description: 'Our professional photographers capture your property with advanced 3D scanning technology and high-resolution cameras.'
        },
        step2: {
          title: 'Create Immersive Virtual Tours',
          description: 'We transform the captured data into stunning 3D virtual tours with dollhouse views, floor plans, and interactive features.'
        },
        step3: {
          title: 'AI Assistant Handles Inquiries',
          subtitle: '24/7',
          description: 'Our AI agent engages visitors, answers questions, qualifies leads, and schedules appointments automatically.'
        }
      },

      // Developer Benefits Section
      developerBenefits: {
        badge: 'BUILT FOR DEVELOPERS',
        title: 'Why Developers Choose Us',
        subtitle: 'Proven results that transform your sales process and maximize revenue',
        metric1: {
          label: 'Faster Sales Cycle',
          description: 'Virtual tours reduce the need for multiple site visits, accelerating decision-making'
        },
        metric2: {
          label: 'Reduction in Site Visits',
          description: 'Pre-qualified leads arrive ready to buy, saving time and resources'
        },
        metric3: {
          label: 'Automated Responses',
          description: 'AI assistant captures leads and provides information around the clock'
        },
        trust1: 'Enterprise Security',
        trust2: 'Data Protection',
        trust3: 'GDPR Compliant'
      },

      // Tech Stack Section
      techStack: {
        badge: 'POWERED BY ADVANCED AI',
        title: 'Cutting-Edge Technology',
        subtitle: 'Built with the latest technologies to deliver unmatched performance and reliability'
      },

      // Appraisers Section
      appraisers: {
        pageTitle: 'Find Verified Property Appraisers',
        pageDescription: 'Connect with licensed and verified property appraisers in Egypt',
        findAppraisers: 'Find Appraisers',
        verifiedAppraisers: 'Verified Appraisers',
        allAppraisersVerified: 'All appraisers verified through Valify KYC',
        licensedProfessionals: 'Licensed Professionals',
        verifiedIdentity: 'Verified Identity',
        experiencedExperts: 'Experienced Experts',
        howItWorks: 'How it Works',
        step1Title: 'Browse & Select',
        step1Description: 'Choose from our network of verified appraisers',
        step2Title: 'Book & Schedule',
        step2Description: 'Schedule your property appraisal appointment',
        step3Title: 'Get Your Report',
        step3Description: 'Receive your professional appraisal report',
        searchPlaceholder: 'Search by location, name, or specialization...',
        noAppraisersFound: 'No appraisers found',
        tryAdjustingFilters: 'Try adjusting your search criteria',
        bookAppraisal: 'Book Appraisal',
        viewProfile: 'View Profile',
        backToSearch: 'Back to Search',
        share: 'Share',
        save: 'Save',
        yearsExperience: 'years of experience',
        rating: 'Rating',
        reviews: 'Reviews',
        specializations: 'Specializations',
        serviceAreas: 'Service Areas',
        languages: 'Languages',
        certifications: 'Certifications',
        about: 'About',
        portfolio: 'Portfolio',
        availability: 'Availability',
        contactInfo: 'Contact Information',
        professionalSummary: 'Professional Summary',
        trustSafety: 'Trust & Safety',
        verificationBadge: 'Valify Verified',
        identityVerified: 'Identity Verified',
        licenseVerified: 'License Verified',
        backgroundChecked: 'Background Checked'
      },

      // Appraiser Dashboard Section
      appraiserDashboard: {
        // Main navigation and tabs
        dashboard: 'Dashboard',
        profile: 'Profile',
        myAppraisals: 'My Appraisals',
        bookings: 'Bookings',
        availability: 'Availability',
        reviews: 'Reviews',
        reports: 'Reports',
        analytics: 'Analytics',
        overview: 'Overview',
        
        // Page titles and descriptions
        adminTitle: 'Admin - Appraiser Dashboard',
        userTitle: 'Appraiser Dashboard',
        adminDescription: 'Manage appraisals and reports for all appraisers',
        userDescription: 'Manage your property appraisals and reports',
        
        // Quick actions
        quickActions: 'Quick Actions',
        quickActionsDescription: 'Manage your profile and reviews',
        manageAppraiser: 'Manage Appraiser',
        manageProfile: 'Manage Profile',
        editAppraiserDetails: 'Edit selected appraiser details',
        editCertifications: 'Edit certifications, services & availability',
        respondToFeedback: 'Respond to client feedback',
        syncPortfolio: 'Sync Portfolio',
        updateAppraiserProfile: 'Update selected appraiser profile',
        updatePublicProfile: 'Update public profile',
        syncing: 'Syncing...',
        
        // Stats cards
        totalAppraisals: 'Total Appraisals',
        completed: 'Completed',
        pending: 'Pending',
        totalValue: 'Total Value',
        avgConfidence: 'Avg Confidence',
        confidence: 'confidence',
        
        // Status labels
        draft: 'Draft',
        inReview: 'In Review',
        approved: 'Approved',
        archived: 'Archived',
        confirmed: 'Confirmed',
        inProgress: 'In Progress',
        cancelled: 'Cancelled',
        noShow: 'No Show',
        partial: 'Partial',
        paid: 'Paid',
        refunded: 'Refunded',
        
        // Recent appraisals
        recentAppraisals: 'Recent Appraisals',
        recentAppraisalsDescription: 'Your latest property appraisals',
        
        // Profile completion
        completeProfile: 'Complete Your Profile for Public Visibility',
        completeProfileDescription: 'To appear in public appraiser searches and receive client bookings, you still need to:',
        completeProfileButton: 'Complete Profile',
        previewPublicListing: 'Preview Public Listing',
        completeValifyVerification: 'Complete Valify identity verification',
        addProfileHeadlineBio: 'Add profile headline and bio',
        addYearsExperience: 'Add years of experience',
        addRatingInfo: 'Add rating information',
        addProfessionalCertifications: 'Add professional certifications',
        addProfessionalHeadshot: 'Add professional headshot',
        setPricingInfo: 'Set pricing information',
        setServiceAreas: 'Set service areas',
        setResponseTime: 'Set response time',
        
        // Appraisal details modal
        appraisalDetails: 'Appraisal Details',
        propertyInformation: 'Property Information',
        propertyTitle: 'Property Title:',
        address: 'Address:',
        propertyType: 'Property Type:',
        city: 'City:',
        
        appraisalInformation: 'Appraisal Information',
        clientName: 'Client Name:',
        appraisalDate: 'Appraisal Date:',
        referenceNumber: 'Reference Number:',
        status: 'Status:',
        
        valuationResults: 'Valuation Results',
        marketValueEstimate: 'Market Value Estimate',
        confidenceLevel: 'Confidence Level',
        vsListedPrice: 'vs Listed Price',
        
        propertyDetails: 'Property Details',
        calculationDetails: 'Calculation Details',
        editAppraisal: 'Edit Appraisal',
        generateReport: 'Generate Report',
        
        // Form labels and buttons
        backToDashboard: 'Back to Dashboard',
        newAppraisal: 'New Appraisal',
        newPropertyAppraisal: 'New Property Appraisal',
        generateAppraisalReport: 'Generate Appraisal Report',
        selectAppraiser: 'Select Appraiser',
        
        // Profile form
        completeProfessionalProfile: 'Complete Your Professional Profile',
        fillOutInformation: 'Fill out all information to appear in public appraiser searches and receive client bookings',
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        appraiserLicense: 'Appraiser License',
        yearsOfExperience: 'Years of Experience',
        profileHeadline: 'Profile Headline',
        profileHeadlinePlaceholder: 'e.g., Certified Property Appraiser specializing in Residential Properties',
        bioProfileSummary: 'Bio / Profile Summary',
        serviceAreasLabel: 'Service Areas (comma-separated)',
        serviceAreasPlaceholder: 'Cairo, Giza, Alexandria',
        averageRating: 'Average Rating (0-5)',
        totalReviews: 'Total Reviews',
        responseTimeHours: 'Response Time (hours)',
        professionalCertifications: 'Professional Certifications',
        pricingInformation: 'Pricing Information',
        baseFeeEgp: 'Base Fee (EGP)',
        rushFeeEgp: 'Rush Fee (EGP)',
        currency: 'Currency',
        professionalHeadshot: 'Professional Headshot',
        takePhoto: 'Take Photo',
        aiCamera: 'AI Camera',
        remove: 'Remove',
        generateWithAi: 'Generate with AI',
        generatePlaceholder: 'e.g., Professional Egyptian appraiser, confident, business attire',
        generating: 'Generating...',
        generate: 'Generate',
        pasteImageUrl: 'Or paste image URL',
        saving: 'Saving...',
        saveProfile: 'Save Profile',
        loadingProfileData: 'Loading profile data...',
        
        // Appraisals tab
        searchAppraisals: 'Search appraisals...',
        allStatuses: 'All Statuses',
        loadingAppraisals: 'Loading appraisals...',
        noAppraisalsFound: 'No appraisals found',
        getStartedAppraisal: 'Get started by creating your first property appraisal',
        
        // Appraisal list labels
        client: 'Client:',
        date: 'Date:',
        reference: 'Reference:',
        location: 'Location:',
        marketValue: 'Market Value:',
        
        // Bookings tab
        searchBookings: 'Search bookings by client name or confirmation number...',
        refresh: 'Refresh',
        totalBookings: 'Total Bookings',
        thisMonthRevenue: 'This Month Revenue',
        loadingBookings: 'Loading bookings...',
        noBookingsFound: 'No bookings found',
        bookingRequestsAppear: 'Your booking requests will appear here once clients book appointments',
        
        // Booking details
        dateTime: 'Date & Time:',
        property: 'Property:',
        confirmation: 'Confirmation:',
        duration: 'Duration:',
        totalCost: 'Total Cost:',
        deposit: 'Deposit:',
        specialInstructions: 'Special Instructions:',
        viewDetails: 'View Details',
        confirm: 'Confirm',
        decline: 'Decline',
        startAppraisal: 'Start Appraisal',
        markComplete: 'Mark Complete',
        
        // Booking detail modal
        bookingDetails: 'Booking Details',
        bookingInformation: 'Booking Information',
        type: 'Type:',
        clientInformation: 'Client Information',
        name: 'Name:',
        size: 'Size:',
        estimatedValue: 'Estimated Value:',
        accessInstructions: 'Access Instructions:',
        financialDetails: 'Financial Details',
        totalCostLabel: 'Total Cost',
        depositAmount: 'Deposit Amount',
        quickMessage: 'Quick Message',
        callClient: 'Call Client',
        emailClient: 'Email Client',
        confirmBooking: 'Confirm Booking',
        markAsComplete: 'Mark as Complete',
        
        // Reviews management
        reviewsManagement: 'Reviews Management',
        reviewsDescription: 'Manage client reviews and responses to build your professional reputation',
        loadingAppraiserProfile: 'Loading appraiser profile...',
        
        // Availability management
        availabilityManagement: 'Availability Management',
        availabilityDescription: 'Manage your schedule and booking preferences for clients',
        
        // Reports tab
        selectAppraisal: 'Select Appraisal',
        generateReportsDescription: 'Generate professional PDF reports from completed appraisals',
        legalCompliance: 'Legal Compliance',
        appraisalsWithLegalAnalysis: 'Appraisals with legal analysis',
        mortgageAnalysis: 'Mortgage Analysis',
        appraisalsWithMortgageEligibility: 'Appraisals with mortgage eligibility',
        investmentReports: 'Investment Reports',
        appraisalsWithInvestmentAnalysis: 'Appraisals with investment analysis',
        reportTemplates: 'Report Templates',
        reportTemplatesDescription: 'Available professional report formats',
        
        // Report template types
        comprehensiveReport: 'Comprehensive Report',
        comprehensiveReportDescription: 'Complete analysis with all sections',
        mostPopular: 'Most Popular',
        pages15: '~15 pages',
        arabicEnglish: 'Arabic/English',
        
        executiveSummary: 'Executive Summary',
        executiveSummaryDescription: 'Concise report for decision makers',
        quick: 'Quick',
        pages8: '~8 pages',
        
        investorReport: 'Investor Report',
        investorReportDescription: 'Investment-focused analysis',
        roiFocus: 'ROI Focus',
        pages12: '~12 pages',
        
        legalComplianceReport: 'Legal Compliance',
        legalComplianceDescription: 'Legal status and compliance focus',
        legal: 'Legal',
        pages10: '~10 pages',
        
        // Report generation steps
        howToGenerateReports: 'How to Generate Reports',
        step1CompleteAppraisal: '1. Complete Appraisal',
        step1Description: 'Ensure your appraisal includes all required data: property details, market analysis, and legal status.',
        step2ConfigureReport: '2. Configure Report',
        step2Description: 'Select your preferred template, language, and sections to include in the professional report.',
        step3GeneratePdf: '3. Generate PDF',
        step3Description: 'Download your professional, investor-grade PDF report with Egyptian legal compliance.',
        
        // Analytics
        performanceAnalytics: 'Performance Analytics',
        analyticsDescription: 'Track your appraisal performance and trends',
        analyticsComingSoon: 'Analytics dashboard coming soon...',
        
        // Quick message modal
        quickMessageTitle: 'Quick Message',
        to: 'To:',
        message: 'Message',
        messageArea: 'Type your message here...',
        quickTemplates: 'Quick Templates:',
        confirmationTemplate: 'Confirmation',
        followUpTemplate: 'Follow-up',
        cancel: 'Cancel',
        sending: 'Sending...',
        sendMessage: 'Send Message',
        
        // New appraisal modal
        newAppraisalTitle: 'New Appraisal',
        chooseCreateMethod: 'Choose how you want to create your appraisal',
        createNewAppraisal: 'Create New Appraisal',
        startFromScratch: 'Start from scratch with the SmartAppraisalForm',
        traditionalMethod: 'Traditional method',
        importDocument: 'Import Document',
        uploadDocuments: 'Upload appraisal documents and auto-extract with OpenBeit AI',
        openBeitAiBenefits: 'OpenBeit AI Benefits',
        extractFieldsAi: 'Extract fields with OpenBeit AI',
        advancedArabicText: 'Advanced Arabic text understanding',
        processPdfExcelWord: 'Process PDF, Excel, Word documents',
        intelligentDocAnalysis: 'Intelligent document analysis',
        
        // Common UI elements
        loading: 'Loading...',
        notAvailable: 'N/A',
        
        // Error messages
        clientNameRequired: 'Client name is required',
        marketValueRequired: 'Market value estimate is required and must be greater than 0',
        pleaseEnterMessage: 'Please enter a message',
        
        // Success messages
        profileUpdatedSuccessfully: 'Profile updated successfully!',
        appraisalUpdatedSuccessfully: 'Appraisal updated successfully',
        appraisalCreatedSuccessfully: 'Appraisal created successfully',
        headshotGeneratedSuccessfully: 'Professional headshot generated successfully!',
        headshotCapturedSuccessfully: 'Professional headshot captured and applied!',
        portfolioSyncedSuccessfully: 'Portfolio synced successfully! Public profile has been updated with completed appraisals.',
        appraisalCompletedSuccessfully: 'Appraisal completed successfully! Portfolio automatically updated.',
        bookingActionSuccessful: 'Booking {action}ed successfully',
        messageSentSuccessfully: 'Message sent to {recipient}',
        
        // Error messages
        failedToSaveProfile: 'Failed to save profile',
        failedToSaveAppraisal: 'Failed to save appraisal',
        failedToGenerateHeadshot: 'Failed to generate headshot',
        failedToLoadAppraisers: 'Failed to load appraisers. Please check the console for details.',
        noAppraisersFoundSystem: 'No appraisers found. Please ensure there are active appraisers in the system.',
        failedToLoadAppraisals: 'Failed to load appraisals',
        failedToSyncPortfolio: 'Failed to sync portfolio',
        failedToCompleteAppraisal: 'Failed to complete appraisal',
        failedToLoadBookings: 'Failed to load bookings',
        failedToActionBooking: 'Failed to {action} booking',
        failedToSendMessage: 'Failed to send message',
        unableFetchUserProfile: 'Unable to fetch user profile',
        unableDetermineAppraiserProfile: 'Unable to determine appraiser profile for portfolio sync',
        
        // Availability management
        availableNow: 'Available now',
        closedToday: 'Closed today',
        closedForToday: 'Closed for today',
        opensAt: 'Opens at {time}',
        nextAvailable: 'Next available: {day} at {time}',
        bookAppraisal: 'Book Appraisal',
        quickMessage: 'Quick Message',
        
        // Days of week
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        
        // Availability states
        available: 'Available',
        notAvailable: 'Not Available',
        closed: 'Closed',
        breakTime: 'Break: {start} - {end}',
        breakStart: 'Break Start',
        breakEnd: 'Break End',
        
        // Booking information
        responseAndBooking: 'Response & Booking',
        averageResponseTime: 'Average Response Time',
        bookingAdvanceNotice: 'Booking Advance Notice',
        bookingGuidelines: 'Booking Guidelines: All appraisal requests require advance notice of at least {days} days.',
        
        // Contact preferences
        preferredContactMethods: 'Preferred Contact Methods',
        contactPreferences: 'Contact Preferences',
        phoneCallsLabel: 'Phone Calls',
        emailLabel: 'Email', 
        whatsappLabel: 'WhatsApp',
        preferred: 'Preferred',
        notPreferred: 'Not preferred',
        notAvailable: 'Not available',
        preferredContactMethod: 'Preferred Contact Method',
        choosePreferredStyle: 'Choose Your Preferred Style',
        weeklySchedule: 'Weekly Schedule',
        allTimesShownIn: 'All times shown in {timezone} timezone',
        timezoneLabel: 'Timezone',
        reviewsCount: 'Reviews',
        noReviews: 'No reviews',
        confidenceLabel: 'Confidence:',
        allStatuses: 'All Statuses',
        inProgress: 'In Progress',
        
        // Reviews section
        overallRating: 'Overall Rating',
        recentReviews: 'Recent Reviews',
        verifiedClients: 'Verified Clients',
        ratingBreakdown: 'Rating Breakdown',
        filterByRating: 'Filter by Rating',
        allRatings: 'All Ratings',
        fiveStars: '5 Stars',
        fourStars: '4 Stars',
        threeStars: '3 Stars',
        twoStars: '2 Stars',
        oneStar: '1 Star',
        sortBy: 'Sort by',
        mostRecent: 'Most Recent',
        featuredFirst: 'Featured First',
        highestRating: 'Highest Rating',
        lowestRating: 'Lowest Rating',
        mostHelpful: 'Most Helpful',
        showOnlyVerified: 'Show only verified reviews',
        allReviews: 'All Reviews',
        clientReviews: 'Client Reviews',
        reviewsOf: '{count} of {total} reviews',
        noReviewsFound: 'No Reviews Found',
        noReviewsMatchFilters: 'No reviews match your current filters.',
        noReviewsYet: "This appraiser hasn't received any reviews yet.",
        responseFromAppraiser: 'Response from Appraiser',
        helpful: 'Helpful ({count})',
        reviewNumber: 'Review #{number}',
        responseRate: 'Response Rate',
        totalHelpfulVotes: 'Total Helpful Votes',
        reviewGuidelines: 'All reviews are moderated for authenticity. Verified reviews come from confirmed clients who have completed appraisal services. Featured reviews highlight exceptional experiences.',
        
        // Reviews page - additional translations
        responded: 'Responded',
        pendingResponse: 'Pending Response',
        totalReviews: 'Total Reviews',
        noReviewsAvailable: 'No reviews available',
        responseGuidelines: 'Response Guidelines',
        tipsForWritingResponses: 'Tips for writing effective review responses',
        dontSection: "Don't ❌",
        doSection: "Do ✅",
        getDefensive: 'Get defensive or argumentative',
        shareConfidentialInfo: 'Share confidential client information',
        makeExcuses: 'Make excuses for poor service',
        usePromotionalLanguage: 'Use overly promotional language',
        thankClient: 'Thank the client for their feedback',
        addressSpecificPoints: 'Address specific points mentioned in the review',
        maintainProfessionalTone: 'Maintain a professional and courteous tone',
        highlightCommitment: 'Highlight your commitment to quality service',
        
        // Reports page - additional translations  
        keyFindings: 'Key Findings',
        propertyOverview: 'Property Overview',
        marketSummary: 'Market Summary',
        recommendations: 'Recommendations',
        executiveSummary: 'Executive Summary',
        propertyMarketAnalysis: 'Property & Market Analysis',
        legalMortgageAssessment: 'Legal & Mortgage Assessment',
        investmentProjections: 'Investment Projections',
        legalStatusAnalysis: 'Legal Status Analysis',
        complianceAssessment: 'Compliance Assessment',
        mortgageEligibility: 'Mortgage Eligibility',
        riskFactors: 'Risk Factors',
        investmentAnalysis: 'Investment Analysis',
        rentalYieldCalculations: 'Rental Yield Calculations',
        marketComparables: 'Market Comparables',
        riskAssessment: 'Risk Assessment',
        
        emergencyServices: 'Emergency Services',
        serviceAreas: 'Service Areas',
        
        // Features Section - Modern Design
        featuresTitle: 'Revolutionizing Real Estate',
        featuresSubtitle: 'For Everyone',
        featuresDescription: 'Whether you\'re buying, selling, developing, or investing - we\'ve got the perfect solution powered by AI and immersive virtual tours.',
        
        // Feature Cards
        virtualToursTitle: 'Immersive Virtual Tours',
        virtualToursDescription: 'Experience properties with 360° walkthroughs that make you feel like you\'re actually there',
        virtualToursBadge: 'Popular',
        
        aiAssistantTitle: 'Intelligent AI Assistant',
        aiAssistantDescription: 'Get instant property guidance, valuations, and personalized recommendations 24/7',
        aiAssistantBadge: 'Always Available',
        
        multiLanguageTitle: 'Global Accessibility',
        multiLanguageDescription: 'Browse properties in Arabic, English, and other languages with seamless translation',
        multiLanguageBadge: 'Your Language',
        
        remoteViewingTitle: 'View Properties Anywhere',
        remoteViewingDescription: 'Explore Egyptian properties from Saudi Arabia, UAE, or anywhere in the world',
        remoteViewingBadge: 'Global Access',
        
        smartFilteringTitle: 'Find Your Perfect Match',
        smartFilteringDescription: 'AI-powered property recommendations based on your preferences and budget',
        smartFilteringBadge: 'Personalized Results',
        
        verifiedPropertiesTitle: 'Trusted Property Listings',
        verifiedPropertiesDescription: 'All properties are verified and authenticated for your peace of mind',
        verifiedPropertiesBadge: 'Trusted Platform',
        
        // User Types
        propertyBuyers: 'Property Buyers',
        propertyBuyersDescription: 'Discover Your Dream',
        propertySellers: 'Property Sellers',
        propertySellersDescription: 'Sell 27% Faster',
        realEstateDevelopers: 'Real Estate Developers',
        realEstateDevelopersDescription: 'Showcase Projects Smartly',
        propertyInvestors: 'Property Investors',
        propertyInvestorsDescription: 'Smart Investment Insights',
        
        // Action Buttons
        experienceBeforeYouBuy: 'Experience Before You Buy',
        startVirtualTour: 'Start Virtual Tour',
        exploreProperties: 'Explore Properties',
        
        // System messages
        bookingSystemWillOpen: 'Booking system will open here',
        messagingSystemWillOpen: 'Messaging system will open here',
        
        // Profile edit page
        profileManagement: 'Profile Management',
        profileManagementDescription: 'Manage your appraiser profile, certifications, and services',
        loadingProfile: 'Loading profile...',
        
        // Tabs
        certificationsTab: 'Certifications',
        servicesTab: 'Services',
        
        // Profile form
        languagesSpoken: 'Languages Spoken',
        
        // Certifications
        addNewCertification: 'Add New Certification',
        yourCertifications: 'Your Certifications',
        certificationName: 'Certification Name',
        issuingAuthority: 'Issuing Authority',
        certificationNumber: 'Certification Number',
        issueDate: 'Issue Date',
        expiryDate: 'Expiry Date',
        addCertification: 'Add Certification',
        certificationAddedSuccessfully: 'Certification added successfully',
        
        // Services
        addNewService: 'Add New Service',
        yourServices: 'Your Services',
        
        // Language options
        french: 'French',
        german: 'German',
        spanish: 'Spanish',
        
        // Additional Egyptian cities for service areas
        luxor: 'Luxor',
        aswan: 'Aswan',
        sharmElSheikh: 'Sharm El Sheikh',
        hurghada: 'Hurghada',

        // Timezone Settings
        timezone: 'Timezone',
        selectTimezone: 'Select Timezone',
        timezoneDescription: 'Set your local timezone for accurate booking times',
        currentTimezone: 'Current Timezone',
        autoDetectTimezone: 'Auto-detect timezone',

        // Confidence Level Details
        confidenceLevelExplanation: 'Confidence Level Explanation',
        highConfidence: 'High Confidence (90-100%)',
        mediumConfidence: 'Medium Confidence (70-89%)',
        lowConfidence: 'Low Confidence (50-69%)',
        confidenceFactors: 'Factors Affecting Confidence',

        // Professional Certifications Details
        certificationStatus: 'Certification Status',
        activeCertification: 'Active',
        expiredCertification: 'Expired',
        pendingCertification: 'Pending Verification',
        certificationDocument: 'Certification Document',
        uploadCertificationDocument: 'Upload Certification Document',

        // Advanced Review Management
        respondToReview: 'Respond to Review',
        reviewResponse: 'Review Response',
        publicResponse: 'Public Response',
        privateNotes: 'Private Notes',
        reviewDate: 'Review Date',
        clientReview: 'Client Review',
        yourResponse: 'Your Response',
        noReviewsYet: 'No reviews yet',
        waitingForReviews: 'You will receive client reviews here after completing appraisals',

        // Enhanced Contact Preferences
        contactMethodPreferences: 'Contact Method Preferences',
        primaryContactMethod: 'Primary Contact Method',
        secondaryContactMethod: 'Secondary Contact Method',
        emergencyContactAvailable: 'Available for Emergency Contact',
        businessHoursOnly: 'Business Hours Only',
        afterHoursAvailable: 'After Hours Available',
        communicationLanguages: 'Communication Languages',

        // Advanced Scheduling
        workingHours: 'Working Hours',
        customSchedule: 'Custom Schedule',
        recurringAvailability: 'Recurring Availability',
        temporaryScheduleChange: 'Temporary Schedule Change',
        holidaySchedule: 'Holiday Schedule',
        bufferTimeBetweenBookings: 'Buffer Time Between Bookings',
        minimumBookingDuration: 'Minimum Booking Duration',
        maximumBookingsPerDay: 'Maximum Bookings Per Day',

        // Service Area Management
        travelDistance: 'Maximum Travel Distance',
        serviceFeeByDistance: 'Service Fee by Distance',
        coverageMap: 'Coverage Map',
        additionalTravelFee: 'Additional Travel Fee',

        // Missing translations for loading and error states
        loadingDashboard: 'Loading appraiser dashboard...',
        appraiserNotFound: 'The requested appraiser could not be found.',
        accessDenied: 'Appraiser not found or access denied',
        notActiveAppraiser: 'This user is not an active appraiser',
        failedToLoadData: 'Failed to load appraiser data',
        unauthorizedVerification: 'Unauthorized to view this verification',
        failedToLoadVerification: 'Failed to load verification data',

        // Status and Labels
        licensedAppraiser: 'Licensed Appraiser',
        license: 'License',
        yearsExperienceShort: 'years experience',
        verifiedBadge: '✅ Verified Appraiser',
        verificationPending: '⏳ Verification Pending',
        certifiedBy: 'Certified by',

        // Profile Management
        basicInformation: 'Basic Information',
        removeImage: 'Remove Image',
        generateHeadshotAI: 'Generate Professional Headshot with AI',
        professionalSummary: 'Professional Summary',

        // Services and Availability
        addNewService: 'Add New Service',
        serviceName: 'Service Name',
        description: 'Description',
        propertyTypes: 'Property Types',
        yourServices: 'Your Services',
        weeklyAvailability: 'Weekly Availability',
        breakTimeOptional: 'Break Time (Optional)',
        notes: 'Notes',

        // Alerts and Actions
        completeVerificationTitle: 'Complete your verification to appear in public listings',
        completeVerificationDescription: 'To be visible to clients searching for appraisers, you need to complete identity verification. This helps build trust and ensures professional standards.',
        completeVerificationButton: 'Complete Verification',
        completeProfileAlert: 'Complete Your Profile for Public Visibility',
        reviewsTitle: 'Reviews'
      },

      // Rentals Section  
      rentals: {
        pageTitle: 'Vacation Rentals in Egypt',
        pageDescription: 'Discover amazing places to stay',
        vacationRentals: 'Vacation Rentals',
        nightlyRate: 'per night',
        guests: 'guests',
        bedrooms: 'bedrooms',
        bathrooms: 'bathrooms',
        minimumStay: 'minimum stay',
        nights: 'nights',
        instantBook: 'Instant Book',
        superhost: 'Superhost',
        viewDetails: 'View Details',
        viewAndBook: 'View & Book',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        selectDates: 'Select dates',
        bookNow: 'Book Now',
        reserveNow: 'Reserve Now',
        totalPrice: 'Total price',
        cleaningFee: 'Cleaning fee',
        serviceFee: 'Service fee',
        taxes: 'Taxes',
        priceBreakdown: 'Price breakdown',
        houseRules: 'House rules',
        amenities: 'Amenities',
        location: 'Location',
        hostInfo: 'About the host',
        reviews: 'Reviews',
        availability: 'Availability',
        policies: 'Policies',
        cancellation: 'Cancellation',
        safetyFeatures: 'Safety features',
        propertyDetails: 'Property details',
        sleepingArrangements: 'Sleeping arrangements',
        accessibilityFeatures: 'Accessibility features',
        bookingConfirmed: 'Booking confirmed',
        checkInInstructions: 'Check-in instructions',
        hostContact: 'Host contact',
        emergencyContact: 'Emergency contact',
        wifiPassword: 'WiFi password',
        houseManual: 'House manual',
        localRecommendations: 'Local recommendations',
        checkoutInstructions: 'Checkout instructions',
        
        // Missing rental keys from analysis
        verifiedProperty: 'Verified Property',
        securePayment: 'Secure Payment',
        noPhotosAvailable: 'No Photos Available',
        fullyFurnished: 'Fully Furnished',
        petFriendly: 'Pet Friendly',
        modernConstruction: 'Modern construction',
        aboutPlace: 'About this place',
        
        // Amenities
        wifi: 'WiFi',
        freeWifi: 'Free WiFi',
        airConditioning: 'Air Conditioning',
        heating: 'Heating',
        kitchen: 'Kitchen',
        tv: 'TV',
        washingMachine: 'Washing Machine',
        parking: 'Parking',
        pool: 'Swimming Pool',
        swimmingPool: 'Swimming Pool',
        gym: 'Gym',
        security: 'Security Guard',
        seaView: 'Sea View',
        nileView: 'Nile View',
        availableDates: 'Try adjusting your search dates or filters to find more options.',
        
        // Error states
        rentalNotFound: 'Rental Not Found',
        rentalNotFoundDescription: 'The rental listing you\'re looking for doesn\'t exist or has been removed.',
        backToRentals: 'Back to Rentals',
        verifiedProperty: 'Verified Property',
        securePayment: 'Secure Payment',
        support247: '24/7 Support',
        noPhotosAvailable: 'No Photos Available',
        virtualTour: 'Virtual Tour',
      },

      // Saved Properties Section
      saved: {
        savedProperties: 'Saved Properties',
        pleaseSignIn: 'Please',
        toViewSavedProperties: 'to view your saved properties',
        noSavedProperties: 'You haven\'t saved any properties yet.',
        failedToLoad: 'Failed to load saved properties. Please try again later.',
        title: 'Saved Properties',
        signInPrompt: 'Please sign in to view your saved properties',
        emptyState: 'You haven\'t saved any properties yet.',
        errors: {
          loadFailed: 'Failed to load saved properties. Please try again later.'
        }
      },

      // Profile Section
      profile: {
        // Step 1: Header & Form translations (completed)
        completeProfile: 'Complete your profile',
        editProfile: 'Edit Profile',
        fullName: 'Full Name',
        phoneNumber: 'Phone Number', 
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        nationality: 'Nationality',
        occupation: 'Occupation',
        company: 'Company',
        bio: 'Bio',
        enterFullName: 'Enter your full name',
        enterPhoneNumber: 'Enter your phone number',
        enterNationality: 'Enter your nationality',
        enterOccupation: 'Enter your occupation',
        enterCompany: 'Enter your company',
        tellUsAbout: 'Tell us about yourself',
        selectGender: 'Select gender',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        preferNotToSay: 'Prefer not to say',
        cancel: 'Cancel',
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        
        // Step 2: Profile display sections
        personalInfo: 'Personal Info',
        professional: 'Professional',
        about: 'About',
        quickStats: 'Quick Stats',
        accountStatus: 'Account Status',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        profile: 'Profile',
        notProvided: 'Not provided',
        verified: 'Verified',
        pending: 'Pending',
        notVerified: 'Not verified',
        standard: 'Standard',
        savedProperties: 'Saved Properties',
        rentalBookings: 'Rental Bookings',
        savedSearches: 'Saved Searches',
        activityCount: 'Activity Count',
        
        // Step 3: Saved Items tab
        properties: 'Properties',
        appraisers: 'Appraisers',
        savedAppraisers: 'Saved Appraisers',
        refresh: 'Refresh',
        viewAll: 'View All',
        findMore: 'Find More',
        noSavedPropertiesYet: 'No saved properties yet',
        noSavedAppraisersYet: 'No saved appraisers yet',
        browseProperties: 'Browse Properties',
        browseAppraisers: 'Browse Appraisers',
        beds: 'beds',
        baths: 'baths',
        sqm: 'sqm',
        noReviewsYet: 'No reviews yet',
        yearsExp: 'years exp.',
        respondsIn: 'Responds in',
        saved: 'Saved',
        
        // Step 4: Rental Bookings tab
        myRentalBookings: 'My Rental Bookings',
        noRentalBookingsYet: 'No rental bookings yet',
        browseRentals: 'Browse Rentals',
        guests: 'guests',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        totalAmount: 'Total Amount',
        qrCodes: 'QR Codes',
        activeCodes: 'active codes',
        qrCodesReady: 'QR Codes Ready',
        qrCodesReadyMessage: 'Your QR codes are ready for use. You have {{count}} active QR codes for property access.',
        viewQrCodes: 'View QR Codes',
        qrCodesPending: 'QR Codes Pending',
        qrCodesPendingMessage: 'QR codes will be provided 24-48 hours before your check-in date by the property management team.',
        qrCodesExpired: 'QR Codes Expired',
        qrCodesExpiredMessage: 'QR codes for this booking have expired.',
        bookedOn: 'Booked on',
        viewProperty: 'View Property',
        leaveReview: 'Leave Review',
        
        // Step 5: Viewing History tab
        recentViewingHistory: 'Recent Viewing History',
        recentViews: 'recent views',
        noViewingHistoryYet: 'No viewing history yet',
        startBrowsingProperties: 'Start Browsing Properties',
        propertyNotFound: 'Property not found',
        viewed: 'Viewed',
        viewAgain: 'View Again',
        
        // Step 6: Saved Searches & Appraisals tabs
        noSavedSearchesYet: 'No saved searches yet',
        createYourFirstSearch: 'Create Your First Search',
        alertFrequency: 'Alert frequency',
        created: 'Created',
        active: 'Active',
        paused: 'Paused',
        runSearch: 'Run Search',
        
        myAppraisals: 'My Appraisals',
        appraisals: 'appraisals',
        noAppraisalsYet: 'No appraisals yet',
        bookAppraiserMessage: 'Book an appraiser to get professional property valuations',
        findAppraisers: 'Find Appraisers',
        propertyAppraisal: 'Property Appraisal',
        appraiser: 'Appraiser',
        date: 'Date',
        reference: 'Reference',
        na: 'N/A',
        marketValue: 'Market Value',
        confidence: 'Confidence',
        download: 'Download',
        
        placeholders: {
          fullName: 'Enter your full name',
          phoneNumber: 'Enter your phone number',
          nationality: 'Enter your nationality',
          occupation: 'Enter your occupation',
          company: 'Enter your company',
          bio: 'Tell us about yourself'
        }
      },

      // Admin Section
      admin: {
        search: {
          placeholder: 'Search by property title, city, or owner name...',
          minPrice: 'Min',
          maxPrice: 'Max'
        },
        filters: {
          status: 'Status',
          type: 'Type',
          allCities: 'All Cities',
          anyRating: 'Any Rating',
          allStatus: 'All Status'
        },
        actions: {
          viewDetails: 'View Details',
          editRental: 'Edit Rental',
          deleteRental: 'Delete Rental'
        },
        status: {
          confirmed: 'Confirmed',
          cancelled: 'Cancelled',
          pending: 'Pending',
          failed: 'Failed'
        },
        errors: {
          loadingData: 'Error Loading Data'
        }
      },

      // Settings Section
      settings: {
        title: 'Settings',
        description: 'Manage your account preferences and settings',
        failedToSave: 'Failed to save settings. Please try again.',
        unableToLoad: 'Unable to load settings.',
        tryAgain: 'Try Again',
        
        // Property types
        apartment: 'Apartment',
        villa: 'Villa',
        townhouse: 'Townhouse',
        studio: 'Studio',
        duplex: 'Duplex',
        penthouse: 'Penthouse',
        
        // Section navigation
        notifications: 'Notifications',
        privacySecurity: 'Privacy & Security',
        appearance: 'Appearance',
        preferences: 'Preferences',
        searchDefaults: 'Search Defaults',
        
        // Notifications section
        notificationPreferences: 'Notification Preferences',
        emailNotifications: 'Email Notifications',
        smsNotifications: 'SMS Notifications',
        pushNotifications: 'Push Notifications',
        property_updates: 'Property Updates',
        saved_search_alerts: 'Saved Search Alerts',
        inquiry_responses: 'Inquiry Responses',
        newsletter: 'Newsletter',
        marketing: 'Marketing',
        urgent_only: 'Urgent Only',
        chat_messages: 'Chat Messages',
        
        // Privacy section
        profileVisibility: 'Profile Visibility',
        profileVisibilityDesc: 'Control who can see your profile information',
        public: 'Public',
        private: 'Private',
        contactsOnly: 'Contacts Only',
        showActivity: 'Show Activity',
        showActivityDesc: 'Allow others to see your property viewing activity',
        allowContact: 'Allow Contact',
        allowContactDesc: 'Allow agents and other users to contact you',
        
        // Appearance section
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
        language: 'Language',
        english: 'English',
        arabic: 'العربية',
        currency: 'Currency',
        egp: 'Egyptian Pound (EGP)',
        usd: 'US Dollar (USD)',
        eur: 'Euro (EUR)',
        
        // Search defaults section
        defaultSearchRadius: 'Default Search Radius (km)',
        defaultPropertyTypes: 'Default Property Types',
        defaultPriceRange: 'Default Price Range',
        minimum: 'Minimum',
        maximum: 'Maximum',
        minPrice: 'Min price',
        maxPrice: 'Max price',
        
        // Save section
        settingsSaved: 'Settings saved successfully',
        saving: 'Saving...',
        saveChanges: 'Save Changes',
        
        sections: {
          notifications: 'Notification Preferences',
          privacy: 'Privacy & Security',
          appearance: 'Appearance',
          searchDefaults: 'Search Defaults'
        },
        notifications: {
          sms: 'SMS Notifications',
          push: 'Push Notifications'
        },
        privacy: {
          public: 'Public',
          private: 'Private',
          contactsOnly: 'Contacts Only'
        },
        currencies: {
          egp: 'Egyptian Pound (EGP)',
          usd: 'US Dollar (USD)',
          eur: 'Euro (EUR)'
        }
      },

      // Quick Filters for Landing Page
      quickFilters: {
        underBudget: 'Under $150K',
        newListings: 'New Listings',
        withPool: 'With Pool',
        cityViews: 'City Views',
        parking: 'Parking',
        furnished: 'Furnished'
      },

      // Common Elements
      common: {
        actions: {
          viewDetails: 'View Details',
          edit: 'Edit',
          delete: 'Delete',
          confirm: 'Confirm',
          cancel: 'Cancel'
        },
        status: {
          verified: 'Verified',
          pending: 'Pending',
          confirmed: 'Confirmed',
          cancelled: 'Cancelled',
          failed: 'Failed'
        },
        errors: {
          loadingFailed: 'Failed to load data',
          notFound: 'Not Found',
          tryAgain: 'Please try again later'
        }
      },

      // Appraisal Form Section - Phase 1.1: Critical 20 Fields
      appraisalForm: {
        // Section Headers
        sections: {
          header: 'Header Information',
          basicProperty: 'Basic Property Information', 
          coreBuilding: 'Core Building Details',
          mainTitle: 'Egyptian Property Appraisal Form',
          mainDescription: 'Complete property assessment based on Egyptian valuation standards',
          appraisalInformation: 'Appraisal Information',
          propertyLocation: 'Property Location',
          buildingInformation: 'Building Information',
          buildingDescription: 'Physical building details and specifications',
          professionalInformation: 'Professional Information',
          technicalSpecifications: 'Technical Specifications',
          systemDescriptions: 'System Descriptions',
          basicPropertyInformation: 'Basic Property Information',
          conditionAssessment: 'Property Condition Assessment',
          conditionDescription: 'Rate the property condition on a scale of 1-10',
          utilitiesServices: 'Utilities & Services',
          utilitiesDescription: 'Available utilities and building services',
          marketAnalysis: 'Market Analysis',
          marketDescription: 'Local market conditions and trends',
          economicAnalysis: 'Economic Analysis (Egyptian Standards)',
          economicDescription: 'Building economic life and depreciation analysis',
          locationAnalysis: 'Location Analysis (Egyptian Standards)',
          locationDescription: 'Detailed location and market characteristics',
          landValuation: 'Land Valuation (Egyptian Standards)',
          landDescription: 'Land value analysis and highest & best use',
          roomSpecifications: 'Room Specifications (Egyptian Standards)',
          roomDescription: 'Detailed room-by-room material specifications',
          flooringMaterials: 'Flooring Materials',
          wallFinishes: 'Wall Finishes',
          valuationMethods: 'Valuation Methods (Egyptian Standards)',
          valuationDescription: 'Three approaches to value and final reconciliation',
          comparativeSalesAnalysis: 'Comparative Sales Analysis (Egyptian Standards)',
          comparativeSalesDescription: 'Analysis of comparable property sales for valuation support',
          professionalCertifications: 'Professional Certifications (Egyptian Standards)',
          professionalCertificationsDescription: 'Compliance with Egyptian valuation standards and professional requirements',
          advancedValuationComponents: 'Advanced Valuation Components',
          egyptianStandardsCompliance: 'Egyptian Standards Compliance',
          photosDocumentation: 'Photos & Documentation',
          photosDocumentationDescription: 'Property images and legal documents'
        },
        
        // Header Section Fields (5 fields)
        fields: {
          client_name: 'Client Name',
          requested_by: 'Requested By',
          appraiser_name: 'Appraiser Name',
          registration_number: 'Registration Number',
          report_type: 'Report Type',
          
          // Basic Property Fields (8 fields)
          property_address_arabic: 'Property Address (Arabic)',
          property_address_english: 'Property Address (English)',
          district: 'District',
          city: 'City',
          property_type: 'Property Type',
          bedrooms: 'Bedrooms',
          bathrooms: 'Bathrooms',
          governorate: 'Governorate',
          
          // Core Building Fields (7 fields)
          building_age_years: 'Building Age (Years)',
          construction_type: 'Construction Type',
          floor_number: 'Floor Number',
          unit_area_sqm: 'Unit Area (m²)',
          built_area_sqm: 'Built Area (m²)',
          land_area_sqm: 'Land Area (m²)',
          unit_number: 'Unit Number',
          
          // Additional Form Fields
          appraisal_valid_until: 'Appraisal Valid Until',
          building_number: 'Building Number',
          finishing_level: 'Finishing Level',
          floor_materials: 'Floor Materials',
          wall_finishes: 'Wall Finishes',
          ceiling_type: 'Ceiling Type',
          windows_type: 'Windows Type',
          doors_type: 'Doors Type',
          electrical_system_description: 'Electrical System Description',
          sanitary_ware_description: 'Sanitary Ware Description',
          exterior_finishes_description: 'Exterior Finishes Description',
          overall_condition_rating: 'Overall Condition Rating',
          structural_condition: 'Structural Condition',
          mechanical_systems_condition: 'Mechanical Systems',
          exterior_condition: 'Exterior Condition',
          interior_condition: 'Interior Condition',
          reception_rooms: 'Reception Rooms',
          kitchens: 'Kitchens',
          parking_spaces: 'Parking Spaces',
          total_floors: 'Total Floors',
          year_built: 'Year Built',
          balcony_area_sqm: 'Balcony Area (m²)',
          garage_area_sqm: 'Garage Area (m²)',
          entrance: 'Entrance',
          orientation: 'Orientation',
          inspection_date: 'Inspection Date',
          report_issue_date: 'Report Issue Date',
          signature_date: 'Signature Date',
          report_validity_months: 'Report Validity (Months)',
          certification_authority: 'Certification Authority',
          funding_source: 'Funding Source',
          
          // Utilities & Services
          electricity_available: 'Electricity Available',
          water_supply_available: 'Water Supply Available',
          sewage_system_available: 'Sewage System Available',
          gas_supply_available: 'Gas Supply Available',
          telephone_available: 'Telephone Available',
          internet_fiber_available: 'Internet/Fiber Available',
          elevator_available: 'Elevator Available',
          parking_available: 'Parking Available',
          security_system: 'Security System',
          nearby_services: 'Nearby Services',
          
          // Market Analysis
          market_trend: 'Market Trend',
          demand_supply_ratio: 'Demand/Supply Ratio',
          price_per_sqm_area: 'Area Price per m² (EGP)',
          time_to_sell: 'Time to Sell (Months)',
          price_per_sqm_semi_finished: 'Price per m² Semi-Finished',
          price_per_sqm_fully_finished: 'Price per m² Fully Finished',
          
          // Economic Analysis
          economic_life_years: 'Economic Life (Years)',
          current_age_ratio: 'Current Age Ratio (%)',
          depreciation_rate_annual: 'Annual Depreciation Rate (%)',
          replacement_cost_new: 'Replacement Cost New (EGP)',
          curable_depreciation_value: 'Curable Depreciation Value (EGP)',
          incurable_depreciation_value: 'Incurable Depreciation Value (EGP)',
          total_depreciation_value: 'Total Depreciation Value (EGP)',
          time_on_market_months: 'Time on Market (Months)',
          street_type: 'Street Type',
          commercial_percentage: 'Commercial Usage (%)',
          market_activity: 'Market Activity',
          property_liquidity: 'Property Liquidity',
          
          // Location Analysis
          area_density: 'Area Density',
          construction_volume: 'Construction Volume (m³)',
          location_description: 'Location Description',
          nearby_services: 'Nearby Services',
          funding_source: 'Funding Source',
          area_character: 'Area Character',
          
          // Land Valuation
          land_value_per_sqm: 'Land Value per m² (EGP)',
          total_building_land_area: 'Total Building Land Area (m²)',
          land_use_classification: 'Land Use Classification',
          highest_best_use_confirmed: 'Highest & Best Use Confirmed',
          land_value: 'Land Value (EGP)',
          unit_land_share_value: 'Unit Land Share Value (EGP)',
          unit_land_share_sqm: 'Unit Land Share (m²)',
          
          // Room Specifications
          reception_flooring: 'Reception Flooring',
          kitchen_flooring: 'Kitchen Flooring',
          bathroom_flooring: 'Bathroom Flooring',
          bedroom_flooring: 'Bedroom Flooring',
          terrace_flooring: 'Terrace Flooring',
          reception_walls: 'Reception Walls',
          kitchen_walls: 'Kitchen Walls',
          bathroom_walls: 'Bathroom Walls',
          bedroom_walls: 'Bedroom Walls',
          
          // Valuation Methods
          cost_approach_value: 'Cost Approach Value (EGP)',
          sales_comparison_value: 'Sales Comparison Value (EGP)',
          income_approach_value: 'Income Approach Value (EGP)',
          final_reconciled_value: 'Final Reconciled Value (EGP)',
          recommended_method: 'Recommended Method',
          monthly_rental_value: 'Monthly Rental Estimate (EGP)',
          price_per_sqm_semi_finished: 'Price per sqm Semi-Finished (EGP)',
          price_per_sqm_fully_finished: 'Price per sqm Fully Finished (EGP)',
          building_value: 'Building Value (EGP)',
          unit_construction_cost: 'Unit Construction Cost (EGP)',
          construction_cost_per_sqm: 'Construction Cost per Sqm (EGP/m²)',
          building_value_with_profit: 'Building Value with Profit (EGP)',
          
          // Comparable Sales
          comparable_sale_1_address: 'Comparable Sale 1 Address',
          comparable_sale_1_date: 'Sale Date',
          comparable_sale_1_price: 'Sale Price (EGP)',
          comparable_sale_1_area: 'Area (m²)',
          comparable_sale_1_price_per_sqm: 'Price per m² (EGP)',
          comparable_sale_1_age: 'Building Age (Years)',
          comparable_sale_1_finishing: 'Finishing Level',
          comparable_sale_1_floor: 'Floor Number',
          comparable_sale_1_orientation: 'Orientation',
          comparable_sale_1_street: 'Street/View',
          comparable_sale_2_address: 'Comparable Sale 2 Address',
          comparable_sale_2_date: 'Sale Date',
          comparable_sale_2_price: 'Sale Price (EGP)',
          comparable_sale_2_area: 'Area (m²)',
          comparable_sale_2_price_per_sqm: 'Price per m² (EGP)',
          comparable_sale_2_age: 'Building Age (Years)',
          comparable_sale_2_finishing: 'Finishing Level',
          comparable_sale_2_floor: 'Floor Number',
          comparable_sale_2_orientation: 'Orientation',
          comparable_sale_2_street: 'Street/View',
          comparable_sale_3_address: 'Comparable Sale 3 Address',
          comparable_sale_3_date: 'Sale Date',
          comparable_sale_3_price: 'Sale Price (EGP)',
          comparable_sale_3_area: 'Area (m²)',
          comparable_sale_3_price_per_sqm: 'Price per m² (EGP)',
          comparable_sale_3_age: 'Building Age (Years)',
          comparable_sale_3_finishing: 'Finishing Level',
          comparable_sale_3_floor: 'Floor Number',
          comparable_sale_3_orientation: 'Orientation',
          comparable_sale_3_street: 'Street/View',
          
          // Professional Certifications
          egyptian_standards_compliance: 'Complies with Egyptian Valuation Standards',
          professional_statement_confirmed: 'Professional Statement Confirmed',
          report_validity_months: 'Report Validity (Months)',
          
          // Egyptian Standards Compliance
          physical_inspection_completed: 'Physical Inspection Completed',
          highest_best_use_applied: 'Highest & Best Use Applied',
          no_ownership_disputes: 'No Ownership Disputes',
          professional_independence_declared: 'Professional Independence Declared',
          market_value_definition_applied: 'Market Value Definition Applied',
          
          // Property Information Auto-filled
          property_type_arabic: 'Property Type (Arabic)',
          property_information_auto_filled: 'Property Information (Auto-filled)',
          
          // Report Information
          report_information: 'Report Information',
          inspection_date: 'Inspection Date',
          report_issue_date: 'Report Issue Date',
          signature_date: 'Signature Date',
          
          // Professional Certification Details
          certification_authority: 'Certification Authority',
          fra_resolution: 'FRA Resolution',
          resolution_date: 'Resolution Date',
          report_validity: 'Report Validity',
          months: 'months'
        },
        
        // Placeholders
        placeholders: {
          client_name: 'Enter client name',
          requested_by: 'Who requested the appraisal',
          appraiser_name: 'Licensed appraiser name',
          registration_number: 'Professional registration number',
          property_address_arabic: 'عنوان العقار بالعربية',
          property_address_english: 'Property address in English',
          city: 'City name',
          governorate: 'Governorate name',
          floor_number: 'Floor number',
          unit_number: 'Unit number',
          building_age_years: 'Building age in years',
          bedrooms: 'Number of bedrooms',
          bathrooms: 'Number of bathrooms',
          unit_area_sqm: 'Unit area in square meters',
          built_area_sqm: 'Built area in square meters',
          land_area_sqm: 'Land area in square meters',
          building_number: 'Building number',
          entrance: 'Entrance information',
          orientation: 'Property orientation',
          balcony_area_sqm: 'Balcony area in square meters',
          garage_area_sqm: 'Garage area in square meters',
          reception_rooms: 'Number of reception rooms',
          kitchens: 'Number of kitchens',
          parking_spaces: 'Number of parking spaces',
          total_floors: 'Total floors in building',
          year_built: 'Year the property was built',
          ceiling_type: 'e.g., Suspended, Concrete, Decorative',
          electrical_system_description: 'Describe electrical installations, wiring, outlets, lighting...',
          sanitary_ware_description: 'Describe bathrooms, fixtures, plumbing quality...',
          exterior_finishes_description: 'Describe external facades, paint, cladding, balconies...',
          replacement_cost_new: 'e.g., 1500000 - Cost to build new today',
          curable_depreciation_value: 'e.g., 50000 - Depreciation that can be economically repaired',
          incurable_depreciation_value: 'e.g., 112800 - Depreciation that cannot be economically repaired',
          construction_volume: 'Construction volume in cubic meters',
          location_description: 'Describe the location characteristics',
          area_character: 'Describe the area character and neighborhood',
          
          // Room Specifications Placeholders
          flooring_material: 'Select flooring material',
          wall_finish: 'Select wall finish',
          
          // Valuation Methods Placeholders
          recommended_method: 'Select method',
          comparable_sale_1_finishing: 'e.g., تشطيب فاخر',
          comparable_sale_1_orientation: 'e.g., بحري',
          comparable_sale_1_street: 'e.g., على حديقة',
          comparable_sale_2_finishing: 'e.g., نصف تشطيب',
          comparable_sale_2_orientation: 'e.g., بحري',
          comparable_sale_2_street: 'e.g., على شارع فرعي',
          comparable_sale_3_age: 'Building age',
          comparable_sale_3_finishing: 'Finishing level',
          comparable_sale_3_orientation: 'Unit orientation',
          comparable_sale_3_street: 'Street type and view',
          sales_comparison_value: 'Based on comparable sales',
          
          // New dropdown placeholders
          ceiling_type: 'Select ceiling type',
          finishing_level: 'Select finishing level',
          orientation: 'Select orientation',
          street_view: 'Select street view type',
          
          // Professional Certifications
          report_validity_months: 'Report validity period in months',
          egyptian_standards_compliance: 'المعايير المصرية للتقييم',
          professional_statement_confirmed: 'أشهد أنني خبير التقييم'
        },
        
        // Enum Options
        options: {
          report_types: {
            full_appraisal: 'Full Appraisal',
            update: 'Update',
            summary: 'Summary',
            restricted: 'Restricted'
          },
          property_types: {
            apartment: 'Apartment',
            villa: 'Villa', 
            townhouse: 'Townhouse',
            penthouse: 'Penthouse',
            studio: 'Studio',
            duplex: 'Duplex',
            commercial: 'Commercial',
            industrial: 'Industrial',
            land: 'Land'
          },
          construction_types: {
            concrete: 'Reinforced Concrete',
            brick: 'Brick Construction',
            steel: 'Steel Frame', 
            mixed: 'Mixed Construction'
          },
          finishing_levels: {
            core_shell: 'Core & Shell',
            semi_finished: 'Semi-Finished',
            fully_finished: 'Fully Finished',
            luxury: 'Luxury'
          },
          conditions: {
            excellent: 'Excellent',
            good: 'Good', 
            fair: 'Fair',
            poor: 'Poor'
          },
          windows_types: {
            aluminum: 'Aluminum',
            wood: 'Wood',
            upvc: 'uPVC',
            steel: 'Steel'
          },
          market_trends: {
            rising: 'Rising',
            stable: 'Stable',
            declining: 'Declining'
          },
          street_types: {
            main_street: 'Main Street',
            side_street: 'Side Street',
            internal_street: 'Internal Street'
          },
          liquidity_levels: {
            high: 'High',
            medium: 'Medium',
            low: 'Low'
          },
          condition_ratings: {
            poor: 'Poor',
            fair: 'Fair', 
            good: 'Good',
            excellent: 'Excellent',
            poor_range: 'Poor (1-3)',
            fair_range: 'Fair (4-6)',
            good_range: 'Good (7-8)',
            excellent_range: 'Excellent (9-10)'
          },
          area_density: {
            crowded: 'Crowded',
            moderate: 'Moderate',
            sparse: 'Sparse'
          },
          doors_types: {
            wood: 'Wood',
            metal: 'Metal',
            steel: 'Steel',
            glass: 'Glass',
            upvc: 'UPVC',
            pvc: 'PVC',
            aluminum: 'Aluminum',
            composite: 'Composite',
            security_steel: 'Security Steel',
            solid_wood: 'Solid Wood',
            mdf: 'MDF'
          },
          flooring_materials: {
            ceramic: 'Ceramic',
            porcelain: 'Porcelain',
            marble: 'Marble',
            granite: 'Granite',
            parquet: 'Parquet',
            laminate: 'Laminate',
            vinyl: 'Vinyl',
            carpet: 'Carpet',
            terrazzo: 'Terrazzo',
            natural_stone: 'Natural Stone',
            mosaic: 'Mosaic',
            concrete: 'Concrete',
            tiles: 'Tiles'
          },
          wall_finishes: {
            plastic_paint: 'Plastic Paint',
            oil_paint: 'Oil Paint',
            wallpaper: 'Wallpaper',
            stone_cladding: 'Stone Cladding',
            wood_panels: 'Wood Panels',
            gypsum_board: 'Gypsum Board',
            ceramic_tiles: 'Ceramic Tiles',
            stainless_steel: 'Stainless Steel',
            glass: 'Glass',
            waterproof_paint: 'Waterproof Paint'
          },
          valuation_methods: {
            cost_approach: 'Cost Approach',
            sales_comparison: 'Sales Comparison',
            income_approach: 'Income Approach'
          },
          ceiling_types: {
            suspended: 'Suspended Ceiling',
            concrete: 'Concrete Ceiling',
            decorative: 'Decorative Ceiling',
            gypsum_board: 'Gypsum Board',
            wood: 'Wood Ceiling',
            metal: 'Metal Ceiling',
            pvc: 'PVC Ceiling',
            acoustic: 'Acoustic Ceiling',
            plastic_paint: 'Plastic Paint'
          },
          orientations: {
            north: 'North (بحري)',
            south: 'South (قبلي)',
            east: 'East (شرقي)',
            west: 'West (غربي)',
            northeast: 'Northeast (شمال شرقي)',
            northwest: 'Northwest (شمال غربي)',
            southeast: 'Southeast (جنوب شرقي)',
            southwest: 'Southwest (جنوب غربي)'
          },
          street_views: {
            garden_view: 'Garden View (على حديقة)',
            main_street: 'Main Street (شارع رئيسي)',
            side_street: 'Side Street (شارع فرعي)',
            internal_street: 'Internal Street (شارع داخلي)',
            sea_view: 'Sea View (منظر بحري)',
            nile_view: 'Nile View (منظر نيلي)',
            park_view: 'Park View (منظر متنزه)',
            building_view: 'Building View (منظر مباني)'
          }
        },
        
        // Field Descriptions
        descriptions: {
          // Economic Analysis Descriptions
          economic_life_years: 'Expected economic life of the building',
          current_age_ratio: 'Current age / Economic life * 100',
          depreciation_rate_annual: 'Annual depreciation percentage',
          replacement_cost_new: 'Cost to build new today',
          curable_depreciation_value: 'Depreciation that can be economically repaired',
          incurable_depreciation_value: 'Depreciation that cannot be economically repaired',
          total_depreciation_value: 'Total depreciation (curable + incurable)',
          demand_supply_ratio: '1.0 = balanced, >1.0 = high demand',
          price_per_sqm_area: 'Average price per square meter in area',
          
          // Location Analysis Descriptions
          time_on_market_months: 'Average time properties stay on market in this area',
          area_density: 'Population and building density characteristics',
          construction_volume: 'Total construction volume in cubic meters',
          location_description: 'Comprehensive description of location characteristics',
          nearby_services: 'Available services and amenities in the vicinity',
          area_character: 'Overall character and nature of the neighborhood',
          commercial_percentage: 'Percentage of commercial use in area',
          funding_source: 'Source of property funding',
          
          // Land Valuation Descriptions
          land_value_per_sqm: 'Land value per square meter',
          total_building_land_area: 'Total land area of the building',
          unit_land_share_sqm: 'Unit\'s share in total land area',
          land_use_classification: 'Current land use classification',
          
          // Valuation Methods Descriptions
          cost_approach_value: 'Replacement cost less depreciation',
          sales_comparison_value: 'Based on comparable sales',
          income_approach_value: 'Capitalized income value',
          final_reconciled_value: 'Final appraised value',
          recommended_method: 'Most reliable approach for this property',
          monthly_rental_value: 'Market rental value per month',
          price_per_sqm_semi_finished: 'Market price per sqm for semi-finished units',
          price_per_sqm_fully_finished: 'Market price per sqm for fully finished units',
          land_value: 'Total land value',
          building_value: 'Building/structure value',
          unit_land_share_value: 'Unit\'s proportional land value',
          unit_construction_cost: 'Cost to construct this unit',
          construction_cost_per_sqm: 'Construction cost per square meter',
          building_value_with_profit: 'Building value including developer profit'
        },
        
        // Notes and Standards
        notes: {
          egyptianStandardsNote: 'Egyptian Standards Note:',
          finalValueReconciliation: 'The final value should be reconciled considering the reliability of each approach based on available market data, property type',
          comparableSalesNote: 'Comparable sales should be recent (within 12 months), similar in size, location, and property type',
          comparableSalesAdjustments: 'Adjustments should be made for differences in age, condition, floor level, and view',
          legalStandardsNote: 'Note: This section will be automatically included in the PDF report with standard Egyptian legal clauses and your specific property details. Legal assumptions and limitations according to Egyptian Real Estate Valuation Standards (FRA Resolution 39/2015)',
          egyptianFinancialRegulatoryAuthority: 'Egyptian Financial Regulatory Authority'
        },
        
        // Photos and Documentation
        photosDocumentation: {
          extractedPropertyImages: 'Extracted Property Images',
          imagesAutomaticallyExtracted: 'images automatically extracted from the appraisal document',
          aiExtracted: 'AI Extracted',
          propertyPhotos: 'Property Photos',
          uploadPropertyPhotos: 'Upload property photos',
          propertyPhotosFormat: 'PNG, JPG, GIF up to 10MB each',
          aerialPhotos: 'Aerial Photos',
          uploadAerialPhotos: 'Upload aerial/satellite photos',
          aerialPhotosDescription: 'Drone or satellite imagery',
          floorPlan: 'Floor Plan',
          uploadFloorPlan: 'Upload floor plan',
          floorPlanFormat: 'PDF, PNG, JPG',
          legalDocuments: 'Legal Documents',
          uploadLegalDocuments: 'Upload legal documents',
          legalDocumentsDescription: 'Title deed, permits, certificates',
          uploadNote: 'All uploaded documents will be securely stored and included in the final appraisal report. High-quality photos improve valuation accuracy.',
          noFileChosen: 'No file chosen'
        },
        
        // Calculated Property Value
        calculatedPropertyValue: {
          title: 'Calculated Property Value',
          description: 'Automatically calculated based on Egyptian valuation standards',
          confidence: 'Confidence',
          marketValue: 'Market Value',
          pricePerSqm: 'Price per m²',
          landValue: 'Land Value',
          buildingValue: 'Building Value',
          calculationBreakdown: 'Calculation Breakdown',
          baseCost: 'Base Cost',
          ageDepreciation: 'Age Depreciation',
          conditionAdj: 'Condition Adj',
          locationAdj: 'Location Adj',
          marketAdj: 'Market Adj'
        },
        
        // Validation Messages
        validation: {
          required: 'This field is required',
          min_value: 'Value must be greater than {{min}}',
          max_value: 'Value must be less than {{max}}',
          invalid_format: 'Invalid format',
          client_name_required: 'Client name is required',
          requested_by_required: 'Requested by is required',
          appraiser_name_required: 'Appraiser name is required',
          registration_number_required: 'Registration number is required',
          property_address_arabic_required: 'Arabic address is required',
          property_address_english_required: 'English address is required',
          district_required: 'District is required',
          city_required: 'City is required',
          governorate_required: 'Governorate is required',
          building_age_required: 'Building age is required',
          construction_type_required: 'Construction type is required',
          property_type_required: 'Property type is required',
          bedrooms_required: 'Bedrooms is required',
          bathrooms_required: 'Bathrooms is required',
          unit_area_required: 'Unit area is required',
          built_area_required: 'Built area is required',
          land_area_required: 'Land area is required'
        }
      },

      // Booking Section
      booking: {
        bookingDetails: 'Booking Details',
        serviceType: 'Service Type',
        appointmentDate: 'Appointment Date',
        appointmentTime: 'Appointment Time',
        preferredDate: 'Preferred Date',
        preferredTime: 'Preferred Time',
        urgency: 'Urgency',
        standard: 'Standard (7-10 days)',
        rush: 'Rush (3-5 days)',
        sameDay: 'Same Day',
        serviceRequirements: 'Service Requirements',
        reportType: 'Report Type',
        standardReport: 'Standard Report',
        detailedReport: 'Detailed Report',
        comprehensiveReport: 'Comprehensive Report',
        additionalServices: 'Additional Services',
        digitalSignature: 'Digital Signature',
        notarization: 'Notarization',
        translation: 'Translation',
        specialInstructions: 'Special Instructions',
        contactInformation: 'Contact Information',
        fullName: 'Full Name',
        phoneNumber: 'Phone Number',
        emailAddress: 'Email Address',
        propertyAddress: 'Property Address',
        propertyType: 'Property Type',
        propertySize: 'Property Size',
        accessInstructions: 'Property Access Instructions',
        paymentDetails: 'Payment Details',
        totalAmount: 'Total Amount',
        depositAmount: 'Deposit Amount (30%)',
        remainingAmount: 'Remaining Amount',
        paymentMethod: 'Payment Method',
        bookingConfirmation: 'Booking Confirmation',
        confirmBooking: 'Confirm Booking',
        modifyBooking: 'Modify Booking',
        cancelBooking: 'Cancel Booking',
        bookingReference: 'Booking Reference',
        confirmationEmail: 'Confirmation email sent',
        bookingStatus: 'Booking Status',
        scheduled: 'Scheduled',
        confirmed: 'Confirmed',
        inProgress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
        rescheduled: 'Rescheduled',
        reminders: 'Reminders',
        smsReminder: 'SMS reminder will be sent 24 hours before',
        emailReminder: 'Email reminder will be sent',
        calendar: 'Add to Calendar'
      },

      // Footer
      footer: {
        description: 'Revolutionizing real estate with immersive virtual tours and AI assistance.',
        properties: 'Properties',
        apartments: 'Apartments',
        villas: 'Villas',
        penthouses: 'Penthouses',
        services: 'Services',
        virtualTours: 'Virtual Tours',
        aiAssistance: 'AI Assistance',
        propertyManagement: 'Property Management',
        contact: 'Contact',
        location: 'Cairo, Egypt',
        rights: 'All rights reserved.'
      },

      // Payment Success Section
      payment: {
        success: {
          paymentSuccessful: 'Payment Successful!',
          bookingConfirmed: 'Your booking has been confirmed',
          missingBookingId: 'Missing booking information',
          failedToLoadBooking: 'Failed to load booking details',
          bookingNotFound: 'Booking not found',
          loadingBookingDetails: 'Loading booking details...',
          bookingDetails: 'Booking Details',
          confirmed: 'Confirmed',
          confirmationNumber: 'Confirmation Number',
          scheduledDate: 'Scheduled Date',
          appraiser: 'Appraiser',
          stayPeriod: 'Stay Period',
          nights: 'nights',
          guests: 'guests',
          nextSteps: 'What\'s Next?',
          step1: 'You will receive a confirmation email with all the details',
          step2: 'The service provider will contact you to confirm arrangements',
          step3: 'Arrive at the scheduled time and enjoy your booking',
          paymentSummary: 'Payment Summary',
          totalAmount: 'Total Amount',
          paymentMethod: 'Payment Method',
          paidOn: 'Paid On',
          status: 'Status',
          paid: 'Paid',
          actions: 'Actions',
          downloadReceipt: 'Download Receipt',
          shareBooking: 'Share Booking',
          viewMyBookings: 'View My Bookings',
          needHelp: 'Need Help?',
          supportDescription: 'Have questions about your booking? Our support team is here to help.',
          callSupport: 'Call Support',
          emailSupport: 'Email Support',
          shareTitle: 'Booking Confirmed',
          shareText: 'My booking has been confirmed! Confirmation number: {{confirmationNumber}}',
          linkCopied: 'Link Copied',
          linkCopiedDescription: 'Booking link has been copied to clipboard',
          failedToDownloadReceipt: 'Failed to download receipt. Please try again.'
        }
      },

      // Payment Success - Rental Specific
      paymentSuccess: {
        // Rental payment success
        rentalTitle: 'Rental Booking Confirmed!',
        rentalSubtitle: 'Your rental payment was successful and your booking is confirmed',
        errorTitle: 'Booking Error',
        backToRentals: 'Back to Rentals',
        
        // Property and booking details
        propertyDetails: 'Property Details',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        after: 'After',
        before: 'Before',
        guests: 'guests',
        nights: 'nights',
        
        // Payment information
        paymentSummary: 'Payment Summary',
        bookingId: 'Booking ID',
        transactionId: 'Transaction ID',
        paymentStatus: 'Payment Status',
        paid: 'Paid',
        totalPaid: 'Total Paid',
        egp: 'EGP',
        
        // Contact and next steps
        contactInfo: 'Contact Information',
        nextSteps: 'Next Steps',
        step1Title: 'Confirmation Details',
        step1Desc: 'You\'ll receive email and SMS confirmations within 15 minutes',
        step2Title: 'Host Contact',
        step2Desc: 'Property management will contact you 24-48 hours before check-in',
        step3Title: 'Check-in Access',
        step3Desc: 'Digital access codes and instructions will be sent 24 hours before arrival',
        
        // Special requests and features
        specialRequests: 'Special Requests',
        digitalAccess: 'Digital Access',
        qrCodeDesc: 'Your access QR code will be available 24 hours before check-in',
        
        // Actions
        downloadReceipt: 'Download Receipt',
        browseMoreRentals: 'Browse More Rentals',
        
        // Important information
        importantNote: 'Important:',
        importantDesc: 'Keep this confirmation safe. You\'ll need your booking ID for check-in and any support requests.',
        
        // Loading and error states
        loadingBookingDetails: 'Loading booking details...',
        failedToLoadBooking: 'Failed to load booking details'
      },

      // Profile and Settings Pages
      profile: {
        // Header and navigation
        completeProfile: 'Complete your profile',
        editProfile: 'Edit Profile',
        cancel: 'Cancel',
        signOut: 'Sign Out',
        emailVerified: 'Email verified',
        phoneVerified: 'Phone verified',
        profileVerified: 'Profile verified',
        
        // Navigation tabs
        overview: 'Overview',
        savedItems: 'Saved Items',
        myAppraisals: 'My Appraisals',
        myRentals: 'My Rentals',
        viewingHistory: 'Viewing History',
        savedSearches: 'Saved Searches',
        settings: 'Settings',
        
        // Form fields
        fullName: 'Full Name',
        phoneNumber: 'Phone Number',
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        nationality: 'Nationality',
        occupation: 'Occupation',
        company: 'Company',
        bio: 'Bio',
        
        // Form placeholders
        enterFullName: 'Enter your full name',
        enterPhoneNumber: 'Enter your phone number',
        selectGender: 'Select gender',
        enterNationality: 'Enter your nationality',
        enterOccupation: 'Enter your occupation',
        enterCompany: 'Enter your company',
        tellUsAbout: 'Tell us about yourself',
        
        // Gender options
        male: 'Male',
        female: 'Female',
        other: 'Other',
        preferNotToSay: 'Prefer not to say',
        
        // Profile sections
        personalInfo: 'Personal Info',
        professional: 'Professional',
        about: 'About',
        quickStats: 'Quick Stats',
        accountStatus: 'Account Status',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        
        // Status labels
        notProvided: 'Not provided',
        verified: 'Verified',
        pending: 'Pending',
        notVerified: 'Not verified',
        standard: 'Standard',
        
        // Stats
        savedProperties: 'Saved Properties',
        rentalBookings: 'Rental Bookings',
        savedSearches: 'Saved Searches',
        activityCount: 'Activity Count',
        
        // Actions
        saveChanges: 'Save Changes',
        saving: 'Saving...',
        refresh: 'Refresh',
        viewAll: 'View All',
        
        // Messages
        pleaseSignIn: 'Please sign in to view your profile.',
        signIn: 'Sign In',
        failedToSave: 'Failed to save profile. Please try again.',
        
        // Saved items sub-tabs
        properties: 'Properties',
        appraisers: 'Appraisers',
        browseProperties: 'Browse Properties',
        findAppraisers: 'Find Appraisers',
        browseAppraisers: 'Browse Appraisers',
        findMore: 'Find More',
        
        // Empty states
        noSavedProperties: 'No saved properties yet',
        noSavedAppraisers: 'No saved appraisers yet',
        noRentalBookings: 'No rental bookings yet',
        noViewingHistory: 'No viewing history yet',
        noSavedSearches: 'No saved searches yet',
        noAppraisals: 'No appraisals yet',
        
        // Browse links
        browseRentals: 'Browse Rentals',
        startBrowsingProperties: 'Start Browsing Properties',
        createFirstSearch: 'Create Your First Search',
        
        // Appraisal section
        bookAppraiser: 'Book an appraiser to get professional property valuations',
        findAppraisersLink: 'Find Appraisers',
        yearsExp: 'years exp.',
        respondsIn: 'Responds in',
        hours: 'h',
        more: 'more',
        remove: 'Remove',
        viewProfile: 'View Profile',
        saved: 'Saved',
        noReviewsYet: 'No reviews yet',
        
        // Rental bookings
        myRentalBookings: 'My Rental Bookings',
        guests: 'guests',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        totalAmount: 'Total Amount',
        qrCodes: 'QR Codes',
        available: 'Available',
        pending: 'Pending',
        qrCodesReady: 'QR Codes Ready',
        qrCodesPending: 'QR Codes Pending',
        qrCodesExpired: 'QR Codes Expired',
        qrCodesReadyDesc: 'Your QR codes are ready for use. You have {{count}} active QR codes for property access.',
        qrCodesPendingDesc: 'QR codes will be provided 24-48 hours before your check-in date by the property management team.',
        qrCodesExpiredDesc: 'QR codes for this booking have expired.',
        viewQrCodes: 'View QR Codes',
        activeCodes: 'active codes',
        bookedOn: 'Booked on',
        viewProperty: 'View Property',
        leaveReview: 'Leave Review',
        
        // Booking statuses
        confirmed: 'confirmed',
        checkedIn: 'checked_in',
        completed: 'completed',
        
        // Viewing history
        recentViewingHistory: 'Recent Viewing History',
        recentViews: 'recent views',
        viewed: 'Viewed',
        viewAgain: 'View Again',
        propertyNotFound: 'Property not found',
        beds: 'beds',
        baths: 'baths',
        sqm: 'sqm',
        
        // Saved searches
        alertFrequency: 'Alert frequency',
        created: 'Created',
        active: 'Active',
        paused: 'Paused',
        runSearch: 'Run Search',
        
        // Client appraisals
        appraisals: 'appraisals',
        propertyAppraisal: 'Property Appraisal',
        appraiser: 'Appraiser',
        date: 'Date',
        reference: 'Reference',
        marketValue: 'Market Value',
        confidence: 'Confidence',
        download: 'Download',
        review: 'Review',
        propertyType: 'Property Type',
        
        // Settings link
        accountSettings: 'Account Settings',
        detailedSettings: 'For detailed settings management, visit the dedicated settings page.',
        goToSettings: 'Go to Settings'
      },

      settings: {
        // Page header
        accountSettings: 'Account Settings',
        personalInformation: 'Personal Information',
        notificationPreferences: 'Notification Preferences',
        privacySettings: 'Privacy Settings',
        searchPreferences: 'Search Preferences',
        
        // Email notifications
        emailNotifications: 'Email Notifications',
        propertyUpdates: 'Property Updates',
        savedSearchAlerts: 'Saved Search Alerts',
        inquiryResponses: 'Inquiry Responses',
        newsletter: 'Newsletter',
        marketing: 'Marketing Communications',
        
        // SMS notifications
        smsNotifications: 'SMS Notifications',
        urgentOnly: 'Urgent Only',
        
        // Push notifications
        pushNotifications: 'Push Notifications',
        chatMessages: 'Chat Messages',
        
        // Appearance
        appearance: 'Appearance',
        theme: 'Theme',
        language: 'Language',
        currency: 'Currency',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        
        // Privacy
        privacy: 'Privacy',
        profileVisibility: 'Profile Visibility',
        showActivity: 'Show Activity',
        allowContact: 'Allow Contact',
        public: 'Public',
        private: 'Private',
        friendsOnly: 'Friends Only',
        
        // Search preferences
        defaultSearchRadius: 'Default Search Radius',
        defaultPropertyTypes: 'Default Property Types',
        priceRange: 'Price Range Preference',
        minPrice: 'Minimum Price',
        maxPrice: 'Maximum Price',
        
        // Account security
        accountSecurity: 'Account Security',
        changePassword: 'Change Password',
        twoFactorAuth: 'Two-Factor Authentication',
        loginSessions: 'Login Sessions',
        
        // Actions
        saveSettings: 'Save Settings',
        resetToDefaults: 'Reset to Defaults',
        
        // Messages
        settingsSaved: 'Settings saved successfully',
        settingsError: 'Failed to save settings. Please try again.',
        
        // Loading states
        loadingSettings: 'Loading settings...',
        savingSettings: 'Saving settings...'
      },

      // Broker Calendar
      calendar: {
        scheduleViewing: 'Schedule a Viewing',
        chooseYourBroker: 'Choose Your Broker',
        selectDate: 'Select Date',
        availableTimes: 'Available Times',
        primary: 'Primary',
        yearsExperience: 'years',
        slotsAvailable: 'slots available',
        noAvailableSlots: 'No available time slots for this date.',
        tryDifferentDate: 'Try selecting a different date or broker.',
        noBrokersAvailable: 'No brokers available for this property.',
        errorLoadingBrokers: 'Failed to load brokers',
        tryAgain: 'Try Again',
        monthNames: {
          january: 'January',
          february: 'February',
          march: 'March',
          april: 'April',
          may: 'May',
          june: 'June',
          july: 'July',
          august: 'August',
          september: 'September',
          october: 'October',
          november: 'November',
          december: 'December'
        },
        weekDays: {
          sunday: 'Sun',
          monday: 'Mon',
          tuesday: 'Tue',
          wednesday: 'Wed',
          thursday: 'Thu',
          friday: 'Fri',
          saturday: 'Sat'
        }
      }
    }
  },
  ar: {
    translation: {
      // Common
      common: {
        ok: 'موافق',
        cancel: 'إلغاء',
        yes: 'نعم',
        no: 'لا',
        close: 'إغلاق',
        save: 'حفظ',
        edit: 'تعديل',
        delete: 'حذف',
        remove: 'إزالة',
        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجح',
        optional: 'اختياري',
        required: 'مطلوب',
        search: 'بحث',
        filter: 'تصفية',
        sort: 'ترتيب',
        viewAll: 'عرض الكل',
        viewMore: 'عرض المزيد',
        showLess: 'عرض أقل',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',
        done: 'تم',
        retry: 'إعادة المحاولة',
        refresh: 'تحديث',
        share: 'مشاركة',
        both: 'كلاهما',
        clearAll: 'مسح الكل',
        security: 'الأمان',
        elevator: 'المصعد',
        gym: 'صالة الألعاب الرياضية',
        spa: 'السبا',
        any: 'أي',
        bedroom: 'غرفة نوم',
        bathroom: 'حمام',
        at: 'في',
        filterBy: 'تصفية حسب',
        sortBy: 'ترتيب حسب',
        browseAllProperties: 'تصفح جميع العقارات',
        closePreview: 'إغلاق المعاينة',
        previewTour: 'معاينة الجولة',
        highlights: 'النقاط المميزة',
        contactAgent: 'تواصل مع الوكيل',
        bed: 'غرفة نوم',
        bath: 'حمام',
        sqm: 'متر مربع',
        views: 'مشاهدة',
        
        // Room types Arabic
        livingRoom: 'غرفة المعيشة',
        kitchen: 'المطبخ',
        masterBedroom: 'غرفة النوم الرئيسية',
        guestBedroom: 'غرفة نوم الضيوف',
        bathroom: 'الحمام',
        bathrooms: 'دورات المياه',
        garden: 'الحديقة',
        openLivingSpace: 'مساحة معيشة مفتوحة',
        masterSuite: 'جناح رئيسي',
        bedrooms: 'غرف النوم',
        poolArea: 'منطقة المسبح',
        terrace: 'التراس',
        
        // Highlights Arabic
        cityViews: 'إطلالة على المدينة',
        modernKitchen: 'مطبخ عصري',
        spaciousRooms: 'غرف واسعة',
        privateGarden: 'حديقة خاصة',
        familyFriendly: 'مناسب للعائلات',
        parkingSpace: 'مكان للوقوف',
        buildingAmenities: 'مرافق المبنى',
        security: 'الأمن',
        modernDesign: 'تصميم عصري',
        multiLevelLiving: 'معيشة متعددة المستويات',
        privateEntrance: 'مدخل خاص',
        communityFeatures: 'مرافق المجتمع',
        efficientLayout: 'تصميم فعال',
        primeLocation: 'موقع متميز',
        swimmingPool: 'مسبح',
        luxuryFeatures: 'ميزات فاخرة',
        rooftopTerrace: 'تراس علوي',
        panoramicViews: 'إطلالة بانورامية',
        luxuryFinishes: 'لمسات فاخرة',
        modernFeatures: 'ميزات عصرية',
        greatLocation: 'موقع ممتاز',
        wellMaintained: 'مصان جيداً',
      },

      // App
      app: {
        name: 'VirtualEstate',
        tagline: 'بوابتك إلى العقارات المصرية',
        version: 'الإصدار',
      },

      // Navigation
      nav: {
        home: 'الرئيسية',
        properties: 'العقارات',
        virtualTours: 'الجولات الافتراضية',
        auctions: 'المزادات',
        about: 'عن الموقع',
        contact: 'تواصل معنا',
        profile: 'الملف الشخصي',
        signIn: 'تسجيل الدخول',
        signOut: 'تسجيل الخروج',
        admin: 'إدارة',
        settings: 'الإعدادات',
        notifications: 'الإشعارات',
        saved: 'المحفوظات',
        appraisers: 'البحث عن المثمنين',
        rentals: 'الإيجارات',
      },

      // Virtual Tours
      virtualTours: {
        pageDescription: 'استكشف العقارات من أي مكان في العالم مع جولاتنا الافتراضية ثلاثية الأبعاد.',
        fullDescription: 'استكشف العقارات من أي مكان في العالم مع جولاتنا الافتراضية ثلاثية الأبعاد. اختبر كل غرفة وكل تفصيل كما لو كنت هناك.',
        toursAvailable: 'جولة افتراضية متاحة',
        noToursFound: 'لم يتم العثور على جولات افتراضية',
        tryAdjustingFilters: 'جرب تعديل المرشحات أو تحقق مرة أخرى لاحقاً للحصول على جولات جديدة.',
        roomsToExplore: 'الغرف للاستكشاف',
        startFullTour: 'ابدأ الجولة الكاملة',
        startVirtualTour: 'ابدأ الجولة الافتراضية',
        viewProperty: 'عرض العقار',
        duration: 'المدة',
        minutes: 'دقائق',
        ctaTitle: 'مستعد للعثور على منزل أحلامك؟',
        ctaDescription: 'تصفح مجموعة العقارات الكاملة واحجز جولات افتراضية مع مساعدة الذكي الاصطناعي.',
      },

      // المزادات
      auction: {
        pageTitle: 'مزادات العقارات',
        pageDescription: 'اكتشف العقارات الحصرية من خلال منصة المزادات المباشرة. زايد في الوقت الفعلي مع الجولات الافتراضية.',
        totalAuctions: 'إجمالي المزادات',
        liveAuctions: 'المزادات المباشرة',
        endedAuctions: 'المزادات المنتهية',
        preview: 'معاينة',
        live: 'مباشر',
        ended: 'منتهي',
        sold: 'مبيع',
        cancelled: 'ملغي',
        liveNow: 'مباشر الآن',
        currentBid: 'المزايدة الحالية',
        reservePrice: 'السعر الاحتياطي',
        buyNowPrice: 'سعر الشراء الفوري',
        noBids: 'لا توجد مزايدات',
        bidCount: 'مزايدة',
        timeRemaining: 'الوقت المتبقي',
        startingSoon: 'يبدأ قريباً',
        virtualTour: 'جولة ثلاثية الأبعاد',
        reserveMet: 'تم الوصول للسعر الاحتياطي',
        reserveNotMet: 'لم يتم الوصول للسعر الاحتياطي',
        placeBid: 'ضع مزايدة',
        buyNow: 'اشتر الآن',
        viewDetails: 'عرض التفاصيل',
        howItWorks: 'كيف تعمل مزادات العقارات',
        step1Title: 'معاينة لمدة 7 أيام',
        step1Description: 'استكشف العقارات مع الجولات الافتراضية واستعد للمزاد. خيار الشراء الفوري متاح.',
        step2Title: 'المزاد المباشر',
        step2Description: 'تنافس في الوقت الفعلي خلال المزاد المباشر لمدة ساعة واحدة أثناء مشاهدة الجولة الافتراضية.',
        step3Title: 'الفوز والشراء',
        step3Description: 'الفائزون في المزايدة يحصلون على العقار، مع مشاركة الفائض بين المنصة والمطورين.',
        ctaTitle: 'مستعد لبدء المزايدة؟',
        ctaDescription: 'انضم إلى آلاف المشترين المتنافسين على العقارات الحصرية في مزاداتنا المباشرة.',
        allTypes: 'جميع الأنواع',
        house: 'منزل',
        apartment: 'شقة',
        condo: 'كوندو',
        townhouse: 'تاون هاوس',
        land: 'أرض',
        selectPropertyType: 'اختر النوع',
        sortBy: 'ترتيب حسب',
        filters: 'المرشحات',
        advancedFilters: 'المرشحات المتقدمة',
        loadMore: 'تحميل المزيد',
        noAuctions: 'لم يتم العثور على مزادات',
        tryAdjustingFilters: 'جرب تعديل المرشحات أو تحقق مرة أخرى لاحقاً للحصول على مزادات جديدة.',
      },

      // Search filters
      search: {
        allPropertyTypes: 'جميع أنواع العقارات',
        apartments: 'شقق',
        houses: 'منازل',
        villas: 'فيلات',
        penthouses: 'بنتهاوس',
        studios: 'استوديو',
        condos: 'شقق سكنية',
        townhouses: 'منازل مدرجة',
        mostPopular: 'الأكثر شعبية',
        highestRated: 'الأعلى تقييماً',
        shortestFirst: 'الأقصر أولاً',
        priceLowToHigh: 'السعر: من المنخفض إلى المرتفع',
        priceHighToLow: 'السعر: من المرتفع إلى المنخفض',
        newestFirst: 'الأحدث أولاً',
        
        // Advanced search specific
        compound: 'المجمع',
        advancedPropertySearch: 'البحث المتقدم عن العقارات',
        activeFilters: '{{count}} مرشحات نشطة',
        findPerfectProperty: 'اعثر على عقارك المثالي',
        clearAll: 'مسح الكل',
        searchKeywords: 'كلمات البحث',
        searchPlaceholder: 'الموقع، نوع العقار، المميزات...',
        budgetFinancing: 'الميزانية والتمويل',
        popular: 'شائع',
        totalPriceRange: 'نطاق السعر الإجمالي',
        apartment: 'شقة',
        villa: 'فيلا',
        penthouse: 'بنتهاوس',
        townhouse: 'تاون هاوس',
        condominium: 'شقة سكنية',
        swimmingPool: 'حمام سباحة',
        garden: 'حديقة',
        security247: 'أمن على مدار الساعة',
        parking: 'مواقف',
        gymFitness: 'نادي رياضي',
        playground: 'ملعب',
        communityCenter: 'مركز مجتمعي',
        balcony: 'شرفة',
        terrace: 'تراس',
        maidRoom: 'غرفة خادمة',
        storageRoom: 'غرفة تخزين',
        laundryRoom: 'غرفة غسيل',
        studyRoom: 'غرفة دراسة',
        walkInCloset: 'خزانة ملابس كبيرة',
        builtInWardrobes: 'خزائن مدمجة',
        centralAC: 'تكييف مركزي',
        floorHeating: 'تدفئة أرضية',
        smartHome: 'منزل ذكي',
        solarPanels: 'ألواح شمسية',
        searchProperties: 'بحث العقارات',
        
        // Additional search fields Arabic
        downPaymentRange: 'نطاق المقدم',
        monthlyInstallment: 'القسط الشهري',
        paymentPlanOptions: 'خيارات خطة الدفع',
        propertyBasics: 'أساسيات العقار',
        propertyTypes: 'أنواع العقارات',
        bedrooms: 'غرف النوم',
        bathrooms: 'الحمامات',
        squareFeet: 'المساحة بالقدم المربع',
        locationProximity: 'الموقع والقرب',
        preferredCities: 'المدن المفضلة',
        maximumDistanceTo: 'الحد الأقصى للمسافة إلى',
        amenitiesFeatures: 'المرافق والميزات',
        communityAmenities: 'مرافق المجتمع',
        propertyFeatures: 'مميزات العقار',
        additionalOptions: 'خيارات إضافية',
        compoundDevelopment: 'المجمع/التطوير',
        sortResults: 'ترتيب النتائج',
        sortOrder: 'ترتيب الفرز',
        cashPayment: 'دفع نقدي',
        installments: 'أقساط',
        mortgage: 'رهن عقاري',
        rentToOwn: 'إيجار للتملك',
        anyDistance: 'أي مسافة',
        compoundPlaceholder: 'مثل: بالم هيلز، ميفيدا، كتامية هايتس...',
        sortByPlaceholder: 'ترتيب حسب...',
        orderPlaceholder: 'الترتيب...',
        resetAll: 'إعادة تعيين الكل',
        noFiltersApplied: 'لا توجد مرشحات مطبقة',
        useAdvancedFilters: 'استخدم المرشحات المتقدمة للعثور على عقارك المثالي',
      },

      // Authentication
      auth: {
        // Common auth terms
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        fullName: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        signIn: 'تسجيل الدخول',
        signUp: 'إنشاء حساب',
        signOut: 'تسجيل الخروج',
        login: 'دخول',
        register: 'تسجيل',
        createAccount: 'إنشاء حساب',
        forgotPassword: 'نسيت كلمة المرور؟',
        rememberMe: 'تذكرني',
        
        // Placeholders
        emailPlaceholder: 'أدخل بريدك الإلكتروني',
        passwordPlaceholder: 'أدخل كلمة المرور',
        confirmPasswordPlaceholder: 'أكد كلمة المرور',
        fullNamePlaceholder: 'أدخل اسمك الكامل',
        phonePlaceholder: 'أدخل رقم هاتفك',
        
        // Welcome messages
        welcomeBack: 'مرحباً بعودتك! سجل دخولك إلى حسابك',
        joinCommunity: 'انضم لآلاف الباحثين عن العقارات',
        
        // Loading states
        signingIn: 'جاري تسجيل الدخول...',
        creatingAccount: 'جاري إنشاء الحساب...',
        sending: 'جاري الإرسال...',
        
        // Error messages
        error: 'خطأ في المصادقة',
        loginFailed: 'فشل في تسجيل الدخول',
        registrationFailed: 'فشل في التسجيل',
        socialLoginFailed: 'فشل في تسجيل الدخول الاجتماعي',
        unknownError: 'حدث خطأ غير متوقع',
        fillAllFields: 'يرجى ملء جميع الحقول المطلوبة',
        
        // Password requirements
        passwordRequirements: {
          minLength: 'على الأقل 8 أحرف',
          hasNumber: 'يحتوي على رقم',
          hasSpecial: 'يحتوي على رمز خاص',
          hasUpper: 'يحتوي على حرف كبير',
          hasLower: 'يحتوي على حرف صغير',
        },
        
        // Validation messages
        validation: {
          fullNameRequired: 'الاسم الكامل مطلوب',
          emailRequired: 'البريد الإلكتروني مطلوب',
          emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح',
          phoneInvalid: 'يرجى إدخال رقم هاتف صحيح',
          passwordRequired: 'كلمة المرور مطلوبة',
          passwordWeak: 'كلمة المرور لا تلبي المتطلبات',
          passwordMismatch: 'كلمات المرور غير متطابقة',
          termsRequired: 'يجب الموافقة على الشروط والأحكام',
        },
        
        // Terms and conditions
        agreeToTerms: 'أوافق على',
        termsOfService: 'شروط الخدمة',
        and: ' و ',
        privacyPolicy: 'سياسة الخصوصية',
        
        // Account status
        noAccount: 'ليس لديك حساب؟',
        haveAccount: 'لديك حساب بالفعل؟',
        
        // Social login
        orContinueWith: 'أو تابع باستخدام',
        orRegisterWith: 'أو سجل باستخدام',
        redirecting: 'جاري التوجيه...',
        
        // Password reset
        resetEmailSent: 'تم إرسال بريد إعادة التعيين',
        resetEmailSentMessage: 'تحقق من بريدك الإلكتروني للحصول على تعليمات إعادة تعيين كلمة المرور',
        forgotPasswordMessage: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور',
        sendResetLink: 'إرسال رابط إعادة التعيين',
        backToLogin: 'العودة لتسجيل الدخول',
        rememberPassword: 'تتذكر كلمة مرورك؟',
        
        // Authentication
        confirmSignOut: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
        pleaseSignIn: 'يرجى تسجيل الدخول لعرض ملفك الشخصي',
      },

      // Properties
      properties: {
        title: 'العقارات',
        search: 'البحث عن عقارات...',
        filters: 'التصفية',
        sortBy: 'ترتيب حسب',
        noResults: 'لم يتم العثور على عقارات',
        loadMore: 'تحميل المزيد',
        topCompounds: 'أفضل المجمعات السكنية',
        topCompoundsDesc: 'اكتشف أكثر المجتمعات السكنية المرغوبة في مصر',
        hottestListings: 'أحدث العقارات المطلوبة هذا الأسبوع',
        hottestListingsDesc: 'العقارات ذات أعلى اهتمام ونمو في الأسعار',
        featuredProperties: 'استكشف عقاراتنا المميزة',
        featuredPropertiesDesc: 'اختبر جولات افتراضية غامرة مع مساعدة ذكية مدعومة بالذكاء الاصطناعي. احصل على إجابات فورية حول العقارات أثناء الاستكشاف ثلاثي الأبعاد.',
        
        // Property Valuation Section
        propertyValuation: {
          title: 'اعرف القيمة',
          titleHighlight: 'الحقيقية لعقارك',
          description: 'احصل على تقييم عقاري مهني من خبراء معتمدين. اتخذ قرارات واثقة بناءً على بيانات السوق الدقيقة.',
          professionalAssessment: 'تقييم مهني',
          certifiedAppraisalReport: 'تقرير عقاري معتمد',
          whyGetValuation: 'لماذا تحصل على تقييم مهني؟',
          sellingProperty: 'بيع عقارك',
          sellingPropertyDesc: 'سعّر عقارك بالشكل الصحيح لجذب مشترين جديين',
          buyingProperty: 'شراء عقار',
          buyingPropertyDesc: 'تأكد من أنك تدفع القيمة العادلة للسوق',
          refinancing: 'إعادة التمويل',
          refinancingDesc: 'احصل على قيمة دقيقة لطلبات القروض',
          insuranceClaims: 'مطالبات التأمين',
          insuranceClaimsDesc: 'توثيق قيمة العقار للتغطية التأمينية',
          findCertifiedAppraiser: 'ابحث عن مثمن معتمد',
          turnaround48Hours: 'إنجاز خلال 48 ساعة',
          turnaroundDesc: 'تقارير مهنية سريعة',
          licensedProfessionals: 'محترفون مرخصون',
          licensedDesc: 'مثمنو عقارات معتمدون',
          detailedReports: 'تقارير مفصلة',
          detailedDesc: 'تحليل شامل للسوق',
        },
        
        // Property types
        apartment: 'شقة',
        villa: 'فيلا',
        house: 'منزل',
        studio: 'استوديو',
        penthouse: 'بنتهاوس',
        townhouse: 'تاون هاوس',
        duplex: 'دوبلكس',
        
        // Property status
        forSale: 'للبيع',
        forRent: 'للإيجار',
        sold: 'مُباع',
        rented: 'مُؤجر',
        
        // Features
        bedrooms: 'غرف النوم',
        bathrooms: 'دورات المياه',
        area: 'المساحة',
        price: 'السعر',
        location: 'الموقع',
        
        // Details
        description: 'الوصف',
        features: 'المميزات',
        amenities: 'الخدمات',
        contact: 'التواصل',
        
        // Actions
        viewDetails: 'عرض التفاصيل',
        bookViewing: 'حجز معاينة',
        contactAgent: 'التواصل مع الوكيل',
        saveProperty: 'حفظ العقار',
        shareProperty: 'مشاركة العقار',
        scheduleTour: 'حجز جولة',
        viewProperties: 'عرض العقارات',
      },

      // Search & Filters
      searchFilters: {
        priceRange: 'نطاق السعر',
        minPrice: 'أقل سعر',
        maxPrice: 'أعلى سعر',
        propertyType: 'نوع العقار',
        bedrooms: 'غرف النوم',
        bathrooms: 'دورات المياه',
        area: 'المساحة',
        location: 'الموقع',
        clearFilters: 'مسح الفلاتر',
        applyFilters: 'تطبيق الفلاتر',
        sortBy: 'ترتيب حسب',
        newest: 'الأحدث',
        oldest: 'الأقدم',
        priceLowToHigh: 'السعر: من الأقل للأعلى',
        priceHighToLow: 'السعر: من الأعلى للأقل',
        areaSmallToLarge: 'المساحة: من الأصغر للأكبر',
        areaLargeToSmall: 'المساحة: من الأكبر للأصغر',
      },

      // Cities (Egyptian cities)
      cities: {
        cairo: 'القاهرة',
        giza: 'الجيزة',
        alexandria: 'الإسكندرية',
        newCairo: 'القاهرة الجديدة',
        sheikhZayed: 'الشيخ زايد',
        maadi: 'المعادي',
        zamalek: 'الزمالك',
        heliopolis: 'مصر الجديدة',
        nasr: 'مدينة نصر',
        shorouk: 'الشروق',
        rehab: 'الرحاب',
        october: 'السادس من أكتوبر',
        newCapital: 'العاصمة الإدارية الجديدة',
        fifthSettlement: 'التجمع الخامس',
        katameya: 'القطامية',
      },

      // Currency
      currency: {
        egp: 'ج.م',
        egpFull: 'الجنيه المصري',
        million: 'مليون',
        thousand: 'ألف',
        priceRange: 'نطاق السعر',
        from: 'من',
        to: 'إلى',
      },

      // Contact & Communication
      contact: {
        callAgent: 'اتصال بالوكيل',
        emailAgent: 'بريد إلكتروني للوكيل',
        whatsapp: 'واتساب',
        schedule: 'جدولة معاينة',
        inquiry: 'إرسال استفسار',
        message: 'رسالة',
        phone: 'هاتف',
        email: 'بريد إلكتروني',
        sendMessage: 'إرسال رسالة',
        messageTitle: 'استفسار عن العقار',
        messagePlaceholder: 'مرحباً، أنا مهتم بهذا العقار...',
        selectTime: 'اختيار الوقت',
        selectDate: 'اختيار التاريخ',
        viewingScheduled: 'تم جدولة المعاينة بنجاح',
        inquirySent: 'تم إرسال الاستفسار بنجاح',
      },

      // Media
      media: {
        photos: 'الصور',
        video: 'فيديو',
        virtualTour: 'جولة افتراضية 360°',
        floorPlan: 'مخطط الطوابق',
        gallery: 'معرض الصور',
      },

      // Property Details
      propertyDetails: {
        overview: 'نظرة عامة',
        details: 'التفاصيل',
        features: 'المميزات',
        amenities: 'الخدمات',
        location: 'الموقع',
        similarProperties: 'عقارات مماثلة',
        propertyId: 'رقم العقار',
        yearBuilt: 'سنة البناء',
        parkingSpaces: 'أماكن الوقوف',
        furnished: 'مفروش',
        unfurnished: 'غير مفروش',
        semifurnished: 'مفروش جزئياً',
        utilities: 'المرافق',
        maintenance: 'الصيانة',
        security: 'الأمن',
        garden: 'حديقة',
        balcony: 'شرفة',
        terrace: 'تراس',
        pool: 'حمام سباحة',
        gym: 'صالة رياضية',
        elevator: 'مصعد',
        centralAc: 'تكييف مركزي',
        heating: 'تدفئة',
        internetWifi: 'إنترنت/واي فاي',
        
        // Property page specific
        backToProperties: 'العودة للعقارات',
        share: 'مشاركة',
        aboutThisProperty: 'حول هذا العقار',
        keyHighlights: 'المميزات الرئيسية',
        propertyType: 'نوع العقار',
        bedrooms: 'غرف النوم',
        bathrooms: 'دورات المياه',
        condition: 'الحالة',
        lotSize: 'مساحة الأرض',
        floor: 'الطابق',
        balconies: 'الشرفات',
        availableDate: 'تاريخ الإتاحة',
        financialInformation: 'المعلومات المالية',
        monthlyHOA: 'رسوم الصيانة الشهرية',
        annualPropertyTax: 'ضريبة العقار السنوية',
        annualInsurance: 'التأمين السنوي',
        premiumAmenities: 'المرافق المميزة',
        swimmingPool: 'حمام السباحة',
        security247: 'أمن 24/7',
        fitnessCenter: 'مركز لياقة بدنية',
        elevatorAccess: 'مصعد',
        storageSpace: 'مساحة تخزين',
        maidsRoom: 'غرفة خادمة',
        driversRoom: 'غرفة سائق',
        nearbyServices: 'الخدمات القريبة',
        locationInfrastructure: 'الموقع والبنية التحتية',
        distanceToKeyLocations: 'المسافة للمواقع الرئيسية',
        metroStation: 'محطة المترو',
        airport: 'المطار',
        shoppingMall: 'مركز التسوق',
        hospital: 'المستشفى',
        infrastructure: 'البنية التحتية',
        cooling: 'التبريد',
        waterSource: 'مصدر المياه',
        internet: 'الإنترنت',
        policies: 'السياسات',
        petPolicy: 'سياسة الحيوانات الأليفة',
        scheduleShowing: 'جدولة معاينة',
        sendMessage: 'إرسال رسالة',
        licensedRealEstateBroker: 'وسيط عقاري مرخص',
        experience: 'الخبرة',
        years: 'سنوات',
        specialties: 'التخصصات',
        languages: 'اللغات',
        primary: 'رئيسي',
        additionalBrokers: 'وسطاء إضافيون',
        moreBrokersAvailable: 'وسطاء إضافيون متاحون',
        noBrokersAssigned: 'لم يتم تعيين وسطاء',
        contactUsForAssistance: 'اتصل بنا للمساعدة',
        tourProgress: 'تقدم الجولة',
        currentRoom: 'الغرفة الحالية',
        timeInRoom: 'الوقت في الغرفة',
        roomsVisited: 'الغرف المزارة',
        askAIAssistant: 'اسأل المساعد الذكي',
        getInstantAnswers: 'احصل على إجابات فورية حول هذا العقار',
        virtualTour: 'الجولة الافتراضية',
        exploreEveryRoom: 'استكشف كل غرفة بتقنية ثلاثية الأبعاد',
        current: 'الحالي',
        clickToExpand: 'انقر للتوسيع',
        virtualTour3D: 'جولة افتراضية ثلاثية الأبعاد',
        viewInFullscreen: 'عرض بملء الشاشة',
        bookingConfirmed: 'تم تأكيد الحجز! 🎉',
        viewingScheduled: 'تم جدولة معاينتك في',
        checkEmailForDetails: 'تحقق من بريدك الإلكتروني للتفاصيل.',
        confirmationCode: 'رمز التأكيد:',
        saveCodeForRecords: 'احفظ هذا الرمز لسجلاتك. يمكنك استخدامه لإدارة حجزك.',
        bookingFailed: 'فشل الحجز',
        bookingError: 'خطأ في الحجز',
        missingBookingInfo: 'معلومات الحجز مفقودة. يرجى المحاولة مرة أخرى.',
        somethingWentWrong: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
        linkCopiedToClipboard: 'تم نسخ الرابط للحافظة!',
        parking: 'مواقف',
        reviews: 'تقييمات',
        more: 'المزيد',
        km: 'كم',
        sqm: 'م²',
        
        // Appraiser & Professional Services Arabic
        professionalAppraiser: 'مثمن محترف',
        licensedPropertyAppraiser: 'مثمن عقارات مرخص',
        bookAppraisal: 'احجز تقييم',
        propertyManager: 'مدير العقار',
        noAppraiserAssigned: 'لا يوجد مثمن مخصص لهذا العقار',
        contactForAppraisal: 'اتصل بنا للحصول على خدمات التقييم المهنية',
        noDescriptionAvailable: 'لا يوجد وصف متاح.',
        
        // Virtual Tours Arabic
        virtualTours: 'الجولات الافتراضية',
        'threeDVirtualTour': 'جولة افتراضية ثلاثية الأبعاد',
        videoTour: 'جولة فيديو',
        virtualTourTitle: 'تجربة الجولة الافتراضية',
        
        // Property Content Arabic
        aboutThisPlace: 'حول هذا المكان',
        propertyHighlights: 'مميزات العقار',
        builtIn: 'تم البناء في',
        modernConstruction: 'بناء حديث',
        fullyFurnished: 'مفروش بالكامل',
        moveInReady: 'جاهز للسكن',
        floorLevel: 'الطابق',
        outdoorSpace: 'مساحة خارجية',
        secureParking: 'مواقف آمنة متضمنة',
        petFriendly: 'مناسب للحيوانات الأليفة',
        petsWelcome: 'الحيوانات الأليفة مرحب بها',
        
        exclusiveSpaAccess: 'دخول حصري للسبا مع مرافق عافية فاخرة',
        professionalSecurity: 'أمن محترف - حراسة المبنى 24/7 لراحة البال',
        spaciousLayout: 'تصميم واسع، سخي لوسط البلد',
        contemporaryDesign: 'تصميم معاصر مع لمسات حديثة أنيقة',
        na: 'غير محدد',
        of: 'من',
        propertyNotFound: 'العقار غير موجود',
        failedToLoadProperty: 'فشل في تحميل العقار',
        
        // Property conditions
        excellent: 'ممتاز',
        veryGood: 'جيد جداً',
        good: 'جيد',
        fair: 'مقبول',
        poor: 'ضعيف',
        
        // Pet policies
        allowed: 'مسموح',
        depositRequired: 'يتطلب وديعة',
        notAllowed: 'غير مسموح',
        
        // Commute Analysis
        commuteAnalysis: 'تحليل التنقل وتوافق نمط الحياة',
        commuteDescription: 'أضف وجهاتك اليومية لمعرفة أوقات التنقل والتكاليف والحصول على نقاط توافق نمط الحياة لهذا الموقع.',
      },

      // Favorites
      favorites: {
        title: 'المفضلة',
        addToFavorites: 'إضافة للمفضلة',
        removeFromFavorites: 'إزالة من المفضلة',
        noFavorites: 'لا توجد عقارات مفضلة بعد',
        favoriteAdded: 'تمت الإضافة للمفضلة',
        favoriteRemoved: 'تمت الإزالة من المفضلة',
        confirmRemove: 'هل أنت متأكد أنك تريد إزالة هذا العقار من المفضلة؟',
        browseProperties: 'تصفح العقارات',
      },

      // Rentals
      rentals: {
        title: 'الإيجارات',
        pageTitle: 'إيجار العقارات',
        monthlyRate: 'السعر الشهري',
        yearlyRate: 'السعر السنوي',
        nightlyRate: 'السعر الليلي',
        minimumStay: 'الحد الأدنى للإقامة',
        checkIn: 'تسجيل الوصول',
        checkOut: 'تسجيل المغادرة',
        cleaningFee: 'رسوم التنظيف',
        securityDeposit: 'التأمين',
        extraGuestFee: 'رسوم الضيف الإضافي',
        perGuest: 'لكل ضيف',
        nights: 'ليالي',
        perNight: 'لكل ليلة',
        checkAvailability: 'فحص التوفر',
        requestToBook: 'طلب حجز',
        bookNow: 'احجز الآن',
        instantBook: 'حجز فوري',
        share: 'مشاركة',
        virtualTour: 'جولة افتراضية',
        amenities: 'المرافق',
        location: 'الموقع',
        infrastructure: 'البنية التحتية',
        guestExperienceHighlights: 'أبرز تجربة الضيوف',
        propertyHighlights: 'أبرز ميزات العقار',
        aboutThisPlace: 'حول هذا المكان',
        propertyManager: 'مدير العقار',
        distanceToKeyLocations: 'المسافة إلى المواقع الرئيسية',
        metroStation: 'محطة المترو',
        airport: 'المطار',
        shoppingMall: 'مول التسوق',
        hospital: 'المستشفى',
        locationInformation: 'معلومات الموقع',
        city: 'المدينة',
        propertyType: 'نوع العقار',
        compound: 'الكمبوند',
        heating: 'التدفئة',
        cooling: 'التبريد',
        waterSource: 'مصدر المياه',
        internet: 'الإنترنت',
        bedrooms: 'غرف النوم',
        bathrooms: 'دورات المياه',
        guests: 'الضيوف',
        upTo: 'حتى',
        noDescriptionAvailable: 'لا يوجد وصف متاح',
        builtIn: 'بني في',
        modernConstruction: 'بناء حديث',
        fullyFurnished: 'مفروش بالكامل',
        moveInReady: 'جاهز للانتقال',
        floorLevel: 'الطابق',
        outdoorSpace: 'مساحة خارجية',
        secureParking: 'موقف آمن مدرج',
        parkingSpaces: 'أماكن الوقوف',
        secureIncluded: 'موقف آمن مدرج',
        balcony: 'شرفة',
        balconies: 'شرفات',
        petFriendly: 'مناسب للحيوانات الأليفة',
        petsWelcome: 'الحيوانات الأليفة مرحب بها',
        call: 'اتصال',
        email: 'بريد إلكتروني',
        license: 'الرخصة',
        viewOnGoogleMaps: 'عرض على خرائط جوجل',
        reviews: 'التقييمات',
        bookingComplete: 'تم إكمال الحجز بنجاح!',
        
        // Additional amenities
        hasWifi: 'واي فاي',
        hasAc: 'تكييف الهواء',
        hasKitchen: 'مطبخ',
        hasParking: 'موقف سيارات',
        hasSwimmingPool: 'مسبح',
        hasGym: 'صالة رياضية',
        hasElevator: 'مصعد',
        hasSeaView: 'إطلالة بحرية',
        hasNileView: 'إطلالة نيلية',
        hasBalcony: 'شرفة',
        
        // Guest experience
        brandNewBuilding: 'مبنى جديد تماماً',
        modernInfrastructure: 'مع بنية تحتية حديثة',
        moveInReadyNoHassle: 'جاهز للانتقال، بدون متاعب',
        stunningViews: 'إطلالات خلابة على المدينة من نوافذك',
        rentalNotFound: 'الإيجار غير موجود',
        backToRentals: 'العودة إلى الإيجارات',
        verifiedProperty: 'عقار موثق',
        securePayment: 'دفع آمن',
        support247: 'دعم 24/7',
        exclusiveSpaAccess: 'وصول حصري للسبا مع مرافق عافية فاخرة',
        professionalSecurity: 'أمان محترف - حراسة مبنى 24/7 لراحة البال',
        spaciousLayout: 'تصميم واسع',
        generousForDowntown: 'سخي للمنطقة المركزية',
        contemporaryDesign: 'تصميم معاصر مع لمسات عصرية أنيقة',
        primeLocation: 'موقع متميز في وسط القاهرة',
        locationAndInfrastructure: 'الموقع والبنية التحتية',
        notSpecified: 'غير محدد',
        highSpeedFiberInternet: 'إنترنت عالي السرعة بالألياف البصرية',
        smartHomeAutomation: 'أتمتة المنزل الذكي',
        premiumBedding: 'أغطية سرير فاخرة',
        
        // Booking Flow
        bookYourStay: 'احجز إقامتك',
        guestInformation: 'معلومات الضيوف',
        numberOfGuests: 'عدد الضيوف',
        paymentConfirmation: 'الدفع والتأكيد',
        bookingSummary: 'ملخص الحجز',
        guests: 'الضيوف',
        availablePaymentMethods: 'طرق الدفع المتاحة',
        bookingConfirmed: 'تم تأكيد الحجز',
        confirmPay: 'تأكيد والدفع',
        
        // Guest Experience Properties Arabic
        brandNewBuilding: 'مبنى جديد تماماً',
        modernInfrastructure: 'مع بنية تحتية حديثة',
        moveInReadyNoHassle: 'جاهز للانتقال، بدون متاعب',
        stunningViews: 'إطلالات خلابة على المدينة من نوافذك',
        primeLocation: 'موقع متميز في وسط القاهرة',
        exclusiveSpaAccess: 'وصول حصري للسبا مع مرافق عافية فاخرة',
        professionalSecurity: 'أمان محترف - حراسة مبنى 24/7 لراحة البال',
        spaciousLayout: 'تصميم واسع',
        generousForDowntown: 'سخي للمنطقة المركزية',
        contemporaryDesign: 'تصميم معاصر مع لمسات عصرية أنيقة',
        locationAndInfrastructure: 'الموقع والبنية التحتية',
        notSpecified: 'غير محدد',
        highSpeedFiberInternet: 'إنترنت عالي السرعة بالألياف البصرية',
        smartHomeAutomation: 'أتمتة المنزل الذكي',
        premiumBedding: 'أغطية سرير فاخرة',
      },

      // Amenities
      amenities: {
        wifi: 'واي فاي',
        airConditioning: 'تكييف الهواء',
        heating: 'تدفئة',
        kitchen: 'مطبخ',
        tv: 'تلفزيون',
        washingMachine: 'غسالة',
        parking: 'موقف سيارات',
        swimmingPool: 'مسبح',
        gym: 'صالة رياضية',
        securityGuard: 'حارس أمن',
        elevator: 'مصعد',
        balcony: 'شرفة',
        seaView: 'إطلالة بحرية',
        nileView: 'إطلالة نيلية',
        cityView: 'إطلالة على المدينة',
        cctvSecurity: 'أمان كاميرات مراقبة',
        conciergeService: 'خدمة الكونسيرج',
        valetParking: 'خدمة صف السيارات',
        spa: 'سبا',
        beachAccess: 'وصول للشاطئ',
        safe: 'خزنة',
        satelliteTV: 'قنوات فضائية',
      },

      // Agent Profile
      agent: {
        profile: 'ملف الوكيل',
        experience: 'سنوات الخبرة',
        listings: 'الإعلانات النشطة',
        reviews: 'التقييمات',
        rating: 'التقييم',
        languages: 'اللغات المتحدثة',
        specialties: 'التخصصات',
        contactAgent: 'التواصل مع الوكيل',
        viewAllListings: 'عرض جميع الإعلانات',
        aboutAgent: 'عن الوكيل',
        verifiedAgent: 'وكيل موثق',
        topAgent: 'وكيل متميز',
      },

      // Errors
      errors: {
        networkError: 'خطأ في الاتصال بالشبكة',
        serverError: 'خطأ في الخادم، يرجى المحاولة مرة أخرى',
        notFound: 'المورد غير موجود',
        unauthorized: 'وصول غير مصرح',
        validationError: 'خطأ في التحقق',
        unknownError: 'حدث خطأ غير معروف',
      },

      // Language switcher
      language: {
        switch: 'تغيير اللغة',
        english: 'English',
        arabic: 'العربية',
      },

      // Mortgage Calculator
      mortgageCalculator: {
        title: 'حاسبة التمويل العقاري',
        subtitle: 'احسب قسطك الشهري مع البنوك المصرية',
        loanCalculator: 'حاسبة القرض',
        affordabilityCalculator: 'حاسبة القدرة',
        
        // Form fields
        propertyPrice: 'سعر العقار (جنيه مصري)',
        downPaymentPercent: 'نسبة المقدم (%)',
        loanTerm: 'مدة القرض (سنة)',
        selectBank: 'اختر البنك',
        monthlyIncome: 'الدخل الشهري (جنيه مصري)',
        
        // Placeholders
        propertyPricePlaceholder: 'مثال: 2000000',
        downPaymentPlaceholder: '20',
        loanTermPlaceholder: '25',
        monthlyIncomePlaceholder: 'مثال: 25000',
        
        // Results
        resultsTitle: 'نتائج الحساب',
        monthlyPayment: 'القسط الشهري',
        downPaymentRequired: 'المقدم المطلوب',
        loanAmount: 'مبلغ القرض',
        totalInterest: 'إجمالي الفوائد',
        totalAmount: 'إجمالي المبلغ',
        
        // Bank details
        interestRate: 'معدل الفائدة',
        maxLoanAmount: 'الحد الأقصى',
        minDownPayment: 'أقل مقدم',
        selectedBankDetails: 'تفاصيل البنك المختار',
        bankName: 'البنك',
        termYears: 'مدة القرض',
        
        // Actions
        calculatePayment: 'احسب القسط الشهري',
        calculateAffordability: 'احسب القدرة على التحمل',
        paymentSchedule: 'جدول السداد',
        shareCalculation: 'مشاركة',
        saveCalculation: 'حفظ',
        savedCalculations: 'الحسابات المحفوظة',
        
        // Payment schedule modal
        paymentScheduleTitle: 'جدول السداد (أول 5 سنوات)',
        scheduleMonth: 'شهر',
        schedulePayment: 'قسط',
        schedulePrincipal: 'أصل',
        scheduleInterest: 'فوائد',
        scheduleBalance: 'رصيد',
        
        // Affordability section
        affordabilityTitle: 'حاسبة القدرة على التحمل',
        affordabilitySubtitle: 'اعرف كم تستطيع تحمل تكلفته',
        affordabilityTips: 'نصائح لحساب القدرة على التحمل',
        tip1: '• يُنصح أن لا يتجاوز القسط الشهري 33% من الدخل الشهري',
        tip2: '• احسب جميع التزاماتك المالية الشهرية الأخرى',
        tip3: '• احتفظ بمبلغ للطوارئ لا يقل عن 6 أشهر من الراتب',
        tip4: '• ضع في الاعتبار تكاليف الصيانة والتأمين',
        tip5: '• فكر في الاستثمارات المستقبلية والادخار',
        
        // Egyptian banks
        nationalBankEgypt: 'البنك الأهلي المصري',
        cib: 'البنك التجاري الدولي',
        qnbAlAhli: 'بنك قطر الوطني الأهلي',
        aaib: 'البنك العربي الأفريقي',
        banqueMisr: 'بنك مصر',
        
        // Bank features
        bankFeature1: 'أول بنك في مصر',
        bankFeature2: 'شروط ميسرة',
        bankFeature3: 'خدمة عملاء ممتازة',
        bankFeature4: 'أسعار فائدة تنافسية',
        bankFeature5: 'إجراءات سريعة',
        bankFeature6: 'تمويل يصل إلى 85%',
        bankFeature7: 'رسوم إدارية منخفضة',
        bankFeature8: 'مرونة في السداد',
        bankFeature9: 'خدمات رقمية متطورة',
        bankFeature10: 'خبرة في التمويل العقاري',
        bankFeature11: 'استشارة مجانية',
        bankFeature12: 'تقييم سريع للعقار',
        bankFeature13: 'بنك حكومي موثوق',
        bankFeature14: 'فروع في جميع المحافظات',
        
        // Alerts and messages
        missingDataAlert: 'يرجى إدخال جميع البيانات المطلوبة واختيار البنك',
        loanLimitExceeded: 'الحد الأقصى للقرض في',
        loanLimitExceededIs: 'هو',
        downPaymentTooLow: 'الحد الأدنى للمقدم في',
        downPaymentTooLowIs: 'هو',
        enterMonthlyIncome: 'يرجى إدخال الدخل الشهري لحساب القدرة على التحمل',
        calculationSaved: 'تم حفظ الحساب بنجاح',
        calculationNotSaved: 'لم يتم حفظ الحساب',
        linkCopied: 'تم نسخ التفاصيل إلى الحافظة',
        
        // Affordability result
        affordabilityResult: 'تقدير القدرة على التحمل',
        affordabilityResultText: 'بناءً على دخلك الشهري:',
        maxPropertyPrice: 'الحد الأقصى للسعر',
        maxAffordableLoanAmount: 'الحد الأقصى للقرض',
        recommendedPayment: 'القسط الشهري المقترح',
        estimateNote: 'ملحوظة: هذا تقدير تقريبي',
        
        // Property and loan details header
        propertyLoanDetails: 'بيانات العقار والقرض',
        
        // App credit
        appCredit: 'تطبيق العقارات المصرية 🇪🇬'
      }
    }
  }
};

// Add missing Arabic translations
if (resources.ar && resources.ar.translation) {
  // About section
  (resources.ar.translation as any).about = {
    pageTitle: 'عن VirtualEstate',
    pageDescription: 'نحن نثور في مجال العقارات من خلال الجولات الافتراضية الغامرة والمساعدة المدعومة بالذكاء الاصطناعي.',
    heroTitle: 'ثورة في مجال العقارات',
    heroDescription: 'نحن نحول طريقة اكتشاف الأشخاص واستكشافهم والتواصل مع العقارات من خلال الواقع الافتراضي المتطور وتقنية الذكاء الاصطناعي.',
    
    // Stats
    stats: {
      propertiesLabel: 'عقارات تم جولها',
      citiesLabel: 'مدن مغطاة',
      languagesLabel: 'لغات مدعومة',
      satisfactionLabel: 'رضا العملاء',
    },
    
    // Mission
    missionTitle: 'مهمتنا',
    missionDescription1: 'في VirtualEstate، نؤمن أن العثور على المنزل المثالي لا يجب أن يكون محدودًا بالمسافة أو المناطق الزمنية أو حواجز اللغة. مهمتنا هي إضفاء الطابع الديمقراطي على استكشاف العقارات من خلال الجولات الافتراضية الغامرة والمساعدة الذكية بالذكاء الاصطناعي، مما يجعل العقارات في متناول الجميع في كل مكان.',
    missionDescription2: 'نحن لا نعرض العقارات فقط - نحن ننشئ تجارب تساعد الناس على اتخاذ قرارات مدروسة حول واحد من أهم استثمارات الحياة: منزلهم.',
    
    // Values
    valuesTitle: 'قيمنا',
    valuesDescription: 'هذه القيم الأساسية توجه كل ما نفعله وتشكل كيفية بناء المنتجات لمستخدمينا.',
    values: {
      accessibility: {
        title: 'إمكانية الوصول العالمية',
        description: 'جعل عرض العقارات في متناول أي شخص في أي مكان في العالم، كسر الحواجز الجغرافية.',
      },
      innovation: {
        title: 'الابتكار أولاً',
        description: 'دفع حدود التكنولوجيا باستمرار لإنشاء تجارب العقارات الأكثر غمرًا.',
      },
      trust: {
        title: 'الثقة والأمان',
        description: 'ضمان معلومات عقارية آمنة وموثوقة وشفافة لجميع مستخدمينا.',
      },
      customer: {
        title: 'التركيز على العميل',
        description: 'كل ميزة نبنيها مصممة مع احتياجات وتجارب مستخدمينا في المركز.',
      },
    },
    
    // Team
    teamTitle: 'تعرف على فريقنا',
    teamDescription: 'فريقنا المتنوع من الخبراء يجمع بين المعرفة العميقة بالعقارات وخبرة التكنولوجيا المتطورة.',
    team: {
      ceo: {
        name: 'سارة أحمد',
        role: 'المدير التنفيذي والمؤسس',
        bio: 'مدير تنفيذي سابق في العقارات مع أكثر من 15 عامًا من الخبرة في تكنولوجيا العقارات والواقع الافتراضي.',
      },
      cto: {
        name: 'محمد حسن',
        role: 'مدير التكنولوجيا',
        bio: 'خبير في الذكاء الاصطناعي والتكنولوجيا ثلاثية الأبعاد، قاد سابقًا فرق هندسية في شركات تقنية كبرى.',
      },
      design: {
        name: 'ليلى منصور',
        role: 'رئيس التصميم',
        bio: 'مصمم UX حائز على جوائز متخصص في التجارب الغامرة والبيئات الافتراضية.',
      },
      ai: {
        name: 'أحمد فاروق',
        role: 'رئيس الذكاء الاصطناعي',
        bio: 'باحث في التعلم الآلي يركز على معالجة اللغة الطبيعية والذكاء الاصطناعي المحادثي.',
      },
    },
    
    // Technology
    technologyTitle: 'مدعوم بتكنولوجيا متطورة',
    technologyDescription: 'نستفيد من أحدث التطورات في التصور ثلاثي الأبعاد والذكاء الاصطناعي والحوسبة السحابية لتقديم تجارب عقارية لا مثيل لها.',
    technology: {
      vr: {
        title: 'الواقع الافتراضي ثلاثي الأبعاد',
        description: 'بيئات ثلاثية الأبعاد واقعية مدعومة بتقنية عرض متطورة ومعدات تصوير احترافية.',
      },
      ai: {
        title: 'مساعدة الذكاء الاصطناعي',
        description: 'مساعدين افتراضيين ذكيين مدربين على بيانات العقارات وخبرة العقارات للإجابة على الأسئلة في الوقت الفعلي.',
      },
      global: {
        title: 'منصة عالمية',
        description: 'بنية تحتية قائمة على السحابة تدعم لغات وعملات متعددة لاستكشاف عقاري دولي سلس.',
      },
    },
    
    // CTA
    ctaTitle: 'مستعد لتجربة مستقبل العقارات؟',
    ctaDescription: 'انضم إلى آلاف المستخدمين الذين اكتشفوا بالفعل عقارات أحلامهم من خلال منصتنا.',
    exploreProperties: 'استكشف العقارات',
    getInTouch: 'تواصل معنا',
  };

  // Contact page Arabic translations
  (resources.ar.translation as any).contact = {
    pageTitle: 'تواصل معنا',
    pageDescription: 'هل لديك أسئلة حول جولاتنا الافتراضية أو تحتاج مساعدة في العثور على العقار المثالي؟ نحن هنا لمساعدتك في كل خطوة.',
    
    // Form section
    formTitle: 'أرسل لنا رسالة',
    fullName: 'الاسم الكامل',
    emailAddress: 'البريد الإلكتروني',
    phoneNumber: 'رقم الهاتف',
    preferredContactMethod: 'طريقة التواصل المفضلة',
    subject: 'الموضوع',
    message: 'الرسالة',
    sendMessage: 'إرسال الرسالة',
    
    // Form placeholders
    fullNamePlaceholder: 'اسمك الكامل',
    emailPlaceholder: 'your.email@example.com',
    phonePlaceholder: '+20 123 456 7890',
    subjectPlaceholder: 'اختر موضوعاً',
    messagePlaceholder: 'أخبرنا كيف يمكننا مساعدتك...',
    
    // Contact methods
    contactMethods: {
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      whatsapp: 'واتساب',
    },
    
    // Subject options
    subjects: {
      propertyInquiry: 'استفسار عن عقار',
      virtualTour: 'دعم الجولة الافتراضية',
      technicalSupport: 'الدعم التقني',
      partnership: 'فرص الشراكة',
      general: 'سؤال عام',
    },
    
    // Form validation
    validation: {
      fillAllFields: 'يرجى ملء جميع الحقول المطلوبة',
      invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح',
      thankYouMessage: 'شكراً لك على رسالتك! سنتواصل معك قريباً.',
    },
    
    // Contact information
    contactInfo: {
      title: 'معلومات التواصل',
      address: 'العنوان',
      addressDetails: '123 الحي التجاري\nالقاهرة الجديدة، مصر\n11835',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      businessHours: 'ساعات العمل',
      businessHoursDetails: 'الأحد - الخميس: 9:00 ص - 6:00 م\nالجمعة - السبت: 10:00 ص - 4:00 م',
    },
    
    // Map section
    map: {
      title: 'موقعنا',
      placeholder: 'الخريطة التفاعلية ستكون هنا',
    },
    
    // Quick actions
    quickActions: {
      title: 'إجراءات سريعة',
      scheduleVirtualTour: 'جدولة جولة افتراضية',
      liveChatSupport: 'دعم الدردشة المباشرة',
      browseProperties: 'تصفح العقارات',
      calendarBooking: 'ميزة حجز التقويم ستفتح هنا',
      liveChatAlert: 'الدردشة المباشرة ستفتح هنا',
    },
    
    // FAQ section
    faq: {
      title: 'الأسئلة الشائعة',
      questions: {
        virtualTours: {
          question: 'كيف تعمل الجولات الافتراضية؟',
          answer: 'تتيح لك جولاتنا الافتراضية ثلاثية الأبعاد استكشاف العقارات عن بُعد باستخدام الكمبيوتر أو الجهاز المحمول.',
        },
        aiAssistant: {
          question: 'هل المساعد الذكي مجاني؟',
          answer: 'نعم! مساعدنا الذكي مجاني تماماً ومتاح 24/7 للإجابة على أسئلتك حول العقارات.',
        },
        physicalViewing: {
          question: 'هل يمكنني جدولة معاينة شخصية؟',
          answer: 'تواصل معنا لترتيب معاينة شخصية بعد الاستكشاف الافتراضي.',
        },
        coverage: {
          question: 'ما هي المناطق التي تغطونها؟',
          answer: 'نعمل حالياً في القاهرة الجديدة والمناطق المحيطة، مع خطط للتوسع إلى مواقع أخرى مميزة في مصر.',
        },
      },
    },
  };

  // Properties section additions
  Object.assign(resources.ar.translation.properties, {
    featuredDescription: 'اختبر جولات افتراضية غامرة مع مساعدة ذكية مدعومة بالذكاء الاصطناعي. احصل على إجابات فورية حول العقارات أثناء الاستكشاف ثلاثي الأبعاد.',
    startVirtualTour: 'ابدأ الجولة الافتراضية',
    topCompoundsDescription: 'اكتشف أكثر المجتمعات السكنية المرغوبة في مصر',
    viewAllCompounds: 'عرض جميع المجمعات',
    hottestListingsDescription: 'العقارات ذات أعلى اهتمام ونمو في الأسعار',
    viewAllTrending: 'عرض جميع المتداولة',
    browseAll: 'تصفح جميع العقارات',
    apartments: 'الشقق',
    villas: 'الفيلات',
    penthouses: 'البنتهاوسات',
    townhouses: 'تاون هاوس',
    studios: 'استوديوهات',
    
    // Properties page specific Arabic translations
    pageTitle: 'جميع العقارات',
    pageDescription: 'اكتشف منزلك المثالي مع الجولات الافتراضية الغامرة',
    searchPlaceholder: 'ابحث حسب الموقع أو نوع العقار أو المميزات...',
    advancedFilters: 'المرشحات المتقدمة',
    propertyType: 'نوع العقار',
    allTypes: 'جميع الأنواع',
    apartment: 'شقة',
    villa: 'فيلا',
    penthouse: 'بنتهاوس',
    townhouse: 'تاون هاوس',
    condominium: 'شقة سكنية',
    house: 'منزل',
    bedrooms: 'غرف النوم',
    any: 'أي',
    bedroom: 'غرفة نوم',
    status: 'الحالة',
    allStatus: 'جميع الحالات',
    available: 'متاح',
    pending: 'في الانتظار',
    sold: 'مباع',
    sortBy: 'ترتيب حسب',
    priceLowToHigh: 'السعر: من المنخفض إلى المرتفع',
    priceHighToLow: 'السعر: من المرتفع إلى المنخفض',
    newestFirst: 'الأحدث أولاً',
    mostBedrooms: 'أكثر غرف النوم',
    largestFirst: 'الأكبر أولاً',
    priceRange: 'نطاق السعر',
    savedSearches: 'البحث المحفوظ',
    activeFilters: 'المرشحات النشطة',
    clearAll: 'مسح الكل',
    searching: 'جاري البحث...',
    smartSearch: 'البحث الذكي',
    examples: 'جرب: "فيلا 3 غرف نوم في القاهرة الجديدة" أو "شقة أقل من 500 ألف بمسبح"',
    showingResults: 'عرض {{count}} من {{total}} عقار',
    showingProperties: 'عرض {{count}} عقار',
    saveSearch: 'حفظ البحث',
    virtualTour: 'جولة افتراضية',
    beds: 'غرف نوم',
    baths: 'حمامات',
    sqm: 'متر مربع',
    noPropertiesFound: 'لم يتم العثور على عقارات',
    noPropertiesDescription: 'جرب تعديل معايير البحث أو المرشحات',
    clearFilters: 'مسح المرشحات',
    loadingMoreProperties: 'تحميل المزيد من العقارات...',
    scrollToLoadMore: 'مرر لأسفل لتحميل المزيد من العقارات',
    popularLocations: 'المواقع الشائعة',
    showingOf: 'عرض {{current}} من {{total}} عقار',
    reachedEnd: 'لقد وصلت إلى النهاية!',
    enterSearchName: 'أدخل اسماً لهذا البحث:',
    gridView: 'عرض الشبكة',
    listView: 'عرض القائمة',
    mapView: 'عرض الخريطة',
    inquireNow: 'استفسر الآن',
    hot: 'ساخن',
    daysAgo: 'أيام مضت',
  });
  
  // Add extended translations before i18n initialization
  
  // Testimonials
  (resources.ar.translation as any).testimonials = {
    title: 'ماذا يقول عملاؤنا',
    description: 'استمع لعملاء راضين وجدوا عقارات أحلامهم من خلال VirtualEstate',
    client1: {
      name: 'سارة أحمد',
      role: 'مشتري لأول مرة',
      text: 'VirtualEstate جعل العثور على شقة أحلامي سهلاً جداً! الجولات ثلاثية الأبعاد وفرت عليّ ساعات لا تحصى، والمساعد الذكي أجاب على جميع أسئلتي فوراً. أنصح به بشدة!',
      property: 'شقة فاخرة - القاهرة الجديدة'
    },
    client2: {
      name: 'محمد حسن',
      role: 'مستثمر عقاري',
      text: 'كمستثمر، أحتاج لمشاهدة عقارات متعددة بسرعة. الجولات الافتراضية والتحليلات المفصلة ساعدتني في اتخاذ قرارات مدروسة دون السفر. خدمة استثنائية!',
      property: 'فيلا عصرية - الشيخ زايد'
    },
    client3: {
      name: 'ليلى منصور',
      role: 'محترفة منتقلة',
      text: 'الانتقال للقاهرة من الخارج كان مرهقاً حتى وجدت VirtualEstate. الدعم متعدد اللغات والجولات الغامرة جعلني أشعر بالثقة في اختياري.',
      property: 'بنتهاوس - وسط القاهرة'
    },
    client4: {
      name: 'أحمد محمود',
      role: 'مطور عقاري',
      text: 'استخدمنا VirtualEstate لعرض مشاريعنا الجديدة. زاد عدد المهتمين بنسبة 200% والمبيعات تضاعفت. منصة رائعة للتسويق العقاري.',
      property: 'مشروع سكني - العاصمة الإدارية'
    },
    client5: {
      name: 'فاطمة علي',
      role: 'وسيط عقاري',
      text: 'كوسيط عقاري، VirtualEstate غيّر طريقة عملي. عملائي سعداء بالجولات الافتراضية ووقت الإغلاق قل بشكل كبير.',
      property: 'شقة عائلية - مدينة نصر'
    }
  };

  // CTA section
  (resources.ar.translation as any).cta = {
    exclusiveOffer: 'عرض حصري',
    getYourFree: 'احصل على',
    virtualTour3D: 'جولة افتراضية ثلاثية الأبعاد',
    worth: 'بقيمة',
    priceEGP: '50,000 جنيه مصري',
    hundredPercentFree: '100٪ مجاناً',
    sellFasterDescription: 'بع عقارك بسرعة أكبر بنسبة 73٪ مع جولات افتراضية غامرة تجذب المشترين الجديين',
    professionalPhotography: 'تصوير احترافي',
    hdrDroneShots: 'لقطات HDR والطائرات المسيرة',
    interactive3DTour: 'جولة تفاعلية ثلاثية الأبعاد',
    dollhouseFloorPlans: 'مخططات الطوابق والبيت المجسم',
    brokerNetwork: 'شبكة الوسطاء',
    activeAgents: '1000+ وكيل نشط',
    claimFreeVirtualTour: 'احصل على جولتي الافتراضية المجانية',
    spotsLeft: 'فقط 42 مكان متبقي',
    noCreditCard: 'لا حاجة لبطاقة ائتمان',
    claimedThisMonth: '8 من 50 تم المطالبة بها هذا الشهر',
    limitedTimeOffer: 'عرض لفترة محدودة',
    professionalTourWorth: 'جولة احترافية ثلاثية الأبعاد بقيمة',
    completelyFree: 'مجاناً تماماً!',
    sellFasterStunning: 'بع عقارك بشكل أسرع مع جولات افتراضية مذهلة تجذب المشترين الجديين',
    virtualTourCreation: 'إنشاء جولة افتراضية ثلاثية الأبعاد',
    brokerNetworkMarketing: 'تسويق شبكة الوسطاء',
    only50Applications: 'نأخذ فقط 50 طلباً هذا الشهر',
    freeVirtualTour: 'جولة افتراضية مجانية'
  };

  // Stats
  (resources.ar.translation as any).stats = {
    // New realistic performance metrics - Option B (Efficiency & Performance Focus)
    fasterPropertySales: '٧٣٪ مبيعات عقارية أسرع',
    aiAssistantActive: '٢٤/٧ مساعد ذكي نشط',
    appraisalTurnaround: '٤٨ ساعة تقييم عقاري',
    freeVirtualTours: '١٠٠٪ جولات افتراضية مجانية',
    // Descriptions for each stat  
    withVirtualTours: 'مع الجولات الافتراضية',
    alwaysAvailableSupport: 'دعم متاح دائماً',
    professionalValuations: 'تقييمات مهنية',
    zeroCostToSellers: 'بدون تكلفة على البائعين',
    // Legacy stats (kept for compatibility)
    propertieslisted: 'العقارات المدرجة',
    happyclients: 'العملاء السعداء',
    virtualtours: 'الجولات الافتراضية', 
    citiescovered: 'المدن المغطاة',
    virtualTourscreated: 'الجولات الافتراضية المُنشأة',
    activeListings: 'إعلانات نشطة',
    experiences3d: 'تجارب ثلاثية الأبعاد',
    satisfiedCustomers: 'عملاء راضون',
    acrossEgypt: 'في جميع أنحاء مصر',
    // New premium stats section
    headerBadge: 'منصة العقارات التقنية رقم 1 في مصر',
    headerTitle: 'نحو مستقبل العقارات في مصر',
    headerDescription: 'انضم إلى آلاف مالكي العقارات والمشترين الذين يثقون في منصة أوبن بيت المدعومة بالذكاء الاصطناعي للحصول على تجارب عقارية سلسة',
    liveStatsLabel: 'إحصائيات مباشرة',
    updatedRealtime: 'محدثة في الوقت الفعلي'
  };

  // Features
  (resources.ar.translation as any).features = {
    revolutionaryExperience: 'تجربة مشاهدة عقارية ثورية',
    revolutionaryDescription: 'منصتنا تجمع بين تقنية ثلاثية الأبعاد متطورة ومساعدة ذكية لتوفير أكثر تجارب مشاهدة العقارات غامرة.',
    immersive3DTours: 'جولات ثلاثية الأبعاد غامرة',
    immersive3DDescription: 'استكشف العقارات بتفاصيل ثلاثية الأبعاد مذهلة من راحة منزلك.',
    aiPoweredAssistance: 'مساعدة مدعومة بالذكاء الاصطناعي',
    aiAssistanceDescription: 'احصل على إجابات فورية حول العقارات مع مساعدنا الافتراضي الذكي.',
    multiLanguageSupport: 'دعم متعدد اللغات',
    multiLanguageDescription: 'تواصل بلغتك المفضلة مع وكلائنا الذكيين متعددي اللغات.'
  };

  // Areas
  (resources.ar.translation as any).areas = {
    topAreas: 'أهم المناطق',
    topAreasDescription: 'استكشف الأحياء والمناطق الأكثر شعبية',
    viewAllAreas: 'عرض جميع المناطق',
    properties: 'العقارات',
    exploreArea: 'استكشف المنطقة'
  };

  // Lifestyle Compatibility Tool
  (resources.ar.translation as any).lifestyle = {
    yourLifeFromHere: 'حياتك من هنا',
    getStarted: 'ابدأ',
    instructions: 'أضف الأماكن التي تزورها بانتظام لتحليل أوقات التنقل وتوافق نمط الحياة.',
    searchToAdd: 'ابحث عن أماكن لإضافة وجهات',
    clickToAdd: 'انقر في أي مكان على الخريطة لإضافة موقع',
    savedLocations: 'المواقع المحفوظة',
    analyzing: 'جاري التحليل...',
    excellent: 'ممتاز',
    good: 'جيد',
    fair: 'مقبول',
    poor: 'ضعيف',
    quickStats: 'إحصائيات سريعة',
    avgCommute: 'متوسط التنقل',
    dailyCost: 'التكلفة اليومية',
    locationName: 'اسم الموقع',
    enterLocationName: 'أدخل اسم الموقع',
    category: 'الفئة',
    importance: 'الأهمية',
    addLocation: 'إضافة موقع',
    cancel: 'إلغاء',
    success: 'نجح',
    error: 'خطأ',
    destinationRemoved: 'تم حذف الوجهة بنجاح',
    removeDestinationError: 'فشل في حذف الوجهة',
    categories: {
      work: 'العمل',
      education: 'التعليم',
      health: 'الصحة',
      shopping: 'التسوق',
      fitness: 'اللياقة البدنية',
      dining: 'المطاعم',
      entertainment: 'الترفيه',
      other: 'أخرى'
    }
  };

  // Filters
  (resources.ar.translation as any).filters = {
    findIdealProperty: 'ابحث عن عقارك المثالي',
    advancedFilters: 'فلاتر متقدمة',
    useFiltersDescription: 'استخدم الفلاتر والفئات للحصول على توصيات مخصصة',
    advancedFiltersNote: '(خيارات الفلاتر المتقدمة هنا. يمكنك إضافة المزيد من التحكمات حسب الحاجة.)',
    price_under_500k: 'أقل من 500 ألف',
    new_listing: 'إعلان جديد',
    luxury: 'فاخر',
    villa: 'فيلا',
    apartment: 'شقة',
    pet_friendly: 'مناسب للحيوانات الأليفة',
    pool: 'حمام سباحة',
    garden: 'حديقة',
    aiRecommendations: 'توصيات الذكاء الاصطناعي',
    aiRecommendationsDescription: 'اختر فلتر ونوع العقار للحصول على',
    smartRecommendations: '3 توصيات ذكية',
    fromOurAI: 'من الذكاء الاصطناعي لدينا!'
  };

  // Coming Soon Page Arabic
  (resources.ar.translation as any).comingSoon = {
    launchDate: 'الإطلاق في 1 سبتمبر',
    heroTitle: 'بع عقاراتك',
    heroTitleHighlight: 'أسرع بـ 73%',
    heroTitleEnd: 'مع الجولات الافتراضية المجانية',
    heroDescription: 'ذكاءنا الاصطناعي يجيب على جميع أسئلة العملاء على مدار الساعة، والمشترين المهتمين يمكنهم حجز المواعيد فوراً. بع أسرع مع عملاء مؤهلين.',
    urgencyWarning: 'توفر محدود',
    limitedSlots: 'فقط 42 مكان للجولات الافتراضية المجانية المتبقية هذا الشهر',
    afterLaunchPrice: 'بعد 1 سبتمبر، ستكلف هذه الخدمة 50,000 جنيه مصري. احجز مكانك المجاني الآن.',
    feature1: 'جولات افتراضية ثلاثية الأبعاد مجانية',
    feature2: 'مساعد ذكي 24/7',
    feature3: 'تأهيل فوري للعملاء المحتملين',
    emailPlaceholder: 'أدخل بريدك الإلكتروني للوصول المبكر',
    notifyMe: 'احصل على الوصول المبكر',
    successTitle: 'أنت في قائمة كبار الشخصيات!',
    successMessage: 'سنخبرك بالوصول المبكر الحصري في 1 سبتمبر',
    sneakPeekBadge: 'اختبر الفرق',
    sneakPeekTitle: 'معاينة تقنيتنا',
    sneakPeekDescription: 'اختبر تقنية الجولات الافتراضية الثورية مع هذه المعاينات التفاعلية للعقارات',
    clickToLoad: 'انقر لتحميل الجولة الافتراضية',
    clickToExplore: 'انقر للاستكشاف',
    liveTour: 'جولة مباشرة',
    launchDateShort: '1 سبتمبر',
    viewInFullscreen: 'عرض في ملء الشاشة',
    countdownTitle: 'العد التنازلي للإطلاق',
    countdownSubtitle: 'استعد لمستقبل تطوير العقارات',
    days: 'أيام',
    hours: 'ساعات',
    minutes: 'دقائق',
    seconds: 'ثواني'
  };

  // Value Proposition Section Arabic
  (resources.ar.translation as any).valueProposition = {
    title: 'ما نقوم به',
    subtitle: 'نحن نثور في عرض العقارات بتقنيات متطورة تغير طريقة بيع المطورين للعقارات',
    benefit1: {
      title: 'جولات ثلاثية الأبعاد احترافية مجانية',
      description: 'تصوير وإنشاء جولات ثلاثية الأبعاد كاملة بدون تكلفة. تجارب غامرة احترافية تجذب المشترين.'
    },
    benefit2: {
      title: 'مساعد عقاري ذكي 24/7',
      description: 'مساعد ذكي يتعامل مع الاستفسارات ويؤهل العملاء المحتملين ويقدم معلومات مفصلة عن العقارات على مدار الساعة.'
    },
    benefit3: {
      title: 'تأهيل فوري للعملاء المحتملين',
      description: 'خوارزميات متقدمة تحدد وتعطي الأولوية للمشترين الجديين فوراً، مما يزيد من وقتك ومعدلات التحويل.'
    }
  };

  // How It Works Section Arabic
  (resources.ar.translation as any).howItWorks = {
    title: 'كيف يعمل',
    subtitle: 'ثلاث خطوات بسيطة لتحويل تسويق عقارك',
    step1: {
      title: 'نصور عقارك',
      subtitle: '(مجاناً)',
      description: 'مصورونا المحترفون يلتقطون عقارك بتقنية المسح ثلاثي الأبعاد المتقدمة والكاميرات عالية الدقة.'
    },
    step2: {
      title: 'إنشاء جولات افتراضية غامرة',
      description: 'نحول البيانات الملتقطة إلى جولات ثلاثية الأبعاد مذهلة مع عروض البيت المجسم ومخططات الطوابق والميزات التفاعلية.'
    },
    step3: {
      title: 'المساعد الذكي يتعامل مع الاستفسارات',
      subtitle: '24/7',
      description: 'مساعدنا الذكي يتفاعل مع الزوار ويجيب على الأسئلة ويؤهل العملاء المحتملين ويحدد المواعيد تلقائياً.'
    }
  };

  // Developer Benefits Section Arabic
  (resources.ar.translation as any).developerBenefits = {
    badge: 'مصمم للمطورين',
    title: 'لماذا يختارنا المطورون',
    subtitle: 'نتائج مثبتة تحول عملية البيع وتزيد الإيرادات',
    metric1: {
      label: 'دورة مبيعات أسرع',
      description: 'الجولات الافتراضية تقلل الحاجة لزيارات متعددة للموقع، مما يسرع اتخاذ القرارات'
    },
    metric2: {
      label: 'تقليل زيارات الموقع',
      description: 'العملاء المحتملون المؤهلون مسبقاً يصلون مستعدين للشراء، مما يوفر الوقت والموارد'
    },
    metric3: {
      label: 'ردود تلقائية',
      description: 'المساعد الذكي يلتقط العملاء المحتملين ويقدم المعلومات على مدار الساعة'
    },
    trust1: 'أمان المؤسسات',
    trust2: 'حماية البيانات',
    trust3: 'متوافق مع اللائحة العامة لحماية البيانات'
  };

  // Tech Stack Section Arabic
  (resources.ar.translation as any).techStack = {
    badge: 'مدعوم بالذكاء الاصطناعي المتقدم',
    title: 'تقنية متطورة',
    subtitle: 'مبني بأحدث التقنيات لتقديم أداء وموثوقية لا مثيل لهما'
  };

  // Appraisers Section Arabic
  (resources.ar.translation as any).appraisers = {
    pageTitle: 'البحث عن مثمنين عقاريين معتمدين',
    pageDescription: 'تواصل مع مثمنين عقاريين مرخصين ومعتمدين في مصر',
    findAppraisers: 'البحث عن المثمنين',
    verifiedAppraisers: 'مثمنون معتمدون',
    certifiedProfessionals: 'محترفون معتمدون',
    searchByLocation: 'البحث بالموقع',
    searchBySpecialization: 'البحث بالتخصص',
    availableNow: 'متاح الآن',
    topRated: 'الأعلى تقييماً',
    experienced: 'ذوو خبرة',
    quickResponse: 'استجابة سريعة',
    bookAppraisal: 'حجز تقييم',
    viewProfile: 'عرض الملف الشخصي',
    contactAppraiser: 'تواصل مع المثمن',
    yearsExperience: 'سنوات خبرة',
    completedAppraisals: 'تقييمات مكتملة',
    specializations: 'التخصصات',
    languages: 'اللغات',
    servicesOffered: 'الخدمات المقدمة',
    propertyValuation: 'تقييم العقارات',
    marketAnalysis: 'تحليل السوق',
    investmentConsulting: 'استشارات الاستثمار',
    legalDocumentation: 'الوثائق القانونية',
    residentialAppraisal: 'تقييم سكني',
    commercialAppraisal: 'تقييم تجاري',
    industrialAppraisal: 'تقييم صناعي',
    landValuation: 'تقييم الأراضي',
    hourlyRate: 'السعر بالساعة',
    projectBased: 'حسب المشروع',
    availability: 'التوفر',
    responseTime: 'وقت الاستجابة',
    within24Hours: 'خلال 24 ساعة',
    within48Hours: 'خلال 48 ساعة',
    within72Hours: 'خلال 72 ساعة',
    bookingFee: 'رسوم الحجز',
    serviceFee: 'رسوم الخدمة',
    reviewsRatings: 'التقييمات والمراجعات',
    clientFeedback: 'ملاحظات العملاء',
    professionalCertification: 'الشهادات المهنية',
    licenseNumber: 'رقم الترخيص',
    membershipDetails: 'تفاصيل العضوية',
    portfolioSamples: 'عينات من الأعمال',
    caseStudies: 'دراسات الحالة',
    successStories: 'قصص النجاح',
    serves: 'يخدم',
    away: 'بعيداً'
  };

  // Appraiser Dashboard Section Arabic
  (resources.ar.translation as any).appraiserDashboard = {
    // Main navigation and tabs
    dashboard: 'لوحة التحكم',
    profile: 'الملف الشخصي',
    myAppraisals: 'تقييماتي',
    bookings: 'الحجوزات',
    availability: 'التوفر',
    reviews: 'المراجعات',
    reports: 'التقارير',
    analytics: 'الإحصائيات',
    overview: 'نظرة عامة',
    
    // Page titles and descriptions
    adminTitle: 'إدارة - لوحة تحكم المثمن',
    userTitle: 'لوحة تحكم المثمن',
    adminDescription: 'إدارة التقييمات والتقارير لجميع المثمنين',
    userDescription: 'إدارة تقييمات الممتلكات والتقارير الخاصة بك',
    
    // Quick actions
    quickActions: 'الإجراءات السريعة',
    quickActionsDescription: 'إدارة ملفك الشخصي والمراجعات',
    manageAppraiser: 'إدارة المثمن',
    manageProfile: 'إدارة الملف الشخصي',
    editAppraiserDetails: 'تعديل تفاصيل المثمن المحدد',
    editCertifications: 'تعديل الشهادات والخدمات والتوفر',
    respondToFeedback: 'الرد على ملاحظات العملاء',
    syncPortfolio: 'مزامنة المحفظة',
    updateAppraiserProfile: 'تحديث ملف المثمن المحدد',
    updatePublicProfile: 'تحديث الملف العام',
    syncing: 'جارٍ المزامنة...',
    
    // Stats cards
    totalAppraisals: 'إجمالي التقييمات',
    completed: 'مكتمل',
    pending: 'قيد الانتظار',
    totalValue: 'إجمالي القيمة',
    avgConfidence: 'متوسط الثقة',
    confidence: 'ثقة',
    
    // Status labels
    draft: 'مسودة',
    inReview: 'قيد المراجعة',
    approved: 'معتمد',
    archived: 'مؤرشف',
    confirmed: 'مؤكد',
    inProgress: 'قيد التنفيذ',
    cancelled: 'ملغي',
    noShow: 'عدم حضور',
    partial: 'جزئي',
    paid: 'مدفوع',
    refunded: 'مسترد',
    
    // Recent appraisals
    recentAppraisals: 'التقييمات الحديثة',
    recentAppraisalsDescription: 'أحدث تقييمات الممتلكات الخاصة بك',
    
    // Profile completion
    completeProfile: 'أكمل ملفك الشخصي للظهور العام',
    completeProfileDescription: 'للظهور في عمليات البحث العامة للمثمنين وتلقي حجوزات العملاء، لا يزال يتعين عليك:',
    completeProfileButton: 'إكمال الملف الشخصي',
    previewPublicListing: 'معاينة القائمة العامة',
    completeValifyVerification: 'إكمال التحقق من الهوية عبر Valify',
    addProfileHeadlineBio: 'إضافة عنوان ونبذة للملف الشخصي',
    addYearsExperience: 'إضافة سنوات الخبرة',
    addRatingInfo: 'إضافة معلومات التقييم',
    addProfessionalCertifications: 'إضافة الشهادات المهنية',
    addProfessionalHeadshot: 'إضافة صورة مهنية',
    setPricingInfo: 'تحديد معلومات التسعير',
    setServiceAreas: 'تحديد مناطق الخدمة',
    setResponseTime: 'تحديد وقت الاستجابة',
    
    // Appraisal details modal
    appraisalDetails: 'تفاصيل التقييم',
    propertyInformation: 'معلومات العقار',
    propertyTitle: 'عنوان العقار:',
    address: 'العنوان:',
    propertyType: 'نوع العقار:',
    city: 'المدينة:',
    
    appraisalInformation: 'معلومات التقييم',
    clientName: 'اسم العميل:',
    appraisalDate: 'تاريخ التقييم:',
    referenceNumber: 'الرقم المرجعي:',
    status: 'الحالة:',
    
    valuationResults: 'نتائج التقييم',
    marketValueEstimate: 'تقدير القيمة السوقية',
    confidenceLevel: 'مستوى الثقة',
    vsListedPrice: 'مقابل السعر المعلن',
    
    propertyDetails: 'تفاصيل العقار',
    calculationDetails: 'تفاصيل الحساب',
    editAppraisal: 'تعديل التقييم',
    generateReport: 'إنشاء تقرير',
    
    // Form labels and buttons
    backToDashboard: 'العودة إلى لوحة التحكم',
    newAppraisal: 'تقييم جديد',
    newPropertyAppraisal: 'تقييم عقار جديد',
    generateAppraisalReport: 'إنشاء تقرير التقييم',
    selectAppraiser: 'اختر المثمن',
    
    // Profile form
    completeProfessionalProfile: 'أكمل ملفك المهني',
    fillOutInformation: 'املأ جميع المعلومات للظهور في عمليات البحث العامة للمثمنين وتلقي حجوزات العملاء',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    appraiserLicense: 'ترخيص المثمن',
    yearsOfExperience: 'سنوات الخبرة',
    profileHeadline: 'عنوان الملف الشخصي',
    profileHeadlinePlaceholder: 'مثال: مثمن عقاري معتمد متخصص في العقارات السكنية',
    bioProfileSummary: 'السيرة الذاتية / ملخص الملف الشخصي',
    serviceAreasLabel: 'مناطق الخدمة (مفصولة بفاصلة)',
    serviceAreasPlaceholder: 'القاهرة، الجيزة، الإسكندرية',
    averageRating: 'متوسط التقييم (0-5)',
    totalReviews: 'إجمالي المراجعات',
    responseTimeHours: 'وقت الاستجابة (ساعات)',
    professionalCertifications: 'الشهادات المهنية',
    pricingInformation: 'معلومات التسعير',
    baseFeeEgp: 'الرسوم الأساسية (جنيه مصري)',
    rushFeeEgp: 'رسوم الاستعجال (جنيه مصري)',
    currency: 'العملة',
    professionalHeadshot: 'الصورة المهنية',
    takePhoto: 'التقاط صورة',
    aiCamera: 'كاميرا ذكية',
    remove: 'إزالة',
    generateWithAi: 'إنشاء بالذكاء الاصطناعي',
    generatePlaceholder: 'مثال: مثمن مصري مهني، واثق، زي رسمي',
    generating: 'جارٍ الإنشاء...',
    generate: 'إنشاء',
    pasteImageUrl: 'أو الصق رابط الصورة',
    saving: 'جارٍ الحفظ...',
    saveProfile: 'حفظ الملف الشخصي',
    loadingProfileData: 'جارٍ تحميل بيانات الملف الشخصي...',
    
    // Appraisals tab
    searchAppraisals: 'البحث في التقييمات...',
    allStatuses: 'جميع الحالات',
    loadingAppraisals: 'جارٍ تحميل التقييمات...',
    noAppraisalsFound: 'لم يتم العثور على تقييمات',
    getStartedAppraisal: 'ابدأ بإنشاء أول تقييم عقار لك',
    
    // Appraisal list labels
    client: 'العميل:',
    date: 'التاريخ:',
    reference: 'المرجع:',
    location: 'الموقع:',
    marketValue: 'القيمة السوقية:',
    
    // Bookings tab
    searchBookings: 'البحث في الحجوزات بواسطة اسم العميل أو رقم التأكيد...',
    refresh: 'تحديث',
    totalBookings: 'إجمالي الحجوزات',
    thisMonthRevenue: 'إيرادات هذا الشهر',
    loadingBookings: 'جارٍ تحميل الحجوزات...',
    noBookingsFound: 'لم يتم العثور على حجوزات',
    bookingRequestsAppear: 'ستظهر طلبات الحجز الخاصة بك هنا بمجرد قيام العملاء بحجز المواعيد',
    
    // Booking details
    dateTime: 'التاريخ والوقت:',
    property: 'العقار:',
    confirmation: 'التأكيد:',
    duration: 'المدة:',
    totalCost: 'التكلفة الإجمالية:',
    deposit: 'العربون:',
    specialInstructions: 'تعليمات خاصة:',
    viewDetails: 'عرض التفاصيل',
    confirm: 'تأكيد',
    decline: 'رفض',
    startAppraisal: 'بدء التقييم',
    markComplete: 'تحديد كمكتمل',
    
    // Booking detail modal
    bookingDetails: 'تفاصيل الحجز',
    bookingInformation: 'معلومات الحجز',
    type: 'النوع:',
    clientInformation: 'معلومات العميل',
    name: 'الاسم:',
    size: 'الحجم:',
    estimatedValue: 'القيمة المقدرة:',
    accessInstructions: 'تعليمات الوصول:',
    financialDetails: 'التفاصيل المالية',
    totalCostLabel: 'التكلفة الإجمالية',
    depositAmount: 'مبلغ العربون',
    quickMessage: 'رسالة سريعة',
    callClient: 'اتصال بالعميل',
    emailClient: 'إرسال بريد إلكتروني للعميل',
    confirmBooking: 'تأكيد الحجز',
    markAsComplete: 'تحديد كمكتمل',
    
    // Reviews management
    reviewsManagement: 'إدارة المراجعات',
    reviewsDescription: 'إدارة مراجعات العملاء والردود لبناء سمعتك المهنية',
    loadingAppraiserProfile: 'جارٍ تحميل ملف المثمن...',
    
    // Availability management
    availabilityManagement: 'إدارة التوفر',
    availabilityDescription: 'إدارة جدولك الزمني وتفضيلات الحجز للعملاء',
    
    // Reports tab
    selectAppraisal: 'اختر التقييم',
    generateReportsDescription: 'إنشاء تقارير PDF مهنية من التقييمات المكتملة',
    legalCompliance: 'الامتثال القانوني',
    appraisalsWithLegalAnalysis: 'التقييمات مع التحليل القانوني',
    mortgageAnalysis: 'تحليل الرهن العقاري',
    appraisalsWithMortgageEligibility: 'التقييمات مع أهلية الرهن العقاري',
    investmentReports: 'تقارير الاستثمار',
    appraisalsWithInvestmentAnalysis: 'التقييمات مع تحليل الاستثمار',
    reportTemplates: 'قوالب التقارير',
    reportTemplatesDescription: 'تنسيقات التقارير المهنية المتاحة',
    
    // Report template types
    comprehensiveReport: 'تقرير شامل',
    comprehensiveReportDescription: 'تحليل كامل مع جميع الأقسام',
    mostPopular: 'الأكثر شعبية',
    pages15: '~15 صفحة',
    arabicEnglish: 'عربي/إنجليزي',
    
    executiveSummary: 'ملخص تنفيذي',
    executiveSummaryDescription: 'تقرير موجز لصناع القرار',
    quick: 'سريع',
    pages8: '~8 صفحات',
    
    investorReport: 'تقرير المستثمر',
    investorReportDescription: 'تحليل يركز على الاستثمار',
    roiFocus: 'تركيز العائد على الاستثمار',
    pages12: '~12 صفحة',
    
    legalComplianceReport: 'الامتثال القانوني',
    legalComplianceDescription: 'تركيز على الوضع القانوني والامتثال',
    legal: 'قانوني',
    pages10: '~10 صفحات',
    
    // Report generation steps
    howToGenerateReports: 'كيفية إنشاء التقارير',
    step1CompleteAppraisal: '1. إكمال التقييم',
    step1Description: 'تأكد من أن تقييمك يتضمن جميع البيانات المطلوبة: تفاصيل العقار وتحليل السوق والوضع القانوني.',
    step2ConfigureReport: '2. تكوين التقرير',
    step2Description: 'اختر القالب المفضل لديك واللغة والأقسام التي تريد تضمينها في التقرير المهني.',
    step3GeneratePdf: '3. إنشاء PDF',
    step3Description: 'قم بتنزيل تقريرك المهني عالي الجودة للمستثمرين مع الامتثال القانوني المصري.',
    
    // Analytics
    performanceAnalytics: 'تحليلات الأداء',
    analyticsDescription: 'تتبع أداء واتجاهات التقييم الخاصة بك',
    analyticsComingSoon: 'لوحة التحليلات قادمة قريباً...',
    
    // Quick message modal
    quickMessageTitle: 'رسالة سريعة',
    to: 'إلى:',
    message: 'الرسالة',
    messageArea: 'اكتب رسالتك هنا...',
    quickTemplates: 'قوالب سريعة:',
    confirmationTemplate: 'تأكيد',
    followUpTemplate: 'متابعة',
    cancel: 'إلغاء',
    sending: 'جارٍ الإرسال...',
    sendMessage: 'إرسال الرسالة',
    
    // New appraisal modal
    newAppraisalTitle: 'تقييم جديد',
    chooseCreateMethod: 'اختر كيفية إنشاء التقييم الخاص بك',
    createNewAppraisal: 'إنشاء تقييم جديد',
    startFromScratch: 'ابدأ من الصفر باستخدام نموذج التقييم الذكي',
    traditionalMethod: 'الطريقة التقليدية',
    importDocument: 'استيراد مستند',
    uploadDocuments: 'رفع مستندات التقييم واستخراج تلقائي بواسطة OpenBeit AI',
    openBeitAiBenefits: 'فوائد OpenBeit AI',
    extractFieldsAi: 'استخراج الحقول بواسطة OpenBeit AI',
    advancedArabicText: 'فهم متقدم للنصوص العربية',
    processPdfExcelWord: 'معالجة مستندات PDF وExcel وWord',
    intelligentDocAnalysis: 'تحليل ذكي للمستندات',
    
    // Common UI elements
    loading: 'جارٍ التحميل...',
    notAvailable: 'غير متوفر',
    
    // Error messages
    clientNameRequired: 'اسم العميل مطلوب',
    marketValueRequired: 'تقدير القيمة السوقية مطلوب ويجب أن يكون أكبر من 0',
    pleaseEnterMessage: 'يرجى إدخال رسالة',
    
    // Success messages
    profileUpdatedSuccessfully: 'تم تحديث الملف الشخصي بنجاح!',
    appraisalUpdatedSuccessfully: 'تم تحديث التقييم بنجاح',
    appraisalCreatedSuccessfully: 'تم إنشاء التقييم بنجاح',
    headshotGeneratedSuccessfully: 'تم إنشاء الصورة المهنية بنجاح!',
    headshotCapturedSuccessfully: 'تم التقاط وتطبيق الصورة المهنية!',
    portfolioSyncedSuccessfully: 'تمت مزامنة المحفظة بنجاح! تم تحديث الملف العام بالتقييمات المكتملة.',
    appraisalCompletedSuccessfully: 'تم إكمال التقييم بنجاح! تم تحديث المحفظة تلقائياً.',
    bookingActionSuccessful: 'تم {action} الحجز بنجاح',
    messageSentSuccessfully: 'تم إرسال الرسالة إلى {recipient}',
    
    // Error messages
    failedToSaveProfile: 'فشل في حفظ الملف الشخصي',
    failedToSaveAppraisal: 'فشل في حفظ التقييم',
    failedToGenerateHeadshot: 'فشل في إنشاء الصورة المهنية',
    failedToLoadAppraisers: 'فشل في تحميل المثمنين. يرجى مراجعة وحدة التحكم للحصول على التفاصيل.',
    noAppraisersFoundSystem: 'لم يتم العثور على مثمنين. يرجى التأكد من وجود مثمنين نشطين في النظام.',
    failedToLoadAppraisals: 'فشل في تحميل التقييمات',
    failedToSyncPortfolio: 'فشل في مزامنة المحفظة',
    failedToCompleteAppraisal: 'فشل في إكمال التقييم',
    failedToLoadBookings: 'فشل في تحميل الحجوزات',
    failedToActionBooking: 'فشل في {action} الحجز',
    failedToSendMessage: 'فشل في إرسال الرسالة',
    unableFetchUserProfile: 'غير قادر على جلب ملف المستخدم',
    unableDetermineAppraiserProfile: 'غير قادر على تحديد ملف المثمن لمزامنة المحفظة',
    
    // Availability management
    availableNow: 'متاح الآن',
    closedToday: 'مغلق اليوم',
    closedForToday: 'مغلق لليوم',
    opensAt: 'يفتح في {time}',
    nextAvailable: 'المتاح التالي: {day} في {time}',
    bookAppraisal: 'حجز تقييم',
    quickMessage: 'رسالة سريعة',
    
    // Days of week
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    
    // Availability states
    available: 'متاح',
    notAvailable: 'غير متاح',
    closed: 'مغلق',
    breakTime: 'استراحة: {start} - {end}',
    breakStart: 'بداية الاستراحة',
    breakEnd: 'نهاية الاستراحة',
    
    // Booking information
    responseAndBooking: 'الاستجابة والحجز',
    averageResponseTime: 'متوسط وقت الاستجابة',
    bookingAdvanceNotice: 'إشعار مسبق للحجز',
    bookingGuidelines: 'إرشادات الحجز: جميع طلبات التقييم تتطلب إشعاراً مسبقاً لا يقل عن {days} أيام.',
    
    // Contact preferences
    preferredContactMethods: 'طرق الاتصال المفضلة',
    phoneCallsLabel: 'المكالمات الهاتفية',
    emailLabel: 'البريد الإلكتروني',
    whatsappLabel: 'واتساب',
    emergencyServices: 'الخدمات الطارئة',
    serviceAreas: 'مناطق الخدمة',
    
    // System messages
    bookingSystemWillOpen: 'سيتم فتح نظام الحجز هنا',
    messagingSystemWillOpen: 'سيتم فتح نظام المراسلة هنا',
    
    // Profile edit page
    profileManagement: 'إدارة الملف الشخصي',
    profileManagementDescription: 'إدارة ملف المثمن والشهادات والخدمات',
    loadingProfile: 'جارٍ تحميل الملف الشخصي...',
    
    // Tabs
    certificationsTab: 'الشهادات',
    servicesTab: 'الخدمات',
    
    // Profile form
    languagesSpoken: 'اللغات المتحدثة',
    
    // Certifications
    addNewCertification: 'إضافة شهادة جديدة',
    yourCertifications: 'شهاداتك',
    certificationName: 'اسم الشهادة',
    issuingAuthority: 'الجهة المصدرة',
    certificationNumber: 'رقم الشهادة',
    issueDate: 'تاريخ الإصدار',
    expiryDate: 'تاريخ الانتهاء',
    addCertification: 'إضافة شهادة',
    certificationAddedSuccessfully: 'تم إضافة الشهادة بنجاح',
    
    // Services
    addNewService: 'إضافة خدمة جديدة',
    yourServices: 'خدماتك',
    
    // Language options
    french: 'الفرنسية',
    german: 'الألمانية',
    spanish: 'الإسبانية',
    
    // Additional Egyptian cities for service areas
    luxor: 'الأقصر',
    aswan: 'أسوان',
    sharmElSheikh: 'شرم الشيخ',
    hurghada: 'الغردقة',

    // Timezone Settings
    timezone: 'المنطقة الزمنية',
    selectTimezone: 'اختر المنطقة الزمنية',
    timezoneDescription: 'حدد المنطقة الزمنية المحلية للحصول على أوقات حجز دقيقة',
    currentTimezone: 'المنطقة الزمنية الحالية',
    autoDetectTimezone: 'الكشف التلقائي عن المنطقة الزمنية',

    // Confidence Level Details
    confidenceLevelExplanation: 'شرح مستوى الثقة',
    highConfidence: 'ثقة عالية (90-100%)',
    mediumConfidence: 'ثقة متوسطة (70-89%)',
    lowConfidence: 'ثقة منخفضة (50-69%)',
    confidenceFactors: 'العوامل المؤثرة على الثقة',

    // Professional Certifications Details
    certificationStatus: 'حالة الشهادة',
    activeCertification: 'نشطة',
    expiredCertification: 'منتهية الصلاحية',
    pendingCertification: 'في انتظار التحقق',
    certificationDocument: 'وثيقة الشهادة',
    uploadCertificationDocument: 'رفع وثيقة الشهادة',

    // Advanced Review Management
    respondToReview: 'الرد على المراجعة',
    reviewResponse: 'رد المراجعة',
    publicResponse: 'رد عام',
    privateNotes: 'ملاحظات خاصة',
    reviewDate: 'تاريخ المراجعة',
    clientReview: 'مراجعة العميل',
    yourResponse: 'ردك',
    noReviewsYet: 'لا توجد مراجعات بعد',
    waitingForReviews: 'ستتلقى مراجعات العملاء هنا بعد إكمال التقييمات',

    // Enhanced Contact Preferences
    contactMethodPreferences: 'تفضيلات طرق التواصل',
    contactPreferences: 'تفضيلات التواصل',
    phoneCallsLabel: 'المكالمات الهاتفية',
    emailLabel: 'البريد الإلكتروني',
    whatsappLabel: 'واتساب',
    preferred: 'مفضل',
    notPreferred: 'غير مفضل',
    notAvailable: 'غير متاح',
    preferredContactMethod: 'طريقة التواصل المفضلة',
    choosePreferredStyle: 'اختر النمط المفضل لديك',
    weeklySchedule: 'الجدول الأسبوعي',
    allTimesShownIn: 'جميع الأوقات معروضة بتوقيت {timezone}',
    timezoneLabel: 'المنطقة الزمنية',
    reviewsCount: 'مراجعات',
    noReviews: 'لا توجد مراجعات',
    confidenceLabel: 'الثقة:',
    allStatuses: 'جميع الحالات',
    inProgress: 'قيد التنفيذ',
    
    // Reviews section
    overallRating: 'التقييم العام',
    recentReviews: 'المراجعات الحديثة',
    verifiedClients: 'عملاء محققون',
    ratingBreakdown: 'تفصيل التقييمات',
    filterByRating: 'تصفية حسب التقييم',
    allRatings: 'جميع التقييمات',
    fiveStars: '5 نجوم',
    fourStars: '4 نجوم',
    threeStars: '3 نجوم',
    twoStars: 'نجمتان',
    oneStar: 'نجمة واحدة',
    sortBy: 'ترتيب حسب',
    mostRecent: 'الأحدث',
    featuredFirst: 'المميزة أولاً',
    highestRating: 'أعلى تقييم',
    lowestRating: 'أقل تقييم',
    mostHelpful: 'الأكثر إفادة',
    showOnlyVerified: 'إظهار المراجعات المحققة فقط',
    allReviews: 'جميع المراجعات',
    clientReviews: 'مراجعات العملاء',
    reviewsOf: '{count} من {total} مراجعة',
    noReviewsFound: 'لم يتم العثور على مراجعات',
    noReviewsMatchFilters: 'لا توجد مراجعات تطابق المرشحات الحالية.',
    noReviewsYet: 'لم يتلق هذا المقيم أي مراجعات بعد.',
    responseFromAppraiser: 'رد من المقيم',
    helpful: 'مفيد ({count})',
    reviewNumber: 'مراجعة رقم {number}',
    responseRate: 'معدل الاستجابة',
    totalHelpfulVotes: 'إجمالي الأصوات المفيدة',
    reviewGuidelines: 'جميع المراجعات تخضع للإشراف للتحقق من صحتها. المراجعات المحققة تأتي من عملاء مؤكدين أكملوا خدمات التقييم. المراجعات المميزة تسلط الضوء على التجارب الاستثنائية.',
    
    // Reviews page - additional translations
    responded: 'تمت الاستجابة',
    pendingResponse: 'في انتظار الرد',
    totalReviews: 'إجمالي المراجعات',
    noReviewsAvailable: 'لا توجد مراجعات متاحة',
    responseGuidelines: 'إرشادات الاستجابة',
    tipsForWritingResponses: 'نصائح لكتابة ردود فعالة على المراجعات',
    dontSection: "لا تفعل ❌",
    doSection: "افعل ✅",
    getDefensive: 'تتخذ موقفاً دفاعياً أو جدلياً',
    shareConfidentialInfo: 'تشارك معلومات العميل السرية',
    makeExcuses: 'تختلق أعذاراً للخدمة السيئة',
    usePromotionalLanguage: 'تستخدم لغة ترويجية مفرطة',
    thankClient: 'اشكر العميل على ملاحظاته',
    addressSpecificPoints: 'تناول النقاط المحددة المذكورة في المراجعة',
    maintainProfessionalTone: 'حافظ على نبرة مهنية ومهذبة',
    highlightCommitment: 'سلط الضوء على التزامك بالخدمة عالية الجودة',
    
    // Reports page - additional translations
    keyFindings: 'النتائج الرئيسية',
    propertyOverview: 'نظرة عامة على العقار',
    marketSummary: 'ملخص السوق',
    recommendations: 'التوصيات',
    executiveSummary: 'الملخص التنفيذي',
    propertyMarketAnalysis: 'تحليل العقار والسوق',
    legalMortgageAssessment: 'التقييم القانوني والرهن العقاري',
    investmentProjections: 'توقعات الاستثمار',
    legalStatusAnalysis: 'تحليل الوضع القانوني',
    complianceAssessment: 'تقييم الامتثال',
    mortgageEligibility: 'أهلية الرهن العقاري',
    riskFactors: 'عوامل المخاطر',
    investmentAnalysis: 'تحليل الاستثمار',
    rentalYieldCalculations: 'حسابات العائد الإيجاري',
    marketComparables: 'مقارنات السوق',
    riskAssessment: 'تقييم المخاطر',
    
    serviceAreas: 'مناطق الخدمة',
    
    // Features Section - Modern Design
    featuresTitle: 'ثورة في عالم العقارات',
    featuresSubtitle: 'للجميع',
    featuresDescription: 'سواء كنت تشتري أو تبيع أو تطور أو تستثمر - لدينا الحل المثالي المدعوم بالذكاء الاصطناعي والجولات الافتراضية الغامرة.',
    
    // Feature Cards
    virtualToursTitle: 'جولات افتراضية غامرة',
    virtualToursDescription: 'استكشف العقارات بجولات 360° تشعرك وكأنك موجود فعلاً هناك',
    virtualToursBadge: 'الأكثر شعبية',
    
    aiAssistantTitle: 'مساعد ذكي متطور',
    aiAssistantDescription: 'احصل على إرشادات عقارية فورية وتقييمات وتوصيات شخصية على مدار الساعة',
    aiAssistantBadge: 'متاح دائماً',
    
    multiLanguageTitle: 'إمكانية الوصول العالمية',
    multiLanguageDescription: 'تصفح العقارات بالعربية والإنجليزية ولغات أخرى مع ترجمة سلسة',
    multiLanguageBadge: 'بلغتك',
    
    remoteViewingTitle: 'شاهد العقارات من أي مكان',
    remoteViewingDescription: 'استكشف العقارات المصرية من السعودية والإمارات أو أي مكان في العالم',
    remoteViewingBadge: 'وصول عالمي',
    
    smartFilteringTitle: 'اعثر على التطابق المثالي',
    smartFilteringDescription: 'توصيات عقارية مدعومة بالذكاء الاصطناعي بناءً على تفضيلاتك وميزانيتك',
    smartFilteringBadge: 'نتائج شخصية',
    
    verifiedPropertiesTitle: 'قوائم عقارية موثوقة',
    verifiedPropertiesDescription: 'جميع العقارات محققة ومعتمدة لراحة بالك',
    verifiedPropertiesBadge: 'منصة موثوقة',
    
    // User Types
    propertyBuyers: 'مشتري العقارات',
    propertyBuyersDescription: 'اكتشف حلمك',
    propertySellers: 'بائعي العقارات',
    propertySellersDescription: 'بيع أسرع بـ 27%',
    realEstateDevelopers: 'مطوري العقارات',
    realEstateDevelopersDescription: 'اعرض المشاريع بذكاء',
    propertyInvestors: 'مستثمري العقارات',
    propertyInvestorsDescription: 'رؤى استثمارية ذكية',
    
    // Action Buttons
    experienceBeforeYouBuy: 'جرب قبل أن تشتري',
    startVirtualTour: 'ابدأ الجولة الافتراضية',
    exploreProperties: 'استكشف العقارات',
    
    primaryContactMethod: 'طريقة التواصل الأساسية',
    secondaryContactMethod: 'طريقة التواصل الثانوية',
    emergencyContactAvailable: 'متاح للتواصل الطارئ',
    businessHoursOnly: 'ساعات العمل فقط',
    afterHoursAvailable: 'متاح بعد ساعات العمل',
    communicationLanguages: 'لغات التواصل',

    // Advanced Scheduling
    workingHours: 'ساعات العمل',
    customSchedule: 'جدولة مخصصة',
    recurringAvailability: 'التوفر المتكرر',
    temporaryScheduleChange: 'تغيير مؤقت في الجدول',
    holidaySchedule: 'جدول العطلات',
    bufferTimeBetweenBookings: 'وقت فاصل بين الحجوزات',
    minimumBookingDuration: 'الحد الأدنى لمدة الحجز',
    maximumBookingsPerDay: 'الحد الأقصى للحجوزات يوميًا',

    // Service Area Management
    travelDistance: 'أقصى مسافة سفر',
    serviceFeeByDistance: 'رسوم الخدمة حسب المسافة',
    coverageMap: 'خريطة التغطية',
    additionalTravelFee: 'رسوم سفر إضافية',

    // Missing translations for loading and error states
    loadingDashboard: 'جارٍ تحميل لوحة تحكم المثمن...',
    appraiserNotFound: 'المثمن المطلوب غير موجود.',
    accessDenied: 'المثمن غير موجود أو تم رفض الوصول',
    notActiveAppraiser: 'هذا المستخدم ليس مثمنًا نشطًا',
    failedToLoadData: 'فشل في تحميل بيانات المثمن',
    unauthorizedVerification: 'غير مخول لعرض هذا التحقق',
    failedToLoadVerification: 'فشل في تحميل بيانات التحقق',

    // Status and Labels
    licensedAppraiser: 'مثمن مرخص',
    license: 'الترخيص',
    yearsExperienceShort: 'سنوات الخبرة',
    verifiedBadge: '✅ مثمن معتمد',
    verificationPending: '⏳ التحقق قيد الانتظار',
    certifiedBy: 'معتمد من قبل',

    // Profile Management
    basicInformation: 'المعلومات الأساسية',
    removeImage: 'إزالة الصورة',
    generateHeadshotAI: 'إنشاء صورة مهنية بالذكاء الاصطناعي',
    professionalSummary: 'الملخص المهني',

    // Services and Availability
    addNewService: 'إضافة خدمة جديدة',
    serviceName: 'اسم الخدمة',
    description: 'الوصف',
    propertyTypes: 'أنواع العقارات',
    yourServices: 'خدماتك',
    weeklyAvailability: 'التوفر الأسبوعي',
    breakTimeOptional: 'وقت الاستراحة (اختياري)',
    notes: 'ملاحظات',

    // Alerts and Actions
    completeVerificationTitle: 'أكمل التحقق من هويتك للظهور في القوائم العامة',
    completeVerificationDescription: 'لكي تكون مرئيًا للعملاء الذين يبحثون عن المثمنين، تحتاج إلى إكمال التحقق من الهوية. هذا يساعد في بناء الثقة وضمان المعايير المهنية.',
    completeVerificationButton: 'إكمال التحقق',
    completeProfileAlert: 'أكمل ملفك الشخصي للظهور العام',
    reviewsTitle: 'المراجعات'
  };

  // Profile Section Arabic
  (resources.ar.translation as any).profile = {
    // Step 1: Header & Form translations
    completeProfile: 'أكمل ملفك الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    dateOfBirth: 'تاريخ الميلاد',
    gender: 'الجنس',
    nationality: 'الجنسية',
    occupation: 'المهنة',
    company: 'الشركة',
    bio: 'السيرة الذاتية',
    enterFullName: 'أدخل اسمك الكامل',
    enterPhoneNumber: 'أدخل رقم هاتفك',
    enterNationality: 'أدخل جنسيتك',
    enterOccupation: 'أدخل مهنتك',
    enterCompany: 'أدخل اسم الشركة',
    tellUsAbout: 'أخبرنا عن نفسك',
    selectGender: 'اختر الجنس',
    male: 'ذكر',
    female: 'أنثى',
    other: 'آخر',
    preferNotToSay: 'أفضل عدم الذكر',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    saving: 'جارٍ الحفظ...',
    
    // Step 2: Profile display sections
    personalInfo: 'المعلومات الشخصية',
    professional: 'المهنية',
    about: 'حول',
    quickStats: 'إحصائيات سريعة',
    accountStatus: 'حالة الحساب',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    profile: 'الملف الشخصي',
    notProvided: 'غير محدد',
    verified: 'تم التحقق',
    pending: 'قيد الانتظار',
    notVerified: 'لم يتم التحقق',
    standard: 'عادي',
    savedProperties: 'العقارات المحفوظة',
    rentalBookings: 'حجوزات الإيجار',
    savedSearches: 'عمليات البحث المحفوظة',
    activityCount: 'عدد الأنشطة',
    
    // Step 3: Saved Items tab
    properties: 'العقارات',
    appraisers: 'المثمنون',
    savedAppraisers: 'المثمنون المحفوظون',
    refresh: 'تحديث',
    viewAll: 'عرض الكل',
    findMore: 'البحث عن المزيد',
    noSavedPropertiesYet: 'لا توجد عقارات محفوظة بعد',
    noSavedAppraisersYet: 'لا يوجد مثمنون محفوظون بعد',
    browseProperties: 'تصفح العقارات',
    browseAppraisers: 'تصفح المثمنين',
    beds: 'غرف',
    baths: 'حمامات',
    sqm: 'م²',
    noReviewsYet: 'لا توجد مراجعات بعد',
    yearsExp: 'سنوات خبرة',
    respondsIn: 'يرد خلال',
    saved: 'محفوظ',
    
    // Step 4: Rental Bookings tab
    myRentalBookings: 'حجوزات الإيجار الخاصة بي',
    noRentalBookingsYet: 'لا توجد حجوزات إيجار بعد',
    browseRentals: 'تصفح الإيجارات',
    guests: 'ضيوف',
    checkIn: 'تسجيل الوصول',
    checkOut: 'تسجيل المغادرة',
    totalAmount: 'المبلغ الإجمالي',
    qrCodes: 'أكواد QR',
    activeCodes: 'أكواد نشطة',
    qrCodesReady: 'أكواد QR جاهزة',
    qrCodesReadyMessage: 'أكواد QR الخاصة بك جاهزة للاستخدام. لديك {{count}} أكواد QR نشطة للوصول إلى العقار.',
    viewQrCodes: 'عرض أكواد QR',
    qrCodesPending: 'أكواد QR قيد الانتظار',
    qrCodesPendingMessage: 'سيتم توفير أكواد QR خلال 24-48 ساعة قبل تاريخ تسجيل الوصول من قبل فريق إدارة العقار.',
    qrCodesExpired: 'أكواد QR منتهية الصلاحية',
    qrCodesExpiredMessage: 'انتهت صلاحية أكواد QR الخاصة بهذا الحجز.',
    bookedOn: 'تم الحجز في',
    viewProperty: 'عرض العقار',
    leaveReview: 'ترك مراجعة',
    
    // Step 5: Viewing History tab
    recentViewingHistory: 'سجل المشاهدة الحديث',
    recentViews: 'مشاهدات حديثة',
    noViewingHistoryYet: 'لا يوجد سجل مشاهدة بعد',
    startBrowsingProperties: 'ابدأ تصفح العقارات',
    propertyNotFound: 'العقار غير موجود',
    viewed: 'تم المشاهدة',
    viewAgain: 'عرض مرة أخرى',
    
    // Step 6: Saved Searches & Appraisals tabs
    noSavedSearchesYet: 'لا توجد عمليات بحث محفوظة بعد',
    createYourFirstSearch: 'أنشئ أول بحث لك',
    alertFrequency: 'تكرار التنبيه',
    created: 'تم الإنشاء',
    active: 'نشط',
    paused: 'متوقف',
    runSearch: 'تشغيل البحث',
    
    myAppraisals: 'تقييماتي',
    appraisals: 'تقييمات',
    noAppraisalsYet: 'لا توجد تقييمات بعد',
    bookAppraiserMessage: 'احجز مثمن للحصول على تقييمات عقارية مهنية',
    findAppraisers: 'البحث عن مثمنين',
    propertyAppraisal: 'تقييم عقار',
    appraiser: 'المثمن',
    date: 'التاريخ',
    reference: 'المرجع',
    na: 'غير متوفر',
    marketValue: 'القيمة السوقية',
    confidence: 'الثقة',
    download: 'تحميل',
    
    placeholders: {
      fullName: 'أدخل اسمك الكامل',
      phoneNumber: 'أدخل رقم هاتفك',
      nationality: 'أدخل جنسيتك',
      occupation: 'أدخل مهنتك',
      company: 'أدخل اسم الشركة',
      bio: 'أخبرنا عن نفسك'
    }
  };

  // Rentals Section Arabic
  (resources.ar.translation as any).rentals = {
    pageTitle: 'إيجارات العطلات في مصر',
    pageDescription: 'اكتشف أماكن مذهلة للإقامة',
    vacationRentals: 'إيجارات العطلات',
    shortTermRentals: 'إيجارات قصيرة المدى',
    longTermRentals: 'إيجارات طويلة المدى',
    filterBy: 'تصفية حسب',
    location: 'الموقع',
    priceRange: 'نطاق السعر',
    propertyType: 'نوع العقار',
    amenities: 'المرافق',
    guestCapacity: 'سعة الضيوف',
    checkIn: 'تسجيل الوصول',
    checkOut: 'تسجيل المغادرة',
    guests: 'الضيوف',
    nightlyRate: 'السعر لليلة',
    weeklyRate: 'السعر الأسبوعي',
    monthlyRate: 'السعر الشهري',
    cleaningFee: 'رسوم التنظيف',
    serviceFee: 'رسوم الخدمة',
    securityDeposit: 'التأمين',
    totalPrice: 'السعر الإجمالي',
    instantBook: 'حجز فوري',
    hostApproval: 'موافقة المضيف',
    freeWifi: 'واي فاي مجاني',
    airConditioning: 'تكييف الهواء',
    swimmingPool: 'حمام سباحة',
    parking: 'مواقف السيارات',
    kitchen: 'مطبخ',
    washer: 'غسالة',
    balcony: 'شرفة',
    seaView: 'إطلالة على البحر',
    cityView: 'إطلالة على المدينة',
    gardenView: 'إطلالة على الحديقة',
    petFriendly: 'يسمح بالحيوانات الأليفة',
    familyFriendly: 'مناسب للعائلات',
    businessTravel: 'سفر عمل',
    quietNeighborhood: 'حي هادئ',
    nearBeach: 'قريب من الشاطئ',
    nearMetro: 'قريب من المترو',
    nearAirport: 'قريب من المطار',
    superhost: 'مضيف مميز',
    excellentLocation: 'موقع ممتاز',
    greatValue: 'قيمة رائعة',
    recentlyBooked: 'تم حجزه مؤخراً',
    availableDates: 'التواريخ المتاحة',
    minimumStay: 'الحد الأدنى للإقامة',
    maximumStay: 'الحد الأقصى للإقامة',
    houseRules: 'قوا投د المنزل',
    cancellationPolicy: 'سياسة الإلغاء',
    checkInTime: 'وقت تسجيل الوصول',
    checkOutTime: 'وقت تسجيل المغادرة',
    contactHost: 'تواصل مع المضيف',
    rentalDuration: 'مدة الإيجار',
    shortTermDaily: 'قصير المدى (يومياً)',
    longTermMonthly: 'طويل المدى (شهرياً)',
    minimumBedrooms: 'الحد الأدنى لغرف النوم',
    minimumBathrooms: 'الحد الأدنى للحمامات',
    specialFeatures: 'المميزات الخاصة',
    minimumRating: 'الحد الأدنى للتقييم',
    sortBy: 'ترتيب حسب',
    highestRated: 'الأعلى تقييماً',
    priceLowToHigh: 'السعر: من المنخفض إلى المرتفع',
    priceHighToLow: 'السعر: من المرتفع إلى المنخفض',
    newestFirst: 'الأحدث أولاً',
    distance: 'المسافة',
    advancedFilters: 'المرشحات المتقدمة',
    narrowDownSearch: 'اضبط بحثك باستخدام متطلبات محددة',
    nileView: 'إطلالة على النيل',
    hasReviews: 'له تقييمات',
    foundProperties: 'تم العثور على {{count}} عقار',
    updateResults: 'تحديث النتائج',
    
    // Missing keys
    rentalNotFound: 'لم يتم العثور على الإيجار',
    rentalNotFoundDescription: 'الإيجار الذي تبحث عنه غير موجود أو تم حذفه.',
    backToRentals: 'العودة للإيجارات',
    verifiedProperty: 'عقار موثق',
    securePayment: 'دفع آمن',
    support247: 'دعم 24/7',
    noPhotosAvailable: 'لا توجد صور متاحة',
    virtualTour: 'جولة افتراضية'
  };

  // Appraisal Form Section Arabic - Phase 1.1: Critical 20 Fields
  (resources.ar.translation as any).appraisalForm = {
    // Section Headers
    sections: {
      header: 'معلومات الرأس',
      basicProperty: 'معلومات العقار الأساسية', 
      coreBuilding: 'تفاصيل المبنى الأساسية',
      mainTitle: 'استمارة تقييم العقارات المصرية',
      mainDescription: 'تقييم شامل للعقار بناءً على معايير التقييم المصرية',
      appraisalInformation: 'معلومات التقييم',
      propertyLocation: 'موقع العقار',
      buildingInformation: 'معلومات المبنى',
      buildingDescription: 'تفاصيل ومواصفات المبنى المادية',
      professionalInformation: 'المعلومات المهنية',
      technicalSpecifications: 'المواصفات الفنية',
      systemDescriptions: 'وصف الأنظمة',
      basicPropertyInformation: 'معلومات العقار الأساسية',
      conditionAssessment: 'تقييم حالة العقار',
      conditionDescription: 'قيم حالة العقار على مقياس من 1-10',
      utilitiesServices: 'المرافق والخدمات',
      utilitiesDescription: 'المرافق المتاحة وخدمات المبنى',
      marketAnalysis: 'تحليل السوق',
      marketDescription: 'ظروف واتجاهات السوق المحلي',
      economicAnalysis: 'التحليل الاقتصادي (المعايير المصرية)',
      economicDescription: 'تحليل العمر الاقتصادي للمبنى والإهلاك',
      locationAnalysis: 'تحليل الموقع (المعايير المصرية)',
      locationDescription: 'خصائص الموقع والسوق التفصيلية',
      landValuation: 'تقييم الأرض (المعايير المصرية)',
      landDescription: 'تحليل قيمة الأرض وأفضل استخدام',
      roomSpecifications: 'مواصفات الغرف (المعايير المصرية)',
      roomDescription: 'مواصفات مفصلة لمواد كل غرفة على حدة',
      flooringMaterials: 'مواد الأرضيات',
      wallFinishes: 'تشطيبات الحوائط',
      valuationMethods: 'طرق التقييم (المعايير المصرية)',
      valuationDescription: 'الطرق الثلاث للتقييم والتوفيق النهائي',
      comparativeSalesAnalysis: 'تحليل البيوع المماثلة (المعايير المصرية)',
      comparativeSalesDescription: 'تحليل مبيعات العقارات المماثلة لدعم التقييم',
      professionalCertifications: 'الشهادات المهنية (المعايير المصرية)',
      professionalCertificationsDescription: 'الامتثال لمعايير التقييم المصرية والمتطلبات المهنية',
      advancedValuationComponents: 'مكونات التقييم المتقدمة',
      egyptianStandardsCompliance: 'الامتثال للمعايير المصرية',
      photosDocumentation: 'الصور والمستندات',
      photosDocumentationDescription: 'صور العقار والمستندات القانونية'
    },
    
    // Header Section Fields (5 fields)
    fields: {
      client_name: 'اسم العميل',
      requested_by: 'مطلوب من قبل',
      appraiser_name: 'اسم المقيم',
      registration_number: 'رقم التسجيل',
      report_type: 'نوع التقرير',
      
      // Basic Property Fields (8 fields)
      property_address_arabic: 'عنوان العقار (عربي)',
      property_address_english: 'عنوان العقار (إنجليزي)',
      district: 'المنطقة',
      city: 'المدينة',
      property_type: 'نوع العقار',
      bedrooms: 'غرف النوم',
      bathrooms: 'الحمامات',
      governorate: 'المحافظة',
      
      // Core Building Fields (7 fields)
      building_age_years: 'عمر المبنى (بالسنوات)',
      construction_type: 'نوع البناء',
      floor_number: 'رقم الطابق',
      unit_area_sqm: 'مساحة الوحدة (م²)',
      built_area_sqm: 'المساحة المبنية (م²)',
      land_area_sqm: 'مساحة الأرض (م²)',
      unit_number: 'رقم الوحدة',
      
      // Additional Form Fields
      appraisal_valid_until: 'صالح حتى تاريخ',
      building_number: 'رقم المبنى',
      finishing_level: 'مستوى التشطيب',
      floor_materials: 'مواد الأرضيات',
      wall_finishes: 'تشطيبات الحوائط',
      ceiling_type: 'نوع الأسقف',
      windows_type: 'نوع النوافذ',
      doors_type: 'نوع الأبواب',
      electrical_system_description: 'وصف النظام الكهربائي',
      sanitary_ware_description: 'وصف الأدوات الصحية',
      exterior_finishes_description: 'وصف التشطيبات الخارجية',
      overall_condition_rating: 'تقييم الحالة العامة',
      structural_condition: 'الحالة الإنشائية',
      mechanical_systems_condition: 'الأنظمة الميكانيكية',
      exterior_condition: 'الحالة الخارجية',
      interior_condition: 'الحالة الداخلية',
      reception_rooms: 'غرف الاستقبال',
      kitchens: 'المطابخ',
      parking_spaces: 'أماكن الركن',
      total_floors: 'إجمالي الطوابق',
      year_built: 'سنة البناء',
      balcony_area_sqm: 'مساحة البلكونة (م²)',
      garage_area_sqm: 'مساحة الجراج (م²)',
      entrance: 'المدخل',
      orientation: 'الاتجاه',
      inspection_date: 'تاريخ المعاينة',
      report_issue_date: 'تاريخ إصدار التقرير',
      signature_date: 'تاريخ التوقيع',
      report_validity_months: 'صلاحية التقرير (بالشهور)',
      certification_authority: 'جهة الاعتماد',
      funding_source: 'مصدر التمويل',
      
      // Utilities & Services
      electricity_available: 'الكهرباء متوفرة',
      water_supply_available: 'إمدادات المياه متوفرة',
      sewage_system_available: 'نظام الصرف الصحي متوفر',
      gas_supply_available: 'إمدادات الغاز متوفرة',
      telephone_available: 'الهاتف متوفر',
      internet_fiber_available: 'الإنترنت/الألياف متوفر',
      elevator_available: 'المصعد متوفر',
      parking_available: 'موقف السيارات متوفر',
      security_system: 'نظام الأمان',
      nearby_services: 'الخدمات القريبة',
      
      // Market Analysis
      market_trend: 'اتجاه السوق',
      demand_supply_ratio: 'نسبة الطلب/العرض',
      price_per_sqm_area: 'سعر المنطقة للمتر المربع (جنيه)',
      time_to_sell: 'وقت البيع (بالشهور)',
      price_per_sqm_semi_finished: 'سعر المتر نصف تشطيب',
      price_per_sqm_fully_finished: 'سعر المتر تشطيب كامل',
      
      // Economic Analysis
      economic_life_years: 'العمر الاقتصادي (بالسنوات)',
      current_age_ratio: 'نسبة العمر الحالي (%)',
      depreciation_rate_annual: 'معدل الإهلاك السنوي (%)',
      replacement_cost_new: 'تكلفة الإحلال الجديد (جنيه)',
      curable_depreciation_value: 'قيمة الإهلاك القابل للإصلاح (جنيه)',
      incurable_depreciation_value: 'قيمة الإهلاك غير القابل للإصلاح (جنيه)',
      total_depreciation_value: 'إجمالي قيمة الإهلاك (جنيه)',
      street_type: 'نوع الشارع',
      commercial_percentage: 'الاستخدام التجاري (%)',
      market_activity: 'نشاط السوق',
      property_liquidity: 'سيولة العقار',
      
      // Location Analysis
      time_on_market_months: 'وقت البقاء في السوق (بالشهور)',
      area_density: 'كثافة المنطقة',
      construction_volume: 'حجم البناء (م³)',
      location_description: 'وصف الموقع',
      nearby_services: 'الخدمات القريبة',
      funding_source: 'مصدر التمويل',
      area_character: 'طابع المنطقة',
      
      // Land Valuation
      land_value_per_sqm: 'قيمة الأرض للمتر المربع (جنيه)',
      total_building_land_area: 'إجمالي مساحة أرض المبنى (م²)',
      land_use_classification: 'تصنيف استخدام الأرض',
      highest_best_use_confirmed: 'تأكيد أفضل استخدام',
      land_value: 'قيمة الأرض (جنيه)',
      unit_land_share_value: 'قيمة حصة الوحدة من الأرض (جنيه)',
      unit_land_share_sqm: 'حصة الوحدة من الأرض (م²)',
      
      // Room Specifications
      reception_flooring: 'أرضية الاستقبال',
      kitchen_flooring: 'أرضية المطبخ',
      bathroom_flooring: 'أرضية الحمام',
      bedroom_flooring: 'أرضية غرفة النوم',
      terrace_flooring: 'أرضية التراس',
      reception_walls: 'حوائط الاستقبال',
      kitchen_walls: 'حوائط المطبخ',
      bathroom_walls: 'حوائط الحمام',
      bedroom_walls: 'حوائط غرفة النوم',
      
      // Valuation Methods
      cost_approach_value: 'قيمة طريقة التكلفة (جنيه)',
      sales_comparison_value: 'قيمة طريقة البيوع السابقة (جنيه)',
      income_approach_value: 'قيمة طريقة رسملة الدخل (جنيه)',
      final_reconciled_value: 'القيمة النهائية المتوافقة (جنيه)',
      recommended_method: 'الطريقة الموصى بها',
      monthly_rental_value: 'تقدير الإيجار الشهري (جنيه)',
      price_per_sqm_semi_finished: 'سعر المتر نصف تشطيب (جنيه)',
      price_per_sqm_fully_finished: 'سعر المتر تشطيب كامل (جنيه)',
      building_value: 'قيمة المبنى (جنيه)',
      unit_construction_cost: 'تكلفة إنشاء الوحدة (جنيه)',
      construction_cost_per_sqm: 'تكلفة الإنشاء للمتر المربع (جنيه/م²)',
      building_value_with_profit: 'قيمة المبنى مع الربح (جنيه)',
      
      // Comparable Sales
      comparable_sale_1_address: 'عنوان البيعة المماثلة 1',
      comparable_sale_1_date: 'تاريخ البيع',
      comparable_sale_1_price: 'سعر البيع (جنيه)',
      comparable_sale_1_area: 'المساحة (م²)',
      comparable_sale_1_price_per_sqm: 'سعر المتر المربع (جنيه)',
      comparable_sale_1_age: 'عمر المبنى (سنوات)',
      comparable_sale_1_finishing: 'مستوى التشطيب',
      comparable_sale_1_floor: 'رقم الطابق',
      comparable_sale_1_orientation: 'الاتجاه',
      comparable_sale_1_street: 'الشارع/المنظر',
      comparable_sale_2_address: 'عنوان البيعة المماثلة 2',
      comparable_sale_2_date: 'تاريخ البيع',
      comparable_sale_2_price: 'سعر البيع (جنيه)',
      comparable_sale_2_area: 'المساحة (م²)',
      comparable_sale_2_price_per_sqm: 'سعر المتر المربع (جنيه)',
      comparable_sale_2_age: 'عمر المبنى (سنوات)',
      comparable_sale_2_finishing: 'مستوى التشطيب',
      comparable_sale_2_floor: 'رقم الطابق',
      comparable_sale_2_orientation: 'الاتجاه',
      comparable_sale_2_street: 'الشارع/المنظر',
      comparable_sale_3_address: 'عنوان البيعة المماثلة 3',
      comparable_sale_3_date: 'تاريخ البيع',
      comparable_sale_3_price: 'سعر البيع (جنيه)',
      comparable_sale_3_area: 'المساحة (م²)',
      comparable_sale_3_price_per_sqm: 'سعر المتر المربع (جنيه)',
      comparable_sale_3_age: 'عمر المبنى (سنوات)',
      comparable_sale_3_finishing: 'مستوى التشطيب',
      comparable_sale_3_floor: 'رقم الطابق',
      comparable_sale_3_orientation: 'الاتجاه',
      comparable_sale_3_street: 'الشارع/المنظر',
      
      // Professional Certifications
      egyptian_standards_compliance: 'يلتزم بالمعايير المصرية للتقييم',
      professional_statement_confirmed: 'إقرار مهني مؤكد',
      report_validity_months: 'صلاحية التقرير (بالشهور)'
    },
    
    // Placeholders
    placeholders: {
      client_name: 'أدخل اسم العميل',
      requested_by: 'من طلب التقييم',
      appraiser_name: 'اسم المقيم المرخص',
      registration_number: 'رقم التسجيل المهني',
      property_address_arabic: 'عنوان العقار بالعربية',
      property_address_english: 'عنوان العقار بالإنجليزية',
      city: 'اسم المدينة',
      governorate: 'اسم المحافظة',
      floor_number: 'رقم الطابق',
      unit_number: 'رقم الوحدة',
      building_age_years: 'عمر المبنى بالسنوات',
      bedrooms: 'عدد غرف النوم',
      bathrooms: 'عدد الحمامات',
      unit_area_sqm: 'مساحة الوحدة بالمتر المربع',
      built_area_sqm: 'المساحة المبنية بالمتر المربع',
      land_area_sqm: 'مساحة الأرض بالمتر المربع',
      building_number: 'رقم المبنى',
      entrance: 'معلومات المدخل',
      orientation: 'اتجاه العقار',
      balcony_area_sqm: 'مساحة البلكونة بالمتر المربع',
      garage_area_sqm: 'مساحة الجراج بالمتر المربع',
      reception_rooms: 'عدد غرف الاستقبال',
      kitchens: 'عدد المطابخ',
      parking_spaces: 'عدد أماكن الركن',
      total_floors: 'إجمالي طوابق المبنى',
      year_built: 'سنة بناء العقار',
      ceiling_type: 'مثال: معلق، خرساني، زخرفي',
      electrical_system_description: 'وصف التركيبات الكهربائية، الأسلاك، المخارج، الإضاءة...',
      sanitary_ware_description: 'وصف الحمامات، التركيبات، جودة السباكة...',
      exterior_finishes_description: 'وصف الواجهات الخارجية، الدهانات، الكسوة، البلكونات...',
      replacement_cost_new: 'مثال: 1500000 - تكلفة البناء الجديد اليوم',
      curable_depreciation_value: 'مثال: 50000 - إهلاك يمكن إصلاحه اقتصادياً',
      incurable_depreciation_value: 'مثال: 112800 - إهلاك لا يمكن إصلاحه اقتصادياً',
      construction_volume: 'حجم البناء بالمتر المكعب',
      location_description: 'وصف خصائص الموقع',
      area_character: 'وصف طابع المنطقة والحي',
      
      // Room Specifications Placeholders
      flooring_material: 'اختر نوع الأرضية',
      wall_finish: 'اختر تشطيب الحائط',
      
      // Valuation Methods Placeholders
      recommended_method: 'اختر الطريقة',
      comparable_sale_1_finishing: 'مثال: تشطيب فاخر',
      comparable_sale_1_orientation: 'مثال: بحري',
      comparable_sale_1_street: 'مثال: على حديقة',
      comparable_sale_2_finishing: 'مثال: نصف تشطيب',
      comparable_sale_2_orientation: 'مثال: بحري',
      comparable_sale_2_street: 'مثال: على شارع فرعي',
      comparable_sale_3_age: 'عمر المبنى',
      comparable_sale_3_finishing: 'مستوى التشطيب',
      comparable_sale_3_orientation: 'اتجاه الوحدة',
      comparable_sale_3_street: 'نوع الشارع والمنظر',
      sales_comparison_value: 'بناءً على البيوع المماثلة',
      
      // New dropdown placeholders
      ceiling_type: 'اختر نوع السقف',
      finishing_level: 'اختر مستوى التشطيب',
      orientation: 'اختر الاتجاه',
      street_view: 'اختر نوع المنظر',
      
      // Professional Certifications
      report_validity_months: 'فترة صلاحية التقرير بالشهور',
      egyptian_standards_compliance: 'المعايير المصرية للتقييم',
      professional_statement_confirmed: 'أشهد أنني خبير التقييم',
      
      // Egyptian Standards Compliance
      physical_inspection_completed: 'تم إكمال المعاينة الفعلية',
      highest_best_use_applied: 'تم تطبيق أفضل استخدام',
      no_ownership_disputes: 'لا توجد منازعات ملكية',
      professional_independence_declared: 'تم إعلان الاستقلالية المهنية',
      market_value_definition_applied: 'تم تطبيق تعريف القيمة السوقية',
      
      // Property Information Auto-filled
      property_type_arabic: 'نوع العقار (عربي)',
      property_information_auto_filled: 'معلومات العقار (تملأ تلقائياً)',
      
      // Report Information
      report_information: 'معلومات التقرير',
      inspection_date: 'تاريخ المعاينة',
      report_issue_date: 'تاريخ إصدار التقرير',
      signature_date: 'تاريخ التوقيع',
      
      // Professional Certification Details
      certification_authority: 'جهة الاعتماد',
      fra_resolution: 'قرار الهيئة',
      resolution_date: 'تاريخ القرار',
      report_validity: 'صلاحية التقرير',
      months: 'شهور'
    },
    
    // Enum Options
    options: {
      report_types: {
        full_appraisal: 'سردي متكامل',
        update: 'سردي محدود', 
        summary: 'مختصر',
        restricted: 'مقيد'
      },
      property_types: {
        apartment: 'شقة',
        villa: 'فيلا', 
        townhouse: 'تاون هاوس',
        penthouse: 'بنت هاوس',
        studio: 'استوديو',
        duplex: 'دوبلكس',
        commercial: 'تجاري',
        industrial: 'صناعي',
        land: 'أرض'
      },
      construction_types: {
        concrete: 'خرسانة مسلحة',
        brick: 'بناء بالطوب',
        steel: 'هيكل فولاذي', 
        mixed: 'بناء مختلط'
      },
      finishing_levels: {
        core_shell: 'هيكل خرساني',
        semi_finished: 'تشطيب نصف كامل',
        fully_finished: 'تشطيب كامل',
        luxury: 'تشطيب فاخر'
      },
      conditions: {
        excellent: 'ممتاز',
        good: 'جيد', 
        fair: 'مقبول',
        poor: 'ضعيف'
      },
      windows_types: {
        aluminum: 'ألومنيوم',
        wood: 'خشب',
        upvc: 'يو بي في سي',
        steel: 'حديد'
      },
      market_trends: {
        rising: 'صاعد',
        stable: 'مستقر',
        declining: 'هابط'
      },
      street_types: {
        main_street: 'شارع رئيسي',
        side_street: 'شارع فرعي',
        internal_street: 'شارع داخلي'
      },
      liquidity_levels: {
        high: 'عالية',
        medium: 'متوسطة',
        low: 'منخفضة'
      },
      condition_ratings: {
        poor: 'ضعيف',
        fair: 'مقبول', 
        good: 'جيد',
        excellent: 'ممتاز',
        poor_range: 'ضعيف (1-3)',
        fair_range: 'مقبول (4-6)',
        good_range: 'جيد (7-8)',
        excellent_range: 'ممتاز (9-10)'
      },
      area_density: {
        crowded: 'مزدحمة',
        moderate: 'متوسطة',
        sparse: 'قليلة الكثافة'
      },
      doors_types: {
        wood: 'خشب',
        metal: 'معدن',
        steel: 'حديد',
        glass: 'زجاج',
        upvc: 'يو بي في سي',
        pvc: 'بي في سي',
        aluminum: 'ألومنيوم',
        composite: 'مركب',
        security_steel: 'معدن أمني',
        solid_wood: 'خشب صلب',
        mdf: 'إم دي إف'
      },
      flooring_materials: {
        ceramic: 'سيراميك',
        porcelain: 'بورسلين',
        marble: 'رخام',
        granite: 'جرانيت',
        parquet: 'باركيه',
        laminate: 'لامينيت',
        vinyl: 'فينيل',
        carpet: 'موكيت',
        terrazzo: 'تيرازو',
        natural_stone: 'حجر طبيعي',
        mosaic: 'موزاييك',
        concrete: 'خرسانة',
        tiles: 'بلاط'
      },
      wall_finishes: {
        plastic_paint: 'دهانات بلاستيك',
        oil_paint: 'دهانات زيتية',
        wallpaper: 'ورق حائط',
        stone_cladding: 'كسوة حجرية',
        wood_panels: 'ألواح خشبية',
        gypsum_board: 'ألواح جبس',
        ceramic_tiles: 'سيراميك',
        stainless_steel: 'ستانلس ستيل',
        glass: 'زجاج',
        waterproof_paint: 'دهانات مقاومة للماء'
      },
      valuation_methods: {
        cost_approach: 'طريقة التكلفة',
        sales_comparison: 'طريقة البيوع السابقة',
        income_approach: 'طريقة رسملة الدخل'
      },
      ceiling_types: {
        suspended: 'سقف معلق',
        concrete: 'سقف خرساني',
        decorative: 'سقف زخرفي',
        gypsum_board: 'ألواح جبس',
        wood: 'سقف خشبي',
        metal: 'سقف معدني',
        pvc: 'سقف بي في سي',
        acoustic: 'سقف صوتي',
        plastic_paint: 'دهانات بلاستيك'
      },
      orientations: {
        north: 'بحري',
        south: 'قبلي',
        east: 'شرقي',
        west: 'غربي',
        northeast: 'شمال شرقي',
        northwest: 'شمال غربي',
        southeast: 'جنوب شرقي',
        southwest: 'جنوب غربي'
      },
      street_views: {
        garden_view: 'على حديقة',
        main_street: 'شارع رئيسي',
        side_street: 'شارع فرعي',
        internal_street: 'شارع داخلي',
        sea_view: 'منظر بحري',
        nile_view: 'منظر نيلي',
        park_view: 'منظر متنزه',
        building_view: 'منظر مباني'
      }
    },
    
    // Field Descriptions
    descriptions: {
      // Economic Analysis Descriptions
      economic_life_years: 'العمر الاقتصادي المتوقع للمبنى',
      current_age_ratio: 'العمر الحالي / العمر الاقتصادي * 100',
      depreciation_rate_annual: 'معدل الإهلاك السنوي',
      replacement_cost_new: 'تكلفة البناء الجديد اليوم',
      curable_depreciation_value: 'الإهلاك القابل للإصلاح اقتصادياً',
      incurable_depreciation_value: 'الإهلاك غير القابل للإصلاح اقتصادياً',
      total_depreciation_value: 'إجمالي الإهلاك (قابل + غير قابل للإصلاح)',
      demand_supply_ratio: '1.0 = متوازن، >1.0 = طلب عالي',
      price_per_sqm_area: 'متوسط سعر المتر المربع في المنطقة',
      
      // Location Analysis Descriptions
      time_on_market_months: 'متوسط وقت بقاء العقارات في السوق بهذه المنطقة',
      area_density: 'خصائص الكثافة السكانية والعمرانية',
      construction_volume: 'إجمالي حجم البناء بالمتر المكعب',
      location_description: 'وصف شامل لخصائص الموقع',
      nearby_services: 'الخدمات والمرافق المتاحة في الجوار',
      area_character: 'الطابع العام وطبيعة الحي',
      commercial_percentage: 'نسبة الاستخدام التجاري في المنطقة',
      funding_source: 'مصدر تمويل العقار',
      
      // Land Valuation Descriptions
      land_value_per_sqm: 'قيمة الأرض للمتر المربع',
      total_building_land_area: 'إجمالي مساحة أرض المبنى',
      unit_land_share_sqm: 'حصة الوحدة في إجمالي مساحة الأرض',
      land_use_classification: 'تصنيف استخدام الأرض الحالي',
      
      // Valuation Methods Descriptions
      cost_approach_value: 'تكلفة الإحلال ناقص الإهلاك',
      sales_comparison_value: 'بناءً على البيوع المماثلة',
      income_approach_value: 'قيمة رسملة الدخل',
      final_reconciled_value: 'القيمة النهائية المقيمة',
      recommended_method: 'الطريقة الأكثر موثوقية لهذا العقار',
      monthly_rental_value: 'قيمة الإيجار الشهري السوقي',
      price_per_sqm_semi_finished: 'سعر السوق للمتر المربع للوحدات نصف المشطبة',
      price_per_sqm_fully_finished: 'سعر السوق للمتر المربع للوحدات كاملة التشطيب',
      land_value: 'إجمالي قيمة الأرض',
      building_value: 'قيمة المبنى/الهيكل',
      unit_land_share_value: 'قيمة حصة الوحدة النسبية من الأرض',
      unit_construction_cost: 'تكلفة إنشاء هذه الوحدة',
      construction_cost_per_sqm: 'تكلفة الإنشاء للمتر المربع',
      building_value_with_profit: 'قيمة المبنى بما في ذلك ربح المطور'
    },
    
    // Notes and Standards
    notes: {
      egyptianStandardsNote: 'ملاحظة المعايير المصرية:',
      finalValueReconciliation: 'يجب التوفيق بين القيمة النهائية مع مراعاة موثوقية كل منهج بناءً على بيانات السوق المتاحة ونوع العقار',
      comparableSalesNote: 'يجب أن تكون البيوع المماثلة حديثة (خلال 12 شهرًا) ومماثلة في الحجم والموقع ونوع العقار',
      comparableSalesAdjustments: 'يجب إجراء تعديلات للفروق في العمر والحالة ومستوى الطابق والمنظر',
      legalStandardsNote: 'ملاحظة: سيتم تضمين هذا القسم تلقائياً في تقرير PDF مع البنود القانونية المصرية المعيارية وتفاصيل العقار الخاصة بك. الافتراضات والقيود القانونية وفقاً لمعايير تقييم العقارات المصرية (قرار الهيئة 39 لسنة 2015)',
      egyptianFinancialRegulatoryAuthority: 'الهيئة العامة للرقابة المالية'
    },
    
    // Photos and Documentation
    photosDocumentation: {
      extractedPropertyImages: 'صور العقار المستخرجة',
      imagesAutomaticallyExtracted: 'صورة تم استخراجها تلقائياً من مستند التقييم',
      aiExtracted: 'مُستخرج بالذكاء الاصطناعي',
      propertyPhotos: 'صور العقار',
      uploadPropertyPhotos: 'رفع صور العقار',
      propertyPhotosFormat: 'PNG, JPG, GIF حتى 10 ميجابايت لكل صورة',
      aerialPhotos: 'الصور الجوية',
      uploadAerialPhotos: 'رفع الصور الجوية/الفضائية',
      aerialPhotosDescription: 'صور من الطائرة بدون طيار أو الأقمار الصناعية',
      floorPlan: 'المخطط الأساسي',
      uploadFloorPlan: 'رفع المخطط الأساسي',
      floorPlanFormat: 'PDF, PNG, JPG',
      legalDocuments: 'المستندات القانونية',
      uploadLegalDocuments: 'رفع المستندات القانونية',
      legalDocumentsDescription: 'سند الملكية، التصاريح، الشهادات',
      uploadNote: 'جميع المستندات المرفوعة سيتم تخزينها بأمان وإدراجها في تقرير التقييم النهائي. الصور عالية الجودة تحسن دقة التقييم.',
      noFileChosen: 'لم يتم اختيار ملف'
    },
    
    // Calculated Property Value
    calculatedPropertyValue: {
      title: 'القيمة المحسوبة للعقار',
      description: 'محسوبة تلقائياً بناءً على معايير التقييم المصرية',
      confidence: 'الثقة',
      marketValue: 'القيمة السوقية',
      pricePerSqm: 'السعر للمتر المربع',
      landValue: 'قيمة الأرض',
      buildingValue: 'قيمة البناء',
      calculationBreakdown: 'تفصيل الحسابات',
      baseCost: 'التكلفة الأساسية',
      ageDepreciation: 'استهلاك العمر',
      conditionAdj: 'تعديل الحالة',
      locationAdj: 'تعديل الموقع',
      marketAdj: 'تعديل السوق'
    },
    
    // Validation Messages
    validation: {
      required: 'هذا الحقل مطلوب',
      min_value: 'القيمة يجب أن تكون أكبر من {{min}}',
      max_value: 'القيمة يجب أن تكون أقل من {{max}}',
      invalid_format: 'تنسيق غير صحيح',
      client_name_required: 'اسم العميل مطلوب',
      requested_by_required: 'مطلوب من قبل مطلوب',
      appraiser_name_required: 'اسم المقيم مطلوب',
      registration_number_required: 'رقم التسجيل مطلوب',
      property_address_arabic_required: 'عنوان العقار بالعربية مطلوب',
      property_address_english_required: 'عنوان العقار بالإنجليزية مطلوب',
      district_required: 'المنطقة مطلوبة',
      city_required: 'المدينة مطلوبة',
      governorate_required: 'المحافظة مطلوبة',
      building_age_required: 'عمر المبنى مطلوب',
      construction_type_required: 'نوع البناء مطلوب',
      property_type_required: 'نوع العقار مطلوب',
      bedrooms_required: 'عدد غرف النوم مطلوب',
      bathrooms_required: 'عدد الحمامات مطلوب',
      unit_area_required: 'مساحة الوحدة مطلوبة',
      built_area_required: 'المساحة المبنية مطلوبة',
      land_area_required: 'مساحة الأرض مطلوبة'
    }
  };

  // Booking Section Arabic
  (resources.ar.translation as any).booking = {
    bookingDetails: 'تفاصيل الحجز',
    serviceType: 'نوع الخدمة',
    propertyAppraisal: 'تقييم عقار',
    marketAnalysis: 'تحليل السوق',
    consultationSession: 'جلسة استشارة',
    documentReview: 'مراجعة المستندات',
    selectedAppraiser: 'المثمن المختار',
    selectedProperty: 'العقار المختار',
    bookingDate: 'تاريخ الحجز',
    bookingTime: 'وقت الحجز',
    duration: 'المدة',
    estimatedDuration: 'المدة المقدرة',
    serviceFee: 'رسوم الخدمة',
    platformFee: 'رسوم المنصة',
    totalAmount: 'المبلغ الإجمالي',
    paymentMethod: 'طريقة الدفع',
    creditCard: 'بطاقة ائتمان',
    debitCard: 'بطاقة خصم',
    bankTransfer: 'تحويل بنكي',
    mobileWallet: 'محفظة رقمية',
    paymentSummary: 'ملخص الدفع',
    bookingConfirmation: 'تأكيد الحجز',
    confirmBooking: 'تأكيد الحجز',
    modifyBooking: 'تعديل الحجز',
    cancelBooking: 'إلغاء الحجز',
    rescheduleBooking: 'إعادة جدولة الحجز',
    bookingStatus: 'حالة الحجز',
    pending: 'معلق',
    confirmed: 'مؤكد',
    inProgress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    contactInformation: 'معلومات التواصل',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    emailAddress: 'عنوان البريد الإلكتروني',
    alternativeContact: 'جهة اتصال بديلة',
    specialRequests: 'طلبات خاصة',
    accessInstructions: 'تعليمات الوصول',
    propertyAccess: 'الوصول للعقار',
    keyCollection: 'استلام المفاتيح',
    securityCode: 'كود الأمان',
    buildingAccess: 'الوصول للمبنى',
    additionalNotes: 'ملاحظات إضافية',
    bookingReference: 'مرجع الحجز',
    paymentReceipt: 'إيصال الدفع',
    serviceAgreement: 'اتفاقية الخدمة',
    termsConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    refundPolicy: 'سياسة الاسترداد',
    emergencyContact: 'جهة اتصال الطوارئ',
    bookingHistory: 'سجل الحجوزات',
    upcomingBookings: 'الحجوزات القادمة',
    pastBookings: 'الحجوزات السابقة',
    bookingReviews: 'مراجعات الحجز',
    rateService: 'تقييم الخدمة',
    leaveReview: 'ترك مراجعة',
    bookingSupport: 'دعم الحجز',
    helpCenter: 'مركز المساعدة',
    contactSupport: 'تواصل مع الدعم',
    reportIssue: 'الإبلاغ عن مشكلة'
  };

  // Footer Arabic
  (resources.ar.translation as any).footer = {
    description: 'نحن نثور في مجال العقارات بالجولات الافتراضية الغامرة والمساعدة الذكية.',
    properties: 'العقارات',
    apartments: 'الشقق',
    villas: 'الفيلات',
    penthouses: 'البنتهاوسات',
    services: 'الخدمات',
    virtualTours: 'الجولات الافتراضية',
    aiAssistance: 'المساعدة الذكية',
    propertyManagement: 'إدارة العقارات',
    contact: 'تواصل معنا',
    location: 'القاهرة، مصر',
    rights: 'جميع الحقوق محفوظة.'
  };

  // Add missing Arabic translation sections
  (resources.ar.translation as any).saved = {
    title: 'العقارات المحفوظة',
    signInPrompt: 'يرجى تسجيل الدخول لعرض العقارات المحفوظة',
    emptyState: 'لم تحفظ أي عقارات بعد.',
    errors: {
      loadFailed: 'فشل في تحميل العقارات المحفوظة. يرجى المحاولة مرة أخرى لاحقاً.'
    }
  };

  (resources.ar.translation as any).profile = {
    placeholders: {
      fullName: 'أدخل اسمك الكامل',
      phoneNumber: 'أدخل رقم هاتفك',
      nationality: 'أدخل جنسيتك',
      occupation: 'أدخل مهنتك',
      company: 'أدخل شركتك',
      bio: 'أخبرنا عن نفسك'
    }
  };

  (resources.ar.translation as any).admin = {
    search: {
      placeholder: 'ابحث بعنوان العقار أو المدينة أو اسم المالك...',
      minPrice: 'أدنى',
      maxPrice: 'أعلى'
    },
    filters: {
      status: 'الحالة',
      type: 'النوع',
      allCities: 'جميع المدن',
      anyRating: 'أي تقييم',
      allStatus: 'جميع الحالات'
    },
    actions: {
      viewDetails: 'عرض التفاصيل',
      editRental: 'تعديل الإيجار',
      deleteRental: 'حذف الإيجار'
    },
    status: {
      confirmed: 'مؤكد',
      cancelled: 'ملغي',
      pending: 'قيد الانتظار',
      failed: 'فشل'
    },
    errors: {
      loadingData: 'خطأ في تحميل البيانات'
    }
  };

  (resources.ar.translation as any).settings = {
    title: 'الإعدادات',
    description: 'إدارة تفضيلات حسابك والإعدادات',
    failedToSave: 'فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
    unableToLoad: 'غير قادر على تحميل الإعدادات.',
    tryAgain: 'حاول مرة أخرى',
    
    // Property types
    apartment: 'شقة',
    villa: 'فيلا',
    townhouse: 'تاون هاوس',
    studio: 'استوديو',
    duplex: 'دوبلكس',
    penthouse: 'بنتهاوس',
    
    // Section navigation
    notifications: 'الإشعارات',
    privacySecurity: 'الخصوصية والأمان',
    appearance: 'المظهر',
    preferences: 'التفضيلات',
    searchDefaults: 'إعدادات البحث الافتراضية',
    
    // Notifications section
    notificationPreferences: 'تفضيلات الإشعارات',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    smsNotifications: 'إشعارات الرسائل النصية',
    pushNotifications: 'الإشعارات المباشرة',
    property_updates: 'تحديثات العقارات',
    saved_search_alerts: 'تنبيهات البحث المحفوظ',
    inquiry_responses: 'ردود الاستفسارات',
    newsletter: 'النشرة الإخبارية',
    marketing: 'التسويق',
    urgent_only: 'الطارئ فقط',
    chat_messages: 'رسائل الدردشة',
    
    // Privacy section
    profileVisibility: 'رؤية الملف الشخصي',
    profileVisibilityDesc: 'تحكم في من يمكنه رؤية معلومات ملفك الشخصي',
    public: 'عام',
    private: 'خاص',
    contactsOnly: 'جهات الاتصال فقط',
    showActivity: 'إظهار النشاط',
    showActivityDesc: 'السماح للآخرين برؤية نشاط مشاهدة العقارات الخاص بك',
    allowContact: 'السماح بالتواصل',
    allowContactDesc: 'السماح للوكلاء والمستخدمين الآخرين بالتواصل معك',
    
    // Appearance section
    theme: 'السمة',
    light: 'فاتح',
    dark: 'داكن',
    auto: 'تلقائي',
    language: 'اللغة',
    english: 'English',
    arabic: 'العربية',
    currency: 'العملة',
    egp: 'الجنيه المصري (EGP)',
    usd: 'الدولار الأمريكي (USD)',
    eur: 'اليورو (EUR)',
    
    // Search defaults section
    defaultSearchRadius: 'نطاق البحث الافتراضي (كم)',
    defaultPropertyTypes: 'أنواع العقارات الافتراضية',
    defaultPriceRange: 'نطاق السعر الافتراضي',
    minimum: 'الحد الأدنى',
    maximum: 'الحد الأقصى',
    minPrice: 'أقل سعر',
    maxPrice: 'أعلى سعر',
    
    // Save section
    settingsSaved: 'تم حفظ الإعدادات بنجاح',
    saving: 'جارٍ الحفظ...',
    saveChanges: 'حفظ التغييرات',
    
    sections: {
      notifications: 'تفضيلات الإشعارات',
      privacy: 'الخصوصية والأمان',
      appearance: 'المظهر',
      searchDefaults: 'إعدادات البحث الافتراضية'
    },
    notifications: {
      sms: 'إشعارات الرسائل النصية',
      push: 'الإشعارات المدفوعة'
    },
    privacy: {
      public: 'عام',
      private: 'خاص',
      contactsOnly: 'جهات الاتصال فقط'
    },
    currencies: {
      egp: 'الجنيه المصري (EGP)',
      usd: 'الدولار الأمريكي (USD)',
      eur: 'اليورو (EUR)'
    }
  };

  (resources.ar.translation as any).quickFilters = {
    underBudget: 'أقل من 150 ألف دولار',
    newListings: 'إعلانات جديدة',
    withPool: 'مع مسبح',
    cityViews: 'إطلالات المدينة',
    parking: 'موقف سيارات',
    furnished: 'مفروش'
  };

  // Update existing sections with missing keys
  if ((resources.ar.translation as any).auth) {
    (resources.ar.translation as any).auth.passwordRequirementsTitle = 'متطلبات كلمة المرور:';
    (resources.ar.translation as any).auth.passwordLengthRequirement = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
    (resources.ar.translation as any).auth.chooseAccountType = 'اختر نوع حسابك';
    (resources.ar.translation as any).auth.completingSignIn = 'جارٍ إكمال تسجيل الدخول...';
    (resources.ar.translation as any).auth.confirmNewPassword = 'تأكيد كلمة المرور الجديدة';
  }

  if ((resources.ar.translation as any).properties) {
    (resources.ar.translation as any).properties.loadingProperty = 'جارٍ تحميل العقار...';
    (resources.ar.translation as any).properties.translating = 'جارٍ الترجمة...';
    (resources.ar.translation as any).properties.browseProperties = 'تصفح العقارات';
    (resources.ar.translation as any).properties.backToHome = 'العودة للرئيسية';
    (resources.ar.translation as any).properties.licensedPropertyAppraiser = 'مثمن عقاري مرخص';
    (resources.ar.translation as any).properties.experience = 'الخبرة:';
    (resources.ar.translation as any).properties.specialties = 'التخصصات:';
    (resources.ar.translation as any).properties.serviceAreas = 'مناطق الخدمة:';
    (resources.ar.translation as any).properties.verified = 'معتمد';
    (resources.ar.translation as any).properties.noAppraiser = 'لم يتم تعيين مثمن لهذا العقار';
    (resources.ar.translation as any).properties.contactForAppraisal = 'تواصل معنا للحصول على خدمات تقييم مهنية';
  }

  if ((resources.ar.translation as any).rentals) {
    (resources.ar.translation as any).rentals.verifiedProperty = 'عقار معتمد';
    (resources.ar.translation as any).rentals.securePayment = 'دفع آمن';
    (resources.ar.translation as any).rentals.noPhotosAvailable = 'لا توجد صور متاحة';
    (resources.ar.translation as any).rentals.fullyFurnished = 'مفروش بالكامل';
    (resources.ar.translation as any).rentals.petFriendly = 'مناسب للحيوانات الأليفة';
    (resources.ar.translation as any).rentals.modernConstruction = 'بناء حديث';
    (resources.ar.translation as any).rentals.aboutPlace = 'عن هذا المكان';
    (resources.ar.translation as any).rentals.wifi = 'واي فاي';
    (resources.ar.translation as any).rentals.airConditioning = 'تكييف هواء';
    (resources.ar.translation as any).rentals.heating = 'تدفئة';
    (resources.ar.translation as any).rentals.kitchen = 'مطبخ';
    (resources.ar.translation as any).rentals.tv = 'تلفزيون';
    (resources.ar.translation as any).rentals.washingMachine = 'غسالة';
    (resources.ar.translation as any).rentals.parking = 'موقف سيارات';
    (resources.ar.translation as any).rentals.pool = 'مسبح';
    (resources.ar.translation as any).rentals.gym = 'نادي رياضي';
    (resources.ar.translation as any).rentals.security = 'حارس أمن';
    (resources.ar.translation as any).rentals.rentalNotFound = 'الإيجار غير موجود';
    (resources.ar.translation as any).rentals.rentalNotFoundDescription = 'قائمة الإيجار التي تبحث عنها غير موجودة أو تم حذفها.';
  }

  // Payment Success Arabic translations
  if ((resources.ar.translation as any).payment) {
    // Already exists - extend payment section
    (resources.ar.translation as any).payment.success = {
      ...(resources.ar.translation as any).payment.success,
    };
  } else {
    (resources.ar.translation as any).payment = {
      success: {}
    };
  }

  // Profile and Settings Arabic translations
  (resources.ar.translation as any).profile = {
    // Header and navigation
    completeProfile: 'أكمل ملفك الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    cancel: 'إلغاء',
    signOut: 'تسجيل الخروج',
    emailVerified: 'البريد الإلكتروني موثق',
    phoneVerified: 'الهاتف موثق',
    profileVerified: 'الملف الشخصي موثق',
    
    // Navigation tabs
    overview: 'نظرة عامة',
    savedItems: 'العناصر المحفوظة',
    myAppraisals: 'تقييماتي',
    myRentals: 'إيجاراتي',
    viewingHistory: 'تاريخ المشاهدة',
    savedSearches: 'عمليات البحث المحفوظة',
    settings: 'الإعدادات',
    
    // Form fields
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    dateOfBirth: 'تاريخ الميلاد',
    gender: 'الجنس',
    nationality: 'الجنسية',
    occupation: 'المهنة',
    company: 'الشركة',
    bio: 'السيرة الذاتية',
    
    // Form placeholders
    enterFullName: 'أدخل اسمك الكامل',
    enterPhoneNumber: 'أدخل رقم هاتفك',
    selectGender: 'اختر الجنس',
    enterNationality: 'أدخل جنسيتك',
    enterOccupation: 'أدخل مهنتك',
    enterCompany: 'أدخل شركتك',
    tellUsAbout: 'أخبرنا عن نفسك',
    
    // Gender options
    male: 'ذكر',
    female: 'أنثى',
    other: 'آخر',
    preferNotToSay: 'أفضل عدم القول',
    
    // Profile sections
    personalInfo: 'المعلومات الشخصية',
    professional: 'المهنية',
    about: 'نبذة عني',
    quickStats: 'إحصائيات سريعة',
    accountStatus: 'حالة الحساب',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    
    // Status labels
    notProvided: 'غير مقدم',
    verified: 'موثق',
    pending: 'في انتظار',
    notVerified: 'غير موثق',
    standard: 'عادي',
    
    // Stats
    savedProperties: 'العقارات المحفوظة',
    rentalBookings: 'حجوزات الإيجار',
    savedSearches: 'عمليات البحث المحفوظة',
    activityCount: 'عدد الأنشطة',
    
    // Actions
    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    refresh: 'تحديث',
    viewAll: 'عرض الكل',
    
    // Messages
    pleaseSignIn: 'يرجى تسجيل الدخول لعرض ملفك الشخصي.',
    signIn: 'تسجيل الدخول',
    failedToSave: 'فشل في حفظ الملف الشخصي. يرجى المحاولة مرة أخرى.',
    
    // Saved items sub-tabs
    properties: 'العقارات',
    appraisers: 'المثمنون',
    browseProperties: 'تصفح العقارات',
    findAppraisers: 'العثور على مثمنين',
    browseAppraisers: 'تصفح المثمنين',
    findMore: 'العثور على المزيد',
    
    // Empty states
    noSavedProperties: 'لا توجد عقارات محفوظة بعد',
    noSavedAppraisers: 'لا يوجد مثمنون محفوظون بعد',
    noRentalBookings: 'لا توجد حجوزات إيجار بعد',
    noViewingHistory: 'لا يوجد تاريخ مشاهدة بعد',
    noSavedSearches: 'لا توجد عمليات بحث محفوظة بعد',
    noAppraisals: 'لا توجد تقييمات بعد',
    
    // Browse links
    browseRentals: 'تصفح الإيجارات',
    startBrowsingProperties: 'ابدأ تصفح العقارات',
    createFirstSearch: 'أنشئ بحثك الأول',
    
    // Appraisal section
    bookAppraiser: 'احجز مثمن للحصول على تقييمات عقارية مهنية',
    findAppraisersLink: 'العثور على مثمنين',
    yearsExp: 'سنوات خبرة',
    respondsIn: 'يجيب خلال',
    hours: 'س',
    more: 'أكثر',
    remove: 'إزالة',
    viewProfile: 'عرض الملف الشخصي',
    saved: 'محفوظ',
    noReviewsYet: 'لا توجد مراجعات بعد',
    
    // Rental bookings
    myRentalBookings: 'حجوزات الإيجار الخاصة بي',
    guests: 'ضيوف',
    checkIn: 'تسجيل الدخول',
    checkOut: 'تسجيل الخروج',
    totalAmount: 'المبلغ الإجمالي',
    qrCodes: 'أكواد QR',
    available: 'متاح',
    pending: 'في انتظار',
    qrCodesReady: 'أكواد QR جاهزة',
    qrCodesPending: 'أكواد QR في انتظار',
    qrCodesExpired: 'أكواد QR منتهية الصلاحية',
    qrCodesReadyDesc: 'أكواد QR الخاصة بك جاهزة للاستخدام. لديك {{count}} كود QR نشط للوصول للعقار.',
    qrCodesPendingDesc: 'سيتم توفير أكواد QR قبل 24-48 ساعة من تاريخ تسجيل دخولك من قبل فريق إدارة العقار.',
    qrCodesExpiredDesc: 'أكواد QR لهذا الحجز انتهت صلاحيتها.',
    viewQrCodes: 'عرض أكواد QR',
    activeCodes: 'أكواد نشطة',
    bookedOn: 'تم الحجز في',
    viewProperty: 'عرض العقار',
    leaveReview: 'اترك مراجعة',
    
    // Booking statuses
    confirmed: 'مؤكد',
    checkedIn: 'تم تسجيل الدخول',
    completed: 'مكتمل',
    
    // Viewing history
    recentViewingHistory: 'تاريخ المشاهدة الحديث',
    recentViews: 'مشاهدات حديثة',
    viewed: 'تمت المشاهدة',
    viewAgain: 'شاهد مرة أخرى',
    propertyNotFound: 'العقار غير موجود',
    beds: 'غرف نوم',
    baths: 'حمامات',
    sqm: 'متر مربع',
    
    // Saved searches
    alertFrequency: 'تكرار التنبيه',
    created: 'تم الإنشاء',
    active: 'نشط',
    paused: 'متوقف',
    runSearch: 'تشغيل البحث',
    
    // Client appraisals
    appraisals: 'تقييمات',
    propertyAppraisal: 'تقييم عقار',
    appraiser: 'المثمن',
    date: 'التاريخ',
    reference: 'المرجع',
    marketValue: 'القيمة السوقية',
    confidence: 'الثقة',
    download: 'تحميل',
    review: 'مراجعة',
    propertyType: 'نوع العقار',
    
    // Settings link
    accountSettings: 'إعدادات الحساب',
    detailedSettings: 'لإدارة الإعدادات التفصيلية، قم بزيارة صفحة الإعدادات المخصصة.',
    goToSettings: 'اذهب إلى الإعدادات'
  };

  (resources.ar.translation as any).settings = {
    // Page header
    accountSettings: 'إعدادات الحساب',
    personalInformation: 'المعلومات الشخصية',
    notificationPreferences: 'تفضيلات الإشعارات',
    privacySettings: 'إعدادات الخصوصية',
    searchPreferences: 'تفضيلات البحث',
    
    // Email notifications
    emailNotifications: 'إشعارات البريد الإلكتروني',
    propertyUpdates: 'تحديثات العقارات',
    savedSearchAlerts: 'تنبيهات البحث المحفوظ',
    inquiryResponses: 'ردود الاستفسارات',
    newsletter: 'النشرة الإخبارية',
    marketing: 'الاتصالات التسويقية',
    
    // SMS notifications
    smsNotifications: 'إشعارات الرسائل النصية',
    urgentOnly: 'العاجل فقط',
    
    // Push notifications
    pushNotifications: 'الإشعارات الفورية',
    chatMessages: 'رسائل الدردشة',
    
    // Appearance
    appearance: 'المظهر',
    theme: 'السمة',
    language: 'اللغة',
    currency: 'العملة',
    light: 'فاتح',
    dark: 'داكن',
    system: 'النظام',
    
    // Privacy
    privacy: 'الخصوصية',
    profileVisibility: 'رؤية الملف الشخصي',
    showActivity: 'إظهار النشاط',
    allowContact: 'السماح بالاتصال',
    public: 'عام',
    private: 'خاص',
    friendsOnly: 'الأصدقاء فقط',
    
    // Search preferences
    defaultSearchRadius: 'نطاق البحث الافتراضي',
    defaultPropertyTypes: 'أنواع العقارات الافتراضية',
    priceRange: 'نطاق السعر المفضل',
    minPrice: 'أدنى سعر',
    maxPrice: 'أعلى سعر',
    
    // Account security
    accountSecurity: 'أمان الحساب',
    changePassword: 'تغيير كلمة المرور',
    twoFactorAuth: 'المصادقة الثنائية',
    loginSessions: 'جلسات تسجيل الدخول',
    
    // Actions
    saveSettings: 'حفظ الإعدادات',
    resetToDefaults: 'إعادة تعيين للافتراضي',
    
    // Messages
    settingsSaved: 'تم حفظ الإعدادات بنجاح',
    settingsError: 'فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
    
    // Loading states
    loadingSettings: 'جاري تحميل الإعدادات...',
    savingSettings: 'جاري حفظ الإعدادات...'
  };

  // Broker Calendar Arabic
  (resources.ar.translation as any).calendar = {
    scheduleViewing: 'جدولة معاينة',
    chooseYourBroker: 'اختر وسيطك',
    selectDate: 'اختر التاريخ',
    availableTimes: 'الأوقات المتاحة',
    primary: 'رئيسي',
    yearsExperience: 'سنوات',
    slotsAvailable: 'مواعيد متاحة',
    noAvailableSlots: 'لا توجد مواعيد متاحة في هذا التاريخ.',
    tryDifferentDate: 'حاول اختيار تاريخ أو وسيط مختلف.',
    noBrokersAvailable: 'لا يوجد وسطاء متاحين لهذا العقار.',
    errorLoadingBrokers: 'فشل في تحميل الوسطاء',
    tryAgain: 'حاول مرة أخرى',
    monthNames: {
      january: 'يناير',
      february: 'فبراير',
      march: 'مارس',
      april: 'أبريل',
      may: 'مايو',
      june: 'يونيو',
      july: 'يوليو',
      august: 'أغسطس',
      september: 'سبتمبر',
      october: 'أكتوبر',
      november: 'نوفمبر',
      december: 'ديسمبر'
    },
    weekDays: {
      sunday: 'الأحد',
      monday: 'الاثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
      saturday: 'السبت'
    }
  };

  // Rental Payment Success Arabic
  (resources.ar.translation as any).paymentSuccess = {
    // Rental payment success
    rentalTitle: 'تم تأكيد حجز الإيجار!',
    rentalSubtitle: 'تم الدفع بنجاح وتم تأكيد حجزك',
    errorTitle: 'خطأ في الحجز',
    backToRentals: 'العودة للإيجارات',
    
    // Property and booking details
    propertyDetails: 'تفاصيل العقار',
    checkIn: 'تسجيل الدخول',
    checkOut: 'تسجيل الخروج',
    after: 'بعد',
    before: 'قبل',
    guests: 'ضيوف',
    nights: 'ليالي',
    
    // Payment information
    paymentSummary: 'ملخص الدفع',
    bookingId: 'رقم الحجز',
    transactionId: 'رقم المعاملة',
    paymentStatus: 'حالة الدفع',
    paid: 'مدفوع',
    totalPaid: 'إجمالي المدفوع',
    egp: 'جنيه مصري',
    
    // Contact and next steps
    contactInfo: 'معلومات الاتصال',
    nextSteps: 'الخطوات التالية',
    step1Title: 'تفاصيل التأكيد',
    step1Desc: 'ستتلقى تأكيدات عبر البريد الإلكتروني والرسائل النصية خلال 15 دقيقة',
    step2Title: 'اتصال المضيف',
    step2Desc: 'ستتواصل إدارة العقار معك قبل 24-48 ساعة من تسجيل الدخول',
    step3Title: 'وصول تسجيل الدخول',
    step3Desc: 'سيتم إرسال أكواد الوصول الرقمية والتعليمات قبل 24 ساعة من الوصول',
    
    // Special requests and features
    specialRequests: 'طلبات خاصة',
    digitalAccess: 'الوصول الرقمي',
    qrCodeDesc: 'سيكون كود QR للوصول متاحًا قبل 24 ساعة من تسجيل الدخول',
    
    // Actions
    downloadReceipt: 'تحميل الإيصال',
    browseMoreRentals: 'تصفح المزيد من الإيجارات',
    
    // Important information
    importantNote: 'مهم:',
    importantDesc: 'احتفظ بهذا التأكيد بأمان. ستحتاج رقم حجزك لتسجيل الدخول وأي طلبات دعم.',
    
    // Loading and error states
    loadingBookingDetails: 'جارٍ تحميل تفاصيل الحجز...',
    failedToLoadBooking: 'فشل في تحميل تفاصيل الحجز'
  };

  // Initialize i18n after all translations are added
  if (!i18n.isInitialized) {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'ar'],
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
          escapeValue: false,
        },
        detection: {
          order: ['localStorage', 'htmlTag', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: 'i18nextLng',
          checkWhitelist: true,
        },
        react: {
          useSuspense: false,
          bindI18n: 'languageChanged',
          bindI18nStore: '',
          transEmptyNodeValue: '',
          transSupportBasicHtmlNodes: true,
          transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
        },
      })
      .then(() => {
        console.log('✅ i18n initialized successfully')
      })
      .catch((error) => {
        console.error('❌ i18n initialization failed:', error)
        // Continue without throwing to prevent white screen
      });
  }
}

// Number translation utilities
export const formatNumber = (value: number | string, language: string = 'en'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return value.toString();
  
  // Only use locale-specific formatting on client side
  if (typeof window === 'undefined') {
    return num.toString();
  }
  
  if (language === 'ar') {
    return num.toLocaleString('ar-EG');
  }
  return num.toLocaleString('en-US');
};

export const formatPrice = (price: number | string, language: string = 'en', currency: string = 'EGP'): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return price.toString();
  
  // Server-side fallback
  if (typeof window === 'undefined') {
    return `$${num}`;
  }
  
  if (language === 'ar') {
    return `${num.toLocaleString('ar-EG')} ${currency === 'EGP' ? 'ج.م' : currency}`;
  }
  return `$${num.toLocaleString('en-US')}`;
};

export const translateNumbers = (text: string, toArabic: boolean = false): string => {
  if (!toArabic || typeof text !== 'string') return String(text);
  
  // Only translate numbers on client side
  if (typeof window === 'undefined') {
    return text;
  }
  
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (digit) => arabicDigits[parseInt(digit)]);
};

export default i18n;
export const changeLanguage = async (lng: string) => {
  try {
    console.log('🔄 changeLanguage called with:', lng)
    console.log('📊 i18n initialized:', i18n.isInitialized)
    console.log('📋 Available languages:', i18n.options.supportedLngs)
    
    await i18n.changeLanguage(lng);
    console.log('✅ i18n.changeLanguage completed, current language:', i18n.language)
    
    // Update document attributes immediately
    if (typeof window !== 'undefined') {
      const isRtl = lng === 'ar';
      console.log('🌐 Updating DOM - Language:', lng, 'RTL:', isRtl)
      
      document.documentElement.setAttribute('lang', lng);
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      
      if (isRtl) {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
      
      // Sync with translation service if it exists
      if (typeof window !== 'undefined' && (window as any).translationService) {
        (window as any).translationService.saveCurrentLanguage(lng);
        
        // Dispatch language change event for PropertyTranslationWrapper
        const event = new CustomEvent('languageChange', { detail: lng });
        window.dispatchEvent(event);
      }
      
      console.log('📄 DOM updated - lang:', document.documentElement.getAttribute('lang'), 'dir:', document.documentElement.getAttribute('dir'))
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error changing language:', error);
    return false;
  }
};
export const getCurrentLanguage = () => i18n.language;
export const isRTL = () => i18n.language === 'ar'; 