"use client";

import React from "react";

export default function HrmPageHeader({
  title,
  description,
  children,
  className,
}) {
  return (
    <div
      className={`flex flex-col gap-3 max-md:gap-4 md:flex-row md:items-center md:justify-between ${className || ""}`}
    >
      <div className="min-w-0">
        {title ? (
          <h1 className="text-xl font-bold text-gray-800 md:text-2xl">{title}</h1>
        ) : null}
        {description ? (
          <p className="mt-1 text-sm text-gray-500 md:mt-2">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex w-full flex-col gap-2 max-md:[&_button]:w-full max-md:[&_a]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end md:max-w-none">
          {children}
        </div>
      ) : null}
    </div>
  );
}
