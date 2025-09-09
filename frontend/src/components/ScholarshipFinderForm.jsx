import React, { useState } from "react";
import { options } from "../data/scholarshipFinderData";

// Helper function to get date string of exactly 18 years ago from today
const getMinDOB = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split("T")[0];
};

export default function ScholarshipFinderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleNext = () => {
        // List the required fields to validate
        const requiredFields = ["citizenship", "studyLevel", "field", "preferredCountry"];

        // Validate Date of Birth (at least 18 years old)
        const minDOB = getMinDOB();
        if (form.dob && form.dob > minDOB) {
            setError("You must be at least 18 years old to apply.");
            return;
        }

        // Validate required fields presence
        for (let field of requiredFields) {
            if (!form[field] || form[field].trim() === "") {
                setError("Please fill out all required fields.");
                return;
            }
        }

        setError("");
        onNext();
    };

    const minDOB = getMinDOB();

    return (
        <div className="w-full py-4 px-8 fadeIn">
            <h1 className="text-3xl mb-2">Scholarship Finder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Just answer a few questions and let us help you find the best scholarships for you!
            </p>

            <form className="flex flex-col md:grid md:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-2">
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
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Choose country...</option>
                            {options["countries"].map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
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
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select study level</option>
                            {options["studyLevels"].map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
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
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select your field</option>
                            {options["fields"].map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
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
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Disability Status</label>
                        <select
                            name="disability"
                            value={form.disability}
                            onChange={handleChange}
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Have a disability?</option>
                            {options["disabilityOptions"].map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
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
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Choose country...</option>
                            {options["countries"].map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Preferred University</label>
                        <select
                            name="university"
                            value={form.university}
                            onChange={handleChange}
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select your preferred university</option>
                            {options["universities"].map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
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
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Date of Birth</label>
                        <input
                            name="dob"
                            value={form.dob}
                            onChange={handleChange}
                            type="date"
                            max={minDOB}
                            defaultValue={minDOB}
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">Gender</label>
                        <select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        >
                            <option value="">Select</option>
                            {options["genders"].map((g) => (
                                <option key={g} value={g}>
                                    {g}
                                </option>
                            ))}
                        </select>
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>
                    )}
                </div>

                {/* Extracurricular Activities */}
                <div className="flex flex-col gap-2 col-span-2 md:mt-6">
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