import { useState } from 'react';

const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };
const C = {
  primary: '#1B3A6B',
  accent:  '#00A99D',
  safe:    '#10B981',
  caution: '#F59E0B',
};

// ─────────────────────────────────────────────────────────────
// Resource data — all verified free, Australian-focused
// ─────────────────────────────────────────────────────────────
const RESOURCES = [
  // ── Drug References ────────────────────────────────────────
  {
    id: 'nps',
    category: 'Drug Reference',
    name: 'NPS MedicineWise',
    subtitle: 'Independent Australian drug information',
    description: 'Australia\'s independent medicines authority. Consumer medicine information, drug interactions, safety alerts, and prescribing guidance.',
    emoji: '🇦🇺',
    color: '#1B3A6B',
    badge: 'Australian',
    searchable: true,
    searchUrl: (q) => `https://www.nps.org.au/search?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.nps.org.au',
    tip: 'Best for: Australian-specific drug info and patient leaflets',
  },
  {
    id: 'tga',
    category: 'Drug Reference',
    name: 'TGA Product Information',
    subtitle: 'Therapeutic Goods Administration — official PI',
    description: 'Official Australian government drug database. Contains the full approved Product Information (PI) for every registered medicine in Australia.',
    emoji: '🏛️',
    color: '#1B3A6B',
    badge: 'Official Gov',
    searchable: true,
    searchUrl: (q) => `https://www.tga.gov.au/search-results?search_api_fulltext=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.tga.gov.au',
    tip: 'Best for: Official Australian prescribing information, approvals',
  },
  {
    id: 'drugs-com',
    category: 'Drug Reference',
    name: 'Drugs.com',
    subtitle: 'Comprehensive drug database',
    description: 'Detailed drug monographs, interactions checker, pill identifier, and side effects database. One of the most comprehensive free drug references available.',
    emoji: '💊',
    color: '#0EA5E9',
    badge: 'Free',
    searchable: true,
    searchUrl: (q) => `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.drugs.com',
    tip: 'Best for: Drug interactions, side effects, dosing details',
  },
  {
    id: 'medscape',
    category: 'Drug Reference',
    name: 'Medscape Drug Reference',
    subtitle: 'Clinical drug monographs (free with account)',
    description: 'Detailed clinical drug monographs with dosing, pharmacology, warnings, and monitoring parameters. Free with a Medscape account.',
    emoji: '🩺',
    color: '#7C3AED',
    badge: 'Free (account)',
    searchable: true,
    searchUrl: (q) => `https://reference.medscape.com/search?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://reference.medscape.com',
    tip: 'Best for: Clinical dosing, IV compatibility, nursing alerts',
  },
  // ── Clinical Guidelines ────────────────────────────────────
  {
    id: 'rch',
    category: 'Clinical Guidelines',
    name: 'RCH Clinical Guidelines',
    subtitle: 'Royal Children\'s Hospital Melbourne',
    description: 'Comprehensive clinical practice guidelines from the Royal Children\'s Hospital Melbourne. Covers paediatric conditions, drugs, and procedures — many applicable to adult practice too.',
    emoji: '👶',
    color: '#10B981',
    badge: 'Australian',
    searchable: true,
    searchUrl: (q) => `https://www.rch.org.au/clinicalguide/guideline_index/?action=search&q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.rch.org.au/clinicalguide',
    tip: 'Best for: Paediatric drug dosing, clinical protocols',
  },
  {
    id: 'aci',
    category: 'Clinical Guidelines',
    name: 'ACI NSW Health Pathways',
    subtitle: 'NSW Agency for Clinical Innovation',
    description: 'Clinical guidelines, care pathways, and toolkits from NSW Health. Covers acute care, surgery, mental health, chronic disease management and more.',
    emoji: '🏥',
    color: '#10B981',
    badge: 'Australian',
    searchable: false,
    homeUrl: 'https://aci.health.nsw.gov.au/resources/clinical-tools',
    tip: 'Best for: NSW clinical care pathways and protocols',
  },
  {
    id: 'nhmrc',
    category: 'Clinical Guidelines',
    name: 'NHMRC Clinical Guidelines',
    subtitle: 'National Health & Medical Research Council',
    description: 'Australia\'s peak body for health and medical research guidelines. Evidence-based clinical practice guidelines covering major health conditions.',
    emoji: '🔬',
    color: '#10B981',
    badge: 'Australian',
    searchable: true,
    searchUrl: (q) => `https://www.nhmrc.gov.au/search?query=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.nhmrc.gov.au/about-us/publications/clinical-guidelines',
    tip: 'Best for: Evidence-based Australian clinical guidelines',
  },
  // ── Nursing Resources ──────────────────────────────────────
  {
    id: 'ausmed',
    category: 'Nursing Education',
    name: 'Ausmed',
    subtitle: 'Australian nursing CPD and education',
    description: 'Australia\'s leading nursing continuing professional development platform. Free articles, guides, and education resources covering clinical skills, pharmacology, and patient care.',
    emoji: '📚',
    color: '#F59E0B',
    badge: 'Australian',
    searchable: true,
    searchUrl: (q) => `https://www.ausmed.com.au/search?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.ausmed.com.au',
    tip: 'Best for: Nursing education, CPD articles, clinical explanations',
  },
  {
    id: 'nurseslabs',
    category: 'Nursing Education',
    name: 'Nurses Labs',
    subtitle: 'Nursing care plans, drug guides, NCLEX',
    description: 'Comprehensive nursing resource with drug study guides, care plans, nursing diagnoses, and study materials. Excellent for student nurses.',
    emoji: '📝',
    color: '#F59E0B',
    badge: 'Free',
    searchable: true,
    searchUrl: (q) => `https://nurseslabs.com/?s=${encodeURIComponent(q)}`,
    homeUrl: 'https://nurseslabs.com',
    tip: 'Best for: Drug study guides, nursing care plans, student resources',
  },
  {
    id: 'registerednursern',
    category: 'Nursing Education',
    name: 'RegisteredNurseRN',
    subtitle: 'NCLEX study guides and drug cards',
    description: 'Free nursing study resources including drug cards, pharmacology guides, and clinical review materials ideal for nursing students and new graduates.',
    emoji: '🎓',
    color: '#F59E0B',
    badge: 'Free',
    searchable: true,
    searchUrl: (q) => `https://www.registerednursern.com/?s=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.registerednursern.com',
    tip: 'Best for: Drug cards, pharm mnemonics, NCLEX-style review',
  },
  // ── Calculators ────────────────────────────────────────────
  {
    id: 'clincalc',
    category: 'Clinical Calculators',
    name: 'ClinCalc',
    subtitle: 'Medical calculators and drug dosing',
    description: 'Extensive library of clinical calculators — drug dosing, CrCl/eGFR, BSA, pharmacokinetics, statistics, and more. Evidence-based with references.',
    emoji: '🧮',
    color: '#EF4444',
    badge: 'Free',
    searchable: true,
    searchUrl: (q) => `https://clincalc.com/search/?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://clincalc.com',
    tip: 'Best for: Drug dosing calculators, PK calculations, GFR',
  },
  {
    id: 'mdcalc',
    category: 'Clinical Calculators',
    name: 'MDCalc',
    subtitle: 'Clinical decision tools and scores',
    description: 'Clinical scores, risk calculators, and decision support tools. NEWS2, GCS, Wells scores, CURB-65, qSOFA, and hundreds more — all with embedded evidence.',
    emoji: '📊',
    color: '#EF4444',
    badge: 'Free',
    searchable: true,
    searchUrl: (q) => `https://www.mdcalc.com/search#?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.mdcalc.com',
    tip: 'Best for: Clinical scoring, NEWS2, risk stratification tools',
  },
  // ── Drug Safety ────────────────────────────────────────────
  {
    id: 'interactions',
    category: 'Drug Safety',
    name: 'Drugs.com Interaction Checker',
    subtitle: 'Check drug-drug and drug-food interactions',
    description: 'Free interaction checker for up to 30 drugs simultaneously. Shows severity, mechanism, and management of drug interactions.',
    emoji: '⚠️',
    color: '#DC2626',
    badge: 'Free',
    searchable: false,
    homeUrl: 'https://www.drugs.com/drug_interactions.html',
    tip: 'Best for: Checking interactions before administering multiple drugs',
  },
  {
    id: 'safetyalerts',
    category: 'Drug Safety',
    name: 'TGA Safety Alerts',
    subtitle: 'Australian drug recalls and safety updates',
    description: 'Real-time Australian drug safety alerts, recalls, and medicine shortage updates from the TGA. Important for ward-level drug management.',
    emoji: '🚨',
    color: '#DC2626',
    badge: 'Official Gov',
    searchable: false,
    homeUrl: 'https://www.tga.gov.au/safety-information',
    tip: 'Best for: Drug recalls, safety warnings, current Australian alerts',
  },
];

const CATEGORIES = ['All', 'Drug Reference', 'Clinical Guidelines', 'Nursing Education', 'Clinical Calculators', 'Drug Safety'];

const CAT_COLORS = {
  'Drug Reference':       '#1B3A6B',
  'Clinical Guidelines':  '#10B981',
  'Nursing Education':    '#F59E0B',
  'Clinical Calculators': '#EF4444',
  'Drug Safety':          '#DC2626',
};

// ─────────────────────────────────────────────────────────────
// ResourceCard
// ─────────────────────────────────────────────────────────────
const ResourceCard = ({ resource }) => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) {
      window.open(resource.homeUrl, '_blank', 'noopener');
      return;
    }
    const url = resource.searchable
      ? resource.searchUrl(query.trim())
      : resource.homeUrl;
    window.open(url, '_blank', 'noopener');
  };

  const handleOpen = () => {
    window.open(resource.homeUrl, '_blank', 'noopener');
  };

  return (
    <div
      data-testid={`resource-card-${resource.id}`}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${resource.color}25` }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
        style={{ minHeight: '60px', background: expanded ? `${resource.color}08` : 'transparent' }}
        aria-expanded={expanded}
      >
        <span
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${resource.color}15` }}
        >
          {resource.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold leading-tight" style={{ fontFamily: FONTS.heading, color: resource.color }}>
              {resource.name}
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${resource.color}15`, color: resource.color, fontFamily: FONTS.body, fontSize: '9px' }}
            >
              {resource.badge}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug" style={{ fontFamily: FONTS.body }}>
            {resource.subtitle}
          </p>
        </div>
        <svg
          className="w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200"
          style={{ color: '#9CA3AF', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {/* Description */}
          <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: FONTS.body }}>
            {resource.description}
          </p>

          {/* Tip */}
          <div
            className="rounded-xl px-3 py-2"
            style={{ background: `${resource.color}08`, border: `1px solid ${resource.color}20` }}
          >
            <p className="text-xs font-semibold" style={{ color: resource.color, fontFamily: FONTS.body }}>
              💡 {resource.tip}
            </p>
          </div>

          {/* Search box if searchable */}
          {resource.searchable && (
            <div className="flex gap-2">
              <input
                data-testid={`resource-search-${resource.id}`}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search ${resource.name}…`}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-[#F4F6F9] outline-none focus:ring-2 transition-shadow"
                style={{ fontFamily: FONTS.body, minHeight: '44px', focusRingColor: resource.color }}
              />
              <button
                data-testid={`resource-search-btn-${resource.id}`}
                onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 flex-shrink-0"
                style={{ background: resource.color, minHeight: '44px', fontFamily: FONTS.heading }}
              >
                Search
              </button>
            </div>
          )}

          {/* Open website button */}
          <button
            data-testid={`resource-open-${resource.id}`}
            onClick={handleOpen}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              minHeight: '44px',
              background: 'transparent',
              border: `2px solid ${resource.color}`,
              color: resource.color,
              fontFamily: FONTS.heading,
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open {resource.name}
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ReferencesPage — default export
// ─────────────────────────────────────────────────────────────
const ReferencesPage = () => {
  const [category, setCategory] = useState('All');

  const filtered = category === 'All'
    ? RESOURCES
    : RESOURCES.filter((r) => r.category === category);

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filtered.filter((r) => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]" style={{ maxWidth: '448px', margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-0 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📖</span>
          <h1 className="text-xl font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
            References
          </h1>
        </div>
        <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
          Free, trusted resources — opens in your browser
        </p>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            const color = CAT_COLORS[cat] || C.primary;
            return (
              <button
                key={cat}
                data-testid={`ref-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setCategory(cat)}
                className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                style={{
                  minHeight: '32px',
                  background: active ? color : `${color}15`,
                  color: active ? '#FFFFFF' : color,
                  fontFamily: FONTS.body,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-6">
        {/* Disclaimer */}
        <div
          className="rounded-2xl px-4 py-3 flex gap-3 items-start"
          style={{ background: '#F59E0B10', border: '1px solid #F59E0B30' }}
        >
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-800 leading-relaxed" style={{ fontFamily: FONTS.body }}>
            These resources open in your browser. Always verify clinical information with your facility's protocols and a senior clinician before acting. Educational use only.
          </p>
        </div>

        {category === 'All' ? (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="space-y-2">
              <p
                className="text-xs font-bold uppercase tracking-wide px-1"
                style={{ color: CAT_COLORS[cat], fontFamily: FONTS.body }}
              >
                {cat}
              </p>
              {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-2" style={{ fontFamily: FONTS.body }}>
          14 free resources · All links verified April 2026
        </p>
      </div>
    </div>
  );
};

export default ReferencesPage;
