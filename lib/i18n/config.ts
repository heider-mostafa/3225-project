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
        propertieslisted: 'Properties Listed',
        happyclients: 'Happy Clients', 
        virtualtours: 'Virtual Tours',
        citiescovered: 'Cities Covered',
        // New premium stats section
        headerBadge: "Egypt's #1 PropTech Platform",
        headerTitle: "Powering Egypt's Real Estate Future",
        headerDescription: "Join thousands of property owners and buyers who trust OpenBeit's AI-powered platform for seamless real estate experiences",
        virtualTourscreated: 'Virtual Tours Created',
        liveStatsLabel: 'Live Stats',
        updatedRealtime: 'Updated in real-time',
        // Descriptions for each stat
        activeListings: 'Active listings',
        experiences3d: '3D experiences',
        satisfiedCustomers: 'Satisfied customers',
        acrossEgypt: 'Across Egypt'
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
    propertieslisted: 'العقارات المدرجة',
    happyclients: 'العملاء السعداء',
    virtualtours: 'الجولات الافتراضية', 
    citiescovered: 'المدن المغطاة',
    // New premium stats section
    headerBadge: 'منصة العقارات التقنية رقم 1 في مصر',
    headerTitle: 'نحو مستقبل العقارات في مصر',
    headerDescription: 'انضم إلى آلاف مالكي العقارات والمشترين الذين يثقون في منصة أوبن بيت المدعومة بالذكاء الاصطناعي للحصول على تجارب عقارية سلسة',
    virtualTourscreated: 'الجولات الافتراضية المُنشأة',
    liveStatsLabel: 'إحصائيات مباشرة',
    updatedRealtime: 'محدثة في الوقت الفعلي',
    // Descriptions for each stat
    activeListings: 'إعلانات نشطة',
    experiences3d: 'تجارب ثلاثية الأبعاد',
    satisfiedCustomers: 'عملاء راضون',
    acrossEgypt: 'في جميع أنحاء مصر'
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