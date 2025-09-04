import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleStop, Mic, Send } from "lucide-react";
import { Copy, Check } from "lucide-react";
import FeaturesDropdown from "./FeaturesDropdown";
import { questions, options } from "../data/scholarshipFinderData";
import { API_BASE_URL } from "../data/api";

function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export default function ScholarshipFinderPanel({ onFeatureSelect }) {
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

    // Scholarship finder states
    const [scholarshipActive, setScholarshipActive] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scholarshipAnswers, setScholarshipAnswers] = useState({});

    // Date selection state for DOB input
    const [selectedDate, setSelectedDate] = useState("");

    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const scrollerRef = useRef(null);

    const effectRan = useRef(false);

    useEffect(() => {
        scrollerRef.current?.scrollTo(0, scrollerRef.current.scrollHeight);
    }, [messages, loading]);

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

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;
        askScholarshipQuestion(0);
    }, []);

    useEffect(() => {
        const container = document.querySelector(".chat-messages");

        function onOptionClick(e) {
            if (e.target.classList.contains("scholarship-option-btn")) {
                const selectedOption = e.target.getAttribute("data-option");
                if (scholarshipActive) {
                    handleScholarshipAnswer(selectedOption);
                    setInput("");
                }
            }
        }

        container?.addEventListener("click", onOptionClick);
        return () => {
            container?.removeEventListener("click", onOptionClick);
        };
    }, [scholarshipActive, currentQuestionIndex]);

    const questionToApiFieldMap = {
        citizenship: "citizenship",
        preferred_country: "preferred_country",
        level: "level",
        field: "field",
        academic_perf: "academic_perf",
        disability: "disability",
        preferred_universities: "preferred_universities",
        course_intake: "course_intake",
        dob: "dob",
        gender: "gender",
        extracurricular: "extracurricular",
    };

    const askScholarshipQuestion = (index) => {
        if (index >= questions.length) {
            submitScholarshipAnswers();
            return;
        }

        const questionObj = questions[index];

        const questionText = questionObj.required
            ? `${questionObj.question} (Required)`
            : `${questionObj.question} (Optional)`;

        let opts = [];
        if (questionObj.optionsKey) {
            opts = options[questionObj.optionsKey] || [];
        }

        if (!questionObj.required) {
            opts = [...opts, "Skip"];
        }

        let optionsHtml = "";
        if (opts.length > 0) {
            optionsHtml =
                "<div>" +
                opts
                    .map(
                        (opt) =>
                            `<button class="scholarship-option-btn" data-option="${opt}" style="margin: 4px; padding: 4px 8px; border-radius: 6px; border: 1px solid #db5800; cursor: pointer;">${opt}</button>`
                    )
                    .join(" ") +
                "</div>";
        }

        setMessages((prev) => [
            ...prev,
            {
                id: uid(),
                role: "assistant",
                content: questionText + (optionsHtml ? optionsHtml : ""),
                isScholarshipQuestion: true,
                questionIndex: index,
                questionObj,
            },
        ]);
    };

    const handleScholarshipAnswer = (answer) => {
        const questionObj = questions[currentQuestionIndex];
        const apiField = questionToApiFieldMap[questionObj.name] || questionObj.name;

        if (questionObj.required) {
            if (!answer || answer.trim().length === 0) {
                addAssistantMessage("Sorry, please provide a valid input.");
                return false;
            }
            if (questionObj.optionsKey) {
                if (!options[questionObj.optionsKey].includes(answer)) {
                    addAssistantMessage("Sorry, please select a valid option.");
                    return false;
                }
            }
        }

        if (!questionObj.required && (answer.toLowerCase() === "skip" || answer === "")) {
            // skip storing
        } else {
            setScholarshipAnswers((prev) => ({
                ...prev,
                [apiField]: answer,
            }));
        }

        addUserMessage(answer);

        setCurrentQuestionIndex((prev) => prev + 1);
        askScholarshipQuestion(currentQuestionIndex + 1);

        return true;
    };

    const addAssistantMessage = (content) => {
        setMessages((prev) => [...prev, { id: uid(), role: "assistant", content }]);
    };

    const addUserMessage = (content) => {
        setMessages((prev) => [...prev, { id: "user_" + uid(), role: "user", content }]);
    };

    const submitScholarshipAnswers = async () => {
        setLoading(true);

        const submissionData = {
            citizenship: scholarshipAnswers["citizenship"] || "",
            preferred_country: scholarshipAnswers["preferred_country"] || "",
            level: scholarshipAnswers["level"] || "",
            field: scholarshipAnswers["field"] || "",
            academic_perf: scholarshipAnswers["academic_perf"] || "",
            disability: scholarshipAnswers["disability"] || "",
            preferred_universities: scholarshipAnswers["preferred_universities"] || "",
            course_intake: scholarshipAnswers["course_intake"] || "",
            dob: scholarshipAnswers["dob"] || "",
            gender: scholarshipAnswers["gender"] || "",
            extracurricular: scholarshipAnswers["extracurricular"] || "",
        };

        try {
            const res = await fetch(`${API_BASE_URL}/scholarships`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });
            const data = await res.json();

            if (data.scholarships && data.scholarships.length > 0) {
                const formatted = data.scholarships
                    .map((sch, idx) => `<b>${idx + 1}. ${sch.name}</b>\n${sch.description}`)
                    .join("\n\n");
                addAssistantMessage(formatted);
            } else {
                addAssistantMessage("Sorry, no scholarships found matching your criteria.");
            }
        } catch (error) {
            addAssistantMessage("Sorry, something went wrong processing your request.");
        } finally {
            setLoading(false);
            setScholarshipActive(false);
        }
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone not supported in this browser.");
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
                formData.append(
                    "file",
                    blob,
                    "recording." + (mimeType === "audio/mp4" ? "mp4" : "webm")
                );

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
            console.error("Mic access failed:", err);
            alert("Cannot access microphone. Check browser permissions.");
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
    };

    const handleMicClick = () => {
        if (!micSupported) {
            alert("Microphone not supported in this browser. Please use Safari/Chrome/Edge.");
            return;
        }

        if (recognitionRef.current) {
            if (!listening) recognitionRef.current.start();
            else recognitionRef.current.stop();
        } else {
            if (!isRecording) startRecording();
            else stopRecording();
        }
    };

    const handleCopy = (id, text) => {
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    setCopiedMessageIds((prev) => new Set(prev).add(id));
                    setTimeout(() => {
                        setCopiedMessageIds((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(id);
                            return newSet;
                        });
                    }, 3000);
                })
                .catch((err) => {
                    console.error("Failed to copy:", err);
                });
        }
    };

    async function onSend(e) {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        if (scholarshipActive) {
            const handled = handleScholarshipAnswer(trimmedInput);
            if (!handled) return;
            setInput("");
            return;
        }
    }

    return (
        <>
            <div className="text-black/80 text-sm font-semibold p-4 pb-3 border-b border-gray-200 text-center fadeIn">
                Scholarship Finder
            </div>

            <div className="chat-messages flex-1 overflow-y-auto px-3" ref={scrollerRef}>
                {messages.map((m) => {
                    if (
                        m.role === "assistant" &&
                        m.isScholarshipQuestion &&
                        m.questionObj?.name === "dob"
                    ) {
                        return (
                            <motion.div
                                key={m.id}
                                className="assistant-msg-bot px-3 py-2 rounded-2xl fadeIn text-sm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: m.content.replace(/\n/g, "<br/>"),
                                    }}
                                />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const isoDate = e.target.value;
                                        setSelectedDate(isoDate);
                                        handleScholarshipAnswer(isoDate);
                                        setSelectedDate("");
                                    }}
                                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                                        .toISOString()
                                        .split("T")[0]}
                                    className="mx-1 p-1 border border-orange-600/70 rounded-md text-sm w-full"
                                    placeholder="Select your date of birth"
                                />
                            </motion.div>
                        );
                    }

                    return (
                        <motion.div
                            key={m.id}
                            className={`text-sm px-3 py-2 rounded-2xl fadeIn ${m.role === "user" ? "user-msg-bot" : "assistant-msg-bot"
                                }`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div
                                dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, "<br/>") }}
                            />
                            {m.role === "assistant" && (
                                <div className="flex mt-2 gap-1">
                                    <div
                                        className="p-1 rounded-full cursor-pointer"
                                        onClick={() => handleCopy(m.id, m.content)}
                                        title="Copy message"
                                    >
                                        {copiedMessageIds.has(m.id) ? (
                                            <Check className="thumb-icon text-green-600" size={14} />
                                        ) : (
                                            <Copy className="thumb-icon text-black/70" size={14} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {loading && (
                    <div className="assistant-msg-bot px-3 py-2 rounded-2xl fadeIn text-sm">
                        <div className="mt-1 flex h-3">
                            <div className="flex gap-2 loader">
                                <div className="w-2 h-2 rounded-full bg-black/20"></div>
                                <div className="w-2 h-2 rounded-full bg-black/15"></div>
                                <div className="w-2 h-2 rounded-full bg-black/25"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <form className="w-full flex flex-col px-4 my-2 mb-4" onSubmit={onSend}>
                <div className="w-full flex gap-2 items-center rounded-full px-3 py-2 border-gradient-animation bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500">
                    <div className="flex items-center bg-white rounded-full gap-2 pr-3">
                        <input
                            className="w-full flex-1 text-sm outline-none border-none px-3 py-2"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Answer the questions..."
                            disabled={loading}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="send-btn cursor-pointer"
                            aria-label="send"
                            disabled={loading}
                        >
                            <Send size={18} />
                        </button>
                        <button
                            type="button"
                            className={`mic-btn cursor-pointer ${listening || isRecording ? "listening" : ""}`}
                            onClick={handleMicClick}
                            title={listening || isRecording ? "Stop Listening" : "Speak"}
                            aria-label="microphone"
                        >
                            {listening || isRecording ? (
                                <CircleStop size={18} />
                            ) : (
                                <Mic size={18} color={listening || isRecording ? "#FF5722" : "#333"} />
                            )}
                        </button>
                        <FeaturesDropdown onFeatureSelect={onFeatureSelect} />
                    </div>
                </div>
            </form>
        </>
    );
}