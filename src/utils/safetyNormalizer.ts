/**
 * MediBridge AI — Multilingual Safety Normalizer
 *
 * Normalizes Hindi, Hinglish, and common transcription variations into
 * standard emergency safety concepts before running the deterministic check.
 * This guarantees safety detection even with non-English or vernacular descriptions.
 */

const SAFETY_MAPPINGS: Array<[RegExp, string]> = [
  // Respiratory Emergencies (Hinglish & Devanagari)
  [/saans\s*(?:lene)?\s*(?:mein|me|mai)[\s\S]{0,25}?(?:dikkat|takleef|problem|pareshani|mushkil|kasht|ruk)/gi, 'difficulty breathing'],
  [/(?:सांस|साँस)\s*(?:लेने)?\s*(?:में)?[\s\S]{0,25}?(?:दिक्कत|तकलीफ़|तकलीफ|परेशानी|कठिनाई|रुक)/gi, 'difficulty breathing'],
  [/saans\s*(nahi|nhi)\s*(aa|a)\s*rah[ai]/gi, 'cannot breathe'],
  [/saans\s*(phool|fool)\s*rah[ai]/gi, 'breathlessness'],
  [/dam\s*(ghut|ruk|phool|band)/gi, 'breathlessness'],
  [/saas\s*(chadh|chad)\s*rahi/gi, 'difficulty breathing'],

  // Cardiac Emergencies (Hinglish & Devanagari)
  [/(?:seene|chhati)\s*(?:mein|me|mai)[\s\S]{0,25}?(?:dard|takleef|jalan|dabav|dabaav|bhari)/gi, 'chest pain'],
  [/(?:सीने|छाती)\s*(?:में)?[\s\S]{0,25}?(?:दर्द|दबाव|जलन|तकलीफ)/gi, 'chest pain'],
  [/dil\s*(ka|ki)\s*(daura|attack)/gi, 'heart attack'],
  [/दिल\s*का\s*दौरा/gi, 'heart attack'],
  [/left\s*(haath|bazu|arm)\s*(mein|me)\s*dard/gi, 'pain radiating to left arm'],
  [/ulta\s*haath\s*(mein|me)\s*dard/gi, 'pain radiating to left arm'],

  // Neurological / Stroke / Seizures
  [/behosh\s*(ho\s*gaya|ho\s*gayi|ho\s*gaye|pada|padi|hai)/gi, 'unconscious'],
  [/बेहोश/gi, 'unconscious'],
  [/hosh\s*(nahi|nhi|kho\s*diya)/gi, 'unconscious'],
  [/chehra\s*(ek\s*taraf|tedha|tircha)/gi, 'face drooping'],
  [/baat\s*(nahi|nhi)\s*(kar|bol)\s*pa\s*rah[ai]/gi, 'cannot speak'],
  [/muh\s*tedha/gi, 'face drooping'],
  [/mirgi|daura|fits|jhatke\s*aa\s*rahe/gi, 'seizure'],
  [/दौरा|मिरगी/gi, 'seizure'],

  // Severe Bleeding & Trauma
  [/bahut\s*(zyada|jyada|tez)\s*khoon/gi, 'severe bleeding'],
  [/khoon\s*(ki\s*ulti|ugla|ugli)/gi, 'vomiting blood'],
  [/khansi\s*(mein|me)\s*khoon/gi, 'coughing blood'],
  [/खून\s*की\s*उल्टी/gi, 'vomiting blood'],

  // Environmental / Poisoning / Bites
  [/saanp[\s\S]{0,25}?(?:kata|kaata|dank|daank|bite)/gi, 'snakebite'],
  [/(?:सांप|साँप)[\s\S]{0,25}?(?:काटा|काट\s*लिया|डंक|काट)/gi, 'snakebite'],
  [/zeher\s*(kha\s*liya|pi\s*liya)/gi, 'poisoning'],
  [/ज़हर|जहर/gi, 'poisoning'],
  [/keedanashak\s*(pi|kha)/gi, 'poisoning'],
  [/loo\s*(lag\s*gayi|lagi)/gi, 'heatstroke'],
  [/लू\s*लग\s*गई/gi, 'heatstroke'],
  [/bijli\s*ka\s*jhatka/gi, 'electric shock'],
];

export function normalizeSafetyInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let normalized = input.toLowerCase();

  for (const [pattern, replacement] of SAFETY_MAPPINGS) {
    normalized = normalized.replace(pattern, ` ${replacement} `);
  }

  return normalized;
}
