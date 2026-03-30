from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import anthropic

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key - Support both EMERGENT_LLM_KEY and ANTHROPIC_API_KEY
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
LLM_KEY = EMERGENT_LLM_KEY or ANTHROPIC_API_KEY

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ AUSTRALIAN DRUG NAME MAPPING ============
AU_TO_US_DRUG_NAMES = {
    "paracetamol": "acetaminophen",
    "adrenaline": "epinephrine",
    "salbutamol": "albuterol",
    "frusemide": "furosemide",
    "lignocaine": "lidocaine",
    "amoxycillin": "amoxicillin",
    "cephalexin": "cefalexin",
    "noradrenaline": "norepinephrine",
    "glyceryl trinitrate": "nitroglycerin",
    "pethidine": "meperidine",
    "diclofenac": "diclofenac",
    "metoclopramide": "metoclopramide",
    "clonazepam": "clonazepam",
    "tramadol": "tramadol",
    "omeprazole": "omeprazole",
    "pantoprazole": "pantoprazole",
    "atorvastatin": "atorvastatin",
    "metformin": "metformin",
    "insulin": "insulin",
    "warfarin": "warfarin",
    "enoxaparin": "enoxaparin",
    "morphine": "morphine",
    "oxycodone": "oxycodone",
    "codeine": "codeine",
    "prednisone": "prednisone",
    "prednisolone": "prednisolone",
    "dexamethasone": "dexamethasone",
    "cetirizine": "cetirizine",
    "loratadine": "loratadine",
    "flucloxacillin": "flucloxacillin",
    "ceftriaxone": "ceftriaxone",
    "gentamicin": "gentamicin",
    "vancomycin": "vancomycin",
    "metronidazole": "metronidazole",
}

US_TO_AU_DRUG_NAMES = {v: k for k, v in AU_TO_US_DRUG_NAMES.items() if k != v}

def get_us_drug_name(au_name: str) -> str:
    """Convert Australian drug name to US equivalent for API search"""
    return AU_TO_US_DRUG_NAMES.get(au_name.lower(), au_name)

def format_drug_name(generic_name: str) -> str:
    """Format drug name as 'Australian Name (US Name)' if different"""
    name_lower = generic_name.lower()
    if name_lower in US_TO_AU_DRUG_NAMES:
        au_name = US_TO_AU_DRUG_NAMES[name_lower].title()
        return f"{au_name} ({generic_name})"
    elif name_lower in AU_TO_US_DRUG_NAMES and AU_TO_US_DRUG_NAMES[name_lower] != name_lower:
        us_name = AU_TO_US_DRUG_NAMES[name_lower].title()
        return f"{generic_name.title()} ({us_name})"
    return generic_name

# ============ MODELS ============
class Bookmark(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_type: str
    item_id: str
    item_title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecentItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_type: str
    item_id: str
    item_title: str
    viewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class CalculatorInput(BaseModel):
    calculator_type: str
    inputs: Dict[str, Any]

class DrugInteractionRequest(BaseModel):
    drugs: List[str]

# ============ CURATED DATA ============
CATEGORIES = [
    {"id": "drugs", "name": "Drugs & Medications", "icon": "Pill", "color": "#8B5CF6", "description": "Drug reference with Australian context"},
    {"id": "body-systems", "name": "Human Body & Systems", "icon": "Heart", "color": "#EF4444", "description": "Anatomy and physiology"},
    {"id": "terminology", "name": "Medical Terminology", "icon": "FileText", "color": "#3B82F6", "description": "Medical terms glossary"},
    {"id": "lab-values", "name": "Lab Values & Diagnostics", "icon": "TestTube", "color": "#F59E0B", "description": "Reference ranges in SI units"},
    {"id": "emergency", "name": "Emergency Reference", "icon": "AlertTriangle", "color": "#F97316", "description": "Emergency protocols and cards"},
    {"id": "abbreviations", "name": "Abbreviations & Shortcuts", "icon": "Hash", "color": "#3B82F6", "description": "Medical abbreviations A-Z"},
    {"id": "calculators", "name": "Clinical Calculators", "icon": "Calculator", "color": "#10B981", "description": "Drug doses, BMI, GCS, etc."},
    {"id": "communication", "name": "Communication & Handover", "icon": "MessageSquare", "color": "#00A99D", "description": "ISBAR, SBAR, handover guides"},
    {"id": "professional", "name": "Professional & Regulatory", "icon": "Scale", "color": "#1B3A6B", "description": "AHPRA, NMBA, documentation"},
]

# Communication and Handover Data
COMMUNICATION_HANDOVER = [
    {
        "id": "isbar",
        "title": "ISBAR Framework",
        "description": "The Australian standard for clinical communication and handover",
        "color": "#00A99D",
        "sections": [
            {"letter": "I", "title": "Identify", "content": "Identify yourself, your role, the patient, and their location", "example": "Hi, I'm Sarah, the EN on Ward 3B. I'm calling about Mrs. Johnson in bed 12."},
            {"letter": "S", "title": "Situation", "content": "State the current problem or reason for communication", "example": "I'm concerned about her - she's become acutely short of breath in the last 30 minutes."},
            {"letter": "B", "title": "Background", "content": "Provide relevant clinical history and context", "example": "She's a 72-year-old admitted yesterday for COPD exacerbation. She was stable on 2L O2 overnight."},
            {"letter": "A", "title": "Assessment", "content": "Share your clinical assessment including vital signs", "example": "Her RR is now 28, SpO2 88% on 2L, HR 110, BP 150/90. She's using accessory muscles and can only speak in short phrases. NEWS2 score is 7."},
            {"letter": "R", "title": "Recommendation", "content": "State what you need or recommend", "example": "I think she needs urgent medical review. Can you come and assess her please? I've increased her O2 to 4L and sat her upright."}
        ]
    },
    {
        "id": "sbar",
        "title": "SBAR Framework",
        "description": "A structured communication tool commonly used internationally",
        "color": "#3B82F6",
        "sections": [
            {"letter": "S", "title": "Situation", "content": "A concise statement of the problem", "example": "I'm calling about Mr. Smith in Room 4. He's having chest pain."},
            {"letter": "B", "title": "Background", "content": "Pertinent information related to the situation", "example": "He's 65, admitted for elective knee surgery tomorrow. History of hypertension and type 2 diabetes. The pain started 20 minutes ago."},
            {"letter": "A", "title": "Assessment", "content": "Analysis and considerations of options", "example": "His vitals are BP 160/95, HR 92, SpO2 97%. Pain is 7/10, central, crushing. ECG shows ST changes in leads V2-V4."},
            {"letter": "R", "title": "Recommendation", "content": "Action requested or recommended", "example": "I think he needs urgent cardiology review. I've given aspirin 300mg and GTN spray. Can you come immediately?"}
        ]
    },
    {
        "id": "bedside-handover",
        "title": "Bedside Handover Checklist",
        "description": "Essential elements for safe shift handover at the bedside",
        "color": "#8B5CF6",
        "sections": [
            {"letter": "1", "title": "Introduction", "content": "Introduce yourself and incoming nurse to patient", "example": "Mrs. Jones, this is Emma who will be looking after you this afternoon."},
            {"letter": "2", "title": "Patient ID", "content": "Confirm patient identity with wristband", "example": "Can you tell me your name and date of birth? [Check wristband matches]"},
            {"letter": "3", "title": "Diagnosis & Plan", "content": "Current diagnosis and plan of care", "example": "Day 2 post right hip replacement. Plan: mobilise with physio, continue DVT prophylaxis, aim for discharge tomorrow."},
            {"letter": "4", "title": "Key Issues", "content": "Important concerns or changes", "example": "She had a temperature of 37.8 at 1400 - blood cultures taken, awaiting results. Watch for signs of infection."},
            {"letter": "5", "title": "Medications Due", "content": "Upcoming medications and any PRN given", "example": "Panadol due at 1800. She had Endone 5mg at 1400 for pain - now comfortable."},
            {"letter": "6", "title": "Safety Checks", "content": "IV sites, drains, equipment, falls risk", "example": "IV in left hand - day 2, no signs of phlebitis. IDC in situ draining clear. High falls risk - bed alarm on."},
            {"letter": "7", "title": "Patient Questions", "content": "Allow patient to ask questions or raise concerns", "example": "Mrs. Jones, is there anything you'd like to ask or tell Emma?"}
        ]
    },
    {
        "id": "escalation",
        "title": "PACE Escalation",
        "description": "Framework for escalating concerns effectively",
        "color": "#EF4444",
        "sections": [
            {"letter": "P", "title": "Probe", "content": "Ask questions to better understand", "example": "Can you help me understand why we're not giving IV antibiotics when the patient has signs of sepsis?"},
            {"letter": "A", "title": "Alert", "content": "State your concern clearly", "example": "I'm worried this patient is deteriorating. Their NEWS2 has gone from 3 to 7 in the last hour."},
            {"letter": "C", "title": "Challenge", "content": "If concern persists, challenge respectfully", "example": "I hear you, but I'm really not comfortable with this. The patient is getting worse and I think we need to act now."},
            {"letter": "E", "title": "Emergency", "content": "Take action - escalate to someone else", "example": "I need to escalate this to the Nurse in Charge / MET team. The patient's safety is my priority."}
        ]
    },
    {
        "id": "phone-orders",
        "title": "Receiving Phone Orders",
        "description": "Safe practice for verbal and telephone orders",
        "color": "#F59E0B",
        "sections": [
            {"letter": "1", "title": "Write", "content": "Write the order down as it's given", "example": "Writing: Morphine 2.5mg IV stat for pain..."},
            {"letter": "2", "title": "Read Back", "content": "Read the complete order back to the prescriber", "example": "To confirm: Morphine 2.5 milligrams, intravenous, stat, for pain relief. Is that correct?"},
            {"letter": "3", "title": "Confirm", "content": "Get explicit confirmation", "example": "Prescriber confirms: 'Yes, that's correct.'"},
            {"letter": "4", "title": "Document", "content": "Document the order, time, and prescriber name", "example": "Documented: Morphine 2.5mg IV stat. Verbal order from Dr. Smith at 1430. To be countersigned within 24 hours."},
            {"letter": "5", "title": "Clarify", "content": "Never hesitate to clarify if unsure", "example": "Sorry, can you repeat the dose? Did you say 2.5 or 25 milligrams? And can you spell the medication name?"}
        ]
    },
    {
        "id": "difficult-conversations",
        "title": "Difficult Conversations",
        "description": "Communicating with distressed patients and families",
        "color": "#EC4899",
        "sections": [
            {"letter": "1", "title": "Prepare", "content": "Know the facts, find a private space, allow time", "example": "Let me find a quiet room where we can talk properly without interruptions."},
            {"letter": "2", "title": "Listen", "content": "Allow them to express emotions without interrupting", "example": "I can see this is really difficult for you. Take your time."},
            {"letter": "3", "title": "Acknowledge", "content": "Validate their feelings", "example": "It's completely understandable that you're feeling angry and scared right now."},
            {"letter": "4", "title": "Explain", "content": "Use simple, clear language. Avoid jargon.", "example": "The doctor found that the cancer has spread to other parts of the body. This means the treatment options are different now."},
            {"letter": "5", "title": "Support", "content": "Offer practical next steps and resources", "example": "Would you like me to call the social worker? They can help with practical support and someone to talk to."},
            {"letter": "6", "title": "Follow Up", "content": "Check back on them later", "example": "I'll come back in 30 minutes to see how you're doing. Press the call bell if you need me sooner."}
        ]
    }
]

LAB_VALUES = [
    {"id": "sodium", "name": "Sodium (Na+)", "unit": "mmol/L", "normal_range": "135-145", "low_critical": "<125", "high_critical": ">155", "category": "Electrolytes", "low_meaning": "Hyponatraemia - confusion, seizures, oedema", "high_meaning": "Hypernatraemia - thirst, confusion, dehydration", "nursing": "Monitor fluid balance, neurological status, correct slowly to avoid osmotic demyelination"},
    {"id": "potassium", "name": "Potassium (K+)", "unit": "mmol/L", "normal_range": "3.5-5.0", "low_critical": "<2.5", "high_critical": ">6.5", "category": "Electrolytes", "low_meaning": "Hypokalaemia - weakness, arrhythmias, cramps", "high_meaning": "Hyperkalaemia - arrhythmias, cardiac arrest risk", "nursing": "ECG monitoring if abnormal, check medications (K-sparing diuretics), renal function"},
    {"id": "chloride", "name": "Chloride (Cl-)", "unit": "mmol/L", "normal_range": "95-105", "low_critical": "<80", "high_critical": ">115", "category": "Electrolytes", "low_meaning": "Hypochloraemia - metabolic alkalosis, vomiting", "high_meaning": "Hyperchloraemia - metabolic acidosis, dehydration", "nursing": "Assess fluid status, monitor with sodium levels"},
    {"id": "bicarbonate", "name": "Bicarbonate (HCO3)", "unit": "mmol/L", "normal_range": "22-28", "low_critical": "<10", "high_critical": ">40", "category": "Electrolytes", "low_meaning": "Metabolic acidosis - DKA, renal failure, sepsis", "high_meaning": "Metabolic alkalosis - vomiting, diuretics", "nursing": "Interpret with ABG, identify and treat underlying cause"},
    {"id": "calcium", "name": "Calcium (Ca2+)", "unit": "mmol/L", "normal_range": "2.10-2.60", "low_critical": "<1.8", "high_critical": ">3.0", "category": "Electrolytes", "low_meaning": "Hypocalcaemia - tetany, seizures, prolonged QT", "high_meaning": "Hypercalcaemia - confusion, constipation, shortened QT", "nursing": "Check albumin (corrected calcium), ECG monitoring, seizure precautions if low"},
    {"id": "magnesium", "name": "Magnesium (Mg2+)", "unit": "mmol/L", "normal_range": "0.7-1.0", "low_critical": "<0.5", "high_critical": ">1.5", "category": "Electrolytes", "low_meaning": "Hypomagnesaemia - arrhythmias, seizures, tremor", "high_meaning": "Hypermagnesaemia - weakness, hypotension, respiratory depression", "nursing": "Often depleted with potassium - replace together, monitor cardiac rhythm"},
    {"id": "phosphate", "name": "Phosphate (PO4)", "unit": "mmol/L", "normal_range": "0.8-1.5", "low_critical": "<0.3", "high_critical": ">2.5", "category": "Electrolytes", "low_meaning": "Hypophosphataemia - weakness, respiratory failure", "high_meaning": "Hyperphosphataemia - CKD, calcification", "nursing": "Common in refeeding syndrome, monitor in malnutrition"},
    {"id": "creatinine", "name": "Creatinine", "unit": "μmol/L", "normal_range": "60-110", "low_critical": "N/A", "high_critical": ">300", "category": "Renal", "low_meaning": "Low muscle mass, malnutrition", "high_meaning": "Acute or chronic kidney injury", "nursing": "Calculate eGFR, adjust renally-cleared medications, monitor urine output"},
    {"id": "urea", "name": "Urea", "unit": "mmol/L", "normal_range": "2.5-7.0", "low_critical": "N/A", "high_critical": ">30", "category": "Renal", "low_meaning": "Liver disease, malnutrition", "high_meaning": "Renal impairment, GI bleeding, dehydration", "nursing": "Consider pre-renal, renal, or post-renal causes"},
    {"id": "egfr", "name": "eGFR", "unit": "mL/min/1.73m²", "normal_range": ">90", "low_critical": "<15", "high_critical": "N/A", "category": "Renal", "low_meaning": "Stage 5 CKD - may need dialysis", "high_meaning": "N/A", "nursing": "Stage kidney disease, adjust drug doses, refer nephrology if declining"},
    {"id": "hemoglobin", "name": "Haemoglobin (Hb)", "unit": "g/L", "normal_range": "M: 130-180, F: 115-160", "low_critical": "<70", "high_critical": ">200", "category": "FBC", "low_meaning": "Anaemia - fatigue, SOB, pallor", "high_meaning": "Polycythaemia - thrombosis risk", "nursing": "Assess for bleeding, fatigue, transfusion may be needed if symptomatic"},
    {"id": "wbc", "name": "White Cell Count (WCC)", "unit": "×10⁹/L", "normal_range": "4.0-11.0", "low_critical": "<1.0", "high_critical": ">30", "category": "FBC", "low_meaning": "Neutropenia - infection risk", "high_meaning": "Infection, inflammation, leukaemia", "nursing": "Neutropenic precautions if low, investigate cause of elevation"},
    {"id": "platelets", "name": "Platelets", "unit": "×10⁹/L", "normal_range": "150-400", "low_critical": "<20", "high_critical": ">1000", "category": "FBC", "low_meaning": "Thrombocytopenia - bleeding risk", "high_meaning": "Thrombocytosis - clotting risk", "nursing": "Bleeding precautions if low, avoid IM injections, assess for petechiae"},
    {"id": "inr", "name": "INR", "unit": "ratio", "normal_range": "0.9-1.1 (2.0-3.0 on warfarin)", "low_critical": "N/A", "high_critical": ">5", "category": "Coagulation", "low_meaning": "Therapeutic if on warfarin", "high_meaning": "Bleeding risk, may need vitamin K", "nursing": "Check warfarin dose, monitor for bleeding, educate re: diet and drug interactions"},
    {"id": "aptt", "name": "APTT", "unit": "seconds", "normal_range": "25-35", "low_critical": "N/A", "high_critical": ">100", "category": "Coagulation", "low_meaning": "N/A", "high_meaning": "Bleeding risk, heparin effect", "nursing": "Monitor during heparin therapy, adjust infusion rate per protocol"},
    {"id": "glucose", "name": "Blood Glucose (fasting)", "unit": "mmol/L", "normal_range": "3.5-5.5", "low_critical": "<3.0", "high_critical": ">20", "category": "Metabolic", "low_meaning": "Hypoglycaemia - confusion, sweating, seizures", "high_meaning": "Hyperglycaemia - DKA/HHS risk", "nursing": "Hypo: give fast-acting glucose. Hyper: check ketones, insulin sliding scale"},
    {"id": "hba1c", "name": "HbA1c", "unit": "% or mmol/mol", "normal_range": "<6.5% (<48 mmol/mol)", "low_critical": "N/A", "high_critical": ">10%", "category": "Metabolic", "low_meaning": "Good glycaemic control", "high_meaning": "Poor diabetes control over 3 months", "nursing": "Diabetes education, medication review, lifestyle counselling"},
    {"id": "troponin", "name": "Troponin (high-sensitivity)", "unit": "ng/L", "normal_range": "<14", "low_critical": "N/A", "high_critical": ">100", "category": "Cardiac", "low_meaning": "No myocardial injury", "high_meaning": "Myocardial injury - ?ACS, PE, myocarditis", "nursing": "Serial troponins, ECG, assess chest pain, cardiology review"},
    {"id": "bnp", "name": "BNP / NT-proBNP", "unit": "pg/mL", "normal_range": "BNP <100, NT-proBNP <300", "low_critical": "N/A", "high_critical": ">900", "category": "Cardiac", "low_meaning": "Heart failure unlikely", "high_meaning": "Heart failure likely, volume overload", "nursing": "Assess for fluid overload, daily weights, fluid restriction"},
    {"id": "ph", "name": "pH (arterial)", "unit": "", "normal_range": "7.35-7.45", "low_critical": "<7.2", "high_critical": ">7.6", "category": "ABG", "low_meaning": "Acidaemia - metabolic or respiratory", "high_meaning": "Alkalaemia - metabolic or respiratory", "nursing": "Interpret with PaCO2 and HCO3, identify cause, support ventilation"},
    {"id": "paco2", "name": "PaCO2", "unit": "mmHg", "normal_range": "35-45", "low_critical": "<20", "high_critical": ">60", "category": "ABG", "low_meaning": "Respiratory alkalosis (hyperventilation)", "high_meaning": "Respiratory acidosis (hypoventilation)", "nursing": "Assess respiratory rate, depth, airway patency"},
    {"id": "pao2", "name": "PaO2", "unit": "mmHg", "normal_range": "80-100", "low_critical": "<60", "high_critical": "N/A", "category": "ABG", "low_meaning": "Hypoxaemia - respiratory failure", "high_meaning": "N/A (oxygen toxicity rare)", "nursing": "Increase FiO2, assess for respiratory distress, may need NIV/intubation"},
    {"id": "lactate", "name": "Lactate", "unit": "mmol/L", "normal_range": "<2.0", "low_critical": "N/A", "high_critical": ">4", "category": "Metabolic", "low_meaning": "Normal tissue perfusion", "high_meaning": "Tissue hypoperfusion - sepsis, shock", "nursing": "Fluid resuscitation, identify cause (sepsis, ischaemia), serial monitoring"},
    {"id": "albumin", "name": "Albumin", "unit": "g/L", "normal_range": "35-50", "low_critical": "<20", "high_critical": "N/A", "category": "LFT", "low_meaning": "Malnutrition, liver disease, inflammation", "high_meaning": "Dehydration", "nursing": "Assess nutritional status, correct calcium for albumin level"},
    {"id": "bilirubin", "name": "Bilirubin (total)", "unit": "μmol/L", "normal_range": "<20", "low_critical": "N/A", "high_critical": ">100", "category": "LFT", "low_meaning": "N/A", "high_meaning": "Jaundice - liver disease, haemolysis, obstruction", "nursing": "Assess for jaundice, dark urine, pale stools"},
    {"id": "alt", "name": "ALT", "unit": "U/L", "normal_range": "<40", "low_critical": "N/A", "high_critical": ">1000", "category": "LFT", "low_meaning": "N/A", "high_meaning": "Hepatocellular injury - hepatitis, drugs", "nursing": "Review hepatotoxic medications, viral hepatitis screen"},
    {"id": "alp", "name": "ALP", "unit": "U/L", "normal_range": "30-120", "low_critical": "N/A", "high_critical": ">500", "category": "LFT", "low_meaning": "N/A", "high_meaning": "Cholestasis, bone disease", "nursing": "Differentiate liver vs bone source (GGT helps)"},
    {"id": "crp", "name": "CRP", "unit": "mg/L", "normal_range": "<5", "low_critical": "N/A", "high_critical": ">100", "category": "Inflammatory", "low_meaning": "No significant inflammation", "high_meaning": "Infection, inflammation, tissue injury", "nursing": "Monitor trend, identify source of infection/inflammation"},
    {"id": "tsh", "name": "TSH", "unit": "mU/L", "normal_range": "0.4-4.0", "low_critical": "<0.1", "high_critical": ">10", "category": "Thyroid", "low_meaning": "Hyperthyroidism or pituitary disease", "high_meaning": "Hypothyroidism", "nursing": "Check T3/T4, assess for thyroid symptoms, medication review"},
]

EMERGENCY_CARDS = [
    {
        "id": "cardiac-arrest-adult",
        "title": "Cardiac Arrest (Adult)",
        "category": "cardiac",
        "color": "#EF4444",
        "recognition": ["Unresponsive", "Not breathing normally (gasping/agonal breaths)", "No pulse (carotid check ≤10 seconds)"],
        "immediate_actions": ["Call for help / activate emergency response (MET call)", "Call 000 if in community", "Start CPR: 30 compressions : 2 breaths", "Compression rate: 100-120/min, depth: 5-6cm", "Apply AED as soon as available, follow prompts", "Minimise interruptions to compressions"],
        "medications": ["Adrenaline 1mg IV/IO every 3-5 minutes", "Amiodarone 300mg IV for VF/pVT (then 150mg)", "Consider reversible causes: 4Hs and 4Ts"],
        "nursing_role": ["High-quality CPR with minimal interruptions", "Prepare and administer medications as directed", "Document times, drugs given, rhythm changes", "Coordinate team roles, manage airway if trained", "Post-ROSC: monitor closely, prevent re-arrest"],
        "escalation": "Activate MET/Code Blue. Prepare for advanced airway. Continue until ROSC, medical directive to cease, or handover to paramedics.",
        "source": "Australian Resuscitation Council (ARC) Guidelines 2021"
    },
    {
        "id": "anaphylaxis",
        "title": "Anaphylaxis",
        "category": "allergy",
        "color": "#F97316",
        "recognition": ["Sudden onset after allergen exposure", "Skin: urticaria, flushing, angioedema", "Respiratory: wheeze, stridor, SOB, throat tightness", "Cardiovascular: hypotension, tachycardia, collapse", "GI: abdominal pain, vomiting"],
        "immediate_actions": ["Remove allergen if possible", "Lay patient flat (elevate legs if hypotensive)", "If respiratory distress: sit up supported", "Give IM Adrenaline into lateral thigh", "Adult: 0.5mg (0.5mL of 1:1000)", "Child: 0.01mg/kg (max 0.5mg)", "Repeat every 5 minutes if no improvement", "Call for help / 000"],
        "medications": ["Adrenaline 1:1000 IM (first-line, life-saving)", "Oxygen high flow", "IV fluids for persistent hypotension", "Antihistamines (secondary, not life-saving)", "Corticosteroids (may prevent biphasic reaction)"],
        "nursing_role": ["Recognise signs early and act fast", "Administer adrenaline without delay", "Monitor vitals continuously", "Prepare for repeat adrenaline doses", "Document allergen, times, response", "Observe minimum 4 hours (biphasic risk)"],
        "escalation": "If not responding after 2-3 doses adrenaline, call MET. Consider IV adrenaline infusion (ICU setting only).",
        "source": "ASCIA Anaphylaxis Guidelines 2021"
    },
    {
        "id": "stroke-befast",
        "title": "Stroke (BE-FAST)",
        "category": "neuro",
        "color": "#3B82F6",
        "recognition": ["B - Balance: sudden loss of balance, coordination", "E - Eyes: sudden vision changes, double vision", "F - Face: facial droop (ask to smile)", "A - Arms: arm weakness (drift test)", "S - Speech: slurred or confused speech", "T - Time: note time of symptom onset (critical!)"],
        "immediate_actions": ["Call 000 immediately - time critical!", "Note exact time symptoms started", "Keep patient still, do not give food/water", "Check BSL (hypoglycaemia can mimic stroke)", "Prepare for CT scan", "Thrombolysis window: 4.5 hours from onset", "Thrombectomy window: up to 24 hours in some cases"],
        "medications": ["Alteplase (tPA) IV thrombolysis if eligible", "Aspirin 300mg after CT excludes haemorrhage", "Antihypertensives avoided acutely unless severe"],
        "nursing_role": ["Rapid neuro assessment (NIHSS if trained)", "Document symptom onset time precisely", "NBM until swallow screen completed", "Frequent neuro obs post-thrombolysis", "Monitor for haemorrhagic transformation"],
        "escalation": "Urgent stroke team/neurology review. If deteriorating: repeat CT, MET call.",
        "source": "Stroke Foundation Australia Clinical Guidelines"
    },
    {
        "id": "sepsis",
        "title": "Sepsis / Septic Shock",
        "category": "infection",
        "color": "#EF4444",
        "recognition": ["Suspected or confirmed infection PLUS:", "qSOFA ≥2: RR≥22, altered mentation, SBP≤100", "SIRS criteria: Temp >38 or <36, HR>90, RR>20, WCC abnormal", "Signs: fever/hypothermia, tachycardia, hypotension, confusion, mottled skin, poor urine output"],
        "immediate_actions": ["Recognise early - Sepsis kills fast", "Sepsis 6 within 1 hour:", "1. Give high-flow oxygen", "2. Take blood cultures (before antibiotics)", "3. Give IV antibiotics (broad spectrum)", "4. Give IV fluid bolus (30mL/kg crystalloid)", "5. Check lactate level", "6. Monitor urine output (catheterise if needed)"],
        "medications": ["Broad-spectrum IV antibiotics ASAP", "IV crystalloid fluids (Hartmann's or 0.9% saline)", "Vasopressors (noradrenaline) if fluid-refractory shock", "Consider corticosteroids in refractory shock"],
        "nursing_role": ["Recognise deterioration early", "Escalate immediately - don't wait", "Ensure bloods and cultures taken before antibiotics", "Rapid IV access, fluid resuscitation", "Frequent observations (NEWS2 scoring)", "Monitor lactate clearance", "Document all interventions and times"],
        "escalation": "MET call if not responding to initial resuscitation. ICU review for vasopressor support.",
        "source": "Surviving Sepsis Campaign 2021, Australian Sepsis Network"
    },
    {
        "id": "hypoglycaemia",
        "title": "Hypoglycaemia",
        "category": "metabolic",
        "color": "#F59E0B",
        "recognition": ["BSL < 4.0 mmol/L", "Mild: tremor, sweating, hunger, pallor, palpitations", "Moderate: confusion, difficulty concentrating, behaviour change", "Severe: unconscious, seizures, unable to self-treat"],
        "immediate_actions": ["Check BSL to confirm", "If conscious and able to swallow:", "Give 15-20g fast-acting glucose:", "- 150mL fruit juice or soft drink (not diet)", "- 6-7 jellybeans", "- 3 teaspoons sugar/honey", "Recheck BSL in 15 minutes", "If still <4.0, repeat glucose", "Once >4.0, give long-acting carb (sandwich, biscuits)"],
        "medications": ["Oral glucose (first line if conscious)", "Glucagon 1mg IM/SC if unconscious and no IV access", "IV Glucose 50% 25-50mL if IV access available", "Review diabetes medications, adjust as needed"],
        "nursing_role": ["Recognise early signs - especially in those who can't communicate", "Act fast - brain needs glucose", "Stay with patient until BSL stable >4.0", "Investigate cause (missed meal, excess insulin, illness)", "Document episode and notify medical team", "Educate patient on prevention"],
        "escalation": "If not responding to treatment, prolonged unconsciousness, or seizures - MET call.",
        "source": "Australian Diabetes Society Guidelines"
    },
    {
        "id": "acs",
        "title": "Acute Coronary Syndrome",
        "category": "cardiac",
        "color": "#EF4444",
        "recognition": ["Central chest pain/pressure (may radiate to arm, jaw, back)", "Associated symptoms: SOB, sweating, nausea, pallor", "Risk factors: diabetes, hypertension, smoking, family history", "Atypical presentation common in women, elderly, diabetics"],
        "immediate_actions": ["Call for help / 000", "Sit patient up (semi-recumbent)", "Give Aspirin 300mg (chewed)", "Give GTN spray/tablet sublingual (if SBP >90)", "Obtain 12-lead ECG within 10 minutes", "Establish IV access", "Continuous cardiac monitoring", "Pain assessment and analgesia"],
        "medications": ["Aspirin 300mg (antiplatelet)", "GTN sublingual (vasodilator) - repeat x3", "Morphine 2.5-5mg IV for pain (with antiemetic)", "Oxygen if SpO2 <94%", "Heparin (per protocol)", "Consider dual antiplatelet therapy"],
        "nursing_role": ["Rapid ECG acquisition and interpretation", "Continuous cardiac monitoring", "Pain assessment using numeric scale", "IV access and bloods (troponin, FBC, U&E)", "Prepare for potential deterioration", "Calm and reassure patient"],
        "escalation": "STEMI → Cath lab activation. NSTEMI/UA → Cardiology review. VF/VT → defibrillation.",
        "source": "National Heart Foundation of Australia Guidelines"
    },
    {
        "id": "seizures",
        "title": "Seizures / Status Epilepticus",
        "category": "neuro",
        "color": "#8B5CF6",
        "recognition": ["Generalised tonic-clonic: stiffening then jerking", "Focal: localised motor activity, may spread", "Absence: staring, unresponsive", "Status epilepticus: seizure >5 min or repeated without recovery"],
        "immediate_actions": ["Note time seizure started", "Protect from injury - clear area, pad head", "DO NOT restrain or put anything in mouth", "Position on side (recovery) when convulsions stop", "Maintain airway, give oxygen", "If >5 minutes: treat as status epilepticus"],
        "medications": ["Midazolam 10mg IM/buccal (first line)", "Lorazepam 4mg IV (if access available)", "If ongoing: Phenytoin 20mg/kg IV or Levetiracetam", "Thiamine if alcohol withdrawal suspected", "Glucose if hypoglycaemia suspected"],
        "nursing_role": ["Time the seizure accurately", "Ensure safety - prevent injury", "Observe and document seizure characteristics", "Post-ictal: maintain airway, recovery position", "Reassure patient when conscious", "Monitor for recurrence"],
        "escalation": "Status epilepticus >5 min → MET call. Refractory status → ICU.",
        "source": "Epilepsy Australia Guidelines"
    },
    {
        "id": "respiratory-distress",
        "title": "Acute Respiratory Distress",
        "category": "respiratory",
        "color": "#3B82F6",
        "recognition": ["Increased respiratory rate (>20/min)", "Use of accessory muscles", "Nasal flaring, tracheal tug", "Cyanosis (late sign)", "Inability to speak in full sentences", "SpO2 <94% on room air", "Tripod positioning"],
        "immediate_actions": ["Sit patient upright", "High-flow oxygen via mask", "Call for help / MET", "Obtain IV access", "Attach cardiac monitor", "Obtain ABG if able", "Prepare for NIV or intubation"],
        "medications": ["Oxygen (titrate to SpO2 94-98%)", "Salbutamol nebuliser if wheeze", "Ipratropium if COPD", "IV hydrocortisone if asthma/COPD", "Furosemide if pulmonary oedema", "Antibiotics if infection suspected"],
        "nursing_role": ["Position patient optimally", "Continuous SpO2 monitoring", "Assist with nebulisers", "Prepare emergency equipment", "Reassure patient (anxiety worsens SOB)", "Document response to treatment"],
        "escalation": "Deteriorating despite treatment → MET call. May need NIV, intubation, or ICU.",
        "source": "Australian and New Zealand Thoracic Society Guidelines"
    },
]

ABBREVIATIONS = [
    {"abbr": "ABG", "meaning": "Arterial Blood Gas", "category": "Diagnostics"},
    {"abbr": "ACS", "meaning": "Acute Coronary Syndrome", "category": "Cardiac"},
    {"abbr": "ADL", "meaning": "Activities of Daily Living", "category": "Assessment"},
    {"abbr": "AF", "meaning": "Atrial Fibrillation", "category": "Cardiac"},
    {"abbr": "AHPRA", "meaning": "Australian Health Practitioner Regulation Agency", "category": "Regulatory"},
    {"abbr": "AKI", "meaning": "Acute Kidney Injury", "category": "Renal"},
    {"abbr": "ARC", "meaning": "Australian Resuscitation Council", "category": "Emergency"},
    {"abbr": "ASCIA", "meaning": "Australasian Society of Clinical Immunology and Allergy", "category": "Allergy"},
    {"abbr": "BD", "meaning": "Twice Daily (bis die)", "category": "Prescription"},
    {"abbr": "BGL", "meaning": "Blood Glucose Level", "category": "Metabolic"},
    {"abbr": "BMI", "meaning": "Body Mass Index", "category": "Assessment"},
    {"abbr": "BP", "meaning": "Blood Pressure", "category": "Vitals"},
    {"abbr": "BSL", "meaning": "Blood Sugar Level", "category": "Metabolic"},
    {"abbr": "CAUTI", "meaning": "Catheter-Associated Urinary Tract Infection", "category": "Infection"},
    {"abbr": "CCF", "meaning": "Congestive Cardiac Failure", "category": "Cardiac"},
    {"abbr": "CKD", "meaning": "Chronic Kidney Disease", "category": "Renal"},
    {"abbr": "CNS", "meaning": "Central Nervous System", "category": "Neuro"},
    {"abbr": "COPD", "meaning": "Chronic Obstructive Pulmonary Disease", "category": "Respiratory"},
    {"abbr": "CPR", "meaning": "Cardiopulmonary Resuscitation", "category": "Emergency"},
    {"abbr": "CVA", "meaning": "Cerebrovascular Accident (Stroke)", "category": "Neuro"},
    {"abbr": "DKA", "meaning": "Diabetic Ketoacidosis", "category": "Metabolic"},
    {"abbr": "DVT", "meaning": "Deep Vein Thrombosis", "category": "Vascular"},
    {"abbr": "ECG", "meaning": "Electrocardiogram", "category": "Cardiac"},
    {"abbr": "ED", "meaning": "Emergency Department", "category": "General"},
    {"abbr": "eGFR", "meaning": "Estimated Glomerular Filtration Rate", "category": "Renal"},
    {"abbr": "EN", "meaning": "Enrolled Nurse", "category": "Professional"},
    {"abbr": "FBC", "meaning": "Full Blood Count", "category": "Diagnostics"},
    {"abbr": "GCS", "meaning": "Glasgow Coma Scale", "category": "Neuro"},
    {"abbr": "GI", "meaning": "Gastrointestinal", "category": "GI"},
    {"abbr": "GTN", "meaning": "Glyceryl Trinitrate", "category": "Medications"},
    {"abbr": "Hb", "meaning": "Haemoglobin", "category": "Haematology"},
    {"abbr": "HHS", "meaning": "Hyperosmolar Hyperglycaemic State", "category": "Metabolic"},
    {"abbr": "HR", "meaning": "Heart Rate", "category": "Vitals"},
    {"abbr": "IM", "meaning": "Intramuscular", "category": "Administration"},
    {"abbr": "INR", "meaning": "International Normalised Ratio", "category": "Coagulation"},
    {"abbr": "IV", "meaning": "Intravenous", "category": "Administration"},
    {"abbr": "LFT", "meaning": "Liver Function Tests", "category": "Diagnostics"},
    {"abbr": "MET", "meaning": "Medical Emergency Team", "category": "Emergency"},
    {"abbr": "MI", "meaning": "Myocardial Infarction", "category": "Cardiac"},
    {"abbr": "NBM", "meaning": "Nil By Mouth", "category": "Orders"},
    {"abbr": "NEWS", "meaning": "National Early Warning Score", "category": "Assessment"},
    {"abbr": "NG", "meaning": "Nasogastric", "category": "GI"},
    {"abbr": "NIV", "meaning": "Non-Invasive Ventilation", "category": "Respiratory"},
    {"abbr": "NMBA", "meaning": "Nursing and Midwifery Board of Australia", "category": "Regulatory"},
    {"abbr": "NOK", "meaning": "Next of Kin", "category": "General"},
    {"abbr": "NSTEMI", "meaning": "Non-ST Elevation Myocardial Infarction", "category": "Cardiac"},
    {"abbr": "OD", "meaning": "Once Daily (omne die)", "category": "Prescription"},
    {"abbr": "PBS", "meaning": "Pharmaceutical Benefits Scheme", "category": "Medications"},
    {"abbr": "PE", "meaning": "Pulmonary Embolism", "category": "Respiratory"},
    {"abbr": "PO", "meaning": "Per Oral (by mouth)", "category": "Administration"},
    {"abbr": "PRN", "meaning": "As Required (pro re nata)", "category": "Prescription"},
    {"abbr": "QID", "meaning": "Four Times Daily", "category": "Prescription"},
    {"abbr": "RN", "meaning": "Registered Nurse", "category": "Professional"},
    {"abbr": "ROM", "meaning": "Range of Motion", "category": "Musculoskeletal"},
    {"abbr": "ROSC", "meaning": "Return of Spontaneous Circulation", "category": "Emergency"},
    {"abbr": "RR", "meaning": "Respiratory Rate", "category": "Vitals"},
    {"abbr": "S4", "meaning": "Schedule 4 (Prescription Only)", "category": "Medications"},
    {"abbr": "S8", "meaning": "Schedule 8 (Controlled Drug)", "category": "Medications"},
    {"abbr": "SBAR", "meaning": "Situation, Background, Assessment, Recommendation", "category": "Communication"},
    {"abbr": "SC", "meaning": "Subcutaneous", "category": "Administration"},
    {"abbr": "SIRS", "meaning": "Systemic Inflammatory Response Syndrome", "category": "Infection"},
    {"abbr": "SOB", "meaning": "Shortness of Breath", "category": "Respiratory"},
    {"abbr": "SpO2", "meaning": "Oxygen Saturation", "category": "Vitals"},
    {"abbr": "STAT", "meaning": "Immediately", "category": "Orders"},
    {"abbr": "STEMI", "meaning": "ST Elevation Myocardial Infarction", "category": "Cardiac"},
    {"abbr": "TDS", "meaning": "Three Times Daily (ter die sumendum)", "category": "Prescription"},
    {"abbr": "TGA", "meaning": "Therapeutic Goods Administration", "category": "Regulatory"},
    {"abbr": "TIA", "meaning": "Transient Ischaemic Attack", "category": "Neuro"},
    {"abbr": "tPA", "meaning": "Tissue Plasminogen Activator", "category": "Medications"},
    {"abbr": "U&E", "meaning": "Urea and Electrolytes", "category": "Diagnostics"},
    {"abbr": "UTI", "meaning": "Urinary Tract Infection", "category": "Infection"},
    {"abbr": "VF", "meaning": "Ventricular Fibrillation", "category": "Cardiac"},
    {"abbr": "VT", "meaning": "Ventricular Tachycardia", "category": "Cardiac"},
    {"abbr": "WCC", "meaning": "White Cell Count", "category": "Haematology"},
]

CALCULATORS_INFO = [
    {"id": "drug-dose", "name": "Drug Dose Calculator", "description": "Calculate required dose from stock strength", "formula": "Dose Required = (Dose Ordered ÷ Stock Strength) × Volume", "icon": "Pill"},
    {"id": "iv-drip", "name": "IV Drip Rate Calculator", "description": "Calculate drops per minute", "formula": "Drip Rate = (Volume × Drop Factor) ÷ Time in minutes", "icon": "Droplet"},
    {"id": "infusion-rate", "name": "Infusion Rate Calculator", "description": "Calculate mL/hr from mcg/kg/min", "formula": "Rate = (Dose × Weight × 60) ÷ Concentration", "icon": "Activity"},
    {"id": "weight-based", "name": "Weight-Based Dose", "description": "Calculate dose from mg/kg", "formula": "Dose = mg/kg × Weight", "icon": "Scale"},
    {"id": "bmi", "name": "BMI Calculator", "description": "Body Mass Index with Australian ranges", "formula": "BMI = Weight (kg) ÷ Height² (m²)", "icon": "Scale"},
    {"id": "gcs", "name": "Glasgow Coma Scale", "description": "Interactive neurological assessment", "formula": "GCS = Eye + Verbal + Motor (3-15)", "icon": "Brain"},
    {"id": "news2", "name": "NEWS2 Score", "description": "National Early Warning Score 2", "formula": "Sum of 7 physiological parameters", "icon": "Activity"},
    {"id": "curb65", "name": "CURB-65 Score", "description": "Pneumonia severity assessment", "formula": "Confusion + Urea + RR + BP + Age ≥65", "icon": "Wind"},
    {"id": "wells-dvt", "name": "Wells Score (DVT)", "description": "DVT probability assessment", "formula": "Clinical prediction score", "icon": "Heart"},
    {"id": "wells-pe", "name": "Wells Score (PE)", "description": "PE probability assessment", "formula": "Clinical prediction score", "icon": "Wind"},
    {"id": "apgar", "name": "APGAR Score", "description": "Newborn assessment at 1 & 5 min", "formula": "Appearance + Pulse + Grimace + Activity + Respiration", "icon": "Baby"},
    {"id": "gfr", "name": "eGFR/CrCl Calculator", "description": "Cockcroft-Gault for renal dosing", "formula": "CrCl = [(140-age) × weight × constant] ÷ creatinine", "icon": "Droplets"},
    {"id": "parkland", "name": "Fluid Replacement (Burns)", "description": "Parkland formula for burns resuscitation", "formula": "Fluid = 4mL × weight (kg) × %TBSA", "icon": "Flame"},
    {"id": "paeds-weight", "name": "Paediatric Weight Estimator", "description": "Estimate weight from age", "formula": "Weight (kg) = (Age × 2) + 8", "icon": "Baby"},
    {"id": "unit-converter", "name": "Unit Converter", "description": "Convert common clinical units", "formula": "Various conversions", "icon": "ArrowLeftRight"},
]

BODY_SYSTEMS = [
    {"id": "cardiovascular", "name": "Cardiovascular System", "icon": "Heart", "description": "Heart and blood vessels", "overview": "Pumps blood throughout body, delivers oxygen and nutrients, removes waste products.", "key_structures": ["Heart (4 chambers)", "Arteries", "Veins", "Capillaries"], "common_conditions": ["Hypertension", "Heart failure", "Coronary artery disease", "Arrhythmias", "DVT/PE"], "related_drugs": ["Beta blockers", "ACE inhibitors", "Anticoagulants", "Diuretics"]},
    {"id": "respiratory", "name": "Respiratory System", "icon": "Wind", "description": "Lungs and airways", "overview": "Gas exchange - oxygen in, carbon dioxide out. Essential for cellular respiration.", "key_structures": ["Trachea", "Bronchi", "Bronchioles", "Alveoli", "Diaphragm"], "common_conditions": ["Asthma", "COPD", "Pneumonia", "Pulmonary embolism", "Lung cancer"], "related_drugs": ["Bronchodilators", "Inhaled corticosteroids", "Antibiotics", "Oxygen therapy"]},
    {"id": "neurological", "name": "Neurological System", "icon": "Brain", "description": "Brain, spinal cord, nerves", "overview": "Controls all body functions, processes sensory information, enables thought and movement.", "key_structures": ["Brain", "Spinal cord", "Peripheral nerves", "Cranial nerves"], "common_conditions": ["Stroke", "Epilepsy", "Parkinson's", "Multiple sclerosis", "Dementia"], "related_drugs": ["Anticonvulsants", "Dopamine agonists", "Antidepressants", "Analgesics"]},
    {"id": "renal", "name": "Renal/Urinary System", "icon": "Droplets", "description": "Kidneys and urinary tract", "overview": "Filters blood, regulates fluid and electrolyte balance, excretes waste as urine.", "key_structures": ["Kidneys", "Ureters", "Bladder", "Urethra", "Nephrons"], "common_conditions": ["Acute kidney injury", "Chronic kidney disease", "UTI", "Kidney stones", "Incontinence"], "related_drugs": ["Diuretics", "ACE inhibitors", "Phosphate binders", "EPO"]},
    {"id": "gastrointestinal", "name": "Gastrointestinal System", "icon": "Utensils", "description": "Digestive tract", "overview": "Digests food, absorbs nutrients, eliminates waste. Includes accessory organs liver and pancreas.", "key_structures": ["Mouth", "Oesophagus", "Stomach", "Small intestine", "Large intestine", "Liver", "Pancreas"], "common_conditions": ["GORD", "Peptic ulcer", "IBD", "Cirrhosis", "Bowel obstruction"], "related_drugs": ["PPIs", "Antiemetics", "Laxatives", "Antidiarrhoeals"]},
    {"id": "endocrine", "name": "Endocrine System", "icon": "Zap", "description": "Hormones and glands", "overview": "Produces hormones that regulate metabolism, growth, reproduction, and homeostasis.", "key_structures": ["Pituitary", "Thyroid", "Adrenals", "Pancreas (islets)", "Gonads"], "common_conditions": ["Diabetes mellitus", "Hypothyroidism", "Hyperthyroidism", "Addison's", "Cushing's"], "related_drugs": ["Insulin", "Oral hypoglycemics", "Thyroxine", "Corticosteroids"]},
    {"id": "musculoskeletal", "name": "Musculoskeletal System", "icon": "Bone", "description": "Bones, muscles, joints", "overview": "Provides structure, movement, and protection. Stores minerals and produces blood cells.", "key_structures": ["Bones", "Muscles", "Joints", "Ligaments", "Tendons"], "common_conditions": ["Osteoarthritis", "Osteoporosis", "Fractures", "Rheumatoid arthritis", "Back pain"], "related_drugs": ["NSAIDs", "Bisphosphonates", "Muscle relaxants", "DMARDs"]},
    {"id": "integumentary", "name": "Integumentary System", "icon": "Hand", "description": "Skin, hair, nails", "overview": "Protects against infection, regulates temperature, provides sensation.", "key_structures": ["Epidermis", "Dermis", "Subcutaneous tissue", "Hair follicles", "Sweat glands"], "common_conditions": ["Pressure injuries", "Wounds", "Burns", "Dermatitis", "Skin infections"], "related_drugs": ["Topical antibiotics", "Corticosteroid creams", "Wound dressings", "Emollients"]},
]

MEDICAL_TERMS = [
    {"term": "Tachycardia", "definition": "Heart rate above 100 beats per minute in adults", "prefix": "tachy-", "prefix_meaning": "fast", "root": "cardi", "root_meaning": "heart", "suffix": "-ia", "suffix_meaning": "condition", "example": "The patient presented with tachycardia after the fever spike.", "system": "Cardiovascular"},
    {"term": "Bradycardia", "definition": "Heart rate below 60 beats per minute in adults", "prefix": "brady-", "prefix_meaning": "slow", "root": "cardi", "root_meaning": "heart", "suffix": "-ia", "suffix_meaning": "condition", "example": "Beta blockers can cause bradycardia.", "system": "Cardiovascular"},
    {"term": "Tachypnoea", "definition": "Abnormally rapid breathing rate, typically above 20 breaths per minute", "prefix": "tachy-", "prefix_meaning": "fast", "root": "pnoe", "root_meaning": "breathing", "suffix": "-a", "suffix_meaning": "condition", "example": "Tachypnoea is an early sign of respiratory distress.", "system": "Respiratory"},
    {"term": "Bradypnoea", "definition": "Abnormally slow breathing rate, typically below 12 breaths per minute", "prefix": "brady-", "prefix_meaning": "slow", "root": "pnoe", "root_meaning": "breathing", "suffix": "-a", "suffix_meaning": "condition", "example": "Opioid overdose can cause severe bradypnoea.", "system": "Respiratory"},
    {"term": "Dyspnoea", "definition": "Difficulty breathing or shortness of breath", "prefix": "dys-", "prefix_meaning": "difficult", "root": "pnoe", "root_meaning": "breathing", "suffix": "-a", "suffix_meaning": "condition", "example": "The patient reported dyspnoea on exertion.", "system": "Respiratory"},
    {"term": "Apnoea", "definition": "Temporary cessation of breathing", "prefix": "a-", "prefix_meaning": "without", "root": "pnoe", "root_meaning": "breathing", "suffix": "-a", "suffix_meaning": "condition", "example": "Sleep apnoea causes repeated episodes of breathing cessation.", "system": "Respiratory"},
    {"term": "Hypoxia", "definition": "Deficiency of oxygen reaching the tissues", "prefix": "hypo-", "prefix_meaning": "below/under", "root": "ox", "root_meaning": "oxygen", "suffix": "-ia", "suffix_meaning": "condition", "example": "Hypoxia can lead to confusion and altered consciousness.", "system": "Respiratory"},
    {"term": "Hypoxaemia", "definition": "Low oxygen level in the blood (PaO2 <60mmHg)", "prefix": "hypo-", "prefix_meaning": "below/under", "root": "ox", "root_meaning": "oxygen", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Hypoxaemia requires supplemental oxygen therapy.", "system": "Respiratory"},
    {"term": "Hypercapnia", "definition": "Elevated carbon dioxide level in the blood (PaCO2 >45mmHg)", "prefix": "hyper-", "prefix_meaning": "above/excess", "root": "capn", "root_meaning": "carbon dioxide", "suffix": "-ia", "suffix_meaning": "condition", "example": "COPD patients may develop chronic hypercapnia.", "system": "Respiratory"},
    {"term": "Hypoglycaemia", "definition": "Abnormally low blood glucose level, typically below 4.0 mmol/L", "prefix": "hypo-", "prefix_meaning": "below/under", "root": "glyc", "root_meaning": "sugar", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "The diabetic patient experienced hypoglycaemia after missing lunch.", "system": "Metabolic"},
    {"term": "Hyperglycaemia", "definition": "Abnormally high blood glucose level, typically above 11.0 mmol/L", "prefix": "hyper-", "prefix_meaning": "above/excess", "root": "glyc", "root_meaning": "sugar", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Hyperglycaemia is a hallmark of uncontrolled diabetes.", "system": "Metabolic"},
    {"term": "Hyponatraemia", "definition": "Low sodium level in the blood (<135 mmol/L)", "prefix": "hypo-", "prefix_meaning": "below/under", "root": "natr", "root_meaning": "sodium", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Hyponatraemia can cause confusion and seizures.", "system": "Metabolic"},
    {"term": "Hypernatraemia", "definition": "High sodium level in the blood (>145 mmol/L)", "prefix": "hyper-", "prefix_meaning": "above/excess", "root": "natr", "root_meaning": "sodium", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Dehydration often causes hypernatraemia.", "system": "Metabolic"},
    {"term": "Hypokalaemia", "definition": "Low potassium level in the blood (<3.5 mmol/L)", "prefix": "hypo-", "prefix_meaning": "below/under", "root": "kal", "root_meaning": "potassium", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Diuretics can cause hypokalaemia.", "system": "Metabolic"},
    {"term": "Hyperkalaemia", "definition": "High potassium level in the blood (>5.0 mmol/L)", "prefix": "hyper-", "prefix_meaning": "above/excess", "root": "kal", "root_meaning": "potassium", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Hyperkalaemia can cause life-threatening arrhythmias.", "system": "Metabolic"},
    {"term": "Dysphagia", "definition": "Difficulty swallowing food or liquids", "prefix": "dys-", "prefix_meaning": "difficult/painful", "root": "phag", "root_meaning": "eating/swallowing", "suffix": "-ia", "suffix_meaning": "condition", "example": "Post-stroke patients often require swallow assessments due to dysphagia risk.", "system": "GI"},
    {"term": "Dysuria", "definition": "Painful or difficult urination", "prefix": "dys-", "prefix_meaning": "difficult/painful", "root": "ur", "root_meaning": "urine", "suffix": "-ia", "suffix_meaning": "condition", "example": "Dysuria is a common symptom of urinary tract infection.", "system": "Renal"},
    {"term": "Polyuria", "definition": "Excessive production of urine (>3L per day)", "prefix": "poly-", "prefix_meaning": "many/much", "root": "ur", "root_meaning": "urine", "suffix": "-ia", "suffix_meaning": "condition", "example": "Polyuria can indicate diabetes mellitus or diabetes insipidus.", "system": "Renal"},
    {"term": "Oliguria", "definition": "Reduced urine output, typically less than 400mL per 24 hours or <0.5mL/kg/hr", "prefix": "olig-", "prefix_meaning": "few/little", "root": "ur", "root_meaning": "urine", "suffix": "-ia", "suffix_meaning": "condition", "example": "Oliguria in acute kidney injury requires urgent fluid assessment.", "system": "Renal"},
    {"term": "Anuria", "definition": "Absence of urine production (<100mL per 24 hours)", "prefix": "an-", "prefix_meaning": "without", "root": "ur", "root_meaning": "urine", "suffix": "-ia", "suffix_meaning": "condition", "example": "Anuria indicates severe kidney failure or urinary obstruction.", "system": "Renal"},
    {"term": "Haematuria", "definition": "Presence of blood in the urine", "prefix": "haemat-", "prefix_meaning": "blood", "root": "ur", "root_meaning": "urine", "suffix": "-ia", "suffix_meaning": "condition", "example": "Macroscopic haematuria was noted on catheter insertion.", "system": "Renal"},
    {"term": "Proteinuria", "definition": "Presence of excess protein in the urine", "prefix": "", "prefix_meaning": "", "root": "protein", "root_meaning": "protein", "suffix": "-uria", "suffix_meaning": "urine condition", "example": "Proteinuria is a sign of kidney damage.", "system": "Renal"},
    {"term": "Hepatomegaly", "definition": "Abnormal enlargement of the liver", "prefix": "hepato-", "prefix_meaning": "liver", "root": "megal", "root_meaning": "large", "suffix": "-y", "suffix_meaning": "condition/process", "example": "Right upper quadrant tenderness and hepatomegaly suggested liver pathology.", "system": "GI"},
    {"term": "Splenomegaly", "definition": "Abnormal enlargement of the spleen", "prefix": "spleno-", "prefix_meaning": "spleen", "root": "megal", "root_meaning": "large", "suffix": "-y", "suffix_meaning": "condition/process", "example": "Splenomegaly can indicate infection, liver disease, or blood disorders.", "system": "Haematology"},
    {"term": "Cardiomegaly", "definition": "Enlargement of the heart", "prefix": "cardio-", "prefix_meaning": "heart", "root": "megal", "root_meaning": "large", "suffix": "-y", "suffix_meaning": "condition/process", "example": "Chest X-ray showed cardiomegaly suggesting heart failure.", "system": "Cardiovascular"},
    {"term": "Pneumothorax", "definition": "Abnormal collection of air in the pleural space causing lung collapse", "prefix": "pneumo-", "prefix_meaning": "air/lung", "root": "thorax", "root_meaning": "chest", "suffix": "", "suffix_meaning": "", "example": "Sudden chest pain and dyspnoea raised suspicion of pneumothorax.", "system": "Respiratory"},
    {"term": "Haemothorax", "definition": "Collection of blood in the pleural space", "prefix": "haemo-", "prefix_meaning": "blood", "root": "thorax", "root_meaning": "chest", "suffix": "", "suffix_meaning": "", "example": "Haemothorax may occur following chest trauma.", "system": "Respiratory"},
    {"term": "Pneumonia", "definition": "Infection and inflammation of the lung parenchyma", "prefix": "pneumon-", "prefix_meaning": "lung", "root": "", "root_meaning": "", "suffix": "-ia", "suffix_meaning": "condition", "example": "Community-acquired pneumonia is treated with antibiotics.", "system": "Respiratory"},
    {"term": "Bronchitis", "definition": "Inflammation of the bronchi", "prefix": "bronch-", "prefix_meaning": "bronchus", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Acute bronchitis often follows a viral upper respiratory infection.", "system": "Respiratory"},
    {"term": "Arthritis", "definition": "Inflammation of a joint", "prefix": "arthr-", "prefix_meaning": "joint", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Osteoarthritis is the most common form of arthritis.", "system": "Musculoskeletal"},
    {"term": "Myocarditis", "definition": "Inflammation of the heart muscle", "prefix": "myo-", "prefix_meaning": "muscle", "root": "card", "root_meaning": "heart", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Viral myocarditis can cause heart failure.", "system": "Cardiovascular"},
    {"term": "Pericarditis", "definition": "Inflammation of the pericardium (heart sac)", "prefix": "peri-", "prefix_meaning": "around", "root": "card", "root_meaning": "heart", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Pericarditis causes sharp chest pain worse with inspiration.", "system": "Cardiovascular"},
    {"term": "Endocarditis", "definition": "Infection/inflammation of the inner heart lining", "prefix": "endo-", "prefix_meaning": "within", "root": "card", "root_meaning": "heart", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "IV drug users are at risk of infective endocarditis.", "system": "Cardiovascular"},
    {"term": "Gastritis", "definition": "Inflammation of the stomach lining", "prefix": "gastr-", "prefix_meaning": "stomach", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "NSAIDs can cause gastritis.", "system": "GI"},
    {"term": "Colitis", "definition": "Inflammation of the colon", "prefix": "col-", "prefix_meaning": "colon", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Ulcerative colitis is a form of inflammatory bowel disease.", "system": "GI"},
    {"term": "Pancreatitis", "definition": "Inflammation of the pancreas", "prefix": "pancreat-", "prefix_meaning": "pancreas", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Acute pancreatitis is commonly caused by gallstones or alcohol.", "system": "GI"},
    {"term": "Cholecystitis", "definition": "Inflammation of the gallbladder", "prefix": "cholecyst-", "prefix_meaning": "gallbladder", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Cholecystitis typically presents with right upper quadrant pain.", "system": "GI"},
    {"term": "Nephritis", "definition": "Inflammation of the kidney", "prefix": "nephr-", "prefix_meaning": "kidney", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Glomerulonephritis can cause haematuria and proteinuria.", "system": "Renal"},
    {"term": "Cystitis", "definition": "Inflammation of the bladder, usually due to infection", "prefix": "cyst-", "prefix_meaning": "bladder", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Cystitis is more common in women due to shorter urethra.", "system": "Renal"},
    {"term": "Meningitis", "definition": "Inflammation of the meninges (brain/spinal cord coverings)", "prefix": "mening-", "prefix_meaning": "meninges", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Bacterial meningitis requires urgent antibiotic treatment.", "system": "Neuro"},
    {"term": "Encephalitis", "definition": "Inflammation of the brain", "prefix": "encephal-", "prefix_meaning": "brain", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Viral encephalitis can cause altered consciousness and seizures.", "system": "Neuro"},
    {"term": "Dermatitis", "definition": "Inflammation of the skin", "prefix": "dermat-", "prefix_meaning": "skin", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Contact dermatitis is caused by skin irritants or allergens.", "system": "Integumentary"},
    {"term": "Cellulitis", "definition": "Bacterial infection of the skin and subcutaneous tissue", "prefix": "cellul-", "prefix_meaning": "cell", "root": "", "root_meaning": "", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Cellulitis presents with redness, warmth, and swelling.", "system": "Integumentary"},
    {"term": "Osteomyelitis", "definition": "Infection/inflammation of bone", "prefix": "osteo-", "prefix_meaning": "bone", "root": "myel", "root_meaning": "marrow", "suffix": "-itis", "suffix_meaning": "inflammation", "example": "Osteomyelitis requires prolonged antibiotic therapy.", "system": "Musculoskeletal"},
    {"term": "Thrombosis", "definition": "Formation of a blood clot within a blood vessel", "prefix": "", "prefix_meaning": "", "root": "thromb", "root_meaning": "clot", "suffix": "-osis", "suffix_meaning": "condition/process", "example": "Deep vein thrombosis is a risk after surgery or immobility.", "system": "Vascular"},
    {"term": "Embolism", "definition": "Obstruction of a blood vessel by a traveling clot or debris", "prefix": "", "prefix_meaning": "", "root": "embol", "root_meaning": "plug/stopper", "suffix": "-ism", "suffix_meaning": "condition", "example": "Pulmonary embolism is a life-threatening complication of DVT.", "system": "Vascular"},
    {"term": "Ischaemia", "definition": "Inadequate blood supply to an organ or tissue", "prefix": "", "prefix_meaning": "", "root": "ischaem", "root_meaning": "hold back blood", "suffix": "-ia", "suffix_meaning": "condition", "example": "Myocardial ischaemia causes angina chest pain.", "system": "Cardiovascular"},
    {"term": "Infarction", "definition": "Death of tissue due to lack of blood supply", "prefix": "", "prefix_meaning": "", "root": "infarct", "root_meaning": "to stuff/block", "suffix": "-ion", "suffix_meaning": "process", "example": "Myocardial infarction is commonly known as a heart attack.", "system": "Cardiovascular"},
    {"term": "Stenosis", "definition": "Abnormal narrowing of a passage or opening", "prefix": "", "prefix_meaning": "", "root": "sten", "root_meaning": "narrow", "suffix": "-osis", "suffix_meaning": "condition", "example": "Aortic stenosis causes a heart murmur.", "system": "Cardiovascular"},
    {"term": "Haemorrhage", "definition": "Bleeding, loss of blood from blood vessels", "prefix": "haemo-", "prefix_meaning": "blood", "root": "rrhage", "root_meaning": "burst forth", "suffix": "", "suffix_meaning": "", "example": "Postpartum haemorrhage requires urgent management.", "system": "Haematology"},
    {"term": "Anaemia", "definition": "Deficiency of red blood cells or haemoglobin", "prefix": "an-", "prefix_meaning": "without", "root": "aem", "root_meaning": "blood", "suffix": "-ia", "suffix_meaning": "condition", "example": "Iron deficiency anaemia causes fatigue and pallor.", "system": "Haematology"},
    {"term": "Leucocytosis", "definition": "Elevated white blood cell count", "prefix": "leuco-", "prefix_meaning": "white", "root": "cyt", "root_meaning": "cell", "suffix": "-osis", "suffix_meaning": "condition", "example": "Leucocytosis indicates infection or inflammation.", "system": "Haematology"},
    {"term": "Leucopenia", "definition": "Decreased white blood cell count", "prefix": "leuco-", "prefix_meaning": "white", "root": "cyt", "root_meaning": "cell", "suffix": "-penia", "suffix_meaning": "deficiency", "example": "Chemotherapy often causes leucopenia.", "system": "Haematology"},
    {"term": "Thrombocytopenia", "definition": "Decreased platelet count", "prefix": "thrombo-", "prefix_meaning": "clot", "root": "cyt", "root_meaning": "cell", "suffix": "-penia", "suffix_meaning": "deficiency", "example": "Thrombocytopenia increases bleeding risk.", "system": "Haematology"},
    {"term": "Sepsis", "definition": "Life-threatening organ dysfunction caused by infection", "prefix": "", "prefix_meaning": "", "root": "seps", "root_meaning": "decay/putrefaction", "suffix": "-is", "suffix_meaning": "condition", "example": "Sepsis requires urgent antibiotic treatment and fluid resuscitation.", "system": "Infection"},
    {"term": "Septicaemia", "definition": "Presence of bacteria and their toxins in the blood", "prefix": "", "prefix_meaning": "", "root": "septic", "root_meaning": "infected", "suffix": "-aemia", "suffix_meaning": "blood condition", "example": "Septicaemia can rapidly progress to septic shock.", "system": "Infection"},
    {"term": "Pyrexia", "definition": "Elevated body temperature (fever), typically >38°C", "prefix": "", "prefix_meaning": "", "root": "pyr", "root_meaning": "fire/fever", "suffix": "-exia", "suffix_meaning": "condition", "example": "Pyrexia is a common sign of infection.", "system": "General"},
    {"term": "Hypothermia", "definition": "Abnormally low body temperature (<35°C)", "prefix": "hypo-", "prefix_meaning": "below", "root": "therm", "root_meaning": "heat", "suffix": "-ia", "suffix_meaning": "condition", "example": "Hypothermia can cause cardiac arrhythmias.", "system": "General"},
    {"term": "Hyperthermia", "definition": "Abnormally high body temperature not caused by fever", "prefix": "hyper-", "prefix_meaning": "above/excess", "root": "therm", "root_meaning": "heat", "suffix": "-ia", "suffix_meaning": "condition", "example": "Heat stroke causes dangerous hyperthermia.", "system": "General"},
    {"term": "Oedema", "definition": "Swelling caused by excess fluid in tissues", "prefix": "", "prefix_meaning": "", "root": "oedem", "root_meaning": "swelling", "suffix": "-a", "suffix_meaning": "condition", "example": "Peripheral oedema is common in heart failure.", "system": "General"},
    {"term": "Ascites", "definition": "Accumulation of fluid in the abdominal cavity", "prefix": "", "prefix_meaning": "", "root": "ascit", "root_meaning": "bag", "suffix": "-es", "suffix_meaning": "condition", "example": "Ascites is a complication of liver cirrhosis.", "system": "GI"},
    {"term": "Effusion", "definition": "Escape of fluid into a body cavity", "prefix": "ef-", "prefix_meaning": "out", "root": "fus", "root_meaning": "pour", "suffix": "-ion", "suffix_meaning": "process", "example": "Pleural effusion causes reduced breath sounds.", "system": "Respiratory"},
    {"term": "Atelectasis", "definition": "Collapse or incomplete expansion of lung tissue", "prefix": "atel-", "prefix_meaning": "incomplete", "root": "ectas", "root_meaning": "expansion", "suffix": "-is", "suffix_meaning": "condition", "example": "Post-operative atelectasis is prevented with deep breathing exercises.", "system": "Respiratory"},
    {"term": "Consolidation", "definition": "Lung tissue filled with fluid/exudate instead of air", "prefix": "con-", "prefix_meaning": "together", "root": "solid", "root_meaning": "solid", "suffix": "-ation", "suffix_meaning": "process", "example": "Lung consolidation on X-ray suggests pneumonia.", "system": "Respiratory"},
    {"term": "Cyanosis", "definition": "Blue discoloration of skin due to lack of oxygen", "prefix": "", "prefix_meaning": "", "root": "cyan", "root_meaning": "blue", "suffix": "-osis", "suffix_meaning": "condition", "example": "Central cyanosis indicates severe hypoxaemia.", "system": "Respiratory"},
    {"term": "Pallor", "definition": "Unusual paleness of the skin", "prefix": "", "prefix_meaning": "", "root": "pall", "root_meaning": "pale", "suffix": "-or", "suffix_meaning": "condition", "example": "Pallor may indicate anaemia or shock.", "system": "General"},
    {"term": "Jaundice", "definition": "Yellow discoloration of skin and eyes due to elevated bilirubin", "prefix": "", "prefix_meaning": "", "root": "jaun", "root_meaning": "yellow", "suffix": "-dice", "suffix_meaning": "condition", "example": "Jaundice indicates liver disease or haemolysis.", "system": "GI"},
    {"term": "Erythema", "definition": "Redness of the skin due to increased blood flow", "prefix": "", "prefix_meaning": "", "root": "erythem", "root_meaning": "redness", "suffix": "-a", "suffix_meaning": "condition", "example": "Erythema around a wound may indicate infection.", "system": "Integumentary"},
    {"term": "Ecchymosis", "definition": "Bruising; discoloration of skin from bleeding under the skin", "prefix": "ec-", "prefix_meaning": "out", "root": "chym", "root_meaning": "juice/fluid", "suffix": "-osis", "suffix_meaning": "condition", "example": "Ecchymosis may indicate trauma or bleeding disorder.", "system": "Integumentary"},
    {"term": "Petechiae", "definition": "Tiny red/purple spots from bleeding under the skin", "prefix": "", "prefix_meaning": "", "root": "petechi", "root_meaning": "spot", "suffix": "-ae", "suffix_meaning": "plural", "example": "Petechiae may indicate low platelets or sepsis.", "system": "Haematology"},
    {"term": "Pruritus", "definition": "Itching sensation of the skin", "prefix": "", "prefix_meaning": "", "root": "prurit", "root_meaning": "itch", "suffix": "-us", "suffix_meaning": "condition", "example": "Pruritus is common in liver disease and renal failure.", "system": "Integumentary"},
    {"term": "Diaphoresis", "definition": "Profuse sweating", "prefix": "dia-", "prefix_meaning": "through", "root": "phor", "root_meaning": "carry", "suffix": "-esis", "suffix_meaning": "condition", "example": "Diaphoresis often accompanies myocardial infarction.", "system": "General"},
    {"term": "Nausea", "definition": "Sensation of unease in the stomach with urge to vomit", "prefix": "", "prefix_meaning": "", "root": "nause", "root_meaning": "seasickness", "suffix": "-a", "suffix_meaning": "condition", "example": "Nausea is a common side effect of opioid medications.", "system": "GI"},
    {"term": "Emesis", "definition": "Vomiting; expulsion of stomach contents", "prefix": "", "prefix_meaning": "", "root": "emes", "root_meaning": "vomit", "suffix": "-is", "suffix_meaning": "condition", "example": "Post-operative emesis is managed with antiemetics.", "system": "GI"},
    {"term": "Haematemesis", "definition": "Vomiting blood", "prefix": "haemat-", "prefix_meaning": "blood", "root": "emes", "root_meaning": "vomit", "suffix": "-is", "suffix_meaning": "condition", "example": "Haematemesis indicates upper GI bleeding.", "system": "GI"},
    {"term": "Melaena", "definition": "Black, tarry stools indicating upper GI bleeding", "prefix": "", "prefix_meaning": "", "root": "melan", "root_meaning": "black", "suffix": "-a", "suffix_meaning": "condition", "example": "Melaena with haematemesis suggests significant upper GI bleed.", "system": "GI"},
    {"term": "Haematochezia", "definition": "Fresh red blood in stool, usually from lower GI", "prefix": "haemat-", "prefix_meaning": "blood", "root": "chez", "root_meaning": "defecate", "suffix": "-ia", "suffix_meaning": "condition", "example": "Haematochezia may indicate haemorrhoids or colorectal pathology.", "system": "GI"},
    {"term": "Constipation", "definition": "Infrequent or difficult passage of hard stool", "prefix": "con-", "prefix_meaning": "together", "root": "stip", "root_meaning": "pack/cram", "suffix": "-ation", "suffix_meaning": "process", "example": "Opioids commonly cause constipation.", "system": "GI"},
    {"term": "Diarrhoea", "definition": "Frequent passage of loose, watery stools", "prefix": "dia-", "prefix_meaning": "through", "root": "rrhoe", "root_meaning": "flow", "suffix": "-a", "suffix_meaning": "condition", "example": "Infectious diarrhoea requires fluid replacement.", "system": "GI"},
    {"term": "Dyspepsia", "definition": "Indigestion; discomfort in upper abdomen", "prefix": "dys-", "prefix_meaning": "difficult", "root": "peps", "root_meaning": "digestion", "suffix": "-ia", "suffix_meaning": "condition", "example": "Dyspepsia may be caused by gastritis or peptic ulcer.", "system": "GI"},
    {"term": "Syncope", "definition": "Temporary loss of consciousness due to decreased cerebral blood flow", "prefix": "", "prefix_meaning": "", "root": "syncop", "root_meaning": "cut short", "suffix": "-e", "suffix_meaning": "condition", "example": "Cardiac syncope requires urgent investigation.", "system": "Cardiovascular"},
    {"term": "Vertigo", "definition": "Sensation of spinning or movement when stationary", "prefix": "", "prefix_meaning": "", "root": "vertig", "root_meaning": "turning", "suffix": "-o", "suffix_meaning": "condition", "example": "Vertigo can be caused by inner ear problems.", "system": "Neuro"},
    {"term": "Ataxia", "definition": "Lack of voluntary muscle coordination", "prefix": "a-", "prefix_meaning": "without", "root": "tax", "root_meaning": "order", "suffix": "-ia", "suffix_meaning": "condition", "example": "Cerebellar ataxia causes unsteady gait.", "system": "Neuro"},
    {"term": "Aphasia", "definition": "Impairment of language ability, often from stroke", "prefix": "a-", "prefix_meaning": "without", "root": "phas", "root_meaning": "speech", "suffix": "-ia", "suffix_meaning": "condition", "example": "Expressive aphasia affects speech production.", "system": "Neuro"},
    {"term": "Dysarthria", "definition": "Difficulty articulating words due to muscle weakness", "prefix": "dys-", "prefix_meaning": "difficult", "root": "arthr", "root_meaning": "articulate", "suffix": "-ia", "suffix_meaning": "condition", "example": "Dysarthria causes slurred speech.", "system": "Neuro"},
    {"term": "Hemiplegia", "definition": "Paralysis of one side of the body", "prefix": "hemi-", "prefix_meaning": "half", "root": "pleg", "root_meaning": "paralysis", "suffix": "-ia", "suffix_meaning": "condition", "example": "Stroke can cause contralateral hemiplegia.", "system": "Neuro"},
    {"term": "Paraplegia", "definition": "Paralysis of the lower limbs", "prefix": "para-", "prefix_meaning": "beside/abnormal", "root": "pleg", "root_meaning": "paralysis", "suffix": "-ia", "suffix_meaning": "condition", "example": "Spinal cord injury can cause paraplegia.", "system": "Neuro"},
    {"term": "Quadriplegia", "definition": "Paralysis of all four limbs", "prefix": "quadri-", "prefix_meaning": "four", "root": "pleg", "root_meaning": "paralysis", "suffix": "-ia", "suffix_meaning": "condition", "example": "High cervical spinal injury causes quadriplegia.", "system": "Neuro"},
    {"term": "Paresthesia", "definition": "Abnormal sensation such as tingling, numbness, or pins and needles", "prefix": "par-", "prefix_meaning": "abnormal", "root": "esthes", "root_meaning": "sensation", "suffix": "-ia", "suffix_meaning": "condition", "example": "Paresthesia in diabetic neuropathy affects the feet first.", "system": "Neuro"},
    {"term": "Photophobia", "definition": "Sensitivity or aversion to light", "prefix": "photo-", "prefix_meaning": "light", "root": "phob", "root_meaning": "fear", "suffix": "-ia", "suffix_meaning": "condition", "example": "Photophobia is a classic sign of meningitis.", "system": "Neuro"},
    {"term": "Mydriasis", "definition": "Dilation of the pupil", "prefix": "", "prefix_meaning": "", "root": "mydrias", "root_meaning": "dilate", "suffix": "-is", "suffix_meaning": "condition", "example": "Mydriasis can indicate brain injury or drug effects.", "system": "Neuro"},
    {"term": "Miosis", "definition": "Constriction of the pupil", "prefix": "", "prefix_meaning": "", "root": "mio", "root_meaning": "less/smaller", "suffix": "-sis", "suffix_meaning": "condition", "example": "Opioid overdose causes pinpoint miosis.", "system": "Neuro"},
    {"term": "Lethargy", "definition": "State of drowsiness, sluggishness, or reduced alertness", "prefix": "", "prefix_meaning": "", "root": "letharg", "root_meaning": "drowsy", "suffix": "-y", "suffix_meaning": "condition", "example": "Lethargy may indicate infection or metabolic disturbance.", "system": "General"},
    {"term": "Somnolence", "definition": "Strong desire for sleep or drowsiness", "prefix": "", "prefix_meaning": "", "root": "somnol", "root_meaning": "sleep", "suffix": "-ence", "suffix_meaning": "state", "example": "Medication-induced somnolence affects patient safety.", "system": "General"},
    {"term": "Delirium", "definition": "Acute confusional state with fluctuating consciousness", "prefix": "", "prefix_meaning": "", "root": "deliri", "root_meaning": "crazy/disturbed", "suffix": "-um", "suffix_meaning": "condition", "example": "Delirium in elderly patients often indicates infection.", "system": "Neuro"},
    {"term": "Dementia", "definition": "Chronic, progressive decline in cognitive function", "prefix": "de-", "prefix_meaning": "away from", "root": "ment", "root_meaning": "mind", "suffix": "-ia", "suffix_meaning": "condition", "example": "Alzheimer's disease is the most common cause of dementia.", "system": "Neuro"},
    {"term": "Cachexia", "definition": "Severe weight loss and muscle wasting from chronic disease", "prefix": "", "prefix_meaning": "", "root": "cachex", "root_meaning": "bad condition", "suffix": "-ia", "suffix_meaning": "condition", "example": "Cachexia is common in advanced cancer.", "system": "General"},
    {"term": "Anorexia", "definition": "Loss of appetite", "prefix": "an-", "prefix_meaning": "without", "root": "orex", "root_meaning": "appetite", "suffix": "-ia", "suffix_meaning": "condition", "example": "Anorexia is a common symptom in many illnesses.", "system": "General"},
    {"term": "Malaise", "definition": "General feeling of discomfort, illness, or unease", "prefix": "mal-", "prefix_meaning": "bad", "root": "aise", "root_meaning": "ease", "suffix": "", "suffix_meaning": "", "example": "Malaise often precedes the onset of infection.", "system": "General"},
    {"term": "Fatigue", "definition": "Extreme tiredness or exhaustion", "prefix": "", "prefix_meaning": "", "root": "fatigu", "root_meaning": "weary", "suffix": "-e", "suffix_meaning": "condition", "example": "Fatigue is a common symptom of anaemia.", "system": "General"},
]

NURSING_TIPS = [
    "Always check two patient identifiers before administering any medication.",
    "The 5 Rights: Right patient, drug, dose, route, and time.",
    "Document only what you observe - avoid subjective language.",
    "When in doubt, escalate early. It's better to be wrong than miss deterioration.",
    "S8 medications require dual-signature and locked storage in Australia.",
    "ISBAR is the Australian standard for clinical handover communication.",
    "A NEWS2 score of 5+ requires urgent medical review.",
    "Always check allergies before administering any new medication.",
    "Hand hygiene: 5 moments - before patient contact, before procedure, after body fluid exposure, after patient contact, after touching surroundings.",
    "Paracetamol maximum adult dose: 4g per 24 hours. Less in elderly or hepatic impairment.",
    "Always verify drug calculations with a colleague for high-risk medications.",
    "Monitor for the 'silent' hypoglycaemia in patients who cannot report symptoms.",
    "Elevated lactate is an early indicator of tissue hypoperfusion - escalate promptly.",
    "The best indicator of fluid status is often urine output - aim for >0.5mL/kg/hr.",
    "Potassium should never be given IV push - always dilute and infuse slowly.",
]

# ============ API ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "NurseReady API v1.0 - Australian Nursing Reference"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

@api_router.get("/nursing-tip")
async def get_nursing_tip():
    import random
    return {"tip": random.choice(NURSING_TIPS)}

# ============ LAB VALUES ============
@api_router.get("/lab-values")
async def get_lab_values(category: Optional[str] = None):
    if category:
        filtered = [lv for lv in LAB_VALUES if lv["category"].lower() == category.lower()]
        return {"lab_values": filtered}
    return {"lab_values": LAB_VALUES}

@api_router.get("/lab-values/{lab_id}")
async def get_lab_value(lab_id: str):
    lab = next((lv for lv in LAB_VALUES if lv["id"] == lab_id), None)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab value not found")
    return lab

# ============ EMERGENCY CARDS ============
@api_router.get("/emergencies")
async def get_emergencies():
    return {"emergencies": EMERGENCY_CARDS}

@api_router.get("/emergencies/{emergency_id}")
async def get_emergency(emergency_id: str):
    emergency = next((e for e in EMERGENCY_CARDS if e["id"] == emergency_id), None)
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency card not found")
    return emergency

# ============ ABBREVIATIONS ============
@api_router.get("/abbreviations")
async def get_abbreviations(category: Optional[str] = None, search: Optional[str] = None):
    results = ABBREVIATIONS
    if category:
        results = [a for a in results if a["category"].lower() == category.lower()]
    if search:
        search_lower = search.lower()
        results = [a for a in results if search_lower in a["abbr"].lower() or search_lower in a["meaning"].lower()]
    return {"abbreviations": results}

# ============ CALCULATORS ============
@api_router.get("/calculators")
async def get_calculators():
    return {"calculators": CALCULATORS_INFO}

@api_router.post("/calculators/calculate")
async def calculate(input: CalculatorInput):
    calc_type = input.calculator_type
    data = input.inputs
    
    try:
        if calc_type == "drug-dose":
            dose_ordered = float(data.get("dose_ordered", 0))
            stock_strength = float(data.get("stock_strength", 1))
            stock_volume = float(data.get("stock_volume", 1))
            result = (dose_ordered / stock_strength) * stock_volume
            return {"result": round(result, 2), "unit": "mL", "formula": f"({dose_ordered} ÷ {stock_strength}) × {stock_volume} = {round(result, 2)} mL"}
        
        elif calc_type == "iv-drip":
            volume = float(data.get("volume", 0))
            time_hours = float(data.get("time_hours", 1))
            drop_factor = int(data.get("drop_factor", 20))
            time_mins = time_hours * 60
            result = (volume * drop_factor) / time_mins
            return {"result": round(result, 1), "unit": "drops/min", "formula": f"({volume}mL × {drop_factor}) ÷ {time_mins} min = {round(result, 1)} drops/min"}
        
        elif calc_type == "infusion-rate":
            dose = float(data.get("dose_mcg_kg_min", 0))
            weight = float(data.get("weight", 70))
            concentration = float(data.get("concentration_mcg_ml", 1))
            result = (dose * weight * 60) / concentration
            return {"result": round(result, 2), "unit": "mL/hr", "formula": f"({dose} × {weight} × 60) ÷ {concentration} = {round(result, 2)} mL/hr"}
        
        elif calc_type == "weight-based":
            mg_per_kg = float(data.get("mg_per_kg", 0))
            weight = float(data.get("weight", 70))
            result = mg_per_kg * weight
            return {"result": round(result, 2), "unit": "mg", "formula": f"{mg_per_kg} mg/kg × {weight} kg = {round(result, 2)} mg"}
        
        elif calc_type == "bmi":
            weight = float(data.get("weight", 0))
            height_cm = float(data.get("height", 170))
            height_m = height_cm / 100
            bmi = weight / (height_m ** 2)
            category = "Underweight" if bmi < 18.5 else "Normal" if bmi < 25 else "Overweight" if bmi < 30 else "Obese"
            color = "#10B981" if 18.5 <= bmi < 25 else "#F59E0B" if bmi < 18.5 or bmi < 30 else "#EF4444"
            return {"result": round(bmi, 1), "unit": "kg/m²", "category": category, "color": color, "formula": f"{weight} ÷ {round(height_m, 2)}² = {round(bmi, 1)} kg/m²"}
        
        elif calc_type == "gcs":
            eye = int(data.get("eye", 4))
            verbal = int(data.get("verbal", 5))
            motor = int(data.get("motor", 6))
            total = eye + verbal + motor
            severity = "Severe (<8)" if total < 8 else "Moderate (9-12)" if total <= 12 else "Mild/Normal (13-15)"
            color = "#EF4444" if total < 8 else "#F59E0B" if total <= 12 else "#10B981"
            return {"result": total, "unit": "/15", "severity": severity, "color": color, "breakdown": f"E{eye} + V{verbal} + M{motor} = {total}"}
        
        elif calc_type == "news2":
            rr = int(data.get("rr", 0))
            spo2 = int(data.get("spo2", 0))
            on_o2 = data.get("on_oxygen", False)
            temp = float(data.get("temp", 37))
            sbp = int(data.get("sbp", 0))
            hr = int(data.get("hr", 0))
            avpu = data.get("avpu", "A")
            
            # Score each parameter
            rr_score = 3 if rr <= 8 else 1 if rr <= 11 else 0 if rr <= 20 else 2 if rr <= 24 else 3
            spo2_score = 3 if spo2 <= 91 else 2 if spo2 <= 93 else 1 if spo2 <= 95 else 0
            o2_score = 2 if on_o2 else 0
            temp_score = 3 if temp <= 35.0 else 1 if temp <= 36.0 else 0 if temp <= 38.0 else 1 if temp <= 39.0 else 2
            sbp_score = 3 if sbp <= 90 else 2 if sbp <= 100 else 1 if sbp <= 110 else 0 if sbp <= 219 else 3
            hr_score = 3 if hr <= 40 else 1 if hr <= 50 else 0 if hr <= 90 else 1 if hr <= 110 else 2 if hr <= 130 else 3
            avpu_score = 0 if avpu == "A" else 3
            
            total = rr_score + spo2_score + o2_score + temp_score + sbp_score + hr_score + avpu_score
            risk = "Low" if total <= 4 else "Medium" if total <= 6 else "High"
            color = "#10B981" if total <= 4 else "#F59E0B" if total <= 6 else "#EF4444"
            return {"result": total, "unit": "/20", "risk": risk, "color": color, "breakdown": f"RR:{rr_score} + SpO2:{spo2_score} + O2:{o2_score} + Temp:{temp_score} + SBP:{sbp_score} + HR:{hr_score} + AVPU:{avpu_score}"}
        
        elif calc_type == "curb65":
            confusion = 1 if data.get("confusion", False) else 0
            urea = 1 if float(data.get("urea", 0)) > 7 else 0
            rr = 1 if int(data.get("rr", 0)) >= 30 else 0
            bp = 1 if int(data.get("sbp", 120)) < 90 or int(data.get("dbp", 80)) <= 60 else 0
            age = 1 if int(data.get("age", 0)) >= 65 else 0
            total = confusion + urea + rr + bp + age
            mortality = "0.6%" if total == 0 else "2.7%" if total == 1 else "6.8%" if total == 2 else "14%" if total == 3 else "27.8%"
            recommendation = "Home treatment" if total <= 1 else "Consider hospital" if total == 2 else "Hospital admission" if total <= 4 else "ICU consideration"
            color = "#10B981" if total <= 1 else "#F59E0B" if total == 2 else "#EF4444"
            return {"result": total, "unit": "/5", "mortality": mortality, "recommendation": recommendation, "color": color}
        
        elif calc_type == "wells-dvt":
            active_cancer = 1 if data.get("active_cancer", False) else 0
            paralysis = 1 if data.get("paralysis", False) else 0
            bedridden = 1 if data.get("bedridden", False) else 0
            tenderness = 1 if data.get("tenderness", False) else 0
            swelling = 1 if data.get("swelling", False) else 0
            calf_swelling = 1 if data.get("calf_swelling", False) else 0
            pitting_edema = 1 if data.get("pitting_edema", False) else 0
            collateral_veins = 1 if data.get("collateral_veins", False) else 0
            previous_dvt = 1 if data.get("previous_dvt", False) else 0
            alternative = -2 if data.get("alternative_diagnosis", False) else 0
            total = active_cancer + paralysis + bedridden + tenderness + swelling + calf_swelling + pitting_edema + collateral_veins + previous_dvt + alternative
            probability = "Low (<2)" if total < 2 else "Moderate (2-6)" if total <= 6 else "High (>6)"
            color = "#10B981" if total < 2 else "#F59E0B" if total <= 6 else "#EF4444"
            return {"result": total, "unit": "points", "probability": probability, "color": color}
        
        elif calc_type == "wells-pe":
            clinical_dvt = 3 if data.get("clinical_dvt", False) else 0
            pe_likely = 3 if data.get("pe_likely", False) else 0
            hr_100 = 1.5 if data.get("hr_over_100", False) else 0
            immobilization = 1.5 if data.get("immobilization", False) else 0
            previous = 1.5 if data.get("previous_dvt_pe", False) else 0
            haemoptysis = 1 if data.get("haemoptysis", False) else 0
            malignancy = 1 if data.get("malignancy", False) else 0
            total = clinical_dvt + pe_likely + hr_100 + immobilization + previous + haemoptysis + malignancy
            probability = "PE Unlikely" if total <= 4 else "PE Likely"
            color = "#10B981" if total <= 4 else "#EF4444"
            return {"result": total, "unit": "points", "probability": probability, "color": color}
        
        elif calc_type == "apgar":
            appearance = int(data.get("appearance", 2))
            pulse = int(data.get("pulse", 2))
            grimace = int(data.get("grimace", 2))
            activity = int(data.get("activity", 2))
            respiration = int(data.get("respiration", 2))
            total = appearance + pulse + grimace + activity + respiration
            interpretation = "Severely depressed" if total <= 3 else "Moderately depressed" if total <= 6 else "Normal"
            color = "#EF4444" if total <= 3 else "#F59E0B" if total <= 6 else "#10B981"
            return {"result": total, "unit": "/10", "interpretation": interpretation, "color": color, "breakdown": f"A:{appearance} P:{pulse} G:{grimace} A:{activity} R:{respiration}"}
        
        elif calc_type == "gfr":
            age = int(data.get("age", 50))
            weight = float(data.get("weight", 70))
            creatinine = float(data.get("creatinine", 100))
            is_female = data.get("is_female", False)
            constant = 1.04 if is_female else 1.23
            crcl = ((140 - age) * weight * constant) / creatinine
            stage = "Normal" if crcl >= 90 else "Stage 2" if crcl >= 60 else "Stage 3" if crcl >= 30 else "Stage 4" if crcl >= 15 else "Stage 5"
            color = "#10B981" if crcl >= 60 else "#F59E0B" if crcl >= 30 else "#EF4444"
            return {"result": round(crcl, 1), "unit": "mL/min", "stage": stage, "color": color, "formula": f"((140-{age}) × {weight} × {constant}) ÷ {creatinine}"}
        
        elif calc_type == "parkland":
            weight = float(data.get("weight", 70))
            tbsa = float(data.get("tbsa", 20))
            total_fluid = 4 * weight * tbsa
            first_8hrs = total_fluid / 2
            next_16hrs = total_fluid / 2
            return {"result": round(total_fluid, 0), "unit": "mL/24hr", "first_8hrs": round(first_8hrs, 0), "next_16hrs": round(next_16hrs, 0), "formula": f"4 × {weight}kg × {tbsa}% = {round(total_fluid, 0)} mL"}
        
        elif calc_type == "paeds-weight":
            age = float(data.get("age_years", 5))
            if age < 1:
                weight = (age * 12 * 0.5) + 4  # For infants
            elif age <= 5:
                weight = (age * 2) + 8
            elif age <= 14:
                weight = (age * 3) + 7
            else:
                weight = 50  # Default for >14
            return {"result": round(weight, 1), "unit": "kg", "formula": f"Age {age} years → ~{round(weight, 1)} kg"}
        
        elif calc_type == "unit-converter":
            convert_type = data.get("type", "")
            value = float(data.get("value", 0))
            
            if convert_type == "kg_to_lbs":
                result = value * 2.205
                return {"result": round(result, 2), "unit": "lbs", "formula": f"{value} kg × 2.205 = {round(result, 2)} lbs"}
            elif convert_type == "lbs_to_kg":
                result = value / 2.205
                return {"result": round(result, 2), "unit": "kg", "formula": f"{value} lbs ÷ 2.205 = {round(result, 2)} kg"}
            elif convert_type == "c_to_f":
                result = (value * 9/5) + 32
                return {"result": round(result, 1), "unit": "°F", "formula": f"({value} × 9/5) + 32 = {round(result, 1)} °F"}
            elif convert_type == "f_to_c":
                result = (value - 32) * 5/9
                return {"result": round(result, 1), "unit": "°C", "formula": f"({value} - 32) × 5/9 = {round(result, 1)} °C"}
            elif convert_type == "cm_to_inches":
                result = value / 2.54
                return {"result": round(result, 2), "unit": "inches", "formula": f"{value} cm ÷ 2.54 = {round(result, 2)} inches"}
            elif convert_type == "inches_to_cm":
                result = value * 2.54
                return {"result": round(result, 2), "unit": "cm", "formula": f"{value} inches × 2.54 = {round(result, 2)} cm"}
            else:
                return {"result": value, "unit": "unknown", "formula": "Select conversion type"}
        
        else:
            raise HTTPException(status_code=400, detail="Unknown calculator type")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ BODY SYSTEMS ============
@api_router.get("/body-systems")
async def get_body_systems():
    return {"systems": BODY_SYSTEMS}

@api_router.get("/body-systems/{system_id}")
async def get_body_system(system_id: str):
    system = next((s for s in BODY_SYSTEMS if s["id"] == system_id), None)
    if not system:
        raise HTTPException(status_code=404, detail="Body system not found")
    return system

# ============ MEDICAL TERMINOLOGY ============
@api_router.get("/terminology")
async def get_terminology(search: Optional[str] = None, system: Optional[str] = None):
    results = MEDICAL_TERMS
    if system:
        results = [t for t in results if t["system"].lower() == system.lower()]
    if search:
        search_lower = search.lower()
        results = [t for t in results if search_lower in t["term"].lower() or search_lower in t["definition"].lower()]
    return {"terms": results}

@api_router.get("/terminology/{term}")
async def get_term(term: str):
    found = next((t for t in MEDICAL_TERMS if t["term"].lower() == term.lower()), None)
    if not found:
        raise HTTPException(status_code=404, detail="Term not found")
    return found

# ============ TERM LOOKUP (for popup) ============
@api_router.get("/term-lookup")
async def term_lookup(q: str = Query(..., min_length=2)):
    """Look up a term in abbreviations or medical terms"""
    q_lower = q.lower().strip()
    
    # Check abbreviations first
    abbr = next((a for a in ABBREVIATIONS if a["abbr"].lower() == q_lower), None)
    if abbr:
        return {"found": True, "type": "abbreviation", "term": abbr["abbr"], "definition": abbr["meaning"], "category": abbr["category"]}
    
    # Check medical terms
    term = next((t for t in MEDICAL_TERMS if t["term"].lower() == q_lower), None)
    if term:
        return {"found": True, "type": "terminology", "term": term["term"], "definition": term["definition"], "system": term["system"]}
    
    return {"found": False}

# ============ COMMUNICATION & HANDOVER ============
@api_router.get("/communication")
async def get_communication():
    return {"guides": COMMUNICATION_HANDOVER}

@api_router.get("/communication/{guide_id}")
async def get_communication_guide(guide_id: str):
    guide = next((g for g in COMMUNICATION_HANDOVER if g["id"] == guide_id), None)
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide

# ============ DRUG SEARCH (OpenFDA with AU mapping - DEDUPLICATED) ============
@api_router.get("/drugs/search")
async def search_drugs(query: str = Query(..., min_length=2)):
    try:
        search_term = query.lower().strip()
        us_search_term = get_us_drug_name(search_term)
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Search OpenFDA
            response = await client.get(
                f"https://api.fda.gov/drug/label.json",
                params={"search": f'openfda.generic_name:{us_search_term}', "limit": 50}
            )
            
            seen_drugs = {}  # Track unique drugs
            
            if response.status_code == 200:
                data = response.json()
                for item in data.get("results", []):
                    openfda = item.get("openfda", {})
                    generic = openfda.get("generic_name", ["Unknown"])[0] if openfda.get("generic_name") else None
                    
                    if not generic:
                        continue
                    
                    generic_lower = generic.lower()
                    
                    # Check if this is a combination drug (has multiple ingredients)
                    # Look for commas, "AND", "/" or multiple drug names separated by spaces
                    is_combination = (
                        "," in generic or 
                        " AND " in generic.upper() or 
                        "/" in generic or
                        # Multi-word names with spaces between drugs (no comma)
                        len([w for w in generic.split() if len(w) > 3 and w[0].isupper()]) > 2
                    )
                    
                    # Check if this is a single-ingredient drug matching our search
                    # Only match if drug name is exactly the search term or search term + salt form
                    is_single_match = not is_combination and (
                        generic_lower == us_search_term or
                        generic_lower == search_term or
                        generic_lower.startswith(us_search_term + " ") or
                        generic_lower.startswith(search_term + " ")
                    )
                    
                    # Get drug class
                    drug_class = "Not classified"
                    if openfda.get("pharm_class_epc"):
                        drug_class = openfda["pharm_class_epc"][0]
                    elif openfda.get("pharm_class_moa"):
                        drug_class = openfda["pharm_class_moa"][0]
                    elif openfda.get("pharm_class_cs"):
                        drug_class = openfda["pharm_class_cs"][0]
                    
                    brand_names = openfda.get("brand_name", [])
                    brand = brand_names[0] if brand_names else "Unknown"
                    
                    indications = "Not available"
                    if item.get("indications_and_usage"):
                        ind_text = item["indications_and_usage"][0].replace("\n", " ").strip()
                        if len(ind_text) > 400:
                            ind_text = ind_text[:400] + "..."
                        indications = ind_text
                    
                    warnings = "Not available"
                    if item.get("warnings"):
                        warn_text = item["warnings"][0].replace("\n", " ").strip()
                        if len(warn_text) > 250:
                            warn_text = warn_text[:250] + "..."
                        warnings = warn_text
                    
                    route = openfda.get("route", ["Unknown"])[0] if openfda.get("route") else "Unknown"
                    
                    # Create dedup key - group single-ingredient drugs together
                    if is_single_match:
                        dedup_key = f"__single__{us_search_term}"
                    else:
                        dedup_key = generic_lower
                    
                    drug_entry = {
                        "generic_name": format_drug_name(generic) if is_single_match else generic,
                        "brand_name": brand,
                        "drug_class": drug_class,
                        "route": route,
                        "indications": indications,
                        "warnings": warnings,
                        "_has_class": drug_class != "Not classified",
                        "_is_single_match": is_single_match,
                    }
                    
                    # Add or update entry
                    if dedup_key not in seen_drugs:
                        seen_drugs[dedup_key] = drug_entry
                    else:
                        existing = seen_drugs[dedup_key]
                        # Replace if current entry has classification and existing doesn't
                        if drug_class != "Not classified" and not existing["_has_class"]:
                            seen_drugs[dedup_key] = drug_entry
            
            # Convert to list with sort keys
            results = []
            for drug in seen_drugs.values():
                results.append({
                    "generic_name": drug["generic_name"],
                    "brand_name": drug["brand_name"],
                    "drug_class": drug["drug_class"],
                    "route": drug["route"],
                    "indications": drug["indications"],
                    "warnings": drug["warnings"],
                    "_sort_single": drug["_is_single_match"],
                    "_sort_class": drug["_has_class"]
                })
            
            # Sort: single-ingredient first, then classified, then alphabetically
            results.sort(key=lambda x: (not x["_sort_single"], not x["_sort_class"], x["generic_name"]))
            
            # Clean and limit
            final_results = []
            for r in results[:5]:
                final_results.append({k: v for k, v in r.items() if not k.startswith("_")})
            
            return {
                "results": final_results, 
                "source": "OpenFDA", 
                "searched_as": us_search_term if us_search_term != search_term else None, 
                "disclaimer": "Drug information sourced from OpenFDA (US-based). Australian drug names and PBS listing may differ. Always cross-reference with MIMS Australia."
            }
    except Exception as e:
        logging.error(f"OpenFDA API error: {e}")
        return {"results": [], "source": "OpenFDA", "error": "Unable to fetch drug data. Please try again later."}

# ============ DRUG INTERACTIONS (RxNorm) ============
@api_router.post("/drugs/interactions")
async def check_drug_interactions(request: DrugInteractionRequest):
    """Check drug interactions using RxNorm API"""
    if len(request.drugs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 drugs required for interaction check")
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Get RxCUI for each drug
            rxcuis = []
            drug_map = {}
            
            for drug in request.drugs:
                # Convert AU name to US if needed
                us_name = get_us_drug_name(drug.lower())
                response = await client.get(
                    f"https://rxnav.nlm.nih.gov/REST/rxcui.json",
                    params={"name": us_name}
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("idGroup", {}).get("rxnormId"):
                        rxcui = data["idGroup"]["rxnormId"][0]
                        rxcuis.append(rxcui)
                        drug_map[rxcui] = drug.title()
            
            if len(rxcuis) < 2:
                return {"interactions": [], "message": "Could not find RxNorm IDs for all drugs. Please check drug names."}
            
            # Check interactions
            rxcui_str = "+".join(rxcuis)
            response = await client.get(
                f"https://rxnav.nlm.nih.gov/REST/interaction/list.json",
                params={"rxcuis": rxcui_str}
            )
            
            interactions = []
            if response.status_code == 200:
                data = response.json()
                full_interactions = data.get("fullInteractionTypeGroup", [])
                
                for group in full_interactions:
                    for interaction_type in group.get("fullInteractionType", []):
                        for pair in interaction_type.get("interactionPair", []):
                            severity = pair.get("severity", "Unknown")
                            description = pair.get("description", "No description available")
                            drugs_involved = [concept.get("minConceptItem", {}).get("name", "Unknown") for concept in pair.get("interactionConcept", [])]
                            
                            interactions.append({
                                "drugs": drugs_involved,
                                "severity": severity,
                                "description": description,
                                "source": interaction_type.get("interactionSource", "RxNorm")
                            })
            
            return {
                "interactions": interactions,
                "drugs_checked": list(drug_map.values()),
                "disclaimer": "Drug interactions from RxNorm (US). Always verify with Australian resources (MIMS, AusDI) and consult a pharmacist."
            }
    
    except Exception as e:
        logging.error(f"RxNorm interaction check error: {e}")
        raise HTTPException(status_code=500, detail="Unable to check drug interactions. Please try again.")

# ============ AI CHAT ============
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    if not LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    system_message = """You are NurseReady AI, a clinical nursing reference assistant for student enrolled nurses and healthcare professionals in Australia. You provide accurate, evidence-based answers about medications, medical terminology, pharmacology, lab values, nursing assessments, clinical procedures, pathophysiology, and professional nursing practice.

Always reference Australian clinical guidelines, Australian drug names (e.g. Paracetamol not Acetaminophen, Adrenaline not Epinephrine), SI units, AHPRA and NMBA nursing standards, Australian Resuscitation Council (ARC) guidelines, and PBS drug availability where relevant.

Tailor responses to enrolled nurse scope of practice as defined by AHPRA and the NMBA in Australia unless the user specifies otherwise.

Always recommend verifying critical drug information with a pharmacist, senior clinician, or current MIMS Australia.

Never provide personal medical diagnoses or replace clinical judgment. Keep responses clear, structured, and use bullet points where helpful. Always be educational in tone — explain the why, not just the what.

Important disclaimers:
- This is for educational purposes only
- Always verify drug information with current MIMS Australia
- In emergencies, call 000 and follow facility protocols
- Clinical decisions should be made with qualified clinicians"""
    try:
        client = anthropic.Anthropic(api_key=LLM_KEY)

        response = client.messages.create(
            model="claude-3-haiku-20240307",  # lightweight + fast
            max_tokens=500,
            system=system_message,
            messages=[
                {"role": "user", "content": request.message}
            ]
        )

        reply = response.content[0].text

        return ChatResponse(
            response=reply,
            session_id=request.session_id
        )
    except Exception as e:
        logging.error(f"AI Chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable. Please try again.")

# ============ BOOKMARKS ============
@api_router.post("/bookmarks")
async def add_bookmark(bookmark: Bookmark):
    doc = bookmark.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    existing = await db.bookmarks.find_one({"item_type": bookmark.item_type, "item_id": bookmark.item_id}, {"_id": 0})
    if existing:
        return {"message": "Already bookmarked", "bookmark": existing}
    await db.bookmarks.insert_one(doc)
    return {"message": "Bookmark added", "bookmark": doc}

@api_router.get("/bookmarks")
async def get_bookmarks():
    bookmarks = await db.bookmarks.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"bookmarks": bookmarks}

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    result = await db.bookmarks.delete_one({"id": bookmark_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted"}

# ============ RECENT ITEMS ============
@api_router.post("/recent")
async def add_recent(item: RecentItem):
    await db.recent.delete_many({"item_type": item.item_type, "item_id": item.item_id})
    doc = item.model_dump()
    doc['viewed_at'] = doc['viewed_at'].isoformat()
    await db.recent.insert_one(doc)
    count = await db.recent.count_documents({})
    if count > 10:
        oldest = await db.recent.find({}, {"_id": 1}).sort("viewed_at", 1).limit(count - 10).to_list(count - 10)
        ids = [d["_id"] for d in oldest]
        await db.recent.delete_many({"_id": {"$in": ids}})
    return {"message": "Recent item added"}

@api_router.get("/recent")
async def get_recent():
    recent = await db.recent.find({}, {"_id": 0}).sort("viewed_at", -1).to_list(10)
    return {"recent": recent}

# ============ GLOBAL SEARCH ============
@api_router.get("/search")
async def global_search(q: str = Query(..., min_length=2)):
    q_lower = q.lower()
    
    # Search local data sources
    results = {
        "lab_values": [lv for lv in LAB_VALUES if q_lower in lv["name"].lower()],
        "abbreviations": [a for a in ABBREVIATIONS if q_lower in a["abbr"].lower() or q_lower in a["meaning"].lower()],
        "emergencies": [e for e in EMERGENCY_CARDS if q_lower in e["title"].lower()],
        "terminology": [t for t in MEDICAL_TERMS if q_lower in t["term"].lower() or q_lower in t["definition"].lower()],
        "body_systems": [s for s in BODY_SYSTEMS if q_lower in s["name"].lower() or q_lower in s["description"].lower()],
        "drugs": [],
        "communication": [c for c in COMMUNICATION_HANDOVER if q_lower in c["title"].lower() or q_lower in c["description"].lower()],
    }
    
    # Search drugs - check if query matches any known drug names
    all_drug_names = list(AU_TO_US_DRUG_NAMES.keys()) + list(AU_TO_US_DRUG_NAMES.values())
    matching_drugs = [name for name in all_drug_names if q_lower in name.lower()]
    
    if matching_drugs:
        # Return drug name matches as suggestions to search in Drug Search
        unique_drugs = list(set([name.title() for name in matching_drugs]))[:5]
        results["drugs"] = [{"name": drug, "type": "drug_suggestion"} for drug in unique_drugs]
    
    return results

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
