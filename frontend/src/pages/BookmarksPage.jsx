import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Pill, TestTube, AlertTriangle, FileText, ArrowLeft, Trash2 } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { useBookmarks } from "../components/BookmarkButton";

const typeIcons = {
  drug: Pill,
  lab: TestTube,
  emergency: AlertTriangle,
  term: FileText,
};

const typeColors = {
  drug: "#8B5CF6",
  lab: "#F59E0B",
  emergency: "#EF4444",
  term: "#3B82F6",
};

const typeLabels = {
  drug: "Drug",
  lab: "Lab Value",
  emergency: "Emergency",
  term: "Term",
};

const BookmarkCard = ({ bookmark, onRemove }) => {
  const Icon = typeIcons[bookmark.type] || FileText;
  const color = typeColors[bookmark.type] || "#6B7280";

  return (
    <div
      className="bg-[#F4F6F9] dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4"
      data-testid={`bookmark-card-${bookmark.id}`}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#1B3A6B] dark:text-white truncate">
          {bookmark.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {typeLabels[bookmark.type] || bookmark.type}
          </Badge>
          {bookmark.subtitle && (
            <span className="text-xs text-gray-500 truncate">{bookmark.subtitle}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(bookmark.type, bookmark.id)}
        className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
        data-testid={`remove-bookmark-${bookmark.id}`}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
};

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { bookmarks, removeBookmark } = useBookmarks();
  const [filter, setFilter] = useState("all");

  const types = ["all", ...new Set(bookmarks.map((b) => b.type))];
  const filteredBookmarks = filter === "all"
    ? bookmarks
    : bookmarks.filter((b) => b.type === filter);

  // Sort by most recently saved
  const sortedBookmarks = [...filteredBookmarks].sort(
    (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
  );

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" data-testid="bookmarks-page">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-[#F4F6F9] dark:bg-slate-800 rounded-xl flex items-center justify-center"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-[#1B3A6B] dark:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1B3A6B] dark:text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              Bookmarks
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {bookmarks.length} saved item{bookmarks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        {bookmarks.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === type
                    ? "bg-[#1B3A6B] text-white"
                    : "bg-[#F4F6F9] dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                }`}
                data-testid={`filter-${type}`}
              >
                {type === "all" ? "All" : typeLabels[type] || type}
              </button>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-5 pb-32 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-amber-300" />
              </div>
              <h2 className="text-lg font-semibold text-[#1B3A6B] dark:text-white mb-2">
                No bookmarks yet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Tap the star icon on drugs, lab values, and emergency cards to save them here for quick access.
              </p>
            </div>
          ) : sortedBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No bookmarks in this category</p>
            </div>
          ) : (
            sortedBookmarks.map((bookmark) => (
              <BookmarkCard
                key={`${bookmark.type}-${bookmark.id}`}
                bookmark={bookmark}
                onRemove={removeBookmark}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
