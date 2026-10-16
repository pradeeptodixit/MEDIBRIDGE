import React from 'react';
import { ShieldAlert, PhoneCall, MapPin, Building2, FileCheck } from 'lucide-react';

interface EmergencyWorkflowProps {
  lang: 'en' | 'hi';
}

export const EmergencyWorkflow: React.FC<EmergencyWorkflowProps> = ({ lang }) => {
  const steps = [
    {
      id: 1,
      title: lang === 'hi' ? '1. आपातकालीन खतरे के संकेत पहचाने गए' : '1. Emergency Red-Flags Detected',
      desc: lang === 'hi' ? 'सीने में दर्द, सांस की तकलीफ या बेहोशी जैसे लक्षण' : 'Chest pain, acute respiratory distress, or unresponsiveness',
      icon: <ShieldAlert size={18} className="text-rose-400" />,
    },
    {
      id: 2,
      title: lang === 'hi' ? '2. तुरंत 108 / 112 पर कॉल करें' : '2. Call 108 or 112 Immediately',
      desc: lang === 'hi' ? 'निःशुल्क आपातकालीन एम्बुलेंस व पुलिस सहायता' : 'Toll-free emergency dispatch; do not drive alone',
      icon: <PhoneCall size={18} className="text-amber-400" />,
    },
    {
      id: 3,
      title: lang === 'hi' ? '3. सटीक स्थान साझा करें' : '3. Share Location with Dispatcher',
      desc: lang === 'hi' ? 'अपने गाँव, वार्ड या लैंडमार्क की सटीक जानकारी दें' : 'Provide village, landmark, or GPS link from this page',
      icon: <MapPin size={18} className="text-teal-400" />,
    },
    {
      id: 4,
      title: lang === 'hi' ? '4. निकटतम आपातकालीन अस्पताल जाएं' : '4. Proceed to Nearest Emergency Facility',
      desc: lang === 'hi' ? 'सीधे प्राथमिक स्वास्थ्य केंद्र (PHC) या जिला अस्पताल की इमरजेंसी' : 'Primary Health Centre (PHC) or District Hospital Casualty',
      icon: <Building2 size={18} className="text-indigo-400" />,
    },
    {
      id: 5,
      title: lang === 'hi' ? '5. डॉक्टर को सारांश दिखाएं' : '5. Present Doctor Summary',
      desc: lang === 'hi' ? 'मेडीब्रिज ट्राइएज पर्ची चिकित्सक को सौंपें' : 'Present the doctor-ready handoff summary generated on report page',
      icon: <FileCheck size={18} className="text-emerald-400" />,
    },
  ];

  return (
    <div className="rounded-2xl p-5 border border-red-500/30 bg-slate-900/90 text-white">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div>
          <h3 className="font-display font-bold text-base text-red-200">
            {lang === 'hi' ? 'आपातकालीन प्रोटोकॉल मार्गदर्शिका' : 'Emergency Escalation Protocol'}
          </h3>
          <p className="text-xs text-slate-400">
            {lang === 'hi'
              ? 'प्रोटोटाइप कार्यप्रवाह प्रदर्शन'
              : 'Recommended 5-step emergency response workflow'}
          </p>
        </div>
        <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/10">
          Prototype Protocol Guide
        </span>
      </div>

      <div className="space-y-2.5">
        {steps.map(step => (
          <div
            key={step.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-slate-100">{step.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
