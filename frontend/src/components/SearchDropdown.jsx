import React, { useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

const SearchDropdown = ({
  label,
  count,
  isOpen,
  onToggle,
  children,
  className = "",
  searchable = false,
  multiSelect = false,
  searchValue = "",
  onSearchChange = () => { },
  options = [],
  selectedOptions = [],
  onOptionToggle = () => { },
}) => {

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        onToggle(false); 
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between cursor-pointer text-xs min-h-10 py-2 px-3 border border-orange-800/25 rounded-lg"
        type="button"
      >
        <span className="flex items-center text-left">
          {label}
          {typeof count === "number" && (
            <span className="ml-2 text-xs text-orange-700 font-medium">
              ({count})
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-orange-700 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-orange-700 ml-2" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-20 w-full sm:w-72 max-w-[90vw] bg-white rounded-3xl border border-gray-200 shadow-md p-4">
          {searchable && (
            <div className="mb-3 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search...`}
                value={searchValue}
                onChange={onSearchChange}
                className="w-full pl-8 pr-2 py-1 text-xs bg-gray-100 rounded-full focus:outline-none"
              />
            </div>
          )}

          {options && (
            <div className="flex flex-col gap-2">
              {children}
              <div className="max-h-60 overflow-auto">
                {options.map((opt) => (
                  <label
                    key={opt.id || opt.value || opt}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-full hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(opt.id ?? opt.value ?? opt)}
                      onChange={() =>
                        onOptionToggle(opt.id ?? opt.value ?? opt)
                      }
                      className="accent-black cursor-pointer"
                    />
                    <span className="text-black/80">{opt.name ?? opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
