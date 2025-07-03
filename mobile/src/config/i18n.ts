import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language resources
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
      },

      // App
      app: {
        name: 'Egyptian Real Estate',
        tagline: 'Your Gateway to Egyptian Properties',
        version: 'Version',
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
        
        // Password matching
        passwordMatch: 'Passwords match',
        passwordNoMatch: 'Passwords do not match',
        
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
        redirectingMessage: 'Please wait while we redirect you to complete authentication',
        
        // Email verification
        verificationRequired: 'Email Verification Required',
        verificationSent: 'A verification email has been sent to your email address. Please check your inbox and click the verification link.',
        
        // Password reset
        resetEmailSent: 'Reset Email Sent',
        resetEmailSentMessage: 'Check your email for password reset instructions',
        forgotPasswordMessage: 'Enter your email address and we\'ll send you a link to reset your password',
        sendResetLink: 'Send Reset Link',
        checkYourEmail: 'Check Your Email',
        resetLinkSent: 'We\'ve sent a password reset link to',
        nextSteps: 'Next Steps',
        step1CheckEmail: 'Check your email inbox (and spam folder)',
        step2ClickLink: 'Click the reset link in the email',
        step3CreateNewPassword: 'Create a new secure password',
        resetEmailNote: 'The reset link will expire in 2 hours for security purposes',
        resendEmail: 'Resend Email',
        backToLogin: 'Back to Login',
        needHelp: 'Need Help?',
        resetHelpMessage: 'If you don\'t receive the email within a few minutes, check your spam folder or contact our support team',
        rememberPassword: 'Remember your password?',
        
        // Biometric authentication
        useBiometric: 'Use Biometric',
        useFingerprint: 'Use Fingerprint',
        useFaceId: 'Use Face ID',
        biometricNotSetup: 'Biometric Not Setup',
        biometricNotSetupMessage: 'Biometric authentication is not enabled. Would you like to set it up?',
        setupBiometric: 'Setup Biometric',
        biometricFailed: 'Biometric Authentication Failed',
        biometricFailedMessage: 'Please try again or use your password',
        biometricEnabled: 'Biometric Authentication Enabled',
        biometricEnabledMessage: 'You can now use biometric authentication to sign in',
        biometricDisabled: 'Biometric Authentication Disabled',
        biometricDisabledMessage: 'Biometric authentication has been disabled for your account',
        
        // Authentication
        confirmSignOut: 'Are you sure you want to sign out?',
        pleaseSignIn: 'Please sign in to view your profile',
        
        // Common additions
        active: 'Active',
        inactive: 'Inactive',
        
        // Search filters additions
        savedSearches: 'Saved Searches',
        noSavedSearches: 'No saved searches yet',
        
        // Settings additions
        preferences: 'Preferences',
      },

      // Properties
      properties: {
        title: 'Properties',
        search: 'Search properties...',
        filters: 'Filters',
        sortBy: 'Sort By',
        noResults: 'No properties found',
        loadMore: 'Load More',
        
        // Property types
        apartment: 'Apartment',
        villa: 'Villa',
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
        propertyLocation: 'Location',
        
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
      },

      // Navigation
      navigation: {
        home: 'Home',
        properties: 'Properties',
        search: 'Search',
        saved: 'Saved',
        profile: 'Profile',
        settings: 'Settings',
        notifications: 'Notifications',
      },

      // Settings
      settings: {
        title: 'Settings',
        language: 'Language',
        notifications: 'Notifications',
        privacy: 'Privacy',
        about: 'About',
        logout: 'Logout',
        darkMode: 'Dark Mode',
        
        // Notification settings
        pushNotifications: 'Push Notifications',
        newProperties: 'New Properties',
        priceChanges: 'Price Changes',
        viewingReminders: 'Viewing Reminders',
        marketUpdates: 'Market Updates',
      },

      // Profile
      profile: {
        title: 'Profile',
        editProfile: 'Edit Profile',
        personalInfo: 'Personal Information',
        preferences: 'Preferences',
        savedProperties: 'Saved Properties',
        viewingHistory: 'Viewing History',
        updateFailed: 'Profile Update Failed',
        
        // Personal info
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        userLocation: 'Location',
        bio: 'Bio',
        
        // Additional profile fields
        overview: 'Overview',
        about: 'About',
        dateOfBirth: 'Date of Birth',
        selectDate: 'Select Date',
        bioPlaceholder: 'Tell us about yourself...',
        completeProfile: 'Complete your profile',
        verified: 'Verified',
        notProvided: 'Not provided',
        
        // Profile actions
        updateSuccess: 'Profile updated successfully',
        photoUpdated: 'Profile photo updated successfully',
        photoUpdateFailed: 'Failed to update profile photo',
        savedOn: 'Saved on',
        viewedOn: 'Viewed on',
        noViewingHistory: 'No viewing history yet',
        
        // Saved searches
        savedSearches: 'Saved Searches',
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
        fifthSettlement: '5th Settlement',
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

      // Errors
      errors: {
        networkError: 'Network connection error',
        serverError: 'Server error, please try again',
        notFound: 'Resource not found',
        unauthorized: 'Unauthorized access',
        validationError: 'Validation error',
        unknownError: 'Unknown error occurred',
      },

      // Mobile App Features
      favorites: {
        title: 'Favorites',
        addToFavorites: 'Add to Favorites',
        removeFromFavorites: 'Remove from Favorites',
        noFavorites: 'No favorite properties yet',
        favoriteAdded: 'Added to favorites',
        favoriteRemoved: 'Removed from favorites',
        confirmRemove: 'Are you sure you want to remove this property from favorites?',
        removeFailed: 'Failed to remove from favorites',
        tryDifferentFilters: 'Try adjusting your search or filters',
        startSavingProperties: 'Start saving properties you like to see them here',
        browseProperties: 'Browse Properties',
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

      // Map & Location
      map: {
        title: 'Map View',
        showOnMap: 'Show on Map',
        nearbyProperties: 'Nearby Properties',
        directions: 'Get Directions',
        distance: 'Distance',
        currentLocation: 'Current Location',
        locationPermission: 'Location Permission Required',
        enableLocation: 'Enable Location Services',
        searchArea: 'Search this area',
        noPropertiesInArea: 'No properties found in this area',
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
        messagePlaceholder: 'Hi, I\'m interested in this property...',
        selectTime: 'Select Time',
        selectDate: 'Select Date',
        viewingScheduled: 'Viewing scheduled successfully',
        inquirySent: 'Inquiry sent successfully',
      },

      // Camera & Media
      media: {
        photos: 'Photos',
        video: 'Video',
        virtualTour: '360° Virtual Tour',
        floorPlan: 'Floor Plan',
        gallery: 'Photo Gallery',
        takePhoto: 'Take Photo',
        chooseFromGallery: 'Choose from Gallery',
        camera: 'Camera',
        cameraPermission: 'Camera Permission Required',
        storagePermission: 'Storage Permission Required',
        uploadPhoto: 'Upload Photo',
        uploadVideo: 'Upload Video',
        selectPhoto: 'Select Photo',
      },

      // Permissions
      permissions: {
        camera: 'Camera Access',
        location: 'Location Access',
        storage: 'Storage Access',
        notifications: 'Notifications',
        cameraDescription: 'Allow camera access to take photos of properties',
        locationDescription: 'Allow location access to find nearby properties',
        storageDescription: 'Allow storage access to save photos and documents',
        notificationsDescription: 'Allow notifications for property updates',
        grant: 'Grant Permission',
        deny: 'Deny',
        openSettings: 'Open Settings',
      },

      // Listing Management
      listings: {
        myListings: 'My Listings',
        addListing: 'Add New Listing',
        editListing: 'Edit Listing',
        deleteListing: 'Delete Listing',
        publishListing: 'Publish Listing',
        unpublishListing: 'Unpublish Listing',
        draftListings: 'Draft Listings',
        activeLisings: 'Active Listings',
        expiredListings: 'Expired Listings',
        listingViews: 'Views',
        listingInquiries: 'Inquiries',
        listingFavorites: 'Favorites',
        promote: 'Promote Listing',
        featured: 'Featured',
        premium: 'Premium',
      },

      // Property Details
      propertyDetails: {
        overview: 'Overview',
        details: 'Details',
        features: 'Features',
        amenities: 'Amenities',
        location: 'Location',
        mortgage: 'Mortgage Calculator',
        similarProperties: 'Similar Properties',
        propertyId: 'Property ID',
        yearBuilt: 'Year Built',
        parkingSpaces: 'Parking Spaces',
        furnished: 'Furnished',
        unfurnished: 'Unfurnished',
        semifurnished: 'Semi-furnished',
        utilities: 'Utilities',
        maintenance: 'Maintenance',
        security: 'Security',
        garden: 'Garden',
        balcony: 'Balcony',
        terrace: 'Terrace',
        pool: 'Swimming Pool',
        gym: 'Gym',
        elevator: 'Elevator',
        centralAc: 'Central A/C',
        heating: 'Heating',
        internetWifi: 'Internet/WiFi',
      },

      // Notifications
      notifications: {
        title: 'Notifications',
        newProperty: 'New property matches your search',
        priceReduced: 'Price reduced on saved property',
        viewingReminder: 'Viewing reminder',
        inquiryResponse: 'Agent responded to your inquiry',
        favoriteUpdate: 'Update on your favorite property',
        marketUpdate: 'Market update for your area',
        noNotifications: 'No new notifications',
        markAllRead: 'Mark all as read',
        settings: 'Notification Settings',
        pushNotifications: 'Push Notifications',
        emailNotifications: 'Email Notifications',
        smsNotifications: 'SMS Notifications',
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

      // Mortgage Calculator
      mortgage: {
        calculator: 'Mortgage Calculator',
        loanAmount: 'Loan Amount',
        downPayment: 'Down Payment',
        interestRate: 'Interest Rate',
        loanTerm: 'Loan Term',
        monthlyPayment: 'Monthly Payment',
        totalPayment: 'Total Payment',
        totalInterest: 'Total Interest',
        years: 'Years',
        months: 'Months',
        calculate: 'Calculate',
        breakdown: 'Payment Breakdown',
      },

      // Reports & Analytics
      reports: {
        propertyReport: 'Property Report',
        marketReport: 'Market Report',
        priceHistory: 'Price History',
        marketTrends: 'Market Trends',
        averagePrice: 'Average Price',
        pricePerSqm: 'Price per sqm',
        timeOnMarket: 'Time on Market',
        soldProperties: 'Recently Sold',
        download: 'Download Report',
        share: 'Share Report',
      },
    },
  },
  ar: {
    translation: {
      // Common
      common: {
        ok: 'حسناً',
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
      },

      // App
      app: {
        name: 'العقارات المصرية',
        tagline: 'بوابتك لعقارات مصر',
        version: 'الإصدار',
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
        
        // Password matching
        passwordMatch: 'كلمات المرور متطابقة',
        passwordNoMatch: 'كلمات المرور غير متطابقة',
        
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
        redirectingMessage: 'يرجى الانتظار بينما نوجهك لإكمال المصادقة',
        
        // Email verification
        verificationRequired: 'التحقق من البريد الإلكتروني مطلوب',
        verificationSent: 'تم إرسال بريد تحقق إلى عنوان بريدك الإلكتروني. يرجى فحص صندوق الوارد والنقر على رابط التحقق.',
        
        // Password reset
        resetEmailSent: 'تم إرسال بريد إعادة التعيين',
        resetEmailSentMessage: 'تحقق من بريدك الإلكتروني للحصول على تعليمات إعادة تعيين كلمة المرور',
        forgotPasswordMessage: 'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور',
        sendResetLink: 'إرسال رابط إعادة التعيين',
        checkYourEmail: 'تحقق من بريدك الإلكتروني',
        resetLinkSent: 'لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى',
        nextSteps: 'الخطوات التالية',
        step1CheckEmail: 'تحقق من صندوق البريد الوارد (ومجلد الرسائل المزعجة)',
        step2ClickLink: 'انقر على رابط إعادة التعيين في البريد الإلكتروني',
        step3CreateNewPassword: 'أنشئ كلمة مرور آمنة جديدة',
        resetEmailNote: 'سينتهي صلاحية رابط إعادة التعيين خلال ساعتين لأغراض الأمان',
        resendEmail: 'إعادة الإرسال',
        backToLogin: 'العودة لتسجيل الدخول',
        needHelp: 'تحتاج مساعدة؟',
        resetHelpMessage: 'إذا لم تستلم البريد الإلكتروني خلال دقائق قليلة، تحقق من مجلد الرسائل المزعجة أو اتصل بفريق الدعم',
        rememberPassword: 'تتذكر كلمة مرورك؟',
        
        // Biometric authentication
        useBiometric: 'استخدم البصمة',
        useFingerprint: 'استخدم بصمة الإصبع',
        useFaceId: 'استخدم بصمة الوجه',
        biometricNotSetup: 'البصمة غير مُفعلة',
        biometricNotSetupMessage: 'مصادقة البصمة غير مُفعلة. هل تريد تفعيلها؟',
        setupBiometric: 'تفعيل البصمة',
        biometricFailed: 'فشلت مصادقة البصمة',
        biometricFailedMessage: 'يرجى المحاولة مرة أخرى أو استخدام كلمة المرور',
        biometricEnabled: 'مصادقة البصمة تمكنت',
        biometricEnabledMessage: 'يمكنك الآن استخدام مصادقة البصمة لتسجيل الدخول',
        biometricDisabled: 'مصادقة البصمة غير مفعلة',
        biometricDisabledMessage: 'مصادقة البصمة إيقافت لحسابك',
        
        // Authentication
        confirmSignOut: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
        pleaseSignIn: 'يرجى تسجيل الدخول لعرض ملفك الشخصي',
        
        // Common additions
        active: 'نشط',
        inactive: 'غير نشط',
        
        // Search filters additions
        savedSearches: 'البحث المحفوظ',
        noSavedSearches: 'لا توجد بحث محفوظ بعد',
        
        // Settings additions
        preferences: 'التفضيلات',
      },

      // Properties
      properties: {
        title: 'العقارات',
        search: 'البحث عن عقارات...',
        filters: 'التصفية',
        sortBy: 'ترتيب حسب',
        noResults: 'لم يتم العثور على عقارات',
        loadMore: 'تحميل المزيد',
        
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
        propertyLocation: 'الموقع',
        
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
      },

      // Navigation
      navigation: {
        home: 'الرئيسية',
        properties: 'العقارات',
        search: 'البحث',
        saved: 'المحفوظات',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        notifications: 'الإشعارات',
      },

      // Settings
      settings: {
        title: 'الإعدادات',
        language: 'اللغة',
        notifications: 'الإشعارات',
        privacy: 'الخصوصية',
        about: 'حول التطبيق',
        logout: 'تسجيل الخروج',
        darkMode: 'الوضع المظلم',
        
        // Notification settings
        pushNotifications: 'الإشعارات الفورية',
        newProperties: 'العقارات الجديدة',
        priceChanges: 'تغييرات الأسعار',
        viewingReminders: 'تذكير المعاينات',
        marketUpdates: 'تحديثات السوق',
      },

      // Profile
      profile: {
        title: 'الملف الشخصي',
        editProfile: 'تعديل الملف الشخصي',
        personalInfo: 'المعلومات الشخصية',
        preferences: 'التفضيلات',
        savedProperties: 'العقارات المحفوظة',
        viewingHistory: 'تاريخ المعاينات',
        updateFailed: 'فشل في تحديث الملف الشخصي',
        
        // Personal info
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        userLocation: 'الموقع',
        bio: 'نبذة',
        
        // Additional profile fields
        overview: 'نظرة عامة',
        about: 'حول التطبيق',
        dateOfBirth: 'تاريخ الميلاد',
        selectDate: 'اختيار التاريخ',
        bioPlaceholder: 'أخبرنا عن نفسك...',
        completeProfile: 'إكمال الملف الشخصي',
        verified: 'موثق',
        notProvided: 'غير مقدم',
        
        // Profile actions
        updateSuccess: 'تم تحديث الملف الشخصي بنجاح',
        photoUpdated: 'تم تحديث صورة الملف الشخصي بنجاح',
        photoUpdateFailed: 'فشل تحديث صورة الملف الشخصي',
        savedOn: 'حفظ على',
        viewedOn: 'مشاهد على',
        noViewingHistory: 'لا توجد تاريخ معاينات بعد',
        
        // Saved searches
        savedSearches: 'البحث المحفوظ',
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

      // Errors
      errors: {
        networkError: 'خطأ في الاتصال بالشبكة',
        serverError: 'خطأ في الخادم، يرجى المحاولة مرة أخرى',
        notFound: 'المورد غير موجود',
        unauthorized: 'وصول غير مصرح',
        validationError: 'خطأ في التحقق',
        unknownError: 'حدث خطأ غير معروف',
      },

      // Mobile App Features
      favorites: {
        title: 'المفضلة',
        addToFavorites: 'إضافة للمفضلة',
        removeFromFavorites: 'إزالة من المفضلة',
        noFavorites: 'لا توجد عقارات مفضلة بعد',
        favoriteAdded: 'تمت الإضافة للمفضلة',
        favoriteRemoved: 'تمت الإزالة من المفضلة',
        confirmRemove: 'هل أنت متأكد أنك تريد إزالة هذا العقار من المفضلة؟',
        removeFailed: 'فشل إزالة العقار من المفضلة',
        tryDifferentFilters: 'حاول ضبط البحث أو التصفية',
        startSavingProperties: 'ابدأ حفظ العقارات التي تعجبك هنا',
        browseProperties: 'تصفح العقارات',
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

      // Map & Location
      map: {
        title: 'عرض الخريطة',
        showOnMap: 'عرض على الخريطة',
        nearbyProperties: 'العقارات القريبة',
        directions: 'الحصول على الاتجاهات',
        distance: 'المسافة',
        currentLocation: 'الموقع الحالي',
        locationPermission: 'إذن الموقع مطلوب',
        enableLocation: 'تفعيل خدمات الموقع',
        searchArea: 'البحث في هذه المنطقة',
        noPropertiesInArea: 'لا توجد عقارات في هذه المنطقة',
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

      // Camera & Media
      media: {
        photos: 'الصور',
        video: 'فيديو',
        virtualTour: 'جولة افتراضية 360°',
        floorPlan: 'مخطط الطوابق',
        gallery: 'معرض الصور',
        takePhoto: 'التقاط صورة',
        chooseFromGallery: 'اختيار من المعرض',
        camera: 'الكاميرا',
        cameraPermission: 'إذن الكاميرا مطلوب',
        storagePermission: 'إذن التخزين مطلوب',
        uploadPhoto: 'رفع صورة',
        uploadVideo: 'رفع فيديو',
        selectPhoto: 'اختيار الصورة',
      },

      // Permissions
      permissions: {
        camera: 'الوصول للكاميرا',
        location: 'الوصول للموقع',
        storage: 'الوصول للتخزين',
        notifications: 'الإشعارات',
        cameraDescription: 'السماح بالوصول للكاميرا لالتقاط صور العقارات',
        locationDescription: 'السماح بالوصول للموقع للعثور على العقارات القريبة',
        storageDescription: 'السماح بالوصول للتخزين لحفظ الصور والمستندات',
        notificationsDescription: 'السماح بالإشعارات لتحديثات العقارات',
        grant: 'منح الإذن',
        deny: 'رفض',
        openSettings: 'فتح الإعدادات',
      },

      // Listing Management
      listings: {
        myListings: 'إعلاناتي',
        addListing: 'إضافة إعلان جديد',
        editListing: 'تعديل الإعلان',
        deleteListing: 'حذف الإعلان',
        publishListing: 'نشر الإعلان',
        unpublishListing: 'إلغاء نشر الإعلان',
        draftListings: 'المسودات',
        activeLisings: 'الإعلانات النشطة',
        expiredListings: 'الإعلانات المنتهية',
        listingViews: 'المشاهدات',
        listingInquiries: 'الاستفسارات',
        listingFavorites: 'المفضلة',
        promote: 'ترويج الإعلان',
        featured: 'مميز',
        premium: 'بريميوم',
      },

      // Property Details
      propertyDetails: {
        overview: 'نظرة عامة',
        details: 'التفاصيل',
        features: 'المميزات',
        amenities: 'الخدمات',
        location: 'الموقع',
        mortgage: 'حاسبة القرض',
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
      },

      // Notifications
      notifications: {
        title: 'الإشعارات',
        newProperty: 'عقار جديد يطابق بحثك',
        priceReduced: 'انخفض سعر عقار محفوظ',
        viewingReminder: 'تذكير المعاينة',
        inquiryResponse: 'رد الوكيل على استفسارك',
        favoriteUpdate: 'تحديث على عقارك المفضل',
        marketUpdate: 'تحديث السوق لمنطقتك',
        noNotifications: 'لا توجد إشعارات جديدة',
        markAllRead: 'تمييز الكل كمقروء',
        settings: 'إعدادات الإشعارات',
        pushNotifications: 'الإشعارات الفورية',
        emailNotifications: 'إشعارات البريد الإلكتروني',
        smsNotifications: 'إشعارات الرسائل النصية',
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

      // Mortgage Calculator
      mortgage: {
        calculator: 'حاسبة القرض',
        loanAmount: 'مبلغ القرض',
        downPayment: 'الدفعة المقدمة',
        interestRate: 'معدل الفائدة',
        loanTerm: 'مدة القرض',
        monthlyPayment: 'القسط الشهري',
        totalPayment: 'إجمالي المدفوعات',
        totalInterest: 'إجمالي الفوائد',
        years: 'سنوات',
        months: 'شهور',
        calculate: 'حساب',
        breakdown: 'تفصيل الدفعات',
      },

      // Reports & Analytics
      reports: {
        propertyReport: 'تقرير العقار',
        marketReport: 'تقرير السوق',
        priceHistory: 'تاريخ الأسعار',
        marketTrends: 'اتجاهات السوق',
        averagePrice: 'متوسط السعر',
        pricePerSqm: 'السعر لكل متر مربع',
        timeOnMarket: 'الوقت في السوق',
        soldProperties: 'العقارات المباعة مؤخراً',
        download: 'تحميل التقرير',
        share: 'مشاركة التقرير',
      },
    },
  },
}

// Language detector
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check for saved language
      const savedLanguage = await AsyncStorage.getItem('user-language')
      if (savedLanguage) {
        callback(savedLanguage)
        return
      }

      // Fall back to device language
      const deviceLanguages = RNLocalize.getLocales()
      const deviceLanguage = deviceLanguages[0]?.languageCode || 'en'
      
      // Support Arabic and English only
      const supportedLanguage = ['ar', 'en'].includes(deviceLanguage) ? deviceLanguage : 'en'
      callback(supportedLanguage)
    } catch (error) {
      console.error('Error detecting language:', error)
      callback('en') // Default to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng)
    } catch (error) {
      console.error('Error caching language:', error)
    }
  },
}

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: __DEV__, // Enable debug in development
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    react: {
      useSuspense: false, // Disable suspense for React Native
    },

    // Cache configuration
    cache: {
      enabled: true,
    },

    // Load configuration
    load: 'languageOnly', // Only load language codes (en, ar) not variants (en-US, ar-EG)
  })

export default i18n

// Helper functions
export const getCurrentLanguage = (): string => i18n.language

export const changeLanguage = async (lng: string): Promise<void> => {
  try {
    await i18n.changeLanguage(lng)
    await AsyncStorage.setItem('user-language', lng)
  } catch (error) {
    console.error('Error changing language:', error)
  }
}

export const isRTL = (): boolean => i18n.language === 'ar'

export const getSupportedLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
] 