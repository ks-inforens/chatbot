import React from "react";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "./ui/sheet";
import AnimationBall from "./VoiceBall"

export default function VoiceFormSheet({
    onStart,
    onStop,
    isActive,
    isListening,
    isSpeaking,
    isProcessing,
    currentIndex,
    questions,
    interimTranscript,
    finalTranscript,
    logs,
}) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="text-xs py-2 px-3 rounded-full bg-black/5 hover:bg-black/10 text-black/80"
                >
                    🎤 Fill using voice
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full max-w-md p-4 bg-white z-[9999]">
                <SheetHeader>
                    <SheetTitle className="text-center">Voice Assistant</SheetTitle>
                    <SheetClose className="absolute top-4 right-4" />
                </SheetHeader>

                {/* Your form content here */}
                <div className="text-sm text-black/70 text-center">
                    {questions && questions[currentIndex] ? (
                        <>
                            <div className="mb-1">Current question:</div>
                            <div className="font-medium">{questions[currentIndex].prompt}</div>
                        </>
                    ) : (
                        <div>No active question.</div>
                    )}
                </div>

                <div className="mt-3 flex justify-center">
                    <AnimationBall
                        isListening={isListening}
                        isSpeaking={isSpeaking}
                        isActive={isActive}
                        onStart={onStart}
                        onStop={onStop}
                    />
                </div>

                {(interimTranscript || finalTranscript) && (
                    <div className="mt-3 rounded-md border border-black/10 p-3 bg-white text-sm">
                        <div className="text-black/50 text-xs mb-1">Heard</div>
                        <div className="font-medium min-h-6">
                            {finalTranscript || <span className="text-black/40">{interimTranscript}</span>}
                        </div>
                    </div>
                )}

                {!!logs?.length && (
                    <div className="mt-3 max-h-40 overflow-auto border-t border-black/10 pt-2 text-xs text-black/60">
                        {logs.slice(-20).map((l) => (
                            <div key={l.t}>{l.entry}</div>
                        ))}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}