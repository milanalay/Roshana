import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X, BookOpen, Hash } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const TermPopup = ({ term, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef(null);

  useEffect(() => {
    const fetchTerm = async () => {
      try {
        const response = await axios.get(`${API}/term-lookup`, {
          params: { q: term }
        });
        setData(response.data);
      } catch (error) {
        console.error("Term lookup error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerm();
  }, [term]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center">
      <div
        ref={popupRef}
        className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md p-5 pb-8 animate-slide-up"
        data-testid="term-popup"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 bg-[#00A99D]/10 rounded-lg flex items-center justify-center">
            {data?.type === "abbreviation" ? (
              <Hash className="w-4 h-4 text-[#00A99D]" />
            ) : (
              <BookOpen className="w-4 h-4 text-[#00A99D]" />
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#F4F6F9] dark:bg-slate-700 rounded-lg flex items-center justify-center"
            data-testid="close-popup-btn"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#00A99D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.found ? (
          <div>
            <h3 className="text-xl font-bold text-[#1B3A6B] dark:text-white mb-2">
              {data.term}
            </h3>
            <span className="inline-block px-2 py-1 bg-[#00A99D]/10 text-[#00A99D] text-xs font-medium rounded-full mb-3">
              {data.category || data.system}
            </span>
            <p className="text-gray-700 dark:text-gray-300">
              {data.definition}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No definition found for "{term}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Utility to highlight terms in text
export const HighlightedText = ({ text, onTermClick }) => {
  // Common medical terms and abbreviations to highlight
  const termsToHighlight = [
    "tachycardia", "bradycardia", "dyspnoea", "hypoxia", "hypoglycaemia", "hyperglycaemia",
    "hyponatraemia", "hyperkalaemia", "dysphagia", "oliguria", "anuria", "haematuria",
    "pneumothorax", "sepsis", "ischaemia", "anaemia", "oedema", "pyrexia",
    "ABG", "ACS", "AF", "AKI", "BP", "BSL", "CCF", "CKD", "COPD", "CPR", "CVA",
    "DKA", "DVT", "ECG", "ED", "eGFR", "EN", "FBC", "GCS", "GI", "GTN", "Hb",
    "HR", "IM", "INR", "IV", "LFT", "MET", "MI", "NBM", "NEWS", "NG", "NIV",
    "PE", "PO", "PRN", "RN", "RR", "SBAR", "SC", "SOB", "SpO2", "STAT", "TDS",
    "UTI", "VF", "VT", "WCC"
  ];

  if (!text) return null;

  // Create regex pattern for all terms (case insensitive for medical terms, case sensitive for abbreviations)
  const pattern = new RegExp(
    `\\b(${termsToHighlight.join("|")})\\b`,
    "gi"
  );

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isHighlighted = termsToHighlight.some(
          (term) => term.toLowerCase() === part.toLowerCase()
        );
        
        if (isHighlighted) {
          return (
            <button
              key={index}
              onClick={() => onTermClick(part)}
              className="term-highlight"
              data-testid={`term-${part.toLowerCase()}`}
            >
              {part}
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default TermPopup;
