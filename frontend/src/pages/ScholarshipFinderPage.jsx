import React, { useState } from "react";
import ScholarshipFinderForm from "../components/ScholarshipFinderForm";
import ReviewStage from "../components/ScholarshipReviewStage";
import { Award, Search } from "lucide-react";
import { API_BASE_URL } from "../data/api";

function ScholarshipResults({ scholarships, error, onBack }) {
  return (
    <div className="w-full py-4 px-8 fadeIn">
      <h1 className="text-3xl mb-4">Scholarship Finder</h1>

      {error && (
        <div className="text-red-600 mb-6 text-lg font-medium">
          <b>Sorry!</b> {error}
          <button
            className="ml-4 px-6 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 cursor-pointer transition"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      )}

      {!error && scholarships.length > 0 && (
        <>
          <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
            Here are some of the scholarships you can apply to...
          </p>

          <button
            onClick={onBack}
            className="text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-black/5 rounded-2xl hover:bg-black/10 mb-6 cursor-pointer"
          >
            <Search className="inline w-4 h-4" />
            Find Again
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {scholarships.map((scholarship, i) => {
              const title = scholarship.name || "Scholarship Name";
              const description = scholarship.description || "Description not available.";
              const deadline = scholarship.deadline || "No deadline.";

              return (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-lg border border-orange-600/30 hover:shadow-sm transition overflow-hidden"
                >
                  {/* Icon area */}
                  <div className="flex flex-col py-4 gap-2 items-center justify-center bg-orange-100">
                    <Award className="w-8 h-8 text-orange-600" />
                    <h3 className="text-center text-base font-semibold text-gray-900">{title.trim()}</h3>
                  </div>

                  {/* Content area */}
                  <div className="flex flex-col gap-4 py-6 px-6">
                    <p className="text-sm text-gray-600">{description.trim()}</p>
                    <p className="text-sm text-gray-600 font-medium">Deadline: {deadline.trim()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!error && scholarships.length === 0 && (
        <div>
          <p className="text-gray-700 mb-6 text-lg">No scholarships found for this profile.</p>
          <button
            className="px-10 py-2 rounded bg-gray-300 hover:bg-gray-400 cursor-pointer text-gray-800 transition"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

export default function ScholarshipFinderPage() {
  const [form, setForm] = useState({
    citizenship: "",
    studyLevel: "",
    field: "",
    disability: "",
    disabilityDetails: "",
    preferredCountry: "",
    university: "",
    intake: "",
    dob: "",
    gender: "",
    genderDetails: "",
    activity: [{type: "Extracurriculars", description : "" }],
    education: [],
  });

  const [step, setStep] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toBackendPayload = (form) => {
    return {
      citizenship: form.citizenship,
      preferred_country: form.preferredCountry,
      level: form.studyLevel,
      preferred_universities: form.university ? [form.university] : [],
      field: form.field,
      course_intake: form.intake || null,
      academic_perf: form.education || [],
      dob: form.dob || null,
      gender: form.gender || null,
      disability:
        form.disability === "Yes"
          ? form.disabilityDetails || "Yes"
          : form.disability === "No"
            ? "No"
            : null,
      activity: form.activity,
    };
  };

  const handleNext = () => setStep(2);
  const handleEdit = () => setStep(1);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const payload = toBackendPayload(form);
      const response = await fetch(`${API_BASE_URL}/scholarships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Server error. Try again.");
      } else {
        setResults(Array.isArray(data.scholarships) ? data.scholarships : []);
        setStep(3);
      }
    } catch (e) {
      setError("Network error: " + e.message);
    }
    setLoading(false);
  };

  const handleBackToStart = () => {
    setStep(1);
    setResults([]);
    setLoading(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="w-full px-8 py-4 fadeIn">
        <h1 className="text-3xl mb-2">Scholarship Finder</h1>
        <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
          Just answer a few questions and let us help you find the best scholarships for you!
        </p>
        <div className="flex flex-col gap-4 items-center justify-center py-32">
          <Search className="text-orange-700" />
          <p className="text-black/60 text-center text-md">
            Digging through thousands of scholarships to find your perfect fit. <br />
            Just a sec!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {step === 1 && <ScholarshipFinderForm form={form} setForm={setForm} onNext={handleNext} />}
      {step === 2 && <ReviewStage form={form} onEdit={handleEdit} onSubmit={handleSubmit} />}
      {step === 3 && <ScholarshipResults scholarships={results} error={error} onBack={handleBackToStart} />}
    </div>
  );
}