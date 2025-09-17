import React, { useState, useRef, useEffect } from "react";
import SearchDropdown from "./SearchDropdown";
import { Upload } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { cvOptions as options } from "../data/cvBuilderData";
import { API_BASE_URL } from "../data/api";
import axios from "axios";

export default function CVBuilderForm({ form, setForm, onNext, setIsExistingCV, parsedData, setParsedData, file, setFile }) {
    const [error, setError] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null);
    const [countrySearch, setCountrySearch] = useState("");
    const [techSearch, setTechSearch] = useState("");
    const [softSearch, setSoftSearch] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const uploadRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formatOption, setFormatOption] = useState("");

    const fileUrl = file ? URL.createObjectURL(file) : null;

    // Validation rules
    const validateField = (name, value, isRequired = false) => {
        const errors = {};

        if (isRequired && (!value || value.toString().trim() === "")) {
            errors[name] = "This field is required";
            return errors;
        }

        if (!value || value.toString().trim() === "") {
            return errors;
        }

        switch (name) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors[name] = "Please enter a valid email address";
                }
                break;
            case 'phone':
                const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
                if (!phoneRegex.test(value)) {
                    errors[name] = "Please enter a valid phone number";
                }
                break;
            case 'linkedInURL':
                const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
                if (value && !linkedinRegex.test(value)) {
                    errors[name] = "Please enter a valid LinkedIn URL";
                }
                break;
            case 'startDate':
            case 'endDate':
                if (value && isNaN(Date.parse(value))) {
                    errors[name] = "Please enter a valid date";
                }
                break;
            default:
                break;
        }

        return errors;
    };

    const validateWorkExperience = (workExp, index) => {
        const errors = {};
        const requiredFields = ['type', 'jobTitle', 'companyName', 'startDate', 'responsibilities'];

        requiredFields.forEach(field => {
            if (!workExp[field] || workExp[field].toString().trim() === "") {
                errors[`workExperience.${index}.${field}`] = "This field is required";
            }
        });

        // Validate dates
        if (workExp.startDate && workExp.endDate && workExp.endDate !== 'Present') {
            const startDate = new Date(workExp.startDate);
            const endDate = new Date(workExp.endDate);
            if (endDate <= startDate) {
                errors[`workExperience.${index}.endDate`] = "End date must be after start date";
            }
        }

        return errors;
    };

    const validateEducation = (edu, index) => {
        const errors = {};
        const requiredFields = ['universityName', 'startDate', 'coursework'];

        requiredFields.forEach(field => {
            if (!edu[field] || edu[field].toString().trim() === "") {
                errors[`education.${index}.${field}`] = "This field is required";
            }
        });

        // Validate dates
        if (edu.startDate && edu.endDate && edu.endDate !== 'Present') {
            const startDate = new Date(edu.startDate);
            const endDate = new Date(edu.endDate);
            if (endDate <= startDate) {
                errors[`education.${index}.endDate`] = "End date must be after start date";
            }
        }

        return errors;
    };

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
                    isPresent: exp.end_date === 'Present',
                    responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n• ') : exp.responsibilities || '',
                    achievements: Array.isArray(exp.achievements) ? exp.achievements.join('\n• ') : exp.achievements || '',
                }));
            }

            // Education
            if (parsedData.education && parsedData.education.length > 0) {
                updatedForm.education = parsedData.education.map(edu => ({
                    universityName: edu.university_name || '',
                    startDate: edu.start_date ? formatDateForInput(edu.start_date) : '',
                    endDate: edu.end_date && edu.end_date !== 'Present' ? formatDateForInput(edu.end_date) : '',
                    isPresent: edu.end_date === 'Present',
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
            setParsedData(null);
            setFormatOption("");
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

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
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
                coursework: '',
                achievements: '',
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
        const updated = [...(form.additionalSections || [])];
        updated[index][key] = value;
        setForm(prev => ({ ...prev, additionalSections: updated }));
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

        // Validate field and update validation errors
        const fieldErrors = validateField(name, value, ['fullName', 'email', 'phone'].includes(name));
        setValidationErrors(prev => ({
            ...prev,
            ...fieldErrors
        }));

        // Clear validation error if field becomes valid
        if (Object.keys(fieldErrors).length === 0 && validationErrors[name]) {
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

    const handleSubmit = (e) => {
        e.preventDefault();

        let requiredFields = ["fullName", "email", "phone"];
        let allErrors = {};

        if (!parsedData) {
            requiredFields.push("targetCountry");
        } else if (parsedData && formatOption === "country") {
            requiredFields.push("targetCountry");
        } else if (parsedData && formatOption === "company") {
            requiredFields.push("targetCompany", "jobDescription");
        } else if (parsedData && !formatOption) {
            setError("Please select a formatting option.");
            return;
        }

        // Validate required fields
        for (let field of requiredFields) {
            if (!form[field] || form[field].toString().trim() === "") {
                allErrors[field] = "This field is required";
            } else {
                const fieldErrors = validateField(field, form[field], true);
                allErrors = { ...allErrors, ...fieldErrors };
            }
        }

        // Validate work experience
        if (form.workExperience && form.workExperience.length > 0) {
            form.workExperience.forEach((workExp, index) => {
                const workErrors = validateWorkExperience(workExp, index);
                allErrors = { ...allErrors, ...workErrors };
            });
        }

        // Validate education
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
                            Format by Country
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormatOption("company")}
                            className={`px-4 py-3 md:py-0 h-10 rounded-full text-sm font-medium transition-all duration-300 ${formatOption === "company"
                                ? "bg-[#db5800] text-white"
                                : "bg-black/5 text-black/80 hover:bg-black/10"
                                }`}
                        >
                            Format by Company
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {(!parsedData || (parsedData && formatOption === "country")) && (
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
                            />
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
                                    {renderFieldError("fullName")}
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
                                    {renderFieldError("linkedInURL")}
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
                                            <select
                                                value={w.type}
                                                onChange={e => updateWorkExperience(i, "type", e.target.value)}
                                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
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
                                                value={w.jobTitle}
                                                onChange={e => updateWorkExperience(i, "jobTitle", e.target.value)}
                                                placeholder="Job Title"
                                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            />
                                            {renderFieldError(`workExperience.${i}.jobTitle`)}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Company Name<span className="text-orange-600">*</span></label>
                                            <input
                                                type="text"
                                                value={w.companyName}
                                                onChange={e => updateWorkExperience(i, "companyName", e.target.value)}
                                                placeholder="Company"
                                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            />
                                            {renderFieldError(`workExperience.${i}.companyName`)}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Start Date<span className="text-orange-600">*</span></label>
                                            <input
                                                type="date"
                                                value={w.startDate}
                                                onChange={e => updateWorkExperience(i, "startDate", e.target.value)}
                                                className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                            />
                                            {renderFieldError(`workExperience.${i}.startDate`)}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">End Date<span className="text-orange-600">*</span></label>
                                            <input
                                                type="date"
                                                value={w.endDate}
                                                disabled={w.isPresent}
                                                onChange={e => updateWorkExperience(i, "endDate", e.target.value)}
                                                className={`w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg ${w.isPresent ? "bg-black/5 text-black/30" : "bg-none text-black/80"}`}
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
                                                value={w.responsibilities}
                                                onChange={e => updateWorkExperience(i, "responsibilities", e.target.value)}
                                                className="w-full text-xs py-2 px-3 border border-orange-800/25 rounded-lg"
                                                placeholder="Responsibilities"
                                                rows={4}
                                            />
                                            {renderFieldError(`workExperience.${i}.responsibilities`)}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">Achievements</label>
                                            <textarea
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
                            ))
                        }
                    </div>
                    <button type="button" onClick={addWorkExperience} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                        + Add experience
                    </button>
                </div>

                {/* Education */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Education</h2>
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
                                            University Name<span className="text-orange-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.universityName}
                                            onChange={e => updateEducation(i, "universityName", e.target.value)}
                                            placeholder="University Name"
                                            className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                        />
                                        {renderFieldError(`education.${i}.universityName`)}
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
                                        {renderFieldError(`education.${i}.startDate`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm mb-1">End Date</label>
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
                                        {renderFieldError(`education.${i}.coursework`)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm mb-1">Achievements</label>
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
                        ))}
                        <button type="button" onClick={addEducation} className="h-10 px-4 bg-[#db5800] hover:bg-[#c85000] text-sm font-semibold text-white rounded-full cursor-pointer">
                            + Add education
                        </button>
                    </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Skills</h2>
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
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
                        <div className="space-y-2 md:col-span-2">
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
                    </div>
                </div>

                {/* Certificates and Awards */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Certificates and Awards</h2>
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
                    <h2 className="text-xl font-semibold mb-4">Projects</h2>
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
                                        value={section.title || ""}
                                        placeholder="Section Title"
                                        onChange={e => updateAdditionalSection(idx, "title", e.target.value)}
                                        className="w-full text-xs h-10 px-3 border border-orange-800/25 rounded-lg"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm mb-1">
                                        Section Description<span className="text-orange-600">*</span>
                                    </label>
                                    <textarea
                                        name="sectionDescription"
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