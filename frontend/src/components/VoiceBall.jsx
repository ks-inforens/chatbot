import React from "react";

const AnimationBall = ({
  isListening,
  isSpeaking,
  isActive,
  onStart,
  onStop,
}) => {
  // Decide color and label based on state
  let bgColor = "bg-black/30";
  let label = "Start Voice Fill";
  let onClickHandler = onStart;

  if (isListening) {
    bgColor = "bg-green-600";
    label = "Listening...";
    onClickHandler = null; // disable button when listening
  } else if (isSpeaking) {
    bgColor = "bg-blue-600";
    label = "Speaking...";
    onClickHandler = null; // disable button when speaking
  } else if (isActive) {
    bgColor = "bg-red-600";
    label = "Stop";
    onClickHandler = onStop;
  }

  return (
    <button
      type="button"
      onClick={onClickHandler}
      disabled={!onClickHandler}
      className={`relative flex items-center justify-center rounded-full w-24 h-24 text-white font-semibold text-sm select-none cursor-pointer
        ${bgColor} 
        ${onClickHandler ? "hover:brightness-90 active:brightness-75" : "cursor-not-allowed"}
        animate-pulse-opacity
      `}
      style={{
        boxShadow:
          "0 0 8px 4px rgba(0, 0, 0, 0.1), 0 0 15px 10px rgba(255, 255, 255, 0.3)",
        animationTimingFunction: "ease-in-out",
      }}
    >
      {label}
      {/* Optional: add atomic rings */}
      <div className="absolute rounded-full border border-white border-opacity-25 w-full h-full animate-pulse-opacity delay-150 pointer-events-none" />
      <div className="absolute rounded-full border border-white border-opacity-15 w-16 h-16 animate-pulse-opacity delay-300 pointer-events-none" />
    </button>
  );
};

export default AnimationBall;