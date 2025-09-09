import React from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Award,
  FileText,
  BookOpen
} from "lucide-react";

export default function Sidebar({ selected, onSelect }) {
  const features = [
    { name: "Ask Nori", icon: MessageCircle, path: "/" },
    { name: "Scholarship Finder", icon: Award, path: "/scholarship-finder" },
    { name: "CV Builder", icon: FileText, path: "/cv-builder" },
    { name: "SOP Builder", icon: BookOpen, path: "/sop-builder" },
  ];

  return (
    <aside className="h-full flex flex-row justify-around py-1 md:justify-start md:py-4 md:flex-col bg-[#fff5f0] md:bg-gradient-to-b from-[#fff5f0] via-white to-white border-r border-orange-800/30">
      {features.map(({ name, icon: Icon, path }) => (
        <Link
          key={name}
          to={path}
          onClick={() => onSelect(name)}
          className={`flex flex-col items-center gap-1 text-xs justify-center py-3 text-center cursor-pointer transition-colors duration-500 ${selected === name ? "active text-orange-800" : "text-black/50"}`}
        >
          <div className={`px-3 py-2 rounded-xl hover:scale-105 transition-colors duration-500 ${selected === name ? "bg-orange-100" : "hover:bg-orange-100"}`}>
            <Icon className={`transition-colors duration-500 ${selected === name ? "text-orange-800" : "text-black/80"}`} size={24} />
          </div>
          <span>{name}</span>
        </Link>
      ))}
    </aside>
  );
}
