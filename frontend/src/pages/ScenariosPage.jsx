import { useState } from 'react';

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
  surface: '#F4F6F9',
};

// ─────────────────────────────────────────────────────────────
// Scenario data — 15 clinical vignettes
// ─────────────────────────────────────────────────────────────
const THEMES = {
  S8: { label: 'S8 / Controlled Drugs', emoji: '🔐', color: '#F97316' },
  INSULIN: { label: 'Insulin', emoji: '💉', color: C.safe },
  ANTICOAG: { label: 'Anticoagulants', emoji: '🩸', color: C.critical },
  OPIOID: { label: 'Opioids', emoji: '😮‍💨', color: '#8B5CF6' },
  HIGH_ALERT: { label: 'High-Alert Drugs', emoji: '⚠️', color: C.caution },
};

const SCENARIOS = [
  // ── S8 / Controlled drugs ─────────────────────────────────
  {
    id: 's8-1',
    theme: 'S8',
    title: 'Missing Double-Check',
    situation:
      'You are a student nurse on a busy surgical ward. The registered nurse you are working with administered 5mg of oral morphine to a patient in pain and signed the S8 register, but did not ask you or another nurse to co-sign the double-check before administration.',
    question: 'What is the most appropriate action to take now?',
    options: [
      'Say nothing — the RN is experienced and it is not your place to question them.',
      'Quietly mention to the RN that the double-check was not completed and ask how they would like to document it.',
      'Immediately report the RN to the Nurse Unit Manager without speaking to them first.',
      'Co-sign the S8 register now as if you had been present for the check.',
    ],
    correctIndex: 1,
    rationale:
      'S8 drugs require a witnessed double-check before administration under Australian law and facility policy — not after. The safest and most professional response is to raise the concern directly with the RN in a non-confrontational way so it can be addressed and documented correctly. Co-signing retrospectively without having witnessed the check is falsification of records.',
  },
  {
    id: 's8-2',
    theme: 'S8',
    title: 'S8 Count Discrepancy',
    situation:
      'During the end-of-shift S8 count, you and the outgoing RN discover there are 9 oxycodone 5mg tablets in the cupboard, but the register shows there should be 10. You have both recounted twice and the result is the same.',
    question: 'What should happen next?',
    options: [
      'Round up the count to 10 in the register so the shift can be handed over without delay.',
      'Note the discrepancy in the register, notify the Nurse Unit Manager immediately, and complete an incident report as per facility policy.',
      'Wait until the next shift to see if the count resolves itself.',
      'Assume someone forgot to sign the register and add a late entry.',
    ],
    correctIndex: 1,
    rationale:
      'Any S8 count discrepancy must be reported immediately to the NUM and documented via an incident report — this is a mandatory legal obligation. Altering the count, delaying reporting, or adding retrospective entries are all serious breaches of medication safety law and could constitute drug diversion cover-up.',
  },
  {
    id: 's8-3',
    theme: 'S8',
    title: 'Patient Refuses S8',
    situation:
      'Mrs Nguyen has been prescribed temazepam 10mg nocte for insomnia. When you bring her medication at 2100, she says she does not want to take it tonight as she feels she might be able to sleep without it.',
    question: 'What is the correct response?',
    options: [
      'Encourage her firmly to take it because it has been prescribed for her.',
      'Respect her decision, document the refusal clearly in the medication chart and nursing notes, and return the temazepam to the S8 cupboard with a witness.',
      'Leave the tablet on her bedside table in case she changes her mind later.',
      'Crush it and mix it into her evening drink so she gets the benefit.',
    ],
    correctIndex: 1,
    rationale:
      'Patients have the right to refuse any medication at any time. The correct action is to respect the refusal, clearly document it, and return the S8 to the controlled drug cupboard with a witness — it must never be left at the bedside or administered without consent. Covert administration is both unlawful and an ethical violation.',
  },

  // ── Insulin ───────────────────────────────────────────────
  {
    id: 'insulin-1',
    theme: 'INSULIN',
    title: "Meal Hasn't Arrived",
    situation:
      'Mr Patel has type 2 diabetes and is prescribed NovoRapid (insulin aspart) 8 units subcutaneously with breakfast. It is 0730, you have drawn up the insulin, and you are about to administer it — but his breakfast tray has not yet arrived from the kitchen.',
    question: 'What should you do?',
    options: [
      'Administer the insulin now and chase the meal afterwards — timing is critical.',
      'Wait until the meal arrives and is in front of the patient before administering the rapid-acting insulin.',
      'Administer half the dose now and the other half when the meal arrives.',
      'Skip the dose entirely and document it as not given.',
    ],
    correctIndex: 1,
    rationale:
      'Rapid-acting insulin such as NovoRapid has an onset of 10–20 minutes. Administering it before a meal is available risks severe hypoglycaemia if the patient cannot eat promptly. Always confirm the meal is ready and the patient is able to eat before giving mealtime insulin — this is a core insulin safety rule.',
  },
  {
    id: 'insulin-2',
    theme: 'INSULIN',
    title: 'Low BGL Before Dose',
    situation:
      'You check Mr Thompson\'s BGL before his 0800 insulin and find it is 3.2 mmol/L. He is alert and says he feels a little "shaky". He is prescribed Mixtard 30 insulin 20 units subcutaneously with breakfast.',
    question: 'What is the most appropriate next action?',
    options: [
      'Give the insulin as charted and offer him breakfast immediately after.',
      'Hold the insulin, treat the hypoglycaemia according to your facility\'s hypoglycaemia protocol, and notify the treating team before reconsidering the insulin dose.',
      'Give half the prescribed dose and monitor his BGL in 30 minutes.',
      'Give the full dose because he is eating breakfast and his BGL will rise.',
    ],
    correctIndex: 1,
    rationale:
      'A BGL of 3.2 mmol/L is hypoglycaemic (below 4.0 mmol/L). Giving insulin in this situation would worsen the hypoglycaemia and could be life-threatening. The insulin must be withheld, hypoglycaemia treated per protocol (e.g. 15g fast-acting carbohydrate), and the team notified to reassess the dose before it is given.',
  },
  {
    id: 'insulin-3',
    theme: 'INSULIN',
    title: 'Wrong Insulin Pen',
    situation:
      'You are preparing to administer Mrs Chen\'s morning insulin. She is prescribed Lantus (glargine) 20 units — her long-acting basal insulin. On her bedside table you find two insulin pens: one Lantus SoloStar (purple) and one NovoRapid FlexPen (blue). In a hurry, you reach for the blue pen.',
    question: 'What should you do before proceeding?',
    options: [
      'Proceed — both are insulins and the difference is minor.',
      'Stop, verify the pen label against the medication chart and the patient\'s armband, confirm the correct insulin type, and only proceed once the second nurse has co-checked.',
      'Ask the patient which pen is hers — she will know.',
      'Use whichever pen has more insulin remaining to avoid waste.',
    ],
    correctIndex: 1,
    rationale:
      'Insulin errors are among the most dangerous medication errors in hospitals. Giving rapid-acting NovoRapid instead of long-acting Lantus could cause profound hypoglycaemia. Always verify the insulin name, type, dose, and device against the medication chart with a second nurse check — never rely on pen colour or patient recall alone.',
  },

  // ── Anticoagulants ────────────────────────────────────────
  {
    id: 'anticoag-1',
    theme: 'ANTICOAG',
    title: 'INR 5.2',
    situation:
      'Mr Harris is prescribed warfarin 5mg daily for atrial fibrillation. His INR result just came back at 5.2 (therapeutic range 2.0–3.0). It is 1800 and his evening warfarin is charted for administration now.',
    question: 'What should you do?',
    options: [
      'Give the warfarin as charted — the dose might need adjusting tomorrow.',
      'Hold the warfarin, immediately notify the treating doctor of the supratherapeutic INR, and document the hold and the notification in the chart.',
      'Give half the usual dose and recheck the INR in the morning.',
      'Give the dose but ask the patient to drink extra water.',
    ],
    correctIndex: 1,
    rationale:
      'An INR of 5.2 is significantly supratherapeutic and carries a serious risk of major haemorrhage. Warfarin must be withheld and the prescriber contacted urgently — they may order Vitamin K (phytomenadione) or other reversal depending on clinical context. Never administer warfarin with a supratherapeutic INR without medical review.',
  },
  {
    id: 'anticoag-2',
    theme: 'ANTICOAG',
    title: 'Warfarin Before Urgent Surgery',
    situation:
      'Mrs Okafor is on warfarin for a mechanical heart valve (target INR 2.5–3.5) and is listed for an urgent appendicectomy tonight. The surgical team has asked the nursing staff to "sort out the anticoagulation" before she goes to theatre.',
    question: 'What is the most appropriate nursing action?',
    options: [
      'Hold all anticoagulants and administer nothing until surgery.',
      'Contact the treating medical team or haematology for specific bridging and reversal orders — do not make independent anticoagulation decisions for a patient with a mechanical valve.',
      'Give Vitamin K 10mg IV now as this is standard pre-op reversal.',
      'Continue warfarin as charted and let the surgeons manage it in theatre.',
    ],
    correctIndex: 1,
    rationale:
      'Mechanical heart valves require careful anticoagulation management — stopping warfarin without bridging therapy risks valve thrombosis and stroke, while proceeding with high INR risks surgical haemorrhage. This requires urgent specialist medical decision-making, not independent nursing action. The nurse\'s role is to escalate and clarify orders promptly.',
  },
  {
    id: 'anticoag-3',
    theme: 'ANTICOAG',
    title: 'Double Dose of Eliquis',
    situation:
      'Mr Deluca is admitted and tells you he thinks he took his apixaban (Eliquis) 5mg twice today — once at home this morning and once when the ward nurse gave him his morning medications at 1000, not realising he had already taken a dose.',
    question: 'What is the most important action?',
    options: [
      'Reassure him that apixaban is safe and one extra dose will not matter.',
      'Document the potential double dose, notify the treating doctor immediately, monitor closely for signs of bleeding, and complete an incident report.',
      'Skip the next scheduled dose and continue as normal.',
      'Contact the pharmacy but do not bother the doctor unless he starts bleeding.',
    ],
    correctIndex: 1,
    rationale:
      'A double dose of a DOAC significantly increases bleeding risk. The treating doctor must be notified immediately so they can assess the patient and determine if any intervention is needed. Signs of bleeding must be monitored closely, the event documented accurately, and an incident report completed — this is both a patient safety and medication error reporting obligation.',
  },

  // ── Opioids ───────────────────────────────────────────────
  {
    id: 'opioid-1',
    theme: 'OPIOID',
    title: 'Respiratory Rate 8 After Morphine',
    situation:
      'You check on Mr Singh 30 minutes after administering 5mg IV morphine for post-operative pain. He is difficult to rouse, his oxygen saturation is 91% on room air, and his respiratory rate is 8 breaths per minute.',
    question: 'What is the priority action?',
    options: [
      'Document the observations and check again in an hour.',
      'Apply supplemental oxygen, call for emergency assistance (MET/code), prepare naloxone as per your facility protocol, and stay with the patient.',
      'Give another 2.5mg morphine as his pain score was high earlier.',
      'Sit him upright and ask him to take deep breaths.',
    ],
    correctIndex: 1,
    rationale:
      'A respiratory rate of 8, oxygen saturation of 91%, and decreased consciousness following opioid administration indicate opioid-induced respiratory depression — a life-threatening emergency. Activate the medical emergency team immediately, apply oxygen, and prepare naloxone for administration per protocol. This situation cannot wait and escalation must not be delayed.',
  },
  {
    id: 'opioid-2',
    theme: 'OPIOID',
    title: 'Uncharted Endone Request',
    situation:
      'Mrs Brown had a knee replacement yesterday and tells you her pain is 8/10. She asks you to give her an extra Endone (oxycodone 5mg) on top of her charted doses. You check the chart and there is no PRN oxycodone ordered — only regular paracetamol and ibuprofen.',
    question: 'What is the correct response?',
    options: [
      'Give the oxycodone from the S8 cupboard — her pain is clearly significant and it is compassionate care.',
      'Explain you cannot administer uncharted medications, assess and document her pain, and contact the treating team to review her analgesia and consider adding a PRN opioid order.',
      'Tell her to wait until the doctor does their rounds tomorrow morning.',
      'Give her an extra paracetamol instead without telling the team.',
    ],
    correctIndex: 1,
    rationale:
      'Nurses in Australia cannot administer any medication that is not prescribed on the medication chart — including S8 opioids. The correct action is to acknowledge her pain, explain why you cannot give uncharted medication, and promptly escalate to the treating team so her analgesia can be reviewed and a PRN order added if clinically appropriate.',
  },
  {
    id: 'opioid-3',
    theme: 'OPIOID',
    title: 'Fentanyl Patch Site Not Documented',
    situation:
      'You are taking over care of Mr Williams who has a fentanyl patch (Durogesic 25mcg/hr) applied somewhere on his body. The outgoing nurse tells you the patch is "somewhere on his torso" but there is no documentation of the site in the nursing notes or on the medication chart.',
    question: 'What must you do before completing the handover?',
    options: [
      'Accept the handover and document the site at your next observation round.',
      'Locate the patch yourself, document the exact site and application time in the nursing notes and chart, confirm the old patch was removed, and escalate the documentation gap to the outgoing nurse and NUM.',
      'Ask the patient where the patch is and take his word for it.',
      'Apply a new patch in a fresh site to be safe and discard the old one.',
    ],
    correctIndex: 1,
    rationale:
      'Fentanyl patches must have their site documented at every application to ensure the old patch is removed before a new one is applied — double-patching can cause fatal opioid toxicity. Undocumented patch sites are a serious medication safety risk. You must physically locate and document the patch before accepting care, and the documentation failure must be reported.',
  },

  // ── High-alert drugs ──────────────────────────────────────
  {
    id: 'high-alert-1',
    theme: 'HIGH_ALERT',
    title: 'Potassium Running Too Fast',
    situation:
      'You walk into Room 4 and notice that Mr Gonzalez\'s IV potassium chloride 40mmol in 1000mL NaCl is running through a gravity drip and appears to be infusing much faster than the prescribed rate of 10mmol/hr. The patient is complaining of burning at the IV site.',
    question: 'What should you do immediately?',
    options: [
      'Slow the drip down to the correct rate and continue monitoring.',
      'Stop the infusion immediately, assess the patient (ECG if available, cardiac monitoring), notify the treating doctor urgently, and document the incident.',
      'Remove the IV site and re-site the cannula to fix the burning, then restart the infusion.',
      'Continue the infusion — potassium is a normal electrolyte and a little extra is not harmful.',
    ],
    correctIndex: 1,
    rationale:
      'IV potassium is a high-alert medication — rapid infusion can cause life-threatening cardiac arrhythmias including ventricular fibrillation. Stop the infusion immediately and assess for cardiac effects. Potassium must always be administered on an infusion pump, never by gravity drip. This is a critical medication safety incident requiring urgent medical review and an incident report.',
  },
  {
    id: 'high-alert-2',
    theme: 'HIGH_ALERT',
    title: 'Metformin Before CT Contrast',
    situation:
      'Mrs Lee takes metformin 1g BD for type 2 diabetes and is scheduled for a CT scan with IV contrast at 1400 today. It is 1200, you are about to give her lunchtime medications including her metformin, and you notice the CT is booked but there are no specific hold orders on the chart.',
    question: 'What is the correct action?',
    options: [
      'Give the metformin as charted — there are no hold orders so it must be fine.',
      'Withhold the metformin, contact the treating doctor to clarify whether it should be held per your facility\'s pre-contrast protocol, and notify the radiology team of her metformin use.',
      'Give a half dose of metformin as a compromise.',
      'Cancel the CT scan until the metformin can be withheld for 48 hours.',
    ],
    correctIndex: 1,
    rationale:
      'Metformin is typically withheld before and for 48 hours after IV contrast administration due to the risk of contrast-induced nephropathy leading to metformin accumulation and lactic acidosis — a rare but potentially fatal complication. The absence of a hold order is a prescribing omission that must be clarified before proceeding. Always check facility protocol and escalate when in doubt.',
  },
  {
    id: 'high-alert-3',
    theme: 'HIGH_ALERT',
    title: 'Digoxin With Low Heart Rate',
    situation:
      'Mr Abbott is prescribed digoxin 125mcg orally daily for atrial fibrillation. Before your morning medication round you check his vital signs and find his heart rate is 52 beats per minute. He says he feels a "bit nauseous" this morning, which is new for him.',
    question: 'What should you do?',
    options: [
      'Give the digoxin as charted — his HR is just slightly low.',
      'Withhold the digoxin, assess for other signs of toxicity (visual changes, arrhythmia), check his digoxin level and electrolytes if not recently done, and notify the treating doctor before administering.',
      'Give the dose and plan to recheck his heart rate in 2 hours.',
      'Give half the dose since his heart rate is borderline.',
    ],
    correctIndex: 1,
    rationale:
      'Digoxin has a narrow therapeutic index and must be withheld if the apical heart rate is below 60 beats per minute. A HR of 52 combined with new nausea are classic signs of digoxin toxicity. The drug must be held, the prescriber notified immediately, and digoxin levels and electrolytes (especially potassium) reviewed — hypokalaemia dramatically potentiates digoxin toxicity.',
  },
];

// Group by theme
const GROUPED = Object.entries(THEMES).map(([key, meta]) => ({
  key,
  ...meta,
  scenarios: SCENARIOS.filter((s) => s.theme === key),
}));

// ─────────────────────────────────────────────────────────────
// ScenarioHome — grid of scenario cards
// ─────────────────────────────────────────────────────────────
export const ScenarioHome = ({ onSelect, completedIds }) => (
  <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>
    {/* Header */}
    <div className="bg-white px-5 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">🛡️</span>
        <h1 className="text-xl font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
          Safety Scenarios
        </h1>
        <span
          className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: '#EF444420', color: '#EF4444', fontFamily: FONTS.body }}
        >
          {SCENARIOS.length} scenarios
        </span>
      </div>
      <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
        Reflective clinical reasoning — no score, just learning
      </p>
    </div>

    {/* Scrollable scenario list */}
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" data-testid="scenario-home-scroll">
      {GROUPED.map(({ key, label, emoji, color, scenarios }) => (
        <div key={key} data-testid={`theme-group-${key.toLowerCase()}`}>
          {/* Theme heading */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{emoji}</span>
            <h2
              className="text-sm font-bold"
              style={{ fontFamily: FONTS.heading, color }}
            >
              {label}
            </h2>
          </div>

          {/* Scenario cards */}
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const done = completedIds.has(scenario.id);
              return (
                <button
                  key={scenario.id}
                  data-testid={`scenario-card-${scenario.id}`}
                  onClick={() => onSelect(scenario)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white text-left transition-all active:scale-95"
                  style={{
                    minHeight: '60px',
                    border: `1.5px solid ${done ? color + '60' : color + '25'}`,
                    background: done ? `${color}08` : '#FFFFFF',
                  }}
                >
                  {/* Done indicator */}
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                    style={{ background: done ? color : `${color}15` }}
                  >
                    {done ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span style={{ color }}>{emoji}</span>
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold leading-tight"
                      style={{ fontFamily: FONTS.heading, color: C.primary }}
                    >
                      {scenario.title}
                    </p>
                    <p
                      className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-2"
                      style={{ fontFamily: FONTS.body }}
                    >
                      {scenario.situation.slice(0, 80)}…
                    </p>
                  </div>

                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <p
        className="text-center text-xs text-gray-400 pb-4 leading-relaxed"
        style={{ fontFamily: FONTS.body }}
      >
        These scenarios are for educational use only. Always follow your facility's policies and escalate to senior staff in clinical practice.
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// ScenarioView — single scenario with reveal
// ─────────────────────────────────────────────────────────────
export const ScenarioView = ({ scenario, onBack, onComplete }) => {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const theme = THEMES[scenario.theme];
  const isCorrect = selected === scenario.correctIndex;

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onComplete(scenario.id);
  };

  const optionStyle = (idx) => {
    if (!revealed) {
      return {
        background: '#FFFFFF',
        border: '1.5px solid #E5E7EB',
        color: '#1F2937',
      };
    }
    if (idx === scenario.correctIndex) {
      return { background: '#10B98115', border: `2px solid ${C.safe}`, color: C.safe };
    }
    if (idx === selected) {
      return { background: '#EF444415', border: `2px solid ${C.critical}`, color: C.critical };
    }
    return { background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#9CA3AF' };
  };

  const optionIcon = (idx) => {
    if (!revealed) return null;
    if (idx === scenario.correctIndex) return '✓';
    if (idx === selected) return '✗';
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            data-testid="back-btn"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors hover:bg-gray-200"
            style={{ minWidth: '36px', minHeight: '36px' }}
            aria-label="Back to scenarios"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{theme.emoji}</span>
              <span
                className="text-xs font-bold"
                style={{ color: theme.color, fontFamily: FONTS.body }}
              >
                {theme.label}
              </span>
            </div>
            <h2
              className="text-base font-bold text-[#1B3A6B] leading-tight"
              style={{ fontFamily: FONTS.heading }}
            >
              {scenario.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Situation vignette */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: `${theme.color}10`, border: `1.5px solid ${theme.color}30` }}
          data-testid="situation-box"
        >
          <p
            className="text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: theme.color, fontFamily: FONTS.body }}
          >
            📋 Clinical Situation
          </p>
          <p className="text-sm text-gray-800 leading-relaxed" style={{ fontFamily: FONTS.body }}>
            {scenario.situation}
          </p>
        </div>

        {/* Question */}
        <h3
          className="text-base font-bold text-[#1B3A6B] mb-4 leading-snug"
          style={{ fontFamily: FONTS.heading }}
          data-testid="question-text"
        >
          {scenario.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-5" role="group" aria-label="Answer options">
          {scenario.options.map((option, idx) => (
            <button
              key={idx}
              data-testid={`option-btn-${idx}`}
              onClick={() => handleSelect(idx)}
              disabled={revealed}
              className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left font-medium transition-all"
              style={{
                minHeight: '56px',
                fontFamily: FONTS.body,
                fontSize: '14px',
                cursor: revealed ? 'default' : 'pointer',
                ...optionStyle(idx),
              }}
              aria-pressed={selected === idx}
            >
              {/* Option letter */}
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 mt-0.5"
                style={{
                  borderColor: revealed && idx === scenario.correctIndex
                    ? C.safe
                    : revealed && idx === selected
                    ? C.critical
                    : '#D1D5DB',
                  color: revealed && idx === scenario.correctIndex
                    ? C.safe
                    : revealed && idx === selected
                    ? C.critical
                    : '#9CA3AF',
                }}
              >
                {optionIcon(idx) || String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 leading-snug">{option}</span>
            </button>
          ))}
        </div>

        {/* Rationale — revealed after answering */}
        {revealed && (
          <div
            data-testid="rationale-box"
            className="rounded-2xl p-4 mb-5"
            style={{
              background: isCorrect ? '#10B98112' : '#EF444412',
              border: `1.5px solid ${isCorrect ? C.safe : C.critical}40`,
            }}
          >
            <p
              className="text-sm font-bold mb-2"
              style={{
                color: isCorrect ? C.safe : C.critical,
                fontFamily: FONTS.heading,
              }}
            >
              {isCorrect ? '✓ Correct — well reasoned!' : '✗ Not quite — here\'s the rationale:'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: FONTS.body }}>
              {scenario.rationale}
            </p>
          </div>
        )}

        {/* Back button after reveal */}
        {revealed && (
          <button
            data-testid="back-to-scenarios-btn"
            onClick={onBack}
            className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity active:opacity-80 mb-6"
            style={{ background: C.primary, fontFamily: FONTS.heading, minHeight: '52px' }}
          >
            ← Back to Scenarios
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ScenariosPage — orchestrator (default export)
// ─────────────────────────────────────────────────────────────
const ScenariosPage = () => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());

  const handleComplete = (id) => {
    setCompletedIds((prev) => new Set([...prev, id]));
  };

  if (activeScenario) {
    return (
      <ScenarioView
        scenario={activeScenario}
        onBack={() => setActiveScenario(null)}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <ScenarioHome
      onSelect={setActiveScenario}
      completedIds={completedIds}
    />
  );
};

export default ScenariosPage;
