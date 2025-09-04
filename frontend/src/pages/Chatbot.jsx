import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AskNoriPanel from "../components/AskNoriPanel";
import ScholarshipFinderPanel from "../components/ScholarshipFinderPanel";
import SOPBuilderPanel from "../components/SOPBuilderPanel";
import CVBuilderPanel from "../components/CVBuilderPanel";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState("Ask Nori");
  const [showIntro, setShowIntro] = useState(true);

  const sessionId = useMemo(() => {
    return (
      localStorage.getItem("sessionId") ||
      (localStorage.setItem("sessionId", uid()), localStorage.getItem("sessionId"))
    );
  }, []);
  const userId = localStorage.getItem("userId") || null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleFeatureSelect = (featureTitle) => {
    setActiveFeature(featureTitle);
    if (featureTitle === "Scholarship Finder" || featureTitle === "Ask Nori") {
      setOpen(true);
    }
  };

  const renderActivePanel = () => {
    switch (activeFeature) {
      case "Ask Nori":
        return <AskNoriPanel sessionId={sessionId} userId={userId} onFeatureSelect={handleFeatureSelect} />;
      case "Scholarship Finder":
        return <ScholarshipFinderPanel onFeatureSelect={handleFeatureSelect} />;
      case "SOP Builder":
        return <SOPBuilderPanel onFeatureSelect={handleFeatureSelect} />;
      case "CV Builder":
        return <CVBuilderPanel onFeatureSelect={handleFeatureSelect} />;
      default:
        return <AskNoriPanel sessionId={sessionId} userId={userId} onFeatureSelect={handleFeatureSelect} />;
    }
  };

  return (
    <div
      aria-label="nori-container"
      className="fixed right-4 bottom-4 md:right-8 md:bottom-8 flex flex-col items-end gap-2 z-[999]"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col overflow-hidden z-999 bg-white min-h-132 max-h-132 max-w-80 rounded-xl inset-shadow-sm shadow-lg"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            {renderActivePanel()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && showIntro && (
          <motion.div
            className="bg-[#db5800] text-white text-sm md:text-base right-full bottom-full mb-2 tracking-tight leading-tight text-right px-6 py-3 rounded-xl max-w-sm shadow-lg cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            onClick={() => setOpen(true)}
          >
            Hi, I'm Nori, your personal AI assistant. <br /> Ask me something about studying abroad.
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src="/nori.png"
        alt="Nori"
        className="nori-icon w-14 h-14 md:w-18 md:h-18 cursor-pointer rounded-full relative"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
      />
    </div>
  );
}