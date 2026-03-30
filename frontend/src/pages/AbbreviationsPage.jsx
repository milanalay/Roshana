import { useState, useEffect } from "react";
import axios from "axios";
import { Hash, ArrowLeft, Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AbbreviationCard = ({ abbr }) => (
  <div
    className="bg-[#F4F6F9] dark:bg-slate-800 rounded-xl p-4"
    data-testid={`abbr-${abbr.abbr}`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="font-bold text-lg text-[#1B3A6B] dark:text-white">{abbr.abbr}</span>
      <Badge variant="secondary" className="text-xs">{abbr.category}</Badge>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400">{abbr.meaning}</p>
  </div>
);

export default function AbbreviationsPage() {
  const navigate = useNavigate();
  const [abbreviations, setAbbreviations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbbreviations();
  }, []);

  const fetchAbbreviations = async () => {
    try {
      const response = await axios.get(`${API}/abbreviations`);
      setAbbreviations(response.data.abbreviations || []);
    } catch (error) {
      console.error("Error fetching abbreviations:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(abbreviations.map((a) => a.category))];
  
  const filteredAbbrs = abbreviations.filter((a) => {
    const matchesFilter = filter === "all" || a.category === filter;
    const matchesSearch = !searchQuery || 
      a.abbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="abbreviations-page">
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
              <Hash className="w-6 h-6 text-[#3B82F6]" />
              Abbreviations
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Medical & nursing shortcuts</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search abbreviations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl border-0 text-base"
            data-testid="abbr-search-input"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? "bg-[#3B82F6] text-white"
                  : "bg-[#F4F6F9] dark:bg-slate-800 text-gray-600 dark:text-gray-400"
              }`}
              data-testid={`filter-${cat}`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-32">
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-[#F4F6F9] dark:bg-slate-800 rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          ) : filteredAbbrs.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No abbreviations found</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="abbreviations-list">
              {filteredAbbrs.map((abbr, index) => (
                <AbbreviationCard key={index} abbr={abbr} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
