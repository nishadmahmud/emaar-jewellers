"use client";

import React from "react";

/**
 * Single analytics row as a mobile card (md:hidden lists only).
 */
export default function ReportMobileCard({
  title,
  subtitle,
  fields = [],
  footer,
  className,
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-3.5 space-y-3 ${className || ""}`}
    >
      {(title || subtitle) && (
        <div className="flex items-start justify-between gap-2">
          {title ? (
            <p className="text-sm font-semibold break-words leading-5">{title}</p>
          ) : (
            <span />
          )}
          {subtitle ? (
            <p className="text-xs text-gray-500 shrink-0">{subtitle}</p>
          ) : null}
        </div>
      )}

      {fields.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {fields.map((field, idx) => (
            <div
              key={field.key ?? `${field.label}-${idx}`}
              className={field.fullWidth ? "col-span-2" : ""}
            >
              <p className="text-gray-500">{field.label}</p>
              <p
                className={`font-medium break-words leading-5 ${field.valueClassName || ""}`}
              >
                {field.value ?? "-"}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {footer ? (
        <div className="pt-2 border-t space-y-1.5 text-xs">{footer}</div>
      ) : null}
    </div>
  );
}
