import React, { useState, useEffect, useRef } from "react";
import { X, SquarePen, Award, FileText, NotebookText, CircleChevronUp } from "lucide-react";

export default function FeaturesDropdown({ onFeatureSelect }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const features = [
    {
      title: "Ask Nori",
      subtitle: "Ask me anything related to study abroad",
      icon: SquarePen,
      locked: false,
      path: "/",
    },
    {
      title: "Scholarship Finder",
      subtitle: "Find the best scholarships for you",
      icon: Award,
      locked: false,
      path: "/scholarship-finder",
    },
    {
      title: "CV Generator",
      subtitle: "Create an ATS Friendly CV",
      icon: FileText,
      locked: true,
      path: "/cv-generator",
    },
    {
      title: "SOP Builder",
      subtitle: "Get a personalised SOP",
      icon: NotebookText,
      locked: false,
      path: "/sop-builder",
    },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelRef]);

  const onSelectFeature = (feature) => {
    if (feature.locked) return;
    setOpen(false);
    if (onFeatureSelect) {
      onFeatureSelect(feature.title);
    }
  };

  return (
    <div>
      <div className="cursor-pointer" onClick={() => setOpen(!open)}>
        <CircleChevronUp size={18} />
      </div>

      {open && (
        <div
          className="w-full absolute flex flex-col gap-1 bottom-36 right-0 bg-white rounded-2xl inset-shadow-xs shadow-lg p-4 z-999 fadeIn"
          ref={panelRef}
        >
          <div className="flex justify-between px-2 py-2">
            <h1 className="text-sm font-medium">Features</h1>
            <X
              size={18}
              aria-label="close"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
            />
          </div>

          {features.map(({ title, subtitle, icon: Icon, locked }, idx) => (
            <div
              key={idx}
              className={`relative flex text-sm items-center gap-2 p-2 rounded-xl ${locked ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
                } ${idx === 0 ? "highlighted" : ""}`}
              onClick={() => onSelectFeature({ title, locked })}
            >
              <Icon size={18} />
              <div>
                <div className="text-sm">{title}</div>
                <div className="text-xs">{subtitle}</div>
                {locked && (
                  <div className="absolute backdrop-blur-xs bg-white/50 inset-0 flex justify-center rounded-xl items-center font-semibold text-black text-xs">
                    Coming Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
