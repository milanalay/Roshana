import { useState, useEffect } from "react";
import axios from "axios";
import { FileText, ArrowLeft, Search, BookOpen } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TermCard = ({ term, onClick }) => (
  <button
    onClick={() => onClick(term)}
    className="w-full text-left bg-[#F4F6F9] dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    data-testid={`term-${term.term}`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="font-bold text-[#1B3A6B] dark:text-white">{term.term}</span>
      <Badge variant="secondary" className="text-xs">{term.system}</Badge>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{term.definition}</p>
  </button>
);

const TermDetail = ({ term, onBack }) => (
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
      <h2 className="text-2xl font-bold text-[#1B3A6B] dark:text-white mb-2">
        {term.term}
      </h2>
      <Badge variant="secondary">{term.system}</Badge>
    </div>

    {/* Definition */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
      <h3 className="font-bold text-[#1B3A6B] dark:text-white mb-2">Definition</h3>
      <p className="text-gray-700 dark:text-gray-300">{term.definition}</p>
    </div>

    {/* Word Breakdown */}
    <div className="bg-[#8B5CF6]/10 rounded-2xl p-5">
      <h3 className="font-bold text-[#8B5CF6] mb-4">Word Breakdown</h3>
      <div className="space-y-3">
        {term.prefix && (
          <div className="flex items-center gap-3">
            <span className="w-16 text-sm font-semibold text-[#8B5CF6]">Prefix:</span>
            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg text-sm">
              <strong>{term.prefix}</strong> = {term.prefix_meaning}
            </span>
          </div>
        )}
        {term.root && (
          <div className="flex items-center gap-3">
            <span className="w-16 text-sm font-semibold text-[#8B5CF6]">Root:</span>
            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg text-sm">
              <strong>{term.root}</strong> = {term.root_meaning}
            </span>
          </div>
        )}
        {term.suffix && (
          <div className="flex items-center gap-3">
            <span className="w-16 text-sm font-semibold text-[#8B5CF6]">Suffix:</span>
            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg text-sm">
              <strong>{term.suffix}</strong> = {term.suffix_meaning}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Example */}
    <div className="bg-[#00A99D]/10 rounded-2xl p-5">
      <h3 className="font-bold text-[#00A99D] mb-2 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Clinical Example
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{term.example}"</p>
    </div>
  </div>
);

export default function TerminologyPage() {
  const navigate = useNavigate();
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API}/terminology`);
      setTerms(response.data.terms || []);
    } catch (error) {
      console.error("Error fetching terminology:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTerms = terms.filter((t) => 
    !searchQuery ||
    t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="terminology-page">
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
              <FileText className="w-6 h-6 text-[#8B5CF6]" />
              Medical Terms
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Prefixes, roots & suffixes</p>
          </div>
        </div>

        {/* Search */}
        {!selectedTerm && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl border-0 text-base"
              data-testid="term-search-input"
            />
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#F4F6F9] dark:bg-slate-800 rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          ) : selectedTerm ? (
            <TermDetail term={selectedTerm} onBack={() => setSelectedTerm(null)} />
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No terms found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTerms.map((term, index) => (
                <TermCard key={index} term={term} onClick={setSelectedTerm} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
