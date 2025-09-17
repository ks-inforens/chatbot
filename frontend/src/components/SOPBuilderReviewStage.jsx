import React from "react";

export default function SOPBuilderReviewStage({ form, onEdit, onSubmit }) {
    return (
        <div className="w-full px-8 py-4 fadeIn">
            <h1 className="text-3xl mb-2">Personalised SOP Builder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Share your story in detail - we'll craft it into a standout SOP
            </p>

            <h2 className="text-2xl font-semibold mb-4 mt-4">Review</h2>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 mb-6 text-gray-700">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                    <div>
                        <dt className="text-gray-500 text-sm">Name</dt>
                        <dd className="text-base">{form.name || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Country of Origin</dt>
                        <dd className="text-base">{form.countryOfOrigin || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Intended Degree</dt>
                        <dd className="text-base">{form.intendedDegree || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Preferred Field of Study</dt>
                        <dd className="text-base">{form.preferredFieldOfStudy || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Academic Qualifications</dt>
                        <dd className="text-base">{`${form.degree || ""}, ${form.qualificationUniversity || ""}, ${form.graduationYear || ""}, ${form.relevantSubjects || ""}`}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Key Skills</dt>
                        <dd className="text-base whitespace-pre-line">{form.keySkills || "N/A"}</dd>
                    </div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                    <div>
                        <dt className="text-gray-500 text-sm">Preferred Country of Study</dt>
                        <dd className="text-base">{form.preferredCountryOfStudy || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Preferred University</dt>
                        <dd className="text-base">{form.preferredUniversity || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Strengths</dt>
                        <dd className="text-base">{form.strengths || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Why this Field of Study?</dt>
                        <dd className="text-base whitespace-pre-line">{form.whyFieldOfStudy || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Why this University?</dt>
                        <dd className="text-base whitespace-pre-line">{form.whyUniversity || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Projects / Research / Publications</dt>
                        <dd className="flex flex-col gap-2">
                            {(form.projectsResearch || []).length > 0 ? (
                                form.projectsResearch.map((p, idx) => (
                                    <div key={idx}>
                                        <h1 className="text-sm font-semibold">{p.title}</h1>
                                        <p className="text-sm">{p.description}</p>
                                        {p.link && (
                                            <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-sm italic underline">
                                                {p.link}
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <span>N/A</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Awards / Scholarships / Recognitions</dt>
                        <dd className="flex flex-col gap-2">
                            {(form.awards || []).length > 0 ? (
                                form.awards.map((cert, idx) => (
                                    <div key={idx}>
                                        <h1 className="text-sm font-medium">{cert.name}</h1>
                                        <p className="text-sm italic">{cert.organization}{cert.organization && cert.dateObtained ? ", " : ""}{cert.dateObtained}</p>
                                    </div>
                                ))
                            ) : (
                                <span>N/A</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Long-Term Goals</dt>
                        <dd className="text-base whitespace-pre-line">{form.longTermGoals || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Hobbies / Volunteer Work / Extracurriculars</dt>
                        <dd className="text-base whitespace-pre-line">{form.hobbies || "N/A"}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">A Time You Overcame a Challenge</dt>
                        <dd className="text-base whitespace-pre-line">{form.challenge || "N/A"}</dd>
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
                    Submit
                </button>
            </div>
        </div>
    );
}
