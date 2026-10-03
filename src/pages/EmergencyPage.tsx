import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Heart, ChevronDown, Shield, AlertTriangle, ArrowLeft, Globe, LifeBuoy } from 'lucide-react';
import { NearbyHospitalFinder } from '../components/emergency/NearbyHospitalFinder';
import { EmergencyCommander } from '../components/emergency/EmergencyCommander';
import { EmergencyWorkflow } from '../components/emergency/EmergencyWorkflow';

const CPR_STEPS = [
  { step: 1, title: 'Check Safety & Response', titleHi: 'सुरक्षा जांचें', desc: 'Ensure the area is safe. Tap shoulders firmly and shout "Are you OK?"', descHi: 'क्षेत्र सुरक्षित है यह सुनिश्चित करें। कंधों को थपथपाएं और पूछें "क्या आप ठीक हैं?"' },
  { step: 2, title: 'Call for Help', titleHi: 'मदद के लिए कॉल करें', desc: 'Call 108 immediately or ask someone else to call. Put the phone on speaker.', descHi: 'तुरंत 108 पर कॉल करें या किसी से कराएं। फोन स्पीकर पर रखें।' },
  { step: 3, title: 'Position the Person', titleHi: 'व्यक्ति को लिटाएं', desc: 'Lay them on their back on a firm, flat surface. Tilt head back, lift chin to open airway.', descHi: 'उन्हें पीठ के बल सख्त, सपाट जगह पर लिटाएं। सिर पीछे झुकाएं, ठुड्डी उठाएं।' },
  { step: 4, title: 'Chest Compressions', titleHi: 'छाती पर दबाव', desc: 'Place heel of hand on center of chest. Press down 5–6 cm at 100–120 beats/minute. Do 30 compressions.', descHi: 'हाथ की एड़ी छाती के बीच रखें। 5-6 cm दबाएं, 100-120 बार/मिनट। 30 बार दबाएं।' },
  { step: 5, title: 'Rescue Breaths (if trained)', titleHi: 'बचाव सांस (अगर प्रशिक्षित हों)', desc: 'Give 2 rescue breaths after every 30 compressions. If not trained, do compression-only CPR continuously.', descHi: 'हर 30 दबाव के बाद 2 बचाव सांस दें। अगर प्रशिक्षित नहीं हैं, केवल दबाव जारी रखें।' },
  { step: 6, title: 'Continue Until Help Arrives', titleHi: 'मदद आने तक जारी रखें', desc: 'Keep going until the person starts breathing, an AED is available, or emergency services take over.', descHi: 'तब तक जारी रखें जब तक व्यक्ति सांस न लेने लगे, AED न मिले, या आपातकालीन सेवाएं न आएं।' },
];

const EMERGENCY_NUMBERS = [
  { number: '108', label: 'Ambulance (EMRI)', labelHi: 'एम्बुलेंस (EMRI)', desc: '24/7 Medical Emergency', descHi: '24/7 आपातकालीन चिकित्सा', color: 'bg-red-600 hover:bg-red-700 active:bg-red-800', icon: '🚑' },
  { number: '112', label: 'National Emergency', labelHi: 'राष्ट्रीय आपातकाल', desc: 'Police, Fire & Medical', descHi: 'पुलिस, दमकल और चिकित्सा', color: 'bg-red-700 hover:bg-red-800 active:bg-red-900', icon: '🆘' },
  { number: '104', label: 'Health Helpline', labelHi: 'स्वास्थ्य हेल्पलाइन', desc: 'Free medical guidance 24/7', descHi: '24/7 मुफ्त स्वास्थ्य सलाह', color: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800', icon: '📞' },
  { number: '1800-180-1104', label: 'NHP Helpline', labelHi: 'NHP हेल्पलाइन', desc: 'National Health Portal', descHi: 'राष्ट्रीय स्वास्थ्य पोर्टल', color: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800', icon: '🏥' },
];

const MENTAL_HEALTH_CRISIS = [
  { number: '1860-2662-345', label: 'Vandrevala Foundation', desc: '24/7 Mental Health Helpline', descHi: '24/7 मानसिक स्वास्थ्य सहायता' },
  { number: '9152987821', label: 'iCall Psychosocial Helpline', desc: 'Mon–Sat 8am–10pm', descHi: 'सोम-शनि सुबह 8 से रात 10' },
  { number: '14416', label: 'Tele-MANAS', desc: 'Govt. 24/7 Toll-free Mental Health', descHi: 'सरकारी 24/7 निःशुल्क मानसिक स्वास्थ्य' },
];

const IMMEDIATE_ACTIONS = [
  { icon: '📞', text: 'Call 108 or 112 immediately', textHi: '108 या 112 पर तुरंत कॉल करें' },
  { icon: '🧘', text: 'Keep the person calm and still', textHi: 'व्यक्ति को शांत और स्थिर रखें' },
  { icon: '👕', text: 'Loosen tight clothing around neck and chest', textHi: 'गर्दन और छाती के आसपास कसे कपड़े ढीले करें' },
  { icon: '🛋️', text: 'Lay them down safely if possible', textHi: 'यदि संभव हो तो उन्हें सुरक्षित रूप से लिटाएं' },
  { icon: '❄️', text: 'Do NOT give food or water if unconscious or choking', textHi: 'बेहोश होने पर खाना या पानी बिल्कुल न दें' },
  { icon: '🚗', text: 'Do NOT move a potentially spinal-injured person', textHi: 'रीढ़ की संभावित चोट वाले व्यक्ति को न हिलाएं' },
  { icon: '💊', text: 'Do NOT administer random medication without clinician advice', textHi: 'बिना डॉक्टर की सलाह के कोई दवा न दें' },
  { icon: '📍', text: 'Share your exact GPS location with emergency services', textHi: 'GPS स्थान नोट करें और आपातकालीन सेवाओं को दें' },
];

export const EmergencyPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCPR, setShowCPR] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [locationShared, setLocationShared] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  function toggleCheck(i: number) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      alert(lang === 'hi'
        ? 'जियोलोकेशन समर्थित नहीं है। कृपया आपातकालीन सेवाओं को अपना पता मैन्युअल रूप से बताएं।'
        : 'Geolocation not supported. Please share your address manually with emergency services.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        setLocationShared(true);
        if (navigator.share) {
          navigator.share({ title: lang === 'hi' ? 'मेरा आपातकालीन स्थान' : 'My Emergency Location', url });
        }
      },
      () => alert(lang === 'hi'
        ? 'स्थान नहीं मिल सका। कृपया पता मैन्युअल रूप से बताएं।'
        : 'Could not get location. Please share your address manually.'),
    );
  }

  return (
    <div className="min-h-screen bg-emergency-gradient text-white pb-16">
      {/* Compact Nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-red-200 hover:text-white transition-colors text-sm font-medium"
          aria-label="Go to home"
        >
          <ArrowLeft size={16} />
          {lang === 'hi' ? 'होम' : 'Home'}
        </button>
        <button
          onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1.5 text-red-200 hover:text-white transition-colors text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10"
          aria-label="Toggle language"
        >
          <Globe size={13} />
          {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </div>

      {/* Header */}
      <motion.div
        className="relative text-center py-8 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-5xl mb-3" role="img" aria-label="Emergency alert">
          🚨
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl mb-2 tracking-tight">
          {lang === 'hi' ? 'आपातकालीन सहायता' : 'EMERGENCY PROTOCOL'}
        </h1>
        <p className="text-red-200 text-sm sm:text-base max-w-md mx-auto">
          {lang === 'hi'
            ? 'शांत रहें। तुरंत आपातकालीन नंबरों पर कॉल करें। प्राथमिक उपचार का पालन करें।'
            : 'Stay calm. Call emergency services immediately. Follow step-by-step guidance.'}
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 space-y-5">
        {/* Primary Call Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-2xl p-5"
        >
          <h2 className="font-bold text-base sm:text-lg mb-3 flex items-center gap-2">
            <Phone size={18} className="text-red-400" />
            {lang === 'hi' ? 'आपातकालीन नंबर — अभी डायल करें' : 'Emergency Numbers — Call Now'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {EMERGENCY_NUMBERS.map((num, i) => (
              <motion.a
                key={i}
                href={`tel:${num.number}`}
                className={`flex flex-col items-center justify-center p-4 rounded-xl ${num.color} transition-all shadow-md text-center group`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-label={`Call ${lang === 'hi' ? num.labelHi : num.label} at ${num.number}`}
                id={`emergency-call-${num.number}`}
              >
                <span className="text-2xl mb-1">{num.icon}</span>
                <span className="font-black text-2xl tracking-wide">{num.number}</span>
                <span className="font-bold text-xs sm:text-sm mt-0.5">{lang === 'hi' ? num.labelHi : num.label}</span>
                <span className="text-[11px] opacity-80 mt-0.5">{lang === 'hi' ? num.descHi : num.desc}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Share Location Button */}
        <motion.button
          onClick={shareLocation}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-base transition-all shadow-md ${
            locationShared
              ? 'bg-green-600 text-white'
              : 'bg-white text-red-700 hover:bg-red-50'
          }`}
          id="share-location-btn"
        >
          <MapPin size={20} />
          {locationShared
            ? (lang === 'hi' ? '✓ स्थान कॉपी हुआ! ऑपरेटर को दें' : '✓ Location Copied! Share with operator')
            : (lang === 'hi' ? '📍 मेरा GPS स्थान कॉपी/शेयर करें' : '📍 Copy / Share My GPS Location')}
        </motion.button>

        {/* AI Emergency Commander & Ambulance Dispatch Simulation */}
        <EmergencyCommander lang={lang} />

        {/* 5-Step Emergency Command Workflow Pipeline */}
        <EmergencyWorkflow lang={lang} />

        {/* Nearby Hospitals & Emergency Facilities Finder */}
        <NearbyHospitalFinder lang={lang} />

        {/* CPR Guide Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-dark rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setShowCPR(!showCPR)}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/10 transition-colors"
            aria-expanded={showCPR}
            id="cpr-guide-toggle"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/30 rounded-xl flex items-center justify-center">
                <Heart size={20} className="text-red-300 animate-heartbeat" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm sm:text-base">{lang === 'hi' ? 'CPR त्वरित मार्गदर्शिका' : 'CPR Step-by-Step Guide'}</p>
                <p className="text-xs text-red-200">{lang === 'hi' ? 'बेहोश और सांस न लेने वाले व्यक्ति के लिए' : 'For unresponsive persons who are not breathing'}</p>
              </div>
            </div>
            <motion.div animate={{ rotate: showCPR ? 180 : 0 }}>
              <ChevronDown size={20} className="text-red-300" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showCPR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 text-xs text-amber-200">
                    ⚠ {lang === 'hi'
                      ? 'CPR केवल उस व्यक्ति पर करें जो बेहोश हो और सामान्य रूप से सांस न ले रहा हो।'
                      : 'CPR should only be performed on an unresponsive person who is not breathing normally.'}
                  </div>
                  {CPR_STEPS.map((step, i) => (
                    <div key={i} className="flex gap-3 text-xs sm:text-sm">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <div>
                        <p className="font-bold">{lang === 'hi' ? step.titleHi : step.title}</p>
                        <p className="text-xs text-red-200 mt-0.5 leading-relaxed">{lang === 'hi' ? step.descHi : step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Immediate Action Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-dark rounded-2xl p-5"
        >
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <Shield size={18} className="text-orange-400" />
            {lang === 'hi' ? 'तत्काल कार्रवाई चेकलिस्ट' : 'Immediate Action Checklist'}
          </h2>
          <div className="space-y-2">
            {IMMEDIATE_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                  checkedItems.has(i)
                    ? 'bg-green-600/30 border-green-400 text-green-100'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                }`}
                aria-pressed={checkedItems.has(i)}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  checkedItems.has(i) ? 'bg-green-500 border-green-400' : 'border-white/40'
                }`}>
                  {checkedItems.has(i) && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-lg shrink-0">{action.icon}</span>
                <span className="text-xs sm:text-sm font-medium">{lang === 'hi' ? action.textHi : action.text}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Mental Health Crisis Helpline Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-dark rounded-2xl p-5"
        >
          <h2 className="font-bold text-base mb-2 flex items-center gap-2">
            <LifeBuoy size={18} className="text-blue-300" />
            {lang === 'hi' ? 'मानसिक स्वास्थ्य आपातकालीन हेल्पलाइन' : 'Mental Health & Crisis Helplines'}
          </h2>
          <p className="text-xs text-red-200 mb-3">
            {lang === 'hi'
              ? 'यदि आप या कोई अन्य संकट या गंभीर तनाव में है, तो ये हेल्पलाइन निःशुल्क व गोपनीय सहायता प्रदान करती हैं।'
              : 'Free, confidential psychological support services available across India.'}
          </p>
          <div className="space-y-2">
            {MENTAL_HEALTH_CRISIS.map((h, i) => (
              <a
                key={i}
                href={`tel:${h.number.replace(/[^0-9]/g, '')}`}
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div>
                  <p className="font-bold text-xs sm:text-sm">{h.label}</p>
                  <p className="text-[11px] text-red-200">{lang === 'hi' ? h.descHi : h.desc}</p>
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">{h.number}</span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="text-center px-4 pt-2">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 text-xs text-red-200">
            <AlertTriangle size={13} />
            {lang === 'hi'
              ? 'यह स्क्रीन केवल मार्गदर्शन के लिए है। आपातकाल में हमेशा 108 पर कॉल करें।'
              : 'This guide is for emergency reference only. Always call 108 for life-threatening situations.'}
          </div>
        </div>
      </div>
    </div>
  );
};
