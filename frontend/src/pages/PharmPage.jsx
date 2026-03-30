import { useState, useMemo } from 'react';
import { drugs } from '../data/drugs';

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };
const C = {
  primary: '#1B3A6B',
  accent: '#00A99D',
  safe: '#10B981',
  caution: '#F59E0B',
  critical: '#EF4444',
  pharm: '#8B5CF6',
};

// ─────────────────────────────────────────────────────────────
// DRUG CLASS DATA
// Groups pulled from drugs.js drugClass values, with hardcoded
// mechanism / indications / nursing class tips
// ─────────────────────────────────────────────────────────────
const CLASS_GROUPS = [
  {
    id: 'beta-blockers',
    family: 'Beta Blockers',
    emoji: '🫀',
    color: '#EF4444',
    suffix: '-lol',
    mechanism:
      'Block beta-adrenergic receptors, reducing heart rate, myocardial contractility, and blood pressure. Selective beta-1 blockers primarily affect the heart; non-selective also affect the lungs.',
    indications: ['Hypertension', 'Heart failure', 'AF rate control', 'Angina', 'Post-MI', 'Anxiety', 'Thyrotoxicosis'],
    classNursingTip:
      'Always check HR and BP before administering. Hold if HR < 60. Never stop abruptly — rebound hypertension and angina risk. Caution in asthma: non-selective beta blockers cause bronchospasm. Masks hypoglycaemia in diabetics.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('beta blocker'),
  },
  {
    id: 'ace-inhibitors',
    family: 'ACE Inhibitors',
    emoji: '🫁',
    color: '#3B82F6',
    suffix: '-pril',
    mechanism:
      'Block angiotensin-converting enzyme, preventing conversion of angiotensin I to angiotensin II — a potent vasoconstrictor. Reduces blood pressure, cardiac afterload, and aldosterone release.',
    indications: ['Hypertension', 'Heart failure', 'Post-MI', 'Diabetic nephropathy', 'Stroke prevention'],
    classNursingTip:
      'Monitor BP, potassium, and renal function regularly. Dry cough is very common — if intolerable, switch to ARB. Stop immediately if angioedema occurs (tongue/throat swelling — life-threatening). Contraindicated in pregnancy.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('ace inhibitor'),
  },
  {
    id: 'arbs',
    family: 'Angiotensin Receptor Blockers (ARBs)',
    emoji: '💊',
    color: '#6366F1',
    suffix: '-sartan',
    mechanism:
      'Block the angiotensin II receptor (AT1), preventing vasoconstriction and aldosterone secretion. Similar effect to ACE inhibitors but do not cause bradykinin accumulation — so no cough.',
    indications: ['Hypertension', 'Heart failure', 'Diabetic nephropathy'],
    classNursingTip:
      'Same monitoring as ACE inhibitors: BP, K+, renal function. Do NOT cause cough (key difference from ACEi). Angioedema possible but rare. Contraindicated in pregnancy. Do not combine with ACE inhibitor without specialist direction.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('angiotensin receptor blocker') || d.drugClass?.toLowerCase().includes('arb'),
  },
  {
    id: 'calcium-channel-blockers',
    family: 'Calcium Channel Blockers',
    emoji: '🔌',
    color: '#EC4899',
    suffix: '-pine / -azem / -amil',
    mechanism:
      'Block voltage-gated calcium channels in cardiac and vascular smooth muscle. Dihydropyridines (-pine) primarily vasodilate; non-dihydropyridines (diltiazem, verapamil) also slow heart rate and AV conduction.',
    indications: ['Hypertension', 'Angina', 'AF rate control', 'SVT'],
    classNursingTip:
      'Check HR and BP before each dose. Ankle oedema is common with dihydropyridines — does not indicate fluid overload. Non-dihydropyridines: avoid combining with beta blockers (additive bradycardia and AV block). Swallow modified-release forms whole.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('calcium channel blocker'),
  },
  {
    id: 'statins',
    family: 'Statins (HMG-CoA Reductase Inhibitors)',
    emoji: '🧪',
    color: '#0EA5E9',
    suffix: '-statin',
    mechanism:
      'Inhibit HMG-CoA reductase, the rate-limiting enzyme in hepatic cholesterol synthesis, reducing LDL cholesterol and cardiovascular risk.',
    indications: ['Dyslipidaemia', 'Cardiovascular risk reduction'],
    classNursingTip:
      'Monitor for muscle pain — myopathy and rarely rhabdomyolysis. Check CK if muscle symptoms occur. Monitor LFTs. Grapefruit juice interactions (especially simvastatin). Contraindicated in pregnancy. Simvastatin taken at night; atorvastatin/rosuvastatin any time.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('statin'),
  },
  {
    id: 'ssris',
    family: 'SSRIs (Selective Serotonin Reuptake Inhibitors)',
    emoji: '🧠',
    color: '#8B5CF6',
    suffix: null,
    mechanism:
      'Block reuptake of serotonin in the synaptic cleft, increasing serotonergic transmission. Take 2–4 weeks to reach full therapeutic effect.',
    indications: ['Depression', 'Anxiety disorders', 'OCD', 'PTSD', 'Panic disorder'],
    classNursingTip:
      'Monitor mood closely in early treatment — suicidality risk may paradoxically increase initially, especially in young adults. Hyponatraemia in elderly (monitor Na+). Serotonin syndrome risk with other serotonergic drugs. Do not stop abruptly.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('ssri') || d.drugClass?.toLowerCase().includes('selective serotonin reuptake'),
  },
  {
    id: 'snris',
    family: 'SNRIs (Serotonin-Noradrenaline Reuptake Inhibitors)',
    emoji: '⚡',
    color: '#7C3AED',
    suffix: null,
    mechanism:
      'Block reuptake of both serotonin and noradrenaline. Dual action provides antidepressant and analgesic effects and may improve energy and concentration more than SSRIs.',
    indications: ['Depression', 'Anxiety', 'Neuropathic pain', 'Fibromyalgia'],
    classNursingTip:
      'Monitor blood pressure — SNRIs can cause hypertension at higher doses. Significant withdrawal syndrome if stopped abruptly ("brain zaps", dizziness, flu-like symptoms). Serotonin syndrome risk. Same suicidality monitoring as SSRIs.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('snri') || d.drugClass?.toLowerCase().includes('serotonin-noradrenaline'),
  },
  {
    id: 'benzodiazepines',
    family: 'Benzodiazepines',
    emoji: '😴',
    color: '#F97316',
    suffix: '-pam / -lam',
    mechanism:
      'Enhance the effect of GABA — the main inhibitory neurotransmitter — by binding to GABA-A receptors, producing CNS depression, anxiolysis, sedation, and anticonvulsant effects.',
    indications: ['Anxiety', 'Insomnia', 'Alcohol withdrawal', 'Seizures', 'Muscle spasm', 'Pre-procedure sedation'],
    classNursingTip:
      'Monitor sedation, respiratory rate, and falls risk. Reversal agent: flumazenil (per medical order). Long half-life agents (diazepam) accumulate in elderly. Never stop abruptly in long-term users — withdrawal seizures. S8 scheduling for temazepam.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('benzodiazepine'),
  },
  {
    id: 'opioids',
    family: 'Opioid Analgesics',
    emoji: '😮‍💨',
    color: '#DC2626',
    suffix: null,
    mechanism:
      'Bind to mu, kappa, and delta opioid receptors in the CNS and periphery, producing analgesia, sedation, and euphoria. Also cause respiratory depression, constipation, and nausea via central and peripheral mechanisms.',
    indications: ['Moderate to severe acute pain', 'Chronic pain', 'Palliative care', 'Cough suppression'],
    classNursingTip:
      'Assess pain score AND respiratory rate before every dose. Withhold if RR < 10 or excessive sedation. Naloxone must be available. S8 drugs require two-nurse check. Constipation is universal — initiate bowel management proactively. Falls risk — especially in elderly.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('opioid') || d.drugClass?.toLowerCase().includes('opioid analgesic'),
  },
  {
    id: 'nsaids',
    family: 'NSAIDs (Non-Steroidal Anti-Inflammatory Drugs)',
    emoji: '🔥',
    color: '#EA580C',
    suffix: null,
    mechanism:
      'Inhibit COX-1 and COX-2 enzymes, reducing prostaglandin synthesis. This reduces inflammation, pain, and fever — but also reduces protective gastric prostaglandins and impairs platelet function.',
    indications: ['Pain', 'Inflammation', 'Arthritis', 'Fever', 'Dysmenorrhoea', 'Gout'],
    classNursingTip:
      'Always give with food — GI irritation and ulceration risk. Contraindicated in active peptic ulcer disease, severe renal impairment, and active GI bleeding. Caution in elderly, cardiac disease, and those on anticoagulants. PPI co-prescribing common.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('nsaid'),
  },
  {
    id: 'ppis',
    family: 'Proton Pump Inhibitors (PPIs)',
    emoji: '🫃',
    color: '#10B981',
    suffix: '-prazole',
    mechanism:
      'Irreversibly inhibit the H+/K+ ATPase enzyme (proton pump) on parietal cells, blocking gastric acid secretion. Most effective when taken before meals when proton pumps are active.',
    indications: ['GORD', 'Peptic ulcer disease', 'H. pylori eradication', 'NSAID-induced ulcer prevention', 'Upper GI bleed'],
    classNursingTip:
      'Give before meals for maximum efficacy. Long-term use: monitor magnesium (hypomagnesaemia), may reduce calcium absorption (osteoporosis risk), and associated with C. difficile. Do not crush enteric-coated capsules — MUPS formulation can be dispersed.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('proton pump inhibitor') || d.drugClass?.toLowerCase().includes('ppi'),
  },
  {
    id: 'anticoagulants',
    family: 'Anticoagulants',
    emoji: '🩸',
    color: '#EF4444',
    suffix: null,
    mechanism:
      'Interfere with coagulation cascade at different points. Warfarin inhibits vitamin K-dependent clotting factors; DOACs directly inhibit thrombin (dabigatran) or factor Xa (apixaban, rivaroxaban); heparin/LMWH enhance antithrombin III.',
    indications: ['AF (stroke prevention)', 'DVT/PE treatment and prevention', 'Mechanical heart valves', 'ACS'],
    classNursingTip:
      'Monitor for bleeding signs at every contact (gums, urine, stool, skin). Warfarin: check INR before each dose. DOACs: no routine monitoring but monitor renal function. Hold before procedures per plan. Know reversal agents: warfarin → Vitamin K/Prothrombinex; dabigatran → idarucizumab; Xa inhibitors → andexanet alfa.',
    matchFn: (d) =>
      d.category === 'Anticoagulants' ||
      d.drugClass?.toLowerCase().includes('anticoagulant') ||
      d.drugClass?.toLowerCase().includes('antiplatelet') ||
      d.drugClass?.toLowerCase().includes('doac') ||
      d.drugClass?.toLowerCase().includes('heparin') ||
      d.drugClass?.toLowerCase().includes('vitamin k antagonist'),
  },
  {
    id: 'insulins',
    family: 'Insulins',
    emoji: '💉',
    color: '#059669',
    suffix: null,
    mechanism:
      'Replace or supplement endogenous insulin, facilitating cellular glucose uptake by binding insulin receptors, reducing blood glucose levels. Different formulations vary in onset, peak, and duration.',
    indications: ['Type 1 diabetes', 'Type 2 diabetes (when oral agents insufficient)', 'DKA', 'Hyperglycaemia in hospital'],
    classNursingTip:
      'Check BGL immediately before every dose. Ensure meal is available before rapid-acting insulin. Two-nurse check required. Rotate injection sites to prevent lipohypertrophy. Know the onset/peak/duration of each type. Never mix insulins unless specifically formulated.',
    matchFn: (d) => d.category === 'Insulins' || d.drugClass?.toLowerCase().includes('insulin'),
  },
  {
    id: 'antipsychotics',
    family: 'Antipsychotics',
    emoji: '🧩',
    color: '#BE185D',
    suffix: null,
    mechanism:
      'Block dopamine D2 receptors (and various other receptors). Typical antipsychotics are primarily D2 antagonists; atypical antipsychotics also block serotonin receptors, improving negative symptoms with less EPS.',
    indications: ['Schizophrenia', 'Bipolar disorder', 'Acute agitation', 'Delirium', 'Nausea (haloperidol low dose)'],
    classNursingTip:
      'Monitor for extrapyramidal symptoms (EPS): akathisia, dystonia, Parkinsonism, tardive dyskinesia. Metabolic monitoring: weight, BGL, lipids, BP. QTc monitoring especially with haloperidol. IM olanzapine + IM benzodiazepine = risk of fatal respiratory depression — never combine.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('antipsychotic'),
  },
  {
    id: 'anticonvulsants',
    family: 'Anticonvulsants / Mood Stabilisers',
    emoji: '⚡',
    color: '#7C3AED',
    suffix: null,
    mechanism:
      'Stabilise neuronal membranes by various mechanisms: sodium channel blockade (carbamazepine, phenytoin), GABA enhancement (valproate, benzodiazepines), or calcium channel modulation (lamotrigine). Many have mood-stabilising properties.',
    indications: ['Epilepsy', 'Bipolar disorder', 'Neuropathic pain', 'Migraine prevention', 'Trigeminal neuralgia'],
    classNursingTip:
      'Never stop abruptly — seizure risk. Monitor drug levels for phenytoin, carbamazepine, valproate. Watch for severe rash with carbamazepine and lamotrigine (Stevens-Johnson syndrome — stop immediately). Sodium valproate absolutely contraindicated in pregnancy (teratogenicity programme in Australia).',
    matchFn: (d) =>
      d.drugClass?.toLowerCase().includes('anticonvulsant') ||
      d.drugClass?.toLowerCase().includes('mood stabiliser'),
  },
  {
    id: 'bronchodilators',
    family: 'Bronchodilators',
    emoji: '🫁',
    color: '#0369A1',
    suffix: null,
    mechanism:
      'Beta-2 agonists (SABAs/LABAs) relax bronchial smooth muscle by stimulating beta-2 receptors. Anticholinergics (ipratropium, tiotropium) block muscarinic receptors reducing bronchoconstriction. ICS reduce airway inflammation.',
    indications: ['Asthma', 'COPD', 'Acute bronchospasm'],
    classNursingTip:
      'SABAs (salbutamol) are rescue medications — not preventers. LABAs must always be used with an ICS in asthma — never as monotherapy. ICS: always rinse mouth after to prevent oral thrush. Assess SpO2, RR, and breath sounds before and after nebulisation. High-dose salbutamol: monitor K+ (hypokalaemia).',
    matchFn: (d) =>
      d.drugClass?.toLowerCase().includes('bronchodilator') ||
      d.drugClass?.toLowerCase().includes('beta-2 agonist') ||
      d.drugClass?.toLowerCase().includes('laba') ||
      d.drugClass?.toLowerCase().includes('saba') ||
      d.drugClass?.toLowerCase().includes('anticholinergic bronchodilator') ||
      d.drugClass?.toLowerCase().includes('inhaled corticosteroid') ||
      d.drugClass?.toLowerCase().includes('ics'),
  },
  {
    id: 'antibiotics',
    family: 'Antibiotics',
    emoji: '🦠',
    color: '#0D9488',
    suffix: null,
    mechanism:
      'Diverse mechanisms: beta-lactams (penicillins, cephalosporins) inhibit cell wall synthesis; fluoroquinolones inhibit DNA gyrase; macrolides inhibit protein synthesis; vancomycin inhibits peptidoglycan cross-linking.',
    indications: ['Bacterial infections', 'Surgical prophylaxis', 'Sepsis', 'UTI', 'Respiratory infections'],
    classNursingTip:
      'Always check allergy history before first dose — anaphylaxis risk. Culture before starting if possible (but do not delay for sepsis). Complete the full course. Monitor for C. difficile with broad-spectrum agents. IV antibiotics: timing, reconstitution, and compatibility are critical.',
    matchFn: (d) =>
      d.drugClass?.toLowerCase().includes('antibiotic') ||
      d.drugClass?.toLowerCase().includes('cephalosporin') ||
      d.drugClass?.toLowerCase().includes('penicillin') ||
      d.drugClass?.toLowerCase().includes('carbapenem') ||
      d.drugClass?.toLowerCase().includes('glycopeptide') ||
      d.drugClass?.toLowerCase().includes('fluoroquinolone') ||
      d.drugClass?.toLowerCase().includes('antiviral'),
  },
  {
    id: 'diuretics',
    family: 'Diuretics',
    emoji: '💧',
    color: '#0EA5E9',
    suffix: null,
    mechanism:
      'Increase urine output by reducing reabsorption of sodium and water in the kidney. Loop diuretics (frusemide) act at the loop of Henle; thiazides at the distal tubule; potassium-sparing diuretics at the collecting duct.',
    indications: ['Heart failure', 'Fluid overload', 'Hypertension', 'Oedema', 'Ascites', 'Hyperkalaemia (spironolactone)'],
    classNursingTip:
      'Strict fluid balance and daily weight essential. Monitor electrolytes: K+, Na+, Mg2+. Loop diuretics (frusemide): hypokalaemia risk — often given with potassium supplementation. Potassium-sparing diuretics (spironolactone): hyperkalaemia risk — avoid potassium supplements. Morning dosing preferred to avoid nocturia.',
    matchFn: (d) =>
      d.drugClass?.toLowerCase().includes('diuretic'),
  },
  {
    id: 'corticosteroids',
    family: 'Corticosteroids',
    emoji: '💪',
    color: '#D97706',
    suffix: null,
    mechanism:
      'Bind to glucocorticoid receptors and suppress inflammation by inhibiting prostaglandin, cytokine, and leukotriene synthesis. Also have mineralocorticoid effects causing sodium/water retention and potassium loss.',
    indications: ['Asthma/COPD exacerbation', 'Inflammatory conditions', 'Autoimmune disease', 'Adrenal insufficiency', 'Allergy'],
    classNursingTip:
      'Give with food — GI irritation. Monitor BGL: steroid-induced hyperglycaemia is common. Monitor for infection signs — immunosuppression. Do NOT stop abruptly after long-term use — adrenal suppression risk. Patients on long-term steroids should carry a steroid emergency card.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('corticosteroid'),
  },
  {
    id: 'antiemetics',
    family: 'Antiemetics',
    emoji: '🤢',
    color: '#16A34A',
    suffix: null,
    mechanism:
      'Various mechanisms: 5-HT3 antagonists (ondansetron) block serotonin receptors in the gut and CNS; D2 antagonists (metoclopramide, prochlorperazine) block dopamine; antihistamines (promethazine) block H1 receptors.',
    indications: ['Post-operative nausea', 'Chemotherapy-induced nausea', 'Gastroparesis', 'Vestibular disorders'],
    classNursingTip:
      'D2 antagonists (metoclopramide, prochlorperazine, haloperidol): monitor for extrapyramidal symptoms, especially dystonia in young patients and with IV route. Ondansetron: QTc monitoring if cardiac risk. Promethazine: deep IM only — IV route causes tissue necrosis. Domperidone: QT prolongation risk.',
    matchFn: (d) =>
      d.drugClass?.toLowerCase().includes('antiemetic') ||
      d.drugClass?.toLowerCase().includes('prokinetic'),
  },
  // ── NEW: from Pharmacology Study Guide PDF ────────────────────
  {
    id: 'thrombolytics',
    family: 'Thrombolytics (Fibrinolytics)',
    emoji: '🩸',
    color: '#DC2626',
    suffix: null,
    mechanism:
      'Activate plasminogen to form plasmin, which breaks down fibrin clots. They dissolve existing clots rather than preventing new ones — used in acute emergencies where time-sensitive clot lysis is critical.',
    indications: ['Acute MI (STEMI)', 'Acute ischaemic stroke', 'Massive PE', 'DVT (selected cases)'],
    classNursingTip:
      'Thrombolytics carry a high risk of bleeding — intracranial haemorrhage is the most feared complication. Monitor all puncture sites closely. Contraindicated in recent surgery, active bleeding, or prior haemorrhagic stroke. Antidote: aminocaproic acid (Amicar). Time is critical — "time is muscle/brain".',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('thrombolyt') || d.drugClass?.toLowerCase().includes('fibrinolyt'),
  },
  {
    id: 'sulfonylureas',
    family: 'Sulfonylureas',
    emoji: '🩺',
    color: '#16A34A',
    suffix: null,
    mechanism:
      'Stimulate insulin secretion from beta cells of the pancreas by binding to ATP-sensitive potassium channels, causing cell depolarisation and calcium influx. They are glucose-independent — so they can cause hypoglycaemia even when BGL is normal.',
    indications: ['Type 2 diabetes (when diet/metformin insufficient)'],
    classNursingTip:
      'Hypoglycaemia is the major risk — especially if meals are skipped or delayed. Always give with food. Monitor BGL closely. Instruct patients to avoid alcohol (disulfiram-like reaction with some agents). Contraindicated in type 1 diabetes. Weight gain is a common side effect.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('sulfonylurea') || d.drugClass?.toLowerCase().includes('sulphonylurea'),
  },
  {
    id: 'aminoglycosides',
    family: 'Aminoglycosides',
    emoji: '🦠',
    color: '#0D9488',
    suffix: '-mycin / -micin',
    mechanism:
      'Bind irreversibly to the 30S ribosomal subunit, causing misreading of mRNA and inhibiting bacterial protein synthesis. Bactericidal — most effective against aerobic gram-negative organisms. Concentration-dependent killing.',
    indications: ['Serious gram-negative infections', 'Sepsis', 'Endocarditis (combination therapy)', 'Surgical prophylaxis'],
    classNursingTip:
      'Monitor renal function and drug levels closely — narrow therapeutic index. Nephrotoxicity and ototoxicity (hearing loss, tinnitus, vestibular damage) are the major toxicities. Once-daily dosing is preferred. Adequate hydration essential. Report any hearing changes immediately.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('aminoglycoside'),
  },
  {
    id: 'tetracyclines',
    family: 'Tetracyclines',
    emoji: '🔬',
    color: '#B45309',
    suffix: '-cycline',
    mechanism:
      'Broad-spectrum bacteriostatic antibiotics that bind to the 30S ribosomal subunit, preventing aminoacyl-tRNA from attaching and thus inhibiting bacterial protein synthesis. Effective against a wide range of gram-positive and gram-negative organisms.',
    indications: ['Respiratory infections', 'Lyme disease', 'Acne', 'Chlamydia', 'Rocky Mountain spotted fever', 'H. pylori (combination)'],
    classNursingTip:
      'Do NOT give to children under 8 — causes permanent tooth discolouration and bone damage. Avoid in pregnancy. Separate from dairy products, antacids, iron, and calcium by at least 2 hours (chelation reduces absorption). Photosensitivity — educate on sunscreen use. Take on empty stomach unless GI upset.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('tetracycline'),
  },
  {
    id: 'antimycobacterials',
    family: 'Antimycobacterials (Anti-TB)',
    emoji: '🫁',
    color: '#7C3AED',
    suffix: null,
    mechanism:
      'Multiple mechanisms targeting Mycobacterium tuberculosis: isoniazid inhibits mycolic acid synthesis (cell wall); rifampin inhibits RNA polymerase; ethambutol disrupts arabinogalactan synthesis; pyrazinamide disrupts membrane energy production. Combination therapy prevents resistance.',
    indications: ['Tuberculosis (TB)', 'Latent TB prophylaxis', 'Leprosy (some agents)'],
    classNursingTip:
      'Always used in combination — never monotherapy (resistance prevention). Treatment is 6+ months — compliance is critical. Monitor LFTs — hepatotoxicity is the most serious adverse effect (jaundice, dark urine, elevated ALT/AST). Administer Vitamin B6 (pyridoxine) with isoniazid to prevent peripheral neuropathy. Rifampin turns bodily fluids orange — warn patients. Directly Observed Therapy (DOT) may be required.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('antimycobacterial') || d.drugClass?.toLowerCase().includes('anti-tb'),
  },
  {
    id: 'adrenergic-agonists',
    family: 'Adrenergic Agonists (Vasopressors)',
    emoji: '⚡',
    color: '#DC2626',
    suffix: null,
    mechanism:
      'Stimulate alpha and/or beta adrenergic receptors on target organs. Alpha stimulation causes vasoconstriction; beta-1 stimulation increases heart rate and contractility; beta-2 stimulation causes bronchodilation. Therapeutic effects include increased cardiac output and BP.',
    indications: ['Cardiac arrest (epinephrine)', 'Anaphylaxis (epinephrine)', 'Cardiogenic shock (dobutamine, dopamine)', 'Septic shock (noradrenaline)'],
    classNursingTip:
      'High-alert medications — always administer via infusion pump with continuous cardiac monitoring. Monitor HR, BP, and urine output closely. Extravasation of vasopressors causes tissue necrosis — use central line where possible. Tachyarrhythmias are a major risk. Have antidote (phentolamine for extravasation) available.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('adrenergic agonist') || d.drugClass?.toLowerCase().includes('vasopressor'),
  },
  {
    id: 'dopaminergics',
    family: 'Dopaminergic Drugs (Parkinson\'s)',
    emoji: '🧩',
    color: '#6366F1',
    suffix: null,
    mechanism:
      'Increase dopamine activity in the brain to correct the dopamine/acetylcholine imbalance in Parkinson\'s disease. Levodopa (carbidopa-levodopa) is converted to dopamine in the CNS; other agents directly stimulate dopamine receptors or inhibit dopamine breakdown.',
    indications: ['Parkinson\'s disease', 'Restless legs syndrome (some agents)'],
    classNursingTip:
      'Administer carbidopa-levodopa with food to reduce nausea, but avoid high-protein meals (protein competes with absorption). Orthostatic hypotension is common — change positions slowly. Monitor for confusion and hallucinations especially in elderly. "On-off" phenomenon — work with team on timing. Avoid abrupt discontinuation — risk of neuroleptic malignant syndrome.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('dopaminergic'),
  },
  {
    id: 'sglt2',
    family: 'SGLT2 Inhibitors',
    emoji: '🩸',
    color: '#0891B2',
    suffix: '-gliflozin',
    mechanism:
      'Inhibit the sodium-glucose cotransporter 2 (SGLT2) in the renal proximal tubule, preventing glucose reabsorption and causing glycosuria. Also reduce blood pressure, body weight, and have cardioprotective/renoprotective effects.',
    indications: ['Type 2 diabetes', 'Heart failure', 'Chronic kidney disease'],
    classNursingTip:
      'Hold in acute illness, fasting, dehydration, and pre-surgery (sick-day protocol). Genital hygiene education — mycotic infection risk. Key risk: euglycaemic DKA — ketones can be dangerously elevated even with normal BGL. Monitor ketones if patient is unwell.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('sglt2'),
  },
  {
    id: 'dpp4',
    family: 'DPP-4 Inhibitors',
    emoji: '🔬',
    color: '#4F46E5',
    suffix: '-gliptin',
    mechanism:
      'Inhibit dipeptidyl peptidase-4 (DPP-4), preventing breakdown of GLP-1 and GIP incretin hormones. This increases insulin secretion and suppresses glucagon in a glucose-dependent manner.',
    indications: ['Type 2 diabetes'],
    classNursingTip:
      'Low risk of hypoglycaemia when used alone (glucose-dependent action). Rare but serious risk: pancreatitis — report abdominal pain. Sitagliptin requires renal dose adjustment (unlike linagliptin). Generally well tolerated.',
    matchFn: (d) => d.drugClass?.toLowerCase().includes('dpp-4'),
  },
  {
    id: 'tcas',
    family: 'Tricyclic Antidepressants (TCAs)',
    emoji: '🔄',
    color: '#9333EA',
    suffix: null,
    mechanism:
      'Block reuptake of serotonin and noradrenaline AND antagonise muscarinic, histamine, and alpha-1 receptors. The anticholinergic effects cause significant side effects but also make them useful for neuropathic pain and insomnia at low doses.',
    indications: ['Depression', 'Neuropathic pain', 'Migraine prophylaxis', 'Fibromyalgia', 'Insomnia (low dose)'],
    classNursingTip:
      'Anticholinergic side effects: dry mouth, constipation, urinary retention, blurred vision, confusion (especially elderly). Overdose is extremely dangerous — cardiac arrhythmias and death. QTc monitoring at higher doses. Give at night (sedation is a benefit at night). Do NOT stop abruptly.',
    matchFn: (d) =>
      d.drugClass?.toLowerCase().includes('tricyclic') ||
      d.drugClass?.toLowerCase().includes('tca'),
  },
];

// ─────────────────────────────────────────────────────────────
// SUFFIX MNEMONIC DATA
// ─────────────────────────────────────────────────────────────
const SUFFIX_MNEMONICS = [
  {
    suffix: '-lol',
    family: 'Beta Blockers',
    emoji: '❤️',
    color: '#EF4444',
    mnemonic: '"LOL — Lowers Output of the heart Like a Lead weight." The -lol ending = beta blocker = slows the heart.',
    tip: 'Always check heart rate before giving. HR < 60? Hold it and document. Never stop suddenly — rebound can cause angina or hypertensive crisis.',
    exampleMatch: (d) => d.suffixClue?.includes('-lol'),
  },
  {
    suffix: '-pril',
    family: 'ACE Inhibitors',
    emoji: '🫁',
    color: '#3B82F6',
    mnemonic: '"PRIL = PRessure-lowering drug that makes you thRIL — but at the cost of a cough." ACE inhibitors end in -pril = cough is the giveaway.',
    tip: 'The cough is due to bradykinin accumulation — it is not an allergy. If intolerable, switch to an ARB. Never give in pregnancy.',
    exampleMatch: (d) => d.suffixClue?.includes('-pril'),
  },
  {
    suffix: '-sartan',
    family: 'ARBs (Angiotensin Receptor Blockers)',
    emoji: '💊',
    color: '#6366F1',
    mnemonic: '"SARTAN = Same As pRil buT without ANgioedema cough." ARBs are the ACEi alternative — same BP benefit, NO cough.',
    tip: 'No cough because they do not affect bradykinin. Still teratogenic — no pregnancy. Monitor K+ and renal function just like ACEi.',
    exampleMatch: (d) => d.suffixClue?.includes('-sartan'),
  },
  {
    suffix: '-pine',
    family: 'Dihydropyridine Calcium Channel Blockers',
    emoji: '🔌',
    color: '#EC4899',
    mnemonic: '"PINE = the blood vessel PINE-s open." Dihydropyridines (-pine) primarily dilate blood vessels rather than slowing the heart.',
    tip: 'Ankle oedema is common but does not indicate fluid overload — it is localised vasodilation. Check BP before giving. Swallow modified-release forms whole.',
    exampleMatch: (d) => d.suffixClue?.includes('-pine'),
  },
  {
    suffix: '-statin',
    family: 'Statins (HMG-CoA Reductase Inhibitors)',
    emoji: '🧪',
    color: '#0EA5E9',
    mnemonic: '"STATIN = STAys IN the liver, blocks cholesterol." Statins block the cholesterol factory in the liver.',
    tip: 'Report any muscle pain — myopathy risk. Check CK if symptoms. Simvastatin at night; others anytime. Avoid grapefruit juice. Never in pregnancy.',
    exampleMatch: (d) => d.suffixClue?.includes('-statin'),
  },
  {
    suffix: '-prazole',
    family: 'Proton Pump Inhibitors (PPIs)',
    emoji: '🔒',
    color: '#10B981',
    mnemonic: '"PRAZOLE = PRoton pump rAZOr — cuts off acid production at the source." The prazole suffix = PPI = acid pump blocker.',
    tip: 'Give before meals. Long-term use: monitor Mg2+, consider bone density. Can mask symptoms of gastric cancer. Do not crush enteric-coated capsules.',
    exampleMatch: (d) => d.suffixClue?.includes('-prazole'),
  },
  {
    suffix: '-pam / -lam',
    family: 'Benzodiazepines',
    emoji: '😴',
    color: '#F97316',
    mnemonic: '"PAM = Put A Man to sleep." Benzo endings (-pam, -lam) = sedation, relaxation, GABA enhancement.',
    tip: 'Monitor RR and sedation. Falls risk especially in elderly. Reversal: flumazenil. Never stop abruptly in long-term users. Temazepam is S8 in Australia.',
    exampleMatch: (d) => d.suffixClue?.includes('-pam'),
  },
  {
    suffix: '-gliflozin',
    family: 'SGLT2 Inhibitors',
    emoji: '🫘',
    color: '#0891B2',
    mnemonic: '"GLIFLOZIN = GLucose LeavIng through FLOW IN the urine." The kidney spills glucose — lowering blood sugar without causing hypoglycaemia alone.',
    tip: 'Key danger: euglycaemic DKA. BGL may look normal but ketones are dangerously high. Hold when unwell. Educate about genital hygiene.',
    exampleMatch: (d) => d.suffixClue?.includes('-gliflozin'),
  },
  {
    suffix: '-gliptin',
    family: 'DPP-4 Inhibitors',
    emoji: '🔬',
    color: '#4F46E5',
    mnemonic: '"GLIPTIN = GLucose (Inhibiting ProTIN-ase). Blocks the enzyme that destroys the hormones that help insulin work." Low hypo risk alone.',
    tip: 'Watch for pancreatitis (rare) — report abdominal pain. Sitagliptin needs renal dose adjustment. Generally the gentlest diabetes drug class.',
    exampleMatch: (d) => d.suffixClue?.includes('-gliptin'),
  },
  // ── NEW suffixes from Pharmacology Study Guide PDF ─────────
  {
    suffix: '-semide',
    family: 'Loop Diuretics',
    emoji: '💧',
    color: '#0EA5E9',
    mnemonic: '"SEMIDE = SEeks water to exit the body." Loop diuretics act in the Loop of Henle — the most powerful diuretics. -semide = powerful urine maker.',
    tip: 'Monitor K+, Na+, and BP — hypokalaemia and hypotension are the main risks. Strict fluid balance and daily weight. Morning dose preferred to avoid nocturia. Ototoxicity with rapid IV infusion. Australian spelling: frusemide (not furosemide).',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('frusemide'),
  },
  {
    suffix: '-phylline',
    family: 'Methylxanthine Bronchodilators',
    emoji: '🌿',
    color: '#65A30D',
    mnemonic: '"PHYLLINE = FILLs the airways open." Methylxanthines relax bronchial smooth muscle — but have a dangerously narrow therapeutic window.',
    tip: 'Monitor theophylline blood levels (therapeutic: 10–20 mcg/mL). Toxicity: tachycardia, dysrhythmias, restlessness, seizures. Many drug interactions. Avoid crushing capsules.',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('theophylline'),
  },
  {
    suffix: '-terol',
    family: 'Beta-2 Agonist Bronchodilators (LABA)',
    emoji: '🌬️',
    color: '#0369A1',
    mnemonic: '"TEROL = Takes the Tension Out of the airway (RelaxatiOn of Lungs)." Beta-2 agonists relax bronchial smooth muscle — -terol = bronchodilator.',
    tip: 'LABAs (-terol) must ALWAYS be used with an inhaled corticosteroid in asthma — never monotherapy. Not for acute rescue. Monitor HR — tachycardia and tremor are common side effects.',
    exampleMatch: (d) => ['formoterol','salmeterol'].some(n => d.genericName?.toLowerCase().includes(n)),
  },
  {
    suffix: '-tidine',
    family: 'H2 Receptor Antagonists',
    emoji: '🫃',
    color: '#059669',
    mnemonic: '"TIDINE = TIDE of acid goes DOWN." H2 blockers reduce gastric acid production — but PPIs (-prazole) are now preferred for most indications.',
    tip: 'Separate from antacids by 1–2 hours. Give with meals or at bedtime. Less effective than PPIs for severe GORD. Check local formulary — ranitidine availability limited due to NDMA concerns.',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('ranitidine'),
  },
  {
    suffix: '-setron',
    family: '5-HT3 Antagonists (Antiemetics)',
    emoji: '🤢',
    color: '#16A34A',
    mnemonic: '"SETRON = SETtle down the nausea RespONse." 5-HT3 blockers block serotonin receptors that trigger the vomiting centre and GI tract.',
    tip: 'Monitor QTc — risk of QT prolongation at higher doses. Main side effect: constipation. Give IV dose slowly over at least 30 seconds. Most effective for post-op and chemotherapy-induced nausea.',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('ondansetron'),
  },
  {
    suffix: 'cef- / ceph-',
    family: 'Cephalosporins',
    emoji: '🦠',
    color: '#0D9488',
    mnemonic: '"CEF/CEPH = CEll wall Failed = bacteria can\'t survive." Cephalosporins (like all beta-lactams) inhibit bacterial cell wall synthesis — look for cef or ceph at the start of the name.',
    tip: 'Always check for penicillin allergy — cross-reactivity exists. Cefazolin is the standard surgical prophylaxis antibiotic in Australian hospitals — give within 60 min of incision. Monitor IV site for thrombophlebitis.',
    exampleMatch: (d) => ['ceftriaxone','cefalexin','cefazolin'].some(n => d.genericName?.toLowerCase().includes(n)),
  },
  {
    suffix: '-cillin',
    family: 'Penicillins',
    emoji: '💊',
    color: '#2563EB',
    mnemonic: '"CILLIN = KILLING bacteria by destroying their cell walls." The -cillin suffix = penicillin antibiotic = beta-lactam = cell wall inhibitor.',
    tip: 'Always ask about penicillin allergy before the first dose. Flucloxacillin must be taken on an empty stomach (food reduces absorption). Augmentin take with food to reduce GI upset. Complete the full course.',
    exampleMatch: (d) => ['flucloxacillin','piperacillin'].some(n => d.genericName?.toLowerCase().includes(n)) || d.genericName?.toLowerCase().includes('augmentin'),
  },
  {
    suffix: '-mycin / -micin',
    family: 'Macrolides / Aminoglycosides / Glycopeptides',
    emoji: '🔬',
    color: '#7C3AED',
    mnemonic: '"MYCIN = MaYbe Check If it Needs level monitoring." The -mycin ending spans multiple antibiotic classes — always check the full drug name and class, not just the suffix.',
    tip: 'Aminoglycosides (gentamicin): narrow therapeutic index — monitor drug levels, renal function, and hearing. Vancomycin (glycopeptide): trough monitoring, slow infusion to prevent Red Man Syndrome.',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('vancomycin'),
  },
  {
    suffix: '-cycline',
    family: 'Tetracyclines',
    emoji: '☀️',
    color: '#B45309',
    mnemonic: '"CYCLINE = CYCLE away from sun, dairy, and children." Three key rules: no sun without protection, no dairy or antacids near dose, no children under 8.',
    tip: 'Photosensitivity — wear sunscreen. Avoid in pregnancy and children under 8 (permanent tooth discolouration and bone damage). Take with a full glass of water upright. Separate from dairy, antacids, iron by 2 hours.',
    exampleMatch: (d) => d.drugClass?.toLowerCase().includes('tetracycline'),
  },
  {
    suffix: '-vir',
    family: 'Antivirals',
    emoji: '🛡️',
    color: '#DC2626',
    mnemonic: '"VIR = VIRus Interrupted and Reduced." The -vir suffix identifies antivirals — drugs that suppress viral replication but do not cure viral infections.',
    tip: 'Aciclovir IV: ensure adequate hydration to prevent crystalluria and renal damage. Complete the full course even if symptoms resolve. Monitor renal function with IV use.',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('aciclovir'),
  },
  {
    suffix: '-caine',
    family: 'Local Anaesthetics',
    emoji: '💉',
    color: '#0891B2',
    mnemonic: '"CAINE = Can\'t feel ANy pain IN this area." Local anaesthetics block sodium channels to prevent nerve conduction — they numb locally while consciousness is preserved.',
    tip: 'Monitor for LAST (Local Anaesthetic Systemic Toxicity): tinnitus, metallic taste, perioral numbness, seizures, cardiac arrest. Intralipid emulsion is the antidote. Never inject into blood vessels.',
    exampleMatch: (d) => d.genericName?.toLowerCase().includes('caine') || d.drugClass?.toLowerCase().includes('local anaesthe'),
  },
];

// ─────────────────────────────────────────────────────────────
// DrugClassExplorer
// ─────────────────────────────────────────────────────────────
export const DrugClassExplorer = ({ onNavigate }) => {
  const [expanded, setExpanded] = useState(null);

  const groupsWithDrugs = useMemo(
    () =>
      CLASS_GROUPS.map((g) => ({
        ...g,
        drugs: drugs.filter(g.matchFn),
      })).filter((g) => g.drugs.length > 0),
    []
  );

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="px-4 py-4 space-y-3" data-testid="drug-class-explorer">
      {/* Intro */}
      <div
        className="rounded-2xl px-4 py-3 flex gap-3 items-start"
        style={{ background: `${C.pharm}10`, border: `1px solid ${C.pharm}25` }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">🔬</span>
        <p className="text-xs leading-relaxed" style={{ fontFamily: FONTS.body, color: C.pharm }}>
          Understand <strong>how drug families work</strong> — not just what to give. Tap a class to explore its mechanism, indications, and key nursing considerations.
        </p>
      </div>

      {/* Class accordion cards */}
      {groupsWithDrugs.map((group) => {
        const isOpen = expanded === group.id;
        return (
          <div
            key={group.id}
            data-testid={`class-group-${group.id}`}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: `1.5px solid ${isOpen ? group.color : group.color + '30'}` }}
          >
            {/* Header — always visible */}
            <button
              data-testid={`class-toggle-${group.id}`}
              onClick={() => toggle(group.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              style={{ minHeight: '56px', background: isOpen ? `${group.color}08` : 'transparent' }}
              aria-expanded={isOpen}
            >
              <span
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${group.color}15` }}
              >
                {group.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight" style={{ fontFamily: FONTS.heading, color: group.color }}>
                  {group.family}
                </p>
                {group.suffix && (
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: FONTS.body }}>
                    Suffix: <span className="font-semibold">{group.suffix}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${group.color}15`, color: group.color, fontFamily: FONTS.body }}
                >
                  {group.drugs.length}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                {/* Mechanism */}
                <div className="pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5" style={{ fontFamily: FONTS.body }}>
                    Mechanism of Action
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed" style={{ fontFamily: FONTS.body }}>
                    {group.mechanism}
                  </p>
                </div>

                {/* Indications */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5" style={{ fontFamily: FONTS.body }}>
                    Common Indications
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.indications.map((ind) => (
                      <span
                        key={ind}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: `${group.color}12`, color: group.color, fontFamily: FONTS.body }}
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Class nursing tip */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: `${group.color}08`, border: `1px solid ${group.color}25` }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: group.color, fontFamily: FONTS.heading }}>
                    🩺 Class Nursing Tip
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: FONTS.body }}>
                    {group.classNursingTip}
                  </p>
                </div>

                {/* Drug chips */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2" style={{ fontFamily: FONTS.body }}>
                    Drugs in This Class ({group.drugs.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.drugs.map((drug) => (
                      <button
                        key={drug.id}
                        data-testid={`class-drug-chip-${drug.id}`}
                        onClick={() => onNavigate?.('drugs', drug.genericName)}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all active:scale-95"
                        style={{
                          background: `${group.color}15`,
                          color: group.color,
                          border: `1px solid ${group.color}30`,
                          fontFamily: FONTS.body,
                          minHeight: '32px',
                        }}
                      >
                        {drug.genericName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="h-4" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SuffixMnemonics
// ─────────────────────────────────────────────────────────────
export const SuffixMnemonics = ({ onNavigate }) => {
  const mnemonicsWithDrugs = useMemo(
    () =>
      SUFFIX_MNEMONICS.map((m) => ({
        ...m,
        drugs: drugs.filter(m.exampleMatch),
      })),
    []
  );

  return (
    <div className="px-4 py-4 space-y-4" data-testid="suffix-mnemonics">
      {/* Intro */}
      <div
        className="rounded-2xl px-4 py-3 flex gap-3 items-start"
        style={{ background: `${C.pharm}10`, border: `1px solid ${C.pharm}25` }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">🧠</span>
        <p className="text-xs leading-relaxed" style={{ fontFamily: FONTS.body, color: C.pharm }}>
          Drug suffixes reveal the drug family at a glance. Scroll through to study the patterns — you will start recognising drug classes from the name alone.
        </p>
      </div>

      {/* Mnemonic cards — vertically stacked */}
      {mnemonicsWithDrugs.map((item) => (
        <div
          key={item.suffix}
          data-testid={`suffix-card-${item.suffix.replace(/[^a-z0-9]/gi, '-')}`}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: `1.5px solid ${item.color}30` }}
        >
          {/* Card header */}
          <div
            className="px-4 py-3 flex items-center gap-3"
            style={{ background: `${item.color}12`, borderBottom: `1px solid ${item.color}20` }}
          >
            <span
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${item.color}20` }}
            >
              {item.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-xl font-black leading-tight"
                style={{ fontFamily: FONTS.heading, color: item.color }}
              >
                {item.suffix}
              </p>
              <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: FONTS.body }}>
                {item.family}
              </p>
            </div>
            {item.drugs.length > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${item.color}15`, color: item.color, fontFamily: FONTS.body }}
              >
                {item.drugs.length} drugs
              </span>
            )}
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* Mnemonic */}
            <div
              className="rounded-xl p-3"
              style={{ background: '#1B3A6B08', border: '1px solid #1B3A6B15' }}
            >
              <p className="text-xs font-bold text-[#1B3A6B] mb-1" style={{ fontFamily: FONTS.heading }}>
                💡 Memory Hook
              </p>
              <p className="text-sm text-gray-800 leading-relaxed italic" style={{ fontFamily: FONTS.body }}>
                {item.mnemonic}
              </p>
            </div>

            {/* Nursing tip */}
            <div
              className="rounded-xl p-3"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: item.color, fontFamily: FONTS.heading }}>
                🩺 Class Nursing Tip
              </p>
              <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: FONTS.body }}>
                {item.tip}
              </p>
            </div>

            {/* Example drug chips */}
            {item.drugs.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2" style={{ fontFamily: FONTS.body }}>
                  Examples from your drug list
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.drugs.map((drug) => (
                    <button
                      key={drug.id}
                      data-testid={`suffix-drug-chip-${drug.id}`}
                      onClick={() => onNavigate?.('drugs', drug.genericName)}
                      className="flex flex-col items-start text-left px-3 py-1.5 rounded-xl transition-all active:scale-95"
                      style={{
                        background: `${item.color}10`,
                        border: `1px solid ${item.color}25`,
                        minHeight: '44px',
                      }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: item.color, fontFamily: FONTS.heading }}
                      >
                        {drug.genericName}
                      </span>
                      {drug.brandNames?.[0] && (
                        <span className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
                          {drug.brandNames[0]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <p
        className="text-center text-xs text-gray-400 pb-4 leading-relaxed"
        style={{ fontFamily: FONTS.body }}
      >
        Tap any drug chip to open its full profile in the Drug Reference tab.
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TerminologyGlossary — key pharmacology terms from study guide
// ─────────────────────────────────────────────────────────────
const TERMS = [
  {
    term: 'Therapeutic Effect',
    emoji: '✅',
    color: '#10B981',
    definition: 'The intended, favorable response to a drug — the effect the prescriber is aiming for.',
    example: 'Salbutamol causing bronchodilation in an asthma attack.',
  },
  {
    term: 'Adverse Effect',
    emoji: '⚠️',
    color: '#EF4444',
    definition: 'An undesirable and potentially harmful response to a drug — also called a side effect when unexpected.',
    example: 'ACE inhibitor causing a dry cough.',
  },
  {
    term: 'Side Effect',
    emoji: '💊',
    color: '#F59E0B',
    definition: 'The secondary effect of a drug — may be therapeutic or adverse. Not always harmful but not the primary aim.',
    example: 'Amitriptyline causing sedation (adverse when driving, therapeutic when prescribed for insomnia).',
  },
  {
    term: 'Systemic Effect',
    emoji: '🫀',
    color: '#3B82F6',
    definition: 'Drug effects that occur in tissues distant from the administration site — affecting the whole body rather than just locally.',
    example: 'Inhaled corticosteroids causing systemic immunosuppression at high doses.',
  },
  {
    term: 'Idiosyncratic Effect',
    emoji: '❓',
    color: '#8B5CF6',
    definition: 'An unexpected, unusual reaction that is unpredictable and unique to an individual — not related to dose or drug class.',
    example: 'Malignant hyperthermia after anaesthetic agents in genetically susceptible patients.',
  },
  {
    term: 'Agonist',
    emoji: '🔛',
    color: '#10B981',
    definition: 'A drug that binds to a receptor and stimulates its function — produces a response similar to the natural ligand.',
    example: 'Morphine binds to opioid receptors and activates them to produce analgesia.',
  },
  {
    term: 'Antagonist',
    emoji: '🔇',
    color: '#EF4444',
    definition: 'A drug that binds to a receptor and blocks it — prevents the natural ligand or agonist from producing an effect.',
    example: 'Naloxone blocks opioid receptors, reversing respiratory depression from morphine.',
  },
  {
    term: 'Hypersensitivity',
    emoji: '🚨',
    color: '#DC2626',
    definition: 'An exaggerated immune response to a drug acting as an antigen — ranges from mild rash to anaphylaxis.',
    example: 'Anaphylaxis following penicillin in a sensitised patient.',
  },
  {
    term: 'Metabolism (Drug)',
    emoji: '⚗️',
    color: '#6366F1',
    definition: 'The chemical alteration of a drug in the body — primarily occurs in the liver. Converts drugs to active or inactive metabolites for excretion.',
    example: 'Codeine is metabolised in the liver to morphine (its active form).',
  },
  {
    term: 'Therapeutic Classification',
    emoji: '🎯',
    color: '#00A99D',
    definition: 'Classifies a drug by its therapeutic usefulness — what condition it treats.',
    example: 'Anticoagulant (influences blood clotting), Antihypertensive (lowers BP), Antianginal (treats angina).',
  },
  {
    term: 'Pharmacological Classification',
    emoji: '🔬',
    color: '#8B5CF6',
    definition: 'Classifies a drug by how it acts — its mechanism of action at a cellular or molecular level.',
    example: 'Loop diuretics (act in the loop of Henle), Calcium channel blockers (block heart calcium channels).',
  },
  {
    term: 'Generic Name',
    emoji: '📋',
    color: '#1B3A6B',
    definition: 'The official non-proprietary name of a drug — indicates its drug group. Same worldwide, lowercase, used in prescribing.',
    example: 'paracetamol (generic) vs Panadol (trade/brand name).',
  },
  {
    term: 'Trade / Brand Name',
    emoji: '®',
    color: '#F97316',
    definition: 'The proprietary name registered by the manufacturer — capitalised, may vary by country.',
    example: 'Ventolin (trade) = salbutamol (generic). Multiple brands can exist for the same generic drug.',
  },
  {
    term: 'Therapeutic Drug Level',
    emoji: '📊',
    color: '#0EA5E9',
    definition: 'The blood concentration range in which a drug produces its desired effect without toxicity. Below = sub-therapeutic; above = toxic.',
    example: 'Digoxin: 0.5–2 ng/mL. Theophylline: 10–20 mcg/mL. Vancomycin: trough monitoring per protocol.',
  },
  {
    term: 'Drug Antidotes',
    emoji: '💉',
    color: '#10B981',
    definition: 'Specific agents used to reverse or counteract the toxic effects of a drug.',
    example: 'Naloxone → opioids | Flumazenil → benzodiazepines | Vitamin K → warfarin | Protamine → heparin | N-acetylcysteine → paracetamol overdose | Intralipid → local anaesthetic toxicity | Idarucizumab → dabigatran',
  },
];

export const TerminologyGlossary = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="px-4 py-4 space-y-3" data-testid="terminology-glossary">
      {/* Intro */}
      <div
        className="rounded-2xl px-4 py-3 flex gap-3 items-start"
        style={{ background: `${C.pharm}10`, border: `1px solid ${C.pharm}25` }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">📖</span>
        <p className="text-xs leading-relaxed" style={{ fontFamily: FONTS.body, color: C.pharm }}>
          Essential pharmacology terms every nursing student must know. Tap any term to expand its definition and a clinical example.
        </p>
      </div>

      {/* Term cards */}
      {TERMS.map((item) => {
        const isOpen = expanded === item.term;
        return (
          <button
            key={item.term}
            data-testid={`term-card-${item.term.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setExpanded(isOpen ? null : item.term)}
            className="w-full bg-white rounded-2xl overflow-hidden text-left transition-all active:scale-[0.99]"
            style={{
              border: `1.5px solid ${isOpen ? item.color : item.color + '30'}`,
              minHeight: '56px',
            }}
            aria-expanded={isOpen}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: isOpen ? `${item.color}10` : 'transparent' }}
            >
              <span className="text-xl flex-shrink-0">{item.emoji}</span>
              <span
                className="flex-1 text-sm font-bold"
                style={{ fontFamily: FONTS.heading, color: isOpen ? item.color : C.primary }}
              >
                {item.term}
              </span>
              <svg
                className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                style={{ color: item.color, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-800 leading-relaxed" style={{ fontFamily: FONTS.body }}>
                  {item.definition}
                </p>
                <div
                  className="rounded-xl p-3"
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: item.color, fontFamily: FONTS.heading }}>
                    💡 Clinical Example
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: FONTS.body }}>
                    {item.example}
                  </p>
                </div>
              </div>
            )}
          </button>
        );
      })}

      <p
        className="text-center text-xs text-gray-400 pb-4 leading-relaxed"
        style={{ fontFamily: FONTS.body }}
      >
        Source: NurseBoss Pharmacology Study Guide · For educational use only
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PharmPage — default export (3 inner tabs)
// ─────────────────────────────────────────────────────────────
const PHARM_TABS = [
  { id: 'classes',  label: 'Drug Classes', emoji: '🔬' },
  { id: 'suffixes', label: 'Suffixes',     emoji: '🧠' },
  { id: 'terms',    label: 'Terminology',  emoji: '📖' },
];

const PharmPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('classes');

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: FONTS.body }}>
      {/* Sub-tab bar */}
      <div
        className="flex-shrink-0 flex border-b border-gray-100 bg-white overflow-x-auto"
        role="tablist"
        aria-label="Pharmacology sections"
        style={{ scrollbarWidth: 'none' }}
      >
        {PHARM_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`pharm-tab-${tab.id}`}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex-shrink-0 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors whitespace-nowrap"
              style={{
                fontFamily: FONTS.heading,
                color: active ? C.pharm : '#9CA3AF',
                borderBottom: active ? `2px solid ${C.pharm}` : '2px solid transparent',
                minHeight: '48px',
                minWidth: '90px',
              }}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable panel */}
      <div
        className="flex-1 overflow-y-auto bg-[#F4F6F9]"
        role="tabpanel"
        data-testid={`pharm-panel-${activeTab}`}
      >
        {activeTab === 'classes'  && <DrugClassExplorer onNavigate={onNavigate} />}
        {activeTab === 'suffixes' && <SuffixMnemonics onNavigate={onNavigate} />}
        {activeTab === 'terms'    && <TerminologyGlossary />}
      </div>
    </div>
  );
};

export default PharmPage;
