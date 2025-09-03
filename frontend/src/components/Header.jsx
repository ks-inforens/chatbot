import React from "react";
import frame from "./frame.png";

export default function Header() {
  return (
    <header className="h-[82px]">
      <img src={frame} alt="Header Frame" className="h-full w-full" />
    </header>
  );
}