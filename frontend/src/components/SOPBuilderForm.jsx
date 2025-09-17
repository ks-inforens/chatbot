import React, { useState } from "react";
import { sopOptions as options } from "../data/sopBuilderData";

export default function SOPBuilderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleNext = () => {
        const requiredFields = [
            "name",
            "countryOfOrigin",
            "intendedDegree",
            "preferredCountryOfStudy",
            "preferredFieldOfStudy",
            "preferredUniversity",
            "degree",
            "qualificationUniversity",
            "graduationYear",
            "keySkills"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-b pb-8 border-black/10">
                    {/* Left column */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2 col-span-2">
                            <label className="text-sm mb-1">
                                Country of Citizenship<span className="text-orange-600">*</span>
                            </label>
                            <select
                                name="countryOfOrigin"
                                value={form.countryOfOrigin || ""}
                                onChange={handleChange}
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select country</option>
                                {options["countries"].map((c) => (
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select country</option>
                                {options["countries"].map((c) => (
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select university</option>
                                {options["universities"].map((u) => (
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
                                Full Name<span className="text-orange-600">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name || ""}
                                onChange={handleChange}
                                placeholder="Your name"
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm mb-1">
                                Level of Study<span className="text-orange-600">*</span>
                            </label>
                            <select
                                name="intendedDegree"
                                value={form.intendedDegree || ""}
                                onChange={handleChange}
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select your level</option>
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
                                name="preferredFieldOfStudy"
                                value={form.preferredFieldOfStudy || ""}
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
                                    className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
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
                                    className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Year</option>
                                {options["graduationYears"].map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                            >
                                <option value="">Select skills</option>
                                {options["keySkills"].map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
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
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
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
                        {(form.projectsResearch || []).map((proj, idx) => (
                            <div key={idx} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                <div className="flex justify-end absolute top-2 right-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...(form.projectsResearch || [])];
                                            updated.splice(idx, 1);
                                            setForm((prev) => ({ ...prev, projectsResearch: updated }));
                                        }}
                                        className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mb-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Title<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="projectTitle"
                                            value={proj.title || ""}
                                            placeholder="Project Title"
                                            onChange={e => {
                                                const updated = [...(form.projectsResearch || [])];
                                                updated[idx] = { ...updated[idx], title: e.target.value };
                                                setForm(prev => ({ ...prev, projectsResearch: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Link</label>
                                        <input
                                            type="url"
                                            name="projectLink"
                                            value={proj.link || ""}
                                            placeholder="Project Link (Optional)"
                                            onChange={e => {
                                                const updated = [...(form.projectsResearch || [])];
                                                updated[idx] = { ...updated[idx], link: e.target.value };
                                                setForm(prev => ({ ...prev, projectsResearch: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Description<span className="text-orange-600">*</span>
                                    </label>
                                    <textarea
                                        name="projectDescription"
                                        value={proj.description || ""}
                                        rows={3}
                                        placeholder="Project Description"
                                        onChange={e => {
                                            const updated = [...(form.projectsResearch || [])];
                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                            setForm(prev => ({ ...prev, projectsResearch: updated }));
                                        }}
                                        className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setForm((prev) => ({
                                    ...prev,
                                    projectsResearch: [...(prev.projectsResearch || []), { title: "", description: "", link: "" }],
                                }));
                            }}
                            className="h-10 max-w-24 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                        >
                            + Add
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs mb-1">Awards / Scholarships / Recognitions</label>
                        {(form.awards || []).map((cert, idx) => (
                            <div key={idx} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                <div className="flex justify-end absolute top-2 right-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...(form.awards || [])];
                                            updated.splice(idx, 1);
                                            setForm((prev) => ({ ...prev, awards: updated }));
                                        }}
                                        className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Award Name<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="certificateName"
                                            value={cert.name || ""}
                                            placeholder="Certificate Name"
                                            onChange={e => {
                                                const updated = [...(form.awards || [])];
                                                updated[idx] = { ...updated[idx], name: e.target.value };
                                                setForm(prev => ({ ...prev, awards: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Issuing Organization<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="issuingOrg"
                                            value={cert.organization || ""}
                                            placeholder="Issuing Organization"
                                            onChange={e => {
                                                const updated = [...(form.awards || [])];
                                                updated[idx] = { ...updated[idx], organization: e.target.value };
                                                setForm(prev => ({ ...prev, awards: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Date Obtained<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="dateObtained"
                                            value={cert.dateObtained || ""}
                                            onChange={e => {
                                                const updated = [...(form.awards || [])];
                                                updated[idx] = { ...updated[idx], dateObtained: e.target.value };
                                                setForm(prev => ({ ...prev, awards: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setForm((prev) => ({
                                    ...prev,
                                    awards: [...(prev.awards || []), { name: "", organization: "", dateObtained: "" }],
                                }));
                            }}
                            className="h-10 px-4 max-w-24 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                        >
                            + Add
                        </button>
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