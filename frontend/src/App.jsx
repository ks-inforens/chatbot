import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Chatbot from "./pages/Chatbot";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"
import AskNoriPage from "./pages/AskNoriPage";
import CVBuilderPage from "./pages/CVBuilderPage";
import ScholarshipFinderPage from "./pages/ScholarshipFinderPage";
import SOPBuilderPage from "./pages/SOPBuilderPage";

export default function App() {
  const location = useLocation();
  const [selectedFeature, setSelectedFeature] = useState();

  useEffect(() => {
    if (location.pathname === "/scholarship-finder") {
      setSelectedFeature("Scholarship Finder");
    }
    else if (location.pathname === "/cv-builder") {
      setSelectedFeature("CV Builder");
    }
    else if (location.pathname === "/sop-builder") {
      setSelectedFeature("SOP Builder");
    }
    else {
      setSelectedFeature("Ask Nori");
    }
  }, [location.pathname]);

  return (
    <>
      <Header />
      {location.pathname !== "/" && <Chatbot />}
      <div className="flex flex-col md:flex-row fadeIn">
        <div><Sidebar selected={selectedFeature} /></div>
        <div className="w-full min-h-[calc(100vh-82px)] flex bg-gradient-to-b from-[#fff5f0] via-white to-white p-2">
          <Routes>
            <Route path="/" element={<AskNoriPage />} />
            <Route path="/scholarship-finder" element={<ScholarshipFinderPage />} />
            <Route path="/sop-builder" element={<SOPBuilderPage />} />
            <Route path="/cv-builder" element={<CVBuilderPage />} />
          </Routes>
        </div>
      </div >
    </>
  );
}
