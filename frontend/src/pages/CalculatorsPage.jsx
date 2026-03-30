import { useState, useEffect } from "react";
import axios from "axios";
import { Calculator, Pill, Droplet, Scale, Brain, Activity, Droplets, Flame, Heart, Wind, Baby, ArrowLeftRight, ChevronRight } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICONS = {
  Pill,
  Droplet,
  Scale,
  Brain,
  Activity,
  Droplets,
  Flame,
  Heart,
  Wind,
  Baby,
  ArrowLeftRight,
};

const CalculatorCard = ({ calculator, onSelect, isSelected }) => {
  const Icon = ICONS[calculator.icon] || Calculator;
  
  return (
    <button
      onClick={() => onSelect(calculator)}
      className={`w-full text-left p-4 rounded-2xl transition-all ${
        isSelected
          ? "bg-[#1B3A6B] text-white"
          : "bg-[#F4F6F9] dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
      }`}
      data-testid={`calc-${calculator.id}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isSelected ? "bg-white/20" : "bg-[#00A99D]/10"
        }`}>
          <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-[#00A99D]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${isSelected ? "text-white" : "text-[#1B3A6B] dark:text-white"}`}>
            {calculator.name}
          </div>
          <div className={`text-xs truncate ${isSelected ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
            {calculator.description}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 ${isSelected ? "text-white" : "text-gray-400"}`} />
      </div>
    </button>
  );
};

// Calculator Forms
const DrugDoseCalculator = ({ onCalculate }) => {
  const [doseOrdered, setDoseOrdered] = useState("");
  const [stockStrength, setStockStrength] = useState("");
  const [stockVolume, setStockVolume] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Dose Ordered (mg)</Label>
        <Input type="number" value={doseOrdered} onChange={(e) => setDoseOrdered(e.target.value)} className="calc-input mt-2" placeholder="e.g., 250" data-testid="dose-ordered-input" />
      </div>
      <div>
        <Label>Stock Strength (mg)</Label>
        <Input type="number" value={stockStrength} onChange={(e) => setStockStrength(e.target.value)} className="calc-input mt-2" placeholder="e.g., 500" />
      </div>
      <div>
        <Label>Stock Volume (mL)</Label>
        <Input type="number" value={stockVolume} onChange={(e) => setStockVolume(e.target.value)} className="calc-input mt-2" placeholder="e.g., 10" />
      </div>
      <Button onClick={() => onCalculate("drug-dose", { dose_ordered: parseFloat(doseOrdered), stock_strength: parseFloat(stockStrength), stock_volume: parseFloat(stockVolume) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!doseOrdered || !stockStrength || !stockVolume} data-testid="calculate-btn">Calculate</Button>
    </div>
  );
};

const IVDripCalculator = ({ onCalculate }) => {
  const [volume, setVolume] = useState("");
  const [time, setTime] = useState("");
  const [dropFactor, setDropFactor] = useState("20");

  return (
    <div className="space-y-4">
      <div>
        <Label>Volume (mL)</Label>
        <Input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} className="calc-input mt-2" placeholder="e.g., 1000" />
      </div>
      <div>
        <Label>Time (hours)</Label>
        <Input type="number" value={time} onChange={(e) => setTime(e.target.value)} className="calc-input mt-2" placeholder="e.g., 8" />
      </div>
      <div>
        <Label>Drop Factor</Label>
        <Select value={dropFactor} onValueChange={setDropFactor}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 drops/mL (standard)</SelectItem>
            <SelectItem value="60">60 drops/mL (micro)</SelectItem>
            <SelectItem value="15">15 drops/mL (blood)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => onCalculate("iv-drip", { volume: parseFloat(volume), time_hours: parseFloat(time), drop_factor: parseInt(dropFactor) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!volume || !time}>Calculate</Button>
    </div>
  );
};

const InfusionRateCalculator = ({ onCalculate }) => {
  const [dose, setDose] = useState("");
  const [weight, setWeight] = useState("");
  const [concentration, setConcentration] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Dose (mcg/kg/min)</Label>
        <Input type="number" value={dose} onChange={(e) => setDose(e.target.value)} className="calc-input mt-2" placeholder="e.g., 5" />
      </div>
      <div>
        <Label>Weight (kg)</Label>
        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="calc-input mt-2" placeholder="e.g., 70" />
      </div>
      <div>
        <Label>Concentration (mcg/mL)</Label>
        <Input type="number" value={concentration} onChange={(e) => setConcentration(e.target.value)} className="calc-input mt-2" placeholder="e.g., 1600" />
      </div>
      <Button onClick={() => onCalculate("infusion-rate", { dose_mcg_kg_min: parseFloat(dose), weight: parseFloat(weight), concentration_mcg_ml: parseFloat(concentration) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!dose || !weight || !concentration}>Calculate</Button>
    </div>
  );
};

const WeightBasedCalculator = ({ onCalculate }) => {
  const [mgPerKg, setMgPerKg] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Dose (mg/kg)</Label>
        <Input type="number" value={mgPerKg} onChange={(e) => setMgPerKg(e.target.value)} className="calc-input mt-2" placeholder="e.g., 10" />
      </div>
      <div>
        <Label>Weight (kg)</Label>
        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="calc-input mt-2" placeholder="e.g., 70" />
      </div>
      <Button onClick={() => onCalculate("weight-based", { mg_per_kg: parseFloat(mgPerKg), weight: parseFloat(weight) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!mgPerKg || !weight}>Calculate</Button>
    </div>
  );
};

const BMICalculator = ({ onCalculate }) => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Weight (kg)</Label>
        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="calc-input mt-2" placeholder="e.g., 70" data-testid="weight-input" />
      </div>
      <div>
        <Label>Height (cm)</Label>
        <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="calc-input mt-2" placeholder="e.g., 170" data-testid="height-input" />
      </div>
      <Button onClick={() => onCalculate("bmi", { weight: parseFloat(weight), height: parseFloat(height) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!weight || !height} data-testid="calculate-btn">Calculate</Button>
    </div>
  );
};

const GCSCalculator = ({ onCalculate }) => {
  const [eye, setEye] = useState("4");
  const [verbal, setVerbal] = useState("5");
  const [motor, setMotor] = useState("6");

  return (
    <div className="space-y-4">
      <div>
        <Label>Eye Response (1-4)</Label>
        <Select value={eye} onValueChange={setEye}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 - Spontaneous</SelectItem>
            <SelectItem value="3">3 - To voice</SelectItem>
            <SelectItem value="2">2 - To pain</SelectItem>
            <SelectItem value="1">1 - None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Verbal Response (1-5)</Label>
        <Select value={verbal} onValueChange={setVerbal}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 - Oriented</SelectItem>
            <SelectItem value="4">4 - Confused</SelectItem>
            <SelectItem value="3">3 - Inappropriate words</SelectItem>
            <SelectItem value="2">2 - Incomprehensible sounds</SelectItem>
            <SelectItem value="1">1 - None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Motor Response (1-6)</Label>
        <Select value={motor} onValueChange={setMotor}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6 - Obeys commands</SelectItem>
            <SelectItem value="5">5 - Localises pain</SelectItem>
            <SelectItem value="4">4 - Withdraws from pain</SelectItem>
            <SelectItem value="3">3 - Abnormal flexion</SelectItem>
            <SelectItem value="2">2 - Extension</SelectItem>
            <SelectItem value="1">1 - None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => onCalculate("gcs", { eye: parseInt(eye), verbal: parseInt(verbal), motor: parseInt(motor) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl">Calculate GCS</Button>
    </div>
  );
};

const NEWS2Calculator = ({ onCalculate }) => {
  const [rr, setRr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [onO2, setOnO2] = useState(false);
  const [temp, setTemp] = useState("");
  const [sbp, setSbp] = useState("");
  const [hr, setHr] = useState("");
  const [avpu, setAvpu] = useState("A");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>RR (/min)</Label>
          <Input type="number" value={rr} onChange={(e) => setRr(e.target.value)} className="calc-input mt-2" placeholder="12-20" />
        </div>
        <div>
          <Label>SpO2 (%)</Label>
          <Input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} className="calc-input mt-2" placeholder="94-98" />
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <Label>On Supplemental O2?</Label>
        <Switch checked={onO2} onCheckedChange={setOnO2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Temp (°C)</Label>
          <Input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className="calc-input mt-2" placeholder="36.1-38.0" />
        </div>
        <div>
          <Label>Systolic BP</Label>
          <Input type="number" value={sbp} onChange={(e) => setSbp(e.target.value)} className="calc-input mt-2" placeholder="111-219" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>HR (/min)</Label>
          <Input type="number" value={hr} onChange={(e) => setHr(e.target.value)} className="calc-input mt-2" placeholder="51-90" />
        </div>
        <div>
          <Label>AVPU</Label>
          <Select value={avpu} onValueChange={setAvpu}>
            <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A - Alert</SelectItem>
              <SelectItem value="V">V - Voice</SelectItem>
              <SelectItem value="P">P - Pain</SelectItem>
              <SelectItem value="U">U - Unresponsive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={() => onCalculate("news2", { rr: parseInt(rr), spo2: parseInt(spo2), on_oxygen: onO2, temp: parseFloat(temp), sbp: parseInt(sbp), hr: parseInt(hr), avpu })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!rr || !spo2 || !temp || !sbp || !hr}>Calculate NEWS2</Button>
    </div>
  );
};

const CURB65Calculator = ({ onCalculate }) => {
  const [confusion, setConfusion] = useState(false);
  const [urea, setUrea] = useState("");
  const [rr, setRr] = useState("");
  const [sbp, setSbp] = useState("");
  const [dbp, setDbp] = useState("");
  const [age, setAge] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2 bg-[#F4F6F9] dark:bg-slate-800 rounded-xl px-4">
        <Label>Confusion (new onset)</Label>
        <Switch checked={confusion} onCheckedChange={setConfusion} />
      </div>
      <div>
        <Label>Urea (mmol/L)</Label>
        <Input type="number" value={urea} onChange={(e) => setUrea(e.target.value)} className="calc-input mt-2" placeholder="&gt;7 scores 1 point" />
      </div>
      <div>
        <Label>Respiratory Rate (/min)</Label>
        <Input type="number" value={rr} onChange={(e) => setRr(e.target.value)} className="calc-input mt-2" placeholder="≥30 scores 1 point" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Systolic BP</Label>
          <Input type="number" value={sbp} onChange={(e) => setSbp(e.target.value)} className="calc-input mt-2" placeholder="&lt;90" />
        </div>
        <div>
          <Label>Diastolic BP</Label>
          <Input type="number" value={dbp} onChange={(e) => setDbp(e.target.value)} className="calc-input mt-2" placeholder="≤60" />
        </div>
      </div>
      <div>
        <Label>Age (years)</Label>
        <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="calc-input mt-2" placeholder="≥65 scores 1 point" />
      </div>
      <Button onClick={() => onCalculate("curb65", { confusion, urea: parseFloat(urea), rr: parseInt(rr), sbp: parseInt(sbp), dbp: parseInt(dbp), age: parseInt(age) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!urea || !rr || !sbp || !age}>Calculate CURB-65</Button>
    </div>
  );
};

const APGARCalculator = ({ onCalculate }) => {
  const [appearance, setAppearance] = useState("2");
  const [pulse, setPulse] = useState("2");
  const [grimace, setGrimace] = useState("2");
  const [activity, setActivity] = useState("2");
  const [respiration, setRespiration] = useState("2");

  return (
    <div className="space-y-4">
      <div>
        <Label>Appearance (skin color)</Label>
        <Select value={appearance} onValueChange={setAppearance}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 - Pink all over</SelectItem>
            <SelectItem value="1">1 - Blue extremities</SelectItem>
            <SelectItem value="0">0 - Blue/pale all over</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Pulse (heart rate)</Label>
        <Select value={pulse} onValueChange={setPulse}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 - &gt;100 bpm</SelectItem>
            <SelectItem value="1">1 - &lt;100 bpm</SelectItem>
            <SelectItem value="0">0 - Absent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Grimace (reflex irritability)</Label>
        <Select value={grimace} onValueChange={setGrimace}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 - Cry, cough, sneeze</SelectItem>
            <SelectItem value="1">1 - Grimace only</SelectItem>
            <SelectItem value="0">0 - No response</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Activity (muscle tone)</Label>
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 - Active movement</SelectItem>
            <SelectItem value="1">1 - Some flexion</SelectItem>
            <SelectItem value="0">0 - Limp</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Respiration</Label>
        <Select value={respiration} onValueChange={setRespiration}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 - Good cry</SelectItem>
            <SelectItem value="1">1 - Weak/irregular</SelectItem>
            <SelectItem value="0">0 - Absent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => onCalculate("apgar", { appearance: parseInt(appearance), pulse: parseInt(pulse), grimace: parseInt(grimace), activity: parseInt(activity), respiration: parseInt(respiration) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl">Calculate APGAR</Button>
    </div>
  );
};

const GFRCalculator = ({ onCalculate }) => {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [isFemale, setIsFemale] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Label>Age (years)</Label>
        <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="calc-input mt-2" placeholder="e.g., 65" />
      </div>
      <div>
        <Label>Weight (kg)</Label>
        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="calc-input mt-2" placeholder="e.g., 70" />
      </div>
      <div>
        <Label>Serum Creatinine (μmol/L)</Label>
        <Input type="number" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} className="calc-input mt-2" placeholder="e.g., 100" />
      </div>
      <div className="flex items-center justify-between py-2">
        <Label>Female</Label>
        <Switch checked={isFemale} onCheckedChange={setIsFemale} />
      </div>
      <Button onClick={() => onCalculate("gfr", { age: parseInt(age), weight: parseFloat(weight), creatinine: parseFloat(creatinine), is_female: isFemale })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!age || !weight || !creatinine}>Calculate eGFR</Button>
    </div>
  );
};

const ParklandCalculator = ({ onCalculate }) => {
  const [weight, setWeight] = useState("");
  const [tbsa, setTbsa] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Weight (kg)</Label>
        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="calc-input mt-2" placeholder="e.g., 70" />
      </div>
      <div>
        <Label>% TBSA Burned</Label>
        <Input type="number" value={tbsa} onChange={(e) => setTbsa(e.target.value)} className="calc-input mt-2" placeholder="e.g., 20" />
      </div>
      <Button onClick={() => onCalculate("parkland", { weight: parseFloat(weight), tbsa: parseFloat(tbsa) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!weight || !tbsa}>Calculate Fluid</Button>
    </div>
  );
};

const PaedsWeightCalculator = ({ onCalculate }) => {
  const [age, setAge] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Age (years)</Label>
        <Input type="number" step="0.5" value={age} onChange={(e) => setAge(e.target.value)} className="calc-input mt-2" placeholder="e.g., 5" />
      </div>
      <p className="text-xs text-gray-500">Formula: (Age × 2) + 8 for ages 1-5 years</p>
      <Button onClick={() => onCalculate("paeds-weight", { age_years: parseFloat(age) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!age}>Estimate Weight</Button>
    </div>
  );
};

const UnitConverter = ({ onCalculate }) => {
  const [type, setType] = useState("kg_to_lbs");
  const [value, setValue] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Conversion Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="kg_to_lbs">kg → lbs</SelectItem>
            <SelectItem value="lbs_to_kg">lbs → kg</SelectItem>
            <SelectItem value="c_to_f">°C → °F</SelectItem>
            <SelectItem value="f_to_c">°F → °C</SelectItem>
            <SelectItem value="cm_to_inches">cm → inches</SelectItem>
            <SelectItem value="inches_to_cm">inches → cm</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Value</Label>
        <Input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} className="calc-input mt-2" placeholder="Enter value" />
      </div>
      <Button onClick={() => onCalculate("unit-converter", { type, value: parseFloat(value) })} className="w-full h-12 bg-[#00A99D] hover:bg-[#008f85] text-white rounded-xl" disabled={!value}>Convert</Button>
    </div>
  );
};

export default function CalculatorsPage() {
  const [calculators, setCalculators] = useState([]);
  const [selectedCalc, setSelectedCalc] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalculators();
  }, []);

  const fetchCalculators = async () => {
    try {
      const response = await axios.get(`${API}/calculators`);
      setCalculators(response.data.calculators || []);
    } catch (error) {
      console.error("Error fetching calculators:", error);
    }
  };

  const handleCalculate = async (calcType, inputs) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/calculators/calculate`, {
        calculator_type: calcType,
        inputs,
      });
      setResult(response.data);
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCalculatorForm = () => {
    if (!selectedCalc) return null;
    const forms = {
      "drug-dose": <DrugDoseCalculator onCalculate={handleCalculate} />,
      "iv-drip": <IVDripCalculator onCalculate={handleCalculate} />,
      "infusion-rate": <InfusionRateCalculator onCalculate={handleCalculate} />,
      "weight-based": <WeightBasedCalculator onCalculate={handleCalculate} />,
      "bmi": <BMICalculator onCalculate={handleCalculate} />,
      "gcs": <GCSCalculator onCalculate={handleCalculate} />,
      "news2": <NEWS2Calculator onCalculate={handleCalculate} />,
      "curb65": <CURB65Calculator onCalculate={handleCalculate} />,
      "apgar": <APGARCalculator onCalculate={handleCalculate} />,
      "gfr": <GFRCalculator onCalculate={handleCalculate} />,
      "parkland": <ParklandCalculator onCalculate={handleCalculate} />,
      "paeds-weight": <PaedsWeightCalculator onCalculate={handleCalculate} />,
      "unit-converter": <UnitConverter onCalculate={handleCalculate} />,
    };
    return forms[selectedCalc.id] || <div className="text-center py-8 text-gray-500">Calculator coming soon</div>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="calculators-page">
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white">Calculators</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Clinical calculation tools</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-32">
          {!selectedCalc ? (
            <div className="space-y-2">
              {calculators.map((calc) => (
                <CalculatorCard key={calc.id} calculator={calc} onSelect={(c) => { setSelectedCalc(c); setResult(null); }} isSelected={false} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => { setSelectedCalc(null); setResult(null); }} className="flex items-center gap-2 text-[#00A99D] font-medium" data-testid="back-btn">← Back to calculators</button>

              <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-4">
                <h2 className="font-bold text-lg text-[#1B3A6B] dark:text-white mb-2">{selectedCalc.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedCalc.description}</p>
                <p className="text-xs font-mono text-[#00A99D] bg-[#00A99D]/10 rounded-lg px-3 py-2">{selectedCalc.formula}</p>
              </div>

              {renderCalculatorForm()}

              {result && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2" style={{ borderColor: result.color || "#00A99D" }} data-testid="calc-result">
                  <div className="text-center">
                    <div className="result-display" style={{ color: result.color || "#1B3A6B" }}>
                      {result.result}<span className="text-2xl font-normal ml-2">{result.unit}</span>
                    </div>
                    {result.category && <div className="text-lg font-semibold mt-2" style={{ color: result.color }}>{result.category}</div>}
                    {result.severity && <div className="text-lg font-semibold mt-2" style={{ color: result.color }}>{result.severity}</div>}
                    {result.risk && <div className="text-lg font-semibold mt-2" style={{ color: result.color }}>{result.risk} Risk</div>}
                    {result.stage && <div className="text-lg font-semibold mt-2" style={{ color: result.color }}>CKD {result.stage}</div>}
                    {result.interpretation && <div className="text-lg font-semibold mt-2" style={{ color: result.color }}>{result.interpretation}</div>}
                    {result.probability && <div className="text-lg font-semibold mt-2" style={{ color: result.color }}>{result.probability}</div>}
                    {result.recommendation && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{result.recommendation}</div>}
                    {result.mortality && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">30-day mortality: {result.mortality}</div>}
                    {result.first_8hrs && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">First 8hrs: {result.first_8hrs} mL | Next 16hrs: {result.next_16hrs} mL</div>}
                    {result.breakdown && <div className="text-sm text-gray-500 mt-2">{result.breakdown}</div>}
                    <div className="text-xs text-gray-400 mt-4 font-mono">{result.formula}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
