import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, ArrowLeft, TestTube, Hash, AlertTriangle, FileText, Heart, Pill, MessageSquare } from "lucide-react";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ResultSection = ({ title, icon: Icon, items, type, color, onDrugClick }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`bg-[#F4F6F9] dark:bg-slate-800 rounded-xl p-4 ${type === "drugs" ? "cursor-pointer hover:bg-[#8B5CF6]/10" : ""}`}
            data-testid={`search-result-${type}-${index}`}
            onClick={() => type === "drugs" && onDrugClick && onDrugClick(item.name)}
          >
            {type === "lab_values" && (
              <>
                <div className="font-semibold text-[#1B3A6B] dark:text-white">{item.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Normal: {item.normal_range} {item.unit}
                </div>
              </>
            )}
            {type === "abbreviations" && (
              <>
                <div className="font-semibold text-[#1B3A6B] dark:text-white">{item.abbr}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.meaning}</div>
              </>
            )}
            {type === "emergencies" && (
              <>
                <div className="font-semibold text-[#F97316]">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.category}</div>
              </>
            )}
            {type === "terminology" && (
              <>
                <div className="font-semibold text-[#1B3A6B] dark:text-white">{item.term}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.definition}</div>
              </>
            )}
            {type === "body_systems" && (
              <>
                <div className="font-semibold text-[#1B3A6B] dark:text-white">{item.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.overview}</div>
              </>
            )}
            {type === "drugs" && (
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#8B5CF6]">{item.name}</div>
                <span className="text-xs text-gray-500">Tap to search</span>
              </div>
            )}
            {type === "communication" && (
              <>
                <div className="font-semibold text-[#00A99D]">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/search`, {
        params: { q: searchQuery }
      });
      setResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      performSearch(query);
    }
  };

  const handleDrugClick = (drugName) => {
    navigate(`/drugs?q=${encodeURIComponent(drugName)}`);
  };

  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="search-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white mb-4">
          Search
        </h1>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl border-0 text-base"
              data-testid="search-input"
              autoFocus
            />
          </div>
        </form>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-5">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#00A99D] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && results && totalResults === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">Try different keywords</p>
            </div>
          )}

          {!loading && results && totalResults > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
              </p>

              <ResultSection
                title="Drugs & Medications"
                icon={Pill}
                items={results.drugs}
                type="drugs"
                color="#8B5CF6"
                onDrugClick={handleDrugClick}
              />
              <ResultSection
                title="Lab Values"
                icon={TestTube}
                items={results.lab_values}
                type="lab_values"
                color="#F59E0B"
              />
              <ResultSection
                title="Abbreviations"
                icon={Hash}
                items={results.abbreviations}
                type="abbreviations"
                color="#3B82F6"
              />
              <ResultSection
                title="Emergency References"
                icon={AlertTriangle}
                items={results.emergencies}
                type="emergencies"
                color="#F97316"
              />
              <ResultSection
                title="Medical Terms"
                icon={FileText}
                items={results.terminology}
                type="terminology"
                color="#8B5CF6"
              />
              <ResultSection
                title="Body Systems"
                icon={Heart}
                items={results.body_systems}
                type="body_systems"
                color="#EF4444"
              />
              <ResultSection
                title="Communication & Handover"
                icon={MessageSquare}
                items={results.communication}
                type="communication"
                color="#00A99D"
              />
            </>
          )}

          {!loading && !results && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Search for drugs, lab values, terms...</p>
              <p className="text-sm text-gray-400 mt-2">Enter at least 2 characters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
