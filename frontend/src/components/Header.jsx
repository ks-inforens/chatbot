import React from "react";
import frame from "./frame.png";

export default function Header() {
  return (
    <header className="header">
      <img src={frame} alt="Header Frame" className="header-frame" />
    </header>
  );
}