import { NavLink } from "react-router-dom";
import { Home, Search, Calculator, MessageCircle, MoreHorizontal } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/search", icon: Search, label: "Search" },
  { path: "/calculators", icon: Calculator, label: "Calculators" },
  { path: "/chat", icon: MessageCircle, label: "Ask AI" },
  { path: "/more", icon: MoreHorizontal, label: "More" },
];

export const BottomNav = () => {
  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="grid grid-cols-5 items-center justify-items-center h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive
                  ? "text-[#1B3A6B] font-medium"
                  : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            <item.icon className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
