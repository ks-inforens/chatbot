import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Chatbot from "./components/Chatbot";
import ScholarshipFinderPage from "./pages/ScholarshipFinderPage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"
import AskNoriPage from "./pages/AskNoriPage";

export default function App() {
  const [selectedFeature, setSelectedFeature] = useState("Ask Nori");

  return (
    <>
      <Header />
      <Chatbot />
      <div className="flex fadeIn">
        <Sidebar selected={selectedFeature} onSelect={setSelectedFeature} />
        <div className="w-full min-h-[calc(100vh-82px)] bg-gradient-to-b from-[#fff5f0] via-white to-white p-2">
          <Routes>
            <Route path="/" element={<AskNoriPage />} />
            <Route path="/scholarship-finder" element={<ScholarshipFinderPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
}
