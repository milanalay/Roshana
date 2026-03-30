import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";

export const CategoryCard = ({ category }) => {
  const navigate = useNavigate();
  const IconComponent = Icons[category.icon] || Icons.FileText;

  const handleClick = () => {
    // Map category IDs to routes
    const routes = {
      drugs: "/drugs",
      "body-systems": "/body-systems",
      pharmacology: "/drugs",
      terminology: "/terminology",
      "lab-values": "/lab-values",
      "clinical-skills": "/more",
      emergency: "/emergency",
      abbreviations: "/abbreviations",
      calculators: "/calculators",
      specialties: "/more",
      professional: "/more",
      study: "/more",
      pathophysiology: "/body-systems",
      communication: "/communication",
      "cultural-safety": "/more",
      procedures: "/more",
    };
    navigate(routes[category.id] || "/more");
  };

  return (
    <button
      onClick={handleClick}
      className="category-card bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-4 text-left w-full"
      data-testid={`category-${category.id}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${category.color}15` }}
      >
        <IconComponent
          className="w-5 h-5"
          style={{ color: category.color }}
          strokeWidth={2}
        />
      </div>
      <h3 className="font-semibold text-sm text-[#1B3A6B] dark:text-white mb-1 leading-tight">
        {category.name}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
        {category.description}
      </p>
    </button>
  );
};

export default CategoryCard;
