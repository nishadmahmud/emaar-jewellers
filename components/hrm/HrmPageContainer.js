"use client";

import React from "react";

export default function HrmPageContainer({ children, className }) {
  return (
    <div
      className={`mx-auto max-w-7xl space-y-4 p-3 md:space-y-6 md:p-6 ${className || ""}`}
    >
      {children}
    </div>
  );
}
