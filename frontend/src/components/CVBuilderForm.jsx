import React, { useState, useRef, useEffect } from "react";
import SearchDropdown from "./SearchDropdown";
import { Upload } from "lucide-react";
import { cvOptions as options } from "../data/cvBuilderData";
import { API_BASE_URL } from "../data/api";
import axios from "axios";

export default function CVBuilderForm({ form, setForm, onNext }) {
    const [error, setError] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [countrySearch, setCountrySearch] = useState("");
    const [techSearch, setTechSearch] = useState("");
    const [softSearch, setSoftSearch] = useState("");
    const uploadRef = useRef(null);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fileUrl = file ? URL.createObjectURL(file) : null;

    // Auto-populate form when parsedData is available
    useEffect(() => {
        if (parsedData) {
            const updatedForm = { ...form };

            // Basic contact information
            if (parsedData.full_name) updatedForm.fullName = parsedData.full_name;
            if (parsedData.email) updatedForm.email = parsedData.email;
            if (parsedData.phone) updatedForm.phone = parsedData.phone;
            if (parsedData.linkedin) updatedForm.linkedInURL = parsedData.linkedin;
            if (parsedData.location) updatedForm.location = parsedData.location;

            // Work Experience
            if (parsedData.work_experience && parsedData.work_experience.length > 0) {
                updatedForm.workExperience = parsedData.work_experience.map(exp => ({
                    type: exp.type_of_work || '',
                    jobTitle: exp.job_title || '',
                    companyName: exp.company_name || '',
                    startDate: exp.start_date ? formatDateForInput(exp.start_date) : '',
                    endDate: exp.end_date && exp.end_date !== 'Present' ? formatDateForInput(exp.end_date) : '',
                    responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n• ') : exp.responsibilities || '',
                    achievements: Array.isArray(exp.achievements) ? exp.achievements.join('\n• ') : exp.achievements || '',
                }));
            }

            // Education
            if (parsedData.education && parsedData.education.length > 0) {
                updatedForm.education = parsedData.education.map(edu => ({
                    universityName: edu.university_name || '',
                    startDate: edu.start_date ? formatDateForInput(edu.start_date) : '',
                    endDate: edu.end_date ? formatDateForInput(edu.end_date) : '',
                    coursework: edu.relevant_coursework || '',
                    achievements: Array.isArray(edu.achievements) ? edu.achievements.join('\n• ') : edu.achievements || '',
                }));
            }

            // Skills
            if (parsedData.skills) {
                if (parsedData.skills.technical_skills) {
                    const techSkills = typeof parsedData.skills.technical_skills === 'string'
                        ? parsedData.skills.technical_skills.split(',').map(skill => skill.trim())
                        : parsedData.skills.technical_skills;
                    updatedForm.technicalSkills = techSkills;
                }
                if (parsedData.skills.soft_skills) {
                    const softSkills = typeof parsedData.skills.soft_skills === 'string'
                        ? parsedData.skills.soft_skills.split(',').map(skill => skill.trim())
                        : parsedData.skills.soft_skills;
                    updatedForm.softSkills = softSkills;
                }
            }

            // Languages
            if (parsedData.languages_known && parsedData.languages_known.length > 0) {
                updatedForm.languagesKnown = parsedData.languages_known.map(lang => ({
                    language: lang.language || '',
                    proficiency: lang.proficiency || '',
                }));
            }

            // Certifications
            if (parsedData.certifications && parsedData.certifications.length > 0) {
                updatedForm.certificates = parsedData.certifications.map(cert => ({
                    name: cert.name || cert.title || '',
                    organization: cert.organization || cert.issuer || '',
                    dateObtained: cert.date_obtained || cert.date ? formatDateForInput(cert.date_obtained || cert.date) : '',
                }));
            }

            // Projects
            if (parsedData.projects && parsedData.projects.length > 0) {
                updatedForm.projects = parsedData.projects.map(proj => ({
                    title: proj.title || '',
                    link: proj.link || '',
                    description: proj.description || '',
                }));
            }

            setForm(updatedForm);
        }
    }, [parsedData, setForm]);

    // Helper function to format dates for input fields
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';

        // Handle different date formats
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }

        // Handle MM/DD/YYYY format
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const [month, day, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        return '';
    };

    const handleUploadClick = () => {
        uploadRef.current.click();
        setParsedData(null);
    };

    const handleFileChange = (event) => {
        const fileList = event.target.files;
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            setFile(file);
        } else {
            setFile(null);
        }
    };

    const handleUploadFile = async () => {
        setLoading(true);
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(`${API_BASE_URL}/upload-cv`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setParsedData(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Upload error:", error);
        }
    };

    const filteredCountries = options["countries"].filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const filteredTechSkills = options["technicalSkills"].filter(skill =>
        skill.toLowerCase().includes(techSearch.toLowerCase())
    );

    const filteredSoftSkills = options["softSkills"].filter(skill =>
        skill.toLowerCase().includes(softSearch.toLowerCase())
    );

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
            "targetCountry"
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
            <h1 className="mb-2">Already have an exisiting CV?</h1>
            <div className="flex gap-2 items-center mb-6">
                <button
                    type="button"
                    onClick={handleUploadClick}
                    className="text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-black/5 rounded-2xl hover:bg-black/10 cursor-pointer"
                >
                    <Upload className="inline w-5 h-5" />
                    {!file ? "Upload CV" : "Replace File"}
                </button>
                <input
                    ref={uploadRef}
                    type="file"
                    accept=".pdf,.docx"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
                {file && !parsedData && (
                    <div className="flex gap-2">
                        <a
                            href={fileUrl}
                            download={file.name}
                            className="text-xs py-3 md:py-0 min-h-8 px-4 rounded-full flex gap-1 items-center bg-black/5 hover:bg-black/10 text-black/80"
                        >
                            Selected:<span className="text-orange-800 underline">{file.name}</span>
                        </a>
                        <button onClick={handleUploadFile} className="text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-orange-400/15 hover:bg-orange-400/20 rounded-full cursor-pointer">
                            {!loading ? (
                                "Analyse CV"
                            ) : "Analyzing..."
                            }
                        </button>

                    </div>
                )}

                {parsedData && (
                    <div className="flex items-center px-4 py-3 md:py-0 min-h-8 bg-green-300/10 rounded-full fadeIn">
                        <p className="text-xs text-green-800">
                            ✓ CV successfully analyzed! You can now review and edit the information below.
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm px-2 mb-1">
                            Target Country<span className="text-orange-600">*</span>
                        </label>
                        <SearchDropdown
                            label={form.targetCountry || "Select"}
                            isOpen={openDropdown === "targetCountry"}
                            onToggle={() => toggleDropdown("targetCountry")}
                            searchable
                            multiSelect={false}
                            searchValue={countrySearch}
                            onSearchChange={e => setCountrySearch(e.target.value)}
                            options={filteredCountries.map(c => ({ id: c, name: c }))}
                            selectedOptions={form.targetCountry ? [form.targetCountry] : []}
                            onOptionToggle={id => handleSelect("targetCountry", id)}
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
                            options={options["cvLengths"].map(c => ({ id: c, name: c }))}
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
                            options={options["cvStyles"].map(c => ({ id: c, name: c }))}
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
                                        name="phone"
                                        value={form.phone || ""}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Location</label>
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
                                <div key={i} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                    <div className="flex justify-end absolute top-2 right-2">
                                        <button type="button" onClick={() => removeWorkExperience(i)} className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">Remove</button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Type of Work<span className="text-orange-600">*</span></label>
                                            <select value={w.type} onChange={e => updateWorkExperience(i, "type", e.target.value)} className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg">
                                                <option value="">Type of Work</option>
                                                {options["workTypes"].map(t => <option key={t} value={t}>{t}</option>)}
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
                                Technical Skills
                            </label>
                            <SearchDropdown
                                label={form.technicalSkills && form.technicalSkills.length > 0
                                    ? form.technicalSkills.join(", ")
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
                                Soft Skills
                            </label>
                            <SearchDropdown
                                label={form.softSkills && form.softSkills.length > 0
                                    ? form.softSkills.join(", ")
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
                                Languages Known
                            </label>
                            <div className="flex flex-col">
                                {(form.languagesKnown || []).map((lang, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-4 my-2 items-center">
                                        <select
                                            name={`language-${idx}`}
                                            value={lang.language || ""}
                                            onChange={(e) => {
                                                const languagesKnown = [...(form.languagesKnown || [])];
                                                languagesKnown[idx] = { ...languagesKnown[idx], language: e.target.value };
                                                setForm((prev) => ({ ...prev, languagesKnown }));
                                            }}
                                            className="text-xs h-10 px-2 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select Language</option>
                                            {options["languages"].map((l) => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                        <select
                                            name={`proficiency-${idx}`}
                                            value={lang.proficiency || ""}
                                            onChange={(e) => {
                                                const languagesKnown = [...(form.languagesKnown || [])];
                                                languagesKnown[idx] = { ...languagesKnown[idx], proficiency: e.target.value };
                                                setForm((prev) => ({ ...prev, languagesKnown }));
                                            }}
                                            className="text-xs h-10 px-2 border border-orange-800/25 rounded-lg"
                                        >
                                            <option value="">Select Proficiency</option>
                                            {options["proficiencyLevels"].map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const languagesKnown = [...(form.languagesKnown || [])];
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
                                            const updated = [...(form.certificates || [])];
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
                                                const updated = [...(form.certificates || [])];
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
                                                const updated = [...(form.certificates || [])];
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
                                                const updated = [...(form.certificates || [])];
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
                                            const updated = [...(form.projects || [])];
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
                                                const updated = [...(form.projects || [])];
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
                                                const updated = [...(form.projects || [])];
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
                                            const updated = [...(form.projects || [])];
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