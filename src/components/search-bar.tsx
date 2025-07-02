"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLACEHOLDERS, SEARCH_DEBOUNCE_MS } from "@/constants";
import { Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<Props> = ({ onSearch, placeholder = PLACEHOLDERS.SEARCH_BOOKMARKS, className }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
