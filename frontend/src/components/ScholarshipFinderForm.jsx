import React, { useState } from "react";
import { options } from "../data/scholarshipFinderData";
import SearchDropdown from "./SearchDropdown";

// Helper function to get date string of exactly 18 years ago from today
const getMinDOB = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split("T")[0];
};

export default function ScholarshipFinderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [countrySearch, setCountrySearch] = useState("");
    const [universitySearch, setUniversitySearch] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);

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

    const filteredCountries = options["countries"].filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const filteredUnis = options["universities"].filter(c =>
        c.toLowerCase().includes(universitySearch.toLowerCase())
    );

    const handleSelect = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setOpenDropdown(null);

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleActivitySelect = (idx, key, value) => {
        const updated = [...(form.activity || [])];
        updated[idx][key] = value;
        setForm((prev) => ({ ...prev, activity: updated }));
        setOpenDropdown(null);
    };

    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
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
                    <SearchDropdown
                        label={form.citizenship || "Select"}
                        isOpen={openDropdown === "citizenship"}
                        onToggle={() => toggleDropdown("citizenship")}
                        searchable
                        multiSelect={false}
                        searchValue={countrySearch}
                        onSearchChange={e => setCountrySearch(e.target.value)}
                        options={filteredCountries.map(c => ({ id: c, name: c }))}
                        selectedOptions={form.citizenship ? [form.citizenship] : []}
                        onOptionToggle={id => handleSelect("citizenship", id)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">
                        Target Country<span className="text-orange-600">*</span>
                    </label>
                    <SearchDropdown
                        label={form.preferredCountry || "Select"}
                        isOpen={openDropdown === "preferredCountry"}
                        onToggle={() => toggleDropdown("preferredCountry")}
                        searchable
                        multiSelect={false}
                        searchValue={countrySearch}
                        onSearchChange={e => setCountrySearch(e.target.value)}
                        options={filteredCountries.map(c => ({ id: c, name: c }))}
                        selectedOptions={form.preferredCountry ? [form.preferredCountry] : []}
                        onOptionToggle={id => handleSelect("preferredCountry", id)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">
                        Level<span className="text-orange-600">*</span>
                    </label>
                    <SearchDropdown
                        label={form.studyLevel || "Select"}
                        isOpen={openDropdown === "studyLevel"}
                        onToggle={() => toggleDropdown("studyLevel")}
                        options={options["studyLevels"].map(s => ({ id: s, name: s }))}
                        selectedOptions={form.studyLevel ? [form.studyLevel] : []}
                        onOptionToggle={id => handleSelect("studyLevel", id)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">
                        Target Field<span className="text-orange-600">*</span>
                    </label>
                    <SearchDropdown
                        label={form.field || "Select"}
                        isOpen={openDropdown === "field"}
                        onToggle={() => toggleDropdown("field")}
                        options={options["fields"].map(s => ({ id: s, name: s }))}
                        selectedOptions={form.field ? [form.field] : []}
                        onOptionToggle={id => handleSelect("field", id)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">Target University</label>
                    <SearchDropdown
                        label={form.university || "Select"}
                        isOpen={openDropdown === "university"}
                        onToggle={() => toggleDropdown("university")}
                        searchable
                        searchValue={universitySearch}
                        onSearchChange={e => setUniversitySearch(e.target.value)}
                        options={filteredUnis.map(c => ({ id: c, name: c }))}
                        selectedOptions={form.university ? [form.university] : []}
                        onOptionToggle={id => handleSelect("university", id)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">Intake</label>
                    <SearchDropdown
                        label={form.intake || "Select"}
                        isOpen={openDropdown === "intake"}
                        onToggle={() => toggleDropdown("intake")}
                        options={options["intakes"].map(s => ({ id: s, name: s }))}
                        selectedOptions={form.intake ? [form.intake] : []}
                        onOptionToggle={id => handleSelect("intake", id)}
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
                    <SearchDropdown
                        label={form.gender || "Select"}
                        isOpen={openDropdown === "gender"}
                        onToggle={() => toggleDropdown("gender")}
                        options={options["genders"].map(s => ({ id: s, name: s }))}
                        selectedOptions={form.gender ? [form.gender] : []}
                        onOptionToggle={id => handleSelect("gender", id)}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm mb-1">Disability Status</label>
                    <SearchDropdown
                        label={form.disability || "Have a disability?"}
                        isOpen={openDropdown === "disability"}
                        onToggle={() => toggleDropdown("disability")}
                        options={options["disabilityOptions"].map(s => ({ id: s, name: s }))}
                        selectedOptions={form.disability ? [form.disability] : []}
                        onOptionToggle={id => handleSelect("disability", id)}
                    />
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
                                            <option value="">Select your study level...</option>
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
                    <label className="text-sm mb-1">Hobbies, Volunteer Work or Extracurriculars</label>
                    {(form.activity || []).map((a, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                            <SearchDropdown
                                label={a.type || "Select one..."}
                                isOpen={openDropdown === `typeOfActivity${0}`}
                                onToggle={() => toggleDropdown(`typeOfActivity${0}`)}
                                options={options["activityType"].map(s => ({ id: s, name: s }))}
                                selectedOptions={a.type ? [a.type] : []}
                                onOptionToggle={id => handleActivitySelect(0, "type", id)}
                                className="md:max-w-100"
                            />
                            <textarea
                                name="description"
                                value={a.description}
                                onChange={e => {
                                    const updated = [...(form.activity || [])];
                                    updated[0] = { ...updated[0], description: e.target.value };
                                    setForm(prev => ({ ...prev, activity: updated }));
                                }}
                                placeholder="Describe your extracurricular activities, achievements, and interests in detail..."
                                rows={5}
                                className="w-full text-xs p-3 border border-orange-800/25 rounded-lg"
                            />
                        </div>
                    ))}
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