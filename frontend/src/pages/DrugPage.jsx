import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { drugs } from '../data/drugs';
import { DrugCard } from '../components/DrugCard';
import { DrugDetailSheet } from '../components/DrugDetailSheet';

/**
 * DrugPage - Drug reference browser with A-Z index and local search
 * Default export (page component)
 */
const DrugPage = ({ initialSearch = '', onSearchConsumed }) => {
  const [query, setQuery] = useState(initialSearch);

  // If a new initialSearch arrives (deep-link), apply it
  useEffect(() => {
    if (initialSearch) {
      setQuery(initialSearch);
      onSearchConsumed?.();
    }
  }, [initialSearch]); // eslint-disable-line
  const [selectedDrug, setSelectedDrug] = useState(null);
  const searchRef = useRef(null);

  // Sort all drugs A-Z by generic name
  const allDrugsSorted = useMemo(
    () => [...drugs].sort((a, b) => a.genericName.localeCompare(b.genericName)),
    []
  );

  // Filter drugs based on search query
  const filteredDrugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allDrugsSorted;
    return allDrugsSorted.filter(
      (d) =>
        d.genericName.toLowerCase().includes(q) ||
        d.brandNames.some((b) => b.toLowerCase().includes(q)) ||
        d.drugClass.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.schedule && d.schedule.toLowerCase().includes(q)) ||
        (d.suffixClue && d.suffixClue.toLowerCase().includes(q))
    );
  }, [query, allDrugsSorted]);

  // Group by first letter for browse mode
  const groupedDrugs = useMemo(() => {
    if (query.trim()) return null; // flat list in search mode
    const groups = {};
    filteredDrugs.forEach((drug) => {
      const letter = drug.genericName[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(drug);
    });
    return groups;
  }, [filteredDrugs, query]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    searchRef.current?.focus();
  }, []);

  const isSearching = query.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full bg-[#F4F6F9]"
      style={{ maxWidth: '448px', margin: '0 auto', fontFamily: 'IBM Plex Sans, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl" aria-hidden="true">💊</span>
          <h1
            className="text-xl font-bold text-[#1B3A6B]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Drug Reference
          </h1>
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
          >
            {drugs.length} drugs
          </span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            data-testid="drug-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search generic name, brand, class…"
            className="w-full pl-9 pr-10 py-3 bg-[#F4F6F9] rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#00A99D] transition-shadow"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '44px' }}
            aria-label="Search drugs"
          />
          {isSearching && (
            <button
              data-testid="clear-search-btn"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search results count */}
        {isSearching && (
          <p className="text-xs text-gray-400 mt-2 pl-1" aria-live="polite">
            {filteredDrugs.length === 0
              ? 'No results'
              : `${filteredDrugs.length} result${filteredDrugs.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Drug list */}
      <div
        className="flex-1 overflow-y-auto"
        data-testid="drug-list-scroll"
        role="list"
        aria-label="Drug list"
      >
        {/* No results state */}
        {filteredDrugs.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-20 px-8 text-center"
            data-testid="no-results"
          >
            <span className="text-5xl mb-3" aria-hidden="true">💊</span>
            <p
              className="text-base font-semibold text-[#8B5CF6] mb-1"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              No drugs found
            </p>
            <p className="text-sm text-gray-400">
              Try a generic name, brand name, or drug class
            </p>
          </div>
        )}

        {/* Search mode — flat list */}
        {isSearching && filteredDrugs.length > 0 && (
          <div className="bg-white divide-y divide-gray-50" role="list">
            {filteredDrugs.map((drug) => (
              <div key={drug.id} role="listitem">
                <DrugCard drug={drug} onTap={setSelectedDrug} />
              </div>
            ))}
          </div>
        )}

        {/* Browse mode — A-Z grouped */}
        {!isSearching && groupedDrugs && Object.keys(groupedDrugs).length > 0 && (
          <div>
            {Object.entries(groupedDrugs)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, letterDrugs]) => (
                <div key={letter}>
                  {/* Sticky section header */}
                  <div
                    data-testid={`section-header-${letter}`}
                    className="sticky top-0 z-10 px-4 py-1.5 bg-[#F4F6F9] border-b border-gray-200"
                  >
                    <span
                      className="text-xs font-bold text-[#1B3A6B]"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {letter}
                    </span>
                  </div>
                  <div className="bg-white divide-y divide-gray-50" role="list">
                    {letterDrugs.map((drug) => (
                      <div key={drug.id} role="listitem">
                        <DrugCard drug={drug} onTap={setSelectedDrug} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </div>

      {/* Drug detail sheet */}
      <DrugDetailSheet drug={selectedDrug} onClose={() => setSelectedDrug(null)} />
    </div>
  );
};

export default DrugPage;
