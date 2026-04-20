import { useState, useRef, useCallback } from 'react';
import { drugs } from '../data/drugs';
import { DrugDetailSheet } from '../components/DrugDetailSheet';

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };
const C = {
  primary:  '#1B3A6B',
  accent:   '#00A99D',
  safe:     '#10B981',
  caution:  '#F59E0B',
  critical: '#EF4444',
  star:     '#F59E0B',
};

// ─────────────────────────────────────────────────────────────
// IHNA IMPORTANT DRUG LIST  (from HLT54121 Diploma of Nursing Semester 2 OSCA)
// Keys are lowercase generic names. Value = { important, pronunciation, note }
// important: true  = ⭐ highlighted by educator
// ─────────────────────────────────────────────────────────────
const IHNA = {
  // Pain — Opioids
  'buprenorphine':        { important: false, pronunciation: 'byoo-pren-or-feen' },
  'fentanyl':             { important: false, pronunciation: 'fen-ta-nil' },
  'morphine':             { important: false, pronunciation: 'mor-feen' },
  'oxycodone':            { important: true,  pronunciation: 'ox-ee-koe-done', note: 'Endone (IR) / Oxycontin (MR) / Targin (+Naloxone)' },
  'tapentadol':           { important: true,  pronunciation: 'ta-pen-ta-dol' },
  'tramadol':             { important: true,  pronunciation: 'tram-a-dol' },
  // Pain — Other analgesics
  'paracetamol':          { important: true,  pronunciation: 'para-see-ta-mol', note: 'Max 4g/24hrs. Panadol Osteo = 665mg/tablet' },
  // Diabetes — OHA
  'metformin':            { important: true,  pronunciation: 'met-for-min', note: 'Diabex — hold before CT contrast and surgery' },
  'empagliflozin':        { important: true,  pronunciation: 'empa-glif-lozin', note: 'Jardiance — also used in heart failure' },
  'dapagliflozin':        { important: false, pronunciation: 'dapa-glif-lozin', note: 'Forxiga — also used in heart failure' },
  'linagliptin':          { important: true,  pronunciation: 'lina-glip-tin', note: 'Trajenta' },
  'sitagliptin':          { important: false, pronunciation: 'sita-glip-tin', note: 'Januvia' },
  'gliclazide':           { important: true,  pronunciation: 'gly-kla-zide', note: 'Do NOT give at night — risk of nocturnal hypoglycaemia' },
  // Insulins
  'insulin lispro':       { important: false, pronunciation: 'lis-pro', note: 'Novorapid / Humalog / Apidra — ultra short acting' },
  'insulin aspart':       { important: true,  pronunciation: 'as-part', note: 'Novorapid — ultra short acting' },
  'insulin glargine':     { important: true,  pronunciation: 'glar-jeen', note: 'Optisulin / Toujeo — long acting, no peak' },
  // Beta Blockers
  'atenolol':             { important: false, pronunciation: 'a-ten-oh-lol' },
  'bisoprolol':           { important: false, pronunciation: 'bis-oh-proe-lol', note: 'Bicor' },
  'carvedilol':           { important: false, pronunciation: 'kar-ved-i-lol' },
  'propranolol':          { important: false, pronunciation: 'proe-pran-oh-lol' },
  'metoprolol':           { important: true,  pronunciation: 'me-toe-proe-lol', note: 'Minax' },
  'sotalol':              { important: false, pronunciation: 'soe-ta-lol' },
  // CCBs
  'amlodipine':           { important: true,  pronunciation: 'am-loe-di-peen', note: 'Norvasc' },
  'felodipine':           { important: false, pronunciation: 'fel-oh-di-peen' },
  'diltiazem':            { important: false, pronunciation: 'dil-tye-a-zem', note: 'Also anti-arrhythmic' },
  'verapamil':            { important: false, pronunciation: 'ver-ap-a-mil', note: 'Also anti-arrhythmic' },
  // ARBs
  'irbesartan':           { important: false, pronunciation: 'ir-be-sar-tan', note: 'Avapro / Karvea' },
  'olmesartan':           { important: true,  pronunciation: 'ol-me-sar-tan', note: 'Olmetec' },
  'telmisartan':          { important: false, pronunciation: 'tel-mi-sar-tan', note: 'Micardis' },
  // ACEi
  'perindopril':          { important: true,  pronunciation: 'per-in-doe-pril', note: 'Coversyl' },
  'ramipril':             { important: true,  pronunciation: 'ram-i-pril', note: 'Tritace' },
  // Diuretics
  'eplerenone':           { important: false, pronunciation: 'e-plar-en-one', note: 'Ispra — potassium sparing' },
  'frusemide':            { important: true,  pronunciation: 'froo-se-mide', note: 'Lasix — loses Na+ and K+' },
  'hydrochlorothiazide':  { important: true,  pronunciation: 'hy-dro-klor-oh-thye-a-zide', note: 'HCTZ — loses Na+' },
  'spironolactone':       { important: true,  pronunciation: 'spir-on-oh-lak-tone', note: 'Aldactone — retains K+' },
  // Anti-anginal
  'glyceryl trinitrate':  { important: false, pronunciation: 'glis-er-il try-nye-trate', note: 'GTN — very short acting ~30min' },
  // Special class
  'digoxin':              { important: false, pronunciation: 'di-jox-in', note: 'Cardiac glycoside — slows HR AND increases contractility' },
  // Antiplatelets
  'aspirin':              { important: true,  pronunciation: 'as-pir-in', note: 'Astrix — also NSAID/anti-inflammatory' },
  'clopidogrel':          { important: false, pronunciation: 'kloe-pid-oh-grel', note: 'Plavix' },
  'ticagrelor':           { important: false, pronunciation: 'tye-kag-rel-or', note: 'Brilinta' },
  'prasugrel':            { important: false, pronunciation: 'pra-soo-grel' },
  // Anticoagulants
  'apixaban':             { important: true,  pronunciation: 'a-pix-a-ban', note: 'Eliquis — DOAC, Xa inhibitor' },
  'rivaroxaban':          { important: false, pronunciation: 'ri-var-ox-a-ban', note: 'Xarelto' },
  'dabigatran':           { important: false, pronunciation: 'da-big-a-tran', note: 'Pradaxa — direct thrombin inhibitor' },
  'warfarin':             { important: false, pronunciation: 'war-far-in', note: 'INR monitoring 2–3' },
  'enoxaparin':           { important: true,  pronunciation: 'en-ox-a-pa-rin', note: 'Clexane — LMWH, SC injection' },
  'heparin':              { important: false, pronunciation: 'hep-a-rin', note: 'Unfractionated, IV/SC' },
  // Statins / cholesterol
  'atorvastatin':         { important: false, pronunciation: 'a-tor-va-sta-tin', note: 'Lipitor' },
  'simvastatin':          { important: false, pronunciation: 'sim-va-sta-tin' },
  'rosuvastatin':         { important: false, pronunciation: 'roe-soo-va-sta-tin' },
  'ezetimibe':            { important: false, pronunciation: 'e-zet-i-mibe', note: 'Not a statin — blocks cholesterol absorption' },
  'fenofibrate':          { important: false, pronunciation: 'fen-oh-fy-brate', note: 'Fibrate — lowers triglycerides' },
  // PPIs
  'esomeprazole':         { important: true,  pronunciation: 'es-oh-me-pra-zole', note: 'Nexium' },
  'omeprazole':           { important: true,  pronunciation: 'oh-mep-ra-zole' },
  'pantoprazole':         { important: true,  pronunciation: 'pan-toe-pra-zole', note: 'Somac' },
  // NSAIDs
  'ibuprofen':            { important: true,  pronunciation: 'eye-bu-pro-fen', note: 'Neurofen — always give with food' },
  'celecoxib':            { important: true,  pronunciation: 'sel-e-cox-ib', note: 'Celebrex — COX-2 selective, less GI risk' },
  // Corticosteroids
  'prednisolone':         { important: false, pronunciation: 'pred-nis-oh-lone', note: 'Causes BGL rise — monitor glucose' },
  'cortisone':            { important: false, pronunciation: 'kor-ti-zone' },
  'hydrocortisone':       { important: false, pronunciation: 'hy-dro-kor-ti-zone' },
  // Antiemetics
  'metoclopramide':       { important: true,  pronunciation: 'met-oh-kloe-pra-mide', note: 'Pramin — D2 antagonist, EPS risk' },
  'ondansetron':          { important: false, pronunciation: 'on-dan-se-tron', note: 'Zofran — 5-HT3 antagonist' },
  'domperidone':          { important: false, pronunciation: 'dom-per-i-done', note: 'Usually for vertigo/gastroparesis' },
  // Puffers
  'salbutamol':           { important: false, pronunciation: 'sal-byoo-ta-mol', note: 'Ventolin — SABA rescue inhaler' },
  'ipratropium':          { important: false, pronunciation: 'ip-ra-troe-pee-um', note: 'Atrovent — anticholinergic bronchodilator' },
  'tiotropium':           { important: false, pronunciation: 'tye-oh-troe-pee-um', note: 'Spiriva — LAMA, COPD' },
  'salmeterol':           { important: false, pronunciation: 'sal-me-ter-ol', note: 'LABA — must use with ICS in asthma' },
  'formoterol':           { important: false, pronunciation: 'for-moe-ter-ol', note: 'LABA — in Symbicort/Seretide' },
  'fluticasone':          { important: true,  pronunciation: 'floo-ti-ka-sone', note: 'ICS — rinse mouth after use' },
  // Antibiotics
  'trimethoprim':         { important: false, pronunciation: 'try-meth-oh-prim', note: 'UTI treatment' },
  'metronidazole':        { important: false, pronunciation: 'met-ro-ni-da-zole', note: 'Flagyl — anaerobes and C. diff' },
  'ceftriaxone':          { important: false, pronunciation: 'sef-try-ax-one', note: 'Rocephin — 3rd gen cephalosporin, IV/IM' },
  'cefalexin':            { important: true,  pronunciation: 'kefa-lex-in', note: 'Keflex — oral 1st gen cephalosporin' },
  'cefazolin':            { important: false, pronunciation: 'kefa-jolin', note: 'Surgical prophylaxis standard in Australia' },
  'meropenem':            { important: false, pronunciation: 'mer-oh-pen-em', note: 'Carbapenem — broad spectrum, resistant organisms' },
  'ciprofloxacin':        { important: false, pronunciation: 'si-pro-floxa-sin', note: 'Fluoroquinolone — UTI, respiratory, skin' },
  'piperacillin-tazobactam': { important: false, pronunciation: 'pip-er-a-sil-in taz-oh-bak-tam', note: 'Tazocin — broad spectrum beta-lactam' },
  // Anti-epileptics
  'carbamazepine':        { important: false, pronunciation: 'kar-ba-maze-e-pin', note: 'SJS rash risk — stop if rash develops' },
  'lamotrigine':          { important: false, pronunciation: 'la-moe-tri-jeen', note: 'SJS rash risk' },
  'levetiracetam':        { important: false, pronunciation: 'le-veti-raci-tam', note: 'Keppra — mood changes common' },
  'sodium valproate':     { important: false, pronunciation: 'val-proe-ate', note: 'Epilim — ABSOLUTELY contraindicated in pregnancy' },
  'risperidone':          { important: false, pronunciation: 'ris-per-i-done', note: 'Antipsychotic — also listed here for epilepsy management' },
};

// ─────────────────────────────────────────────────────────────
// DRUG CLASS STRUCTURE  (matches IHNA document order)
// Each group has subclasses; each subclass lists drug names
// to look up from drugs.js + IHNA map
// ─────────────────────────────────────────────────────────────
const CLASS_STRUCTURE = [
  {
    id: 'pain',
    label: 'Pain Medicines',
    emoji: '💊',
    color: '#8B5CF6',
    subclasses: [
      {
        id: 'opioids',
        label: 'Opioids',
        critical: 'Opioids can cause respiratory depression — lower RR especially with IV. Also cause dependency, hypotension, bradycardia, constipation, nausea and vomiting. Always check RR before giving. Hold if RR < 10.',
        drugs: ['buprenorphine','fentanyl','morphine','oxycodone','tapentadol','tramadol'],
      },
      {
        id: 'other-analgesics',
        label: 'Other Analgesics',
        critical: 'Paracetamol max dose is 4g in 24 hours — overdose causes serious liver damage. Antidote: N-acetylcysteine (NAC).',
        drugs: ['paracetamol'],
      },
    ],
  },
  {
    id: 'diabetes',
    label: 'Diabetic (OHA / Oral Hyperglycaemic Agents)',
    emoji: '🩸',
    color: '#10B981',
    subclasses: [
      {
        id: 'biguanides',
        label: 'Biguanides',
        critical: 'Hold metformin before CT contrast, surgery, and when acutely unwell — risk of lactic acidosis.',
        drugs: ['metformin'],
      },
      {
        id: 'sglt2-class',
        label: 'SGLT2 Inhibitors (-gliflozin)',
        critical: 'Hold when acutely unwell — risk of euglycaemic DKA. BGL may look normal but ketones dangerously elevated. Also used in heart failure patients without diabetes.',
        drugs: ['empagliflozin','dapagliflozin'],
      },
      {
        id: 'dpp4-class',
        label: 'DPP-4 Inhibitors (-gliptin)',
        critical: 'Low hypoglycaemia risk alone. Linagliptin does not need renal dose adjustment. Watch for pancreatitis — report abdominal pain.',
        drugs: ['linagliptin','sitagliptin'],
      },
      {
        id: 'sulfonylureas-class',
        label: 'Sulfonylureas',
        critical: 'Do NOT give gliclazide at night — stimulates insulin production causing nocturnal hypoglycaemia. Always give with food. Avoid alcohol.',
        drugs: ['gliclazide'],
      },
    ],
  },
  {
    id: 'insulins',
    label: 'Insulins',
    emoji: '💉',
    color: '#059669',
    subclasses: [
      {
        id: 'ultra-short-insulin',
        label: 'Ultra Short Acting (Rapid)',
        critical: 'Give immediately before or with a meal. Onset 5–15 min. Two-nurse check required. Examples: Novorapid (aspart), Humalog (lispro), Apidra (glulisine).',
        drugs: ['insulin aspart','insulin lispro'],
      },
      {
        id: 'short-insulin',
        label: 'Short Acting',
        critical: 'Give 30 min before meal. Onset 30 min. Examples: Actrapid, Humulin R.',
        drugs: ['insulin regular'],
      },
      {
        id: 'intermediate-insulin',
        label: 'Intermediate Acting / Mixed',
        critical: 'Cloudy insulin — always roll gently to mix, never shake. Examples: Novomix, Humalog Mix, Mixtard, Ryzodeg.',
        drugs: ['insulin nph','insulin isophane'],
      },
      {
        id: 'long-insulin',
        label: 'Long Acting (Basal)',
        critical: 'Do NOT mix Lantus/Glargine with any other insulin — separate pen/syringe always required. No peak effect. Inject same time each day.',
        drugs: ['insulin glargine'],
      },
    ],
  },
  {
    id: 'blood-pressure',
    label: 'Blood Pressure Medications',
    emoji: '🫀',
    color: '#EF4444',
    subclasses: [
      {
        id: 'beta-blockers-bp',
        label: 'Beta Blockers (-lol)',
        critical: 'Do NOT give if HR < 60 bpm (bradycardia). Always confirm with doctor before giving. Never stop abruptly — rebound hypertension and angina risk.',
        drugs: ['atenolol','bisoprolol','carvedilol','propranolol','metoprolol','sotalol'],
      },
      {
        id: 'ccb-bp',
        label: 'Calcium Channel Blockers (-pine)',
        critical: 'Normal CCBs (amlodipine, felodipine) cause hypotension — do not give if BP is low. Antiarrhythmic CCBs (diltiazem, verapamil) also slow HR — do not give if HR < 60.',
        drugs: ['amlodipine','felodipine','diltiazem','verapamil'],
      },
      {
        id: 'arb-bp',
        label: 'ARBs — Angiotensin Receptor Blockers (-sartan)',
        critical: 'Cause hypotension — do not give when BP is low. Monitor K+ and renal function. Contraindicated in pregnancy.',
        drugs: ['irbesartan','olmesartan','telmisartan'],
      },
      {
        id: 'acei-bp',
        label: 'ACE Inhibitors (-pril)',
        critical: 'Cause hypotension — do not give when BP is low. Very common side effect: dry cough (bradykinin — not an allergy). Contraindicated in pregnancy.',
        drugs: ['perindopril','ramipril','lisinopril','enalapril','captopril'],
      },
      {
        id: 'diuretics-bp',
        label: 'Diuretics',
        critical: 'All diuretics cause hypotension — do not give when BP is low. Monitor electrolytes — loss of Na+ and K+ can cause dangerous cardiac arrhythmias. Strict fluid balance and daily weight.',
        drugs: ['eplerenone','frusemide','hydrochlorothiazide','spironolactone','indapamide','torasemide'],
      },
      {
        id: 'antianginal-bp',
        label: 'Anti-Anginal',
        critical: 'GTN is very short acting (~30 min). Causes hypotension — do not give if BP is low. Administer per doctor orders. Give SL (under tongue) — sits upright, do not swallow.',
        drugs: ['glyceryl trinitrate','isosorbide mononitrate'],
      },
    ],
  },
  {
    id: 'special-class',
    label: 'Special Class Drugs',
    emoji: '⭐',
    color: '#F59E0B',
    subclasses: [
      {
        id: 'cardiac-glycosides',
        label: 'Cardiac Glycosides',
        critical: 'Digoxin has a very narrow therapeutic index (0.5–2 ng/mL). Do NOT give if HR < 60 (bradycardia). Monitor K+ — hypokalaemia increases toxicity risk. Toxicity signs: yellow/blurred vision, nausea, confusion, irregular HR.',
        drugs: ['digoxin'],
      },
    ],
  },
  {
    id: 'blood-thinners',
    label: 'Blood Thinners',
    emoji: '🩸',
    color: '#DC2626',
    subclasses: [
      {
        id: 'antiplatelets',
        label: 'Anti-Platelets',
        critical: 'Cause bleeding — do not give to patients with active bleeding. Always ask the patient if they are bleeding from anywhere (faeces, urine, wounds) before giving. Monitor for bruising.',
        drugs: ['aspirin','clopidogrel','ticagrelor','prasugrel'],
      },
      {
        id: 'anticoagulants-oral',
        label: 'Anti-Coagulants — Oral (DOACs + Warfarin)',
        critical: 'Cause bleeding — do not give with active bleeding. Warfarin: check INR before each dose (therapeutic 2–3). DOACs: no routine monitoring but check renal function regularly. Know reversal agents.',
        drugs: ['apixaban','rivaroxaban','dabigatran','warfarin'],
      },
      {
        id: 'anticoagulants-injectable',
        label: 'Anti-Coagulants — Injectable',
        critical: 'SC injection — rotate sites, do not rub after injection. Enoxaparin (Clexane) is LMWH; heparin is unfractionated. Reversal: protamine sulphate for heparin.',
        drugs: ['enoxaparin','heparin'],
      },
    ],
  },
  {
    id: 'cholesterol',
    label: 'Anti-Cholesterol',
    emoji: '🧪',
    color: '#0EA5E9',
    subclasses: [
      {
        id: 'statins-class',
        label: 'Statins (-statin)',
        critical: 'Monitor for muscle pain — myopathy and rare rhabdomyolysis. Check LFTs. Grapefruit juice interaction (especially simvastatin). Contraindicated in pregnancy.',
        drugs: ['atorvastatin','simvastatin','rosuvastatin'],
      },
      {
        id: 'other-cholesterol',
        label: 'Other Cholesterol Agents',
        critical: 'Ezetimibe blocks cholesterol absorption — often combined with statins. Fenofibrate primarily lowers triglycerides. Both require LFT monitoring.',
        drugs: ['ezetimibe','fenofibrate'],
      },
    ],
  },
  {
    id: 'anti-ulcer',
    label: 'Anti-Ulcer / PPIs',
    emoji: '🫃',
    color: '#10B981',
    subclasses: [
      {
        id: 'ppis-class',
        label: 'Proton Pump Inhibitors — PPIs (-prazole)',
        critical: 'Give before meals for maximum efficacy. Long-term use: monitor Mg2+, bone density risk. Do not crush enteric-coated formulations.',
        drugs: ['esomeprazole','omeprazole','pantoprazole','lansoprazole','rabeprazole'],
      },
    ],
  },
  {
    id: 'anti-inflammatory',
    label: 'Anti-Inflammatory',
    emoji: '🔥',
    color: '#EA580C',
    subclasses: [
      {
        id: 'nsaids-class',
        label: 'NSAIDs — Non-Steroidal Anti-Inflammatory',
        critical: 'NEVER give on an empty stomach — always with food or a main meal. Destroys stomach lining and causes ulcers. Do not give to patients with active GI bleeding, peptic ulcers, or severe renal impairment. Patients on blood thinners + NSAIDs have prolonged bleeding.',
        drugs: ['aspirin','ibuprofen','celecoxib','diclofenac','naproxen','indomethacin','ketorolac','meloxicam'],
      },
      {
        id: 'corticosteroids-class',
        label: 'Steroidal Anti-Inflammatory (Corticosteroids)',
        critical: 'Causes hyperglycaemia — non-diabetic patients on steroids will be on BGL monitoring chart. Also causes hypertension. Never stop abruptly after long-term use — adrenal suppression. Give with food.',
        drugs: ['prednisolone','cortisone','hydrocortisone','dexamethasone','methylprednisolone','prednisone'],
      },
    ],
  },
  {
    id: 'antiemetics',
    label: 'Anti-Emetics (for Nausea)',
    emoji: '🤢',
    color: '#16A34A',
    subclasses: [
      {
        id: 'antiemetics-class',
        label: 'Anti-Emetics',
        critical: 'D2 antagonists (metoclopramide, domperidone) — risk of extrapyramidal symptoms (dystonia, akathisia) especially in young patients with IV doses. Ondansetron: monitor QTc.',
        drugs: ['metoclopramide','ondansetron','domperidone','prochlorperazine','promethazine'],
      },
    ],
  },
  {
    id: 'puffers',
    label: 'Puffers / Respiratory',
    emoji: '🫁',
    color: '#3B82F6',
    subclasses: [
      {
        id: 'saba',
        label: 'Short Acting Beta-2 Agonist — SABA (Reliever)',
        critical: 'Rescue medication only — for acute bronchospasm. NOT a preventer. If using >2 puffs per week, asthma is not controlled — review with doctor.',
        drugs: ['salbutamol'],
      },
      {
        id: 'laba-lama',
        label: 'Long Acting Bronchodilators — LABA / LAMA (Preventer)',
        critical: 'LABAs must ALWAYS be used with an ICS in asthma — NEVER as monotherapy (increases mortality risk). Anticholinergics (ipratropium, tiotropium) used mainly in COPD.',
        drugs: ['ipratropium','tiotropium','salmeterol','formoterol'],
      },
      {
        id: 'ics',
        label: 'Inhaled Corticosteroids — ICS',
        critical: 'ALWAYS rinse mouth and spit after use — prevents oral thrush (candidiasis). These are preventers, not relievers. Seretide = salmeterol + fluticasone. Symbicort = formoterol + budesonide.',
        drugs: ['fluticasone','budesonide','beclometasone'],
      },
    ],
  },
  {
    id: 'antibiotics',
    label: 'Antibiotics',
    emoji: '🦠',
    color: '#0D9488',
    subclasses: [
      {
        id: 'common-antibiotics',
        label: 'Common Antibiotics',
        critical: 'Always check allergy history before the first dose — anaphylaxis risk. Complete the full course. Culture before starting if possible (do not delay for sepsis).',
        drugs: ['trimethoprim','metronidazole','ceftriaxone','cefalexin','cefazolin','meropenem','ciprofloxacin','piperacillin-tazobactam','amoxicillin','flucloxacillin','doxycycline','azithromycin','vancomycin','gentamicin'],
      },
    ],
  },
  {
    id: 'anti-epileptic',
    label: 'Anti-Epileptics',
    emoji: '⚡',
    color: '#7C3AED',
    subclasses: [
      {
        id: 'aeds',
        label: 'Anti-Epileptic Drugs (AEDs)',
        critical: 'NEVER stop abruptly — seizure risk. Sodium valproate is ABSOLUTELY contraindicated in pregnancy (teratogenicity programme in Australia). Carbamazepine and lamotrigine: stop immediately if rash develops — risk of Stevens-Johnson syndrome.',
        drugs: ['carbamazepine','lamotrigine','levetiracetam','sodium valproate','phenytoin','valproate'],
      },
    ],
  },
  {
    id: 'other-common',
    label: 'Other Common Drugs',
    emoji: '🏥',
    color: '#6B7280',
    subclasses: [
      {
        id: 'stool-softeners',
        label: 'Stool Softeners / Laxatives',
        critical: 'Encourage adequate fluid intake with all laxatives. Coloxyl-Senna is a stimulant laxative. Movicol and lactulose are osmotic — draw water into bowel.',
        drugs: ['docusate','lactulose','macrogol'],
      },
      {
        id: 'supplements',
        label: 'Supplements',
        critical: 'Potassium supplements (Slow K) must be given with plenty of water — can cause GI irritation. Vitamin D (cholecalciferol) important for calcium absorption and bone health.',
        drugs: ['cholecalciferol','potassium chloride','magnesium','calcium carbonate'],
      },
      {
        id: 'antipsychotics-other',
        label: 'Antipsychotics',
        critical: 'Monitor for extrapyramidal symptoms, metabolic syndrome (weight, BGL, lipids), and QTc prolongation. Never combine IM olanzapine with IM benzodiazepine — fatal respiratory depression risk.',
        drugs: ['risperidone','olanzapine','quetiapine','haloperidol','aripiprazole','clozapine'],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Helper: find drug in drugs.js by name (fuzzy match)
// ─────────────────────────────────────────────────────────────
const findDrug = (name) => {
  const n = name.toLowerCase().trim();
  return drugs.find((d) =>
    d.genericName.toLowerCase() === n ||
    d.genericName.toLowerCase().includes(n) ||
    n.includes(d.genericName.toLowerCase()) ||
    d.brandNames?.some((b) => b.toLowerCase().includes(n))
  ) || null;
};

// ─────────────────────────────────────────────────────────────
// DrugRow — single drug inside a subclass
// ─────────────────────────────────────────────────────────────
const DrugRow = ({ drugName, color, onSelect }) => {
  const drug = findDrug(drugName);
  const ihnaData = IHNA[drugName.toLowerCase()] || IHNA[drug?.genericName?.toLowerCase()] || null;
  const isImportant = ihnaData?.important === true;
  const pronunciation = ihnaData?.pronunciation || null;
  const note = ihnaData?.note || null;
  const displayName = drug ? drug.genericName : drugName.charAt(0).toUpperCase() + drugName.slice(1);
  const brandName = drug?.brandNames?.[0] || null;

  return (
    <button
      data-testid={`class-drug-row-${drugName.replace(/\s+/g, '-')}`}
      onClick={() => drug && onSelect(drug)}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all active:scale-[0.99]"
      style={{
        minHeight: '52px',
        background: isImportant ? '#FFFBEB' : '#FFFFFF',
        borderBottom: '1px solid #F3F4F6',
        cursor: drug ? 'pointer' : 'default',
      }}
    >
      {/* Important star */}
      <span className="flex-shrink-0 mt-0.5 w-5 text-center">
        {isImportant
          ? <span style={{ color: C.star, fontSize: '14px' }}>⭐</span>
          : <span style={{ color: '#E5E7EB', fontSize: '10px' }}>●</span>
        }
      </span>

      <div className="flex-1 min-w-0">
        {/* Drug name row */}
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="text-sm font-bold leading-tight"
            style={{ fontFamily: FONTS.heading, color: drug ? color : '#9CA3AF' }}
          >
            {displayName}
          </p>
          {drug?.schedule && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: drug.schedule === 'S8' ? '#EF444420' : `${color}15`,
                color: drug.schedule === 'S8' ? '#EF4444' : color,
                fontFamily: FONTS.body,
                fontSize: '9px',
              }}
            >
              {drug.schedule}
            </span>
          )}
          {isImportant && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#FEF3C7', color: '#92400E', fontFamily: FONTS.body, fontSize: '9px' }}
            >
              IHNA
            </span>
          )}
        </div>

        {/* Pronunciation */}
        {pronunciation && (
          <p className="text-xs mt-0.5" style={{ fontFamily: FONTS.body, color: '#9CA3AF' }}>
            {pronunciation}
          </p>
        )}

        {/* Brand name + note */}
        <div className="flex flex-wrap gap-x-2 mt-0.5">
          {brandName && (
            <p className="text-xs" style={{ fontFamily: FONTS.body, color: '#6B7280' }}>
              {brandName}{drug?.brandNames?.length > 1 ? ` +${drug.brandNames.length - 1}` : ''}
            </p>
          )}
          {note && (
            <p className="text-xs italic" style={{ fontFamily: FONTS.body, color: '#9CA3AF' }}>
              {note}
            </p>
          )}
        </div>
      </div>

      {/* Arrow if tappable */}
      {drug && (
        <svg className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#D1D5DB' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// SubclassCard — expandable subclass within a group
// ─────────────────────────────────────────────────────────────
const SubclassCard = ({ subclass, color, onSelectDrug, isOpen, onToggle }) => {
  const importantCount = subclass.drugs.filter((name) => {
    const ihna = IHNA[name.toLowerCase()];
    if (ihna?.important) return true;
    const drug = findDrug(name);
    if (drug) return IHNA[drug.genericName.toLowerCase()]?.important === true;
    return false;
  }).length;

  return (
    <div
      data-testid={`subclass-${subclass.id}`}
      className="rounded-2xl overflow-hidden mb-3"
      style={{ border: `1.5px solid ${isOpen ? color : color + '30'}` }}
    >
      {/* Subclass header */}
      <button
        data-testid={`subclass-toggle-${subclass.id}`}
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{
          minHeight: '52px',
          background: isOpen ? `${color}10` : '#FFFFFF',
        }}
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight" style={{ fontFamily: FONTS.heading, color }}>
            {subclass.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: FONTS.body }}>
            {subclass.drugs.length} drugs
            {importantCount > 0 && (
              <span style={{ color: C.star }}> · ⭐ {importantCount} important</span>
            )}
          </p>
        </div>
        <svg
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{ color, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div>
          {/* Critical warning */}
          <div
            className="mx-3 mt-2 mb-1 rounded-xl px-3 py-2.5 flex gap-2"
            style={{ background: '#EF444410', border: '1px solid #EF444430' }}
          >
            <span className="text-sm flex-shrink-0 mt-0.5">🔴</span>
            <p className="text-xs text-red-700 leading-relaxed font-medium" style={{ fontFamily: FONTS.body }}>
              {subclass.critical}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-100">
            <span style={{ color: C.star, fontSize: '11px' }}>⭐ IHNA important</span>
            <span className="text-gray-300 text-xs">|</span>
            <span className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>Tap → full drug profile</span>
          </div>

          {/* Drug rows */}
          {subclass.drugs.map((name) => (
            <DrugRow
              key={name}
              drugName={name}
              color={color}
              onSelect={onSelectDrug}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ClassGroupView — full group with all subclasses
// ─────────────────────────────────────────────────────────────
const ClassGroupView = ({ group, onSelectDrug, onBack }) => {
  const [openSubclass, setOpenSubclass] = useState(null);
  const scrollRef = useRef(null);

  const toggle = (id) => setOpenSubclass((prev) => (prev === id ? null : id));

  const totalDrugs = group.subclasses.reduce((acc, s) => acc + s.drugs.length, 0);
  const totalImportant = group.subclasses.reduce((acc, s) => {
    return acc + s.drugs.filter((name) => {
      const ihna = IHNA[name.toLowerCase()];
      if (ihna?.important) return true;
      const drug = findDrug(name);
      return drug ? IHNA[drug.genericName.toLowerCase()]?.important === true : false;
    }).length;
  }, 0);

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]">
      {/* Group header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100"
        style={{ background: `${group.color}10` }}
      >
        <button
          data-testid="class-group-back"
          onClick={onBack}
          className="flex items-center gap-1.5 mb-3 text-xs font-bold"
          style={{ color: group.color, fontFamily: FONTS.body, minHeight: '32px' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Classes
        </button>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{group.emoji}</span>
          <div>
            <h2 className="text-base font-black text-[#1B3A6B] leading-tight" style={{ fontFamily: FONTS.heading }}>
              {group.label}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: FONTS.body }}>
              {totalDrugs} drugs · {group.subclasses.length} subclasses
              {totalImportant > 0 && <span style={{ color: C.star }}> · ⭐ {totalImportant} important</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Subclass list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        {group.subclasses.map((sub) => (
          <SubclassCard
            key={sub.id}
            subclass={sub}
            color={group.color}
            onSelectDrug={onSelectDrug}
            isOpen={openSubclass === sub.id}
            onToggle={() => toggle(sub.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ClassesPage — default export
// ─────────────────────────────────────────────────────────────
const ClassesPage = ({ onNavigate }) => {
  const [view, setView]             = useState('list');    // 'list' | 'group'
  const [activeGroup, setActiveGroup] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const listScrollRef = useRef(null);
  const [listScrollPos, setListScrollPos] = useState(0);

  // Save scroll position before navigating into a group
  const handleOpenGroup = useCallback((group) => {
    if (listScrollRef.current) {
      setListScrollPos(listScrollRef.current.scrollTop);
    }
    setActiveGroup(group);
    setView('group');
  }, []);

  // Restore scroll position when going back
  const handleBack = useCallback(() => {
    setView('list');
    setActiveGroup(null);
    setTimeout(() => {
      if (listScrollRef.current) {
        listScrollRef.current.scrollTop = listScrollPos;
      }
    }, 10);
  }, [listScrollPos]);

  const handleSelectDrug = useCallback((drug) => {
    setSelectedDrug(drug);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDrug(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {/* Header */}
          <div className="bg-white px-5 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏫</span>
              <h1 className="text-xl font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
                Drug Classes
              </h1>
            </div>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
              Tap a class to explore subclasses and drugs · ⭐ = IHNA important
            </p>
          </div>

          {/* Legend */}
          <div
            className="flex-shrink-0 flex items-center gap-4 px-5 py-2.5 border-b border-gray-100"
            style={{ background: '#FFFBEB' }}
          >
            <div className="flex items-center gap-1.5">
              <span style={{ color: C.star, fontSize: '14px' }}>⭐</span>
              <p className="text-xs font-bold text-amber-700" style={{ fontFamily: FONTS.body }}>
                Highlighted by your IHNA educator
              </p>
            </div>
          </div>

          {/* Class group list */}
          <div ref={listScrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-3">
            {CLASS_STRUCTURE.map((group) => {
              const totalDrugs = group.subclasses.reduce((a, s) => a + s.drugs.length, 0);
              const totalImportant = group.subclasses.reduce((acc, s) => {
                return acc + s.drugs.filter((name) => {
                  const ihna = IHNA[name.toLowerCase()];
                  if (ihna?.important) return true;
                  const drug = findDrug(name);
                  return drug ? IHNA[drug.genericName.toLowerCase()]?.important === true : false;
                }).length;
              }, 0);

              return (
                <button
                  key={group.id}
                  data-testid={`class-group-btn-${group.id}`}
                  onClick={() => handleOpenGroup(group)}
                  className="w-full bg-white rounded-2xl flex items-center gap-4 px-4 py-4 text-left transition-all active:scale-[0.99]"
                  style={{
                    border: `1.5px solid ${group.color}30`,
                    minHeight: '72px',
                  }}
                >
                  {/* Colour dot */}
                  <span
                    className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${group.color}15` }}
                  >
                    {group.emoji}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{ fontFamily: FONTS.heading, color: group.color }}
                    >
                      {group.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: FONTS.body }}>
                      {group.subclasses.length} subclass{group.subclasses.length !== 1 ? 'es' : ''} · {totalDrugs} drugs
                      {totalImportant > 0 && (
                        <span style={{ color: C.star }}> · ⭐ {totalImportant}</span>
                      )}
                    </p>
                  </div>

                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: group.color + '80' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}

            <p className="text-center text-xs text-gray-300 pt-2 pb-4" style={{ fontFamily: FONTS.body }}>
              Drug list based on IHNA HLT54121 Diploma of Nursing · Semester 2 OSCA
            </p>
          </div>
        </>
      )}

      {/* ── GROUP VIEW ── */}
      {view === 'group' && activeGroup && (
        <ClassGroupView
          group={activeGroup}
          onSelectDrug={handleSelectDrug}
          onBack={handleBack}
        />
      )}

      {/* ── DRUG DETAIL SHEET (overlay) ── */}
      {selectedDrug && (
        <DrugDetailSheet
          drug={selectedDrug}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default ClassesPage;
