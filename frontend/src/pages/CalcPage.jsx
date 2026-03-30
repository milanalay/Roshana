import { useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// Design tokens (matches NurseReady design system)
// ─────────────────────────────────────────────────────────────
const FONTS = {
  heading: 'Manrope, sans-serif',
  body: 'IBM Plex Sans, sans-serif',
};
const C = {
  primary: '#1B3A6B',
  accent: '#00A99D',
  safe: '#10B981',
  caution: '#F59E0B',
  critical: '#EF4444',
  info: '#3B82F6',
  surface: '#F4F6F9',
  card: '#FFFFFF',
};

// ─────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────

/** Section card wrapper */
export const CalcCard = ({ id, emoji, title, color = C.accent, children }) => (
  <div
    id={id}
    data-testid={`calc-card-${id}`}
    className="bg-white rounded-2xl overflow-hidden shadow-sm"
    style={{ border: `1px solid ${color}22` }}
  >
    {/* Card header */}
    <div
      className="px-4 py-3 flex items-center gap-3"
      style={{ background: `${color}12`, borderBottom: `1px solid ${color}22` }}
    >
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <h2
        className="text-base font-bold"
        style={{ fontFamily: FONTS.heading, color: C.primary }}
      >
        {title}
      </h2>
    </div>
    <div className="px-4 py-4">{children}</div>
  </div>
);

/** Labelled input field */
export const Field = ({ label, id, unit, error, ...props }) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={id}
      className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
      style={{ fontFamily: FONTS.body }}
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        data-testid={id}
        className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all ${
          error
            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
            : 'border-gray-200 bg-[#F4F6F9] focus:ring-2 focus:ring-[#00A99D] focus:border-[#00A99D]'
        }`}
        style={{ fontFamily: FONTS.body, minHeight: '44px' }}
        {...props}
      />
      {unit && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none"
          style={{ fontFamily: FONTS.body }}
        >
          {unit}
        </span>
      )}
    </div>
    {error && (
      <p className="text-xs text-red-500" style={{ fontFamily: FONTS.body }} role="alert">
        {error}
      </p>
    )}
  </div>
);

/** Labelled select dropdown */
export const SelectField = ({ label, id, options, value, onChange, error }) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={id}
      className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
      style={{ fontFamily: FONTS.body }}
    >
      {label}
    </label>
    <select
      id={id}
      data-testid={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all appearance-none bg-[#F4F6F9] ${
        error ? 'border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-[#00A99D]'
      }`}
      style={{ fontFamily: FONTS.body, minHeight: '44px' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="text-xs text-red-500" role="alert" style={{ fontFamily: FONTS.body }}>
        {error}
      </p>
    )}
  </div>
);

/** Calculate button */
export const CalcButton = ({ onClick, children = 'Calculate', color = C.accent }) => (
  <button
    onClick={onClick}
    data-testid="calc-btn"
    className="w-full rounded-full py-3 text-sm font-bold text-white transition-opacity active:opacity-80 mt-3"
    style={{ backgroundColor: color, fontFamily: FONTS.heading, minHeight: '48px' }}
  >
    {children}
  </button>
);

/** Result display box */
export const ResultBox = ({
  label,
  value,
  unit,
  badge,
  badgeColor = C.safe,
  formula,
  color = C.accent,
  testId = 'result-box',
}) =>
  value !== null && value !== undefined ? (
    <div
      data-testid={testId}
      className="mt-4 rounded-xl p-4"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <p className="text-xs font-semibold text-gray-500 mb-1" style={{ fontFamily: FONTS.body }}>
        {label}
      </p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className="text-3xl font-bold"
          style={{ fontFamily: FONTS.heading, color }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500" style={{ fontFamily: FONTS.body }}>
            {unit}
          </span>
        )}
        {badge && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white ml-1"
            style={{ backgroundColor: badgeColor, fontFamily: FONTS.body }}
          >
            {badge}
          </span>
        )}
      </div>
      {formula && (
        <p
          className="text-xs text-gray-400 mt-2 italic"
          style={{ fontFamily: FONTS.body }}
        >
          {formula}
        </p>
      )}
    </div>
  ) : null;

/** Reset button */
const ResetBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    data-testid="reset-btn"
    className="text-xs text-gray-400 hover:text-gray-600 underline mt-2"
    style={{ fontFamily: FONTS.body }}
  >
    Reset
  </button>
);

// ─────────────────────────────────────────────────────────────
// 1. BMI Calculator
// ─────────────────────────────────────────────────────────────
export const BmiCalc = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const bmiCategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: C.info };
    if (bmi < 25) return { label: 'Normal weight', color: C.safe };
    if (bmi < 30) return { label: 'Overweight', color: C.caution };
    return { label: 'Obese', color: C.critical };
  };

  const calculate = () => {
    const errs = {};
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!weight || isNaN(w) || w <= 0 || w > 500) errs.weight = 'Enter a valid weight (kg)';
    if (!height || isNaN(h) || h <= 0 || h > 300) errs.height = 'Enter a valid height (cm)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const bmi = w / Math.pow(h / 100, 2);
    const cat = bmiCategory(bmi);
    setResult({ bmi: bmi.toFixed(1), ...cat });
  };

  return (
    <CalcCard id="bmi" emoji="⚖️" title="BMI" color="#3B82F6">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Weight"
          id="bmi-weight"
          unit="kg"
          type="number"
          inputMode="decimal"
          placeholder="70"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          error={errors.weight}
        />
        <Field
          label="Height"
          id="bmi-height"
          unit="cm"
          type="number"
          inputMode="decimal"
          placeholder="170"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          error={errors.height}
        />
      </div>
      <CalcButton onClick={calculate} color="#3B82F6" />
      {result && (
        <ResultBox
          label="BMI"
          value={result.bmi}
          unit="kg/m²"
          badge={result.label}
          badgeColor={result.color}
          formula="BMI = weight(kg) ÷ height(m)²"
          color="#3B82F6"
          testId="bmi-result"
        />
      )}
      {result && <ResetBtn onClick={() => { setResult(null); setWeight(''); setHeight(''); setErrors({}); }} />}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. Weight-based Drug Dose
// ─────────────────────────────────────────────────────────────
export const DrugDoseCalc = () => {
  const [dosePerKg, setDosePerKg] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculate = () => {
    const errs = {};
    const d = parseFloat(dosePerKg);
    const w = parseFloat(weight);
    if (!dosePerKg || isNaN(d) || d <= 0) errs.dose = 'Enter a valid dose (mg/kg)';
    if (!weight || isNaN(w) || w <= 0 || w > 500) errs.weight = 'Enter a valid weight (kg)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const total = d * w;
    setResult(total % 1 === 0 ? total.toString() : total.toFixed(2));
  };

  return (
    <CalcCard id="drug-dose" emoji="💉" title="Weight-based Drug Dose" color={C.accent}>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Dose"
          id="dose-mgkg"
          unit="mg/kg"
          type="number"
          inputMode="decimal"
          placeholder="0.1"
          value={dosePerKg}
          onChange={(e) => setDosePerKg(e.target.value)}
          error={errors.dose}
        />
        <Field
          label="Patient Weight"
          id="dose-weight"
          unit="kg"
          type="number"
          inputMode="decimal"
          placeholder="70"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          error={errors.weight}
        />
      </div>
      <CalcButton onClick={calculate} color={C.accent} />
      {result !== null && (
        <ResultBox
          label="Total Dose"
          value={result}
          unit="mg"
          formula={`Total dose = ${dosePerKg} mg/kg × ${weight} kg`}
          color={C.accent}
          testId="drug-dose-result"
        />
      )}
      {result !== null && <ResetBtn onClick={() => { setResult(null); setDosePerKg(''); setWeight(''); setErrors({}); }} />}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. IV Drip Rate
// ─────────────────────────────────────────────────────────────
export const IVDripCalc = () => {
  const [volume, setVolume] = useState('');
  const [hours, setHours] = useState('');
  const [dropFactor, setDropFactor] = useState('20');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculate = () => {
    const errs = {};
    const v = parseFloat(volume);
    const h = parseFloat(hours);
    const df = parseFloat(dropFactor);
    if (!volume || isNaN(v) || v <= 0) errs.volume = 'Enter a valid volume (mL)';
    if (!hours || isNaN(h) || h <= 0 || h > 24) errs.hours = 'Enter hours (1–24)';
    if (!dropFactor || isNaN(df) || df <= 0) errs.dropFactor = 'Enter drop factor';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const mlPerHr = v / h;
    const dropsPerMin = (v * df) / (h * 60);
    setResult({ mlPerHr: mlPerHr.toFixed(1), dropsPerMin: Math.round(dropsPerMin) });
  };

  return (
    <CalcCard id="iv-drip" emoji="🩺" title="IV Drip Rate" color="#F97316">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Volume"
          id="drip-volume"
          unit="mL"
          type="number"
          inputMode="decimal"
          placeholder="1000"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          error={errors.volume}
        />
        <Field
          label="Time"
          id="drip-hours"
          unit="hr"
          type="number"
          inputMode="decimal"
          placeholder="8"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          error={errors.hours}
        />
      </div>
      <div className="mt-3">
        <SelectField
          label="Drop Factor"
          id="drip-dropfactor"
          value={dropFactor}
          onChange={setDropFactor}
          options={[
            { value: '20', label: '20 drops/mL (standard giving set)' },
            { value: '15', label: '15 drops/mL (blood set)' },
            { value: '60', label: '60 drops/mL (paediatric/burette)' },
          ]}
          error={errors.dropFactor}
        />
      </div>
      <CalcButton onClick={calculate} color="#F97316" />
      {result && (
        <div
          data-testid="iv-drip-result"
          className="mt-4 rounded-xl p-4 grid grid-cols-2 gap-4"
          style={{ background: '#F9731610', border: '1px solid #F9731630' }}
        >
          <div>
            <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: FONTS.body }}>Rate</p>
            <p className="text-2xl font-bold" style={{ fontFamily: FONTS.heading, color: '#F97316' }}>
              {result.mlPerHr}
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>mL/hr</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: FONTS.body }}>Drip rate</p>
            <p className="text-2xl font-bold" style={{ fontFamily: FONTS.heading, color: '#F97316' }}>
              {result.dropsPerMin}
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>drops/min</p>
          </div>
          <p className="col-span-2 text-xs text-gray-400 italic" style={{ fontFamily: FONTS.body }}>
            Drops/min = (Volume × Drop factor) ÷ (Hours × 60)
          </p>
        </div>
      )}
      {result && <ResetBtn onClick={() => { setResult(null); setVolume(''); setHours(''); setErrors({}); }} />}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. GFR / CrCl (Cockcroft-Gault)
// ─────────────────────────────────────────────────────────────
export const GFRCalc = () => {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [sex, setSex] = useState('male');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const gfrStage = (crcl) => {
    if (crcl >= 90) return { label: 'Normal (G1)', color: C.safe };
    if (crcl >= 60) return { label: 'Mildly reduced (G2)', color: C.safe };
    if (crcl >= 45) return { label: 'Mild-moderate (G3a)', color: C.caution };
    if (crcl >= 30) return { label: 'Moderate-severe (G3b)', color: C.caution };
    if (crcl >= 15) return { label: 'Severely reduced (G4)', color: C.critical };
    return { label: 'Kidney failure (G5)', color: C.critical };
  };

  const drugWarning = (crcl) => {
    if (crcl < 30) return '⚠️ eGFR < 30: dose adjustment required for many renally-cleared drugs (e.g. metformin, dabigatran, enoxaparin, gabapentin). Check MIMS.';
    if (crcl < 60) return '⚠️ eGFR 30–60: some drugs require dose reduction. Monitor renally-cleared drugs.';
    return null;
  };

  const calculate = () => {
    const errs = {};
    const a = parseFloat(age);
    const w = parseFloat(weight);
    const cr = parseFloat(creatinine);
    if (!age || isNaN(a) || a < 18 || a > 120) errs.age = 'Enter age (18–120 years)';
    if (!weight || isNaN(w) || w <= 0 || w > 500) errs.weight = 'Enter a valid weight (kg)';
    if (!creatinine || isNaN(cr) || cr <= 0 || cr > 2000)
      errs.creatinine = 'Enter creatinine in µmol/L (e.g. 90)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // Cockcroft-Gault: CrCl = [(140 - age) × weight × (0.85 if female)] / (0.815 × Scr in µmol/L)
    const sexFactor = sex === 'female' ? 0.85 : 1;
    const crcl = ((140 - a) * w * sexFactor) / (0.815 * cr);
    const stage = gfrStage(crcl);
    const warning = drugWarning(crcl);
    setResult({ crcl: crcl.toFixed(1), ...stage, warning });
  };

  return (
    <CalcCard id="gfr" emoji="🫘" title="GFR / CrCl (Cockcroft-Gault)" color="#8B5CF6">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Age"
          id="gfr-age"
          unit="yr"
          type="number"
          inputMode="numeric"
          placeholder="65"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          error={errors.age}
        />
        <Field
          label="Weight"
          id="gfr-weight"
          unit="kg"
          type="number"
          inputMode="decimal"
          placeholder="70"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          error={errors.weight}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field
          label="Serum Creatinine"
          id="gfr-creatinine"
          unit="µmol/L"
          type="number"
          inputMode="decimal"
          placeholder="90"
          value={creatinine}
          onChange={(e) => setCreatinine(e.target.value)}
          error={errors.creatinine}
        />
        <SelectField
          label="Sex"
          id="gfr-sex"
          value={sex}
          onChange={setSex}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />
      </div>
      <CalcButton onClick={calculate} color="#8B5CF6" />
      {result && (
        <div data-testid="gfr-result">
          <ResultBox
            label="Estimated CrCl"
            value={result.crcl}
            unit="mL/min"
            badge={result.label}
            badgeColor={result.color}
            formula="CrCl = [(140 − age) × weight × sex factor] ÷ (0.815 × Scr µmol/L) | Female × 0.85"
            color="#8B5CF6"
          />
          {result.warning && (
            <div
              className="mt-3 rounded-xl p-3 flex gap-2"
              style={{ background: '#EF444415', border: '1px solid #EF444440' }}
            >
              <p className="text-xs text-red-700" style={{ fontFamily: FONTS.body }}>
                {result.warning}
              </p>
            </div>
          )}
        </div>
      )}
      {result && <ResetBtn onClick={() => { setResult(null); setAge(''); setWeight(''); setCreatinine(''); setErrors({}); }} />}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 5. Fluid Balance
// ─────────────────────────────────────────────────────────────
export const FluidBalanceCalc = () => {
  const [inputs, setInputs] = useState({ iv: '', oral: '', ng: '' });
  const [outputs, setOutputs] = useState({ urine: '', drain: '', vomit: '', stool: '', insensible: '' });
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const inputFields = [
    { key: 'iv', label: 'IV Fluids', placeholder: '1000' },
    { key: 'oral', label: 'Oral Intake', placeholder: '500' },
    { key: 'ng', label: 'NG / Feed', placeholder: '0' },
  ];

  const outputFields = [
    { key: 'urine', label: 'Urine Output', placeholder: '1200' },
    { key: 'drain', label: 'Drain', placeholder: '0' },
    { key: 'vomit', label: 'Vomit / Gastric', placeholder: '0' },
    { key: 'stool', label: 'Stool / Ostomy', placeholder: '0' },
    { key: 'insensible', label: 'Insensible Loss', placeholder: '500' },
  ];

  const parse = (v) => {
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const calculate = () => {
    const errs = {};
    const hasAnyInput = Object.values(inputs).some((v) => v !== '');
    const hasAnyOutput = Object.values(outputs).some((v) => v !== '');
    if (!hasAnyInput && !hasAnyOutput) {
      errs.general = 'Enter at least one intake or output value';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const totalIn = Object.values(inputs).reduce((sum, v) => sum + parse(v), 0);
    const totalOut = Object.values(outputs).reduce((sum, v) => sum + parse(v), 0);
    const balance = totalIn - totalOut;
    setResult({ totalIn, totalOut, balance });
  };

  const balanceColor = result
    ? result.balance > 500
      ? C.caution
      : result.balance < -500
      ? C.critical
      : C.safe
    : C.safe;

  return (
    <CalcCard id="fluid-balance" emoji="💧" title="24h Fluid Balance" color="#06B6D4">
      <div className="mb-3">
        <p
          className="text-xs font-bold uppercase tracking-wide text-[#06B6D4] mb-2"
          style={{ fontFamily: FONTS.body }}
        >
          Intake (mL)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {inputFields.map(({ key, label, placeholder }) => (
            <Field
              key={key}
              label={label}
              id={`fluid-in-${key}`}
              unit="mL"
              type="number"
              inputMode="numeric"
              placeholder={placeholder}
              value={inputs[key]}
              onChange={(e) => setInputs((p) => ({ ...p, [key]: e.target.value }))}
            />
          ))}
        </div>
      </div>
      <div className="mb-1">
        <p
          className="text-xs font-bold uppercase tracking-wide text-[#EF4444] mb-2"
          style={{ fontFamily: FONTS.body }}
        >
          Output (mL)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {outputFields.map(({ key, label, placeholder }) => (
            <Field
              key={key}
              label={label}
              id={`fluid-out-${key}`}
              unit="mL"
              type="number"
              inputMode="numeric"
              placeholder={placeholder}
              value={outputs[key]}
              onChange={(e) => setOutputs((p) => ({ ...p, [key]: e.target.value }))}
            />
          ))}
        </div>
      </div>
      {errors.general && (
        <p className="text-xs text-red-500 mt-1" role="alert" style={{ fontFamily: FONTS.body }}>
          {errors.general}
        </p>
      )}
      <CalcButton onClick={calculate} color="#06B6D4">Calculate Balance</CalcButton>
      {result && (
        <div
          data-testid="fluid-balance-result"
          className="mt-4 rounded-xl p-4 grid grid-cols-3 gap-3"
          style={{ background: '#06B6D410', border: '1px solid #06B6D430' }}
        >
          <div className="text-center">
            <p className="text-xs text-[#06B6D4] font-semibold mb-1" style={{ fontFamily: FONTS.body }}>Total In</p>
            <p className="text-xl font-bold text-[#06B6D4]" style={{ fontFamily: FONTS.heading }}>
              {result.totalIn.toFixed(0)}
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>mL</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-red-400 font-semibold mb-1" style={{ fontFamily: FONTS.body }}>Total Out</p>
            <p className="text-xl font-bold text-red-500" style={{ fontFamily: FONTS.heading }}>
              {result.totalOut.toFixed(0)}
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>mL</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold mb-1" style={{ fontFamily: FONTS.body, color: balanceColor }}>
              Balance
            </p>
            <p className="text-xl font-bold" style={{ fontFamily: FONTS.heading, color: balanceColor }}>
              {result.balance >= 0 ? '+' : ''}{result.balance.toFixed(0)}
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.body }}>mL</p>
          </div>
          <p
            className="col-span-3 text-xs text-gray-400 italic text-center"
            style={{ fontFamily: FONTS.body }}
          >
            Balance = Total Intake − Total Output
          </p>
        </div>
      )}
      {result && (
        <ResetBtn onClick={() => {
          setResult(null);
          setInputs({ iv: '', oral: '', ng: '' });
          setOutputs({ urine: '', drain: '', vomit: '', stool: '', insensible: '' });
          setErrors({});
        }} />
      )}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 6. GCS (Glasgow Coma Scale)
// ─────────────────────────────────────────────────────────────
const GCS_EYES = [
  { value: '4', label: '4 — Spontaneous' },
  { value: '3', label: '3 — To voice' },
  { value: '2', label: '2 — To pain' },
  { value: '1', label: '1 — No response' },
];
const GCS_VERBAL = [
  { value: '5', label: '5 — Oriented' },
  { value: '4', label: '4 — Confused' },
  { value: '3', label: '3 — Words only' },
  { value: '2', label: '2 — Sounds only' },
  { value: '1', label: '1 — No response' },
];
const GCS_MOTOR = [
  { value: '6', label: '6 — Obeys commands' },
  { value: '5', label: '5 — Localises pain' },
  { value: '4', label: '4 — Withdraws' },
  { value: '3', label: '3 — Flexion (decorticate)' },
  { value: '2', label: '2 — Extension (decerebrate)' },
  { value: '1', label: '1 — No response' },
];

export const GCSCalc = () => {
  const [eyes, setEyes] = useState('4');
  const [verbal, setVerbal] = useState('5');
  const [motor, setMotor] = useState('6');
  const [result, setResult] = useState(null);

  const gcsLabel = (score) => {
    if (score <= 8) return { label: 'Severe (≤8) — intubation threshold', color: C.critical };
    if (score <= 12) return { label: 'Moderate (9–12)', color: C.caution };
    if (score === 13 || score === 14) return { label: 'Mild (13–14)', color: C.caution };
    return { label: 'Normal (15)', color: C.safe };
  };

  const calculate = () => {
    const total = parseInt(eyes) + parseInt(verbal) + parseInt(motor);
    const cat = gcsLabel(total);
    setResult({ total, ...cat });
  };

  return (
    <CalcCard id="gcs" emoji="🧠" title="Glasgow Coma Scale (GCS)" color="#EC4899">
      <div className="space-y-3">
        <SelectField label="Eyes (E)" id="gcs-eyes" value={eyes} onChange={setEyes} options={GCS_EYES} />
        <SelectField label="Verbal (V)" id="gcs-verbal" value={verbal} onChange={setVerbal} options={GCS_VERBAL} />
        <SelectField label="Motor (M)" id="gcs-motor" value={motor} onChange={setMotor} options={GCS_MOTOR} />
      </div>
      <CalcButton onClick={calculate} color="#EC4899" />
      {result && (
        <ResultBox
          label="GCS Total"
          value={result.total}
          unit="/ 15"
          badge={result.label}
          badgeColor={result.color}
          formula={`E${eyes} + V${verbal} + M${motor} = ${result.total}`}
          color="#EC4899"
          testId="gcs-result"
        />
      )}
      {result && <ResetBtn onClick={() => { setResult(null); setEyes('4'); setVerbal('5'); setMotor('6'); }} />}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 7. NEWS2 (National Early Warning Score 2)
// ─────────────────────────────────────────────────────────────
const scoreRR = (rr) => {
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
};
const scoreSPO2 = (spo2, o2) => {
  // Scale 1 (no supplemental O2 / COPD not at risk of hypercapnia)
  if (!o2) {
    if (spo2 >= 96) return 0;
    if (spo2 >= 94) return 1;
    if (spo2 >= 92) return 2;
    return 3;
  }
  // Scale 2 — patient on supplemental O2
  if (spo2 >= 97) return 3;
  if (spo2 >= 95) return 2;
  if (spo2 >= 93) return 1;
  if (spo2 >= 88) return 0;
  if (spo2 >= 86) return 1;
  if (spo2 >= 84) return 2;
  return 3;
};
const scoreBP = (sbp) => {
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3;
};
const scoreHR = (hr) => {
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
};
const scoreTemp = (temp) => {
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2;
};
const scoreConsciousness = (c) => (c === 'A' ? 0 : 3);
const news2Escalation = (score) => {
  if (score === 0) return { label: 'Low (0) — 12-hourly monitoring', color: C.safe, bg: '#10B98115' };
  if (score <= 4) return { label: `Low (${score}) — minimum 4–6 hourly`, color: C.safe, bg: '#10B98115' };
  if (score === 5 || score === 6)
    return { label: `Medium (${score}) — urgent review by nurse/doctor`, color: C.caution, bg: '#F59E0B15' };
  if (score === 3 && false) return {}; // placeholder
  return { label: `High (${score}) — IMMEDIATE emergency team review`, color: C.critical, bg: '#EF444415' };
};

export const NEWS2Calc = () => {
  const [rr, setRr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [o2, setO2] = useState('no');
  const [sbp, setSbp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [consciousness, setConsciousness] = useState('A');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculate = () => {
    const errs = {};
    const rrN = parseFloat(rr);
    const spo2N = parseFloat(spo2);
    const sbpN = parseFloat(sbp);
    const hrN = parseFloat(hr);
    const tempN = parseFloat(temp);
    if (!rr || isNaN(rrN) || rrN < 1 || rrN > 60) errs.rr = 'Enter RR (breaths/min)';
    if (!spo2 || isNaN(spo2N) || spo2N < 50 || spo2N > 100) errs.spo2 = 'Enter SpO₂ (50–100%)';
    if (!sbp || isNaN(sbpN) || sbpN < 40 || sbpN > 300) errs.sbp = 'Enter systolic BP (mmHg)';
    if (!hr || isNaN(hrN) || hrN < 10 || hrN > 300) errs.hr = 'Enter HR (bpm)';
    if (!temp || isNaN(tempN) || tempN < 32 || tempN > 43) errs.temp = 'Enter temp (°C)';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const onO2 = o2 === 'yes';
    const breakdown = {
      rr: scoreRR(rrN),
      spo2: scoreSPO2(spo2N, onO2),
      o2: onO2 ? 2 : 0,
      sbp: scoreBP(sbpN),
      hr: scoreHR(hrN),
      temp: scoreTemp(tempN),
      consciousness: scoreConsciousness(consciousness),
    };
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const escalation = news2Escalation(total);
    setResult({ total, breakdown, ...escalation });
  };

  return (
    <CalcCard id="news2" emoji="🚨" title="NEWS2 Score" color={C.critical}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Resp. Rate" id="news2-rr" unit="br/min" type="number" inputMode="numeric" placeholder="16"
          value={rr} onChange={(e) => setRr(e.target.value)} error={errors.rr} />
        <Field label="SpO₂" id="news2-spo2" unit="%" type="number" inputMode="decimal" placeholder="98"
          value={spo2} onChange={(e) => setSpo2(e.target.value)} error={errors.spo2} />
        <Field label="Systolic BP" id="news2-sbp" unit="mmHg" type="number" inputMode="numeric" placeholder="120"
          value={sbp} onChange={(e) => setSbp(e.target.value)} error={errors.sbp} />
        <Field label="Heart Rate" id="news2-hr" unit="bpm" type="number" inputMode="numeric" placeholder="80"
          value={hr} onChange={(e) => setHr(e.target.value)} error={errors.hr} />
        <Field label="Temperature" id="news2-temp" unit="°C" type="number" inputMode="decimal" placeholder="37.0"
          value={temp} onChange={(e) => setTemp(e.target.value)} error={errors.temp} />
        <SelectField label="On Supplemental O₂?" id="news2-o2" value={o2} onChange={setO2}
          options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes (+2)' }]} />
      </div>
      <div className="mt-3">
        <SelectField
          label="Consciousness (ACVPU)"
          id="news2-consciousness"
          value={consciousness}
          onChange={setConsciousness}
          options={[
            { value: 'A', label: 'A — Alert (0)' },
            { value: 'C', label: 'C — Confused (3)' },
            { value: 'V', label: 'V — Voice (3)' },
            { value: 'P', label: 'P — Pain (3)' },
            { value: 'U', label: 'U — Unresponsive (3)' },
          ]}
        />
      </div>
      <CalcButton onClick={calculate} color={C.critical} />
      {result && (
        <div data-testid="news2-result">
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: result.bg, border: `1px solid ${result.color}40` }}
          >
            <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: FONTS.body }}>NEWS2 Score</p>
            <p className="text-4xl font-bold" style={{ fontFamily: FONTS.heading, color: result.color }}>
              {result.total}
            </p>
            <span
              className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: result.color, fontFamily: FONTS.body }}
            >
              {result.label}
            </span>
          </div>
          {/* Score breakdown */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              ['RR', result.breakdown.rr],
              ['SpO₂', result.breakdown.spo2],
              ['O₂', result.breakdown.o2],
              ['BP', result.breakdown.sbp],
              ['HR', result.breakdown.hr],
              ['Temp', result.breakdown.temp],
              ['ACVPU', result.breakdown.consciousness],
            ].map(([name, score]) => (
              <div
                key={name}
                className="text-center rounded-lg py-2"
                style={{ background: score > 0 ? '#EF444415' : '#10B98115' }}
              >
                <p className="text-xs text-gray-500" style={{ fontFamily: FONTS.body }}>{name}</p>
                <p
                  className="text-lg font-bold"
                  style={{ fontFamily: FONTS.heading, color: score > 0 ? C.critical : C.safe }}
                >
                  {score}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 italic" style={{ fontFamily: FONTS.body }}>
            Royal College of Physicians NEWS2 scoring system
          </p>
        </div>
      )}
      {result && (
        <ResetBtn onClick={() => {
          setResult(null); setRr(''); setSpo2(''); setSbp(''); setHr(''); setTemp('');
          setO2('no'); setConsciousness('A'); setErrors({});
        }} />
      )}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// 8. Paediatric Weight (APLS / Broselow)
// ─────────────────────────────────────────────────────────────
export const PaedWeightCalc = () => {
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const calculate = () => {
    const errs = {};
    const yr = ageYears === '' ? 0 : parseInt(ageYears);
    const mo = ageMonths === '' ? 0 : parseInt(ageMonths);

    if (ageYears === '' && ageMonths === '') {
      errs.age = 'Enter age in years and/or months';
    } else {
      if (ageYears !== '' && (isNaN(yr) || yr < 0 || yr > 12)) errs.years = 'Years: 0–12';
      if (ageMonths !== '' && (isNaN(mo) || mo < 0 || mo > 11)) errs.months = 'Months: 0–11';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const totalMonths = yr * 12 + mo;

    let weight, formula;
    if (totalMonths < 1) {
      errs.age = 'Age must be at least 1 month';
      setErrors(errs);
      return;
    } else if (totalMonths <= 12) {
      // 1–12 months
      weight = totalMonths + 4;
      formula = `Weight = age(months) + 4 = ${totalMonths} + 4`;
    } else if (yr <= 5) {
      // 1–5 years
      weight = 2 * (yr + 4);
      formula = `Weight = 2 × (age(years) + 4) = 2 × (${yr} + 4)`;
    } else if (yr <= 12) {
      // 6–12 years
      weight = 3 * yr + 7;
      formula = `Weight = 3 × age(years) + 7 = 3 × ${yr} + 7`;
    } else {
      errs.age = 'This formula applies to children aged 1 month to 12 years';
      setErrors(errs);
      return;
    }

    const ageLabel =
      totalMonths < 24
        ? `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`
        : `${yr} year${yr !== 1 ? 's' : ''}${mo > 0 ? ` ${mo}m` : ''}`;

    setResult({ weight, formula, ageLabel });
  };

  return (
    <CalcCard id="paed-weight" emoji="👶" title="Paediatric Weight (APLS)" color="#10B981">
      <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
        APLS formula for estimated weight (1 month – 12 years)
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Age (Years)"
          id="paed-years"
          unit="yr"
          type="number"
          inputMode="numeric"
          placeholder="3"
          value={ageYears}
          onChange={(e) => setAgeYears(e.target.value)}
          error={errors.years}
        />
        <Field
          label="Age (Months)"
          id="paed-months"
          unit="mo"
          type="number"
          inputMode="numeric"
          placeholder="6"
          value={ageMonths}
          onChange={(e) => setAgeMonths(e.target.value)}
          error={errors.months}
        />
      </div>
      {errors.age && (
        <p className="text-xs text-red-500 mt-1" role="alert" style={{ fontFamily: FONTS.body }}>
          {errors.age}
        </p>
      )}
      <CalcButton onClick={calculate} color="#10B981" />
      {result && (
        <div data-testid="paed-weight-result">
          <ResultBox
            label={`Estimated weight for ${result.ageLabel}`}
            value={result.weight}
            unit="kg"
            badge="APLS estimate"
            badgeColor="#10B981"
            formula={`${result.formula} = ${result.weight} kg`}
            color="#10B981"
          />
          <div
            className="mt-2 rounded-xl p-3"
            style={{ background: '#F59E0B15', border: '1px solid #F59E0B40' }}
          >
            <p className="text-xs text-amber-700" style={{ fontFamily: FONTS.body }}>
              ⚠️ This is an estimated weight only. Always use actual weight when available. This estimate is for emergency use when weighing is not possible.
            </p>
          </div>
        </div>
      )}
      {result && <ResetBtn onClick={() => { setResult(null); setAgeYears(''); setAgeMonths(''); setErrors({}); }} />}
    </CalcCard>
  );
};

// ─────────────────────────────────────────────────────────────
// CalcPage — main page
// ─────────────────────────────────────────────────────────────
const CALC_NAV = [
  { id: 'bmi', label: 'BMI', emoji: '⚖️' },
  { id: 'drug-dose', label: 'Dose', emoji: '💉' },
  { id: 'iv-drip', label: 'IV', emoji: '🩺' },
  { id: 'gfr', label: 'GFR', emoji: '🫘' },
  { id: 'fluid-balance', label: 'Fluid', emoji: '💧' },
  { id: 'gcs', label: 'GCS', emoji: '🧠' },
  { id: 'news2', label: 'NEWS2', emoji: '🚨' },
  { id: 'paed-weight', label: 'Paed', emoji: '👶' },
];

const CalcPage = () => {
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div
      className="flex flex-col h-full bg-[#F4F6F9]"
      style={{ maxWidth: '448px', margin: '0 auto', fontFamily: FONTS.body }}
    >
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">🧮</span>
          <h1
            className="text-xl font-bold text-[#1B3A6B]"
            style={{ fontFamily: FONTS.heading }}
          >
            Clinical Calculators
          </h1>
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ backgroundColor: '#00A99D20', color: '#00A99D' }}
          >
            8 tools
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
          Educational use only — always verify calculations clinically
        </p>

        {/* Quick-nav pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
          role="navigation"
          aria-label="Jump to calculator"
        >
          {CALC_NAV.map(({ id, label, emoji }) => (
            <button
              key={id}
              data-testid={`quicknav-${id}`}
              onClick={() => scrollTo(id)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors bg-[#F4F6F9] hover:bg-[#1B3A6B] hover:text-white text-gray-600"
              style={{ fontFamily: FONTS.body, minHeight: '32px' }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable calculator list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        data-testid="calc-scroll-area"
      >
        <BmiCalc />
        <DrugDoseCalc />
        <IVDripCalc />
        <GFRCalc />
        <FluidBalanceCalc />
        <GCSCalc />
        <NEWS2Calc />
        <PaedWeightCalc />

        {/* Footer disclaimer */}
        <p
          className="text-center text-[10px] text-gray-400 pb-4 leading-relaxed"
          style={{ fontFamily: FONTS.body }}
        >
          All calculators are for educational use only and do not replace clinical judgement.
          Verify all calculations against current clinical guidelines and your facility's protocols.
          Formula sources: WHO BMI, Cockcroft-Gault, RCP NEWS2, APLS 2021.
        </p>
      </div>
    </div>
  );
};

export default CalcPage;
