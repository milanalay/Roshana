import { useNavigate } from "react-router-dom";
import { useApp } from "../App";
import { Moon, Sun, Bookmark, Info, FileText, Shield, HelpCircle, ExternalLink, ChevronRight } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { ScrollArea } from "../components/ui/scroll-area";

const SettingItem = ({ icon: Icon, label, description, action, color = "#1B3A6B" }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="font-medium text-[#1B3A6B] dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
    </div>
    {action}
  </div>
);

const NavItem = ({ icon: Icon, label, description, onClick, color = "#1B3A6B" }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800 last:border-0"
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-left">
        <div className="font-medium text-[#1B3A6B] dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </button>
);

const LinkItem = ({ icon: Icon, label, href, color = "#1B3A6B" }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-slate-800 last:border-0"
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="font-medium text-[#1B3A6B] dark:text-white">{label}</div>
    </div>
    <ExternalLink className="w-5 h-5 text-gray-400" />
  </a>
);

export default function MorePage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="more-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white">
          Settings & More
        </h1>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-5 space-y-6">
          {/* App Settings */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              App Settings
            </h2>
            <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl px-4">
              <SettingItem
                icon={darkMode ? Moon : Sun}
                label="Dark Mode"
                description="Easier on the eyes in low light"
                color="#8B5CF6"
                action={
                  <Switch
                    checked={darkMode}
                    onCheckedChange={toggleDarkMode}
                    data-testid="dark-mode-toggle"
                  />
                }
              />
              <NavItem
                icon={Bookmark}
                label="Bookmarks"
                description="Your saved references"
                color="#F59E0B"
                onClick={() => navigate("/bookmarks")}
              />
            </div>
          </section>

          {/* Resources */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Australian Resources
            </h2>
            <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl px-4">
              <LinkItem
                icon={Shield}
                label="AHPRA"
                href="https://www.ahpra.gov.au"
                color="#1B3A6B"
              />
              <LinkItem
                icon={FileText}
                label="NMBA Standards"
                href="https://www.nursingmidwiferyboard.gov.au"
                color="#00A99D"
              />
              <LinkItem
                icon={HelpCircle}
                label="Australian Resuscitation Council"
                href="https://resus.org.au"
                color="#EF4444"
              />
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              About
            </h2>
            <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl px-4">
              <SettingItem
                icon={Info}
                label="About NurseReady"
                description="Version 1.0.0"
                color="#3B82F6"
                action={null}
              />
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Important Disclaimer
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              NurseReady is for educational purposes only. Always verify clinical 
              information with current Australian guidelines, MIMS Australia, or 
              qualified healthcare professionals before any clinical application.
            </p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
