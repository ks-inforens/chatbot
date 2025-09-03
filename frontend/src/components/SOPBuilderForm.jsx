import React, { useState } from "react";

const countries = ["India", "United States", "United Kingdom", "Australia", "Canada"];
const studyLevels = ["Undergraduate", "Post Graduate", "PhD"];
const fields = ["Engineering", "Arts", "Science", "Business"];
const universities = ["Harvard", "Oxford", "MIT", "Stanford"];
const ages = Array.from({ length: 50 }, (_, i) => i + 16);

export default function SOPBuilderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleNext = () => {
        const requiredFields = [
            "countryOfOrigin",
            "intendedDegree",
            "preferredCountryOfStudy",
            "preferredFieldOfStudy",
            "preferredUniversity",
        ];

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
            <h1 className="text-3xl mb-2">Personalised SOP Builder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Share your story in detail - we'll craft it into a standout SOP
            </p>

            <form className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b pb-8 border-black/10">
                    {/* Left column */}
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm mb-1">
                                    Word Count Target
                                </label>
                                <input
                                    type="text"
                                    name="wordCountTarget"
                                    value={form.wordCountTarget || ""}
                                    onChange={handleChange}
                                    placeholder="Word count"
                                    className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm mb-1">Tone</label>
                                <select
                                    name="tone"
                                    value={form.tone || ""}
                                    onChange={handleChange}
                                    className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                                >
                                    <option value="">Select</option>
                                    <option value="Formal">Formal</option>
                                    <option value="Informal">Informal</option>
                                    <option value="Professional">Professional</option>
                                    <option value="Friendly">Friendly</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 col-span-2">
                            <label className="text-sm mb-1">
                                Country of Origin<span className="text-orange-600">*</span>
                            </label>
                            <select
                                name="countryOfOrigin"
                                value={form.countryOfOrigin || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select country</option>
                                {countries.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">
                                Preferred Country of Study<span className="text-orange-600">*</span>
                            </label>
                            <select
                                name="preferredCountryOfStudy"
                                value={form.preferredCountryOfStudy || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select country</option>
                                {countries.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">
                                Preferred University<span className="text-orange-600">*</span>
                            </label>
                            <select
                                name="preferredUniversity"
                                value={form.preferredUniversity || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select university</option>
                                {universities.map((u) => (
                                    <option key={u} value={u}>
                                        {u}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">
                                Name<span className="text-orange-600">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name || ""}
                                onChange={handleChange}
                                placeholder="Your name"
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">
                                Intended Degree<span className="text-orange-600">*</span>
                            </label>
                            <select
                                name="intendedDegree"
                                value={form.intendedDegree || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select your level</option>
                                {studyLevels.map((level) => (
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
                                name="preferredFieldOfStudy"
                                value={form.preferredFieldOfStudy || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select your field</option>
                                {fields.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1 font-semibold">
                            Academic Qualifications<span className="text-orange-600">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs mb-1">Degree<span className="text-orange-600">*</span></label>
                                <input
                                    type="text"
                                    name="degree"
                                    value={form.degree || ""}
                                    onChange={handleChange}
                                    placeholder="Degree"
                                    className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs mb-1">University<span className="text-orange-600">*</span></label>
                                <input
                                    type="text"
                                    name="qualificationUniversity"
                                    value={form.qualificationUniversity || ""}
                                    onChange={handleChange}
                                    placeholder="University"
                                    className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs mb-1">Year of Graduation<span className="text-orange-600">*</span></label>
                            <select
                                name="graduationYear"
                                value={form.graduationYear || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Year</option>
                                {Array.from({ length: 51 }, (_, i) => 1970 + i).map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs mb-1">Relevant Subjects</label>
                            <input
                                type="text"
                                name="relevantSubjects"
                                value={form.relevantSubjects || ""}
                                onChange={handleChange}
                                placeholder="Field"
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs mb-1">Key Skills<span className="text-orange-600">*</span></label>
                            <select
                                name="keySkills"
                                value={form.keySkills || ""}
                                onChange={handleChange}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select skills</option>
                                <option value="Communication">Communication</option>
                                <option value="Leadership">Leadership</option>
                                <option value="Research">Research</option>
                                <option value="Critical Thinking">Critical Thinking</option>
                                <option value="Problem Solving">Problem Solving</option>
                                {/* Add more if needed */}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs mb-1">Strengths</label>
                            <input
                                type="text"
                                name="strengths"
                                value={form.strengths || ""}
                                onChange={handleChange}
                                placeholder="List your strengths"
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Larger text areas */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Why this Field of Study?</label>
                        <textarea
                            name="whyFieldOfStudy"
                            value={form.whyFieldOfStudy || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Why this University?</label>
                        <textarea
                            name="whyUniversity"
                            value={form.whyUniversity || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Projects / Research / Publications</label>
                        <textarea
                            name="projectsResearch"
                            value={form.projectsResearch || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Awards / Scholarships / Recognitions</label>
                        <textarea
                            name="awards"
                            value={form.awards || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Long-Term Goals</label>
                        <textarea
                            name="longTermGoals"
                            value={form.longTermGoals || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Hobbies / Volunteer Work / Extracurriculars</label>
                        <textarea
                            name="hobbies"
                            value={form.hobbies || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">A Time You Overcame a Challenge</label>
                        <textarea
                            name="challenge"
                            value={form.challenge || ""}
                            onChange={handleChange}
                            placeholder="Description"
                            rows={3}
                            className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>
                </div>

                {/* Show validation error message */}
                {
                    error && (
                        <div className="col-span-2 mt-4 text-red-600 text-xs font-medium text-center fadeIn">
                            {error}
                        </div>
                    )
                }

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
            </form >
        </div >
    );
}