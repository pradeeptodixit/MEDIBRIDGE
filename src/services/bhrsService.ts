import { BHRSResult, VillageProfile } from '../types';

export interface BHRSInputs {
  distanceToHospitalKm: number; // e.g. 5
  cleanWaterAccess: boolean; // tap/treated vs well/river
  sanitationImproved: boolean; // toilet access
  vaccinationRatePercent: number; // 0–100
  emergencyResponseMinutes: number; // e.g. 20
  ashaWorkerActive: boolean;
  maternalAncCompletedPercent: number; // 0–100
  activeOutbreakAlerts: number; // 0+
}

export const bhrsService = {
  calculateBHRS(inputs: BHRSInputs): BHRSResult {
    // 1. Accessibility (max 25)
    let accessibility = 25;
    if (inputs.distanceToHospitalKm > 25) accessibility = 8;
    else if (inputs.distanceToHospitalKm > 15) accessibility = 14;
    else if (inputs.distanceToHospitalKm > 5) accessibility = 20;

    // 2. Disease Risk Control (max 25)
    let diseaseRiskControl = 25;
    if (!inputs.cleanWaterAccess) diseaseRiskControl -= 8;
    if (!inputs.sanitationImproved) diseaseRiskControl -= 7;
    if (inputs.activeOutbreakAlerts > 0) diseaseRiskControl -= Math.min(10, inputs.activeOutbreakAlerts * 4);
    diseaseRiskControl = Math.max(4, diseaseRiskControl);

    // 3. Vaccination Coverage (max 20)
    const vaccinationCoverage = Math.round((Math.min(100, Math.max(0, inputs.vaccinationRatePercent)) / 100) * 20);

    // 4. Emergency Preparedness (max 15)
    let emergencyPreparedness = 15;
    if (!inputs.ashaWorkerActive) emergencyPreparedness -= 6;
    if (inputs.emergencyResponseMinutes > 60) emergencyPreparedness -= 6;
    else if (inputs.emergencyResponseMinutes > 30) emergencyPreparedness -= 3;
    emergencyPreparedness = Math.max(2, emergencyPreparedness);

    // 5. Maternal & Infant Health (max 15)
    const maternalHealth = Math.round((Math.min(100, Math.max(0, inputs.maternalAncCompletedPercent)) / 100) * 15);

    const totalScore = accessibility + diseaseRiskControl + vaccinationCoverage + emergencyPreparedness + maternalHealth;

    let status: BHRSResult['status'] = 'Healthy';
    let grade: BHRSResult['grade'] = 'A+';

    if (totalScore >= 85) {
      status = 'Healthy';
      grade = 'A+';
    } else if (totalScore >= 70) {
      status = 'Healthy';
      grade = 'A';
    } else if (totalScore >= 50) {
      status = 'Moderate';
      grade = 'B';
    } else if (totalScore >= 35) {
      status = 'Vulnerable';
      grade = 'C';
    } else {
      status = 'Critical';
      grade = 'D';
    }

    const recommendations: string[] = [];
    const recommendationsHi: string[] = [];

    if (!inputs.cleanWaterAccess || !inputs.sanitationImproved) {
      recommendations.push('Deploy community water filtration & prioritize Swachh Bharat sanitation infrastructure.');
      recommendationsHi.push('सामुदायिक जल निस्पंदन स्थापित करें और स्वच्छ भारत स्वच्छता को प्राथमिकता दें।');
    }
    if (inputs.vaccinationRatePercent < 75) {
      recommendations.push('Organize Intensified Mission Indradhanush vaccination drive for overdue infants.');
      recommendationsHi.push('टीकाकरण से छूटे बच्चों के लिए सघन मिशन इंद्रधनुष शिविर आयोजित करें।');
    }
    if (inputs.distanceToHospitalKm > 10 || inputs.emergencyResponseMinutes > 40) {
      recommendations.push('Establish NHM Mobile Medical Unit route & preposition 108 Emergency Ambulance.');
      recommendationsHi.push('NHM मोबाइल मेडिकल यूनिट रूट बनाएं और 108 एम्बुलेंस की त्वरित तैनाती सुनिश्चित करें।');
    }
    if (inputs.maternalAncCompletedPercent < 80) {
      recommendations.push('Conduct door-to-door ANC check-up drive under Pradhan Mantri Surakshit Matritva Abhiyan.');
      recommendationsHi.push('प्रधानमंत्री सुरक्षित मातृत्व अभियान के तहत घर-घर जाकर ANC जांच अभियान चलाएं।');
    }

    if (!recommendations.length) {
      recommendations.push('Village healthcare indicators meet excellent national standards. Continue regular ASHA monitoring.');
      recommendationsHi.push('ग्रामीण स्वास्थ्य संकेतक उत्कृष्ट राष्ट्रीय मानकों को पूरा करते हैं। नियमित आशा निगरानी जारी रखें।');
    }

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      status,
      grade,
      breakdown: {
        accessibility,
        diseaseRiskControl,
        vaccinationCoverage,
        emergencyPreparedness,
        maternalHealth,
      },
      recommendations,
      recommendationsHi,
    };
  },

  calculateVillageBHRS(village: VillageProfile): BHRSResult {
    const hasCleanWater = village.surveys.some(s => s.waterSource === 'tap' || s.waterSource === 'borewell');
    const hasSanitation = village.surveys.some(s => s.sanitationType === 'improved');
    const hasOutbreak = village.commonSymptoms.some(s => s.trend === 'up' && s.count > 10);

    return this.calculateBHRS({
      distanceToHospitalKm: village.riskLevel === 'CRITICAL' ? 18 : village.riskLevel === 'HIGH' ? 12 : 6,
      cleanWaterAccess: hasCleanWater,
      sanitationImproved: hasSanitation,
      vaccinationRatePercent: village.vaccinationCoverage || 65,
      emergencyResponseMinutes: village.riskLevel === 'CRITICAL' ? 45 : 25,
      ashaWorkerActive: Boolean(village.ashWorkerName),
      maternalAncCompletedPercent: village.pregnantWomen > 0 ? 75 : 85,
      activeOutbreakAlerts: hasOutbreak ? 2 : 0,
    });
  }
};
