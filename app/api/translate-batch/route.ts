import { NextRequest, NextResponse } from 'next/server'

// Enhanced batch translation for multiple texts
export async function POST(request: NextRequest) {
  try {
    const { texts, targetLang = 'ar', sourceLang = 'en' } = await request.json()

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json(
        { error: 'Texts array is required' },
        { status: 400 }
      )
    }

    // If no translation needed, return original texts
    if (targetLang === sourceLang) {
      return NextResponse.json({ 
        translations: texts, 
        translatedTexts: texts 
      })
    }

    // If targeting English, return original texts (assuming they're in English)
    if (targetLang === 'en') {
      return NextResponse.json({ 
        translations: texts, 
        translatedTexts: texts 
      })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn('No Google API key found - returning original texts')
      return NextResponse.json({ 
        translations: texts, 
        translatedTexts: texts 
      })
    }

    // Enhanced translations with better Egyptian Arabic context
    const translations: { [key: string]: string } = {
      // Property titles and headlines
      'Luxury New Capital Penthouse': 'بنتهاوس فاخر في العاصمة الإدارية الجديدة',
      'Zamalek Nile View Apartment': 'شقة بإطلالة على النيل في الزمالك',
      'Alexandria Corniche Villa': 'فيلا على كورنيش الإسكندرية',
      'Maadi Modern Townhouse': 'تاون هاوس عصري في المعادي',
      'Heliopolis Palace District Apartment': 'شقة في منطقة القصر بمصر الجديدة',
      'North Coast Chalet': 'شاليه على الساحل الشمالي',
      'Fifth Settlement Villa': 'فيلا في التجمع الخامس',
      'Downtown Cairo Heritage Loft': 'لوفت تراثي في وسط القاهرة',
      'New Alamein Resort Apartment': 'شقة في منتجع العلمين الجديدة',
      'Mohandessin Executive Apartment': 'شقة تنفيذية في المهندسين',
      
      // Common property descriptions
      'This stunning property offers': 'يوفر هذا العقار المذهل',
      'Located in one of': 'يقع في واحد من',
      'Features include': 'تشمل المميزات',
      'Perfect for families': 'مثالي للعائلات',
      'Close to amenities': 'قريب من الخدمات',
      'Modern design': 'تصميم عصري',
      'Spacious layout': 'تخطيط واسع',
      'Prime location': 'موقع ممتاز',
      'Investment opportunity': 'فرصة استثمارية',
      'Move-in ready': 'جاهز للسكن',
      
      // Areas and neighborhoods
      'New Administrative Capital': 'العاصمة الإدارية الجديدة',
      'New Capital': 'العاصمة الجديدة',
      'Zamalek': 'الزمالك',
      'Maadi': 'المعادي',
      'Heliopolis': 'مصر الجديدة',
      'Mohandessin': 'المهندسين',
      'Fifth Settlement': 'التجمع الخامس',
      'New Cairo': 'القاهرة الجديدة',
      'October City': 'مدينة أكتوبر',
      '6th October': 'السادس من أكتوبر',
      'Sheikh Zayed': 'الشيخ زايد',
      'Giza': 'الجيزة',
      'Alexandria': 'الإسكندرية',
      'North Coast': 'الساحل الشمالي',
      'New Alamein': 'العلمين الجديدة',
      'Ain Sokhna': 'العين السخنة',
      
      // Compounds and developments
      'The New Capital Tower': 'برج العاصمة الجديدة',
      'Zamalek View': 'إطلالة الزمالك',
      'Corniche View': 'إطلالة الكورنيش',
      'Maadi Residence': 'مقر المعادي',
             'Palace District': 'منطقة القصر',
       'Marina Retreat': 'منتجع المارينا',
       'Downtown Cairo': 'وسط القاهرة',
       'New Alamein Resort': 'منتجع العلمين الجديدة',
      
      // Features and amenities
      'Swimming Pool': 'حمام سباحة',
      'Garden': 'حديقة',
      'Parking': 'موقف سيارات',
      'Security': 'أمن',
      'Elevator': 'مصعد',
      'Balcony': 'شرفة',
      'Terrace': 'تراس',
      'Gym': 'صالة رياضية',
      'Playground': 'ملعب',
      'Community Center': 'مركز اجتماعي',
      'Storage': 'مخزن',
      "Maid's Room": 'غرفة خادمة',
      'Air Conditioning': 'تكييف هواء',
      'Furnished': 'مفروش',
      'Semi-furnished': 'مفروش جزئياً',
      'Unfurnished': 'غير مفروش',
      'Central AC': 'تكييف مركزي',
      'Heating': 'تدفئة',
      'Internet/WiFi': 'إنترنت/واي فاي',
      
      // Property types
      'Apartment': 'شقة',
      'Villa': 'فيلا',
      'Penthouse': 'بنتهاوس',
      'Townhouse': 'تاون هاوس',
      'Studio': 'استوديو',
      'Duplex': 'دوبلكس',
      'Chalet': 'شاليه',
      'Loft': 'لوفت',
      
      // Common words
      'Luxury': 'فاخر',
      'Modern': 'عصري',
      'Spacious': 'واسع',
      'Beautiful': 'جميل',
      'Stunning': 'مذهل',
      'Exclusive': 'حصري',
      'Prime': 'ممتاز',
      'Executive': 'تنفيذي',
      'Premium': 'مميز',
      'Elegant': 'أنيق',
      'Comfortable': 'مريح',
      'Convenient': 'مناسب',
      'Prestigious': 'مرموق',
      
      // Directions and locations
      'with Nile view': 'بإطلالة على النيل',
      'sea view': 'إطلالة بحرية',
      'garden view': 'إطلالة على الحديقة',
      'city view': 'إطلالة على المدينة',
      'close to metro': 'قريب من المترو',
      'near airport': 'بالقرب من المطار',
      'walking distance': 'على مسافة المشي',
      'minutes away': 'دقائق بالسيارة',
      
      // Status and conditions
      'For Sale': 'للبيع',
      'For Rent': 'للإيجار',
      'Sold': 'مُباع',
      'Rented': 'مُؤجر',
      'Available': 'متاح',
      'Under Construction': 'تحت الإنشاء',
      'New': 'جديد',
      'Excellent': 'ممتاز',
      'Very Good': 'جيد جداً',
      'Good': 'جيد',
      'Fair': 'مقبول',
      'Needs Renovation': 'يحتاج تجديد'
    }

    const translatedTexts: string[] = []

    for (const text of texts) {
      if (!text || text.trim() === '') {
        translatedTexts.push(text)
        continue
      }

      // Check direct translation first
      const directTranslation = translations[text.trim()]
      if (directTranslation) {
        translatedTexts.push(directTranslation)
        continue
      }

      // For non-direct translations, use Google Translate API
      try {
        const translatedText = await translateWithGoogle(text, targetLang, sourceLang, apiKey)
        translatedTexts.push(translatedText)
      } catch (error) {
        console.error('Translation failed for text:', text, error)
        translatedTexts.push(text) // Fallback to original
      }
    }

    return NextResponse.json({ 
      translations: translatedTexts, 
      translatedTexts: translatedTexts  // Support both field names
    })

  } catch (error) {
    console.error('Batch translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string,
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`)
    }

    const data = await response.json()
    const translatedText = data.data?.translations?.[0]?.translatedText

    if (!translatedText) {
      throw new Error('No translation returned from Google API')
    }

    return translatedText

  } catch (error) {
    console.error('Google Translate API error:', error)
    throw error
  }
} 