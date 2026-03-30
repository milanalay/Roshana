import { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, ChevronRight, ArrowLeft, Phone, Clock, CheckCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BookmarkButton } from "../components/BookmarkButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmergencyCard = ({ emergency, onClick }) => (
  <button
    onClick={() => onClick(emergency)}
    className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow"
    style={{ borderLeftColor: emergency.color }}
    data-testid={`emergency-${emergency.id}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-bold text-[#1B3A6B] dark:text-white">{emergency.title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{emergency.category}</div>
      </div>
      <div className="flex items-center gap-2">
        <BookmarkButton
          item={{
            type: "emergency",
            id: emergency.id,
            title: emergency.title,
            subtitle: emergency.category
          }}
          size="sm"
        />
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  </button>
);

const EmergencyDetail = ({ emergency, onBack }) => (
  <div className="space-y-4">
    {/* Back Button */}
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      data-testid="back-btn"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to list
    </button>

    {/* Title */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <h2 className="text-xl font-bold text-[#1B3A6B] dark:text-white mb-2">
        {emergency.title}
      </h2>
      <Badge style={{ backgroundColor: emergency.color }} className="text-white">
        {emergency.category}
      </Badge>
    </div>

    {/* Recognition */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <h3 className="font-bold text-[#EF4444] mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Recognition
      </h3>
      <ul className="space-y-2">
        {emergency.recognition.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-[#EF4444] mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* Immediate Actions */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <h3 className="font-bold text-[#F97316] mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Immediate Actions
      </h3>
      <ol className="space-y-2">
        {emergency.immediate_actions.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="w-6 h-6 bg-[#F97316] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>

    {/* Medications */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <h3 className="font-bold text-[#8B5CF6] mb-3 flex items-center gap-2">
        💊 Medications
      </h3>
      <ul className="space-y-2">
        {emergency.medications.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-[#8B5CF6] mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* Nursing Role */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <h3 className="font-bold text-[#00A99D] mb-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Nursing Role
      </h3>
      <ul className="space-y-2">
        {emergency.nursing_role.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-[#00A99D] mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* Escalation */}
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5">
      <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
        Escalation
      </h3>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        {emergency.escalation}
      </p>
    </div>

    {/* Source */}
    <div className="bg-[#F4F6F9] dark:bg-slate-700 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Source: {emergency.source}
      </p>
    </div>
  </div>
);

export default function EmergencyPage() {
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const response = await axios.get(`${API}/emergencies`);
      setEmergencies(response.data.emergencies || []);
    } catch (error) {
      console.error("Error fetching emergencies:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#EF4444] to-[#DC2626] min-h-screen" data-testid="emergency-page">
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
            data-testid="emergency-back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Emergency Reference
            </h1>
            <p className="text-red-100 text-sm">Quick access protocols</p>
          </div>
        </div>

        {/* Critical Warning */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
          <Phone className="w-8 h-8 text-white" />
          <div>
            <div className="font-bold text-white text-lg">IN A REAL EMERGENCY</div>
            <div className="text-white/90 text-sm">Call 000 immediately. Follow facility protocols.</div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mx-5 mb-4 bg-amber-400 rounded-xl p-3">
        <p className="text-xs text-amber-900 text-center font-medium">
          ⚠️ This is a STUDY REFERENCE ONLY. Never replaces your facility's emergency protocols, MET/Rapid Response system, or senior clinician guidance.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/20 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : selectedEmergency ? (
          <EmergencyDetail
            emergency={selectedEmergency}
            onBack={() => setSelectedEmergency(null)}
          />
        ) : (
          <div className="space-y-3" data-testid="emergency-cards-list">
            {emergencies.map((emergency) => (
              <EmergencyCard
                key={emergency.id}
                emergency={emergency}
                onClick={setSelectedEmergency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
