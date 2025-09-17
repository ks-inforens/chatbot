import React, { useState } from "react";
import SOPBuilderForm from "../components/SOPBuilderForm";
import SOPBuilderReviewStage from "../components/SOPBuilderReviewStage";
import { WandSparkles, Search } from "lucide-react";
import { API_BASE_URL } from "../data/api";

const downloadFile = (blob, filename) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export default function SOPBuilderPage() {
    const [form, setForm] = useState({
        name: "",
        countryOfOrigin: "",
        intendedDegree: "",
        preferredCountryOfStudy: "",
        preferredFieldOfStudy: "",
        preferredUniversity: "",
        keySkills: "",
        degree: "",
        qualificationUniversity: "",
        graduationYear: "",
        relevantSubjects: "",
        strengths: "",
        whyFieldOfStudy: "",
        whyUniversity: "",
        projectsResearch: [],
        awards: [],
        longTermGoals: "",
        hobbies: "",
        challenge: "",
    });

    const [step, setStep] = useState(1);
    const [sopResult, setSopResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleNext = () => setStep(2);
    const handleEdit = () => setStep(1);

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        setSopResult("");

        const payload = {
            name: form.name,
            country_of_origin: form.countryOfOrigin,
            intended_degree: form.intendedDegree,
            preferred_country: form.preferredCountryOfStudy,
            field_of_study: form.preferredFieldOfStudy,
            preferred_uni: form.preferredUniversity,
            key_skills: form.keySkills,
            degree: form.degree,
            qualification_university: form.qualificationUniversity,
            graduation_year: form.graduationYear,
            relevant_subjects: form.relevantSubjects,
            strengths: form.strengths,
            why_field: form.whyFieldOfStudy,
            why_uni: form.whyUniversity,
            projects: form.projectsResearch,
            awards: form.awards,
            goals: form.longTermGoals,
            hobbies: form.hobbies,
            challenge: form.challenge,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/sop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to generate SOP.");
            } else {
                setSopResult(data.sop);
                setStep(3);
            }
        } catch (e) {
            setError("Network error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!sopResult) return;
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/sop/download/pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sop: sopResult }),
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.error || "Failed to download PDF.");
                return;
            }

            const blob = await response.blob();
            downloadFile(blob, "SOP.pdf");
        } catch (e) {
            setError("Network error: " + e.message);
        }
    };

    const handleDownloadDOCX = async () => {
        if (!sopResult) return;
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/sop/download/docx`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sop: sopResult }),
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.error || "Failed to download DOCX.");
                return;
            }

            const blob = await response.blob();
            downloadFile(blob, "SOP.docx");
        } catch (e) {
            setError("Network error: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="w-full px-8 py-4 fadeIn">
                <h1 className="text-3xl mb-2">Personalised SOP Builder</h1>
                <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                    Share your story in detail - we'll craft it into a standout SOP
                </p>
                <div className="flex flex-col gap-4 items-center justify-center py-32">
                    <Search className="text-orange-700" />
                    <p className="text-black/60 text-center text-md">
                        Crafting the perfect SOP for you. <br />
                        Just a sec!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {step === 1 && <SOPBuilderForm form={form} setForm={setForm} onNext={handleNext} />}
            {step === 2 && <SOPBuilderReviewStage form={form} onEdit={handleEdit} onSubmit={handleSubmit} />}
            {step === 3 && (
                <div className="flex flex-col px-8 py-4 fadeIn">
                    <div className="flex flex-col">
                        <h1 className="text-3xl mb-2">Personalised SOP Builder</h1>
                        <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                            Here is your expertly crafted SOP
                        </p>
                    </div>
                    {error && <p className="text-red-600 mb-4"></p>}
                    <div className="w-full flex gap-4 mb-4">
                        <button
                            onClick={() => {
                                setStep(1);
                                setSopResult("");
                                setError("");
                            }}
                            className="text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-black/5 rounded-2xl hover:bg-black/10 cursor-pointer"
                        >
                            <WandSparkles className="inline w-5 h-5" />
                            Regenerate SOP
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="text-xs py-3 md:py-0 px-4 min-h-8 flex flex-col md:flex-row gap-1.5 items-center bg-black/5 text-black/80 hover:bg-black/10 cursor-pointer rounded-2xl"
                        >
                            <img src="/pdfIcon.png" alt="PDF Icon" className="inline w-5 h-5" />
                            Download as PDF
                        </button>
                        <button
                            onClick={handleDownloadDOCX}
                            className="text-xs py-3 md:py-0 px-4 min-h-8 flex flex-col md:flex-row gap-1.5 items-center bg-black/5 text-black/80 hover:bg-black/10 cursor-pointer rounded-2xl"
                        >
                            <img src="/docxIcon.png" alt="Docx Icon" className="inline w-5 h-5" />
                            Download as DOCX
                        </button>
                    </div>
                    <p className="whitespace-pre-wrap text-justify text-black/80 text-sm max-w-[80vw] px-2 py-2">{sopResult}</p>
                </div>
            )}
        </div>
    );
}