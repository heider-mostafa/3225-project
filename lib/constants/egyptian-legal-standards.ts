/**
 * Egyptian Legal Standards Template for Property Appraisals
 * Based on Egyptian Real Estate Valuation Standards (FRA Resolution 39/2015)
 */

export interface EgyptianLegalStandardsData {
  // Standard Compliance Flags
  standards_compliance: boolean;
  fra_resolution_number: string;
  fra_resolution_year: string;
  fra_resolution_date: string;
  market_value_definition_confirmed: boolean;
  ownership_disputes_confirmed: boolean;
  physical_inspection_completed: boolean;
  highest_best_use_applied: boolean;
  professional_independence_declared: boolean;
  
  // Variable Fields - Property Specific
  property_address_arabic: string;
  property_address_english: string;
  building_number: string;
  unit_number: string;
  floor_number: string;
  property_type_arabic: string;
  property_type_english: string;
  
  // Variable Fields - Client Information
  client_name_arabic: string;
  client_name_english: string;
  requesting_entity_arabic: string;
  requesting_entity_english: string;
  
  // Variable Fields - Appraiser Information
  appraiser_name_arabic: string;
  appraiser_name_english: string;
  appraiser_license_number: string;
  appraiser_certification_authority: string;
  
  // Variable Fields - Report Dates
  report_validity_period_months: number;
  inspection_date: string;
  report_issue_date: string;
  signature_date: string;
  
  // Professional Certification Points (10 points)
  certification_points_confirmed: boolean[];
}

export const EGYPTIAN_LEGAL_STANDARDS_TEMPLATE = {
  // Standard Legal Compliance Clauses (Fixed Text)
  standardClauses: {
    professionalStandards: {
      arabic: "تم اعداد هذا التقرير فى ضوء المعايير المصرية للتقييم العقاري الصادرة بقرار مجلس ادارة الهيئة العامة للرقابة المالية رقم (39) لسنة 2015 بتاريخ 19 أبريل 2015.",
      english: "This report was prepared in accordance with Egyptian Real Estate Valuation Standards issued by the Financial Regulatory Authority Board Resolution No. 39 of 2015 dated April 19, 2015."
    },
    
    marketValueDefinition: {
      arabic: "القيمة السوقية المطلوب تحديدها هى الثمن الاكثر احتمالا الذى يحصله العقار فى سوق تنافسي مفتوح",
      english: "The market value to be determined is the most probable price that the property would achieve in an open competitive market."
    },
    
    purposeOfReport: {
      arabic: "الغرض من اعداد التقرير هو تقدير القيمة السوقية للعقار موضوع التقييم لأقرب جنيه",
      english: "The purpose of preparing the report is to estimate the market value of the property subject to valuation to the nearest Egyptian pound."
    },
    
    legalStatusAssumptions: {
      arabic: "لا يوجد نزاعات ملكية على العقار ولا يوجد اى رهن او قرض او حق امتياز او حقوق عينيه للغير او حقوق ارتفاق او غيرها من الشروط المحددة للملكيه وذلك على مسئولية المالك وطبقا لما قدمه لنا من معلومات وبيانات",
      english: "There are no ownership disputes on the property and there are no mortgages, loans, liens, third-party rights, easement rights, or other ownership conditions, based on the owner's responsibility and according to the information and data provided to us."
    },
    
    physicalInspection: {
      arabic: "تمت معاينة العقار من الداخل والخارج ولا يوجد اى عيوب ظاهره بالارض او المباني",
      english: "The property was inspected from inside and outside and there are no apparent defects in the land or buildings."
    },
    
    highestBestUse: {
      arabic: "تم تقييم العقار اخذا فى الاعتبار فرضية اعلى وافضل استخدام للعقار الواردة بالباب الخاص بذلك",
      english: "The property was valued taking into account the highest and best use assumption for the property as detailed in the relevant section."
    },
    
    noHiddenConditions: {
      arabic: "يفترض عدم وجود اى ظروف خفية بالعقار",
      english: "It is assumed that there are no hidden conditions in the property."
    },
    
    buildingCodeCompliance: {
      arabic: "يفترض ان العقار غير مخالف لأية اشتراطات او قوانين بنائيه او تنظيميه او بيئيه خاصة بالمنطقة",
      english: "It is assumed that the property does not violate any building, regulatory, or environmental requirements specific to the area."
    },
    
    reportValidityPeriod: {
      arabic: "قيمة العقار المحددة تسرى للمدة المذكورة فى صدر هذا التقرير فى ظل ظروف طبيعيه ومنطقية بالسوق",
      english: "The determined property value is valid for the period mentioned at the beginning of this report under normal and reasonable market conditions."
    },
    
    propertyDescription: {
      arabic: "العقار المطلوب تقييمه عباره عن {PROPERTY_TYPE_ARABIC} بالدور {FLOOR_NUMBER} بالعمارة رقم {BUILDING_NUMBER} شقة رقم {UNIT_NUMBER}",
      english: "The property to be valued is a {PROPERTY_TYPE_ENGLISH} on the {FLOOR_NUMBER} floor of building number {BUILDING_NUMBER}, unit number {UNIT_NUMBER}"
    },
    
    reportPrivacy: {
      arabic: "التقرير هو ملكيه خاصة للعميل الموجه اليه التقرير ولا يجوز استخدام كل او بعض هذا التقرير الا فى حدود الغرض المحدد لذلك",
      english: "The report is private property of the client to whom the report is addressed and no part or all of this report may be used except within the limits of the specified purpose."
    },
    
    reportIntegrity: {
      arabic: "اية تعامل مع هذا التقرير يجب ان يكون كامل وشامل و يفترض من التعامل مع هذا التقرير مراجعة جميع بنودة واجزاؤه بما فى ذلك الملاحق الخاصه بالرسومات والصور والجداول مع التأكيد على فروض ومحددات التقرير وكذلك باب خلاصه بالملاحظات الهامه",
      english: "Any dealing with this report must be complete and comprehensive, and it is assumed that dealing with this report includes reviewing all its clauses and parts, including the annexes for drawings, photos and tables, with emphasis on the report's assumptions and limitations as well as the summary of important notes."
    }
  },
  
  // Professional Certification Points (10 Points)
  certificationPoints: {
    arabic: [
      "قد قمت بدراسة سوق منطقة العقار و اخترت على الأقل عدد ثلاث مبيعات حديثة لعقارات أقرب ما يمكن من حيث النوع و الموقع للعقار المقيم و قمت بعمل التعديلات المالية حيث وجدت لتعكس تأثير السوق و ذلك في حالة استعمال طريقة مقارنة أسعار البيع",
      "قد قمت بأخذ جميع العوامل التي تؤثر على قيمة العقار حسب التقرير المقدم عن عمد و إنني لم اخفي أي معلومات هامة من تقرير التقييم و إنني أشهد أنه حسب علمي فإن كل المعلومات و البيانات المقدمة صحيحة و حقيقية",
      "قد قدمت بالتقرير رأيي الشخصي المحايد الفني و الآراء و المستنتجات التي تحددها فقط الاشتراطات و الحدود الواردة بهذة الشهادة",
      "أنه ليس لدي أي اهتمام حالي أو مستقبلي متوقع كما أنه ليس لأي من موظفي مكتبي الحاليين أو المستقبليين اهتمام بالعقار موضوع التقييم كما إنني اشهد أن أتعابي عن أعداد هذا التقييم لا تعتمد على قيمة العقار الواردة بتقرير التقييم",
      "أنه ليس لي اهتمام حالي أو مستقبلي بالعقار موضوع التقييم و ليس لدي أي تفضيل حالي أو مستقبلي لأي طرف من أطراف التعاقد و التقييم",
      "إنني لم ابني تحليلي لقيمة العقار سواء جزئيا أو كليا على عنصر أو لون أو ديانة أو جنس أو عجز أو الحالة العائلية أو الموطن الأصلي لأي من طرفي التعاقد أو شاغلي العقار أو شاغلي العقارات المجاورة",
      "أنه لم يطلب إلي تقديم أي آراء مسبقة عن قيمة أو اتجاه قيمة العقار يخدم مصلحة العميل طالب التقييم أو أي جهة مرتبطة به كما لم يطلب مني الوصول إلى قيمة محددة للعقار كما لم يطلب مني حدوث أي أحداث مستقبلية للحصول على عقد أداء أو قيمة أتعابي عن العمل كما إنني لم ابني التقرير على حد أدنى لقيمة معينة أو تقييم معين أو الحاجة للموافقة على منح قرض معين",
      "إنني قمت بأداء هذا التقييم فى ضوء المعايير المصرية للتقييم العقاري الصادرة بقرار مجلس ادارة الهيئة العامة للرقابة المالية رقم (39) لسنة 2015 بتاريخ 19 أبريل 2015",
      "إنني اقر أن القيمة الواردة التقييم مبنيه على عرض العقار لفترة زمنيه مناسبة بالسوق الحر حسب الوارد بتعريف القيمة السوقية للعقار و أن القيمة التي توصلت أليها ملائمة لفترة التسويق الواردة ببابي البيانات والمعلومات و دراسة السوق ما لم يذكر خلاف ذلك بباب النتيجة النهائية الواردة بالتقرير",
      "إنني شخصيا قمت بفحص داخل و خارج العقار موضع التقييم و فحص خارج العقارات التي تم استخدامها في مقارنة البيوع السابقة كما إنني قد قمت بإيضاح أي ظروف معاكسة ظاهرة أو معروفة في مبنى العقار أو بالموقع أو أي عقار مجاور مباشرة للعقار موضع التقييم و التي اعلم بها و قمت بعمل التعديلات اللازمة على قيمة العقار نتيجة هذة الظروف في تقرير التقييم لقيمة العقار و الواردة بالتقرير كما إنني قمت بالتعليق على هذة الظروف المعاكسة و تأثيرها على تسويق العقار بدرجة واضحة تماما"
    ],
    
    english: [
      "I have studied the market area of the property and selected at least three recent sales of properties as close as possible in terms of type and location to the property being valued, and I made financial adjustments where found to reflect market impact when using the sales comparison approach",
      "I have taken all factors that affect the property value according to the submitted report intentionally and I have not hidden any important information from the valuation report and I testify that to my knowledge all information and data provided are correct and true",
      "I have provided in the report my personal neutral technical opinion and the opinions and conclusions that are determined only by the requirements and limits contained in this certificate",
      "I have no current or expected future interest, nor do any of my current or future office staff have an interest in the property subject to valuation, and I testify that my fees for preparing this valuation do not depend on the property value stated in the valuation report",
      "I have no current or future interest in the property subject to valuation and I have no current or future preference for any party to the contract and valuation",
      "I did not base my analysis of property value, whether partially or wholly, on race, color, religion, gender, disability, marital status, or national origin of either contracting party or occupants of the property or occupants of neighboring properties",
      "I was not asked to provide any prior opinions about the value or direction of property value that serves the interest of the client requesting the valuation or any entity associated with it, nor was I asked to reach a specific value for the property, nor was I asked for any future events to obtain a performance contract or the value of my fees for the work, and I did not base the report on a minimum value or specific valuation or the need to approve granting a specific loan",
      "I performed this valuation in light of the Egyptian Real Estate Valuation Standards issued by the Board of Directors of the Financial Regulatory Authority Resolution No. (39) of 2015 dated April 19, 2015",
      "I acknowledge that the value stated in the valuation is based on offering the property for an appropriate period in the free market as stated in the definition of market value of real estate, and that the value I reached is suitable for the marketing period stated in the data and information and market study sections unless otherwise stated in the final result section of the report",
      "I personally examined inside and outside the property subject to valuation and examined outside the properties that were used in comparing previous sales, and I have clarified any adverse conditions apparent or known in the property building or location or any property directly adjacent to the property subject to valuation that I am aware of, and I made the necessary adjustments to the property value as a result of these conditions in the valuation report for the property value stated in the report, and I commented on these adverse conditions and their impact on marketing the property very clearly"
    ]
  },
  
  // Variable Field Mappings for Python Extraction
  variableFieldMappings: {
    // These are the variable names that the Python tool should extract/recognize
    PROPERTY_ADDRESS_ARABIC: "property_address_arabic",
    PROPERTY_ADDRESS_ENGLISH: "property_address_english", 
    BUILDING_NUMBER: "building_number",
    UNIT_NUMBER: "unit_number",
    FLOOR_NUMBER: "floor_number",
    PROPERTY_TYPE_ARABIC: "property_type_arabic",
    PROPERTY_TYPE_ENGLISH: "property_type_english",
    CLIENT_NAME_ARABIC: "client_name",
    CLIENT_NAME_ENGLISH: "client_name_english",
    REQUESTING_ENTITY_ARABIC: "requested_by",
    REQUESTING_ENTITY_ENGLISH: "requesting_entity_english",
    APPRAISER_NAME_ARABIC: "appraiser_name",
    APPRAISER_NAME_ENGLISH: "appraiser_name_english", 
    APPRAISER_LICENSE_NUMBER: "appraiser_license_number",
    REPORT_VALIDITY_MONTHS: "report_validity_months",
    INSPECTION_DATE: "inspection_date",
    REPORT_ISSUE_DATE: "appraisal_date",
    SIGNATURE_DATE: "signature_date"
  }
};

export const DEFAULT_EGYPTIAN_LEGAL_STANDARDS: EgyptianLegalStandardsData = {
  standards_compliance: true,
  fra_resolution_number: "39",
  fra_resolution_year: "2015",
  fra_resolution_date: "2015-04-19",
  market_value_definition_confirmed: true,
  ownership_disputes_confirmed: false,
  physical_inspection_completed: true,
  highest_best_use_applied: true,
  professional_independence_declared: true,
  
  property_address_arabic: "",
  property_address_english: "",
  building_number: "",
  unit_number: "",
  floor_number: "",
  property_type_arabic: "",
  property_type_english: "",
  
  client_name_arabic: "",
  client_name_english: "",
  requesting_entity_arabic: "",
  requesting_entity_english: "",
  
  appraiser_name_arabic: "",
  appraiser_name_english: "",
  appraiser_license_number: "",
  appraiser_certification_authority: "الهيئة العامة للرقابة المالية",
  
  report_validity_period_months: 12,
  inspection_date: "",
  report_issue_date: "",
  signature_date: "",
  
  certification_points_confirmed: new Array(10).fill(true)
};