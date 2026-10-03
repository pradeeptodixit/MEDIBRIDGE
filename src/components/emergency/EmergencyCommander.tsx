import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneCall, Share2, Check, Building2 } from 'lucide-react';

interface EmergencyCommanderProps {
  lang: 'en' | 'hi';
}

export const EmergencyCommander: React.FC<EmergencyCommanderProps> = ({ lang }) => {
  const [copiedLoc, setCopiedLoc] = useState(false);
  const [sharingLoc, setSharingLoc] = useState(false);

  const handleShareLocation = async () => {
    setSharingLoc(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const text = `EMERGENCY ALERT: Location detected at https://www.google.com/maps?q=${latitude},${longitude}`;
          if (navigator.share) {
            try {
              await navigator.share({ title: 'My Emergency Location', text });
            } catch {}
          } else {
            await navigator.clipboard.writeText(text);
            setCopiedLoc(true);
            setTimeout(() => setCopiedLoc(false), 3000);
          }
          setSharingLoc(false);
        },
        () => {
          setSharingLoc(false);
          alert(lang === 'hi' ? 'स्थान प्राप्त नहीं हो सका' : 'Location permission denied or unavailable');
        }
      );
    } else {
      setSharingLoc(false);
    }
  };

  const scrollToHospitals = () => {
    const el = document.getElementById('nearby-hospitals-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Primary Emergency Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 sm:p-6 border-2 border-red-500 bg-gradient-to-br from-red-950 to-slate-950 text-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-red-500/30 pb-3 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h2 className="font-display font-black text-lg text-white">
              {lang === 'hi' ? 'आपातकालीन सहायता केंद्र' : 'Emergency Quick Escalation'}
            </h2>
          </div>
          <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
            Prototype Demonstration
          </span>
        </div>

        <p className="text-xs text-red-200 mb-5 leading-relaxed">
          {lang === 'hi'
            ? 'गंभीर आपातकाल में प्रतीक्षा न करें। नीचे दिए गए नंबरों पर तुरंत कॉल करें। यह प्रोटोटाइप वास्तविक एम्बुलेंस प्रेषण नहीं करता है।'
            : 'In a clinical emergency, do not wait. Dial the national helplines below immediately. No real ambulance is dispatched by this prototype.'}
        </p>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-base shadow-lg shadow-red-900/40 transition-transform active:scale-95"
            id="btn-call-108"
          >
            <PhoneCall size={20} className="animate-bounce" />
            <span>{lang === 'hi' ? 'कॉल 108 (एम्बुलेंस)' : 'CALL 108 AMBULANCE'}</span>
          </a>

          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white font-black text-base shadow-lg transition-transform active:scale-95"
            id="btn-call-112"
          >
            <PhoneCall size={20} />
            <span>{lang === 'hi' ? 'कॉल 112 (राष्ट्रीय आपातकाल)' : 'CALL 112 EMERGENCY'}</span>
          </a>
        </div>

        {/* Secondary Real Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleShareLocation}
            disabled={sharingLoc}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            {copiedLoc ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
            <span>
              {copiedLoc
                ? (lang === 'hi' ? 'स्थान कॉपी हुआ!' : 'Location Copied!')
                : (lang === 'hi' ? 'वर्तमान स्थान साझा करें' : 'Share Location with 108')}
            </span>
          </button>

          <button
            onClick={scrollToHospitals}
            className="py-2.5 px-3 rounded-xl bg-teal-600/30 hover:bg-teal-600/40 text-teal-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-teal-500/30"
          >
            <Building2 size={15} />
            <span>{lang === 'hi' ? 'निकटतम सत्यापित अस्पताल देखें' : 'View Verified Nearby Hospitals'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
