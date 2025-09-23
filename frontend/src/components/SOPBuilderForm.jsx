import React, { useState } from "react";
import { sopOptions as options } from "../data/sopBuilderData";

export default function SOPBuilderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleNext = () => {
        const requiredFields = [
            "firstName",
            "lastName",
            "countryOfOrigin",
            "intendedDegree",
            "preferredCountryOfStudy",
            "preferredFieldOfStudy",
            "preferredUniversity",
            "keySkills"
        ];
        let allErrors = {};

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

    return (
        <div className="w-full py-4 px-8 fadeIn">
            <h1 className="text-3xl mb-2">Personalised SOP Builder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Share your story in detail - we'll craft it into a standout SOP
            </p>

            <form className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-b pb-8 border-black/10">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            First Name<span className="text-orange-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={form.firstName || ""}
                            onChange={handleChange}
                            placeholder="First name"
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Last Name<span className="text-orange-600">*</span>
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={form.lastName || ""}
                            onChange={handleChange}
                            placeholder="Last name"
                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Citizenship<span className="text-orange-600">*</span>
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
                            Preferred Country<span className="text-orange-600">*</span>
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

                    <div className="flex flex-col gap-2">
                        <label className="text-sm mb-1">
                            Level<span className="text-orange-600">*</span>
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
                            Preferred Field<span className="text-orange-600">*</span>
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

                <div className="flex flex-col gap-6">
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

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs mb-1">Skills<span className="text-orange-600">*</span></label>
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