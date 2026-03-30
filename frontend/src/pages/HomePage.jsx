import { useState, useEffect, useRef, useMemo } from 'react';
import { drugs, categoryColors, scheduleColors } from '../data/drugs';
import { DrugDetailSheet } from '../components/DrugDetailSheet';
import { APP_VERSION, getAppStats } from '../data/meta';

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };
const C = {
  primary: '#1B3A6B',
  accent: '#00A99D',
  safe: '#10B981',
  caution: '#F59E0B',
  critical: '#EF4444',
};

// ─────────────────────────────────────────────────────────────
// InstallBanner — PWA add-to-home-screen prompt
// ─────────────────────────────────────────────────────────────
export const InstallBanner = () => {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setDismissed(true);
  };

  return (
    <div
      data-testid="install-banner"
      className="flex items-center gap-3 px-4 py-3 mx-4 mt-3 rounded-2xl"
      style={{ background: '#1B3A6B15', border: '1px solid #1B3A6B30' }}
    >
      <span className="text-xl flex-shrink-0">📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
          Install Roshana
        </p>
        <p className="text-xs text-gray-500" style={{ fontFamily: FONTS.body }}>
          Add to home screen for offline access
        </p>
      </div>
      <button
        data-testid="install-accept-btn"
        onClick={handleInstall}
        className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold text-white"
        style={{ background: C.primary, fontFamily: FONTS.heading, minHeight: '32px' }}
      >
        Install
      </button>
      <button
        data-testid="install-dismiss-btn"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
        aria-label="Dismiss install prompt"
      >
        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// WelcomeBanner
// ─────────────────────────────────────────────────────────────
export const WelcomeBanner = () => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      data-testid="welcome-banner"
      className="mx-4 mt-4 rounded-2xl px-5 py-4"
      style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #2d5fa8 100%)` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-pulse" aria-hidden="true">🩺</span>
        <div>
          <p className="text-white text-lg font-bold leading-tight" style={{ fontFamily: FONTS.heading }}>
            {greeting}!
          </p>
          <p className="text-blue-200 text-sm" style={{ fontFamily: FONTS.body }}>
            Ready for placement?
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// QuickLaunch tiles
// ─────────────────────────────────────────────────────────────
export const QuickLaunch = ({ onNavigate }) => {
  const tiles = [
    { id: 'drugs', emoji: '💊', title: 'Drug Reference', subtitle: `${drugs.length} Australian drugs`, color: '#8B5CF6', tab: 'drugs' },
    { id: 'must-know-s8', emoji: '⚠️', title: 'Must-Know S8s', subtitle: 'Controlled drug essentials', color: '#F97316', tab: 'drugs', search: 'S8' },
    { id: 'calc', emoji: '🧮', title: 'Calculators', subtitle: 'BMI, GFR, NEWS2 & more', color: C.accent, tab: 'calc' },
    { id: 'quiz', emoji: '🧠', title: 'Quiz Mode', subtitle: 'Test your knowledge', color: '#EC4899', tab: 'quiz' },
  ];

  return (
    <div data-testid="quick-launch" className="px-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
        Quick Launch
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            data-testid={`launch-tile-${tile.id}`}
            onClick={() => onNavigate(tile.tab, tile.search)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white text-left transition-all active:scale-95"
            style={{ minHeight: '64px', border: `1.5px solid ${tile.color}25` }}
          >
            <span
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${tile.color}15` }}
            >
              {tile.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight" style={{ color: tile.color, fontFamily: FONTS.heading }}>
                {tile.title}
              </p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5 truncate" style={{ fontFamily: FONTS.body }}>
                {tile.subtitle}
              </p>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Drug of the Day
// ─────────────────────────────────────────────────────────────
export const DrugOfTheDay = () => {
  const [selectedDrug, setSelectedDrug] = useState(null);

  const drug = useMemo(() => {
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return drugs[hash % drugs.length];
  }, []);

  const catColor = categoryColors[drug.category] || '#6B7280';
  const schedColor = scheduleColors[drug.schedule] || '#6B7280';

  return (
    <div data-testid="drug-of-the-day" className="px-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
        Drug of the Day
      </h2>
      <div className="bg-white rounded-2xl p-4" style={{ border: `1.5px solid ${catColor}30` }}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
          <h3 className="text-lg font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
            {drug.genericName}
          </h3>
          {drug.schedule && (
            <span
              className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: schedColor, fontSize: '10px' }}
            >
              {drug.schedule}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: FONTS.body }}>
          {drug.drugClass} · {drug.category}
        </p>
        {drug.nursingConsiderations?.[0] && (
          <div className="rounded-xl p-3 mb-3" style={{ background: `${catColor}10`, border: `1px solid ${catColor}20` }}>
            <p className="text-xs font-bold mb-1" style={{ color: catColor, fontFamily: FONTS.body }}>💡 Key Nursing Consideration</p>
            <p className="text-sm text-gray-700" style={{ fontFamily: FONTS.body }}>{drug.nursingConsiderations[0]}</p>
          </div>
        )}
        <button
          data-testid="dotd-view-btn"
          onClick={() => setSelectedDrug(drug)}
          className="w-full py-2.5 rounded-full text-sm font-bold text-white transition-opacity active:opacity-80"
          style={{ background: catColor, fontFamily: FONTS.heading, minHeight: '44px' }}
        >
          View Full Profile →
        </button>
      </div>
      <DrugDetailSheet drug={selectedDrug} onClose={() => setSelectedDrug(null)} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Quick Reference checklists (horizontal scroll)
// ─────────────────────────────────────────────────────────────
const CHECKLISTS = [
  {
    id: 'opioid', emoji: '😮‍💨', title: 'Before Every Opioid', color: '#F97316',
    items: ['Pain score assessed', 'RR ≥ 10 breaths/min', 'Sedation score acceptable', 'BP within parameters', 'S8 double-check done', 'Naloxone available'],
  },
  {
    id: 'insulin', emoji: '💉', title: 'Insulin Safety', color: C.safe,
    items: ['BGL checked immediately prior', 'Meal ready & patient can eat', 'Two-nurse check completed', 'Correct pen/device confirmed', 'Injection site rotated', 'Document time and site'],
  },
  {
    id: 'anticoag', emoji: '🩺', title: 'Anticoagulant Alerts', color: C.critical,
    items: ['INR checked before warfarin', 'No routine monitoring for DOACs', 'Check renal function (dabigatran)', 'Hold if active bleeding', 'Check for procedure hold orders', 'Document bleeding signs'],
  },
];

export const QuickReferenceCards = () => (
  <div data-testid="quick-reference">
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-4" style={{ fontFamily: FONTS.body }}>
      Quick Reference
    </h2>
    <div className="flex gap-3 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
      {CHECKLISTS.map((card) => (
        <div
          key={card.id}
          data-testid={`checklist-card-${card.id}`}
          className="flex-shrink-0 w-64 bg-white rounded-2xl p-4"
          style={{ border: `1.5px solid ${card.color}25` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{card.emoji}</span>
            <h3 className="text-sm font-bold" style={{ fontFamily: FONTS.heading, color: card.color }}>
              {card.title}
            </h3>
          </div>
          <ul className="space-y-1.5">
            {card.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600" style={{ fontFamily: FONTS.body }}>
                <span className="flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5" style={{ borderColor: card.color }} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Suffix cheat sheet (horizontal scroll chips)
// ─────────────────────────────────────────────────────────────
export const SuffixCheatSheet = ({ onNavigate }) => {
  const suffixes = useMemo(() => {
    const seen = new Set();
    return drugs.filter((d) => d.suffixClue).reduce((acc, d) => {
      if (!seen.has(d.suffixClue)) { seen.add(d.suffixClue); acc.push(d.suffixClue); }
      return acc;
    }, []);
  }, []);

  return (
    <div data-testid="suffix-cheat-sheet">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-4" style={{ fontFamily: FONTS.body }}>
        Suffix Cheat Sheet
      </h2>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
        {suffixes.map((clue) => {
          const [suffix, ...rest] = clue.split(' ');
          return (
            <button
              key={clue}
              data-testid={`suffix-chip-${suffix.replace(/[^a-z0-9]/gi, '')}`}
              onClick={() => onNavigate('drugs', suffix.replace(/[()]/g, '').trim())}
              className="flex-shrink-0 flex flex-col items-start px-3 py-2.5 rounded-xl bg-white text-left active:scale-95 transition-transform"
              style={{ minHeight: '44px', border: '1.5px solid #E5E7EB', minWidth: '130px' }}
            >
              <span className="text-xs font-bold text-[#1B3A6B]" style={{ fontFamily: FONTS.heading }}>
                {suffix}
              </span>
              <span className="text-xs text-gray-400 leading-tight" style={{ fontFamily: FONTS.body }}>
                {rest.join(' ')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Placement tips ticker (auto-advancing carousel)
// ─────────────────────────────────────────────────────────────
const TIPS = [
  '📋 Always check the full medication chart — look for paracetamol duplication across all products.',
  '🔑 S8 drugs require a two-nurse check and must be signed for at the time of administration.',
  '💊 Give with food unless contraindicated — many drugs cause less GI upset with meals.',
  '🩸 Check renal function before giving renally-cleared drugs in elderly or unwell patients.',
  '⚠️ Never crush modified-release tablets — it causes immediate dose dump and can be fatal.',
  "📞 If in doubt, don't give it out — call the prescriber or your team leader first.",
];

export const TipsTicker = () => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIndex((i) => (i + 1) % TIPS.length); setFading(false); }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div data-testid="tips-ticker" className="px-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: FONTS.body }}>
        Placement Tips
      </h2>
      <div className="bg-white rounded-2xl px-4 py-4" style={{ border: '1.5px solid #00A99D25', minHeight: '88px' }}>
        <p
          className="text-sm text-gray-700 leading-relaxed transition-opacity duration-300"
          style={{ fontFamily: FONTS.body, opacity: fading ? 0 : 1 }}
          data-testid="tip-text"
        >
          {TIPS[index]}
        </p>
        <div className="flex gap-1.5 mt-3 justify-center">
          {TIPS.map((_, i) => (
            <button
              key={i}
              data-testid={`tip-dot-${i}`}
              onClick={() => setIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === index ? '16px' : '6px', height: '6px', background: i === index ? C.accent : '#D1D5DB', minWidth: '6px' }}
              aria-label={`Tip ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ScrollToTop floating button
// ─────────────────────────────────────────────────────────────
export const ScrollToTopBtn = ({ scrollRef }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const handler = () => setVisible(el.scrollTop > 300);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <button
      data-testid="scroll-to-top-btn"
      onClick={() => scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="absolute bottom-4 right-4 w-10 h-10 rounded-full text-white shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
      style={{ background: C.primary, minWidth: '40px', minHeight: '40px' }}
      aria-label="Scroll to top"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// HomePage — default export
// ─────────────────────────────────────────────────────────────
const HomePage = ({ onNavigate }) => {
  const scrollRef = useRef(null);

  return (
    <div
      className="relative flex flex-col h-full bg-[#F4F6F9]"
      style={{ maxWidth: '448px', margin: '0 auto' }}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto" data-testid="home-scroll">
        <InstallBanner />
        <WelcomeBanner />
        <div className="space-y-6 py-5">
          <QuickLaunch onNavigate={onNavigate} />
          <DrugOfTheDay />
          <QuickReferenceCards />
          <SuffixCheatSheet onNavigate={onNavigate} />
          <TipsTicker />
        </div>
        {/* Version footer */}
        <p
          className="text-center text-gray-300 pb-1"
          style={{ fontFamily: FONTS.body, fontSize: '10px' }}
          data-testid="version-footer"
        >
          Roshana v{APP_VERSION} · {getAppStats().drugs} drugs · Educational use only
        </p>
        <div className="h-6" />
      </div>
      <ScrollToTopBtn scrollRef={scrollRef} />
    </div>
  );
};

export default HomePage;
