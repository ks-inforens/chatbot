import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Chatbot from "./pages/Chatbot";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AskNoriPage from "./pages/AskNoriPage";
import CVBuilderPage from "./pages/CVBuilderPage";
import ScholarshipFinderPage from "./pages/ScholarshipFinderPage";
import SOPBuilderPage from "./pages/SOPBuilderPage";

export default function App() {
  const location = useLocation();
  const [selectedFeature, setSelectedFeature] = useState();
  const [userStage, setUserStage] = useState(1); // NEED TO COLLECT USER STAGE 

  // Stagewise Access Controls
  const accessControl = {
    1: ["Ask Nori", "Scholarship Finder", "CV Builder", "SOP Builder"],
    2: ["Ask Nori", "Scholarship Finder"],
    3: ["Ask Nori"],
    4: ["Ask Nori", "CV Builder"]
  };

  useEffect(() => {
    if (location.pathname === "/scholarship-finder") {
      setSelectedFeature("Scholarship Finder");
    } else if (location.pathname === "/cv-builder") {
      setSelectedFeature("CV Builder");
    } else if (location.pathname === "/sop-builder") {
      setSelectedFeature("SOP Builder");
    } else {
      setSelectedFeature("Ask Nori");
    }
  }, [location.pathname]);

  const canAccess = (featureName) =>
    accessControl[userStage]?.includes(featureName);

  return (
    <>
      <Header />
      {location.pathname !== "/" && <Chatbot />}
      <div className="h-full flex flex-col md:flex-row fadeIn">
        <Sidebar
          selected={selectedFeature}
          stage={userStage}
          accessControl={accessControl}
          onStageChange={setUserStage}
        />
        <div className="w-full min-h-[calc(100vh-82px)] flex bg-gradient-to-b from-[#fff5f0] via-white to-white p-2">
          <Routes>
            <Route path="/" element={<AskNoriPage />} />
            <Route
              path="/scholarship-finder"
              element={
                canAccess("Scholarship Finder") ? (
                  <ScholarshipFinderPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/cv-builder"
              element={
                canAccess("CV Builder") ? (
                  <CVBuilderPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/sop-builder"
              element={
                canAccess("SOP Builder") ? (
                  <SOPBuilderPage />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </>
  );
}