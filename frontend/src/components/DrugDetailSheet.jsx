import { useState, useEffect } from 'react';
import { categoryColors, scheduleColors } from '../data/drugs';

const TABS = ['Overview', 'Nursing', 'Doses', 'Warnings'];

/**
 * DrugDetailSheet - Bottom sheet showing full drug detail with tabs
 * @param {Object|null} drug - Drug object to display, or null to hide
 * @param {Function} onClose - Callback to close the sheet
 */
export const DrugDetailSheet = ({ drug, onClose }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [visible, setVisible] = useState(false);

  // Reset tab on new drug
  useEffect(() => {
    if (drug) {
      setActiveTab('Overview');
      // Small delay to trigger animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [drug]);

  if (!drug) return null;

  const categoryColor = categoryColors[drug.category] || '#6B7280';
  const scheduleColor = scheduleColors[drug.schedule] || '#6B7280';

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="detail-sheet-backdrop"
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        data-testid="detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${drug.genericName} drug information`}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-250 ease-out"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '92vh',
          maxWidth: '448px',
          margin: '0 auto',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-xl font-bold text-[#1B3A6B] leading-tight"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                  data-testid="drug-name-heading"
                >
                  {drug.genericName}
                </h2>
                {drug.schedule && (
                  <span
                    data-testid="detail-schedule-badge"
                    className="text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: scheduleColor, fontSize: '11px' }}
                  >
                    {drug.schedule}
                  </span>
                )}
                {drug.pbsListed && (
                  <span
                    data-testid="detail-pbs-badge"
                    className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 flex-shrink-0"
                  >
                    PBS
                  </span>
                )}
              </div>

              {/* Drug class + category */}
              <p
                className="text-sm mt-0.5"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: categoryColor }}
              >
                {drug.drugClass}
              </p>
              <p
                className="text-xs text-gray-400 mt-0.5"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                {drug.category}
              </p>

              {/* Brand name pills */}
              {drug.brandNames && drug.brandNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {drug.brandNames.map((brand) => (
                    <span
                      key={brand}
                      data-testid="brand-pill"
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              )}

              {/* Suffix clue */}
              {drug.suffixClue && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8B5CF6] font-semibold bg-purple-50 px-2 py-0.5 rounded">
                    💊 {drug.suffixClue}
                  </span>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              data-testid="close-sheet-btn"
              onClick={handleClose}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="Close drug detail"
              style={{ minWidth: '36px', minHeight: '36px' }}
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b border-gray-100 overflow-x-auto flex-shrink-0"
          role="tablist"
          aria-label="Drug information tabs"
          style={{ scrollbarWidth: 'none' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              data-testid={`tab-${tab.toLowerCase()}`}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                color: activeTab === tab ? '#1B3A6B' : '#9CA3AF',
                borderBottom: activeTab === tab ? '2px solid #00A99D' : '2px solid transparent',
                minWidth: '70px',
                minHeight: '44px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content - scrollable */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          role="tabpanel"
          data-testid="tab-content"
          aria-label={activeTab}
        >
          {activeTab === 'Overview' && <OverviewTab drug={drug} categoryColor={categoryColor} />}
          {activeTab === 'Nursing' && <NursingTab drug={drug} />}
          {activeTab === 'Doses' && <DosesTab drug={drug} />}
          {activeTab === 'Warnings' && <WarningsTab drug={drug} />}

          {/* Australian context */}
          {drug.australianContext && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-0.5">🇦🇺 Australian Context</p>
              <p className="text-xs text-blue-600" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {drug.australianContext}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed text-center" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            For educational use only. Always verify with current MIMS Australia and your facility's medication chart. Clinical decisions must be made by registered practitioners.
          </p>

          {/* Bottom padding for close button */}
          <div className="h-20" />
        </div>

        {/* Sticky close button */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-white via-white">
          <button
            data-testid="close-sheet-bottom-btn"
            onClick={handleClose}
            className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-opacity active:opacity-80"
            style={{
              backgroundColor: '#1B3A6B',
              fontFamily: 'Manrope, sans-serif',
              minHeight: '48px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

/* ─────────────── Tab sub-components ─────────────── */

const SectionHeading = ({ children }) => (
  <h3
    className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 mt-4 first:mt-0"
    style={{ fontFamily: 'Manrope, sans-serif' }}
  >
    {children}
  </h3>
);

const Tag = ({ children, color = 'gray' }) => {
  const styles = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700',
    teal: 'bg-teal-50 text-teal-700',
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[color]}`}
      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
    >
      {children}
    </span>
  );
};

const BulletList = ({ items }) => (
  <ul className="space-y-1">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2 text-sm text-gray-700" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const OverviewTab = ({ drug }) => (
  <div>
    {drug.indications && drug.indications.length > 0 && (
      <>
        <SectionHeading>Indications</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drug.indications.map((ind) => (
            <Tag key={ind} color="blue">{ind}</Tag>
          ))}
        </div>
      </>
    )}

    {drug.routes && drug.routes.length > 0 && (
      <>
        <SectionHeading>Routes</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drug.routes.map((r) => (
            <Tag key={r} color="teal">{r}</Tag>
          ))}
        </div>
      </>
    )}

    {drug.availableForms && drug.availableForms.length > 0 && (
      <>
        <SectionHeading>Available Forms</SectionHeading>
        <BulletList items={drug.availableForms} />
      </>
    )}
  </div>
);

const NursingTab = ({ drug }) => (
  <div>
    {drug.nursingConsiderations && drug.nursingConsiderations.length > 0 && (
      <>
        <SectionHeading>Nursing Considerations</SectionHeading>
        <ol className="space-y-2">
          {drug.nursingConsiderations.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center text-xs font-bold"
                style={{ fontSize: '10px' }}
              >
                {i + 1}
              </span>
              <span className="mt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      </>
    )}

    {drug.relevantLabs && drug.relevantLabs.length > 0 && (
      <>
        <SectionHeading>Relevant Labs / Monitoring</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drug.relevantLabs.map((lab) => (
            <Tag key={lab} color="blue">{lab}</Tag>
          ))}
        </div>
      </>
    )}

    {drug.patientTeaching && (
      <>
        <SectionHeading>Patient Teaching</SectionHeading>
        <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
          <p className="text-sm text-teal-800" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            💬 {drug.patientTeaching}
          </p>
        </div>
      </>
    )}
  </div>
);

const DosesTab = ({ drug }) => (
  <div>
    {drug.normalDose && (
      <>
        <SectionHeading>Normal Dose</SectionHeading>
        <p
          className="text-2xl font-bold text-[#1B3A6B] leading-tight mb-4"
          style={{ fontFamily: 'Manrope, sans-serif' }}
          data-testid="normal-dose-text"
        >
          {drug.normalDose}
        </p>
      </>
    )}

    {drug.maxDose && (
      <>
        <SectionHeading>Maximum Dose</SectionHeading>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4">
          <p
            className="text-lg font-bold text-amber-800"
            style={{ fontFamily: 'Manrope, sans-serif' }}
            data-testid="max-dose-text"
          >
            {drug.maxDose}
          </p>
        </div>
      </>
    )}

    {drug.routes && drug.routes.length > 0 && (
      <>
        <SectionHeading>Routes</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drug.routes.map((r) => (
            <Tag key={r} color="teal">{r}</Tag>
          ))}
        </div>
      </>
    )}

    {drug.availableForms && drug.availableForms.length > 0 && (
      <>
        <SectionHeading>Available Forms</SectionHeading>
        <BulletList items={drug.availableForms} />
      </>
    )}
  </div>
);

const WarningsTab = ({ drug }) => (
  <div>
    {drug.redFlags && drug.redFlags.length > 0 && (
      <>
        <SectionHeading>Red Flags 🚨</SectionHeading>
        <div className="space-y-2 mb-4">
          {drug.redFlags.map((flag, i) => (
            <div
              key={i}
              className="flex gap-2 items-start bg-red-50 border border-red-100 rounded-xl p-3"
            >
              <span className="text-red-500 text-sm mt-0.5 flex-shrink-0">⚠️</span>
              <p className="text-sm text-red-800 font-medium" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {flag}
              </p>
            </div>
          ))}
        </div>
      </>
    )}

    {drug.holdIf && drug.holdIf.length > 0 && (
      <>
        <SectionHeading>Hold If</SectionHeading>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4">
          <BulletList items={drug.holdIf} />
        </div>
      </>
    )}

    {drug.contraindications && drug.contraindications.length > 0 && (
      <>
        <SectionHeading>Contraindications</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drug.contraindications.map((c) => (
            <span
              key={c}
              className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-700"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              {c}
            </span>
          ))}
        </div>
      </>
    )}

    {drug.sideEffects && drug.sideEffects.length > 0 && (
      <>
        <SectionHeading>Side Effects</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {drug.sideEffects.map((se) => (
            <Tag key={se} color="gray">{se}</Tag>
          ))}
        </div>
      </>
    )}
  </div>
);

export default DrugDetailSheet;
