import React, { useState } from "react";
import CVBuilderForm from "../components/CVBuilderForm";
import CVBuilderReviewStage from "../components/CVBuilderReviewStage";
import { WandSparkles, Search, Download } from "lucide-react";
import { ClipLoader } from "react-spinners";
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
        firstName: "",
        lastName: "",
        targetCountry: "",
        targetCompany: "",
        targetRole: "",
        jobDescription: "",
        coverLetter: false,
        email: "",
        phone: "",
        location: "",
        workExperience: [],
        education: [],
        technicalSkills: [],
        languagesKnown: [],
        certificates: [],
        projects: [],
        links: [{ name: "LinkedIn", url: "" }],
        additionalSec: [],
    });

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isExistingCV, setIsExistingCV] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [file, setFile] = useState(null);
    const [loadingCover, setLoadingCover] = useState(false);
    const [loadingCV, setLoadingCV] = useState(false);
    const [errorCover, setErrorCover] = useState("");
    const [generatedCV, setGeneratedCV] = useState();
    const [formatOption, setFormatOption] = useState("");

    const handleNext = () => setStep(2);
    const handleEdit = () => setStep(1);

    // Function to determine workflow type
    const getWorkflowType = () => {
        return isExistingCV ? "existing" : "new";
    };

    // Function to prepare API payload
    const preparePayload = () => {
        const basePayload = {
            workflow: getWorkflowType(),
            has_work_exp: (form.workExperience && form.workExperience.length > 0) ? "yes" : "no",
            full_name: form.firstName + " " + form.lastName,
            email: form.email,
            phone: form.phone,
            location: form.location,
            work_experience: form.workExperience || [],
            education: form.education || [],
            links: form.links || [],
            skills: {
                technical_skills: form.technicalSkills || [],
            },
            languages_known: form.languagesKnown || [],
            certificates: form.certificates || [],
            projects: form.projects || [],
            additionalSec: form.additionalSec || [],
        };

        if (form.targetCountry) {
            basePayload.target_country = form.targetCountry;
        }

        if (form.targetCompany) {
            basePayload.target_company = form.targetCompany;
        }

        if (form.jobDescription) {
            basePayload.job_description = form.jobDescription;
        }

        if (form.targetRole) {
            basePayload.target_role = form.targetRole;
        }

        return basePayload;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            const payload = preparePayload();

            const response = await fetch(`${API_BASE_URL}/cv/download/docx`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let data = {};
                try {
                    data = await response.json();
                } catch (_) { }
                setError(data.error || "Something went wrong. Sorry, we couldn’t generate your CV right now. Please try again in sometime.");
            } else {
                const blob = await response.blob();
                setGeneratedCV(blob)
                setStep(3);
            }
        } catch (e) {
            setError("Network error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDOCX = async () => {
        setError("");
        setLoadingCV(true);
        downloadFile(generatedCV, "CV.docx");
        setLoadingCV(false);
    };

    const handleDownloadCoverLetter = async () => {
        setErrorCover("");
        setLoadingCover(true);

        try {
            const payload = preparePayload();

            const response = await fetch(`${API_BASE_URL}/cv/generate/coverLetter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorCover(errorData.error || "Failed to download cover letter.");
                return;
            }

            const blob = await response.blob();
            downloadFile(blob, "Cover_Letter.docx");
        } catch (e) {
            setErrorCover("Network error: " + e.message);
        } finally {
            setLoadingCover(false);
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
            {step === 1 && (
                <CVBuilderForm
                    form={form}
                    setForm={setForm}
                    onNext={handleNext}
                    setIsExistingCV={setIsExistingCV}
                    parsedData={parsedData}
                    setParsedData={setParsedData}
                    file={file}
                    setFile={setFile}
                    formatOption={formatOption}
                    setFormatOption={setFormatOption}
                />
            )}
            {step === 2 && (
                <CVBuilderReviewStage
                    form={form}
                    onEdit={handleEdit}
                    onSubmit={handleSubmit}
                    headerInc={true}
                />
            )}
            {step === 3 && (
                <div className="flex flex-col px-8 py-4 fadeIn">
                    <div className="flex flex-col">
                        <h1 className="text-3xl mb-2">CV Builder</h1>
                        <p className="w-full text-sm text-black/50 pb-4 mb-6 border-b border-black/10">
                            Your PATH to a winning CV!
                        </p>
                    </div>
                    {error ?
                        <p className="text-red-600 mb-4">Something went wrong. Please try again!</p> :
                        <div className="flex mb-4">
                            <div className="flex items-center px-4 py-3 md:py-0 min-h-8 bg-green-300/10 rounded-full fadeIn">
                                <p className="text-xs text-green-800">
                                    ✓ CV successfully generated!
                                </p>
                            </div>
                        </div>
                    }
                    <div className="px-2 mb-4 text-orange-900/80">
                        <p className="text-xs italic font-medium">We recommend using Microsoft Word for your CV, tailoring the generated CV with multiple versions, and incorporating role-specific keywords for the best results! </p>
                    </div>
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
                            onClick={handleDownloadDOCX}
                            disabled={loadingCV}
                            className="text-xs py-3 md:py-0 px-4 min-h-8 flex flex-col md:flex-row gap-1.5 items-center bg-black/5 text-black/80 hover:bg-black/10 cursor-pointer rounded-2xl"
                        >
                            {loadingCV ? (
                                <>
                                    <ClipLoader size={18} color="#666" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="inline w-5 h-5" />
                                    Download CV
                                </>
                            )}
                        </button>
                        {form.coverLetter &&
                            <button
                                onClick={handleDownloadCoverLetter}
                                disabled={loadingCover || !form.jobDescription}
                                className="text-xs py-3 md:py-0 px-4 min-h-8 flex flex-col md:flex-row gap-1.5 items-center bg-black/5 text-black/80 hover:bg-black/10 cursor-pointer rounded-2xl disabled:opacity-50"
                            >
                                {loadingCover ? (
                                    <>
                                        <ClipLoader size={18} color="#666" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="inline w-5 h-5" />
                                        Download Cover Letter
                                    </>
                                )}
                            </button>
                        }
                    </div>
                    <CVBuilderReviewStage
                        form={form}
                        onEdit={handleEdit}
                        onSubmit={handleSubmit}
                        headerInc={false}
                    />
                    <footer className="flex flex-col gap-1 text-black/60 text-xs italic border-t border-black/20 py-4 mt-6 px-2">
                        <p className="font-semibold ">AI-generated draft</p>
                        <p>
                            This CV is generated using AI based on the details you provided.
                            While we strive for accuracy, the draft may contain assumptions or inconsistencies.
                            Please review, edit, and personalise it before submitting.
                        </p>
                        <p>
                            For expert guidance, you can <a href="https://www.inforens.com/guides" target="_blank" className="text-orange-700 underline">connect with our mentors</a> for a final review or directly <a href="https://www.inforens.com/contact-us" target="_blank" className="text-orange-700 underline">contact us</a>!
                        </p>
                    </footer>
                </div>
            )}
        </div>
    );
}