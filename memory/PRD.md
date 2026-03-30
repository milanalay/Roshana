# NurseReady - Product Requirements Document

## Original Problem Statement
Build a mobile-first nursing reference and study app called "NurseReady" for student enrolled nurses and healthcare professionals in Australia. This is a personal study and reference tool — not a diagnostic or clinical decision-making tool.

**Note (Dec 2025):** User scoped down to focus on core reference features: Drug search, calculators, emergency reference, lab values, AI chat, and communication/handover guides. Removed: specialty areas, study & exam prep, pathophysiology, cultural safety, recently viewed tracking.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB (localStorage for bookmarks)
- **AI Integration**: Claude Haiku 4.5 via Emergent LLM Key
- **External APIs**: OpenFDA (drug data), RxNorm (interactions)

## User Personas
1. **Student Enrolled Nurse** - Primary user, studying for NCLEX, needs quick reference
2. **Healthcare Professional** - Working nurse needing quick clinical reference

## Core Requirements
- Mobile-first PWA design
- Australian clinical context (SI units, AHPRA/NMBA references)
- Comprehensive disclaimers for patient safety
- Bottom navigation with 5 tabs
- Emergency FAB button always visible
- Dark mode support

## What's Been Implemented (v1.2 - Dec 2025)

### Backend APIs (100% Complete)
- `/api/categories` - 9 category cards (scoped down)
- `/api/lab-values` - 29 lab values with SI units
- `/api/emergencies` - 8 emergency reference cards
- `/api/calculators` - 15 clinical calculators
- `/api/abbreviations` - 74 medical abbreviations
- `/api/terminology` - 100 medical terms
- `/api/body-systems` - 8 body systems reference
- `/api/drugs/search` - OpenFDA with AU name mapping + deduplication (single-ingredient prioritized)
- `/api/drugs/interactions` - Drug interaction checker via RxNorm
- `/api/term-lookup` - Term definition popup API
- `/api/chat` - Claude AI chat integration
- `/api/search` - Global search (now includes drugs + communication)
- `/api/communication` - ISBAR/SBAR handover guides (6 guides)
- `/api/nursing-tip` - Daily nursing tip

### Frontend Pages (100% Complete)
- Home page with time-aware greeting, search, category grid
- Search page with global search (drugs, labs, terms, emergencies, communication)
- Calculators page with 15 working calculators
- AI Chat page with Claude Haiku integration
- Emergency Reference page with 8 emergency cards + bookmarks
- Lab Values page with 29 values, filtering + bookmarks
- Abbreviations page with 74 items, search and filtering
- Medical Terminology page with 100 terms
- Body Systems reference page
- Drug Search page with AU name mapping, deduplication + bookmarks
- Communication & Handover page (ISBAR, SBAR, bedside handover, PACE escalation)
- Bookmarks page (localStorage persistence)
- Settings/More page with dark mode toggle and bookmarks link

### Key Features Implemented
- ✅ Splash disclaimer on first launch
- ✅ Persistent footer disclaimer banner
- ✅ Bottom navigation (5 tabs)
- ✅ Emergency FAB button (always visible)
- ✅ Dark mode toggle
- ✅ 15 clinical calculators with live calculation
- ✅ AI Chat with Australian nursing-focused system prompt
- ✅ Color-coded results (Green=Normal, Yellow=Caution, Red=Critical)
- ✅ Australian SI units throughout
- ✅ Source attribution on content
- ✅ Australian drug name mapping (Paracetamol→Acetaminophen, etc.)
- ✅ Drug search deduplication (single-ingredient drugs prioritized)
- ✅ Drug interaction checker API (RxNorm)
- ✅ Global search finds drugs (navigates to /drugs?q={name})
- ✅ Communication & Handover guides (ISBAR, SBAR with examples)
- ✅ Bookmarks (localStorage) with star icons on drugs, labs, emergency cards
- ✅ PWA manifest.json for installable app
- ✅ Service worker for offline caching
- ✅ vercel.json for Vercel deployment

### Calculators (15 Total)
1. Drug Dose Calculator
2. IV Drip Rate Calculator
3. Infusion Rate Calculator (mcg/kg/min)
4. Weight-Based Dose Calculator
5. BMI Calculator
6. Glasgow Coma Scale (GCS)
7. NEWS2 Score (7 parameters)
8. CURB-65 Score (pneumonia severity)
9. Wells Score (DVT)
10. Wells Score (PE)
11. APGAR Score (newborn)
12. eGFR/CrCl Calculator
13. Parkland Formula (burns)
14. Paediatric Weight Estimator
15. Unit Converter

## Bugs Fixed (Dec 2025)
- ✅ Global search now finds drugs/medications (returns suggestions from AU_TO_US mapping)
- ✅ Drug search "paracetamol" now shows single-ingredient ACETAMINOPHEN first (deduplication)
- ✅ Removed "Recently Viewed" section from homepage (user request)
- ✅ Communication page created with 6 handover frameworks

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core navigation and routing
- [x] Emergency reference cards (8 total)
- [x] Lab values with ranges (29 total)
- [x] Clinical calculators (15 total)
- [x] AI Chat integration
- [x] Australian drug name mapping
- [x] Drug search deduplication
- [x] Global search with drugs
- [x] Communication & Handover guides
- [x] Bookmarks UI (drugs, labs, emergencies)

### P1 (Important) - Backlog
- [ ] Integrate TermPopup component into content pages (component exists at /components/TermPopup.jsx)
- [ ] IV compatibility checker
- [ ] More drug interaction details
- [ ] Professional/Regulatory section content

### P2 (Nice to Have) - Future
- [ ] Quiz/flashcard functionality
- [ ] User accounts and cloud sync
- [ ] Push notifications for study reminders
- [ ] Offline content sync indicator

## Technical Notes
- Backend runs on port 8001
- Frontend runs on port 3000
- MongoDB for data persistence
- localStorage for bookmarks
- EMERGENT_LLM_KEY for Claude AI access (or ANTHROPIC_API_KEY)
- OpenFDA API for drug data (US-based, Australian disclaimer included)
- Drug search prioritizes single-ingredient drugs over combinations
