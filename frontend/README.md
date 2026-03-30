# 🩺 NurseReady

> An Australian nursing student placement companion — drug reference, clinical calculators, quiz mode, safety scenarios, and study tools. Built as a Progressive Web App for offline-first use on mobile.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://nurse-ready-app.vercel.app)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?logo=googlechrome)](https://nurse-ready-app.vercel.app)
[![Educational Use Only](https://img.shields.io/badge/Use-Educational%20Only-orange)](https://github.com/milanalay/NurseReady-App)

---

## ⚠️ Educational Disclaimer

**NurseReady is for educational purposes only.** It is not a clinical decision support tool and must never replace:
- Current MIMS Australia or AMH drug references
- Your facility's medication charts and policies
- The guidance of your clinical supervisor, preceptor, or pharmacist
- AHPRA-registered nurse or doctor judgment

Drug information may change. Always verify against your facility's current formulary before administering any medication. The developers accept no liability for clinical decisions made using this application.

---

## ✨ Features

### 🏠 Home Tab
- Time-based welcome greeting (morning / afternoon / evening)
- Quick-launch tiles to all tabs + "Must-Know S8s" deep-link
- Drug of the Day (deterministic daily pick from the full database)
- Quick-reference checklists: Before Every Opioid · Insulin Safety · Anticoagulant Alerts
- Suffix cheat sheet (horizontal scroll, tappable — deep-links to drug search)
- Placement tips ticker (auto-advancing 6-tip carousel)
- PWA install banner (appears when `beforeinstallprompt` fires)
- Scroll-to-top floating button

### 💊 Drugs Tab
- **120+ Australian drugs** extracted from study guides and formatted for nurses
- A-Z browse with sticky section headers
- Real-time local search (generic name, brand name, drug class, suffix clue)
- Tappable drug detail bottom sheet with 4 tabs:
  - **Overview** — indications, routes, available forms
  - **Nursing** — numbered nursing considerations, relevant labs, patient teaching
  - **Doses** — normal dose (large format), max dose, forms
  - **Warnings** — red flags, hold conditions, contraindications, side effects
- PBS listed badge, schedule badge (S2/S3/S4/S8), category colour coding

### 🧮 Calc Tab (8 calculators)
| Calculator | Formula |
|---|---|
| BMI | weight(kg) ÷ height(m)² + WHO category |
| Weight-based Drug Dose | mg/kg × weight |
| IV Drip Rate | drops/min + mL/hr with drop factor selector |
| GFR / CrCl | Cockcroft-Gault (Australian µmol/L creatinine) |
| 24h Fluid Balance | Intake − Output, 3-column display |
| GCS | Eyes + Verbal + Motor with severity label |
| NEWS2 | Full RCP scoring with 7-parameter breakdown |
| Paediatric Weight | APLS formula (1 month – 12 years) |

### 🧠 Quiz Tab
- Category filter (All or any of 8 drug categories)
- Question count selector (5 / 10 / 15 / 20)
- 5 dynamic question types generated from drug database at runtime:
  - Schedule identification
  - Brand name recognition
  - Hold-if conditions
  - Drug class identification
  - Red flag recognition
- Immediate answer feedback (green/red) with correct answer shown
- Results screen: score, percentage, performance badge, full per-question review
- Retry and New Quiz options

### 🛡️ Safety Tab (15 clinical scenarios)
Reflective learning vignettes — realistic ward situations testing clinical reasoning:
- **S8 / Controlled Drugs** (3): double-check omitted, count discrepancy, patient refusal
- **Insulin** (3): meal not ready, low BGL before dose, wrong pen
- **Anticoagulants** (3): INR 5.2, warfarin before urgent surgery, double Eliquis dose
- **Opioids** (3): RR 8 post-morphine, uncharted Endone request, undocumented patch
- **High-alert Drugs** (3): potassium too fast, metformin before CT, digoxin with HR 52

Each scenario: vignette → 4 options → reveal rationale. No score — reflective learning only.

### 🛠️ Tools Tab (5 sub-tools)
1. **ISBAR Builder** — structured clinical handover form (Identify, Situation, Background, Assessment, Recommendation) with formatted output card and clipboard copy
2. **Drug Flashcards** — CSS flip cards from drug database with category filter, progress tracker, and seen-card counter
3. **10 Rights Checker** — interactive checklist of all 10 medication administration rights with progress bar and completion banner
4. **Dose Rounding** — Dose→Volume and Volume→Dose with four rounding outputs and syringe size recommendation
5. **Pharm (Pharmacology)** — two inner tabs:
   - **Drug Class Explorer** — 21 drug families with mechanism of action, indications, class nursing tips, and tappable drug chips
   - **Suffix Mnemonics** — 9 suffix cards (-lol, -pril, -sartan, -pine, -statin, -prazole, -pam, -gliflozin, -gliptin) with memory hooks and nursing tips

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Tailwind CSS 3 | Utility-first styling |
| PWA (Service Worker + Web App Manifest) | Offline-first, installable |
| Vercel | Hosting and deployment |
| No backend | All data is static JS — no database, no API |

---

## 📁 File Structure

```
NurseReady-App/
├── README.md
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── vercel.json
    ├── public/
    │   ├── index.html              # PWA meta, SW registration
    │   ├── manifest.json           # PWA manifest
    │   ├── sw.js                   # Service worker (cache-first)
    │   └── icons/
    │       ├── icon-192.png        # PWA icon (192×192)
    │       └── icon-512.png        # PWA icon (512×512)
    └── src/
        ├── index.js                # React entry point
        ├── App.js                  # Root: tabs, splash, offline toast, error boundary
        ├── index.css               # Tailwind directives
        ├── components/
        │   ├── DrugCard.jsx        # Drug list row component
        │   ├── DrugDetailSheet.jsx # Drug detail bottom sheet (tabbed)
        │   └── ErrorBoundary.jsx   # App-wide error boundary
        ├── data/
        │   ├── drugs.js            # 120+ drug objects + categoryColors + scheduleColors
        │   └── meta.js             # App version, build date, stats
        └── pages/
            ├── HomePage.jsx        # Dashboard (tab 1)
            ├── DrugPage.jsx        # Drug browser (tab 2)
            ├── CalcPage.jsx        # 8 calculators (tab 3)
            ├── QuizPage.jsx        # Quiz mode (tab 4)
            ├── ScenariosPage.jsx   # Safety scenarios (tab 5)
            ├── ToolsPage.jsx       # Tools hub with 5 sub-tabs (tab 6)
            └── PharmPage.jsx       # Pharmacology deep-dives (nested in Tools)
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+ and npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/milanalay/NurseReady-App.git
cd NurseReady-App/frontend

# Install dependencies
npm install

# Start development server
npm start
# → Opens http://localhost:3000
```

### Build for production

```bash
npm run build
# Output: /frontend/build/
```

---

## ☁️ Deploy to Vercel

### Option 1 — GitHub Integration (recommended)
1. Push to GitHub (`main` branch)
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set **Root Directory** to `frontend`
4. Framework preset: **Create React App**
5. Click **Deploy**

Vercel will automatically redeploy on every push to `main`.

### Option 2 — Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# From the frontend directory
cd frontend
vercel

# Follow the prompts:
# → Link to existing project or create new
# → Root directory: . (current)
# → Build command: npm run build
# → Output directory: build

# Deploy to production
vercel --prod
```

### Environment Variables
None required — NurseReady has no backend and no API keys.

---

## 🤝 Contributing

NurseReady is open to contributions from nursing students and educators. Here's how to add content:

### Adding a Drug

Open `/frontend/src/data/drugs.js` and add a new object to the `drugs` array following this exact structure:

```js
{
  id: "unique-kebab-case-id",
  genericName: "Drug Name",
  brandNames: ["Brand A", "Brand B"],
  drugClass: "Drug Class Description",
  category: "Pain / Opioids",        // must match an existing category
  pbsListed: true,
  schedule: "S4",                     // S2, S3, S4, S8
  routes: ["Oral", "IV"],
  availableForms: ["Tablet 500mg"],
  normalDose: "dose string",
  maxDose: "max dose string",
  relevantLabs: ["BGL", "eGFR"],
  indications: ["Indication 1"],
  sideEffects: ["Side effect 1"],
  contraindications: ["Contraindication 1"],
  holdIf: ["Hold condition 1"],
  nursingConsiderations: [
    "Numbered nursing consideration 1",
    "Numbered nursing consideration 2",
  ],
  patientTeaching: "Patient teaching string",
  suffixClue: "-suffix (Drug family)",   // or null
  redFlags: ["Red flag 1"],
  australianContext: "Australian-specific context string",
}
```

**Source requirements:** All drug information must be verifiable against MIMS Australia, AMH, or TGA product information. Include your source in the pull request description.

### Adding a Safety Scenario

Open `/frontend/src/pages/ScenariosPage.jsx` and add to the `SCENARIOS` array:

```js
{
  id: "unique-id",
  theme: "S8",   // S8 | INSULIN | ANTICOAG | OPIOID | HIGH_ALERT
  title: "Short scenario title",
  situation: "2–3 sentence clinical vignette...",
  question: "What should you do?",
  options: [
    "Option A",
    "Option B — correct answer",
    "Option C",
    "Option D",
  ],
  correctIndex: 1,   // zero-indexed
  rationale: "2–3 sentence explanation of the correct answer and why...",
}
```

### Pull Request Checklist
- [ ] Drug data sourced from MIMS Australia, AMH, or TGA PI
- [ ] Australian drug names and spelling used (e.g. frusemide not furosemide)
- [ ] Australian context field completed
- [ ] Scenario rationale references a specific policy, guideline, or clinical standard
- [ ] No patient-identifiable information included
- [ ] Tested on mobile viewport (375px width)

---

## 📄 Licence

This project is open source for educational purposes. Drug data and clinical content is compiled from publicly available Australian nursing resources for student learning only.

---

*Built for Australian nursing students, by a nursing student. 🩺*
