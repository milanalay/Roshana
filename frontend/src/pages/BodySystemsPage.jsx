import { useState, useEffect } from "react";
import axios from "axios";
import { Heart, ArrowLeft, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SystemCard = ({ system, onClick }) => {
  const IconComponent = Icons[system.icon] || Icons.Heart;
  
  return (
    <button
      onClick={() => onClick(system)}
      className="w-full text-left bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      data-testid={`system-${system.id}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[#1B3A6B] dark:text-white">{system.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{system.description}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
};

const SystemDetail = ({ system, onBack }) => {
  const IconComponent = Icons[system.icon] || Icons.Heart;

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#00A99D] font-medium"
        data-testid="back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to systems
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <IconComponent className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">{system.name}</h2>
        </div>
        <p className="text-red-100">{system.overview}</p>
      </div>

      {/* Key Structures */}
      <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-5">
        <h3 className="font-bold text-[#1B3A6B] dark:text-white mb-3">Key Structures</h3>
        <div className="flex flex-wrap gap-2">
          {system.key_structures.map((structure, index) => (
            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
              {structure}
            </Badge>
          ))}
        </div>
      </div>

      {/* Common Conditions */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5">
        <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-3">Common Conditions</h3>
        <ul className="space-y-2">
          {system.common_conditions.map((condition, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              {condition}
            </li>
          ))}
        </ul>
      </div>

      {/* Related Drugs */}
      <div className="bg-[#8B5CF6]/10 rounded-2xl p-5">
        <h3 className="font-bold text-[#8B5CF6] mb-3">Related Drug Classes</h3>
        <ul className="space-y-2">
          {system.related_drugs.map((drug, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-[#8B5CF6] rounded-full" />
              {drug}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function BodySystemsPage() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      const response = await axios.get(`${API}/body-systems`);
      setSystems(response.data.systems || []);
    } catch (error) {
      console.error("Error fetching body systems:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="body-systems-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#F4F6F9] dark:bg-slate-800 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[#1B3A6B] dark:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Body Systems
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Anatomy & physiology</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl h-20 animate-pulse" />
              ))}
            </div>
          ) : selectedSystem ? (
            <SystemDetail system={selectedSystem} onBack={() => setSelectedSystem(null)} />
          ) : (
            <div className="space-y-3">
              {systems.map((system) => (
                <SystemCard key={system.id} system={system} onClick={setSelectedSystem} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
