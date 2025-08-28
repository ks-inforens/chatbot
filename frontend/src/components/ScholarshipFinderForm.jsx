import React, { useState } from "react";

const countries = ["India", "United States", "United Kingdom", "Australia", "Canada"];
const studyLevels = ["Undergraduate", "Post Graduate", "PhD"];
const fields = ["Engineering", "Arts", "Science", "Business"];
const universities = ["Harvard", "Oxford", "MIT", "Stanford"];
const disabilityOptions = ["Yes", "No"];
const genders = ["Male", "Female", "Other"];
const ages = Array.from({ length: 50 }, (_, i) => i + 16);

export default function ScholarshipFinderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleNext = () => {
        // List the required fields
        const requiredFields = ["citizenship", "studyLevel", "field", "preferredCountry"];

        for (let field of requiredFields) {
            if (!form[field] || form[field].trim() === "") {
                setError("Please fill out all required fields.");
                return;
            }
        }

        setError("");
        onNext();
    };

    return (
        <div className="w-full py-4 px-8 fadeIn">
            <h1 className="text-3xl mb-2">Scholarship Finder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Just answer a few questions and let us help you find the best scholarships for you!
            </p>

            <form className="grid grid-cols-2 gap-x-8 gap-y-2">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Country of Citizenship<span className="text-orange-600">*</span>
                        </label>
                        <select
                            name="citizenship"
                            value={form.citizenship}
                            onChange={handleChange}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Choose country...</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Level of Study<span className="text-orange-600">*</span>
                        </label>
                        <select
                            name="studyLevel"
                            value={form.studyLevel}
                            onChange={handleChange}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select study level</option>
                            {studyLevels.map((level) => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Preferred Field of Study<span className="text-orange-600">*</span>
                        </label>
                        <select
                            name="field"
                            value={form.field}
                            onChange={handleChange}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select your field</option>
                            {fields.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Academic Performance</label>
                        <input
                            name="performance"
                            value={form.performance}
                            onChange={handleChange}
                            type="text"
                            placeholder="Mention your GPA or percentage"
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Disability Status</label>
                        <select
                            name="disability"
                            value={form.disability}
                            onChange={handleChange}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Have a disability?</option>
                            {disabilityOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Preferred Country of Study<span className="text-orange-600">*</span>
                        </label>
                        <select
                            name="preferredCountry"
                            value={form.preferredCountry}
                            onChange={handleChange}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Choose country...</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Preferred University</label>
                        <select
                            name="university"
                            value={form.university}
                            onChange={handleChange}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select your preferred university</option>
                            {universities.map((u) => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Course Intake</label>
                        <input
                            name="intake"
                            value={form.intake}
                            onChange={handleChange}
                            type="text"
                            placeholder="When do you wish to start..."
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">Age</label>
                            <select
                                name="age"
                                value={form.age}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select</option>
                                {ages.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">Gender</label>
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select</option>
                                {genders.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {form.disability === "Yes" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">If Yes – Specify</label>
                            <input
                                name="disabilityDetails"
                                value={form.disabilityDetails}
                                onChange={handleChange}
                                type="text"
                                placeholder="List your disability status"
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>
                    )}
                </div>

                {/* Extracurricular Activities */}
                <div className="flex flex-col gap-2 col-span-2 mt-6">
                    <label className="text-sm mb-1">Extracurricular Activities</label>
                    <textarea
                        name="extracurricular"
                        value={form.extracurricular}
                        onChange={handleChange}
                        placeholder="Describe your extracurricular activities, achievements, and interests in detail..."
                        rows={5}
                        className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                    />
                </div>

                {/* Show validation error message */}
                {error && (
                    <div className="col-span-2 mt-4 text-red-600 text-xs font-medium text-center fadeIn">{error}</div>
                )}

                {/* Next button */}
                <div className="col-span-2 flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={handleNext}
                        className="bg-[#db5800] hover:bg-[#bf4d00] text-white px-20 py-2 rounded-lg shadow cursor-pointer transition-all duration-500"
                    >
                        Next
                    </button>
                </div>
            </form>
        </div>
    );
}
