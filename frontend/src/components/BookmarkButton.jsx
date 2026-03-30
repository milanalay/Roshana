import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

// Bookmark storage key
const BOOKMARKS_KEY = "nurseready-bookmarks";

// Hook for managing bookmarks
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    // Load bookmarks from localStorage
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading bookmarks:", e);
      }
    }
  }, [isBookmarked]);

  const saveBookmarks = (newBookmarks) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
  };

  const addBookmark = (item) => {
    const existing = bookmarks.find(
      (b) => b.type === item.type && b.id === item.id
    );
    if (!existing) {
      const newBookmarks = [
        ...bookmarks,
        { ...item, savedAt: new Date().toISOString() }
      ];
      saveBookmarks(newBookmarks);
      toast.success("Bookmarked!", { description: item.title });
      return true;
    }
    return false;
  };

  const removeBookmark = (type, id) => {
    const newBookmarks = bookmarks.filter(
      (b) => !(b.type === type && b.id === id)
    );
    saveBookmarks(newBookmarks);
    toast.info("Bookmark removed");
  };

  const toggleBookmark = (item) => {
    const isBookmarked = bookmarks.some(
      (b) => b.type === item.type && b.id === item.id
    );
    if (isBookmarked) {
      removeBookmark(item.type, item.id);
    } else {
      addBookmark(item);
    }
    return !isBookmarked;
  };

  const isBookmarked = (type, id) => {
    return bookmarks.some((b) => b.type === type && b.id === id);
  };

  const getBookmarksByType = (type) => {
    return bookmarks.filter((b) => b.type === type);
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    getBookmarksByType,
  };
};

// Bookmark button component
export const BookmarkButton = ({ item, size = "md", className = "" }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isBookmarked(item.type, item.id));
  }, [item.type, item.id]);

  const handleClick = (e) => {
    e.stopPropagation();
    const newState = toggleBookmark(item);
    setActive(newState);
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center transition-all ${
        active
          ? "bg-amber-100 dark:bg-amber-900/30"
          : "bg-[#F4F6F9] dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
      } ${className}`}
      data-testid={`bookmark-${item.type}-${item.id}`}
      aria-label={active ? "Remove bookmark" : "Add bookmark"}
    >
      <Star
        className={`${iconSizes[size]} transition-colors ${
          active
            ? "text-amber-500 fill-amber-500"
            : "text-gray-400"
        }`}
      />
    </button>
  );
};

export default BookmarkButton;
