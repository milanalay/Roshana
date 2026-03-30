import { useState, useEffect } from "react";
import axios from "axios";
import { TestTube, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BookmarkButton } from "../components/BookmarkButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getStatusColor = (lab) => {
  // This would be dynamic based on actual values, for display we show normal
  return "#10B981";
};

const LabValueCard = ({ lab, onClick }) => (
  <button
    onClick={() => onClick(lab)}
    className="w-full text-left bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    data-testid={`lab-${lab.id}`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="font-semibold text-[#1B3A6B] dark:text-white">{lab.name}</div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">{lab.category}</Badge>
        <BookmarkButton
          item={{
            type: "lab",
            id: lab.id,
            title: lab.name,
            subtitle: `${lab.normal_range} ${lab.unit}`
          }}
          size="sm"
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-[#10B981]">{lab.normal_range}</span>
      <span className="text-sm text-gray-500">{lab.unit}</span>
    </div>
  </button>
);

const LabValueDetail = ({ lab, onBack }) => (
  <div className="space-y-4">
    {/* Back Button */}
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-[#00A99D] font-medium"
      data-testid="back-btn"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to list
    </button>

    {/* Header */}
    <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-5">
      <h2 className="text-xl font-bold text-[#1B3A6B] dark:text-white mb-2">
        {lab.name}
      </h2>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">{lab.category}</Badge>
        <span className="text-sm text-gray-500">{lab.unit}</span>
      </div>
      <div className="text-3xl font-bold text-[#10B981]">
        {lab.normal_range} <span className="text-lg font-normal text-gray-500">{lab.unit}</span>
      </div>
    </div>

    {/* Critical Values */}
    <div className="grid grid-cols-2 gap-3">
      {lab.low_critical !== "N/A" && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-600">Critical Low</span>
          </div>
          <div className="text-lg font-bold text-red-700 dark:text-red-400">{lab.low_critical}</div>
        </div>
      )}
      {lab.high_critical !== "N/A" && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-600">Critical High</span>
          </div>
          <div className="text-lg font-bold text-red-700 dark:text-red-400">{lab.high_critical}</div>
        </div>
      )}
    </div>

    {/* Low Meaning */}
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5">
      <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
        <TrendingDown className="w-5 h-5" />
        Low Value Indicates
      </h3>
      <p className="text-sm text-amber-700 dark:text-amber-300">{lab.low_meaning}</p>
    </div>

    {/* High Meaning */}
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5">
      <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        High Value Indicates
      </h3>
      <p className="text-sm text-orange-700 dark:text-orange-300">{lab.high_meaning}</p>
    </div>

    {/* Nursing Considerations */}
    <div className="bg-[#00A99D]/10 rounded-2xl p-5">
      <h3 className="font-bold text-[#00A99D] mb-2">
        Nursing Considerations
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">{lab.nursing}</p>
    </div>

    {/* Source Badge */}
    <div className="bg-[#F4F6F9] dark:bg-slate-700 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Values in Australian SI units. Always verify with your facility's reference ranges.
      </p>
    </div>
  </div>
);

export default function LabValuesPage() {
  const navigate = useNavigate();
  const [labValues, setLabValues] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabValues();
  }, []);

  const fetchLabValues = async () => {
    try {
      const response = await axios.get(`${API}/lab-values`);
      setLabValues(response.data.lab_values || []);
    } catch (error) {
      console.error("Error fetching lab values:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(labValues.map((l) => l.category))];
  const filteredLabs = filter === "all" 
    ? labValues 
    : labValues.filter((l) => l.category === filter);

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="lab-values-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#F4F6F9] dark:bg-slate-800 rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[#1B3A6B] dark:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white flex items-center gap-2">
              <TestTube className="w-6 h-6 text-[#F59E0B]" />
              Lab Values
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Australian SI units</p>
          </div>
        </div>

        {/* Category Filter */}
        {!selectedLab && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === cat
                    ? "bg-[#1B3A6B] text-white"
                    : "bg-[#F4F6F9] dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                }`}
                data-testid={`filter-${cat}`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-32">
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : selectedLab ? (
            <LabValueDetail lab={selectedLab} onBack={() => setSelectedLab(null)} />
          ) : (
            <div className="space-y-3" data-testid="lab-values-list">
              {filteredLabs.map((lab) => (
                <LabValueCard key={lab.id} lab={lab} onClick={setSelectedLab} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
