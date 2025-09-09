import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Chatbot from "./pages/Chatbot";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"
import AskNoriPage from "./pages/AskNoriPage";
import CVBuilderPage from "./pages/CVBuilderPage";
import ScholarshipFinderPage from "./pages/ScholarshipFinderPage";
import SOPBuilderPage from "./pages/SOPBuilderPage";

export default function App() {
  const [selectedFeature, setSelectedFeature] = useState("Ask Nori");

  return (
    <>
      <Header />
      <Chatbot />
      <div className="flex flex-col md:flex-row fadeIn">
        <div className="hidden md:block"><Sidebar selected={selectedFeature} onSelect={setSelectedFeature} /></div>
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
