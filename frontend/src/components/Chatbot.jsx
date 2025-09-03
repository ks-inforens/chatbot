import React, { useEffect, useMemo, useRef, useState } from "react";
import { askQuestion } from "../data/api";
import { motion, AnimatePresence } from "framer-motion";
import { CircleStop, Mic, Send } from "lucide-react";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaRegThumbsUp,
} from "react-icons/fa";
import { Copy, Check } from "lucide-react";
import FeaturesDropdown from "./FeaturesDropdown";
import { questions, options } from "../data/scholarshipFinderData";

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
  const [scholarshipActive, setScholarshipActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scholarshipAnswers, setScholarshipAnswers] = useState({});

  // Active feature state
  const [activeFeature, setActiveFeature] = useState("Ask Nori");

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

  // Intro message visibility
  const [showIntro, setShowIntro] = useState(true);

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
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 5000);
    return () => clearTimeout(timer);
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

  const handleFeatureSelect = (featureTitle) => {
    setActiveFeature(featureTitle);
    setMessages([]);
    setInput("");
    setLoading(false);

    setScholarshipActive(false);
    setCurrentQuestionIndex(0);
    setScholarshipAnswers({});

    if (featureTitle === "Scholarship Finder") {
      setScholarshipActive(true);
      setOpen(true);
      askScholarshipQuestion(0);
    } else if (featureTitle === "Ask Nori") {
      setOpen(true);
    }
  };

  // Map frontend question names to backend API expected keys
  const questionToApiFieldMap = {
    citizenship: "citizenship",
    preferred_country: "preferred_country",
    level: "level",
    field: "field",
    academic_perf: "academic_perf",
    disability: "disability",
    preferred_universities: "preferred_universities",
    course_intake: "course_intake",
    age: "age",
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
      },
    ]);
  };

  // Handle user answer in scholarship flow with key mapping and validation
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

  // Add assistant message helper
  const addAssistantMessage = (content) => {
    setMessages((prev) => [...prev, { id: uid(), role: "assistant", content }]);
  };

  // Add user message helper
  const addUserMessage = (content) => {
    setMessages((prev) => [...prev, { id: "user_" + uid(), role: "user", content }]);
  };

  // Submit scholarship answers to backend API with required keys only
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
      age: scholarshipAnswers["age"] || "",
      gender: scholarshipAnswers["gender"] || "",
      extracurricular: scholarshipAnswers["extracurricular"] || ""
    };

    try {
      const res = await fetch("/api/scholarships", {
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

  // Main send handler for user input
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

    setInput("");
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: trimmedInput }]);
    setLoading(true);

    try {
      const { answer, messageId } = await askQuestion(trimmedInput, sessionId, userId);
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

  // Event listener for option button clicks inside chat to handle scholarship options
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

  // Feedback handlers (unchanged)
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
      <div aria-label="nori-container" className="fixed right-4 bottom-4 md:right-8 md:bottom-8 flex flex-col items-end gap-2 z-[999]">
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col overflow-hidden z-999 bg-white min-h-132 max-h-132 max-w-80 rounded-xl inset-shadow-sm shadow-lg"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Headers */}
              {activeFeature === "Ask Nori" && (
                <div className="text-black/80 text-sm font-semibold p-4 pb-3 border-b border-gray-200 text-center fadeIn">
                  Ask Nori
                </div>
              )}
              {activeFeature === "Scholarship Finder" && (
                <div className="text-black/80 text-sm font-semibold p-4 pb-3 border-b border-gray-200 text-center fadeIn">
                  Scholarship Finder
                </div>
              )}
              {activeFeature === "CV Builder" && (
                <div className="bg-gray-400 text-white font-bold p-4 rounded-t-xl text-center relative">
                  CV Builder
                </div>
              )}
              {activeFeature === "SOP Builder" && (
                <div className="bg-gray-400 text-white font-bold p-4 rounded-t-xl text-center relative">
                  SOP Builder
                </div>
              )}

              {/* Content */}
              {(activeFeature === "CV Builder" || activeFeature === "SOP Builder") && (
                <div className="flex-grow flex justify-center items-center p-6 text-gray-600 font-medium">
                  This feature is currently locked and coming soon.
                </div>
              )}

              {(activeFeature === "Ask Nori" || activeFeature === "Scholarship Finder") && (
                <>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center px-4 justify-center z-10 text-center min-h-96">
                      <p className="text-gray-500 tracking-tight text-sm">
                        Hey there! I’m Nori! 
                      </p>
                      <p className="text-gray-500 font-medium tracking-tight text-sm">
                        Got questions? I’ve got answers.
                      </p>
                      <p className="text-gray-500 tracking-tight text-sm">
                        Ask me anything about studying abroad!
                      </p>
                    </div>

                  )}

                  <div className="chat-messages flex-1 overflow-y-auto px-3" ref={scrollerRef}>
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

                  {/* Input form */}
                  <form className="w-full flex flex-col px-4 my-2 mb-4" onSubmit={onSend}>
                    <div className="w-full flex gap-2 items-center rounded-full px-3 py-2 border-gradient-animation bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500">
                      <div className="flex items-center bg-white rounded-full gap-2 pr-3">
                        <input
                          className="w-full flex-1 text-sm outline-none border-none px-3 py-2"
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={scholarshipActive ? "Answer the questions..." : "Ask anything..."}
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
                          title={listening || isRecording ? "Stop Listening" : "Speak"}
                          aria-label="microphone"
                        >
                          {listening || isRecording ? (
                            <CircleStop size={18} />
                          ) : (
                            <Mic size={18} color={listening || isRecording ? "#FF5722" : "#333"} />
                          )}
                        </button>
                        <FeaturesDropdown onFeatureSelect={handleFeatureSelect} />
                      </div>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!open && showIntro && (
            <motion.div
              className="bg-[#db5800] text-white text-sm md:text-base right-full bottom-full mb-2 tracking-tight leading-tight text-right px-6 py-3 rounded-xl max-w-sm shadow-lg cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              onClick={() => setOpen(true)}
            >
              Hi, I'm Nori, your personal AI assistant. <br /> Ask me something about studying abroad.
            </motion.div>
          )}
        </AnimatePresence>

        <motion.img
          src="/nori.png"
          alt="Nori"
          className="nori-icon w-14 h-14 md:w-18 md:h-18 cursor-pointer rounded-full relative"
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.9 }}
        />
      </div>
    </div>
  );
}