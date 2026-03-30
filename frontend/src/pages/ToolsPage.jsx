import { useState, useCallback, useMemo } from 'react';
import { drugs, categoryColors, scheduleColors } from '../data/drugs';
import PharmPage from './PharmPage';

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
// Shared primitives
// ─────────────────────────────────────────────────────────────
const Label = ({ children, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className="text-xs font-bold uppercase tracking-wide text-gray-400"
    style={{ fontFamily: FONTS.body }}
  >
    {children}
  </label>
);

const TextInput = ({ id, value, onChange, placeholder, disabled, ...rest }) => (
  <input
    id={id}
    data-testid={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-[#00A99D] transition-all disabled:text-gray-400"
    style={{ fontFamily: FONTS.body, minHeight: '44px' }}
    {...rest}
  />
);

const TextArea = ({ id, value, onChange, placeholder, rows = 3 }) => (
  <textarea
    id={id}
    data-testid={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 focus:ring-[#00A99D] focus:border-[#00A99D] transition-all resize-none"
    style={{ fontFamily: FONTS.body }}
  />
);

const PillBtn = ({ onClick, children, color = C.primary, outline = false, testId, disabled = false }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    disabled={disabled}
    className="rounded-full px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
    style={{
      minHeight: '44px',
      fontFamily: FONTS.heading,
      background: outline ? 'transparent' : color,
      color: outline ? color : '#FFFFFF',
      border: `2px solid ${color}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────
// ISBARBuilder
// ─────────────────────────────────────────────────────────────
const ISBAR_SECTIONS = [
  {
    key: 'identify',
    label: 'I — Identify',
    emoji: '🪪',
    color: '#3B82F6',
    placeholder:
      'State your name and role, the patient\'s name, date of birth, UR number, and current location (ward/bed).\nExample: "I\'m [Name], a nursing student on Ward 4B. I\'m calling about Mrs Jane Smith, DOB 15/03/1948, UR 123456, in Bed 12."',
  },
  {
    key: 'situation',
    label: 'S — Situation',
    emoji: '🚨',
    color: C.critical,
    placeholder:
      'Describe the current problem — what is happening right now that prompted this handover or call.\nExample: "Mrs Smith has become increasingly short of breath over the past hour with SpO₂ now 91% on room air."',
  },
  {
    key: 'background',
    label: 'B — Background',
    emoji: '📋',
    color: '#8B5CF6',
    placeholder:
      'Provide relevant clinical history: admitting diagnosis, significant past history, current medications, allergies, and recent results.\nExample: "She was admitted 2 days ago with a COPD exacerbation. She has a history of CCF. She is on salbutamol nebulisers and frusemide 40mg daily. Allergic to penicillin."',
  },
  {
    key: 'assessment',
    label: 'A — Assessment',
    emoji: '🩺',
    color: C.caution,
    placeholder:
      'Your clinical assessment of the situation — what you think is happening and relevant observations.\nExample: "Observations: RR 28, SpO₂ 91%, HR 104, BP 142/88, Temp 37.2. NEWS2 score is 6. I am concerned she may be deteriorating."',
  },
  {
    key: 'recommendation',
    label: 'R — Recommendation',
    emoji: '✅',
    color: C.safe,
    placeholder:
      'State clearly what you need — what you want the person to do, any urgency, and confirm they have understood.\nExample: "I would like you to review Mrs Smith urgently. Should I commence high-flow oxygen and call the MET? Can you advise on next steps?"',
  },
];

const EMPTY_FORM = {
  patientName: '',
  patientId: '',
  wardBed: '',
  identify: '',
  situation: '',
  background: '',
  assessment: '',
  recommendation: '',
};

const now = () => {
  const d = new Date();
  return `${d.toLocaleDateString('en-AU')} ${d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`;
};

export const ISBARBuilder = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [datetime] = useState(now);
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const isComplete = ISBAR_SECTIONS.every((s) => form[s.key].trim().length > 0) &&
    form.patientName.trim() && form.patientId.trim() && form.wardBed.trim();

  const handleGenerate = () => setShowCard(true);

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setShowCard(false);
    setCopied(false);
  };

  const handoverText = `ISBAR HANDOVER — ${datetime}
Patient: ${form.patientName} | ID: ${form.patientId} | Ward/Bed: ${form.wardBed}

IDENTIFY
${form.identify}

SITUATION
${form.situation}

BACKGROUND
${form.background}

ASSESSMENT
${form.assessment}

RECOMMENDATION
${form.recommendation}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(handoverText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback — select text manually
    }
  };

  return (
    <div className="px-4 py-4 space-y-5" data-testid="isbar-builder">
      {/* Intro */}
      <div
        className="rounded-2xl px-4 py-3 flex gap-3 items-start"
        style={{ background: '#1B3A6B10', border: '1px solid #1B3A6B20' }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">📞</span>
        <p className="text-xs text-[#1B3A6B] leading-relaxed" style={{ fontFamily: FONTS.body }}>
          ISBAR is the standard Australian clinical communication framework for handovers and escalation calls. Fill each section, then generate your structured handover card.
        </p>
      </div>

      {/* Patient details */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400" style={{ fontFamily: FONTS.body }}>
          Patient Details
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="isbar-patient-name">Patient Name</Label>
            <TextInput id="isbar-patient-name" value={form.patientName} onChange={set('patientName')} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="isbar-patient-id">UR / Patient ID</Label>
            <TextInput id="isbar-patient-id" value={form.patientId} onChange={set('patientId')} placeholder="123456" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="isbar-ward-bed">Ward / Bed</Label>
            <TextInput id="isbar-ward-bed" value={form.wardBed} onChange={set('wardBed')} placeholder="4B / Bed 12" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="isbar-datetime">Date / Time</Label>
            <TextInput id="isbar-datetime" value={datetime} disabled />
          </div>
        </div>
      </div>

      {/* ISBAR sections */}
      {ISBAR_SECTIONS.map((section) => (
        <div key={section.key} className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: `${section.color}15` }}
            >
              {section.emoji}
            </span>
            <p className="text-sm font-bold" style={{ color: section.color, fontFamily: FONTS.heading }}>
              {section.label}
            </p>
          </div>
          <TextArea
            id={`isbar-${section.key}`}
            value={form[section.key]}
            onChange={set(section.key)}
            placeholder={section.placeholder}
            rows={4}
          />
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3">
        <PillBtn testId="isbar-clear-btn" onClick={handleClear} outline color={C.primary}>
          Clear
        </PillBtn>
        <div className="flex-1">
          <PillBtn
            testId="isbar-generate-btn"
            onClick={handleGenerate}
            color={C.accent}
            disabled={!isComplete}
          >
            {isComplete ? 'Generate Handover →' : 'Fill all fields to generate'}
          </PillBtn>
        </div>
      </div>

      {/* Generated handover card */}
      {showCard && (
        <div
          data-testid="isbar-handover-card"
          className="rounded-2xl overflow-hidden"
          style={{ border: `2px solid ${C.accent}40` }}
        >
          {/* Card header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: `${C.accent}15`, borderBottom: `1px solid ${C.accent}30` }}
          >
            <div>
              <p className="text-xs font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
                ISBAR Handover — {datetime}
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: FONTS.body }}>
                {form.patientName} · {form.patientId} · {form.wardBed}
              </p>
            </div>
            <button
              data-testid="isbar-copy-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: copied ? C.safe : C.primary,
                color: '#FFFFFF',
                fontFamily: FONTS.heading,
                minHeight: '36px',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          {/* Card body */}
          <div className="divide-y divide-gray-100 bg-white">
            {ISBAR_SECTIONS.map((section) => (
              <div key={section.key} className="px-4 py-3">
                <p
                  className="text-xs font-bold mb-1"
                  style={{ color: section.color, fontFamily: FONTS.heading }}
                >
                  {section.emoji} {section.label}
                </p>
                <p
                  className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                  style={{ fontFamily: FONTS.body }}
                  data-testid={`card-${section.key}`}
                >
                  {form[section.key]}
                </p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2" style={{ background: '#F4F6F9' }}>
            <p className="text-xs text-gray-400 text-center" style={{ fontFamily: FONTS.body }}>
              For educational use only — always follow your facility's escalation protocol
            </p>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DrugFlashcards
// ─────────────────────────────────────────────────────────────
const CATEGORIES_LIST = [
  'All',
  'Pain / Opioids',
  'Diabetes',
  'Insulins',
  'Cardiac / BP',
  'Anticoagulants',
  'GI / Cholesterol / Anti-inflammatory',
  'Respiratory / Antibiotics / Antiemetics',
  'Mental Health / Sedatives / Epilepsy',
  'Other',
];

export const DrugFlashcards = () => {
  const [category, setCategory] = useState('All');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(new Set());

  const filtered = useMemo(() => {
    const pool = category === 'All' ? drugs : drugs.filter((d) => d.category === category);
    return [...pool].sort((a, b) => a.genericName.localeCompare(b.genericName));
  }, [category]);

  const drug = filtered[index] || null;
  const catColor = drug ? (categoryColors[drug.category] || '#6B7280') : C.primary;
  const schedColor = drug ? (scheduleColors[drug.schedule] || '#6B7280') : '#6B7280';

  // Mark as seen when flipped
  const handleFlip = useCallback(() => {
    setFlipped((f) => !f);
    if (drug) setSeen((s) => new Set([...s, drug.id]));
  }, [drug]);

  const handlePrev = () => {
    setFlipped(false);
    setIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
  };

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    setIndex(0);
    setFlipped(false);
  };

  const seenInPool = filtered.filter((d) => seen.has(d.id)).length;

  if (!drug) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400 text-sm" style={{ fontFamily: FONTS.body }}>No drugs in this category.</p>
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-4" data-testid="drug-flashcards">
      {/* Category filter */}
      <div className="space-y-1.5">
        <Label htmlFor="flashcard-category">Filter by Category</Label>
        <select
          id="flashcard-category"
          data-testid="flashcard-category-select"
          value={category}
          onChange={(e) => handleCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 focus:ring-[#00A99D] appearance-none"
          style={{ fontFamily: FONTS.body, minHeight: '44px' }}
        >
          {CATEGORIES_LIST.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
          Card <strong style={{ color: C.primary }}>{index + 1}</strong> of {filtered.length}
        </p>
        <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
          <strong style={{ color: C.safe }}>{seenInPool}</strong> / {filtered.length} seen
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((index + 1) / filtered.length) * 100}%`,
            background: `linear-gradient(90deg, ${C.accent}, ${C.primary})`,
          }}
        />
      </div>

      {/* Flashcard — CSS flip */}
      <div
        className="relative w-full cursor-pointer"
        style={{ height: '300px', perspective: '1000px' }}
        onClick={handleFlip}
        data-testid="flashcard"
        role="button"
        aria-label={flipped ? 'Show drug name (front)' : 'Show drug details (back)'}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s cubic-bezier(0.4,0.2,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 text-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: `linear-gradient(135deg, ${catColor}22 0%, ${catColor}08 100%)`,
              border: `2px solid ${catColor}40`,
            }}
            data-testid="flashcard-front"
          >
            <span
              className="w-3 h-3 rounded-full mb-4"
              style={{ background: catColor }}
              aria-hidden="true"
            />
            <h2
              className="text-3xl font-black text-[#1B3A6B] leading-tight mb-2"
              style={{ fontFamily: FONTS.heading }}
            >
              {drug.genericName}
            </h2>
            <p className="text-sm text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
              {drug.category}
            </p>
            {drug.schedule && (
              <span
                className="text-white text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: schedColor }}
              >
                {drug.schedule}
              </span>
            )}
            <p
              className="text-xs text-gray-300 mt-6"
              style={{ fontFamily: FONTS.body }}
            >
              Tap to reveal →
            </p>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 rounded-2xl p-5 overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#FFFFFF',
              border: `2px solid ${catColor}40`,
            }}
            data-testid="flashcard-back"
          >
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <h3
                className="text-base font-bold text-[#1B3A6B]"
                style={{ fontFamily: FONTS.heading }}
              >
                {drug.genericName}
              </h3>
              {drug.schedule && (
                <span
                  className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: schedColor, fontSize: '10px' }}
                >
                  {drug.schedule}
                </span>
              )}
              {drug.pbsListed && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  PBS
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5" style={{ fontFamily: FONTS.body }}>Drug Class</p>
                <p className="text-sm font-semibold" style={{ fontFamily: FONTS.body, color: catColor }}>{drug.drugClass}</p>
              </div>

              {drug.normalDose && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5" style={{ fontFamily: FONTS.body }}>Normal Dose</p>
                  <p className="text-sm text-gray-800" style={{ fontFamily: FONTS.body }}>{drug.normalDose}</p>
                </div>
              )}

              {drug.nursingConsiderations?.[0] && (
                <div
                  className="rounded-xl p-3"
                  style={{ background: `${catColor}10`, border: `1px solid ${catColor}25` }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: catColor, fontFamily: FONTS.body }}>💡 Key Consideration</p>
                  <p className="text-xs text-gray-700 leading-snug" style={{ fontFamily: FONTS.body }}>
                    {drug.nursingConsiderations[0]}
                  </p>
                </div>
              )}

              {drug.holdIf && drug.holdIf.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1" style={{ fontFamily: FONTS.body }}>Hold If</p>
                  <div className="flex flex-wrap gap-1">
                    {drug.holdIf.slice(0, 3).map((h) => (
                      <span
                        key={h}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#EF444415', color: C.critical, fontFamily: FONTS.body }}
                      >
                        {h}
                      </span>
                    ))}
                    {drug.holdIf.length > 3 && (
                      <span className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
                        +{drug.holdIf.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-300 text-center mt-4" style={{ fontFamily: FONTS.body }}>
              Tap to flip back
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
        <button
          data-testid="flashcard-prev-btn"
          onClick={handlePrev}
          className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-all active:scale-95"
          style={{
            minHeight: '48px',
            background: '#FFFFFF',
            border: `2px solid #E5E7EB`,
            color: C.primary,
            fontFamily: FONTS.heading,
          }}
        >
          ← Prev
        </button>

        <button
          data-testid="flashcard-flip-btn"
          onClick={handleFlip}
          className="flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white transition-all active:scale-95"
          style={{
            minHeight: '48px',
            background: flipped ? catColor : C.primary,
            fontFamily: FONTS.heading,
          }}
        >
          {flipped ? '↩ Front' : '↪ Flip'}
        </button>

        <button
          data-testid="flashcard-next-btn"
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-all active:scale-95"
          style={{
            minHeight: '48px',
            background: '#FFFFFF',
            border: `2px solid #E5E7EB`,
            color: C.primary,
            fontFamily: FONTS.heading,
          }}
        >
          Next →
        </button>
      </div>

      {/* Brand names hint */}
      {drug.brandNames && drug.brandNames.length > 0 && (
        <p className="text-center text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>
          Brand: {drug.brandNames.slice(0, 3).join(' · ')}
        </p>
      )}

      <div className="h-4" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MedRightsChecker — 10 Rights of Medication Administration
// ─────────────────────────────────────────────────────────────
const TEN_RIGHTS = [
  {
    id: 'patient',
    right: 'Right Patient',
    emoji: '🪪',
    color: '#3B82F6',
    description: 'Confirm at least two patient identifiers (name + DOB or UR number) against the medication chart and patient armband before administering.',
  },
  {
    id: 'drug',
    right: 'Right Drug',
    emoji: '💊',
    color: '#8B5CF6',
    description: 'Verify the medication name on the label matches the medication chart exactly — check generic and brand names, and be alert to look-alike/sound-alike drugs.',
  },
  {
    id: 'dose',
    right: 'Right Dose',
    emoji: '⚖️',
    color: '#F97316',
    description: 'Calculate and confirm the dose is correct for this patient. For high-alert medications (insulin, opioids, anticoagulants) a second nurse check is required.',
  },
  {
    id: 'route',
    right: 'Right Route',
    emoji: '🔀',
    color: '#06B6D4',
    description: 'Confirm the prescribed route (oral, IV, SC, IM, topical, etc.) is appropriate and matches what has been prepared. Never administer via an unintended route.',
  },
  {
    id: 'time',
    right: 'Right Time',
    emoji: '⏰',
    color: C.caution,
    description: 'Give the medication at the correct time and frequency as prescribed. Check if the dose is early, late, or if the last dose timing affects this administration.',
  },
  {
    id: 'documentation',
    right: 'Right Documentation',
    emoji: '📋',
    color: '#10B981',
    description: 'Sign the medication chart immediately after — not before — administration. Document any refused or withheld doses with the reason clearly recorded.',
  },
  {
    id: 'reason',
    right: 'Right Reason',
    emoji: '🎯',
    color: '#EC4899',
    description: 'Understand why this patient is receiving this medication. If the indication is unclear or the drug seems inappropriate for the patient\'s current condition, clarify before giving.',
  },
  {
    id: 'response',
    right: 'Right Response',
    emoji: '📈',
    color: '#6366F1',
    description: 'Monitor and document the patient\'s response to the medication — intended effect, absence of effect, and any adverse reactions or side effects observed.',
  },
  {
    id: 'refuse',
    right: 'Right to Refuse',
    emoji: '🤚',
    color: C.critical,
    description: 'Every patient has the right to refuse medication. Document the refusal clearly, explain consequences respectfully without coercion, and notify the treating team.',
  },
  {
    id: 'education',
    right: 'Right Education',
    emoji: '📚',
    color: '#0EA5E9',
    description: 'Ensure the patient understands what the medication is for, how to take it, common side effects to watch for, and what to report to the nurse or doctor.',
  },
];

export const MedRightsChecker = () => {
  const [checked, setChecked] = useState(new Set());

  const toggle = (id) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const reset = () => setChecked(new Set());

  const progress = (checked.size / TEN_RIGHTS.length) * 100;
  const allDone = checked.size === TEN_RIGHTS.length;

  return (
    <div className="px-4 py-4 space-y-4" data-testid="med-rights-checker">
      {/* Intro */}
      <div
        className="rounded-2xl px-4 py-3 flex gap-3 items-start"
        style={{ background: '#1B3A6B10', border: '1px solid #1B3A6B20' }}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">✅</span>
        <p className="text-xs text-[#1B3A6B] leading-relaxed" style={{ fontFamily: FONTS.body }}>
          Work through all 10 rights before administering any medication. Check each right as you verify it for this patient and this drug.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-gray-500" style={{ fontFamily: FONTS.body }}>
            Progress
          </p>
          <p
            className="text-xs font-bold"
            style={{ fontFamily: FONTS.body, color: allDone ? C.safe : C.primary }}
          >
            {checked.size} / {TEN_RIGHTS.length}
          </p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            data-testid="rights-progress-bar"
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: allDone
                ? `linear-gradient(90deg, ${C.safe}, #34d399)`
                : `linear-gradient(90deg, ${C.accent}, ${C.primary})`,
            }}
          />
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div
          data-testid="rights-complete-banner"
          className="rounded-2xl px-4 py-4 flex items-center gap-3"
          style={{ background: '#10B98120', border: `2px solid ${C.safe}` }}
        >
          <span className="text-2xl flex-shrink-0">🎉</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-700" style={{ fontFamily: FONTS.heading }}>
              All 10 rights verified
            </p>
            <p className="text-xs text-emerald-600" style={{ fontFamily: FONTS.body }}>
              Safe to proceed with administration
            </p>
          </div>
        </div>
      )}

      {/* Rights checklist */}
      <div className="space-y-2">
        {TEN_RIGHTS.map((item, i) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              data-testid={`right-checkbox-${item.id}`}
              onClick={() => toggle(item.id)}
              className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.99]"
              style={{
                minHeight: '64px',
                background: isChecked ? `${item.color}10` : '#FFFFFF',
                border: `1.5px solid ${isChecked ? item.color + '60' : '#E5E7EB'}`,
              }}
              aria-pressed={isChecked}
            >
              {/* Checkbox circle */}
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
                style={{
                  borderColor: isChecked ? item.color : '#D1D5DB',
                  background: isChecked ? item.color : 'transparent',
                }}
              >
                {isChecked && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{item.emoji}</span>
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{
                      fontFamily: FONTS.heading,
                      color: isChecked ? item.color : C.primary,
                    }}
                  >
                    {i + 1}. {item.right}
                  </p>
                </div>
                <p
                  className="text-xs leading-snug"
                  style={{
                    fontFamily: FONTS.body,
                    color: isChecked ? item.color + 'CC' : '#6B7280',
                  }}
                >
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Reset button */}
      <div className="flex justify-center pt-1 pb-4">
        <button
          data-testid="rights-reset-btn"
          onClick={reset}
          className="rounded-full px-6 py-2.5 text-sm font-bold transition-all active:scale-95"
          style={{
            minHeight: '44px',
            background: 'transparent',
            border: `2px solid ${C.primary}`,
            color: C.primary,
            fontFamily: FONTS.heading,
          }}
        >
          Reset All
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DoseRounder — Dose ↔ Volume calculator with rounding
// ─────────────────────────────────────────────────────────────
const CONC_UNITS = [
  { value: 'mg/mL',    label: 'mg/mL' },
  { value: 'mcg/mL',   label: 'mcg/mL' },
  { value: 'mmol/L',   label: 'mmol/L' },
  { value: 'units/mL', label: 'units/mL' },
];

const roundTo = (n, dp) => Math.round(n * Math.pow(10, dp)) / Math.pow(10, dp);
const roundToHalf = (n) => Math.round(n * 2) / 2;

const syringeNote = (vol) => {
  if (vol <= 0.1) return 'Use a 0.5mL or 1mL insulin syringe for accuracy at this volume.';
  if (vol < 1) return 'Use a 1mL syringe — small volumes require precise measurement.';
  if (vol <= 3) return '1mL or 3mL syringe appropriate.';
  if (vol <= 5) return '5mL syringe appropriate.';
  if (vol <= 10) return '10mL syringe appropriate.';
  return 'Consider using multiple syringes or checking if the dose is correct.';
};

export const DoseRounder = () => {
  const [mode, setMode] = useState('dose-to-vol'); // 'dose-to-vol' | 'vol-to-dose'
  const [drugName, setDrugName] = useState('');
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState('mg');
  const [concentration, setConcentration] = useState('');
  const [concUnit, setConcUnit] = useState('mg/mL');
  const [volume, setVolume] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const reset = () => {
    setDose(''); setConcentration(''); setVolume('');
    setDrugName(''); setResult(null); setErrors({});
  };

  const calculate = () => {
    const errs = {};

    if (mode === 'dose-to-vol') {
      const d = parseFloat(dose);
      const c = parseFloat(concentration);
      if (!dose || isNaN(d) || d <= 0) errs.dose = 'Enter a valid dose';
      if (!concentration || isNaN(c) || c <= 0) errs.concentration = 'Enter a valid concentration';
      setErrors(errs);
      if (Object.keys(errs).length) return;

      const rawVol = d / c;
      setResult({
        type: 'vol',
        raw: rawVol,
        oneDP: roundTo(rawVol, 1),
        halfML: roundToHalf(rawVol),
        wholeML: Math.round(rawVol),
        note: syringeNote(rawVol),
        label: `Volume to draw up`,
        unit: 'mL',
        formula: `${d} ${doseUnit} ÷ ${c} ${concUnit} = ${roundTo(rawVol, 4)} mL`,
      });
    } else {
      const v = parseFloat(volume);
      const c = parseFloat(concentration);
      if (!volume || isNaN(v) || v <= 0) errs.volume = 'Enter a valid volume';
      if (!concentration || isNaN(c) || c <= 0) errs.concentration = 'Enter a valid concentration';
      setErrors(errs);
      if (Object.keys(errs).length) return;

      const rawDose = v * c;
      setResult({
        type: 'dose',
        raw: rawDose,
        oneDP: roundTo(rawDose, 1),
        halfUnit: roundToHalf(rawDose),
        wholeUnit: Math.round(rawDose),
        label: 'Calculated dose',
        unit: concUnit.split('/')[0],
        formula: `${v} mL × ${c} ${concUnit} = ${roundTo(rawDose, 4)} ${concUnit.split('/')[0]}`,
      });
    }
  };

  const isDoseMode = mode === 'dose-to-vol';

  return (
    <div className="px-4 py-4 space-y-5" data-testid="dose-rounder">
      {/* Mode toggle */}
      <div
        className="flex rounded-2xl overflow-hidden"
        style={{ border: `2px solid ${C.primary}` }}
      >
        {[
          { id: 'dose-to-vol', label: 'Dose → Volume' },
          { id: 'vol-to-dose', label: 'Volume → Dose' },
        ].map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              data-testid={`mode-btn-${m.id}`}
              onClick={() => { setMode(m.id); reset(); }}
              className="flex-1 py-3 text-xs font-bold transition-all"
              style={{
                minHeight: '44px',
                background: active ? C.primary : 'transparent',
                color: active ? '#FFFFFF' : C.primary,
                fontFamily: FONTS.heading,
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Drug name (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="rounder-drug-name">Drug Name (optional)</Label>
        <TextInput
          id="rounder-drug-name"
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          placeholder="e.g. Gentamicin"
        />
      </div>

      {/* Dose input (dose-to-vol mode) */}
      {isDoseMode && (
        <div className="space-y-1.5">
          <Label htmlFor="rounder-dose">Prescribed Dose</Label>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <input
                id="rounder-dose"
                data-testid="rounder-dose"
                type="number"
                inputMode="decimal"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 240"
                className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                  errors.dose ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-[#F4F6F9] focus:ring-2 focus:ring-[#00A99D]'
                }`}
                style={{ fontFamily: FONTS.body, minHeight: '44px' }}
              />
              {errors.dose && (
                <p className="text-xs text-red-500" style={{ fontFamily: FONTS.body }}>{errors.dose}</p>
              )}
            </div>
            <select
              data-testid="rounder-dose-unit"
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 focus:ring-[#00A99D] appearance-none"
              style={{ fontFamily: FONTS.body, minHeight: '44px', minWidth: '90px' }}
            >
              {['mg', 'mcg', 'mmol', 'units', 'g'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Volume input (vol-to-dose mode) */}
      {!isDoseMode && (
        <div className="space-y-1.5">
          <Label htmlFor="rounder-volume">Volume Drawn Up</Label>
          <div className="space-y-1">
            <div className="relative">
              <input
                id="rounder-volume"
                data-testid="rounder-volume"
                type="number"
                inputMode="decimal"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="e.g. 2.4"
                className={`w-full px-3 py-2.5 pr-12 rounded-xl text-sm border outline-none transition-all ${
                  errors.volume ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-[#F4F6F9] focus:ring-2 focus:ring-[#00A99D]'
                }`}
                style={{ fontFamily: FONTS.body, minHeight: '44px' }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"
                style={{ fontFamily: FONTS.body }}
              >
                mL
              </span>
            </div>
            {errors.volume && (
              <p className="text-xs text-red-500" style={{ fontFamily: FONTS.body }}>{errors.volume}</p>
            )}
          </div>
        </div>
      )}

      {/* Concentration */}
      <div className="space-y-1.5">
        <Label htmlFor="rounder-concentration">Available Concentration</Label>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <input
              id="rounder-concentration"
              data-testid="rounder-concentration"
              type="number"
              inputMode="decimal"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value)}
              placeholder="e.g. 40"
              className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                errors.concentration ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-[#F4F6F9] focus:ring-2 focus:ring-[#00A99D]'
              }`}
              style={{ fontFamily: FONTS.body, minHeight: '44px' }}
            />
            {errors.concentration && (
              <p className="text-xs text-red-500" style={{ fontFamily: FONTS.body }}>{errors.concentration}</p>
            )}
          </div>
          <select
            data-testid="rounder-conc-unit"
            value={concUnit}
            onChange={(e) => setConcUnit(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 focus:ring-[#00A99D] appearance-none"
            style={{ fontFamily: FONTS.body, minHeight: '44px', minWidth: '100px' }}
          >
            {CONC_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          data-testid="rounder-reset-btn"
          onClick={reset}
          className="rounded-full px-4 py-2.5 text-sm font-bold transition-all active:scale-95"
          style={{
            minHeight: '44px',
            background: 'transparent',
            border: `2px solid ${C.primary}`,
            color: C.primary,
            fontFamily: FONTS.heading,
          }}
        >
          Clear
        </button>
        <button
          data-testid="rounder-calc-btn"
          onClick={calculate}
          className="flex-1 rounded-full py-2.5 text-sm font-bold text-white transition-all active:scale-95"
          style={{ minHeight: '44px', background: C.accent, fontFamily: FONTS.heading }}
        >
          Calculate →
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          data-testid="rounder-result"
          className="rounded-2xl overflow-hidden"
          style={{ border: `2px solid ${C.accent}40` }}
        >
          {/* Header */}
          <div
            className="px-4 py-3"
            style={{ background: `${C.accent}12`, borderBottom: `1px solid ${C.accent}30` }}
          >
            <p className="text-xs font-bold text-gray-500 mb-0.5" style={{ fontFamily: FONTS.body }}>
              {drugName ? `${drugName} — ` : ''}{result.label}
            </p>
            <p className="text-xs text-gray-400 italic" style={{ fontFamily: FONTS.body }}>
              {result.formula}
            </p>
          </div>

          {/* Rounded values */}
          <div className="bg-white px-4 py-4 space-y-3">
            {result.type === 'vol' ? (
              <>
                <RoundingRow
                  label="Exact"
                  value={roundTo(result.raw, 4)}
                  unit={result.unit}
                  note="Calculated value"
                  highlight={false}
                  testId="result-exact"
                />
                <RoundingRow
                  label="Rounded (1 d.p.)"
                  value={result.oneDP}
                  unit={result.unit}
                  note="Most accurate practical rounding"
                  highlight={result.raw >= 0.5}
                  testId="result-1dp"
                />
                <RoundingRow
                  label="Nearest 0.5 mL"
                  value={result.halfML}
                  unit={result.unit}
                  note="Useful for standard syringes"
                  highlight={false}
                  testId="result-half"
                />
                <RoundingRow
                  label="Nearest whole mL"
                  value={result.wholeML}
                  unit={result.unit}
                  note="Only if difference is clinically insignificant"
                  highlight={false}
                  testId="result-whole"
                />
                {/* Syringe recommendation */}
                <div
                  className="rounded-xl p-3 mt-1"
                  style={{ background: '#1B3A6B10', border: '1px solid #1B3A6B20' }}
                >
                  <p className="text-xs font-bold text-[#1B3A6B] mb-0.5" style={{ fontFamily: FONTS.heading }}>
                    🩺 Syringe Tip
                  </p>
                  <p className="text-xs text-gray-600" style={{ fontFamily: FONTS.body }}>
                    {result.note}
                  </p>
                </div>
              </>
            ) : (
              <>
                <RoundingRow
                  label="Exact"
                  value={roundTo(result.raw, 4)}
                  unit={result.unit}
                  note="Calculated dose"
                  highlight={false}
                  testId="result-exact"
                />
                <RoundingRow
                  label="Rounded (1 d.p.)"
                  value={result.oneDP}
                  unit={result.unit}
                  note="Most practical rounding"
                  highlight
                  testId="result-1dp"
                />
                <RoundingRow
                  label="Nearest 0.5"
                  value={result.halfUnit}
                  unit={result.unit}
                  note="Useful for tablet / unit rounding"
                  highlight={false}
                  testId="result-half"
                />
                <RoundingRow
                  label="Nearest whole"
                  value={result.wholeUnit}
                  unit={result.unit}
                  note="Only if difference is clinically insignificant"
                  highlight={false}
                  testId="result-whole"
                />
              </>
            )}
          </div>

          {/* Safety note */}
          <div
            className="px-4 py-2"
            style={{ background: '#F59E0B10', borderTop: '1px solid #F59E0B30' }}
          >
            <p className="text-xs text-amber-700 text-center" style={{ fontFamily: FONTS.body }}>
              ⚠️ Always verify calculations with a second nurse for high-alert medications
            </p>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};

const RoundingRow = ({ label, value, unit, note, highlight, testId }) => (
  <div
    data-testid={testId}
    className="flex items-center justify-between rounded-xl px-3 py-2.5"
    style={{
      background: highlight ? `${C.accent}12` : '#F9FAFB',
      border: `1px solid ${highlight ? C.accent + '40' : '#F3F4F6'}`,
    }}
  >
    <div>
      <p
        className="text-xs font-bold"
        style={{ fontFamily: FONTS.body, color: highlight ? C.accent : '#6B7280' }}
      >
        {label}
        {highlight && (
          <span
            className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full text-white"
            style={{ background: C.accent, fontSize: '9px', fontFamily: FONTS.body }}
          >
            Recommended
          </span>
        )}
      </p>
      <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>{note}</p>
    </div>
    <p
      className="text-xl font-black ml-3"
      style={{ fontFamily: FONTS.heading, color: highlight ? C.accent : C.primary }}
    >
      {value}
      <span className="text-xs font-semibold ml-0.5 text-gray-400">{unit}</span>
    </p>
  </div>
);


// ─────────────────────────────────────────────────────────────
// MedAbbreviations — searchable medical abbreviation reference
// ─────────────────────────────────────────────────────────────

const ABBR_CATEGORIES = [
  'All',
  'Timing / Frequency',
  'Routes',
  'Vital Signs / Labs',
  'Documentation',
  'Diagnosis',
  'Clinical Frameworks',
  '⚠️ Never Use',
];

const ABBR_COLORS = {
  'Timing / Frequency':    '#F97316',
  'Routes':                '#3B82F6',
  'Vital Signs / Labs':    '#10B981',
  'Documentation':         '#8B5CF6',
  'Diagnosis':             '#EC4899',
  'Clinical Frameworks':   '#00A99D',
  '⚠️ Never Use':          '#EF4444',
};

const ABBREVIATIONS = [
  // ── Timing / Frequency ───────────────────────────────────
  { abbr: 'PRN', full: 'Pro re nata', meaning: 'As needed — give only when the patient requires it, not on a schedule.', category: 'Timing / Frequency' },
  { abbr: 'STAT', full: 'Statim', meaning: 'Immediately — give right now without delay.', category: 'Timing / Frequency' },
  { abbr: 'BD / BID', full: 'Bis die', meaning: 'Twice daily — usually morning and evening, ~12 hours apart.', category: 'Timing / Frequency' },
  { abbr: 'TDS / TID', full: 'Ter die sumendum', meaning: 'Three times daily — usually every 8 hours.', category: 'Timing / Frequency' },
  { abbr: 'QID', full: 'Quater in die', meaning: 'Four times daily — every 6 hours.', category: 'Timing / Frequency' },
  { abbr: 'Mane', full: 'Mane', meaning: 'In the morning — give first thing in the morning.', category: 'Timing / Frequency' },
  { abbr: 'Nocte', full: 'Nocte', meaning: 'At night — give at bedtime.', category: 'Timing / Frequency' },
  { abbr: 'AC', full: 'Ante cibum', meaning: 'Before meals — give 30 mins before eating (e.g. PPIs for maximum effect).', category: 'Timing / Frequency' },
  { abbr: 'PC', full: 'Post cibum', meaning: 'After meals — give with or after food (e.g. NSAIDs, metformin).', category: 'Timing / Frequency' },
  { abbr: 'cc̄', full: 'Cum cibo', meaning: 'With food — to be taken with meals.', category: 'Timing / Frequency' },
  { abbr: 'Weekly', full: 'Once per week', meaning: 'Once every 7 days — do not confuse with daily. E.g. methotrexate is weekly, never daily.', category: 'Timing / Frequency' },
  { abbr: 'Fortnightly', full: 'Every 2 weeks', meaning: 'Once every 14 days.', category: 'Timing / Frequency' },
  { abbr: 'Q4H', full: 'Quaque 4 hora', meaning: 'Every 4 hours — e.g. regular paracetamol dosing.', category: 'Timing / Frequency' },
  { abbr: 'Q6H', full: 'Quaque 6 hora', meaning: 'Every 6 hours.', category: 'Timing / Frequency' },
  { abbr: 'Q8H', full: 'Quaque 8 hora', meaning: 'Every 8 hours.', category: 'Timing / Frequency' },
  { abbr: 'Q12H', full: 'Quaque 12 hora', meaning: 'Every 12 hours.', category: 'Timing / Frequency' },

  // ── Routes ────────────────────────────────────────────────
  { abbr: 'PO / po', full: 'Per os', meaning: 'By mouth / oral route — the patient swallows the medication.', category: 'Routes' },
  { abbr: 'IV', full: 'Intravenous', meaning: 'Into a vein — fastest route, immediate effect. Requires cannula or central line.', category: 'Routes' },
  { abbr: 'IM', full: 'Intramuscular', meaning: 'Into a muscle — common sites: deltoid, vastus lateralis, ventrogluteal.', category: 'Routes' },
  { abbr: 'SC / SQ', full: 'Subcutaneous', meaning: 'Under the skin — used for insulin, enoxaparin, heparin. Rotate sites.', category: 'Routes' },
  { abbr: 'SL', full: 'Sublingual', meaning: 'Under the tongue — rapid absorption directly into bloodstream. E.g. GTN (Anginine).', category: 'Routes' },
  { abbr: 'PR', full: 'Per rectum', meaning: 'Via the rectum — suppository or enema. E.g. diclofenac suppository, lactulose enema.', category: 'Routes' },
  { abbr: 'TOP / topical', full: 'Topical', meaning: 'Applied to the skin surface — creams, patches, gels. E.g. fentanyl patch, Voltaren gel.', category: 'Routes' },
  { abbr: 'INH', full: 'Inhalation', meaning: 'Via the lungs — MDI, nebuliser, dry powder inhaler. E.g. Ventolin, Spiriva.', category: 'Routes' },
  { abbr: 'NGT / NG', full: 'Nasogastric tube', meaning: 'Medication given via a tube passed through the nose into the stomach. Check placement before use.', category: 'Routes' },
  { abbr: 'PEG', full: 'Percutaneous endoscopic gastrostomy', meaning: 'Medication via a tube directly into the stomach through the abdominal wall.', category: 'Routes' },
  { abbr: 'ID', full: 'Intradermal', meaning: 'Into the skin layer — used for allergy testing and BCG vaccination.', category: 'Routes' },
  { abbr: 'IO', full: 'Intraosseous', meaning: 'Into the bone marrow — emergency route when IV access is impossible.', category: 'Routes' },

  // ── Vital Signs / Labs ────────────────────────────────────
  { abbr: 'BP', full: 'Blood Pressure', meaning: 'Systolic/diastolic pressure in mmHg. Normal adult: 90–139 / 60–89 mmHg.', category: 'Vital Signs / Labs' },
  { abbr: 'HR', full: 'Heart Rate', meaning: 'Beats per minute. Normal adult: 60–100 bpm.', category: 'Vital Signs / Labs' },
  { abbr: 'RR', full: 'Respiratory Rate', meaning: 'Breaths per minute. Normal adult: 12–20 breaths/min. RR < 10 is a red flag with opioids.', category: 'Vital Signs / Labs' },
  { abbr: 'SpO₂', full: 'Peripheral oxygen saturation', meaning: 'Oxygen saturation measured by pulse oximetry. Normal: ≥95% (88–92% target in COPD).', category: 'Vital Signs / Labs' },
  { abbr: 'Temp / T°', full: 'Temperature', meaning: 'Normal: 36.1–37.2°C. Fever ≥38.0°C. Hypothermia <36.0°C.', category: 'Vital Signs / Labs' },
  { abbr: 'GCS', full: 'Glasgow Coma Scale', meaning: 'Neurological assessment: Eyes (1–4) + Verbal (1–5) + Motor (1–6) = 3–15. ≤8 = severe, consider intubation.', category: 'Vital Signs / Labs' },
  { abbr: 'BGL', full: 'Blood Glucose Level', meaning: 'Blood sugar in mmol/L. Normal fasting: 4.0–6.0 mmol/L. Hypoglycaemia: <4.0 mmol/L.', category: 'Vital Signs / Labs' },
  { abbr: 'HbA1c', full: 'Glycated haemoglobin', meaning: 'Reflects average BGL over past 2–3 months. Target for diabetes: <7% (53 mmol/mol).', category: 'Vital Signs / Labs' },
  { abbr: 'INR', full: 'International Normalised Ratio', meaning: 'Measures clotting time for warfarin monitoring. Therapeutic range: 2.0–3.0 for most indications.', category: 'Vital Signs / Labs' },
  { abbr: 'eGFR', full: 'Estimated Glomerular Filtration Rate', meaning: 'Kidney function in mL/min/1.73m². <30 = severely reduced — many drugs require dose adjustment or are contraindicated.', category: 'Vital Signs / Labs' },
  { abbr: 'Cr / Creat', full: 'Creatinine', meaning: 'Kidney function marker. Elevated = impaired renal clearance. Used in Cockcroft-Gault formula.', category: 'Vital Signs / Labs' },
  { abbr: 'K+', full: 'Potassium', meaning: 'Electrolyte. Normal: 3.5–5.0 mmol/L. Critical for cardiac rhythm — both hypo and hyperkalaemia are dangerous.', category: 'Vital Signs / Labs' },
  { abbr: 'Na+', full: 'Sodium', meaning: 'Electrolyte. Normal: 135–145 mmol/L. Hyponatraemia common with SSRIs in elderly.', category: 'Vital Signs / Labs' },
  { abbr: 'Mg²+', full: 'Magnesium', meaning: 'Electrolyte. Normal: 0.7–1.0 mmol/L. Hypomagnesaemia increases digoxin toxicity risk and causes arrhythmias.', category: 'Vital Signs / Labs' },
  { abbr: 'LFTs', full: 'Liver Function Tests', meaning: 'ALT, AST, ALP, bilirubin, albumin. Monitor with hepatotoxic drugs (statins, methotrexate, paracetamol overdose).', category: 'Vital Signs / Labs' },
  { abbr: 'U&E / EUC', full: 'Urea & Electrolytes / Electrolytes Urea Creatinine', meaning: 'Standard renal and electrolyte panel — sodium, potassium, creatinine, urea. Checked with diuretics, ACEi, ARBs.', category: 'Vital Signs / Labs' },
  { abbr: 'FBC', full: 'Full Blood Count', meaning: 'Haemoglobin, WBC, platelets, haematocrit. Monitor with anticoagulants, antibiotics, chemotherapy.', category: 'Vital Signs / Labs' },
  { abbr: 'CRP', full: 'C-Reactive Protein', meaning: 'Inflammatory marker — elevated in infection and inflammation. Used to monitor antibiotic response.', category: 'Vital Signs / Labs' },
  { abbr: 'WBC / WCC', full: 'White Blood Cell / White Cell Count', meaning: 'Infection and immune marker. Elevated = infection; low = immunosuppression risk.', category: 'Vital Signs / Labs' },
  { abbr: 'ABG', full: 'Arterial Blood Gas', meaning: 'Measures pH, PaO₂, PaCO₂, HCO₃ — assesses respiratory and metabolic status.', category: 'Vital Signs / Labs' },
  { abbr: 'ECG / EKG', full: 'Electrocardiogram', meaning: 'Records electrical activity of the heart. Used to assess QTc, arrhythmias, ischaemia.', category: 'Vital Signs / Labs' },
  { abbr: 'QTc', full: 'Corrected QT interval', meaning: 'ECG measurement. Prolonged QTc (>450ms men, >470ms women) = risk of Torsades de Pointes. Many drugs prolong QTc.', category: 'Vital Signs / Labs' },
  { abbr: 'I&O / I+O', full: 'Intake and Output', meaning: 'Fluid balance monitoring — all fluids in (IV, oral, NG) and all fluids out (urine, drain, vomit).', category: 'Vital Signs / Labs' },
  { abbr: 'Wt', full: 'Weight', meaning: 'Daily weight is essential for fluid balance monitoring, diuretic assessment, and weight-based drug dosing.', category: 'Vital Signs / Labs' },

  // ── Documentation ─────────────────────────────────────────
  { abbr: 'c̄', full: 'Cum (with)', meaning: 'With — e.g. "c̄ food" means take with food.', category: 'Documentation' },
  { abbr: 's̄', full: 'Sine (without)', meaning: 'Without — e.g. "s̄ food" means take on an empty stomach.', category: 'Documentation' },
  { abbr: 'Hx', full: 'History', meaning: 'Medical or nursing history — e.g. "past Hx of CCF".', category: 'Documentation' },
  { abbr: 'Dx', full: 'Diagnosis', meaning: 'The confirmed medical diagnosis.', category: 'Documentation' },
  { abbr: 'Rx', full: 'Prescription / Treatment', meaning: 'Prescription or treatment plan. Not the same as Dx (diagnosis).', category: 'Documentation' },
  { abbr: 'Tx', full: 'Treatment', meaning: 'Treatment being given. Often used interchangeably with Rx.', category: 'Documentation' },
  { abbr: 'Sx', full: 'Symptoms', meaning: 'Subjective symptoms reported by the patient.', category: 'Documentation' },
  { abbr: 'Fx', full: 'Fracture', meaning: 'Broken bone — e.g. "# NOF" means fractured neck of femur.', category: 'Documentation' },
  { abbr: '#', full: 'Fracture', meaning: 'Hash symbol used in notes to mean fracture — e.g. "# R wrist".', category: 'Documentation' },
  { abbr: 'WNL', full: 'Within Normal Limits', meaning: 'Observations or results are within the expected normal range.', category: 'Documentation' },
  { abbr: 'NAD', full: 'No Abnormality Detected', meaning: 'Assessment found nothing abnormal. Used in clinical notes.', category: 'Documentation' },
  { abbr: 'O/E', full: 'On Examination', meaning: 'Findings observed during physical examination.', category: 'Documentation' },
  { abbr: 'C/O', full: 'Complaining of / Complaint of', meaning: 'What the patient is presenting with — their chief complaint.', category: 'Documentation' },
  { abbr: 'SOB / SOBOE', full: 'Shortness of Breath / on Exertion', meaning: 'Patient reports difficulty breathing, either at rest or only with activity.', category: 'Documentation' },
  { abbr: 'LOC', full: 'Loss of Consciousness / Level of Consciousness', meaning: 'Either a fainting episode, or the current level of alertness/awareness.', category: 'Documentation' },
  { abbr: 'PMHx', full: 'Past Medical History', meaning: 'All previous medical conditions, surgeries, and hospitalisations.', category: 'Documentation' },
  { abbr: 'NKDA', full: 'No Known Drug Allergies', meaning: 'Patient has no recorded drug allergies — always confirm verbally.', category: 'Documentation' },
  { abbr: 'NKA', full: 'No Known Allergies', meaning: 'Patient has no known allergies to any substance.', category: 'Documentation' },
  { abbr: 'AMS', full: 'Altered Mental Status', meaning: 'Change from the patient\'s baseline level of consciousness or cognition.', category: 'Documentation' },
  { abbr: 'IDC', full: 'Indwelling Catheter', meaning: 'Urinary catheter inserted into the bladder — monitor urine output and signs of infection.', category: 'Documentation' },
  { abbr: 'ICC', full: 'Intercostal Catheter', meaning: 'Chest tube inserted between ribs to drain fluid or air from the pleural space.', category: 'Documentation' },
  { abbr: 'IVC', full: 'Intravenous Cannula', meaning: 'IV access device inserted into a peripheral vein — check site for patency and phlebitis.', category: 'Documentation' },
  { abbr: 'CVC', full: 'Central Venous Catheter', meaning: 'IV line placed into a large central vein (subclavian, internal jugular, femoral).', category: 'Documentation' },
  { abbr: 'NBM / NPO', full: 'Nil by Mouth / Nothing per os', meaning: 'Patient must not eat or drink — for surgery, procedure, or aspiration risk.', category: 'Documentation' },
  { abbr: 'TPN', full: 'Total Parenteral Nutrition', meaning: 'IV nutrition given when oral/enteral feeding is not possible.', category: 'Documentation' },
  { abbr: 'MRN / UR', full: 'Medical Record Number / Unit Record', meaning: 'Unique patient identifier — always use two identifiers (MRN + name + DOB) before giving medications.', category: 'Documentation' },
  { abbr: 'EWS', full: 'Early Warning Score', meaning: 'Aggregate score from observations that triggers escalation — e.g. NEWS2 in Australia.', category: 'Documentation' },
  { abbr: 'MET', full: 'Medical Emergency Team', meaning: 'Rapid response team called when a patient deteriorates — triggered by MET criteria or NEWS2 score.', category: 'Documentation' },
  { abbr: 'RRT', full: 'Rapid Response Team', meaning: 'Similar to MET — a team called to the bedside for urgent clinical deterioration.', category: 'Documentation' },
  { abbr: 'OT', full: 'Occupational Therapist', meaning: 'Allied health professional assessing functional ability and independence.', category: 'Documentation' },
  { abbr: 'PT / Physio', full: 'Physiotherapist', meaning: 'Allied health professional managing mobility, respiratory function, and rehabilitation.', category: 'Documentation' },
  { abbr: 'SW', full: 'Social Worker', meaning: 'Allied health professional managing discharge planning, psychosocial needs, and community support.', category: 'Documentation' },

  // ── Diagnosis ─────────────────────────────────────────────
  { abbr: 'HTN', full: 'Hypertension', meaning: 'High blood pressure — BP ≥140/90 mmHg consistently.', category: 'Diagnosis' },
  { abbr: 'CCF / HF', full: 'Congestive Cardiac Failure / Heart Failure', meaning: 'The heart cannot pump effectively — causes fluid overload, SOB, oedema.', category: 'Diagnosis' },
  { abbr: 'MI', full: 'Myocardial Infarction', meaning: 'Heart attack — blockage of a coronary artery causing cardiac muscle death.', category: 'Diagnosis' },
  { abbr: 'STEMI', full: 'ST-Elevation Myocardial Infarction', meaning: 'Complete coronary artery occlusion — emergency reperfusion (PCI or thrombolysis) required.', category: 'Diagnosis' },
  { abbr: 'AF / AFib', full: 'Atrial Fibrillation', meaning: 'Irregular, often rapid heart rhythm — increases stroke risk. Managed with rate control and anticoagulation.', category: 'Diagnosis' },
  { abbr: 'CVA / Stroke', full: 'Cerebrovascular Accident', meaning: 'Brain tissue damage from ischaemia (ischaemic stroke) or haemorrhage (haemorrhagic stroke).', category: 'Diagnosis' },
  { abbr: 'TIA', full: 'Transient Ischaemic Attack', meaning: '"Mini-stroke" — temporary neurological symptoms resolving within 24h. Warning sign for stroke.', category: 'Diagnosis' },
  { abbr: 'COPD', full: 'Chronic Obstructive Pulmonary Disease', meaning: 'Chronic progressive airflow limitation — includes emphysema and chronic bronchitis. SpO₂ target 88–92%.', category: 'Diagnosis' },
  { abbr: 'PE', full: 'Pulmonary Embolism', meaning: 'Blood clot in the pulmonary vasculature — presents with SOB, pleuritic chest pain, haemoptysis.', category: 'Diagnosis' },
  { abbr: 'DVT', full: 'Deep Vein Thrombosis', meaning: 'Blood clot in a deep vein — usually leg. Risk of embolising to become PE.', category: 'Diagnosis' },
  { abbr: 'UTI', full: 'Urinary Tract Infection', meaning: 'Bacterial infection of the urinary system — dysuria, frequency, haematuria. Common in catheterised patients.', category: 'Diagnosis' },
  { abbr: 'URTI', full: 'Upper Respiratory Tract Infection', meaning: 'Infection of the nose, throat, or sinuses — usually viral. Most do not need antibiotics.', category: 'Diagnosis' },
  { abbr: 'DKA', full: 'Diabetic Ketoacidosis', meaning: 'Life-threatening complication of diabetes — hyperglycaemia, ketosis, metabolic acidosis. Medical emergency.', category: 'Diagnosis' },
  { abbr: 'T1DM / T2DM', full: 'Type 1 / Type 2 Diabetes Mellitus', meaning: 'T1DM = autoimmune insulin deficiency. T2DM = insulin resistance/insufficiency, often lifestyle-related.', category: 'Diagnosis' },
  { abbr: 'CKD', full: 'Chronic Kidney Disease', meaning: 'Progressive loss of kidney function — affects drug dosing and clearance. Staged G1–G5 by eGFR.', category: 'Diagnosis' },
  { abbr: 'AKI', full: 'Acute Kidney Injury', meaning: 'Sudden decline in renal function — causes: dehydration, sepsis, nephrotoxic drugs. Monitor creatinine and urine output.', category: 'Diagnosis' },
  { abbr: 'GORD', full: 'Gastro-oesophageal Reflux Disease', meaning: 'Chronic acid reflux — treated with PPIs or H2 blockers. Australian spelling (GERD in USA).', category: 'Diagnosis' },
  { abbr: 'NOF #', full: 'Neck of Femur Fracture', meaning: 'Hip fracture — very common in elderly after falls. High mortality. Usually requires surgical repair.', category: 'Diagnosis' },
  { abbr: 'OA', full: 'Osteoarthritis', meaning: 'Degenerative joint disease — managed with paracetamol, NSAIDs, physio, and joint replacement.', category: 'Diagnosis' },
  { abbr: 'RA', full: 'Rheumatoid Arthritis', meaning: 'Autoimmune inflammatory joint disease — managed with DMARDs (methotrexate), biologics, corticosteroids.', category: 'Diagnosis' },
  { abbr: 'Sz / EP', full: 'Seizure / Epilepsy', meaning: 'Abnormal electrical activity in the brain — managed with anticonvulsants. Never stop AEDs abruptly.', category: 'Diagnosis' },
  { abbr: 'PUD', full: 'Peptic Ulcer Disease', meaning: 'Ulceration of gastric or duodenal mucosa — H. pylori or NSAID-related. Treated with PPIs and H. pylori eradication.', category: 'Diagnosis' },

  // ── Clinical Frameworks ───────────────────────────────────
  { abbr: 'ISBAR', full: 'Identify · Situation · Background · Assessment · Recommendation', meaning: 'Standard Australian clinical handover framework — use for all escalation calls and patient handovers.', category: 'Clinical Frameworks' },
  { abbr: 'NEWS2', full: 'National Early Warning Score 2', meaning: 'RCP scoring tool: RR + SpO₂ + O₂ + BP + HR + Temp + Consciousness. Score ≥5 = urgent review; ≥7 = emergency.', category: 'Clinical Frameworks' },
  { abbr: 'AVPU', full: 'Alert · Voice · Pain · Unresponsive', meaning: 'Simple consciousness assessment. Any response other than A = NEWS2 consciousness score of 3.', category: 'Clinical Frameworks' },
  { abbr: 'ACVPU', full: 'Alert · Confused · Voice · Pain · Unresponsive', meaning: 'NEWS2 version of AVPU — "C" for new confusion adds score of 3 even if alert.', category: 'Clinical Frameworks' },
  { abbr: 'DRSABCD', full: 'Danger · Response · Send · Airway · Breathing · CPR · Defibrillation', meaning: 'Australian basic life support algorithm — used in cardiac arrest response.', category: 'Clinical Frameworks' },
  { abbr: 'FAST', full: 'Face · Arms · Speech · Time', meaning: 'Stroke recognition tool — asymmetric face droop, arm drift, slurred speech = call ambulance immediately.', category: 'Clinical Frameworks' },
  { abbr: 'SAMPLE', full: 'Symptoms · Allergies · Medications · Past history · Last meal · Events', meaning: 'Rapid focused history framework used in emergency assessment.', category: 'Clinical Frameworks' },
  { abbr: 'OPQRST', full: 'Onset · Provocation · Quality · Radiation · Severity · Timing', meaning: 'Pain assessment framework — used to systematically assess any symptom.', category: 'Clinical Frameworks' },
  { abbr: 'GTPAL', full: 'Gravida · Term · Preterm · Abortions · Living children', meaning: 'Obstetric history shorthand — describes a woman\'s pregnancy outcomes.', category: 'Clinical Frameworks' },
  { abbr: 'APGAR', full: 'Appearance · Pulse · Grimace · Activity · Respiration', meaning: 'Newborn assessment at 1 and 5 minutes. Score 7–10 = normal; <7 = requires intervention.', category: 'Clinical Frameworks' },
  { abbr: 'VEAL CHOP', full: 'Variable/Early/Accelerations/Late — Cord/Head/OK/Placenta', meaning: 'Fetal heart rate pattern mnemonic: Variable decels = Cord compression; Early = Head compression; Accelerations = OK; Late = Placental insufficiency.', category: 'Clinical Frameworks' },
  { abbr: 'CIWA-Ar', full: 'Clinical Institute Withdrawal Assessment for Alcohol', meaning: 'Scoring tool for alcohol withdrawal severity — guides benzodiazepine dosing in alcohol withdrawal.', category: 'Clinical Frameworks' },
  { abbr: 'VTE', full: 'Venous Thromboembolism', meaning: 'Collective term for DVT and PE. All hospitalised patients should be assessed for VTE prophylaxis.', category: 'Clinical Frameworks' },

  // ── Never Use ─────────────────────────────────────────────
  { abbr: 'U (for Units)', full: '⛔ BANNED — Write "units" in full', meaning: 'U looks like 0 — "10U insulin" can be read as "100 insulin". Always write "units" in full. This error has caused deaths.', category: '⚠️ Never Use' },
  { abbr: 'IU (for Int. Units)', full: '⛔ BANNED — Write "international units"', meaning: 'IU looks like IV — can lead to intravenous administration errors. Write "international units" in full.', category: '⚠️ Never Use' },
  { abbr: 'QD (for daily)', full: '⛔ BANNED — Write "daily"', meaning: 'QD looks like QID (four times daily) — a lethal dosing error waiting to happen. Always write "daily".', category: '⚠️ Never Use' },
  { abbr: 'MS (for morphine)', full: '⛔ BANNED — Write the full drug name', meaning: 'MS means both morphine sulphate AND magnesium sulphate — completely different drugs. Always write the full generic name.', category: '⚠️ Never Use' },
  { abbr: 'Trailing zero (1.0mg)', full: '⛔ NEVER use — Write "1mg"', meaning: '"1.0mg" looks like "10mg" if the decimal point is missed. Never write a zero after a decimal point in medication orders.', category: '⚠️ Never Use' },
  { abbr: 'Naked decimal (.5mg)', full: '⛔ NEVER use — Write "0.5mg"', meaning: '".5mg" can be misread as "5mg" if the leading dot is missed. Always write a zero before a decimal point.', category: '⚠️ Never Use' },
  { abbr: 'OD (for once daily)', full: '⚠️ AVOID — Write "daily" or "mane"', meaning: 'OD is easily confused with "overdose" or "right eye" (oculus dexter). Use "daily" or "mane" instead.', category: '⚠️ Never Use' },
  { abbr: 'cc (for mL)', full: '⚠️ AVOID — Write "mL"', meaning: 'cc (cubic centimetre) = mL but the abbreviation cc is outdated. Always use "mL" for volume in clinical documentation.', category: '⚠️ Never Use' },
  { abbr: 'Drug name abbreviations', full: '⛔ BANNED — Write the full drug name', meaning: 'Abbreviating drug names (e.g. "MTX" for methotrexate, "5-FU" for fluorouracil) causes dangerous medication errors. Always write the full generic name.', category: '⚠️ Never Use' },
];

export const MedAbbreviations = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ABBREVIATIONS.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      if (!q) return matchesCategory;
      return (
        matchesCategory &&
        (item.abbr.toLowerCase().includes(q) ||
          item.full.toLowerCase().includes(q) ||
          item.meaning.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const neverUseCount = filtered.filter(a => a.category === '⚠️ Never Use').length;

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]">
      {/* Search + filter header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            data-testid="abbr-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search abbreviation or meaning…"
            className="w-full pl-9 pr-10 py-2.5 bg-[#F4F6F9] rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#00A99D] transition-shadow"
            style={{ fontFamily: FONTS.body, minHeight: '44px' }}
            aria-label="Search abbreviations"
          />
          {query && (
            <button
              data-testid="abbr-clear-btn"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {ABBR_CATEGORIES.map((cat) => {
            const active = category === cat;
            const color = ABBR_COLORS[cat] || C.primary;
            return (
              <button
                key={cat}
                data-testid={`abbr-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setCategory(cat)}
                className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                style={{
                  minHeight: '32px',
                  background: active ? color : `${color}15`,
                  color: active ? '#FFFFFF' : color,
                  fontFamily: FONTS.body,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }} aria-live="polite">
          {filtered.length} abbreviation{filtered.length !== 1 ? 's' : ''}
          {query && ` for "${query}"`}
        </p>
      </div>

      {/* Abbreviation list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" data-testid="abbr-list">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🔤</span>
            <p className="text-sm font-bold text-gray-400" style={{ fontFamily: FONTS.heading }}>
              No abbreviations found
            </p>
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: FONTS.body }}>
              Try a different search term
            </p>
          </div>
        )}

        {filtered.map((item) => {
          const isOpen = expanded === item.abbr + item.category;
          const color = ABBR_COLORS[item.category] || C.primary;
          const isDanger = item.category === '⚠️ Never Use';

          return (
            <button
              key={item.abbr + item.category}
              data-testid={`abbr-card-${item.abbr.replace(/[^a-zA-Z0-9]/g, '-')}`}
              onClick={() => setExpanded(isOpen ? null : item.abbr + item.category)}
              className="w-full bg-white rounded-2xl overflow-hidden text-left transition-all active:scale-[0.99]"
              style={{
                border: `1.5px solid ${isOpen ? color : isDanger ? '#EF444430' : '#E5E7EB'}`,
                background: isDanger && !isOpen ? '#FFF5F5' : '#FFFFFF',
              }}
              aria-expanded={isOpen}
            >
              {/* Card row */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ minHeight: '52px' }}>
                {/* Abbreviation badge */}
                <span
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-black"
                  style={{
                    background: `${color}15`,
                    color,
                    fontFamily: FONTS.heading,
                    minWidth: '52px',
                    textAlign: 'center',
                  }}
                >
                  {item.abbr.length > 8 ? item.abbr.slice(0, 8) + '…' : item.abbr}
                </span>

                {/* Full name */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight truncate"
                    style={{ fontFamily: FONTS.body, color: isDanger ? '#EF4444' : C.primary }}
                  >
                    {item.full}
                  </p>
                  <p
                    className="text-xs text-gray-400 mt-0.5"
                    style={{ fontFamily: FONTS.body }}
                  >
                    {item.category}
                  </p>
                </div>

                <svg
                  className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                  style={{ color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded meaning */}
              {isOpen && (
                <div
                  className="px-4 pb-4 pt-2 border-t"
                  style={{ borderColor: `${color}20` }}
                >
                  {/* Full abbreviation (if truncated) */}
                  {item.abbr.length > 8 && (
                    <p className="text-xs font-bold mb-2" style={{ color, fontFamily: FONTS.heading }}>
                      {item.abbr}
                    </p>
                  )}
                  <p
                    className="text-sm text-gray-800 leading-relaxed"
                    style={{ fontFamily: FONTS.body }}
                  >
                    {item.meaning}
                  </p>
                  {isDanger && (
                    <div
                      className="mt-2 rounded-xl px-3 py-2 flex items-start gap-2"
                      style={{ background: '#EF444415', border: '1px solid #EF444430' }}
                    >
                      <span className="text-sm flex-shrink-0">⛔</span>
                      <p className="text-xs font-bold text-red-700" style={{ fontFamily: FONTS.body }}>
                        This abbreviation must NOT be used in clinical documentation — it has been associated with serious medication errors.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}

        <div className="h-4" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ToolsPage — default export (6 tabs)
// ─────────────────────────────────────────────────────────────
const TOOL_TABS = [
  { id: 'isbar',      label: 'ISBAR',      emoji: '📞' },
  { id: 'flashcards', label: 'Flashcards', emoji: '🃏' },
  { id: 'rights',     label: 'Rights',     emoji: '✅' },
  { id: 'rounding',   label: 'Rounding',   emoji: '💉' },
  { id: 'pharm',      label: 'Pharm',      emoji: '🔬' },
  { id: 'abbrev',     label: 'ABCs',       emoji: '🔤' },
];

const ToolsPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('isbar');

  return (
    <div
      className="flex flex-col h-full bg-[#F4F6F9]"
      style={{ maxWidth: '448px', margin: '0 auto' }}
    >
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-0 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🛠️</span>
          <h1
            className="text-xl font-bold text-[#1B3A6B]"
            style={{ fontFamily: FONTS.heading }}
          >
            Tools
          </h1>
        </div>

        {/* 6-tab switcher — horizontally scrollable */}
        <div
          className="flex overflow-x-auto"
          role="tablist"
          aria-label="Tools tabs"
          style={{ scrollbarWidth: 'none' }}
        >
          {TOOL_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`tools-tab-${tab.id}`}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center justify-center gap-1 py-3 text-xs font-bold transition-colors whitespace-nowrap"
                style={{
                  fontFamily: FONTS.heading,
                  color: active ? C.primary : '#9CA3AF',
                  borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
                  minHeight: '48px',
                  minWidth: '66px',
                  paddingLeft: '8px',
                  paddingRight: '8px',
                }}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-hidden flex flex-col"
        role="tabpanel"
        data-testid={`tools-panel-${activeTab}`}
      >
        {activeTab === 'isbar'      && <ISBARBuilder />}
        {activeTab === 'flashcards' && <DrugFlashcards />}
        {activeTab === 'rights'     && <MedRightsChecker />}
        {activeTab === 'rounding'   && <DoseRounder />}
        {activeTab === 'pharm'      && <PharmPage onNavigate={onNavigate} />}
        {activeTab === 'abbrev'     && <MedAbbreviations />}
      </div>
    </div>
  );
};

export default ToolsPage;
