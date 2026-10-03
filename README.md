# MediBridge AI — Rural Healthcare Continuity Platform

> 🏆 **HackCulture Hacktivate 2.0 — HealthTech Track: Healthcare Management**

MediBridge AI connects **Citizens**, **ASHA Frontline Health Workers**, and **Primary Health Centres (PHCs)** into a shared referral and care continuity system — from first symptom to completed care.

---

## What it does

```
SYMPTOM → AI TRIAGE → CARE LEVEL → FACILITY MATCH → REFERRAL → CONSULTATION → DIAGNOSTICS → ASHA FOLLOW-UP → COMPLETED CARE
```

---

## Key Features

- **MediBridge Sentinel** — Tracks symptom report counts across demo villages and flags unusual weekly changes.
- **Facility Matching** — Ranks nearby facilities using urgency level, available services, distance, and current load.
- **Referral Tracking** — End-to-end status tracking from referral creation through PHC acceptance, consultation, lab work, ASHA follow-up, and case closure.
- **Safety Checks** — Emergency keyword detection runs on the client before the AI is called. The AI cannot downgrade a result already flagged RED.
- **Health Command Center** — District-level overview of referral queues, bottlenecks, and facility workloads.
- **Family Health** — Track vitals history for family members and compare measurements across visits.
- **Data Provenance Badges** — Every metric clearly labeled as patient-entered, prototype data, rule-based, or AI-assisted.

---

## App Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/assessment` | Bilingual symptom triage with AI care navigator |
| `/care-journey` | 10-step visual referral status tracking |
| `/village-health` | ASHA Field Hub — surveys, Sentinel alerts, district risk map |
| `/facility` | PHC Care Desk — intake queue, consultation, lab scheduling |
| `/impact` | Health Command Center — KPI cards, action queue, referral funnel |
| `/report` | Care plan and doctor-ready handoff with PDF export |
| `/family` | Family health history and longitudinal vitals tracking |
| `/schemes` | Government welfare scheme eligibility checker |
| `/emergency` | Emergency response, 108/112 quick dial, hospital finder |
| `/resources` | Bilingual first-aid guides and wellbeing check-in |
| `/about` | Project overview and safety guardrails explanation |

---

## Quick Start

```bash
npm install
npm run dev
```

The app runs at **http://localhost:5175** (or the next available port).

To enable AI-powered triage, add a `.env` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com). Without this, the app runs in offline fallback mode with static responses.

```bash
# Type check + production build
npm run build

# Lint
npm run lint
```

---

## Hackathon Disclosure

MediBridge AI was built for **HackCulture Hacktivate 2.0 (HealthTech: Healthcare Management)**. All village risk scores, facility capabilities, and population statistics shown in the app are clearly labeled as **prototype synthetic data** and are not real government or clinical records.