import type { CareFacility } from '../types';

/**
 * IMPORTANT: All facility data below is DEMO DATA for demonstration purposes only.
 * Real facility locations, availability, and costs will vary.
 * Always verify with local healthcare authorities before visiting.
 */

export const DEMO_CARE_FACILITIES: Record<'GREEN' | 'YELLOW' | 'RED', CareFacility[]> = {
  GREEN: [
    {
      id: 'home-care',
      type: 'teleconsult',
      name: 'Teleconsultation',
      nameHi: 'टेलीकंसल्टेशन',
      costCategory: 'low',
      costRange: '₹100 – ₹300 per session',
      costRangeHi: '₹100 – ₹300 प्रति सत्र',
      isOpen: true,
      phone: '104',
      isDemoData: true,
    },
    {
      id: 'phc-gov',
      type: 'government',
      name: 'Government PHC / Sub-Centre',
      nameHi: 'सरकारी PHC / उप-केंद्र',
      costCategory: 'free',
      costRange: 'Free / No charge',
      costRangeHi: 'मुफ्त / कोई शुल्क नहीं',
      distance: '2 – 5 km (typical in rural India)',
      isOpen: true,
      phone: '104',
      isDemoData: true,
    },
  ],
  YELLOW: [
    {
      id: 'phc-gov-yellow',
      type: 'government',
      name: 'Government PHC / Community Health Centre',
      nameHi: 'सरकारी PHC / सामुदायिक स्वास्थ्य केंद्र',
      costCategory: 'free',
      costRange: 'Free at government facilities',
      costRangeHi: 'सरकारी सुविधाओं में मुफ्त',
      distance: '2 – 8 km (typical)',
      isOpen: true,
      phone: '104',
      isDemoData: true,
    },
    {
      id: 'private-clinic',
      type: 'clinic',
      name: 'Nearest Private Clinic',
      nameHi: 'नजदीकी निजी क्लिनिक',
      costCategory: 'moderate',
      costRange: '₹200 – ₹500 consultation fee',
      costRangeHi: '₹200 – ₹500 परामर्श शुल्क',
      distance: '1 – 4 km (typical)',
      isOpen: true,
      isDemoData: true,
    },
    {
      id: 'teleconsult-yellow',
      type: 'teleconsult',
      name: 'Teleconsultation (Online Doctor)',
      nameHi: 'टेलीकंसल्टेशन (ऑनलाइन डॉक्टर)',
      costCategory: 'low',
      costRange: '₹100 – ₹400 per consultation',
      costRangeHi: '₹100 – ₹400 प्रति परामर्श',
      isOpen: true,
      phone: '104',
      isDemoData: true,
    },
  ],
  RED: [
    {
      id: 'emergency-108',
      type: 'emergency',
      name: 'Call 108 — Emergency Ambulance',
      nameHi: '108 पर कॉल करें — आपातकालीन एम्बुलेंस',
      costCategory: 'free',
      costRange: 'Free emergency ambulance service',
      costRangeHi: 'मुफ्त आपातकालीन एम्बुलेंस सेवा',
      isOpen: true,
      phone: '108',
      isDemoData: true,
    },
    {
      id: 'emergency-room',
      type: 'emergency',
      name: 'Nearest Emergency Room / Hospital',
      nameHi: 'नजदीकी आपातकालीन कक्ष / अस्पताल',
      costCategory: 'moderate',
      costRange: 'Government ERs: Free/subsidised | Private: Varies',
      costRangeHi: 'सरकारी ER: मुफ्त/सब्सिडी | निजी: अलग-अलग',
      isOpen: true,
      phone: '112',
      isDemoData: true,
    },
  ],
};

export const COST_LABELS: Record<CareFacility['costCategory'], { label: string; labelHi: string; color: string }> = {
  free: { label: 'Free', labelHi: 'मुफ्त', color: 'text-green-700 bg-green-100' },
  low: { label: 'Low Cost', labelHi: 'कम खर्च', color: 'text-teal-700 bg-teal-100' },
  moderate: { label: 'Moderate', labelHi: 'मध्यम', color: 'text-amber-700 bg-amber-100' },
  high: { label: 'Higher Cost', labelHi: 'अधिक खर्च', color: 'text-orange-700 bg-orange-100' },
};

export const FACILITY_ICONS: Record<CareFacility['type'], string> = {
  government: '🏥',
  clinic: '🩺',
  teleconsult: '💻',
  emergency: '🚑',
};