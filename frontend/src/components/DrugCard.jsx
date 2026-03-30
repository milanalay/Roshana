import { categoryColors, scheduleColors } from '../data/drugs';

/**
 * DrugCard - A single row in the drug browse list
 * @param {Object} drug - The drug object
 * @param {Function} onTap - Callback when tapped
 */
export const DrugCard = ({ drug, onTap }) => {
  const categoryColor = categoryColors[drug.category] || '#6B7280';
  const scheduleColor = scheduleColors[drug.schedule] || '#6B7280';

  return (
    <button
      data-testid={`drug-card-${drug.id}`}
      onClick={() => onTap(drug)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F4F6F9] active:bg-[#e8ecf0] transition-colors duration-100 text-left"
      style={{ minHeight: '56px' }}
      aria-label={`${drug.genericName}, ${drug.drugClass}`}
    >
      {/* Category colour dot */}
      <span
        data-testid="category-dot"
        className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: categoryColor }}
        aria-hidden="true"
      />

      {/* Drug info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-semibold text-[#1B3A6B] text-base leading-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {drug.genericName}
          </span>
          {/* Schedule badge */}
          {drug.schedule && (
            <span
              data-testid="schedule-badge"
              className="text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: scheduleColor, fontSize: '10px' }}
            >
              {drug.schedule}
            </span>
          )}
        </div>
        <p
          className="text-[#6B7280] text-sm mt-0.5 truncate"
          style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
        >
          {drug.drugClass}
        </p>
        {drug.brandNames && drug.brandNames.length > 0 && (
          <p
            className="text-[#9CA3AF] text-xs mt-0.5 truncate"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            {drug.brandNames.slice(0, 2).join(', ')}
          </p>
        )}
      </div>

      {/* PBS badge */}
      {drug.pbsListed && (
        <span
          data-testid="pbs-badge"
          className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
        >
          PBS
        </span>
      )}

      {/* Chevron */}
      <svg
        className="flex-shrink-0 w-4 h-4 text-[#9CA3AF]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export default DrugCard;
