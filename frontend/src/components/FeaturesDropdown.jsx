import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { SquarePen, Award, FileText, NotebookText, X, CirclePlus } from "lucide-react"

export default function FeaturesDropdown() {
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
      locked: true,
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

  return (
    <div>
      <div
        className="cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <CirclePlus size={18} />
      </div>

      {open && (
        <div className="w-full absolute flex flex-col gap-1 bottom-36 right-0 bg-white rounded-2xl inset-shadow-xs shadow-lg p-4 z-999 fadeIn" ref={panelRef}>
          <div className="flex justify-between px-2 py-2">
            <h1 className="text-sm font-medium">Features</h1>
            <X size={18} aria-label="close" className="cursor-pointer" onClick={() => setOpen(false)} />
          </div>

          {features.map(({ title, subtitle, icon: Icon, locked, path, idx }) => (
            <Link
              to={path}
              key={idx}
              className={`flex text-sm items-center gap-2 hover:bg-gray-100 p-2 rounded-xl ${locked ? "cursor-not-allowed" : "cursor-pointer"} ${idx === 0 ? "highlighted" : ""
                }`}
              onClick={() => !locked && onSelectFeature(title)}
            >
              <Icon size={18} />
              <div>
                <div className="text-sm">{title}</div>
                <div className="text-xs">{subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
