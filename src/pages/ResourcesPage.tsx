import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, AlertTriangle, BookOpen, Wifi, Heart, Sparkles, Phone } from 'lucide-react';
import { HEALTH_GUIDES } from '../data/healthData';
import { getWellbeingGuidance, type WellbeingMood, type WellbeingGuidance } from '../services/aiService';
import type { Language } from '../types';

const CATEGORIES = ['All', 'Common Illness', 'First Aid', 'Emergency', 'Disaster', 'Preventive'];

const MOODS: { id: WellbeingMood; label: string; labelHi: string; icon: string }[] = [
  { id: 'calm', label: 'Calm', labelHi: 'शांत', icon: '🌿' },
  { id: 'okay', label: 'Okay', labelHi: 'ठीक-ठाक', icon: '🙂' },
  { id: 'stressed', label: 'Stressed', labelHi: 'तनाव में', icon: '😓' },
  { id: 'overwhelmed', label: 'Overwhelmed', labelHi: 'अभिभूत', icon: '🌪️' },
  { id: 'low', label: 'Low', labelHi: 'उदास / निराश', icon: '🌧️' },
];

export const ResourcesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');

  // Wellbeing check-in state
  const [selectedMood, setSelectedMood] = useState<WellbeingMood | null>(null);
  const [wellbeingLoading, setWellbeingLoading] = useState(false);
  const [wellbeingResult, setWellbeingResult] = useState<WellbeingGuidance | null>(null);

  const filtered = HEALTH_GUIDES.filter(g => {
    const matchCat = activeCategory === 'All' || g.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || g.title.toLowerCase().includes(q)
      || g.tags.some(t => t.includes(q))
      || g.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  async function handleSelectMood(mood: WellbeingMood) {
    setSelectedMood(mood);
    setWellbeingLoading(true);
    try {
      const guidance = await getWellbeingGuidance(mood, lang);
      setWellbeingResult(guidance);
    } catch {
      // handled internally by fallback in aiService
    } finally {
      setWellbeingLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-700 text-white px-4 py-10 sm:py-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              <Wifi size={12} />
              {lang === 'hi' ? 'ऑफलाइन उपलब्ध' : 'Offline Ready Guides'}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-black text-3xl sm:text-4xl mb-2"
          >
            {lang === 'hi' ? 'स्वास्थ्य एवं कल्याण संसाधन' : 'Health & Wellbeing Guides'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-teal-100 text-sm sm:text-base max-w-lg mx-auto"
          >
            {lang === 'hi'
              ? 'प्रमाण-आधारित प्राथमिक उपचार, मानसिक कल्याण और निवारक स्वास्थ्य मार्गदर्शिकाएं।'
              : 'Evidence-based first aid, supportive mental wellbeing check-in, and preventive health guides.'}
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative mt-6 max-w-md mx-auto"
          >
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'hi' ? 'गाइड खोजें (बुखार, जलन, लू, सांप का काटना...)' : 'Search guides (fever, burns, heatstroke...)'}
              className="w-full bg-white text-slate-900 placeholder-slate-400 pl-11 pr-4 py-3 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm font-medium"
              aria-label="Search health guides"
              id="resources-search"
            />
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                }`}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:border-teal-300 transition-colors shadow-2xs self-end sm:self-auto"
            aria-label="Toggle language"
          >
            🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>

        {/* Mental Wellbeing Check-In Widget (Real AI / Safe Guidance) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-teal-200/80 shadow-xs p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700">
              <Heart size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                {lang === 'hi' ? 'मानसिक कल्याण चेक-इन' : 'Mental Wellbeing Check-In'}
                <span className="text-[10px] px-2 py-0.5 bg-teal-100/70 text-teal-800 rounded-full font-semibold">
                  {wellbeingResult?.source === 'groq' ? '⚡ Groq AI' : 'Supportive'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'आज आप कैसा महसूस कर रहे हैं? सुरक्षित, गैर-नैदानिक मार्गदर्शन प्राप्त करें।'
                  : 'How are you feeling right now? Select your mood for supportive, non-diagnostic self-care tips.'}
              </p>
            </div>
          </div>

          {/* Mood Selector Buttons */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => handleSelectMood(m.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  selectedMood === m.id
                    ? 'border-teal-500 bg-teal-50/80 text-teal-900 ring-2 ring-teal-200 font-bold'
                    : 'border-slate-200 hover:border-teal-200 bg-slate-50/50 text-slate-700'
                }`}
              >
                <span className="text-xl sm:text-2xl mb-1">{m.icon}</span>
                <span className="text-[11px] font-semibold">{lang === 'hi' ? m.labelHi : m.label}</span>
              </button>
            ))}
          </div>

          {/* Wellbeing AI Output */}
          {wellbeingLoading && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center gap-2 text-xs text-teal-700 font-medium">
              <Sparkles size={14} className="animate-spin" />
              <span>{lang === 'hi' ? 'कल्याण मार्गदर्शन तैयार हो रहा है...' : 'Generating compassionate guidance...'}</span>
            </div>
          )}

          {wellbeingResult && !wellbeingLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3 text-xs sm:text-sm text-slate-800"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-teal-950">
                  {lang === 'hi' ? 'आपके लिए मार्गदर्शन' : 'Supportive Guidance'}
                </p>
                <span className="text-[10px] text-teal-700 font-medium">
                  {wellbeingResult.source === 'groq' ? 'Groq AI' : 'Standard Self-Care'}
                </span>
              </div>

              <p className="leading-relaxed font-medium text-slate-800">
                {lang === 'hi' ? wellbeingResult.messageHi : wellbeingResult.message}
              </p>

              {wellbeingResult.suggestions && wellbeingResult.suggestions.length > 0 && (
                <div className="pt-2 border-t border-teal-200/60 space-y-1.5">
                  <p className="font-semibold text-slate-900 text-xs">{lang === 'hi' ? 'सुझाए गए कदम:' : 'Gentle self-care suggestions:'}</p>
                  {(lang === 'hi' ? (wellbeingResult.suggestionsHi || wellbeingResult.suggestions) : wellbeingResult.suggestions).map((s, i) => (
                    <p key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{s}</span>
                    </p>
                  ))}
                </div>
              )}

              {wellbeingResult.showCrisisInfo && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Phone size={12} className="text-amber-700" />
                    {lang === 'hi' ? 'निःशुल्क संकट सहायता हेल्पलाइन' : 'Free Confidential Helplines:'}
                  </p>
                  <p className="text-[11px]">
                    Tele-MANAS: <span className="font-bold">14416</span> | Vandrevala Foundation: <span className="font-bold">1860-2662-345</span>
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 italic">
                {lang === 'hi'
                  ? '* यह सामान्य मार्गदर्शन है, कोई चिकित्सीय या नैदानिक उपचार नहीं।'
                  : '* This is supportive wellbeing guidance, not clinical mental health diagnosis.'}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Offline Notice */}
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-xs sm:text-sm shadow-2xs">
          <BookOpen size={18} className="shrink-0 text-blue-600" />
          <span>
            {lang === 'hi'
              ? 'ये स्वास्थ्य गाइड एक बार लोड होने के बाद ऑफलाइन भी उपलब्ध रहती हैं।'
              : 'These first aid and health guides remain accessible offline once loaded. Bookmark this page for remote access.'}
          </span>
        </div>

        {/* Results Counter */}
        <p className="text-xs text-slate-500 font-medium">
          {lang === 'hi'
            ? `${filtered.length} मार्गदर्शिकाएं उपलब्ध`
            : `Showing ${filtered.length} guide${filtered.length !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}`}
        </p>

        {/* Guides Accordion List */}
        <div className="space-y-3.5">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                <Search size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-bold text-slate-700 text-sm">No guides found</p>
                <p className="text-xs mt-1">Try another search keyword like fever, burn, dehydration</p>
              </div>
            ) : (
              filtered.map((guide, i) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
                    className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-slate-50 transition-colors"
                    aria-expanded={expandedId === guide.id}
                  >
                    <div className={`w-11 h-11 ${guide.bgColor} rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-2xs`}>
                      {guide.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-sm sm:text-base text-slate-900 ${guide.color}`}>
                          {lang === 'en' ? guide.title : guide.titleHi}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold">
                          {guide.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {lang === 'en' ? guide.description : guide.descriptionHi}
                      </p>
                    </div>
                    <motion.div animate={{ rotate: expandedId === guide.id ? 180 : 0 }}>
                      <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedId === guide.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
                          {/* Steps to Follow */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-2.5">
                              {lang === 'en' ? 'Recommended Steps to Follow:' : 'पालन करने के चरण:'}
                            </h4>
                            <ol className="space-y-2">
                              {(lang === 'en' ? guide.steps : guide.stepsHi).map((step, j) => (
                                <li key={j} className="flex gap-2.5 text-xs sm:text-sm text-slate-700">
                                  <span className={`${guide.color} font-bold shrink-0 w-4`}>{j + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Warnings */}
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                            <h4 className="font-bold text-red-900 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-red-600" />
                              {lang === 'en' ? 'When to Seek Urgent Medical Care:' : 'कब तत्काल अस्पताल जाएं:'}
                            </h4>
                            <ul className="space-y-1">
                              {(lang === 'en' ? guide.warnings : guide.warningsHi).map((w, j) => (
                                <li key={j} className="text-xs text-red-800 flex items-start gap-1.5">
                                  <span className="text-red-500 font-bold shrink-0">⚠</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
