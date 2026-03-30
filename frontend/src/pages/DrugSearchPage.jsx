import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Pill, ArrowLeft, Search, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookmarkButton } from "../components/BookmarkButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DrugCard = ({ drug }) => (
  <div
    className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-4"
    data-testid={`drug-${drug.generic_name}`}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <h3 className="font-bold text-[#1B3A6B] dark:text-white">{drug.generic_name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{drug.brand_name}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-[#8B5CF6] text-white text-xs">{drug.drug_class}</Badge>
        <BookmarkButton
          item={{
            type: "drug",
            id: drug.generic_name.toLowerCase().replace(/\s+/g, "-"),
            title: drug.generic_name,
            subtitle: drug.brand_name
          }}
          size="sm"
        />
      </div>
    </div>
    <div className="space-y-2 mt-3">
      <div>
        <span className="text-xs font-semibold text-gray-500 uppercase">Route</span>
        <p className="text-sm text-gray-700 dark:text-gray-300">{drug.route}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-gray-500 uppercase">Indications</span>
        <p className="text-sm text-gray-700 dark:text-gray-300">{drug.indications}</p>
      </div>
      {drug.warnings && drug.warnings !== "Not available" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mt-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">{drug.warnings}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

const ExampleDrugs = ["Paracetamol", "Metformin", "Amlodipine", "Salbutamol", "Omeprazole", "Morphine"];

export default function DrugSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchedAs, setSearchedAs] = useState(null);

  // Auto-search if query param provided
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (query) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim() || searchTerm.length < 2) return;

    setLoading(true);
    setSearched(true);
    setSearchQuery(searchTerm);
    
    try {
      const response = await axios.get(`${API}/drugs/search`, {
        params: { query: searchTerm }
      });
      setResults(response.data.results || []);
      setSearchedAs(response.data.searched_as);
    } catch (error) {
      console.error("Drug search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="drug-search-page">
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
              <Pill className="w-6 h-6 text-[#8B5CF6]" />
              Drug Search
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Search medications by name</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search drug name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl border-0 text-base"
              data-testid="drug-search-input"
            />
          </div>
          <Button 
            type="submit"
            disabled={!searchQuery.trim() || searchQuery.length < 2 || loading}
            className="h-12 px-6 bg-[#8B5CF6] hover:bg-[#7c4ddb] text-white rounded-2xl"
            data-testid="drug-search-btn"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      {/* Disclaimer Banner */}
      <div className="mx-5 mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Drug information sourced from OpenFDA (US-based). Australian drug names, PBS listing, and approved indications may differ. 
          Always cross-reference with current MIMS Australia before administration.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 pb-32">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No drugs found for "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Found {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                {searchedAs && (
                  <Badge variant="secondary" className="text-xs">
                    Searched as: {searchedAs}
                  </Badge>
                )}
              </div>
              {results.map((drug, index) => (
                <DrugCard key={index} drug={drug} />
              ))}
            </div>
          )}

          {/* Default State - Show search prompt */}
          {!loading && !searched && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#8B5CF6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-[#8B5CF6]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1B3A6B] dark:text-white mb-2">
                Search for a medication
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Enter the generic or brand name to find drug information
              </p>

              {/* Example Searches */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {ExampleDrugs.map((drug) => (
                    <button
                      key={drug}
                      onClick={() => handleSearch(drug)}
                      className="px-4 py-2 bg-[#F4F6F9] dark:bg-slate-800 rounded-full text-sm text-[#1B3A6B] dark:text-white hover:bg-[#8B5CF6]/10 transition-colors"
                      data-testid={`example-${drug.toLowerCase()}`}
                    >
                      {drug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
