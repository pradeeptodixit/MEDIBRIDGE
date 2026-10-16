import { GovernmentScheme } from '../types';

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    nameHi: 'आयुष्मान भारत — प्रधानमंत्री जन आरोग्य योजना (PM-JAY)',
    ministry: 'National Health Authority / MoHFW',
    category: 'insurance',
    description: 'World\'s largest government-funded healthcare assurance scheme offering ₹5,00,000 cashless secondary and tertiary hospitalization cover per family per year.',
    descriptionHi: 'विश्व की सबसे बड़ी सरकारी स्वास्थ्य बीमा योजना जो प्रति परिवार प्रति वर्ष ₹5,00,000 तक का कैशलेस अस्पताल उपचार प्रदान करती है।',
    benefit: '₹5,00,000 / year cashless treatment at all empaneled public & private hospitals across India.',
    benefitHi: 'पूरे भारत के सभी सूचीबद्ध सरकारी और निजी अस्पतालों में ₹5,00,000/वर्ष का निःशुल्क कैशलेस उपचार।',
    coverageAmount: '₹5,00,000 / family / year',
    eligibility: {
      incomeCategory: ['BPL', 'EWS', 'APL'],
      conditions: ['All pre-existing conditions covered from day one'],
    },
    whyRecommended: 'Provides comprehensive coverage for high-cost hospitalizations, surgeries, and critical care without any out-of-pocket expenses.',
    whyRecommendedHi: 'बिना किसी व्यक्तिगत खर्च के महंगे अस्पताल भर्ती, सर्जरी और गंभीर देखभाल के लिए संपूर्ण सुरक्षा प्रदान करता है।',
    applicationSteps: [
      'Check family eligibility on pmjay.gov.in or visit your nearest Ayushman Mitra at any empaneled hospital.',
      'Present Aadhaar Card and Ration Card (or PM-JAY letter) for instant e-KYC verification.',
      'Receive your Ayushman Card (Golden Card) on the spot.',
      'Avail 100% cashless treatment at any empaneled hospital across India.'
    ],
    applicationStepsHi: [
      'pmjay.gov.in पर परिवार की पात्रता जांचें या निकटतम अस्पताल में आयुष्मान मित्र से संपर्क करें।',
      'त्वरित e-KYC सत्यापन के लिए आधार कार्ड और राशन कार्ड प्रस्तुत करें।',
      'तुरंत अपना आयुष्मान कार्ड (गोल्डन कार्ड) प्राप्त करें।',
      'भारत भर के किसी भी सूचीबद्ध अस्पताल में 100% कैशलेस उपचार प्राप्त करें।'
    ],
    documentsRequired: ['Aadhaar Card', 'Ration Card / PM Letter', 'Active Mobile Number'],
    documentsRequiredHi: ['आधार कार्ड', 'राशन कार्ड / प्रधानमंत्री पत्र', 'सक्रिय मोबाइल नंबर'],
    helplineNumber: '14555',
    website: 'https://pmjay.gov.in',
    icon: 'Shield',
    color: 'bg-teal-600'
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    nameHi: 'जननी सुरक्षा योजना (JSY)',
    ministry: 'Ministry of Health and Family Welfare',
    category: 'maternal',
    description: 'Safe motherhood intervention under the National Health Mission promoting institutional delivery among poor pregnant women through direct cash transfer.',
    descriptionHi: 'राष्ट्रीय स्वास्थ्य मिशन के तहत सुरक्षित मातृत्व पहल जो प्रत्यक्ष नकद अंतरण के माध्यम से संस्थागत प्रसव को बढ़ावा देती है।',
    benefit: '₹1,400 direct cash benefit for rural mothers + ₹300 transport assistance (₹1,000 for urban mothers).',
    benefitHi: 'ग्रामीण माताओं के लिए ₹1,400 नकद सहायता + ₹300 परिवहन सहायता (शहरी माताओं के लिए ₹1,000)।',
    coverageAmount: 'Up to ₹1,700 cash benefit',
    eligibility: {
      gender: 'female',
      pregnancyRequired: true,
      incomeCategory: ['BPL', 'EWS', 'middle'],
    },
    whyRecommended: 'Ensures safe institutional delivery by qualified doctors, drastically reducing maternal and infant mortality rates.',
    whyRecommendedHi: 'योग्य डॉक्टरों द्वारा सुरक्षित अस्पताल प्रसव सुनिश्चित करता है जिससे मातृ एवं शिशु मृत्यु दर में भारी कमी आती है।',
    applicationSteps: [
      'Register pregnancy at nearest Anganwadi Centre or Primary Health Centre (PHC) via ASHA worker.',
      'Obtain Mother and Child Protection (MCP) card.',
      'Undergo at least 3-4 Antenatal Care (ANC) check-ups.',
      'Deliver at an accredited public or empaneled private healthcare facility.',
      'Cash assistance credited directly to mother’s Aadhaar-linked bank account upon discharge.'
    ],
    applicationStepsHi: [
      'आशा कार्यकर्ता के माध्यम से निकटतम आंगनवाड़ी या प्राथमिक स्वास्थ्य केंद्र (PHC) में पंजीकरण कराएं।',
      'मातृ एवं शिशु सुरक्षा (MCP) कार्ड प्राप्त करें।',
      'कम से कम 3-4 प्रसवपूर्व जांच (ANC) कराएं।',
      'सरकारी या सूचीबद्ध अस्पताल में सुरक्षित प्रसव कराएं।',
      'डिस्चार्ज होने पर राशि सीधे माता के बैंक खाते में जमा होती है।'
    ],
    documentsRequired: ['MCP Card', 'Aadhaar Card', 'Bank Passbook copy', 'BPL Card (if applicable)'],
    documentsRequiredHi: ['MCP कार्ड', 'आधार कार्ड', 'बैंक पासबुक प्रति', 'BPL कार्ड'],
    helplineNumber: '104',
    website: 'https://nhm.gov.in',
    icon: 'Heart',
    color: 'bg-rose-500'
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    nameHi: 'प्रधानमंत्री मातृ वंदना योजना (PMMVY)',
    ministry: 'Ministry of Women and Child Development',
    category: 'maternal',
    description: 'Maternity benefit program providing conditional cash incentive of ₹5,000 for pregnant women and lactating mothers for first living child (additional ₹6,000 for second girl child).',
    descriptionHi: 'गर्भवती व धात्री माताओं को पहले जीवित बच्चे के लिए ₹5,000 की वित्तीय सहायता (दूसरी कन्या संतान पर ₹6,000 अतिरिक्त)।',
    benefit: '₹5,000 direct bank transfer in instalments to compensate for wage loss and ensure nutritious food.',
    benefitHi: 'मजदूरी के नुकसान की भरपाई और उचित पोषण के लिए ₹5,000 प्रत्यक्ष बैंक हस्तांतरण।',
    coverageAmount: '₹5,000 – ₹6,000 DBT',
    eligibility: {
      gender: 'female',
      pregnancyRequired: true,
      minAge: 19,
      incomeCategory: ['BPL', 'EWS', 'middle'],
    },
    whyRecommended: 'Compensates wage loss during pregnancy and guarantees adequate nutrition for the mother and newborn.',
    whyRecommendedHi: 'गर्भावस्था के दौरान मजदूरी के नुकसान की भरपाई करता है और मां और नवजात के लिए पर्याप्त पोषण सुनिश्चित करता है।',
    applicationSteps: [
      'Register at Anganwadi Centre or approved health facility within 150 days of LMP.',
      'Submit Form 1-A with MCP card and Aadhaar details for 1st installment.',
      'Submit Form 1-B after completing at least one ANC checkup for 2nd installment.',
      'Submit Form 1-C after child birth registration and first cycle of vaccinations for 3rd installment.'
    ],
    applicationStepsHi: [
      'LMP के 150 दिनों के भीतर आंगनवाड़ी केंद्र में फॉर्म 1-A जमा करके पंजीकरण करें।',
      'कम से कम एक ANC जांच के बाद दूसरी किस्त के लिए फॉर्म 1-B जमा करें।',
      'जन्म पंजीकरण और पहले चक्र के टीकों के बाद तीसरी किस्त के लिए फॉर्म 1-C जमा करें।'
    ],
    documentsRequired: ['Aadhaar Card of Mother & Husband', 'MCP Card', 'Bank Passbook linked with Aadhaar'],
    documentsRequiredHi: ['माता और पति का आधार कार्ड', 'MCP कार्ड', 'आधार लिंक बैंक पासबुक'],
    helplineNumber: '104',
    website: 'https://pmmvy.wcd.gov.in',
    icon: 'Baby',
    color: 'bg-pink-600'
  },
  {
    id: 'rbsk',
    name: 'Rashtriya Bal Swasthya Karyakram (RBSK)',
    nameHi: 'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम (RBSK)',
    ministry: 'Ministry of Health and Family Welfare',
    category: 'child',
    description: 'Universal child screening and early intervention initiative covering 4Ds: Defects at birth, Deficiencies, Diseases, and Development delays including disabilities (0–18 years).',
    descriptionHi: '0 से 18 वर्ष के बच्चों के लिए 4Ds (जन्मजात विकार, कमियां, बीमारियां, और विकासात्मक देरी) की मुफ्त जांच और पूर्ण उपचार।',
    benefit: '100% Free screening, diagnostics, medicines, and surgical interventions at District Early Intervention Centres (DEIC).',
    benefitHi: 'जिला प्रारंभिक हस्तक्षेप केंद्रों (DEIC) पर 100% मुफ्त जांच, दवाएं और जटिल सर्जरी।',
    coverageAmount: 'Free surgical & medical care up to ₹1.5 Lakh',
    eligibility: {
      maxAge: 18,
      incomeCategory: ['BPL', 'EWS', 'APL', 'middle'],
    },
    whyRecommended: 'Provides completely free early diagnostic screening and life-saving surgeries for congenital heart defects, cleft palate, and malnutrition.',
    whyRecommendedHi: 'जन्मजात हृदय रोग, कटे होंठ और गंभीर कुपोषण के लिए पूरी तरह से मुफ्त जांच और जीवन रक्षक सर्जरी प्रदान करता है।',
    applicationSteps: [
      'Screening conducted by Mobile Health Teams at Anganwadi centers and Government schools.',
      'Identified children are referred to District Early Intervention Centre (DEIC).',
      'Free diagnostics, specialized management, and tertiary surgery arranged without cost to parents.'
    ],
    applicationStepsHi: [
      'आंगनवाड़ी और सरकारी स्कूलों में मोबाइल स्वास्थ्य टीमों द्वारा बच्चों की जांच की जाती है।',
      'जरूरत पड़ने पर DEIC में रेफर किया जाता है।',
      'सभी जांच, दवाएं और सर्जरी बिना किसी खर्च के मुफ्त कराई जाती हैं।'
    ],
    documentsRequired: ['School / Anganwadi ID or Birth Certificate', 'Parent Aadhaar Card'],
    documentsRequiredHi: ['स्कूल/आंगनवाड़ी आईडी या जन्म प्रमाण पत्र', 'अभिभावक आधार कार्ड'],
    helplineNumber: '104',
    website: 'https://rbsk.gov.in',
    icon: 'Users',
    color: 'bg-sky-500'
  },
  {
    id: 'mission_indradhanush',
    name: 'Intensified Mission Indradhanush (IMI 5.0)',
    nameHi: 'सघन मिशन इंद्रधनुष (IMI 5.0)',
    ministry: 'Ministry of Health and Family Welfare',
    category: 'child',
    description: 'Nationwide immunization drive ensuring full vaccination coverage against 12 vaccine-preventable life-threatening diseases for children under 5 and pregnant women.',
    descriptionHi: '5 वर्ष से कम उम्र के बच्चों और गर्भवती महिलाओं को 12 जानलेवा बीमारियों से बचाने के लिए संपूर्ण टीकाकरण अभियान।',
    benefit: 'Free vaccines against Polio, Diphtheria, Pertussis, Tetanus, Measles-Rubella, Hepatitis B, Rotavirus, PCV, and JE.',
    benefitHi: 'पोलियो, खसरा, रूबेला, हेपेटाइटिस बी, टिटनेस और निमोनिया सहित सभी आवश्यक टीकों का 100% मुफ्त टीकाकरण।',
    coverageAmount: 'Free universal immunization',
    eligibility: {
      maxAge: 5,
      incomeCategory: ['BPL', 'EWS', 'APL', 'middle'],
    },
    whyRecommended: 'Protects infants against 12 deadly preventable diseases with doorstep and camp-based vaccination.',
    whyRecommendedHi: '12 जानलेवा बीमारियों के खिलाफ बच्चों को आजीवन सुरक्षा और मुफ्त टीकाकरण कार्ड प्रदान करता है।',
    applicationSteps: [
      'Locate nearest Village Health Sanitation and Nutrition Day (VHSND) or Primary Health Centre.',
      'Present Child MCP / Vaccination card to the ANM/ASHA worker.',
      'Receive timely vaccination and SMS confirmation on U-WIN portal.'
    ],
    applicationStepsHi: [
      'निकटतम गांव स्वास्थ्य दिवस (VHSND) या स्वास्थ्य केंद्र पर जाएं।',
      'ANM या आशा कार्यकर्ता को टीकाकरण कार्ड दिखाएं।',
      'टीका लगवाएं और U-WIN पोर्टल पर रिकॉर्ड दर्ज कराएं।'
    ],
    documentsRequired: ['MCP Card / Immunization Record'],
    documentsRequiredHi: ['MCP कार्ड / टीकाकरण कार्ड'],
    helplineNumber: '1075',
    website: 'https://uwin.mohfw.gov.in',
    icon: 'Syringe',
    color: 'bg-emerald-600'
  },
  {
    id: 'jssk',
    name: 'Janani Shishu Suraksha Karyakram (JSSK)',
    nameHi: 'जननी शिशु सुरक्षा कार्यक्रम (JSSK)',
    ministry: 'Ministry of Health and Family Welfare',
    category: 'maternal',
    description: 'Zero-expense delivery initiative completely eliminating all out-of-pocket expenses for pregnant women delivering in public institutions and sick newborns up to 1 year.',
    descriptionHi: 'सरकारी अस्पतालों में गर्भवती महिलाओं और 1 वर्ष तक के बीमार शिशुओं के इलाज के लिए शून्य-खर्च योजना।',
    benefit: 'Zero expense: Free c-section/normal delivery, free drugs, consumables, free lab tests, free food during stay, free transport to & from home.',
    benefitHi: 'मुफ्त डिलीवरी, मुफ्त दवाएं, मुफ्त रक्त जांच, अस्पताल में मुफ्त भोजन और घर से अस्पताल तक मुफ्त एम्बुलेंस।',
    coverageAmount: '100% Zero Out-of-Pocket Expense',
    eligibility: {
      gender: 'female',
      pregnancyRequired: true,
      incomeCategory: ['BPL', 'EWS', 'APL', 'middle'],
    },
    whyRecommended: 'Guarantees that no pregnant woman or sick infant spends a single rupee on drugs, diagnostics, or transport.',
    whyRecommendedHi: 'यह सुनिश्चित करता है कि गर्भवती महिला या बीमार शिशु को दवाओं, जांच या परिवहन पर एक रुपया भी न खर्च करना पड़े।',
    applicationSteps: [
      'Visit any Government Hospital, Community Health Centre (CHC), or PHC.',
      'Show MCP Card during admission.',
      'All tests, surgeries, medicines, food, and return transport are provided completely free.'
    ],
    applicationStepsHi: [
      'किसी भी सरकारी अस्पताल, CHC या PHC में जाएं।',
      'भर्ती के समय MCP कार्ड प्रस्तुत करें।',
      'सभी जांच, दवाएं, सर्जरी और वापसी वाहन मुफ्त प्राप्त करें।'
    ],
    documentsRequired: ['MCP Card', 'Aadhaar Card'],
    documentsRequiredHi: ['MCP कार्ड', 'आधार कार्ड'],
    helplineNumber: '108',
    website: 'https://nhm.gov.in',
    icon: 'HeartHandshake',
    color: 'bg-teal-700'
  },
  {
    id: 'pmsby',
    name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    nameHi: 'प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY)',
    ministry: 'Ministry of Finance',
    category: 'insurance',
    description: 'Affordable accidental death and disability insurance cover of ₹2,00,000 for just ₹20 per year auto-debited from bank account.',
    descriptionHi: 'मात्र ₹20 प्रति वर्ष के प्रीमियम पर ₹2,00,000 का आकस्मिक मृत्यु और दिव्यांगता बीमा कवर।',
    benefit: '₹2,00,000 for accidental death or permanent total disability; ₹1,00,000 for permanent partial disability.',
    benefitHi: 'दुर्घटना में मृत्यु या पूर्ण दिव्यांगता पर ₹2,00,000; आंशिक दिव्यांगता पर ₹1,00,000 की सहायता।',
    coverageAmount: '₹2,00,000 accident cover',
    eligibility: {
      minAge: 18,
      maxAge: 70,
      incomeCategory: ['BPL', 'EWS', 'APL', 'middle'],
    },
    whyRecommended: 'Provides essential financial security to families against accidental risks for just ₹20/year.',
    whyRecommendedHi: 'मात्र ₹20 प्रति वर्ष में परिवार को आकस्मिक दुर्घटनाओं के खिलाफ सुरक्षा कवच देता है।',
    applicationSteps: [
      'Visit your bank branch or log in to your mobile/internet banking.',
      'Fill one-page PMSBY consent-cum-declaration form.',
      'Authorize annual auto-debit of ₹20 from savings account.'
    ],
    applicationStepsHi: [
      'अपनी बैंक शाखा या इंटरनेट बैंकिंग पर जाएं।',
      'PMSBY सहमति पत्र भरें।',
      'बचत खाते से ₹20 वार्षिक ऑटो-डेबिट की अनुमति दें।'
    ],
    documentsRequired: ['Bank Account Details', 'Aadhaar Card'],
    documentsRequiredHi: ['बैंक खाता विवरण', 'आधार कार्ड'],
    helplineNumber: '1800-180-1111',
    website: 'https://jansuraksha.gov.in',
    icon: 'ShieldAlert',
    color: 'bg-amber-600'
  },
  {
    id: 'nhm_free_drugs',
    name: 'NHM Free Drugs and Diagnostic Service Initiative',
    nameHi: 'NHM मुफ्त दवा एवं जांच सेवा पहल',
    ministry: 'National Health Mission / MoHFW',
    category: 'general',
    description: 'Provides free essential medicines, surgical items, and essential pathology diagnostics at all public health facilities from Sub-Centers to District Hospitals.',
    descriptionHi: 'उप-स्वास्थ्य केंद्रों से लेकर जिला अस्पतालों तक सभी आवश्यक दवाएं और पैथोलॉजी जांच पूरी तरह से मुफ्त।',
    benefit: 'Over 400+ essential medicines and 50+ diagnostic tests provided free of cost.',
    benefitHi: '400 से अधिक आवश्यक दवाएं और 50 से अधिक रक्त/मूत्र परीक्षण मुफ्त।',
    coverageAmount: '100% Free Medicines & Tests',
    eligibility: {
      incomeCategory: ['BPL', 'EWS', 'APL', 'middle'],
    },
    whyRecommended: 'Saves major out-of-pocket pharmacy expenses for common and chronic illnesses.',
    whyRecommendedHi: 'दवाइयों और जांच पर होने वाले रोजाना के खर्च को शून्य करता है।',
    applicationSteps: [
      'Visit any public health facility (PHC, CHC, District Hospital).',
      'Consult the medical officer and receive a prescription.',
      'Collect free prescribed medicines from the hospital pharmacy counter.'
    ],
    applicationStepsHi: [
      'निकटतम सरकारी अस्पताल या स्वास्थ्य केंद्र में जाएं।',
      'डॉक्टर से परामर्श लें और पर्ची प्राप्त करें।',
      'अस्पताल के दवा काउंटर से मुफ्त दवाएं प्राप्त करें।'
    ],
    documentsRequired: ['Hospital OPD Slip / Prescription'],
    documentsRequiredHi: ['अस्पताल पर्ची'],
    helplineNumber: '104',
    website: 'https://nhm.gov.in',
    icon: 'Pill',
    color: 'bg-indigo-600'
  },
  {
    id: 'poshan_abhiyaan',
    name: 'PM POSHAN Abhiyaan (National Nutrition Mission)',
    nameHi: 'पीएम पोषण अभियान (राष्ट्रीय पोषण मिशन)',
    ministry: 'Ministry of Women and Child Development',
    category: 'nutrition',
    description: 'Flagship mission to reduce stunting, undernutrition, anemia among children (0-6 years), adolescent girls, pregnant women, and lactating mothers.',
    descriptionHi: 'बच्चों (0-6 वर्ष), किशोरियों और गर्भवती महिलाओं में कुपोषण और एनीमिया को दूर करने के लिए पोषण आहार कार्यक्रम।',
    benefit: 'Free Take-Home Ration (THR), fortified supplementary nutrition, growth monitoring, and iron-folic acid supplementation.',
    benefitHi: 'मुफ्त पौष्टिक राशन (THR), फोर्टिफाइड पोषण आहार, वजन-ऊंचाई निगरानी और आयरन-फोलिक सप्लीमेंट।',
    coverageAmount: 'Free Nutritional Supplements',
    eligibility: {
      maxAge: 6,
      pregnancyRequired: true,
      incomeCategory: ['BPL', 'EWS', 'APL', 'middle'],
    },
    whyRecommended: 'Combats childhood malnutrition and maternal anemia with verified micronutrient supplements.',
    whyRecommendedHi: 'बच्चों में बौनापन और महिलाओं में खून की कमी को दूर करने के लिए पोषक आहार प्रदान करता है।',
    applicationSteps: [
      'Register child or pregnant woman at local Anganwadi Centre.',
      'Collect monthly supplementary nutrition packets.',
      'Participate in monthly Poshan Tracker growth monitoring.'
    ],
    applicationStepsHi: [
      'स्थानीय आंगनवाड़ी केंद्र में पंजीकरण कराएं।',
      'मासिक पोषण आहार पैकेट प्राप्त करें।',
      'पोषण ट्रैकर पर बच्चे के विकास की नियमित जांच कराएं।'
    ],
    documentsRequired: ['Aadhaar Card of Parent / Beneficiary'],
    documentsRequiredHi: ['आधार कार्ड'],
    helplineNumber: '14408',
    website: 'https://poshanabhiyaan.gov.in',
    icon: 'Apple',
    color: 'bg-emerald-500'
  }
];

export function getEligibleSchemes(profile: {
  age?: number;
  gender?: string;
  state?: string;
  incomeCategory?: 'BPL' | 'APL' | 'EWS' | 'middle';
  isPregnant?: boolean;
  hasChildUnder5?: boolean;
  chronicConditions?: string[];
}) {
  return GOVERNMENT_SCHEMES.map(scheme => {
    let score = 50;
    const reasons: string[] = [];
    const reasonsHi: string[] = [];

    // Pregnancy check
    if (scheme.eligibility.pregnancyRequired) {
      if (profile.isPregnant) {
        score += 40;
        reasons.push('Matched for active pregnancy care benefits');
        reasonsHi.push('गर्भावस्था देखभाल लाभों के लिए पात्र');
      } else {
        score -= 50;
      }
    }

    // Income category
    if (profile.incomeCategory && scheme.eligibility.incomeCategory?.includes(profile.incomeCategory)) {
      score += 20;
      reasons.push(`Income tier (${profile.incomeCategory}) qualifies for full benefits`);
      reasonsHi.push(`आय वर्ग (${profile.incomeCategory}) संपूर्ण लाभों के लिए पात्र है`);
    }

    // Age bounds
    if (profile.age !== undefined) {
      if (scheme.eligibility.minAge && profile.age < scheme.eligibility.minAge) {
        score -= 40;
      } else if (scheme.eligibility.maxAge && profile.age > scheme.eligibility.maxAge) {
        score -= 40;
      } else if (scheme.eligibility.minAge || scheme.eligibility.maxAge) {
        score += 15;
        reasons.push(`Age (${profile.age} yrs) falls within the scheme guidelines`);
        reasonsHi.push(`आयु (${profile.age} वर्ष) योजना के मानदंडों में उपयुक्त है`);
      }
    }

    // Children under 5
    if (profile.hasChildUnder5 && (scheme.category === 'child' || scheme.category === 'nutrition')) {
      score += 25;
      reasons.push('Child under 5 years eligible for nutrition and immunization');
      reasonsHi.push('5 वर्ष से कम उम्र के बच्चे पोषण और टीकाकरण के लिए पात्र हैं');
    }

    // Universal schemes baseline
    if (scheme.category === 'insurance' || scheme.category === 'general') {
      if (!reasons.length) {
        reasons.push('Universal healthcare entitlement available to eligible families');
        reasonsHi.push('पात्र परिवारों के लिए उपलब्ध सार्वभौमिक स्वास्थ्य अधिकार');
      }
    }

    return {
      scheme,
      matchScore: Math.min(100, Math.max(10, score)),
      matchReasons: reasons.length ? reasons : ['General healthcare benefit for citizens'],
      matchReasonsHi: reasonsHi.length ? reasonsHi : ['नागरिकों के लिए सामान्य स्वास्थ्य लाभ'],
    };
  })
  .filter(r => r.matchScore >= 40)
  .sort((a, b) => b.matchScore - a.matchScore);
}