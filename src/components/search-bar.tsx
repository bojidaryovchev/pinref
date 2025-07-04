"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLACEHOLDERS, SEARCH_DEBOUNCE_MS } from "@/constants";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<Props> = ({ onSearch, placeholder = PLACEHOLDERS.SEARCH_BOOKMARKS, className }) => {
  const [query, setQuery] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
  }, [onSearch]);

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debouncedSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        className="pr-9 pl-9"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 transform p-0"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
