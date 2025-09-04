import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleStop, Mic, Send } from "lucide-react";
import { Copy, Check } from "lucide-react";
import FeaturesDropdown from "./FeaturesDropdown";
import { sopQuestions, sopOptions } from "../data/sopBuilderData";
import { API_BASE_URL } from "../data/api";

function uid() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
}

export default function SOPBuilderPanel({ onFeatureSelect }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Feedback states
    const [feedbackMessageId, setFeedbackMessageId] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");

    // Mic / recording states
    const [listening, setListening] = useState(false);
    const [micSupported, setMicSupported] = useState(true);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    // Copy states
    const [copiedMessageIds, setCopiedMessageIds] = useState(new Set());

    // SOP Builder states
    const [sopActive, setSopActive] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sopAnswers, setSopAnswers] = useState({});
    const [sopResult, setSopResult] = useState("");

    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const scrollerRef = useRef(null);

    const effectRan = useRef(false);

    // Scroll to bottom on messages change
    useEffect(() => {
        scrollerRef.current?.scrollTo(0, scrollerRef.current.scrollHeight);
    }, [messages, loading]);

    // Init speech recognition
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMicSupported(false);
            return;
        }
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if ("webkitSpeechRecognition" in window && (!isIOS || isSafari)) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => setListening(true);
            recognition.onresult = (event) => {
                let interimTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPiece = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscriptRef.current += transcriptPiece + " ";
                    } else {
                        interimTranscript += transcriptPiece;
                    }
                }
                setInput(finalTranscriptRef.current + interimTranscript);
            };
            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setListening(false);
            };
            recognition.onend = () => setListening(false);
            recognitionRef.current = recognition;
        } else {
            setMicSupported(false);
        }
    }, []);

    // Show first SOP question
    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;
        askSopQuestion(0);
    }, []);

    useEffect(() => {
        const container = document.querySelector(".chat-messages");
        function onOptionClick(e) {
            if (e.target.classList.contains("sop-option-btn")) {
                const selectedOption = e.target.getAttribute("data-option");
                if (sopActive) {
                    handleSopAnswer(selectedOption);
                    setInput("");
                }
            }
        }
        container?.addEventListener("click", onOptionClick);
        return () => container?.removeEventListener("click", onOptionClick);
    }, [sopActive, currentQuestionIndex]);

    /** ------ Q&A Flow ------ */
    const askSopQuestion = (index) => {
        if (index >= sopQuestions.length) {
            submitSopAnswers();
            return;
        }

        const q = sopQuestions[index];
        let qText = q.required ? `${q.label} (Required)` : `${q.label} (Optional)`;

        let opts = [];
        if (q.optionsKey) {
            opts = sopOptions[q.optionsKey] || [];
        }
        if (!q.required) opts.push("Skip");

        let optionsHtml = "";
        if (opts.length > 0) {
            optionsHtml =
                "<div>" +
                opts
                    .map(
                        (opt) =>
                            `<button class="sop-option-btn" data-option="${opt}" style="margin:4px;padding:4px 8px;border-radius:6px;border:1px solid #db5800;cursor:pointer;">${opt}</button>`
                    )
                    .join(" ") +
                "</div>";
        }

        setMessages((prev) => [
            ...prev,
            {
                id: uid(),
                role: "assistant",
                content: qText + (optionsHtml ? optionsHtml : ""),
                isSopQuestion: true,
                questionIndex: index,
                questionObj: q,
            },
        ]);
    };

    const handleSopAnswer = (answer) => {
        const q = sopQuestions[currentQuestionIndex];

        if (q.required && (!answer || answer.trim().length === 0)) {
            addAssistantMessage("Sorry, please provide a valid input.");
            return false;
        }
        if (q.optionsKey && !sopOptions[q.optionsKey].map(String).includes(String(answer)) && answer !== "Skip") {
            addAssistantMessage("Sorry, please select a valid option.");
            return false;
        }
        if (!(q.required === false && answer.toLowerCase() === "skip")) {
            setSopAnswers((prev) => ({
                ...prev,
                [q.name]: answer,
            }));
        }

        addUserMessage(answer);

        setCurrentQuestionIndex((i) => i + 1);
        askSopQuestion(currentQuestionIndex + 1);

        return true;
    };

    const downloadFile = (blob, filename) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleDownloadPDF = async () => {
        if (!sopResult) return;
        try {
            const response = await fetch(`${API_BASE_URL}/sop/download/pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sop: sopResult }),
            });
            if (!response.ok) throw await response.json();
            const blob = await response.blob();
            downloadFile(blob, "SOP.pdf");
        } catch (err) {
            alert("Failed to download PDF: " + (err.error || err.message));
        }
    };

    const handleDownloadDOCX = async () => {
        if (!sopResult) return;
        try {
            const response = await fetch(`${API_BASE_URL}/sop/download/docx`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sop: sopResult }),
            });
            if (!response.ok) throw await response.json();
            const blob = await response.blob();
            downloadFile(blob, "SOP.docx");
        } catch (err) {
            alert("Failed to download DOCX: " + (err.error || err.message));
        }
    };

    /** ------ Helpers ------ */
    const addAssistantMessage = (content) =>
        setMessages((prev) => [...prev, { id: uid(), role: "assistant", content }]);
    const addUserMessage = (content) =>
        setMessages((prev) => [...prev, { id: "user_" + uid(), role: "user", content }]);

    /** ------ Submit Answers ------ */
    const submitSopAnswers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/sop`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sopAnswers),
            });
            const data = await res.json();
            if (data?.sop) {
                setSopResult(data.sop);
            } else {
                addAssistantMessage("Sorry, could not generate SOP.");
            }
        } catch (e) {
            addAssistantMessage("Error generating SOP.");
        } finally {
            setLoading(false);
            setSopActive(false);
        }
    };

    /** ------ Input & Controls ------ */
    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Microphone not supported.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let mimeType = "audio/webm";
            if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";

            const recorder = new MediaRecorder(stream, { mimeType });
            let chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType });
                const formData = new FormData();
                formData.append("file", blob, "recording." + (mimeType === "audio/mp4" ? "mp4" : "webm"));
                try {
                    const res = await fetch(`${API_BASE_URL}/transcribe`, { method: "POST", body: formData });
                    const data = await res.json();
                    setInput(data.text || "");
                } catch (err) {
                    console.error("Transcription failed:", err);
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            alert("Cannot access microphone.");
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
    };

    const handleMicClick = () => {
        if (!micSupported) return alert("Mic not supported");
        if (recognitionRef.current) {
            if (!listening) recognitionRef.current.start();
            else recognitionRef.current.stop();
        } else {
            if (!isRecording) startRecording();
            else stopRecording();
        }
    };

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedMessageIds((p) => new Set(p).add(id));
            setTimeout(() => {
                setCopiedMessageIds((p) => {
                    const next = new Set(p);
                    next.delete(id);
                    return next;
                });
            }, 2000);
        });
    };

    async function onSend(e) {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;

        if (sopActive) {
            const handled = handleSopAnswer(trimmed);
            if (!handled) return;
            setInput("");
        }
    }

    return (
        <>
            <div className="text-black/80 text-sm font-semibold p-4 pb-3 border-b border-gray-200 text-center fadeIn">
                SOP Builder
            </div>

            <div className="chat-messages flex-1 overflow-y-auto px-3" ref={scrollerRef}>
                {messages.map((m) => (
                    <motion.div
                        key={m.id}
                        className={`text-sm px-3 py-2 rounded-2xl fadeIn ${m.role === "user" ? "user-msg-bot" : "assistant-msg-bot"
                            }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, "<br/>") }} />
                        {m.role === "assistant" && (
                            <div className="flex mt-2 gap-1">
                                <div onClick={() => handleCopy(m.id, m.content)}>
                                    {copiedMessageIds.has(m.id) ? (
                                        <Check size={14} className="text-green-600" />
                                    ) : (
                                        <Copy size={14} className="text-black/70" />
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
                {loading && <div className="assistant-msg-bot rounded-2xl px-3 py-2 text-sm">Generating SOP...</div>}
                {!loading && sopResult && (
                    <div className="assistant-msg-bot rounded-2xl px-3 py-2 text-sm">
                        Please download your SOP using the buttons below!
                        <div className="flex flex-col gap-2 justify-center my-4">
                            <button
                                onClick={handleDownloadPDF}
                                className="text-xs py-2 min-h-8 flex flex-col gap-1.5 items-center bg-black/5 text-black/80 hover:bg-black/10 cursor-pointer rounded-2xl"
                            >
                                <img src="/pdfIcon.png" alt="PDF Icon" className="inline w-5 h-5" />
                                Download as PDF
                            </button>
                            <button
                                onClick={handleDownloadDOCX}
                                className="text-xs py-2 min-h-8 flex flex-col gap-1.5 items-center bg-black/5 text-black/80 hover:bg-black/10 cursor-pointer rounded-2xl"
                            >
                                <img src="/docxIcon.png" alt="Docx Icon" className="inline w-5 h-5" />
                                Download as DOCX
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input section */}
            <form className="w-full flex flex-col px-4 my-2 mb-4" onSubmit={onSend}>
                <div className="w-full flex gap-2 items-center rounded-full px-3 py-2 border-gradient-animation bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500">
                    <div className="flex items-center bg-white rounded-full gap-2 pr-3">
                        <input
                            className="w-full flex-1 text-sm outline-none border-none px-3 py-2"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={sopActive ? "Answer the questions..." : "SOP generated!"}
                            disabled={loading}
                            autoFocus
                        />
                        <button type="submit" className="send-btn cursor-pointer" aria-label="send" disabled={loading}>
                            <Send size={18} />
                        </button>
                        <button
                            type="button"
                            className={`mic-btn cursor-pointer ${listening || isRecording ? "listening" : ""}`}
                            onClick={handleMicClick}
                            aria-label="microphone"
                        >
                            {listening || isRecording ? <CircleStop size={18} /> : <Mic size={18} />}
                        </button>
                        <FeaturesDropdown onFeatureSelect={onFeatureSelect} />
                    </div>
                </div>
            </form>
        </>
    );
}