import React, { useState, useRef, useEffect, useMemo } from "react";
import { askQuestion, sendFeedback } from "../data/api";
import {
    FaThumbsUp,
    FaThumbsDown,
    FaMicrophone,
    FaRegThumbsDown,
    FaRegThumbsUp,
    FaSquareFull,
} from "react-icons/fa";
import { Send, Copy, Check } from "lucide-react"; 

function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export default function AskNoriPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [micSupported, setMicSupported] = useState(true);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    const [copiedMessageIds, setCopiedMessageIds] = useState(new Set());

    const scrollerRef = useRef(null);
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef("");

    const sessionId = useMemo(() => {
        return (
            localStorage.getItem("sessionId") ||
            (localStorage.setItem("sessionId", uid()), localStorage.getItem("sessionId"))
        );
    }, []);
    const userId = localStorage.getItem("userId") || null;

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
                    const res = await fetch("/api/transcribe", { method: "POST", body: formData });
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

    // Copy handler that changes icon to tick for 3 seconds
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

    async function handleSend(e) {
        e.preventDefault();
        const question = input.trim();
        if (!question) return;

        setInput("");
        finalTranscriptRef.current = "";
        setMessages((prev) => [...prev, { id: uid(), role: "user", content: question }]);
        setLoading(true);

        try {
            const { answer, messageId } = await askQuestion(question, sessionId, userId);
            setMessages((prev) => [...prev, { id: messageId, role: "assistant", content: answer, feedback: {} }]);
        } catch {
            setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: "Sorry, something went wrong." }]);
        } finally {
            setLoading(false);
        }
    }

    const handleThumbsUp = async (id) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, feedback: { thumbsUp: true, thumbsDown: false } } : m))
        );
        await sendFeedback(id, true, false);
    };

    const handleThumbsDown = async (id) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, feedback: { thumbsUp: false, thumbsDown: true } } : m))
        );
        await sendFeedback(id, false, true);
    };

    return (
        <div
            className={`h-full w-full flex flex-col gap-6 py-4 px-8 md:px-24 items-center transition-all duration- fadeIn ${messages.length === 0 ? "justify-center pb-24 gap-8" : "justify-between"
                }`}
        >
            {messages.length === 0 ? (
                <h1 className="text-4xl md:text-5xl bg-clip-text bg-gradient-to-b from-orange-900 to-orange-400 text-transparent text-center font-medium tracking-tighter">
                    what would you like to know?
                </h1>
            ) : (
                <div
                    className="w-full max-h-[calc(100vh-224px)] overflow-y-auto flex flex-col flex-1 scrollable px-4 "
                    ref={scrollerRef}
                >
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`leading-6 text-sm fadeIn ${m.role === "user" ? "user-msg mt-8 mb-2 first:mt-0" : "assistant-msg text-black/70"}`}
                        >
                            <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, "<br/>") }} />
                            {m.role === "assistant" && (
                                <div className="flex mt-4">
                                    <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer" onClick={() => handleThumbsUp(m.id)}>
                                        {m.feedback?.thumbsUp ? (
                                            <FaThumbsUp size={14} className="thumb-icon text-orange-900/70" />
                                        ) : (
                                            <FaRegThumbsUp size={14} className="thumb-icon text-orange-900/70" />
                                        )}
                                    </div>
                                    <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer" onClick={() => handleThumbsDown(m.id)}>
                                        {m.feedback?.thumbsDown ? (
                                            <FaThumbsDown size={14} className="thumb-icon text-orange-900/70" />
                                        ) : (
                                            <FaRegThumbsDown size={14} className="thumb-icon text-orange-900/70" />
                                        )}
                                    </div>
                                    <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer" onClick={() => handleCopy(m.id, m.content)}>
                                        {copiedMessageIds.has(m.id) ? (
                                            <Check size={14} className="thumb-icon text-orange-900/70" />
                                        ) : (
                                            <Copy size={14} className="thumb-icon text-orange-900/70" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="text-sm fadeIn">
                            <div className="mt-3 px-1 flex h-3">
                                <div className="flex gap-2 loader">
                                    <div className="w-2 h-2 rounded-full bg-black/20"></div>
                                    <div className="w-2 h-2 rounded-full bg-black/15"></div>
                                    <div className="w-2 h-2 rounded-full bg-black/25"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <form className="w-full flex" onSubmit={handleSend}>
                <div className="w-full flex gap-2 items-center rounded-full px-3 py-2 border-gradient-animation bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500">
                    <div className="flex gap-1 w-full py-2 bg-white rounded-full px-4">
                        <input
                            className="w-full text-sm px-1 text-black/80"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                        />
                        <div className="flex items-center hover:bg-gray-100 justify-center p-2 rounded-full cursor-pointer">
                            <button className="text-sm" type="submit">
                                <Send className="text-orange-900/70 cursor-pointer" size={18} />
                            </button>
                        </div>
                        <div
                            className={`flex items-center justify-center p-2 rounded-full cursor-pointer ${listening || isRecording ? "bg-amber-600 hover:bg-amber-700" : "hover:bg-gray-100"
                                }`}
                        >
                            <button type="button" onClick={handleMicClick}>
                                {listening || isRecording ? (
                                    <FaSquareFull className="cursor-pointer text-white p-1" size={18} />
                                ) : (
                                    <FaMicrophone className={`cursor-pointer text-orange-900/70`} size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
