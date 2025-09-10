import React, { useState } from "react";
import CVBuilderForm from "../components/CVBuilderForm";
import CVBuilderReviewStage from "../components/CVBuilderReviewStage";
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

export default function CVBuilderPage() {
    const [form, setForm] = useState({
        fullName: "",
        targetCountry: "",
        cvLength: "",
        style: "",
        email: "",
        phone: "",
        linkedin: "",
        location: "",
        workExperience: [],
        education: [],
        technicalSkills: "",
        softSkills: "",
        languagesKnown: [],
        skills: [],
        certificates: [],
        projects: [],
    });

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleNext = () => setStep(2);
    const handleEdit = () => setStep(1);

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            const payload = {
                workflow: "new",
                has_work_exp: form.workExperience ? "yes" : "no",
                full_name: form.fullName,
                target_country: form.targetCountry,
                cv_length: form.cvLength,
                style: form.style,
                email: form.email,
                phone: form.phone,
                linkedin: form.linkedin,
                location: form.location,
                work_experience: form.workExperience,
                education: form.education,
                skills: form.skills,
                certificates: form.certificates,
                projects: form.projects,
            };

            const response = await fetch(`${API_BASE_URL}/cv/download/pdf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "Failed to generate CV.");
            } else {
                setStep(3);
            }
        } catch (e) {
            setError("Network error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setError("");
        try {
            const payload = {
                workflow: "new",
                has_work_exp: form.workExperience ? "yes" : "no",
                full_name: form.fullName,
                target_country: form.targetCountry,
                cv_length: form.cvLength,
                style: form.style,
                email: form.email,
                phone: form.phone,
                linkedin: form.linkedin,
                location: form.location,
                work_experience: form.workExperience,
                education: form.education,
                skills: form.skills,
                certificates: form.certificates,
                projects: form.projects,
            };

            const response = await fetch(`${API_BASE_URL}/cv/download/pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.error || "Failed to download PDF.");
                return;
            }

            const blob = await response.blob();
            downloadFile(blob, "CV.pdf");
        } catch (e) {
            setError("Network error: " + e.message);
        }
    };

    const handleDownloadDOCX = async () => {
        setError("");
        try {
            const payload = {
                workflow: "new",
                has_work_exp: form.workExperience ? "yes" : "no",
                full_name: form.fullName,
                target_country: form.targetCountry,
                cv_length: form.cvLength,
                style: form.style,
                email: form.email,
                phone: form.phone,
                linkedin: form.linkedin,
                location: form.location,
                work_experience: form.workExperience,
                education: form.education,
                skills: form.skills,
                certificates: form.certificates,
                projects: form.projects,
            };

            const response = await fetch(`${API_BASE_URL}/cv/download/docx`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.error || "Failed to download DOCX.");
                return;
            }

            const blob = await response.blob();
            downloadFile(blob, "CV.docx");
        } catch (e) {
            setError("Network error: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="w-full px-8 py-4 fadeIn">
                <h1 className="text-3xl mb-2">CV Builder</h1>
                <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                    Building your winning CV, please wait...
                </p>
                <div className="flex flex-col gap-4 items-center justify-center py-32">
                    <Search className="text-orange-700" />
                    <p className="text-black/60 text-center text-md">Crafting the perfect CV for you. Just a sec!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {step === 1 && <CVBuilderForm form={form} setForm={setForm} onNext={handleNext} />}
            {step === 2 && <CVBuilderReviewStage form={form} onEdit={handleEdit} onSubmit={handleSubmit} />}
            {step === 3 && (
                <div className="flex flex-col px-8 py-4 fadeIn">
                    <div className="flex flex-col">
                        <h1 className="text-3xl mb-2">CV Builder</h1>
                        <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                            Your PATH to a winning CV!
                        </p>
                    </div>
                    {error && <p className="text-red-600 mb-4">{error}</p>}
                    <div className="w-full flex gap-4 mb-4">
                        <button
                            onClick={() => {
                                setStep(1);
                                setError("");
                            }}
                            className="text-xs py-3 md:py-0 flex flex-col md:flex-row gap-1.5 items-center px-4 min-h-8 text-black/80 bg-black/5 rounded-2xl hover:bg-black/10 cursor-pointer"
                        >
                            <WandSparkles className="inline w-5 h-5" />
                            Regenerate CV
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
                </div>
            )}
        </div>
    );
}