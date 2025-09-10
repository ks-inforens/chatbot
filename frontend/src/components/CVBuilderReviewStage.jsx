import React from "react";

export default function CVBuilderReviewStage({ form, onEdit, onSubmit }) {
    return (
        <div className="w-full px-8 py-4 fadeIn">
            <h1 className="text-3xl mb-2">CV Builder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Review your details before generating your professional CV
            </p>

            <h2 className="text-2xl font-semibold mb-4 mt-4">Review</h2>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 mb-6 text-gray-700">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                    <div>
                        <dt className="text-gray-500 text-sm">Full Name</dt>
                        <dd className="text-base">{form.fullName || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Target Country</dt>
                        <dd className="text-base">{form.targetCountry || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">CV Length</dt>
                        <dd className="text-base">{form.cvLength || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Style</dt>
                        <dd className="text-base">{form.style || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Email</dt>
                        <dd className="text-base">{form.email || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Phone Number</dt>
                        <dd className="text-base">{form.phone || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Location</dt>
                        <dd className="text-base">{form.location || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">LinkedIn URL</dt>
                        <dd className="text-base">{form.linkedin || "N/A"}</dd>
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                    <div>
                        <dt className="text-gray-500 text-sm">Work Experience</dt>
                        <dd className="flex flex-col gap-2 text-base">
                            {form.workExperience.map((job, idx) => (
                                <div key={idx}>
                                    <h1 className="text-sm font-semibold">{job.jobTitle} at {job.companyName}</h1>
                                    <h2 className="text-sm italic mb-1">{job.startDate} - {job.endDate}</h2>
                                    <p className="text-sm"><span className="font-medium">Responsibilities:</span> {job.responsibilities || "N/A"}</p>
                                    <p className="text-sm"><span className="font-medium">Achievements:</span> {job.achievements || "N/A"}</p>
                                </div>
                            ))}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Education</dt>
                        <dd className="flex flex-col gap-2 text-base">
                            {form.education.map((edu, idx) => (
                                <div key={idx}>
                                    <h1 className="text-sm font-semibold">{edu.universityName}</h1>
                                    <h2 className="text-sm italic mb-1">{edu.startDate} - {edu.endDate}</h2>
                                    {edu.coursework && <p className="text-sm"><span className="font-medium">Coursework:</span> {edu.coursework || "N/A"}</p>}
                                    {edu.achievements && <p className="text-sm"><span className="font-medium">Achievements:</span> {edu.achievements || "N/A"}</p>}
                                </div>
                            ))}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Skills</dt>
                        <p className="text-sm"><span className="font-medium">Technical Skills: </span>{form.technicalSkills.join(", ")}</p>
                        <p className="text-sm"><span className="font-medium">Soft Skills: </span>{form.softSkills.join(", ")}</p>
                        <h1 className="text-sm font-medium">Languages: </h1>
                        {form.languagesKnown.length > 0 ? (
                            form.languagesKnown.map((lang, idx) => (
                                <div key={idx}>
                                    <p className="text-sm italic">{lang.language} ({lang.proficiency})</p>
                                </div>
                            ))
                        ) : "N/A"
                        }
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Certificates and Awards</dt>
                        <dd className="flex flex-col gap-2 text-base">
                            {form.certificates.length > 0 ? (
                                form.certificates.map((cert, idx) => (
                                    <div key={idx}>
                                        <h1 className="font-medium">{cert.name}</h1>
                                        <p className="text-sm italic">{cert.organization}, {cert.dateObtained}</p>
                                    </div>
                                ))
                            ) : "N/A"
                            }
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Projects</dt>
                        <dd className="flex flex-col gap-2 text-base">
                            {form.projects.length > 0 ? (
                                form.projects.map((p, idx) => (
                                    <div key={idx}>
                                        <h1 className="text-sm font-semibold">{p.title}</h1>
                                        <p className="text-sm">{p.description}</p>
                                        <a href={p.link} target="_blank" className="text-sm italic underline">{p.link}</a>
                                    </div>
                                ))
                            ) : "N/A"
                            }
                        </dd>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-6">
                <button
                    className="bg-gray-300 text-gray-800 px-10 py-2 rounded-lg hover:bg-gray-400 transition cursor-pointer"
                    onClick={onEdit}
                    type="button"
                >
                    Edit
                </button>
                <button
                    className="bg-[#db5800] text-white px-10 py-2 rounded-lg hover:bg-[#bf4d00] transition cursor-pointer"
                    onClick={onSubmit}
                    type="button"
                >
                    Generate CV
                </button>
            </div>
        </div>
    );
}