import { NextRequest, NextResponse } from 'next/server'

// For production, you would install @google-cloud/translate and use it
// npm install @google-cloud/translate

export async function POST(request: NextRequest) {
  let text = ''
  
  try {
    const body = await request.json()
    const { text: inputText, targetLang = 'ar', sourceLang = 'en' } = body
    text = inputText

    if (!text || !text.trim()) {
      return NextResponse.json({ translatedText: text })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn('Google API key not configured. Add NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
      return NextResponse.json({ translatedText: text })
    }

    // Use Google Translate REST API
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
      const errorData = await response.text()
      console.error('Google Translate API error:', response.status, errorData)
      return NextResponse.json({ translatedText: text })
    }

    const data = await response.json()
    const translatedText = data.data?.translations?.[0]?.translatedText || text

    return NextResponse.json({
      translatedText,
      detectedSourceLanguage: data.data?.translations?.[0]?.detectedSourceLanguage 
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ translatedText: text || '' })
  }
}

// Mock translation function - replace with actual Google Translate API
async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  // For now, we'll use the client-side fallback logic
  // In production, you'd use Google Translate API:
  
  /*
  const { Translate } = require('@google-cloud/translate').v2;
  const translate = new Translate({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
  });

  const [translation] = await translate.translate(text, targetLang);
  return translation;
  */

  if (targetLang !== 'ar') {
    return text
  }

  // Enhanced translation rules for real estate descriptions
  const translations: { [key: string]: string } = {
    // Property titles and headlines
    'Historic Charm Meets Modern Comfort': 'السحر التاريخي يلتقي بالراحة العصرية',
    'Heliopolis Palace District Apartment': 'شقة في منطقة قصر مصر الجديدة',
    'Historic Charm': 'السحر التاريخي',
    'Modern Comfort': 'الراحة العصرية',
    'Meets': 'يلتقي',
    
    // Streets and addresses
    'El-Ahram Street': 'شارع الأهرام',
    'Heliopolis': 'مصر الجديدة',
    'Street': 'شارع',
    'Avenue': 'شارع',
    'Road': 'طريق',
    'Square': 'ميدان',
    'Bridge': 'كوبري',
    
    // Common street names in Cairo
    'Tahrir Square': 'ميدان التحرير',
    'Nile Corniche': 'كورنيش النيل',
    'Abbas Bridge': 'كوبري عباس',
    'Kasr El Nil': 'قصر النيل',
    'Mohamed Farid': 'محمد فريد',
    'Ramses Street': 'شارع رمسيس',
    'El-Geish Street': 'شارع الجيش',
    'El-Nasr Street': 'شارع النصر',
    'El-Haram Street': 'شارع الهرم',
    'Ring Road': 'الطريق الدائري',
    
    // Property types and structure
    'Classic 3-bedroom apartment': 'شقة كلاسيكية بثلاث غرف نوم',
    'apartment': 'شقة',
    'villa': 'فيلا',
    'house': 'منزل',
    'penthouse': 'بنتهاوس',
    'studio': 'استوديو',
    'duplex': 'دوبلكس',
    'townhouse': 'تاون هاوس',
    
    // Numbers and rooms
    '3-bedroom': 'ثلاث غرف نوم',
    '2-bedroom': 'غرفتي نوم',
    '4-bedroom': 'أربع غرف نوم',
    '1-bedroom': 'غرفة نوم واحدة',
    'bedroom': 'غرفة نوم',
    'bedrooms': 'غرف نوم',
    'bathroom': 'حمام',
    'bathrooms': 'حمامات',
    'living room': 'غرفة معيشة',
    'kitchen': 'مطبخ',
    'dining room': 'غرفة طعام',
    
    // Cairo locations and districts
    'Heliopolis Palace District': 'منطقة قصر مصر الجديدة',
    'Palace District': 'منطقة القصر',
    'Maadi': 'المعادي',
    'Zamalek': 'الزمالك',
    'New Cairo': 'القاهرة الجديدة',
    'Sheikh Zayed': 'الشيخ زايد',
    'Nasr City': 'مدينة نصر',
    'Fifth Settlement': 'التجمع الخامس',
    'New Administrative Capital': 'العاصمة الإدارية الجديدة',
    'Cairo': 'القاهرة',
    'Giza': 'الجيزة',
    'Alexandria': 'الإسكندرية',
    'Downtown Cairo': 'وسط القاهرة',
    'Old Cairo': 'مصر القديمة',
    'Islamic Cairo': 'القاهرة الإسلامية',
    'Coptic Cairo': 'مصر القبطية',
    'Garden City': 'جاردن سيتي',
    'Dokki': 'الدقي',
    'Mohandessin': 'المهندسين',
    'Agouza': 'العجوزة',
    'Shubra': 'شبرا',
    '6th of October': 'السادس من أكتوبر',
    
    // Landmarks and places
    'Baron Palace': 'قصر البارون',
    'Cairo International Airport': 'مطار القاهرة الدولي',
    'international schools': 'مدارس دولية',
    'upscale shopping': 'تسوق راقي',
    'Cairo University': 'جامعة القاهرة',
    'American University': 'الجامعة الأمريكية',
    'German University': 'الجامعة الألمانية',
    'British University': 'الجامعة البريطانية',
    'City Stars': 'سيتي ستارز',
    'Mall of Egypt': 'مول مصر',
    'Cairo Festival City': 'مدينة القاهرة فستيفال',
    
    // Property features and descriptions
    'well-maintained': 'جيد الصيانة',
    'high ceilings': 'أسقف عالية',
    'hardwood floors': 'أرضيات خشبية',
    'period charm': 'سحر الحقبة التاريخية',
    'tree-lined streets': 'شوارع مشجرة',
    'easy access': 'سهولة الوصول',
    
    // Descriptive words for titles and headlines
    'historic': 'تاريخي',
    'charm': 'سحر',
    'modern': 'عصري',
    'comfort': 'راحة',
    'luxury': 'فاخر',
    'elegant': 'أنيق',
    'classic': 'كلاسيكي',
    'contemporary': 'معاصر',
    'spacious': 'واسع',
    'cozy': 'مريح',
    'stunning': 'مذهل',
    'beautiful': 'جميل',
    'exceptional': 'استثنائي',
    'prime': 'ممتاز',
    'exclusive': 'حصري',
    'prestigious': 'مرموق',
    'sophisticated': 'متطور',
    'refined': 'راقي',
    'exquisite': 'رائع',
    'magnificent': 'رائع',
    'most': 'الأكثر',
    'established': 'راسخ',
    'upscale': 'راقي',
    'perfect': 'مثالي',
    
    // Common phrases
    'one of': 'واحد من',
    "Cairo's most": 'الأكثر في القاهرة',
    'neighborhoods': 'أحياء',
    'neighborhood': 'حي',
    'district': 'منطقة',
    'area': 'منطقة',
    'community': 'مجتمع',
    'home': 'منزل',
    'features': 'يتميز بـ',
    'located near': 'يقع بالقرب من',
    'offers': 'يوفر',
    'perfect for': 'مثالي لـ',
    'families': 'العائلات',
    'appreciating': 'الذين يقدرون',
    'architecture': 'العمارة',
    'This': 'هذا',
    'The': 'إن',
    'and': 'و',
    'in': 'في',
    'near': 'بالقرب من',
    'with': 'مع',
    'for': 'لـ',
    'to': 'إلى'
  }

  let translatedText = text

  // Sort by length (longest first) to avoid partial matches
  const sortedTranslations = Object.entries(translations)
    .sort(([a], [b]) => b.length - a.length)

  // Apply translations
  sortedTranslations.forEach(([english, arabic]) => {
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    translatedText = translatedText.replace(regex, arabic)
  })

  return translatedText
} 