import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, ArrowRight, ExternalLink, 
  Phone, Sparkles, Filter, Heart, Baby, Pill, Apple, Info
} from 'lucide-react';
import { getEligibleSchemes } from '../data/schemesData';
import { GovernmentScheme, SchemeCategory } from '../types';

const INDIAN_STATES = [
  'All States', 'Uttar Pradesh', 'Bihar', 'Rajasthan', 'Maharashtra', 'Madhya Pradesh',
  'West Bengal', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Gujarat', 'Karnataka',
  'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Punjab', 'Haryana', 'Assam', 'Delhi'
];

const CHRONIC_CONDITIONS_LIST = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Tuberculosis', 'Asthma', 'Kidney Disease'
];

export const SchemesPage: React.FC = () => {
  const [age, setAge] = useState<number>(32);
  const [gender, setGender] = useState<string>('female');
  const [state, setState] = useState<string>('Uttar Pradesh');
  const [incomeCategory, setIncomeCategory] = useState<'BPL' | 'APL' | 'EWS' | 'middle'>('BPL');
  const [isPregnant, setIsPregnant] = useState<boolean>(true);
  const [hasChildUnder5, setHasChildUnder5] = useState<boolean>(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalScheme, setActiveModalScheme] = useState<GovernmentScheme | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Compute matched schemes based on inputs
  const matchedResults = getEligibleSchemes({
    age,
    gender,
    state,
    incomeCategory,
    isPregnant,
    hasChildUnder5,
    chronicConditions: selectedConditions,
  });

  const filteredSchemes = matchedResults.filter(r => {
    if (selectedCategory === 'all') return true;
    return r.scheme.category === selectedCategory;
  });

  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  const getCategoryIcon = (category: SchemeCategory) => {
    switch (category) {
      case 'insurance': return <Shield size={16} className="text-teal-600" />;
      case 'maternal': return <Heart size={16} className="text-rose-500" />;
      case 'child': return <Baby size={16} className="text-sky-500" />;
      case 'nutrition': return <Apple size={16} className="text-emerald-500" />;
      default: return <Pill size={16} className="text-indigo-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200 pt-8 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <Sparkles size={12} /> National Health Mission Aligned
                </span>
                <button
                  onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {lang === 'en' ? 'हिन्दी में देखें' : 'View in English'}
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                {lang === 'hi' ? 'सरकारी स्वास्थ्य योजना परामर्श' : 'Government Health Scheme Recommender'}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
                {lang === 'hi'
                  ? 'अपनी आयु, आय और स्वास्थ्य स्थिति के आधार पर अपने परिवार के लिए उपलब्ध सभी केंद्रीय व राज्य स्वास्थ्य लाभ खोजें।'
                  : 'Discover entitled central & state health insurance, maternity benefits, and free treatment schemes tailored to your profile.'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200/80 rounded-2xl p-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-lg">
                {matchedResults.length}
              </div>
              <div className="text-xs">
                <div className="font-bold text-teal-950">{lang === 'hi' ? 'संभावित योजनाएं' : 'Potentially Relevant Schemes'}</div>
                <div className="text-teal-700 font-medium">{lang === 'hi' ? 'आधिकारिक प्रक्रिया से सत्यापन आवश्यक' : 'Subject to official verification'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Citizen Eligibility Profile Form */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Filter size={18} className="text-teal-600" />
                {lang === 'hi' ? 'नागरिक पात्रता फ़िल्टर' : 'Eligibility Criteria'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'hi' ? 'सटीक योजनाएं खोजने के लिए जानकारी अपडेट करें' : 'Adjust criteria to view potentially relevant health welfare schemes'}
              </p>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'hi' ? 'आयु (वर्ष)' : 'Age (Years)'}</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 text-base sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'hi' ? 'लिंग' : 'Gender'}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-base sm:text-sm"
                >
                  <option value="female">{lang === 'hi' ? 'महिला (Female)' : 'Female'}</option>
                  <option value="male">{lang === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
                  <option value="other">{lang === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
                </select>
              </div>
            </div>

            {/* Income Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {lang === 'hi' ? 'आय श्रेणी / राशन कार्ड' : 'Income Category / Ration Card'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'BPL', label: 'BPL / Antyodaya' },
                  { id: 'EWS', label: 'EWS (< ₹3 Lakh)' },
                  { id: 'APL', label: 'APL (Standard)' },
                  { id: 'middle', label: 'Middle Class' },
                ].map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setIncomeCategory(tier.id as any)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${
                      incomeCategory === tier.id
                        ? 'bg-teal-50 border-teal-500 text-teal-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* State Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{lang === 'hi' ? 'राज्य' : 'State of Residence'}</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-base sm:text-sm"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Special Life Stage Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {gender === 'female' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60 text-xs font-bold text-rose-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>{lang === 'hi' ? 'वर्तमान में गर्भवती (Pregnant)' : 'Currently Pregnant (Eligible for JSY/PMMVY)'}</span>
                </label>
              )}

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50/60 border border-sky-200/60 text-xs font-bold text-sky-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasChildUnder5}
                  onChange={(e) => setHasChildUnder5(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>{lang === 'hi' ? 'परिवार में 5 वर्ष से कम का बच्चा' : 'Child under 5 years in family'}</span>
              </label>
            </div>

            {/* Chronic Conditions */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {lang === 'hi' ? 'दीर्घकालिक बीमारियां' : 'Pre-existing Conditions'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CHRONIC_CONDITIONS_LIST.map(cond => {
                  const isSel = selectedConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleCondition(cond)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSel
                          ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Two Columns: Matched Schemes Feed */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Informational Disclaimer Callout */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-950 flex items-start gap-2">
              <Info size={15} className="text-teal-700 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {lang === 'hi'
                  ? 'सूचना: संभावित योजनाएं स्व-रिपोर्ट की गई जानकारी पर आधारित हैं। अंतिम पात्रता की पुष्टि आधिकारिक सरकारी पोर्टल या स्थानीय सीएससी/ग्राम पंचायत में की जानी चाहिए।'
                  : 'Informational discovery tool: Potentially relevant scheme matches are based on self-reported criteria. Verify actual eligibility through the official government portal or at your local Common Service Centre (CSC).'}
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: lang === 'hi' ? 'सभी योजनाएं' : 'All Schemes' },
                { id: 'insurance', label: lang === 'hi' ? 'स्वास्थ्य बीमा' : 'Insurance Cover' },
                { id: 'maternal', label: lang === 'hi' ? 'मातृत्व सहायता' : 'Maternal Health' },
                { id: 'child', label: lang === 'hi' ? 'बाल स्वास्थ्य' : 'Child Care' },
                { id: 'nutrition', label: lang === 'hi' ? 'पोषण आहार' : 'Nutrition' },
                { id: 'general', label: lang === 'hi' ? 'मुफ्त दवाएं' : 'Free Medicines' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scheme Cards Grid */}
            <div className="space-y-4">
              {filteredSchemes.map(({ scheme, matchScore, matchReasons, matchReasonsHi }) => (
                <motion.div
                  key={scheme.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${scheme.color} text-white shadow-xs`}>
                        {getCategoryIcon(scheme.category)}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                          {scheme.ministry}
                        </span>
                        <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                          {lang === 'hi' ? scheme.nameHi : scheme.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} /> {matchScore}% {lang === 'hi' ? 'पात्र' : 'Match'}
                      </span>
                    </div>
                  </div>

                  {/* High Value Benefit Callout */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        {lang === 'hi' ? 'योजना का मुख्य लाभ' : 'Key Entitlement Benefit'}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-teal-900 mt-0.5">
                        {lang === 'hi' ? scheme.benefitHi : scheme.benefit}
                      </div>
                    </div>
                    {scheme.coverageAmount && (
                      <span className="font-black text-xs sm:text-sm text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shrink-0">
                        {scheme.coverageAmount}
                      </span>
                    )}
                  </div>

                  {/* AI Transparency: Why this scheme is recommended */}
                  <div className="text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100 flex items-start gap-2">
                    <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-teal-900">
                        {lang === 'hi' ? 'यह आपके लिए क्यों अनुशंसित है:' : 'Why recommended for your profile:'}{' '}
                      </span>
                      {lang === 'hi' ? matchReasonsHi[0] : matchReasons[0]}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {scheme.helplineNumber && (
                        <a
                          href={`tel:${scheme.helplineNumber}`}
                          className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Phone size={12} className="text-teal-600" /> Helpline: {scheme.helplineNumber}
                        </a>
                      )}
                      {scheme.website && (
                        <a
                          href={scheme.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                        >
                          Official Portal <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveModalScheme(scheme)}
                      className="text-xs font-bold bg-slate-900 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      {lang === 'hi' ? 'आवेदन प्रक्रिया देखें' : 'View Application Steps'}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}

              {filteredSchemes.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
                  <p className="text-base font-semibold">No schemes found for this category filter.</p>
                  <p className="text-xs mt-1">Try switching to "All Schemes" to see universal entitlements.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Scheme Detail & Application Guide Modal */}
      <AnimatePresence>
        {activeModalScheme && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-teal-600 uppercase">{activeModalScheme.ministry}</span>
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900">
                    {lang === 'hi' ? activeModalScheme.nameHi : activeModalScheme.name}
                  </h3>
                </div>
                <button onClick={() => setActiveModalScheme(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'hi' ? activeModalScheme.descriptionHi : activeModalScheme.description}
              </div>

              {/* Step-by-step Application Guide */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-sm text-slate-900">
                  {lang === 'hi' ? 'आवेदन करने के चरण:' : 'Step-by-Step Application Guide:'}
                </h4>
                <div className="space-y-2">
                  {(lang === 'hi' ? activeModalScheme.applicationStepsHi : activeModalScheme.applicationSteps).map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents Required */}
              {activeModalScheme.documentsRequired && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-xs text-slate-900 mb-1.5">
                    {lang === 'hi' ? 'आवश्यक दस्तावेज:' : 'Required Documents:'}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(lang === 'hi' ? activeModalScheme.documentsRequiredHi : activeModalScheme.documentsRequired)?.map((doc, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        ✓ {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {activeModalScheme.helplineNumber && (
                  <a
                    href={`tel:${activeModalScheme.helplineNumber}`}
                    className="text-xs font-bold text-slate-800 flex items-center gap-1"
                  >
                    <Phone size={14} className="text-teal-600" /> Helpline: {activeModalScheme.helplineNumber}
                  </a>
                )}

                <button
                  onClick={() => setActiveModalScheme(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl ml-auto"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
