// ─────────────────────────────────────────────────────────────────────────────
// App.js — Roshana-App root (Step 7: Tools tab added)
//
// FILE LOCATIONS:
//  drugs.js            → /frontend/src/data/drugs.js
//  DrugCard.jsx        → /frontend/src/components/DrugCard.jsx
//  DrugDetailSheet.jsx → /frontend/src/components/DrugDetailSheet.jsx
//  HomePage.jsx        → /frontend/src/pages/HomePage.jsx
//  DrugPage.jsx        → /frontend/src/pages/DrugPage.jsx
//  CalcPage.jsx        → /frontend/src/pages/CalcPage.jsx
//  QuizPage.jsx        → /frontend/src/pages/QuizPage.jsx
//  ScenariosPage.jsx   → /frontend/src/pages/ScenariosPage.jsx
//  ToolsPage.jsx       → /frontend/src/pages/ToolsPage.jsx     ← NEW (Step 7)
//  App.js              → /frontend/src/App.js
//  manifest.json       → /frontend/public/manifest.json
//  sw.js               → /frontend/public/sw.js
//  index.html          → /frontend/public/index.html
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import DrugPage from './pages/DrugPage';
import CalcPage from './pages/CalcPage';
import QuizPage from './pages/QuizPage';
import ScenariosPage from './pages/ScenariosPage';
import ToolsPage from './pages/ToolsPage';
import ErrorBoundary from './components/ErrorBoundary';

const FONTS = { heading: 'Manrope, sans-serif', body: 'IBM Plex Sans, sans-serif' };

// ─────────────────────────────────────────────────────────────
// SplashScreen
// ─────────────────────────────────────────────────────────────
export const SplashScreen = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const tick = (now) => {
      const pct = Math.min(((now - start) / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const doneTimer = setTimeout(onDone, 1500);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div
      data-testid="splash-screen"
      className="fixed inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-300"
      style={{ background: '#1B3A6B', opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
    >
      <span className="text-6xl mb-4 animate-pulse">🩺</span>
      <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: FONTS.heading }}>Roshana</h1>
      <p className="text-blue-300 text-sm mb-10" style={{ fontFamily: FONTS.body }}>Your placement companion</p>
      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00A99D, #ffffff)' }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// OfflineToast
// ─────────────────────────────────────────────────────────────
export const OfflineToast = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div
      data-testid="offline-toast"
      className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white"
      style={{ background: '#F59E0B', fontFamily: FONTS.body, minHeight: '36px' }}
      role="status" aria-live="polite"
    >
      <span>📵</span>
      <span>You're offline — drug data still available</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Nav icons (20px — fits 6 tabs)
// ─────────────────────────────────────────────────────────────
const ico = (active) => ({ width: 20, height: 20, fill: 'none', stroke: active ? '#1B3A6B' : '#9CA3AF', strokeWidth: 2, viewBox: '0 0 24 24' });

const HomeIcon   = ({ active }) => <svg {...ico(active)}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
const DrugIcon   = ({ active }) => <svg {...ico(active)}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;
const CalcIcon   = ({ active }) => <svg {...ico(active)}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
const QuizIcon   = ({ active }) => <svg {...ico(active)}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const SafetyIcon = ({ active }) => <svg {...ico(active)}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
const ToolsIcon  = ({ active }) => <svg {...ico(active)}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>;

const TABS = [
  { id: 'home',   label: 'Home',   Icon: HomeIcon },
  { id: 'drugs',  label: 'Drugs',  Icon: DrugIcon },
  { id: 'calc',   label: 'Calc',   Icon: CalcIcon },
  { id: 'quiz',   label: 'Quiz',   Icon: QuizIcon },
  { id: 'safety', label: 'Safety', Icon: SafetyIcon },
  { id: 'tools',  label: 'Tools',  Icon: ToolsIcon },
];

// ─────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────
function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [drugSearchQuery, setDrugSearchQuery] = useState('');

  const handleNavigate = useCallback((tabId, searchQuery) => {
    setActiveTab(tabId);
    if (tabId === 'drugs' && searchQuery) setDrugSearchQuery(searchQuery);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'drugs') setDrugSearchQuery('');
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':   return <HomePage onNavigate={handleNavigate} />;
      case 'drugs':  return <DrugPage initialSearch={drugSearchQuery} onSearchConsumed={() => setDrugSearchQuery('')} />;
      case 'calc':   return <CalcPage />;
      case 'quiz':   return <QuizPage />;
      case 'safety': return <ScenariosPage />;
      case 'tools':  return <ToolsPage onNavigate={handleNavigate} />;
      default:       return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

        <div
          className="flex flex-col h-screen bg-[#F4F6F9] overflow-hidden"
          style={{ maxWidth: '448px', margin: '0 auto' }}
        >
          <OfflineToast />

          <div className="flex-1 overflow-hidden">{renderContent()}</div>

          {/* 6-tab bottom nav */}
          <nav
            className="flex-shrink-0 bg-white border-t border-gray-100 flex"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            role="navigation"
            aria-label="Main navigation"
          >
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  data-testid={`nav-tab-${id}`}
                  onClick={() => handleTabChange(id)}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                  style={{ minHeight: '56px' }}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                >
                  <Icon active={active} />
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: '9px',
                      color: active ? '#1B3A6B' : '#9CA3AF',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </>
    </ErrorBoundary>
  );
}

export default App;
