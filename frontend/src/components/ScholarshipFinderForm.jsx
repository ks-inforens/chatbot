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
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleNext = () => {
        const requiredFields = ["citizenship", "studyLevel", "field", "preferredCountry"];
        let allErrors = {};

        const minDOB = getMinDOB();
        if (form.dob && form.dob > minDOB) {
            setError("You must be at least 18 years old to apply.");
            return;
        }

        for (let field of requiredFields) {
            if (!form[field] || form[field].trim() === "") {
                setError("Please fill out all required fields.");
                return;
            }
        }

        if (form.education && form.education.length > 0) {
            form.education.forEach((edu, index) => {
                const eduErrors = validateEducation(edu, index);
                allErrors = { ...allErrors, ...eduErrors };
            });
        }

        if (Object.keys(allErrors).length > 0) {
            setValidationErrors(allErrors);
            setError("Please fix the errors above and try again.");
            return;
        }

        setValidationErrors({});
        setError("");
        onNext();
    };

    const addEducation = () => {
        setForm(prev => ({
            ...prev,
            education: [...(prev.education || []), {
                universityName: '',
                startDate: '',
                endDate: '',
                isPresent: false,
                results: '',
                discipline: '',
                course: '',
                level: '',
                location: '',
                region: '',
                country: '',
                otherUniversityName: '',
            }],
        }));
    };

    const updateEducation = (index, key, value) => {
        const updated = [...(form.education || [])];

        if (key === 'isPresent') {
            updated[index][key] = value;
            if (value) {
                updated[index]['endDate'] = '';
            }
        } else {
            updated[index][key] = value;
        }

        setForm(prev => ({ ...prev, education: updated }));

        const fieldName = `education.${index}.${key}`;
        if (validationErrors[fieldName]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const removeEducation = (index) => {
        const updated = [...(form.education || [])];
        updated.splice(index, 1);
        setForm(prev => ({ ...prev, education: updated }));
    };

    const handleSelectChange = (i, e) => {
        const value = e.target.value;
        if (value === "Other") {
            updateEducation(i, "universityName", "Other");
        } else {
            updateEducation(i, "universityName", value);
        }
    };

    const handleOtherInputChange = (i, e) => {
        const value = e.target.value;
        updateEducation(i, "universityName", "Other");
        updateEducation(i, "otherUniversityName", value);
    };

    const validateEducation = (edu, index) => {
        const errors = {};
        const requiredFields = ['universityName', 'discipline', 'country', 'region', 'level', 'results', 'startDate'];

        requiredFields.forEach(field => {
            if (!edu[field] || edu[field].toString().trim() === "") {
                errors[`education.${index}.${field}`] = "This field is required";
            }
        });

        if (edu.startDate && edu.endDate && edu.endDate !== 'Present') {
            const startDate = new Date(edu.startDate);
            const endDate = new Date(edu.endDate);
            if (endDate <= startDate) {
                errors[`education.${index}.endDate`] = "End date must be after start date";
            }
        }

        return errors;
    };

    const renderFieldError = (fieldName) => {
        if (validationErrors[fieldName]) {
            return (
                <div className="text-red-600 text-xs mt-1">{validationErrors[fieldName]}</div>
            );
        }
        return null;
    };

    const minDOB = getMinDOB();

    return (
        <div className="w-full py-4 px-8 fadeIn">
            <h1 className="text-3xl mb-2">Scholarship Finder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Just answer a few questions and let us help you find the best scholarships for you!
            </p>

            <form className="flex flex-col md:grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">
                        Citizenship<span className="text-orange-600">*</span>
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
                        Preferred Country<span className="text-orange-600">*</span>
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
                    <label className="text-sm mb-1">
                        Level<span className="text-orange-600">*</span>
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
                        Preferred Field<span className="text-orange-600">*</span>
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
                    <label className="text-sm mb-1">Preferred Universities</label>
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

                <div className="flex flex-col gap-4 col-span-2">
                    <h2 className="text-sm">Education Information</h2>
                    <div>
                        {(form.education || []).map((edu, i) => (
                            <div key={i} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                <div className="flex justify-end absolute top-2 right-2">
                                    <button
                                        type="button"
                                        onClick={() => removeEducation(i)}
                                        className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Discipline<span className="text-orange-600">*</span>
                                        </label>
                                        <select
                                            value={edu.discipline}
                                            onChange={e => updateEducation(i, "discipline", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select discipline</option>
                                            {options["fields"].map((field) => (
                                                <option key={field} value={field}>
                                                    {field}
                                                </option>
                                            ))}
                                        </select>
                                        {renderFieldError(`education.${i}.discipline`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Level of Study<span className="text-orange-600">*</span>
                                        </label>
                                        <select
                                            value={edu.level}
                                            onChange={e => updateEducation(i, "level", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select study level</option>
                                            {options["studyLevels"].map((level) => (
                                                <option key={level} value={level}>
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                        {renderFieldError(`education.${i}.level`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Course Name
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.course}
                                            onChange={e => updateEducation(i, "course", e.target.value)}
                                            placeholder="Course Name"
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                        {renderFieldError(`education.${i}.course`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Country<span className="text-orange-600">*</span>
                                        </label>
                                        <select
                                            value={edu.country}
                                            onChange={e => updateEducation(i, "country", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select country</option>
                                            {options["countries"].map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                        {renderFieldError(`education.${i}.country`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Region<span className="text-orange-600">*</span>
                                        </label>
                                        <select
                                            value={edu.region}
                                            onChange={e => updateEducation(i, "region", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select region</option>
                                            {options["regions"].map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                        {renderFieldError(`education.${i}.level`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.location}
                                            onChange={e => updateEducation(i, "location", e.target.value)}
                                            placeholder="Location Name"
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                        {renderFieldError(`education.${i}.universityName`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            University<span className="text-orange-600">*</span>
                                        </label>

                                        <select
                                            value={edu.universityName === "Other" ? "Other" : edu.universityName}
                                            onChange={e => handleSelectChange(i, e)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select university</option>
                                            {options["universities"].map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                            <option value="Other">Other</option>
                                        </select>

                                        {edu.universityName === "Other" && (
                                            <input
                                                type="text"
                                                value={edu.otherUniversityName}
                                                onChange={e => handleOtherInputChange(i, e)}
                                                placeholder="Other"
                                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            />
                                        )}

                                        {renderFieldError(`education.${i}.universityName`)}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Start Year<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={edu.startDate}
                                            onChange={e => updateEducation(i, "startDate", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                        {renderFieldError(`education.${i}.startDate`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">End Year<span className="text-orange-600">*</span></label>
                                            <input
                                                type="date"
                                                value={edu.endDate}
                                                disabled={edu.isPresent}
                                                onChange={e => updateEducation(i, "endDate", e.target.value)}
                                                className={`w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg ${edu.isPresent ? "bg-black/5 text-black/30" : "bg-none text-black/80"}`}
                                            />
                                            {renderFieldError(`education.${i}.endDate`)}
                                        </div>
                                        <div className="flex items-center gap-2 px-2">
                                            <input
                                                type="checkbox"
                                                id={`present-edu-${i}`}
                                                checked={edu.isPresent || false}
                                                onChange={e => updateEducation(i, "isPresent", e.target.checked)}
                                                className="accent-[#db5800]"
                                            />
                                            <label htmlFor={`present-edu-${i}`} className="text-sm">Present</label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 col-span-2">
                                        <label className="text-sm mb-1">Results/Grade<span className="text-orange-600">*</span></label>
                                        <textarea
                                            value={edu.results}
                                            onChange={e => updateEducation(i, "results", e.target.value)}
                                            placeholder="Results"
                                            className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                            rows={4}
                                        />
                                        {renderFieldError(`education.${i}.results`)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addEducation} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                            + Add education
                        </button>
                    </div>
                </div>

                {/* Extracurricular Activities */}
                <div className="flex flex-col gap-2 col-span-2">
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