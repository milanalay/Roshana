# 🩺 Roshana

> An Australian nursing student placement companion — drug reference, clinical calculators, quiz mode, safety scenarios, and study tools. Built as a Progressive Web App for offline-first use on mobile.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://roshana.vercel.app)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue?logo=googlechrome)](https://roshana.vercel.app)
[![Educational Use Only](https://img.shields.io/badge/Use-Educational%20Only-orange)](https://github.com/milanalay/NurseReady-App)

---

## ⚠️ Educational Disclaimer

**Roshana is for educational purposes only.** It is not a clinical decision support tool and must never replace:
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
- Real-time local search (generic name, brand name, drug class, schedule, suffix clue)
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
1. **ISBAR Builder** — structured clinical handover form with formatted output card and clipboard copy
2. **Drug Flashcards** — CSS flip cards from drug database with category filter and progress tracker
3. **10 Rights Checker** — interactive checklist with progress bar and completion banner
4. **Dose Rounding** — Dose→Volume and Volume→Dose with four rounding outputs and syringe size recommendation
5. **Pharm (Pharmacology)** — three inner tabs:
   - **Drug Class Explorer** — 28 drug families with mechanism of action, indications, class nursing tips, and tappable drug chips
   - **Suffix Mnemonics** — 21 suffix cards with memory hooks and nursing tips
   - **Terminology** — 15 key pharmacology terms with clinical examples

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
Roshana/
├── README.md
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vercel.json
    ├── public/
    │   ├── index.html
    │   ├── manifest.json
    │   ├── sw.js
    │   └── icons/
    │       ├── icon-192.png
    │       └── icon-512.png
    └── src/
        ├── index.js
        ├── App.js
        ├── index.css
        ├── components/
        │   ├── DrugCard.jsx
        │   ├── DrugDetailSheet.jsx
        │   └── ErrorBoundary.jsx
        ├── data/
        │   ├── drugs.js
        │   └── meta.js
        └── pages/
            ├── HomePage.jsx
            ├── DrugPage.jsx
            ├── CalcPage.jsx
            ├── QuizPage.jsx
            ├── ScenariosPage.jsx
            ├── ToolsPage.jsx
            └── PharmPage.jsx
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+ and npm 9+

### Setup

```bash
git clone https://github.com/milanalay/NurseReady-App.git
cd NurseReady-App/frontend  # or whatever your repo folder is called
npm install
npm start
# → Opens http://localhost:3000
```

### Build for production

```bash
npm run build
```

---

## ☁️ Deploy to Vercel

1. Push to GitHub (`main` branch)
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set **Root Directory** to `frontend`
4. Framework preset: **Create React App**
5. Click **Deploy**

No environment variables required.

---

## 🤝 Contributing

### Adding a Drug

Open `/frontend/src/data/drugs.js` and add a new object to the `drugs` array:

```js
{
  id: "unique-kebab-case-id",
  genericName: "Drug Name",
  brandNames: ["Brand A"],
  drugClass: "Drug Class",
  category: "Pain / Opioids",
  pbsListed: true,
  schedule: "S4",
  routes: ["Oral"],
  availableForms: ["Tablet 500mg"],
  normalDose: "dose string",
  maxDose: "max dose string",
  relevantLabs: ["BGL"],
  indications: ["Indication"],
  sideEffects: ["Side effect"],
  contraindications: ["Contraindication"],
  holdIf: ["Hold condition"],
  nursingConsiderations: ["Nursing consideration"],
  patientTeaching: "Patient teaching string",
  suffixClue: "-suffix (Drug family)",
  redFlags: ["Red flag"],
  australianContext: "Australian context",
}
```

### Pull Request Checklist
- [ ] Drug data sourced from MIMS Australia, AMH, or TGA PI
- [ ] Australian drug names and spelling used (e.g. frusemide not furosemide)
- [ ] Tested on mobile viewport (375px width)

---

## 📄 Licence

Open source for educational purposes. For Australian nursing students, by a nursing student. 🩺
