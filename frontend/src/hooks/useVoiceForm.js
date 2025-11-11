import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Web Speech API voice-driven form controller.
// Orchestrates: TTS prompt -> ASR listening -> zod validation -> form autofill -> next.
// Designed to be easily swappable with cloud ASR/TTS by replacing speak() and listen().

export function useVoiceForm({
    form,
    setForm,
    buildSchema,
    parsedData,
    formatOption,
    questionsBuilder,
}) {
    const [isActive, setIsActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [finalTranscript, setFinalTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [logs, setLogs] = useState([]);

    const recognitionRef = useRef(null);
    const abortedRef = useRef(false);
    const ttsUtteranceRef = useRef(null);

    // Build questions based on current form/context. The builder can add conditional questions.
    const questions = useMemo(() => {
        try {
            return questionsBuilder({ form, parsedData, formatOption });
        } catch (e) {
            return [];
        }
    }, [form, parsedData, formatOption, questionsBuilder]);

    const appendLog = useCallback((entry) => {
        setLogs(prev => [...prev, { t: Date.now(), entry }]);
    }, []);

    // Text-to-speech using Web Speech API
    const speak = useCallback((text) => {
        return new Promise((resolve, reject) => {
            try {
                if (!("speechSynthesis" in window)) {
                    appendLog("TTS not supported in this browser.");
                    resolve();
                    return;
                }
                if (ttsUtteranceRef.current) {
                    window.speechSynthesis.cancel();
                }
                const utterance = new SpeechSynthesisUtterance(text);
                ttsUtteranceRef.current = utterance;
                setIsSpeaking(true);
                utterance.onend = () => {
                    setIsSpeaking(false);
                    resolve();
                };
                utterance.onerror = (e) => {
                    setIsSpeaking(false);
                    appendLog(`TTS error: ${e.error || "unknown"}`);
                    resolve();
                };
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                setIsSpeaking(false);
                appendLog(`TTS exception: ${e.message}`);
                resolve();
            }
        });
    }, [appendLog]);

    // Automatic speech recognition using Web Speech API
    const listen = useCallback(() => {
        return new Promise((resolve) => {
            try {
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR) {
                    appendLog("SpeechRecognition not supported in this browser.");
                    resolve("");
                    return;
                }
                const recognition = new SR();
                recognitionRef.current = recognition;
                recognition.lang = "en-US";
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                // Local buffers prevent stale-closure issues with React state
                let localInterim = "";
                let localFinal = "";

                setIsListening(true);
                setInterimTranscript("");
                setFinalTranscript("");

                recognition.onresult = (event) => {
                    localInterim = "";
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) localFinal += transcript;
                        else localInterim += transcript;
                    }
                    if (localInterim) setInterimTranscript(localInterim);
                    if (localFinal) setFinalTranscript(localFinal);
                };

                recognition.onerror = (e) => {
                    setIsListening(false);
                    appendLog(`ASR error: ${e.error || "unknown"}`);
                    resolve("");
                };

                recognition.onend = () => {
                    setIsListening(false);
                    resolve(localFinal || localInterim);
                };

                recognition.start();
            } catch (e) {
                setIsListening(false);
                appendLog(`ASR exception: ${e.message}`);
                resolve("");
            }
        });
    }, [appendLog]);

    const stopAll = useCallback(() => {
        abortedRef.current = true;
        setIsActive(false);
        try {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.stop();
            }
        } catch {}
        try {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        } catch {}
        setIsListening(false);
        setIsSpeaking(false);
        setIsProcessing(false);
    }, []);

    useEffect(() => {
        return () => stopAll();
    }, [stopAll]);

    const validateField = useCallback((name, value) => {
        // Build a tentative form and validate against the full schema; only consider errors for the target path
        try {
            const schema = buildSchema({ parsedData, formatOption });
            const tentative = { ...form, [name]: value };
            const result = schema.safeParse(tentative);
            if (result.success) return { valid: true };
            const issues = result.error.issues || [];
            const pathStr = Array.isArray(name) ? name.join(".") : name;
            const related = issues.filter(i => i.path.join(".") === pathStr);
            if (related.length === 0) return { valid: true };
            return { valid: false, message: related[0].message || "Invalid value" };
        } catch (e) {
            return { valid: true };
        }
    }, [buildSchema, form, parsedData, formatOption]);

    const normalizeAnswer = useCallback((answerRaw) => {
        if (!answerRaw) return "";
        const text = String(answerRaw).trim();
        // Basic cleanup; extend for numbers/dates as needed
        return text;
    }, []);

    const askOne = useCallback(async (q) => {
        // Compose prompt with required/optional guidance
        const optionalHint = q.required ? " This question is required." : " You may say 'Skip' to skip this question.";
        const prompt = `${q.prompt}${optionalHint}`;

        // Keep retrying until valid (or skipped when not required)
        // Protect against external abort
        while (!abortedRef.current) {
            await speak(prompt);
            const heard = await listen();
            if (abortedRef.current) return { done: false };

            const text = normalizeAnswer(heard);
            appendLog(`Heard: ${text || "(empty)"}`);

            if (!q.required && /^(skip|skip it|pass)$/i.test(text)) {
                // Skip optional
                setIsProcessing(true);
                setForm(prev => ({ ...prev, [q.name]: q.onSkipValue ?? (typeof prev[q.name] === "string" ? "" : prev[q.name]) }));
                setIsProcessing(false);
                return { done: true };
            }

            if (!text) {
                await speak("Sorry, I didn't catch that. Please repeat your answer.");
                continue;
            }

            // Allow custom parser e.g., to coerce dates/numbers
            const value = q.parse ? q.parse(text) : text;
            setIsProcessing(true);
            const v = validateField(q.name, value);
            setIsProcessing(false);
            if (!v.valid) {
                await speak("Sorry, your response was not valid, please can you reiterate your answer?");
                if (v.message) appendLog(`Validation: ${v.message}`);
                continue;
            }

            setForm(prev => ({ ...prev, [q.name]: value }));
            await speak("Got it");
            return { done: true };
        }
        return { done: false };
    }, [appendLog, listen, normalizeAnswer, setForm, speak, validateField]);

    const start = useCallback(async () => {
        if (!questions || questions.length === 0) return;
        setLogs([]);
        abortedRef.current = false;
        setIsActive(true);
        setCurrentIndex(0);
        setError("");

        for (let i = 0; i < questions.length; i++) {
            if (abortedRef.current) break;
            setCurrentIndex(i);
            const q = questions[i];
            const res = await askOne(q);
            if (!res.done) break;
        }

        setIsActive(false);
        if (!abortedRef.current) await speak("Voice capture complete.");
    }, [askOne, questions, speak]);

    return {
        // state
        isActive,
        isSpeaking,
        isListening,
        isProcessing,
        error,
        currentIndex,
        finalTranscript,
        interimTranscript,
        logs,
        questions,
        // controls
        start,
        stop: stopAll,
    };
}


