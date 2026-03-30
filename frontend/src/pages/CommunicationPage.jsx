import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MessageSquare, ChevronRight, ChevronDown } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GuideCard = ({ guide, isExpanded, onToggle }) => (
  <div
    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700"
    data-testid={`guide-${guide.id}`}
  >
    <button
      onClick={onToggle}
      className="w-full p-4 flex items-center justify-between text-left"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${guide.color}20` }}
        >
          <MessageSquare className="w-5 h-5" style={{ color: guide.color }} />
        </div>
        <div>
          <h3 className="font-bold text-[#1B3A6B] dark:text-white">{guide.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{guide.description}</p>
        </div>
      </div>
      {isExpanded ? (
        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
    </button>

    {isExpanded && (
      <div className="px-4 pb-4 space-y-3">
        {guide.sections.map((section, index) => (
          <div
            key={index}
            className="bg-[#F4F6F9] dark:bg-slate-700 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                style={{ backgroundColor: guide.color }}
              >
                {section.letter}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#1B3A6B] dark:text-white mb-1">
                  {section.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {section.content}
                </p>
                {section.example && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border-l-4" style={{ borderColor: guide.color }}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Example</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      "{section.example}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function CommunicationPage() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState("isbar");

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await axios.get(`${API}/communication`);
      setGuides(response.data.guides || []);
    } catch (error) {
      console.error("Error fetching communication guides:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGuide = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-[#F4F6F9] dark:bg-slate-900 min-h-screen" data-testid="communication-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#F4F6F9] dark:bg-slate-700 rounded-xl flex items-center justify-center"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#1B3A6B] dark:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#00A99D]" />
              Communication
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Handover frameworks & clinical communication
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-5 pb-32 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-2xl h-24 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Quick Tips Banner */}
              <div className="bg-[#00A99D]/10 rounded-2xl p-4 mb-4">
                <h3 className="font-semibold text-[#00A99D] mb-2">Clinical Communication Tips</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• ISBAR is the Australian standard - use it for all clinical handovers</li>
                  <li>• Be concise, clear, and specific with patient details</li>
                  <li>• Always include vital signs and NEWS2 score when escalating</li>
                  <li>• Document all verbal/phone orders immediately</li>
                </ul>
              </div>

              {guides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  isExpanded={expandedId === guide.id}
                  onToggle={() => toggleGuide(guide.id)}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
