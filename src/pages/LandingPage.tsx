import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ChevronRight, ChevronDown, Phone, Check, Mic, Shield, ArrowRight,
  Sparkles, FileCheck, Brain,
  Building2, FileText, BarChart3
} from 'lucide-react';
import { useCounter } from '../hooks/useCounter';
import { IMPACT_STATS, USER_NEEDS, FAQS } from '../data/healthData';

// Animated ECG line
const ECGLine: React.FC = () => (
  <svg viewBox="0 0 400 60" className="w-full h-10 text-teal-400" aria-hidden="true">
    <motion.polyline
      points="0,30 40,30 50,10 60,50 70,30 100,30 110,5 120,55 130,30 180,30 190,15 200,45 210,30 260,30 270,10 280,50 290,30 340,30 350,15 360,45 370,30 400,30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
    />
  </svg>
);

// Stat Counter Card
const StatCard: React.FC<{
  label: string;
  value: number;
  suffix?: string;
  delay: number;
}> = ({ label, value, suffix = '', delay }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useCounter(value, 2000, inView);

  return (
    <motion.div
      ref={ref}
      className="text-center p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
        {count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="text-teal-100 text-xs sm:text-sm mt-1 font-medium">{label}</div>
    </motion.div>
  );
};

// FAQ Accordion item
const FAQItem: React.FC<{ q: string; a: string; idx: number }> = ({ q, a, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
        id={`faq-${idx}`}
      >
        <span className="font-semibold text-slate-800 text-sm pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-teal-600 shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// How MediBridge Thinks — step node
const ThinkingStep: React.FC<{
  icon: React.ReactNode;
  label: string;
  desc: string;
  index: number;
  isLast?: boolean;
}> = ({ icon, label, desc, index, isLast }) => (
  <motion.div
    className="flex flex-col items-center text-center relative"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="w-12 h-12 bg-white border-2 border-teal-200 rounded-2xl flex items-center justify-center shadow-md mb-3 relative z-10">
      <span className="text-teal-600">{icon}</span>
    </div>
    <p className="font-bold text-slate-800 text-xs sm:text-sm mb-1">{label}</p>
    <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed max-w-[100px]">{desc}</p>
    {!isLast && (
      <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gradient-to-r from-teal-200 to-transparent" aria-hidden="true" />
    )}
  </motion.div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center bg-hero-gradient overflow-hidden">
        {/* Subtle background circles */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-8%] left-[-5%] w-96 h-96 bg-teal-100 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[-5%] w-80 h-80 bg-cyan-100 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* ── LEFT COLUMN: Hero content ── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Tag */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-xs font-bold text-teal-800 mb-4">
                <span>MediBridge AI</span>
                <span className="text-teal-400">•</span>
                <span>Closing the rural healthcare referral loop</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 variants={itemVariants} className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.1] mb-4">
                From first symptom<br className="hidden sm:inline" />{' '}
                <span className="text-teal-600">to completed care.</span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p variants={itemVariants} className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 max-w-xl">
                AI-assisted urgency assessment that connects patients, ASHA workers and PHCs through a continuous care journey.
              </motion.p>

              {/* Care Journey Flow Pills: SYMPTOM -> ASSESS -> REFER -> CARE -> FOLLOW-UP */}
              <motion.div variants={itemVariants} className="flex items-center gap-1.5 mb-6 flex-wrap">
                {[
                  { label: 'SYMPTOM', desc: 'Rural Input' },
                  { label: 'ASSESS', desc: 'Groq + Safety' },
                  { label: 'REFER', desc: 'PHC Linkage' },
                  { label: 'CARE', desc: 'Consult & Labs' },
                  { label: 'FOLLOW-UP', desc: 'ASHA Closure' },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <span className="inline-flex flex-col text-center bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-xs">
                      <span className="font-display font-black text-[11px] text-teal-700 tracking-wider">{step.label}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{step.desc}</span>
                    </span>
                    {i < arr.length - 1 && <ArrowRight size={13} className="text-teal-400 shrink-0" />}
                  </React.Fragment>
                ))}
              </motion.div>

              {/* Care team image — mobile only (shows between pills and CTA) */}
              <motion.div
                className="block lg:hidden mb-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              >
                <img
                  src="/assets/medibridge-care-team.png"
                  alt="MediBridge AI care team illustration"
                  className="w-full max-h-60 object-contain drop-shadow-sm"
                  loading="eager"
                />
              </motion.div>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-8">
                <motion.button
                  onClick={() => navigate('/assessment')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-colors shadow-md shadow-teal-600/20 group"
                  id="hero-start-assessment"
                >
                  <Activity size={18} />
                  Start Assessment
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  onClick={() => navigate('/care-journey')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-xs"
                  id="hero-see-how-it-works"
                >
                  <Building2 size={16} />
                  See How It Works
                </motion.button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-600" /> Free &amp; confidential</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-600" /> Offline-first queue</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-600" /> English, हिंदी (Marathi planned)</span>
                <span className="flex items-center gap-1.5"><Check size={13} className="text-teal-600" /> Not a diagnosis</span>
              </motion.div>

              {/* ECG Visualizer */}
              <motion.div variants={itemVariants} className="max-w-sm mt-6 opacity-70">
                <ECGLine />
              </motion.div>
            </motion.div>

            {/* ── RIGHT COLUMN: Care team image (desktop only) ── */}
            <motion.div
              className="hidden lg:flex items-center justify-center"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: 'easeOut' }}
            >
              <img
                src="/assets/medibridge-care-team.png"
                alt="MediBridge AI care team illustration"
                className="w-full max-h-[500px] object-contain drop-shadow-md"
                loading="eager"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── HOW MEDIBRIDGE THINKS ── */}
      <section className="py-16 px-4 bg-white border-y border-slate-100" aria-labelledby="how-thinks-heading">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">Transparent AI</span>
            <h2 id="how-thinks-heading" className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1.5">
              How MediBridge thinks
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
              This is not a simple chatbot. Every step is deliberate, explainable, and safety-first.
            </p>
          </motion.div>

          {/* Thinking pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            {[
              {
                icon: <Mic size={20} />,
                label: 'Your Symptoms',
                desc: 'Voice or text, Hindi or English',
              },
              {
                icon: <Brain size={20} />,
                label: 'Contextual Questions',
                desc: 'Groq AI adapts to your specific context',
              },
              {
                icon: <Shield size={20} />,
                label: 'Safety Check',
                desc: 'Deterministic emergency pattern detection',
              },
              {
                icon: <Sparkles size={20} />,
                label: 'AI Triage',
                desc: 'Reasoning factors, not just labels',
              },
              {
                icon: <FileCheck size={20} />,
                label: 'Guided Next Step',
                desc: 'Care navigation + doctor summary',
              },
            ].map((step, i, arr) => (
              <ThinkingStep key={i} {...step} index={i} isLast={i === arr.length - 1} />
            ))}
          </div>

          <motion.p
            className="text-center text-[11px] text-slate-400 mt-10 flex items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Shield size={12} className="text-teal-400" />
            AI-assisted triage — not a medical diagnosis. Always consult a qualified healthcare professional.
          </motion.p>
        </div>
      </section>

      {/* ── 4-STEP PROCESS ── */}
      <section className="py-16 px-4 max-w-6xl mx-auto" aria-labelledby="how-it-works-heading">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">How It Works</span>
          <h2 id="how-it-works-heading" className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 mt-1.5">
            From symptoms to the right care
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            MediBridge bridges the critical gap between symptom onset and clinical consultation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              icon: <Mic size={22} className="text-teal-600" />,
              bg: 'bg-teal-50',
              border: 'border-teal-100',
              title: 'Voice or Text Input',
              desc: 'Describe symptoms naturally in Hindi or English. Designed for rural & elderly accessibility.',
            },
            {
              step: '02',
              icon: <Sparkles size={22} className="text-blue-600" />,
              bg: 'bg-blue-50',
              border: 'border-blue-100',
              title: 'Adaptive AI Questions',
              desc: 'Groq AI asks follow-up questions tailored to your specific symptoms and context.',
            },
            {
              step: '03',
              icon: <Shield size={22} className="text-green-600" />,
              bg: 'bg-green-50',
              border: 'border-green-100',
              title: 'Explainable Reasoning',
              desc: 'Clear factors explaining why a specific urgency level was recommended — not just a label.',
            },
            {
              step: '04',
              icon: <FileCheck size={22} className="text-purple-600" />,
              bg: 'bg-purple-50',
              border: 'border-purple-100',
              title: 'Doctor-Ready Summary',
              desc: 'AI-generated clinical summary and PDF ready to present to your PHC doctor or clinician.',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="card-premium p-5 text-center relative card-hover cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`w-12 h-12 ${item.bg} rounded-xl border ${item.border} flex items-center justify-center mx-auto mb-3 shadow-xs`}>
                {item.icon}
              </div>
              <span className="text-xs font-bold text-teal-600 mb-1 block">Step {item.step}</span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5">{item.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3-LEVEL URGENCY TIERS ── */}
      <section className="py-14 px-4 bg-section-alt border-y border-slate-200/80" aria-labelledby="urgency-heading">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 id="urgency-heading" className="font-display font-black text-2xl sm:text-3xl text-slate-900">
              Clear 3-Tier Action System
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5">Calm, decisive navigation tailored for every situation</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                colorBar: 'bg-green-500',
                glow: 'urgency-green-glow',
                badge: 'bg-green-100 text-green-800 border-green-200',
                label: 'GREEN',
                icon: '🟢',
                title: 'Home Care & Monitoring',
                desc: 'Symptoms appear mild. Safe for home care, hydration, rest, and re-evaluation.',
                actions: ['Adequate rest and fluid intake', 'Home monitoring for 24–48h', 'Doctor visit if not resolved in 3 days'],
              },
              {
                colorBar: 'bg-amber-500',
                glow: 'urgency-yellow-glow',
                badge: 'bg-amber-100 text-amber-800 border-amber-200',
                label: 'YELLOW',
                icon: '🟡',
                title: 'Clinic Consultation (24h)',
                desc: 'Symptoms warrant clinical assessment at a Primary Health Centre or local clinic.',
                actions: ['Visit PHC / local clinic within 24h', 'Bring Doctor-Ready report summary', 'Seek immediate care if symptoms worsen rapidly'],
              },
              {
                colorBar: 'bg-red-500',
                glow: 'urgency-red-glow',
                badge: 'bg-red-100 text-red-800 border-red-200',
                label: 'RED',
                icon: '🔴',
                title: 'Immediate Emergency Care',
                desc: 'Symptoms suggest potentially severe conditions requiring prompt emergency assistance.',
                actions: ['Call 108 or 112 immediately', 'Do not delay or self-medicate', 'Proceed directly to nearest Emergency Room'],
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden ${item.glow}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className={`${item.colorBar} h-1.5`} />
                <div className="p-5">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold mb-3 ${item.badge}`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{item.title}</h3>
                  <p className="text-slate-600 text-xs mb-3 leading-relaxed">{item.desc}</p>
                  <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                    {item.actions.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check size={13} className="text-teal-600 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VHIN & SCHEMES 2-COLUMN SPOTLIGHT ── */}
      <section className="py-16 px-4 max-w-6xl mx-auto" aria-labelledby="sih-innovation-heading">
        <div className="text-center mb-12">
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">Rural Healthcare Infrastructure</span>
          <h2 id="sih-innovation-heading" className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 mt-1">
            Bridging Healthcare for 800M Citizens &amp; ASHA Workers
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            MediBridge AI powers frontline healthcare surveillance, village triage, and universal entitlement access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Village Health Intelligence Network (VHIN) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                  <Building2 size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  ASHA Field Platform
                </span>
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">
                Village Health Intelligence Network (VHIN)
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                Empowering ASHA workers with mobile household health surveys, automated family risk triage, and disease cluster vigilance — 100% offline-ready.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  'Bharat Health Readiness Score (BHRS) for each village',
                  'High-risk pregnant women and malnutrition tracking',
                  'Symptom cluster alerts before outbreaks spread',
                  'Full offline local storage with automatic cloud sync'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check size={14} className="text-teal-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              onClick={() => navigate('/village-health')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-slate-900 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
            >
              Explore Village Network <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          {/* Card 2: Government Scheme Recommender */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <FileText size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Entitlement Engine
                </span>
              </div>
              <h3 className="font-display font-black text-xl text-slate-900 mb-2">
                Government Health Scheme Discovery
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                Over 70% of eligible rural families miss out on critical schemes due to lack of awareness. MediBridge AI matches you to PM-JAY, JSY, and PMMVY in 1 tap.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  '₹5,00,000 Cashless Cover under Ayushman Bharat (PM-JAY)',
                  'Direct cash transfer for safe hospital delivery (JSY/PMMVY)',
                  'Free diagnostic and medicine access at all PHCs',
                  'Explainable AI: "Why this scheme is recommended for you"'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              onClick={() => navigate('/schemes')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Find Your Health Schemes <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── NATIONAL HEALTHCARE ECOSYSTEM FLOW ── */}
      <section className="py-14 px-4 bg-slate-100/70 border-y border-slate-200/80" aria-labelledby="ecosystem-heading">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">Unified Healthcare Architecture</span>
          <h2 id="ecosystem-heading" className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1 mb-8">
            How MediBridge Connects Every Healthcare Layer
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                step: '1',
                title: 'Citizen AI Triage',
                desc: 'Voice/Text symptom guidance with explainable clinical next steps',
                icon: <Mic size={20} className="text-teal-600" />,
                to: '/assessment'
              },
              {
                step: '2',
                title: 'ASHA Field Surveys',
                desc: 'Offline household health records and village score tracking',
                icon: <Building2 size={20} className="text-emerald-600" />,
                to: '/village-health'
              },
              {
                step: '3',
                title: 'Entitlement Access',
                desc: 'Automated matching to 15+ Central & State government schemes',
                icon: <FileText size={20} className="text-amber-600" />,
                to: '/schemes'
              },
              {
                step: '4',
                title: 'Command Center',
                desc: 'Referral continuity pipeline and care bottleneck visibility',
                icon: <BarChart3 size={20} className="text-indigo-600" />,
                to: '/impact'
              },
            ].map((node, i) => (
              <div
                key={i}
                onClick={() => navigate(node.to)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-400 hover:shadow-sm cursor-pointer transition-all text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {node.icon}
                  </div>
                  <span className="text-xs font-black text-slate-300">0{node.step}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{node.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS (Clearly labeled Prototype Vision) ── */}
      <section className="py-14 px-4 bg-teal-gradient text-white" aria-labelledby="impact-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold px-3 py-1 bg-white/15 rounded-full border border-white/20 uppercase tracking-wide">
              Prototype Vision &amp; Scalability Target
            </span>
            <h2 id="impact-heading" className="font-display font-black text-2xl sm:text-3xl text-white mt-2">
              Target Impact for Bharat
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {IMPACT_STATS.map((stat, i) => (
              <StatCard key={i} value={stat.value} suffix={stat.suffix} label={stat.label} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── USER NEEDS & DESIGN RESPONSES ── */}
      <section className="py-16 px-4 max-w-6xl mx-auto" aria-labelledby="user-needs-heading">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">User Need → Design Response</span>
          <h2 id="user-needs-heading" className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">
            Built for Rural Healthcare Reality
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Grounded in frontline healthcare worker and rural caregiver workflows
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {USER_NEEDS.map((item, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">{item.icon}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Target User
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">{item.role}</h3>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    User Need
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{item.need}"
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                  MediBridge Design Response
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {item.designResponse}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-4 bg-section-alt border-t border-slate-200/80" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 id="faq-heading" className="font-display font-black text-2xl sm:text-3xl text-slate-900">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div className="space-y-2.5">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.question} a={faq.answer} idx={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 bg-slate-900 text-white relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="relative max-w-3xl mx-auto text-center space-y-4">
          <p className="text-teal-400 font-bold text-xs uppercase tracking-wider">MediBridge AI</p>
          <h2 id="cta-heading" className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
            MediBridge doesn't replace doctors.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            It helps people <strong className="text-teal-300">reach the right level of care sooner</strong>, reducing unnecessary delays and clinic overload.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <motion.button
              onClick={() => navigate('/assessment')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-teal-500 hover:bg-teal-400 text-white px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-md transition-colors"
              id="cta-assessment"
            >
              Start Health Assessment →
            </motion.button>
            <motion.button
              onClick={() => navigate('/emergency')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="border border-red-500/60 bg-red-950/40 text-red-300 hover:bg-red-900/60 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2"
              id="cta-emergency"
            >
              <Phone size={16} />
              Emergency Guide
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
};
