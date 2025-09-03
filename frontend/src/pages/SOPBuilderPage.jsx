import React, { useState } from "react";
import SOPBuilderForm from "../components/SOPBuilderForm";
import ReviewStage from "../components/ScholarshipReviewStage";
import { Search } from "lucide-react";

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {scholarships.map((scholarship, i) => {
                            const [title, ...descParts] = scholarship.split(" - ");
                            const description = descParts.join(" - ") || "Description not available.";

                            return (
                                <div
                                    key={i}
                                    className="flex gap-4 rounded-lg border border-orange-600/30 hover:shadow-sm transition overflow-hidden"
                                >
                                    {/* Icon area */}
                                    <div className="flex items-center justify-center w-16 bg-orange-100">
                                        <svg
                                            className="w-10 h-10 text-orange-600"
                                            fill="none" stroke="currentColor"
                                            strokeWidth={2}
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m2 0a2 2 0 11-4 0 2 2 0 014 0zM12 2v20m4-6v6a2 2 0 01-4 0v-6"></path>
                                        </svg>
                                    </div>

                                    {/* Content area */}
                                    <div className="flex flex-col gap-4 justify-between flex-1 py-6">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900 mb-1">{title.trim()}</h3>
                                            <p className="text-sm text-gray-600">{description.trim()}</p>
                                        </div>

                                        <div className="flex">
                                            <button
                                                className="bg-orange-600 hover:bg-orange-700 text-white rounded px-4 py-1 text-sm font-semibold transition"
                                                onClick={() => alert(`Apply clicked for: ${title.trim()}`)}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="px-10 py-2 rounded bg-gray-300 hover:bg-gray-400 cursor-pointer text-gray-800 transition"
                        onClick={onBack}
                    >
                        Find Again
                    </button>
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
        performance: "",
        disability: "",
        disabilityDetails: "",
        preferredCountry: "",
        university: "",
        intake: "",
        age: "",
        gender: "",
        genderDetails: "",
        extracurricular: "",
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
            preferred_universities: form.university
                ? [form.university]
                : [],
            field: form.field,
            course_intake: form.intake || null,
            academic_perf: form.performance || null,
            age: form.age || null,
            gender: form.gender || null,
            disability: form.disability === "Yes"
                ? form.disabilityDetails || "Yes"
                : form.disability === "No"
                    ? "No"
                    : null,
            extracurricular: form.extracurricular || null,
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
            const response = await fetch("/api/scholarships", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
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
                <div className="h-full flex flex-col gap-4 items-center justify-center py-32">
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
            {step === 1 && (
                <SOPBuilderForm form={form} setForm={setForm} onNext={handleNext} />
            )}
            {step === 2 && (
                <ReviewStage form={form} onEdit={handleEdit} onSubmit={handleSubmit} />
            )}
            {step === 3 && (
                <ScholarshipResults
                    scholarships={results}
                    loading={loading}
                    error={error}
                    onBack={handleBackToStart}
                />
            )}
        </div>
    );
}
