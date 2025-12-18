import React, { useState, useRef, useEffect, useMemo } from "react";
import { buildCvSchema } from "../validation/cvSchema";
import SearchDropdown from "./SearchDropdown";
import { Upload } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { cvOptions as options } from "../data/cvBuilderData";
import { API_BASE_URL } from "../data/api";
import axios from "axios";

export default function CVBuilderForm({ form, setForm, onNext, setIsExistingCV, parsedData, setParsedData, file, setFile, formatOption, setFormatOption }) {
    const [error, setError] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [countrySearch, setCountrySearch] = useState("");
    const [techSearch, setTechSearch] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const uploadRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const sessionId = useMemo(() => {
        return (
            localStorage.getItem("sessionId") ||
            (localStorage.setItem("sessionId", uid()), localStorage.getItem("sessionId"))
        );
    }, []);
    const userId = localStorage.getItem("userId") || null;

    const fileUrl = file ? URL.createObjectURL(file) : null;

    useEffect(() => {
        if (parsedData) {
            const updatedForm = { ...form };

            // Basic contact information (only fill if empty to preserve edits)
            if (parsedData.full_name) updatedForm.firstName = parsedData.full_name.split(" ")[0];
            if (parsedData.full_name) updatedForm.lastName = parsedData.full_name.split(" ")[1] || updatedForm.lastName;
            if (parsedData.email) updatedForm.email = parsedData.email;
            if (parsedData.phone) updatedForm.phone = parsedData.phone;
            if (parsedData.location) updatedForm.location = parsedData.location;

            // Work Experience
            if (parsedData.work_experience && parsedData.work_experience.length > 0) {
                updatedForm.workExperience = parsedData.work_experience.map(exp => ({
                    type: exp.type_of_work || '',
                    jobTitle: exp.job_title || '',
                    companyName: exp.company_name || '',
                    startDate: exp.start_date ? formatDateForInput(exp.start_date) : '',
                    endDate: exp.end_date && exp.end_date !== 'Present' ? formatDateForInput(exp.end_date) : '',
                    isPresent: exp.end_date === 'Present',
                    responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n• ') : exp.responsibilities || '',
                    achievements: Array.isArray(exp.achievements) ? exp.achievements.join('\n• ') : exp.achievements || '',
                }));
            }

            // Education
            if (parsedData.education && parsedData.education.length > 0) {
                updatedForm.education = parsedData.education.map(edu => {
                    const universityOptions = options["universities"] || [];
                    const isOther = !universityOptions.includes(edu.university_name);
                    return {
                        discipline: edu.discipline || "",
                        level: edu.level || "",
                        course: edu.course || "",
                        country: edu.country || "",
                        region: edu.region || "",
                        location: edu.location || "",
                        universityName: isOther ? "Other" : edu.university_name || "",
                        startDate: edu.start_date ? formatDateForInput(edu.start_date) : "",
                        endDate: edu.end_date && edu.end_date !== "Present" ? formatDateForInput(edu.end_date) : "",
                        isPresent: edu.end_date === "Present",
                        results: edu.results || "",
                        otherUniversityName: isOther ? edu.university_name : "",
                    };
                });
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
                updatedForm.languagesKnown = parsedData.languages_known || "";
            }

            // Certifications
            if (parsedData.certifications && parsedData.certifications.length > 0) {
                updatedForm.certificates = parsedData.certifications.map(cert => ({
                    type: cert.type || '',
                    name: cert.name || cert.title || '',
                    organization: cert.organization || cert.issuer || '',
                    dateObtained: cert.date_obtained || cert.date ? formatDateForInput(cert.date_obtained || cert.date) : '',
                }));
            }

            // Projects
            if (parsedData.projects && parsedData.projects.length > 0) {
                updatedForm.projects = parsedData.projects.map(proj => ({
                    type: proj.type || '',
                    title: proj.title || '',
                    link: proj.link || '',
                    description: proj.description || '',
                }));
            }

            // Links
            if (parsedData.links && parsedData.links.length > 0) {
                updatedForm.links = parsedData.links.map(link => ({
                    name: link.name || '',
                    url: link.url || '',
                }));
            }

            // Additional Sections
            if (parsedData.additionalSec && parsedData.additionalSec.length > 0) {
                updatedForm.additionalSec = parsedData.additionalSec.map(section => ({
                    title: section.title || '',
                    desc: section.desc || '',
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
        if (!isUploading) {
            uploadRef.current.click();
        }
    };

    const handleFileChange = async (event) => {
        const fileList = event.target.files;
        if (fileList && fileList.length > 0) {
            const selectedFile = fileList[0];
            setFile(selectedFile);

            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("session_id", sessionId);
                formData.append("user_id", userId);

                const response = await axios.post(`${API_BASE_URL}/upload-cv`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                setParsedData(response.data);
                setIsExistingCV(true);
            } catch (error) {
                console.error("Upload error:", error);
            }
            setIsUploading(false);
        }
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

    const filteredCountries = options["countries"].filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const filteredTechSkills = options["technicalSkills"].filter(skill =>
        skill.toLowerCase().includes(techSearch.toLowerCase())
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

    const handleLangToggle = (lang) => {
        const selected = form.languagesKnown || [];
        if (selected.includes(lang)) {
            setForm({ ...form, languagesKnown: selected.filter(l => l !== lang) });
        } else {
            setForm({ ...form, languagesKnown: [...selected, lang] });
        }
    };

    const handleSelect = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setOpenDropdown(null);

        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleProjectSelect = (idx, key, value) => {
        const updated = [...(form.projects || [])];
        updated[idx][key] = value;
        setForm((prev) => ({ ...prev, projects: updated }));
        setOpenDropdown(null);
    };

    const handleCertSelect = (idx, key, value) => {
        const updated = [...(form.certificates || [])];
        updated[idx][key] = value;
        setForm((prev) => ({ ...prev, certificates: updated }));
        setOpenDropdown(null);
    };

    const handleLinkSelect = (idx, key, value) => {
        const updated = [...(form.links || [])];
        updated[idx][key] = value;
        setForm((prev) => ({ ...prev, links: updated }));
        setOpenDropdown(null);
    };

    const addNewLink = () => {
        setForm(prev => ({
          ...prev,
          links: [
            ...(prev.links || []),
            { name: "", url: "" },
          ],
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
                isPresent: false,
                responsibilities: '',
                achievements: '',
            }],
        }));
    };

    const updateWorkExperience = (index, key, value) => {
        const updated = [...(form.workExperience || [])];

        if (key === 'isPresent') {
            updated[index][key] = value;
            if (value) {
                updated[index]['endDate'] = '';
            }
        } else {
            updated[index][key] = value;
        }

        setForm(prev => ({ ...prev, workExperience: updated }));

        // Clear validation errors
        const fieldName = `workExperience.${index}.${key}`;
        if (validationErrors[fieldName]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
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

        // Clear validation errors
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

    const addAdditionalSection = () => {
        setForm(prev => ({
            ...prev,
            additionalSec: [...(prev.additionalSec || []), {
                title: '',
                description: '',
            }],
        }));
    };

    const updateAdditionalSection = (index, key, value) => {
        const updated = [...(form.additionalSec || [])];
        updated[index][key] = value;
        setForm(prev => ({ ...prev, additionalSec: updated }));
    };

    const removeAdditionalSection = (index) => {
        const updated = [...(form.additionalSec || [])];
        updated.splice(index, 1);
        setForm(prev => ({ ...prev, additionalSec: updated }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError("");

        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = () => {
        setForm(prevForm => ({
            ...prevForm,
            coverLetter: !prevForm.coverLetter
        }));
    };

    const getElementForErrorKey = (errorKey) => {
        let element = null;
        if (errorKey.includes('.')) {
            const parts = errorKey.split('.');
            const fieldName = parts[parts.length - 1];
            element = document.querySelector(`[name="${fieldName}"]`);
            if (!element) {
                const container = document.querySelector(`[data-error-key="${errorKey}"]`);
                if (container) {
                    element = container.querySelector('input, textarea, select, button, [role="button"], [tabindex]');
                }
            }
        } else {
            element = document.querySelector(`[name="${errorKey}"]`);
            if (!element) {
                const container = document.querySelector(`[data-error-key="${errorKey}"]`);
                if (container) {
                    element = container.querySelector('input, textarea, select, button, [role="button"], [tabindex]');
                }
            }
        }
        return element;
    };

    const scrollToFirstError = (errors) => {
        const firstErrorKey = Object.keys(errors)[0];
        if (!firstErrorKey) return;
        const element = getElementForErrorKey(firstErrorKey);
        if (element) {
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setTimeout(() => element.focus(), 250);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (parsedData && !formatOption) {
            setError("Please select a formatting option.");
            return;
        }

        const schema = buildCvSchema({ parsedData, formatOption });
        const result = schema.safeParse(form);

        if (!result.success) {
            const allErrors = {};
            for (const issue of result.error.issues) {
                const path = issue.path.join(".");
                allErrors[path] = issue.message || "Invalid value";
            }
            setValidationErrors(allErrors);
            setError("");
            scrollToFirstError(allErrors);
            return;
        }

        setValidationErrors({});
        setError("");
        onNext();
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
            <h1 className="text-3xl mb-2">CV Builder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-4 border-b border-black/10">
                Your PATH to a winning CV!
            </p>
            <h1 className="px-2 text-sm mb-2">Already have an existing CV?</h1>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center mb-6">
                <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className={`text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-black/5 rounded-2xl hover:bg-black/10 cursor-pointer disabled:opacity-50 ${isUploading ? "pointer-events-none" : "pointer-events-auto"}`}
                >
                    {isUploading ? (
                        <>
                            <ClipLoader size={18} color="#666" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="inline w-5 h-5" />
                            {!file ? "Upload CV" : "Replace File"}
                        </>
                    )}
                </button>
                <input
                    ref={uploadRef}
                    type="file"
                    accept=".pdf,.docx"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />

                {file && parsedData && (
                    <>
                        <div className="flex gap-2">
                            <a
                                href={fileUrl}
                                download={file.name}
                                className="text-xs py-3 md:py-0 min-h-8 px-4 rounded-full flex gap-1 items-center bg-black/5 hover:bg-black/10 text-black/80"
                            >
                                Selected:<span className="text-orange-800 underline">{file.name}</span>
                            </a>
                        </div>
                        <div className="flex items-center px-4 py-3 md:py-0 min-h-8 bg-green-300/10 rounded-2xl md:rounded-full fadeIn">
                            <p className="text-xs text-green-800">
                                ✓ CV successfully analyzed! You can now review and edit the information below.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Format Options - Only show when CV is uploaded and analyzed */}
            {file && parsedData && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Choose Formatting Option</h2>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setFormatOption("country")}
                            className={`px-4 py-3 md:py-0 h-10 rounded-full text-sm font-medium transition-all duration-300 ${formatOption === "country"
                                ? "bg-[#db5800] text-white"
                                : "bg-black/5 text-black/80 hover:bg-black/10"
                                }`}
                        >
                            Format for Studies
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormatOption("company")}
                            className={`px-4 py-3 md:py-0 h-10 rounded-full text-sm font-medium transition-all duration-300 ${formatOption === "company"
                                ? "bg-[#db5800] text-white"
                                : "bg-black/5 text-black/80 hover:bg-black/10"
                                }`}
                        >
                            Format for Jobs
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {(!parsedData || (parsedData && formatOption === "country")) && (
                        <div className="flex flex-col gap-2" data-error-key="targetCountry">
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
                            />
                            {/* Visual invalid marker for global CSS ring when invalid */}
                            <div style={{ display: 'none' }} data-required="true" data-invalid={!!validationErrors["targetCountry"]}></div>
                            {renderFieldError("targetCountry")}
                        </div>
                    )}

                    {parsedData && formatOption === "company" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm px-2 mb-1">
                                Target Company<span className="text-orange-600">*</span>
                            </label>
                            <input
                                type="text"
                                name="targetCompany"
                                value={form.targetCompany || ""}
                                onChange={handleChange}
                                placeholder="Enter target company name"
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                data-required={true}
                                data-invalid={!!validationErrors["targetCompany"]}
                            />
                            {renderFieldError("targetCompany")}
                        </div>
                    )}

                    {parsedData && formatOption === "company" && (
                        <>
                            <div className="flex flex-col gap-2 md:col-span-3 fadeIn">
                                <label className="text-sm px-2 mb-1">
                                    Job Description<span className="text-orange-600">*</span>
                                </label>
                                <textarea
                                    name="jobDescription"
                                    value={form.jobDescription || ""}
                                    onChange={handleChange}
                                    placeholder="Paste the job description here..."
                                    className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                    data-required={true}
                                    data-invalid={!!validationErrors["jobDescription"]}
                                    rows={4}
                                />
                                {renderFieldError("jobDescription")}
                            </div>
                            <div className="flex items-center gap-2 md:col-span-3 fadeIn">
                                <label className="text-sm px-2">
                                    Include cover letter?
                                </label>
                                <input
                                    name="coverLetter"
                                    type="checkbox"
                                    className="accent-[#db5800]"
                                    checked={form.coverLetter}
                                    onChange={handleCheckboxChange}
                                />
                            </div>
                        </>
                    )}

                    {parsedData && formatOption === "role" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm px-2 mb-1">
                                Desired Role<span className="text-orange-600">*</span>
                            </label>
                            <input
                                type="text"
                                name="targetRole"
                                value={form.targetRole || ""}
                                onChange={handleChange}
                                placeholder="Enter your desired role"
                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                data-required={true}
                                data-invalid={!!validationErrors["targetRole"]}
                            />
                            {renderFieldError("targetRole")}
                        </div>
                    )}
                </div>

                {/* Personal Information */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4">
                            <h3 className="font-medium border-b border-black/15 pb-1 px-1">Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start px-1">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">First Name<span className="text-orange-600">*</span></label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={form.firstName || ""}
                                        onChange={handleChange}
                                        placeholder="Your first name"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        data-required={true}
                                        data-invalid={!!validationErrors["firstName"]}
                                    />
                                    {renderFieldError("firstName")}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Last Name<span className="text-orange-600">*</span></label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={form.lastName || ""}
                                        onChange={handleChange}
                                        placeholder="Your last name"
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        data-required={true}
                                        data-invalid={!!validationErrors["lastName"]}
                                    />
                                    {renderFieldError("lastName")}
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
                                        data-required={true}
                                        data-invalid={!!validationErrors["email"]}
                                    />
                                    {renderFieldError("email")}
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
                                        data-required={true}
                                        data-invalid={!!validationErrors["phone"]}
                                    />
                                    {renderFieldError("phone")}
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
                            <div className="flex flex-col gap-4">
                                {(form.links || []).map((link, idx) => (
                                    <div key={idx} className="relative flex gap-4">
                                        <SearchDropdown
                                            label={link.name || "Select"}
                                            isOpen={openDropdown === `link${idx}`}
                                            onToggle={() => toggleDropdown(`link${idx}`)}
                                            options={options["urls"].map(s => ({ id: s, name: s }))}
                                            selectedOptions={link.name ? [link.name] : []}
                                            onOptionToggle={id => handleLinkSelect(idx, "name", id)}
                                            className="w-full md:max-w-100"
                                        />
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={e => handleLinkSelect(idx, "url", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            placeholder="Add URL"
                                        />
                                        <div className="flex">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const removeLinks = [...(form.links || [])];
                                                    removeLinks.splice(idx, 1)
                                                    setForm((prev) => ({ ...prev, links: removeLinks }));
                                                }} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addNewLink} className="mt-2 h-10 w-32 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                                + Add more
                            </button>
                        </div>
                    </div>
                </div>

                {/* Work Experience */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
                    <div>
                        {(form.workExperience || []).map((w, i) => (
                            <div key={i} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                                <div className="flex justify-end absolute top-2 right-2">
                                    <button type="button" onClick={() => removeWorkExperience(i)} className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">Remove</button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Type of Work<span className="text-orange-600">*</span></label>
                                        <select
                                            value={w.type}
                                            onChange={e => updateWorkExperience(i, "type", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            data-required={true}
                                            data-invalid={!!validationErrors[`workExperience.${i}.type`]}
                                        >
                                            <option value="">Type of Work</option>
                                            {options["workTypes"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {renderFieldError(`workExperience.${i}.type`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Job Title<span className="text-orange-600">*</span></label>
                                        <input
                                            type="text"
                                            name="jobTitle"
                                            value={w.jobTitle}
                                            onChange={e => updateWorkExperience(i, "jobTitle", e.target.value)}
                                            placeholder="Job Title"
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            data-required={true}
                                            data-invalid={!!validationErrors[`workExperience.${i}.jobTitle`]}
                                        />
                                        {renderFieldError(`workExperience.${i}.jobTitle`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Company<span className="text-orange-600">*</span></label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={w.companyName}
                                            onChange={e => updateWorkExperience(i, "companyName", e.target.value)}
                                            placeholder="Company"
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            data-required={true}
                                            data-invalid={!!validationErrors[`workExperience.${i}.companyName`]}
                                        />
                                        {renderFieldError(`workExperience.${i}.companyName`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Period<span className="text-orange-600">*</span></label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={w.startDate}
                                            onChange={e => updateWorkExperience(i, "startDate", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            data-required={true}
                                            data-invalid={!!validationErrors[`workExperience.${i}.startDate`]}
                                        />
                                        {renderFieldError(`workExperience.${i}.startDate`)}
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={w.endDate}
                                            disabled={w.isPresent}
                                            onChange={e => updateWorkExperience(i, "endDate", e.target.value)}
                                            className={`w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg ${w.isPresent ? "bg-black/5 text-black/30" : "bg-none text-black/80"}`}
                                            data-required={!w.isPresent}
                                            data-invalid={!!validationErrors[`workExperience.${i}.endDate`]}
                                        />
                                        {renderFieldError(`workExperience.${i}.endDate`)}
                                        <div className="flex items-center gap-2 px-2">
                                            <input
                                                type="checkbox"
                                                id={`present-work-${i}`}
                                                checked={w.isPresent || false}
                                                onChange={e => updateWorkExperience(i, "isPresent", e.target.checked)}
                                                className="accent-[#db5800]"
                                            />
                                            <label htmlFor={`present-work-${i}`} className="text-sm">Present</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Responsibilities<span className="text-orange-600">*</span></label>
                                        <textarea
                                            name="responsibilities"
                                            value={w.responsibilities}
                                            onChange={e => updateWorkExperience(i, "responsibilities", e.target.value)}
                                            className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                            placeholder="Responsibilities"
                                            rows={4}
                                            data-required={true}
                                            data-invalid={!!validationErrors[`workExperience.${i}.responsibilities`]}
                                        />
                                        {renderFieldError(`workExperience.${i}.responsibilities`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Achievements</label>
                                        <textarea
                                            name="achievements"
                                            value={w.achievements}
                                            onChange={e => updateWorkExperience(i, "achievements", e.target.value)}
                                            placeholder="Achievements"
                                            className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                            rows={4}
                                        />
                                        {renderFieldError(`workExperience.${i}.achievements`)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addWorkExperience} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                        + Add experience
                    </button>
                </div>

                {/* Education */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Education Information</h2>
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
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.discipline`]}
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
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.level`]}
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
                                            name="course"
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
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.country`]}
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
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.region`]}
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
                                            name="location"
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
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.universityName`]}
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
                                            <>
                                                <input
                                                    type="text"
                                                    name="otherUniversityName"
                                                    value={edu.otherUniversityName}
                                                    onChange={e => handleOtherInputChange(i, e)}
                                                    placeholder="Other"
                                                    className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                                />
                                                {renderFieldError(`education.${i}.otherUniversityName`)}
                                            </>
                                        )}

                                        {renderFieldError(`education.${i}.universityName`)}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">
                                            Start Year<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={edu.startDate}
                                            onChange={e => updateEducation(i, "startDate", e.target.value)}
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.startDate`]}
                                        />
                                        {renderFieldError(`education.${i}.startDate`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">End Year<span className="text-orange-600">*</span></label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={edu.endDate}
                                                disabled={edu.isPresent}
                                                onChange={e => updateEducation(i, "endDate", e.target.value)}
                                                className={`w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg ${edu.isPresent ? "bg-black/5 text-black/30" : "bg-none text-black/80"}`}
                                                data-required={!edu.isPresent}
                                                data-invalid={!!validationErrors[`education.${i}.endDate`]}
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
                                            name="results"
                                            value={edu.results}
                                            onChange={e => updateEducation(i, "results", e.target.value)}
                                            placeholder="Results"
                                            className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                            rows={4}
                                            data-required={true}
                                            data-invalid={!!validationErrors[`education.${i}.results`]}
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

                {/* Skills */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Skills</h2>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <SearchDropdown
                                label={form.technicalSkills && form.technicalSkills.length > 0
                                    ? form.technicalSkills.join(", ")
                                    : "Select Skills"}
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

                        {/* Languages Known */}
                        <div className="space-y-2 md:col-span-2">
                            <h2 className="text-xl font-semibold mb-4">Languages</h2>
                            <div className="flex flex-col">
                                <SearchDropdown
                                    label={form.languagesKnown && form.languagesKnown.length > 0
                                        ? form.languagesKnown.join(", ")
                                        : "Select Languages"}
                                    count={form.languagesKnown ? form.languagesKnown.length : 0}
                                    isOpen={openDropdown === "languagesKnown"}
                                    onToggle={() => toggleDropdown("languagesKnown")}
                                    multiSelect
                                    options={options["languages"].map(lang => ({ id: lang, name: lang }))}
                                    selectedOptions={form.languagesKnown || []}
                                    onOptionToggle={handleLangToggle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Certificates and Awards */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Certificates, Awards, Scholarships or Recognitions</h2>
                    {(form.certificates || []).map((cert, idx) => (
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
                                        Type<span className="text-orange-600">*</span>
                                    </label>
                                    <SearchDropdown
                                        label={cert.type || "Select one..."}
                                        isOpen={openDropdown === `certType${idx}`}
                                        onToggle={() => toggleDropdown(`certType${idx}`)}
                                        options={options["certificationTypes"].map(s => ({ id: s, name: s }))}
                                        selectedOptions={cert.type ? [cert.type] : []}
                                        onOptionToggle={id => handleCertSelect(idx, "type", id)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Name<span className="text-orange-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="certificateName"
                                        value={cert.name || ""}
                                        placeholder="Certification Name"
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
                                        Date Obtained
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
                    ))}
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
                </div>

                {/* Projects */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Projects, Research or Publications</h2>
                    {(form.projects || []).map((proj, idx) => (
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 mb-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Type<span className="text-orange-600">*</span>
                                    </label>
                                    <SearchDropdown
                                        label={proj.type || "Select one..."}
                                        isOpen={openDropdown === `projType${idx}`}
                                        onToggle={() => toggleDropdown(`projType${idx}`)}
                                        options={options["projectTypes"].map(s => ({ id: s, name: s }))}
                                        selectedOptions={proj.type ? [proj.type] : []}
                                        onOptionToggle={id => handleProjectSelect(idx, "type", id)}
                                    />
                                    {renderFieldError(`projects.${idx}.type`)}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Project Title<span className="text-orange-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={proj.title || ""}
                                        placeholder="Project Title"
                                        onChange={e => {
                                            const updated = [...(form.projects || [])];
                                            updated[idx] = { ...updated[idx], title: e.target.value };
                                            setForm(prev => ({ ...prev, projects: updated }));
                                        }}
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                    {renderFieldError(`projects.${idx}.title`)}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">Project Link</label>
                                    <input
                                        type="url"
                                        name="link"
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
                                {renderFieldError(`projects.${idx}.description`)}
                            </div>
                        </div>
                    ))}
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
                </div>

                {/* Additional Sections */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Additional Sections</h2>
                    {(form.additionalSec || []).map((section, idx) => (
                        <div key={idx} className="relative border border-black/5 shadow-sm inset-shadow-xs p-6 rounded-2xl mb-4">
                            <div className="flex justify-end absolute top-2 right-2">
                                <button
                                    type="button"
                                    onClick={() => removeAdditionalSection(idx)}
                                    className="h-8 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Section Title<span className="text-orange-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={section.title || ""}
                                        placeholder="Section Title"
                                        onChange={e => updateAdditionalSection(idx, "title", e.target.value)}
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                    {renderFieldError(`additionalSec.${idx}.title`)}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Section Description<span className="text-orange-600">*</span>
                                    </label>
                                    <textarea
                                        name="desc"
                                        value={section.desc || ""}
                                        rows={3}
                                        placeholder="Section Description"
                                        onChange={e => {
                                            const updated = [...(form.additionalSec || [])];
                                            updated[idx] = { ...updated[idx], desc: e.target.value };
                                            setForm(prev => ({ ...prev, additionalSec: updated }));
                                        }}
                                        className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                    {renderFieldError(`additionalSec.${idx}.desc`)}
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addAdditionalSection}
                        className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer"
                    >
                        + Add Section
                    </button>
                </div>

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