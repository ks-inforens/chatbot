import React from "react";

export default function ReviewStage({ form, onEdit, onSubmit }) {
    // Helper to format Date of Birth nicely or display N/A
    const formatDOB = (dob) => {
        if (!dob) return <span className="text-gray-800">N/A</span>;
        try {
            const date = new Date(dob);
            return date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return <span className="text-gray-800">Invalid date</span>;
        }
    };

    return (
        <div className="w-full px-8 py-4 fadeIn">
            <h1 className="text-3xl mb-2">Scholarship Finder</h1>
            <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                Just answer a few questions and let us help you find the best scholarships for you!
            </p>

            <h2 className="text-2xl font-semibold mb-4 mt-4">Review</h2>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 mb-6 text-gray-700">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    <div>
                        <dt className="text-gray-500 text-sm">Country of Citizenship</dt>
                        <dd className="text-base">{form.citizenship || <span className="text-gray-800">N/A</span>}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Level of Study</dt>
                        <dd className="text-base">{form.studyLevel || <span className="text-gray-800">N/A</span>}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Preferred Field of Study</dt>
                        <dd className="text-base">{form.field || <span className="text-gray-800">N/A</span>}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Education Information</dt>
                        <dd className="flex flex-col gap-2 text-base">
                            {(form.education || []).length > 0 ? (
                                form.education.map((edu, idx) => (
                                    <div key={idx}>
                                        <h1 className="text-sm font-semibold">{edu.universityName === "Other" ? edu.otherUniversityName : edu.universityName}</h1>
                                        {edu.startDate && <h2 className="text-sm italic mb-1">{edu.startDate} - {edu.isPresent ? "Present" : edu.endDate}</h2>}
                                        <p className="text-sm">{edu.level ?? edu.level} &bull; {edu.course ?? edu.course}</p>
                                        <p className="text-sm">Results/Grades: {edu.results && edu.results}</p>
                                    </div>
                                ))
                            ) : (
                                <span>N/A</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Disability Status</dt>
                        <dd className="text-base">
                            {(form.disability === "Yes" ? form.disabilityDetails : form.disability) || <span className="text-gray-800">None</span>}
                        </dd>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <div>
                        <dt className="text-gray-500 text-sm">Preferred Country of Study</dt>
                        <dd className="text-base">{form.preferredCountry || <span className="text-gray-800">N/A</span>}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Preferred University</dt>
                        <dd className="text-base">{form.university || <span className="text-gray-800">N/A</span>}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 text-sm">Course Intake</dt>
                        <dd className="text-base">{form.intake || <span className="text-gray-800">N/A</span>}</dd>
                    </div>
                    <div className="flex gap-12">
                        <div className="flex flex-col gap-1">
                            <dt className="text-gray-500 text-sm">Date of Birth</dt>
                            <dd className="text-base">{formatDOB(form.dob)}</dd>
                        </div>
                        <div className="flex flex-col gap-1">
                            <dt className="text-gray-500 text-sm">Gender</dt>
                            <dd className="text-base">{form.gender || <span className="text-gray-800">N/A</span>}</dd>
                        </div>
                    </div>
                    {form.disability === "Yes" && (
                        <div className="flex flex-col gap-1">
                            <dt className="text-gray-500 text-sm">If Yes – Specify</dt>
                            <dd className="text-base text-gray-800">{form.disabilityDetails || "N/A"}</dd>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <dt className="text-gray-500 text-sm mb-1">Extracurricular Activities</dt>
                <dd className="text-base whitespace-pre-line">
                    {(form.activity || []).length > 0 ? (
                        form.activity.map((a, idx) => (
                            <div key={idx}>
                                <p>{a.description}</p>
                            </div>
                        ))
                    ) : (
                        <span>N/A</span>
                    )}
                </dd>
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