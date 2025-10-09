import React from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Award,
  FileText,
  BookOpen,
  Lock
} from "lucide-react";

export default function Sidebar({ selected, stage, accessControl, onStageChange }) {
  const allFeatures = [
    { name: "Ask Nori", icon: MessageCircle, path: "/" },
    { name: "Scholarship Finder", icon: Award, path: "/scholarship-finder" },
    { name: "CV Builder", icon: FileText, path: "/cv-builder" },
    { name: "SOP Builder", icon: BookOpen, path: "/sop-builder" },
  ];

  const allowedTools = accessControl[stage] || [];

  return (
    <aside className="min-w-28 px-4 grid grid-cols-4 md:flex md:flex-col items-start md:items-center bg-[#fff5f0] md:bg-gradient-to-b from-[#fff5f0] via-white to-white border-b md:border-b-0 md:border-r border-orange-800/30 py-2 md:py-4">

      <div className="w-full px-8 flex justify-center mb-2 md:mb-4 col-span-4">
        <select
          value={stage}
          onChange={(e) => onStageChange(Number(e.target.value))}
          className="text-xs rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/10 border border-orange-800/30"
        >
          <option className="bg-orange-50" value={1}>Stage 1 - Planning to Apply Abroad</option>
          <option className="bg-orange-50" value={2}>Stage 2 - Already Applied Abroad</option>
          <option className="bg-orange-50" value={3}>Stage 3 - Ready to Fly Abroad</option>
          <option className="bg-orange-50" value={4}>Stage 4 - Already at University Abroad</option>
        </select>
      </div>

      {allFeatures.map(({ name, icon: Icon, path }) => {
        const isAllowed = allowedTools.includes(name);
        return (
          <div
            key={name}
            className={`flex flex-col items-center gap-0 md:gap-1 text-xs justify-center py-1 text-center transition-colors duration-500 w-full ${
              selected === name && isAllowed
                ? "text-orange-800"
                : isAllowed
                ? "text-black/70"
                : "hidden"
            }`}
          >
            {isAllowed ? (
              <Link
                to={path}
                className={`flex flex-col md:text-left md:flex-row md:gap-2 items-center w-full ${
                  selected === name ? "bg-orange-100" : "hover:bg-black/3"
                } px-3 py-2 rounded-xl transition-all`}
              >
                <Icon
                  className={`w-4 h-4 md:w-6 md:h-6 ${
                    selected === name ? "text-orange-800" : "text-black/80"
                  }`}
                />
                <span>{name}</span>
              </Link>
            ) : (
              <div className="flex flex-col md:flex-row md:gap-2 items-center w-full opacity-50 cursor-not-allowed px-3 py-2 rounded-xl relative">
                <Icon className="w-4 h-4 md:w-6 md:h-6 text-black/40" />
                <span>{name}</span>
                <Lock className="absolute top-1 right-2 w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}