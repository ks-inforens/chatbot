import React, { useState } from "react";
import SearchDropdown from "./SearchDropdown";
import { Upload } from "lucide-react";

const countries = ["India", "United States", "United Kingdom", "Australia", "Canada"];
const cvLengths = ["1 Page", "2 Pages"];
const cvStyles = ["Formal", "Modern", "Creative", "Minimalist", "ATS-friendly", "Custom"];
const workTypes = ["Internship", "Part-Time", "Full-Time"];
const languages = ["English", "Spanish", "French", "Mandarin", "Hindi", "Arabic"];
const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Native"];
const technicalSkills = ["JavaScript", "Python", "Java", "C++", "React", "Node.js", "CSS", "SQL"];
const softSkills = ["Communication", "Leadership", "Teamwork", "Creativity", "Adaptability"];

export default function CVBuilderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [countrySearch, setCountrySearch] = useState("");
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [techSearch, setTechSearch] = useState("");
    const [softSearch, setSoftSearch] = useState("");

    const filteredCountries = countries.filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const filteredTechSkills = technicalSkills.filter(skill =>
        skill.toLowerCase().includes(techSearch.toLowerCase())
    );

    const filteredSoftSkills = softSkills.filter(skill =>
        skill.toLowerCase().includes(softSearch.toLowerCase())
    );

    const selectedCountriesLabel = selectedCountries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
            {selectedCountries.map(c => (
                <span key={c} className="bg-orange-100 border border-orange-300/40 text-black/80 text-xs px-3 py-1 rounded-full">
                    {c}
                </span>
            ))}
        </div>
    ) : "Select";

    const toggleDropdown = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const handleTechToggle = (skill) => {
        const selected = form.technicalSkills || [];
        if (selected.includes(skill)) {
            setForm({ ...form, technicalSkills: selected.filter(s => s !== skill) });
        } else {
            setForm({ ...form, technicalSkills: [...selected, skill] });
        }
    };

    const handleSoftToggle = (skill) => {
        const selected = form.softSkills || [];
        if (selected.includes(skill)) {
            setForm({ ...form, softSkills: selected.filter(s => s !== skill) });
        } else {
            setForm({ ...form, softSkills: [...selected, skill] });
        }
    };

    const handleSelect = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setOpenDropdown(null);
    };

    const handleMultiToggle = (id) => {
        setSelectedCountries(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleLinkChange = (index, value) => {
        const newLinks = [...(form.additionalLinks || [])];
        newLinks[index] = value;
        setForm(prev => ({ ...prev, additionalLinks: newLinks }));
    };

    const addNewLink = () => {
        setForm(prev => ({
            ...prev,
            additionalLinks: [...(prev.additionalLinks || []), ""]
        }));
    };

    const addWorkExperience = () => {
        setForm(prev => ({
            ...prev,
            workExperience: [...(prev.workExperience || []), {
                type: '',
                jobTitle: '',
                companyName: '',
                startDate: '',
                endDate: '',
                responsibilities: '',
                achievements: '',
            }],
        }));
    };

    const updateWorkExperience = (index, key, value) => {
        const updated = [...(form.workExperience || [])];
        updated[index][key] = value;
        setForm(prev => ({ ...prev, workExperience: updated }));
    };

    const removeWorkExperience = (index) => {
        const updated = [...(form.workExperience || [])];
        updated.splice(index, 1);
        setForm(prev => ({ ...prev, workExperience: updated }));
    };

    const addEducation = () => {
        setForm(prev => ({
            ...prev,
            education: [...(prev.education || []), {
                universityName: '',
                startDate: '',
                endDate: '',
                coursework: '',
            }],
        }));
    };

    const updateEducation = (index, key, value) => {
        const updated = [...(form.education || [])];
        updated[index][key] = value;
        setForm(prev => ({ ...prev, education: updated }));
    };

    const removeEducation = (index) => {
        const updated = [...(form.education || [])];
        updated.splice(index, 1);
        setForm(prev => ({ ...prev, education: updated }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const requiredFields = [
            "fullName",
            "email",
            "phone",
            "location",
            "cvLength",
            "preferredCountry",
            "preferredField"
        ];
        for (let field of requiredFields) {
            if (!form[field] || form[field].toString().trim() === "") {
                setError("Please fill out all required fields.");
                return;
            }
        }
        setError("");
        onNext();
    };

    return (
        <div className="w-full py-4 px-8 fadeIn">
            <h1 className="text-3xl mb-2">CV Builder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-4 border-b border-black/10">
                Your PATH to a winning CV!
            </p>
            <button
                className="mb-6 text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-black/5 rounded-2xl hover:bg-black/10 cursor-pointer"
            >
                <Upload className="inline w-5 h-5" />
                Upload CV
            </button>
            <form onSubmit={handleSubmit}>
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm px-2 mb-1">
                            Target Country<span className="text-orange-600">*</span>
                        </label>
                        <SearchDropdown
                            label={selectedCountriesLabel}
                            count={selectedCountries.length}
                            isOpen={openDropdown === "targetCountry"}
                            onToggle={() => toggleDropdown("targetCountry")}
                            searchable
                            multiSelect
                            searchValue={countrySearch}
                            onSearchChange={e => setCountrySearch(e.target.value)}
                            options={filteredCountries.map(c => ({ id: c, name: c }))}
                            selectedOptions={selectedCountries}
                            onOptionToggle={handleMultiToggle}
                            className="mb-6"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm px-2 mb-1">
                            CV Length
                        </label>
                        <SearchDropdown
                            label={form.cvLength || "Select"}
                            isOpen={openDropdown === "cvLength"}
                            onToggle={() => toggleDropdown("cvLength")}
                            searchable={false}
                            multiSelect={false}
                            options={cvLengths.map(c => ({ id: c, name: c }))}
                            selectedOptions={form.cvLength ? [form.cvLength] : []}
                            onOptionToggle={id => handleSelect("cvLength", id)}
                            className="mb-6"
                        >
                            <p className="text-xs italic">If you have extensive experience, consider selecting 2 pages.</p>
                        </SearchDropdown>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm px-2 mb-1">
                            CV Style
                        </label>
                        <SearchDropdown
                            label={form.cvStyle || "Select"}
                            isOpen={openDropdown === "cvStyle"}
                            onToggle={() => toggleDropdown("cvStyle")}
                            searchable={false}
                            multiSelect={false}
                            options={cvStyles.map(c => ({ id: c, name: c }))}
                            selectedOptions={form.cvStyle ? [form.cvStyle] : []}
                            onOptionToggle={id => handleSelect("cvStyle", id)}
                            className="mb-6"
                        />
                    </div>
                </div>

                {/* Personal Information */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4">
                            <h3 className="font-medium border-b border-black/15 pb-1 px-1">Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end px-1">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Full Name<span className="text-orange-600">*</span></label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={form.fullName || ""}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Email<span className="text-orange-600">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email || ""}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Phone Number<span className="text-orange-600">*</span></label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={form.phoneNumber || ""}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Location<span className="text-orange-600">*</span></label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={form.location || ""}
                                        onChange={handleChange}
                                        placeholder="City, Country"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h3 className="font-medium border-b border-black/15 pb-1 px-1">Additional Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="flex flex-col gap-2 px-1">
                                    <label className="text-sm mb-1">
                                        LinkedIn URL
                                    </label>
                                    <input
                                        type="url"
                                        name="linkedInURL"
                                        value={form.linkedInURL || ""}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                                {/* Additional Links */}
                                {(form.additionalLinks || []).map((link, idx) => (
                                    <input
                                        key={idx}
                                        type="url"
                                        value={link}
                                        onChange={e => handleLinkChange(idx, e.target.value)}
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        placeholder="Add URL"
                                    />
                                ))}
                                <button type="button" onClick={addNewLink} className="h-10 w-32 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                                    + Add more
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Work Experience */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
                    <div>
                        {
                            (form.workExperience || []).map((w, i) => (
                                <div className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                    <div className="flex justify-end absolute top-2 right-2">
                                        <button type="button" onClick={() => removeWorkExperience(i)} className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">Remove</button>
                                    </div>
                                    <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Type of Work<span className="text-orange-600">*</span></label>
                                            <select value={w.type} onChange={e => updateWorkExperience(i, "type", e.target.value)} className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg">
                                                <option value="">Type of Work</option>
                                                {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Job Title<span className="text-orange-600">*</span></label>
                                            <input type="text" value={w.jobTitle} onChange={e => updateWorkExperience(i, "jobTitle", e.target.value)} placeholder="Job Title" className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Company Name<span className="text-orange-600">*</span></label>
                                            <input type="text" value={w.companyName} onChange={e => updateWorkExperience(i, "companyName", e.target.value)} placeholder="Company" className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Start Date<span className="text-orange-600">*</span></label>
                                            <input type="date" value={w.startDate} onChange={e => updateWorkExperience(i, "startDate", e.target.value)} className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">End Date<span className="text-orange-600">*</span></label>
                                            <input type="date" value={w.endDate} onChange={e => updateWorkExperience(i, "endDate", e.target.value)} className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Responsibilities<span className="text-orange-600">*</span></label>
                                            <textarea value={w.responsibilities} onChange={e => updateWorkExperience(i, "responsibilities", e.target.value)} className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg" placeholder="Responsibilities" rows={4}></textarea>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Achievements<span className="text-orange-600">*</span></label>
                                            <textarea value={w.achievements} onChange={e => updateWorkExperience(i, "achievements", e.target.value)} placeholder="Achievements" className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg" rows={4} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div >
                    <button type="button" onClick={addWorkExperience} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                        + Add experience
                    </button>
                </div>

                {/* Education */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Education</h2>
                    < div className="mb-6" >
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
                                            University Name<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.universityName}
                                            onChange={e => updateEducation(i, "universityName", e.target.value)}
                                            placeholder="University Name"
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Start Date<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={edu.startDate}
                                            onChange={e => updateEducation(i, "startDate", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={edu.endDate}
                                            onChange={e => updateEducation(i, "endDate", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Relevant Coursework<span className="text-orange-600">*</span>
                                        </label>
                                        <textarea
                                            value={edu.coursework}
                                            onChange={e => updateEducation(i, "coursework", e.target.value)}
                                            className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                            placeholder="Coursework"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Achievements<span className="text-orange-600">*</span>
                                        </label>
                                        <textarea
                                            value={edu.achievements}
                                            onChange={e => updateEducation(i, "achievements", e.target.value)}
                                            placeholder="Achievements"
                                            className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                        }
                        <button type="button" onClick={addEducation} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                            + Add education
                        </button>
                    </div >
                </div>

                {/* Skills */}
                < div >
                    <h2 className="text-xl font-semibold mb-4">Skills</h2>
                    <div className="md:grid md:grid-cols-2 md:gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm px-2 mb-1">
                                Technical Skills<span className="text-orange-600">*</span>
                            </label>
                            <SearchDropdown
                                label={form.technicalSkills && form.technicalSkills.length > 0
                                    ? form.technicalSkills.join(", ") + ","
                                    : "Select Technical Skills"}
                                count={form.technicalSkills ? form.technicalSkills.length : 0}
                                isOpen={openDropdown === "technicalSkills"}
                                onToggle={() => toggleDropdown("technicalSkills")}
                                searchable
                                multiSelect
                                searchValue={techSearch}
                                onSearchChange={e => setTechSearch(e.target.value)}
                                options={filteredTechSkills.map(skill => ({ id: skill, name: skill }))}
                                selectedOptions={form.technicalSkills || []}
                                onOptionToggle={handleTechToggle}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm px-2 mb-1">
                                Soft Skills<span className="text-orange-600">*</span>
                            </label>
                            <SearchDropdown
                                label={form.softSkills && form.softSkills.length > 0
                                    ? form.softSkills.join(", ") + ","
                                    : "Select Soft Skills"}
                                count={form.softSkills ? form.softSkills.length : 0}
                                isOpen={openDropdown === "softSkills"}
                                onToggle={() => toggleDropdown("softSkills")}
                                searchable
                                multiSelect
                                searchValue={softSearch}
                                onSearchChange={e => setSoftSearch(e.target.value)}
                                options={filteredSoftSkills.map(skill => ({ id: skill, name: skill }))}
                                selectedOptions={form.softSkills || []}
                                onOptionToggle={handleSoftToggle}
                            />
                        </div>

                        {/* Languages Known */}
                        <div className="space-y-2">
                            <label className="text-sm px-2 mb-1">
                                Languages Known<span className="text-orange-600">*</span>
                            </label>
                            <div className="flex flex-col">
                                {(form.languagesKnown || []).map((lang, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-4 my-2 items-center">
                                        <select
                                            name={`language-${idx}`}
                                            value={lang.language || ""}
                                            onChange={(e) => {
                                                const languagesKnown = [...form.languagesKnown];
                                                languagesKnown[idx] = { ...languagesKnown[idx], language: e.target.value };
                                                setForm((prev) => ({ ...prev, languagesKnown }));
                                            }}
                                            className="text-xs h-10 px-2 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select Language</option>
                                            {languages.map((l) => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                        <select
                                            name={`proficiency-${idx}`}
                                            value={lang.proficiency || ""}
                                            onChange={(e) => {
                                                const languagesKnown = [...form.languagesKnown];
                                                languagesKnown[idx] = { ...languagesKnown[idx], proficiency: e.target.value };
                                                setForm((prev) => ({ ...prev, languagesKnown }));
                                            }}
                                            className="text-xs h-10 px-2 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select Proficiency</option>
                                            {proficiencyLevels.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const languagesKnown = [...form.languagesKnown];
                                                languagesKnown.splice(idx, 1);
                                                setForm((prev) => ({ ...prev, languagesKnown }));
                                            }}
                                            className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-white text-xs font-semibold rounded-full cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({
                                    ...prev,
                                    languagesKnown: [...(prev.languagesKnown || []), { language: "", proficiency: "" }],
                                }))}
                                className="h-8 px-4 bg-black/5 hover:bg-black/10 text-xs rounded-full cursor-pointer"
                            >
                                + Add Language
                            </button>
                        </div>
                    </div >
                </div>

                {/* Certificates and Awards */}
                < div >
                    <h2 className="text-xl font-semibold mt-6 mb-4">Certificates and Awards</h2>
                    {
                        (form.certificates || []).map((cert, idx) => (
                            <div key={idx} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                <div className="flex justify-end absolute top-2 right-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...form.certificates];
                                            updated.splice(idx, 1);
                                            setForm((prev) => ({ ...prev, certificates: updated }));
                                        }}
                                        className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Certificate Name<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="certificateName"
                                            value={cert.name || ""}
                                            placeholder="Certificate Name"
                                            onChange={e => {
                                                const updated = [...form.certificates];
                                                updated[idx] = { ...updated[idx], name: e.target.value };
                                                setForm(prev => ({ ...prev, certificates: updated }));
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
                                                const updated = [...form.certificates];
                                                updated[idx] = { ...updated[idx], organization: e.target.value };
                                                setForm(prev => ({ ...prev, certificates: updated }));
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
                                                const updated = [...form.certificates];
                                                updated[idx] = { ...updated[idx], dateObtained: e.target.value };
                                                setForm(prev => ({ ...prev, certificates: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                    <button
                        type="button"
                        onClick={() => {
                            setForm((prev) => ({
                                ...prev,
                                certificates: [...(prev.certificates || []), { name: "", organization: "", dateObtained: "" }],
                            }));
                        }}
                        className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                    >
                        + Add Certificate/Award
                    </button>
                </div >

                {/* Projects */}
                < div >
                    <h2 className="text-xl font-semibold mt-6 mb-4">Projects</h2>
                    {
                        (form.projects || []).map((proj, idx) => (
                            <div key={idx} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                <div className="flex justify-end absolute top-2 right-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...form.projects];
                                            updated.splice(idx, 1);
                                            setForm((prev) => ({ ...prev, projects: updated }));
                                        }}
                                        className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mb-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Project Title<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="projectTitle"
                                            value={proj.title || ""}
                                            placeholder="Project Title"
                                            onChange={e => {
                                                const updated = [...form.projects];
                                                updated[idx] = { ...updated[idx], title: e.target.value };
                                                setForm(prev => ({ ...prev, projects: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Project Link</label>
                                        <input
                                            type="url"
                                            name="projectLink"
                                            value={proj.link || ""}
                                            placeholder="Project Link (Optional)"
                                            onChange={e => {
                                                const updated = [...form.projects];
                                                updated[idx] = { ...updated[idx], link: e.target.value };
                                                setForm(prev => ({ ...prev, projects: updated }));
                                            }}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Project Description<span className="text-orange-600">*</span>
                                    </label>
                                    <textarea
                                        name="projectDescription"
                                        value={proj.description || ""}
                                        rows={3}
                                        placeholder="Project Description"
                                        onChange={e => {
                                            const updated = [...form.projects];
                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                            setForm(prev => ({ ...prev, projects: updated }));
                                        }}
                                        className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                            </div>
                        ))
                    }
                    <button
                        type="button"
                        onClick={() => {
                            setForm((prev) => ({
                                ...prev,
                                projects: [...(prev.projects || []), { title: "", description: "", link: "" }],
                            }));
                        }}
                        className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                    >
                        + Add Project
                    </button>
                </div >

                {
                    error && (
                        <div className="mt-4 text-red-600 text-xs font-medium text-center fadeIn">{error}</div>
                    )
                }

                <div className="flex justify-center">
                    <button type="submit" className="mt-4 bg-[#db5800] hover:bg-[#bf4d00] text-white px-20 py-2 rounded-lg shadow cursor-pointer transition-all duration-500">
                        Next
                    </button>
                </div>
            </form >
        </div >
    );
}