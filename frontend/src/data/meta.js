import { drugs } from './drugs';

// ─────────────────────────────────────────────────────────────
// Roshana App Metadata
// ─────────────────────────────────────────────────────────────

/** Semantic version — bump on every release */
export const APP_VERSION = '1.0.0';

/** Build date — the date this file was last updated */
export const BUILD_DATE = '2026-03-29';

/** Total number of drugs in the database (live count from drugs.js) */
export const DRUG_COUNT = drugs.length;

/** Total clinical safety scenarios (hardcoded in ScenariosPage.jsx) */
export const SCENARIO_COUNT = 15;

/** Total calculators (hardcoded in CalcPage.jsx) */
export const CALCULATOR_COUNT = 8;

/** Total drug categories */
export const CATEGORY_COUNT = [
  ...new Set(drugs.map((d) => d.category)),
].length;

/** Total S8 drugs in the database */
export const S8_DRUG_COUNT = drugs.filter((d) => d.schedule === 'S8').length;

/** Total PBS-listed drugs */
export const PBS_DRUG_COUNT = drugs.filter((d) => d.pbsListed).length;

/**
 * getAppStats — returns all app statistics as a plain object.
 * Useful for displaying stats in the UI or for analytics.
 *
 * @returns {{ version: string, buildDate: string, drugs: number, categories: number, s8Drugs: number, pbsDrugs: number, scenarios: number, calculators: number }}
 */
export const getAppStats = () => ({
  version:      APP_VERSION,
  buildDate:    BUILD_DATE,
  drugs:        DRUG_COUNT,
  categories:   CATEGORY_COUNT,
  s8Drugs:      S8_DRUG_COUNT,
  pbsDrugs:     PBS_DRUG_COUNT,
  scenarios:    SCENARIO_COUNT,
  calculators:  CALCULATOR_COUNT,
});

export default getAppStats;
