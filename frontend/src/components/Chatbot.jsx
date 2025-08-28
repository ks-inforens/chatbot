import React, { useEffect, useMemo, useRef, useState } from "react";
import { askQuestion } from "./api";
import { motion, AnimatePresence } from "framer-motion";
import nori from "./nori.png";
import { CircleStop, Mic, Send } from "lucide-react";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaRegThumbsUp,
} from "react-icons/fa";
import { Copy, Check } from "lucide-react"; 
import FeaturesDropdown from "./FeaturesDropdown";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const [copiedMessageIds, setCopiedMessageIds] = useState(new Set());

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const scrollerRef = useRef(null);

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

  // Copy handler that toggles tick icon for 3 seconds
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
    const q = input.trim();
    if (!q) return;

    setInput("");
    finalTranscriptRef.current = "";
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: q }]);
    setLoading(true);

    try {
      const { answer, messageId } = await askQuestion(q, sessionId, userId);
      setMessages((prev) => [
        ...prev,
        { id: messageId, role: "assistant", content: answer, feedback: {} },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: "Sorry, something went wrong." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleThumbsUp(messageId) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: { thumbsUp: true, thumbsDown: false } } : m
      )
    );
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, thumbsUp: true, thumbsDown: false, feedback: "" }),
    });
  }

  function handleThumbsDown(messageId) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: { thumbsUp: false, thumbsDown: true } } : m
      )
    );
    setFeedbackMessageId(messageId);
    setFeedbackText("");
  }

  async function submitFeedback() {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: feedbackMessageId,
        thumbsUp: false,
        thumbsDown: true,
        feedback: feedbackText,
      }),
    });
    setFeedbackMessageId(null);
  }

  return (
    <div>
      <div aria-label="nori-container" className="fixed right-8 bottom-8 flex flex-col items-end gap-2 z-[999]">
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col overflow-hidden z-999 bg-white min-h-132 max-h-132 max-w-80 rounded-xl inset-shadow-sm shadow-lg"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              {messages.length === 0 && (
                <div className="flex items-center px-4 justify-center z-10 text-center min-h-96">
                  <p className="text-gray-500 tracking-tight text-sm">
                    Hey there! I’m Nori.<br />
                    <strong>Got questions? I’ve got answers.</strong>
                    <br />
                    Ask me anything about studying abroad!
                  </p>
                </div>
              )}

              <div className="chat-messages" ref={scrollerRef}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    className={`text-sm px-3 py-2 rounded-2xl fadeIn ${m.role === "user" ? "user-msg-bot" : "assistant-msg-bot"
                      }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, "<br/>") }} />
                    {m.role === "assistant" && (
                      <div className="flex mt-2 gap-1">
                        <div className="p-1 rounded-full cursor-pointer" onClick={() => handleThumbsUp(m.id)}>
                          {m.feedback?.thumbsUp ? (
                            <FaThumbsUp className="thumb-icon text-black/70" size={14} />
                          ) : (
                            <FaRegThumbsUp className="thumb-icon text-black/70" size={14} />
                          )}
                        </div>
                        <div className="p-1 rounded-full cursor-pointer" onClick={() => handleThumbsDown(m.id)}>
                          {m.feedback?.thumbsDown ? (
                            <FaThumbsDown className="thumb-icon text-black/70" size={14} />
                          ) : (
                            <FaRegThumbsDown className="thumb-icon text-black/70" size={14} />
                          )}
                        </div>
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
                ))}
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

              {feedbackMessageId && (
                <div className="w-full flex flex-col gap-2 text-sm shadow-lg inset-shadow-xs rounded-2xl p-4 fadeIn">
                  <p>Please tell us how we can improve?</p>
                  <textarea
                    className="outline-0 text-black/70"
                    placeholder="Type your feedback..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer" onClick={() => setFeedbackMessageId(null)}>
                      Cancel
                    </button>
                    <button className="px-3 py-1 rounded-full text-white bg-[#db5800] hover:bg-[#c04d00] cursor-pointer" onClick={submitFeedback}>
                      Submit
                    </button>
                  </div>
                </div>
              )}

              <form className="w-full flex flex-col px-4 my-2 mb-4" onSubmit={onSend}>
                <div className="w-full flex gap-2 items-center rounded-full px-3 py-2 border-gradient-animation bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500">
                  <div className="flex items-center bg-white rounded-full gap-2 pr-3">
                    <input
                      className="w-full flex-1 text-sm outline-none border-none px-3 py-2"
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your question"
                    />
                    <button type="submit" className="send-btn cursor-pointer" aria-label="send">
                      <Send size={18} />
                    </button>
                    <button
                      type="button"
                      className={`mic-btn cursor-pointer ${listening || isRecording ? "listening" : ""}`}
                      onClick={handleMicClick}
                      title={listening || isRecording ? "Stop Listening" : "Speak"}
                      aria-label="microphone"
                    >
                      {listening || isRecording ? <CircleStop size={18} /> : <Mic size={18} color={listening || isRecording ? "#FF5722" : "#333"} />}
                    </button>
                    <FeaturesDropdown />
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {!open && (
          <motion.div
            className="bg-[#db5800] text-white right-full bottom-full mb-2 tracking-tight leading-tight text-right px-6 py-3 rounded-xl max-w-sm shadow-lg cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            onClick={() => setOpen(true)}
          >
            Hi, I'm Nori, your personal AI assistant. <br /> Ask me something about studying abroad.
          </motion.div>
        )}

        <motion.img
          src={nori}
          alt="Nori"
          className="nori-icon w-18 h-18 cursor-pointer rounded-full relative"
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.9 }}
        />
      </div>
    </div>
  );
}
