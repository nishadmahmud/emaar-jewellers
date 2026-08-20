import { Blend, X } from "lucide-react";
import React from "react";

export default function Modal({
  title,
  content,
  open,
  onClose,
  Icon = Blend,
  customDesignFor,
}) {
  const isVariationModal = customDesignFor === "variation_modal";
  const isEmployeeModal = customDesignFor === "employee_modal";
  const isBillingModal = customDesignFor === "billing_modal";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        className={`bg-white rounded-xl shadow-lg flex flex-col pointer-events-auto ${
          isVariationModal
            ? "w-[96vw] sm:w-[90vw] max-w-none max-h-[92vh] overflow-y-auto"
            : isEmployeeModal
            ? "w-full max-w-7xl max-h-[90vh] overflow-y-auto"
            : isBillingModal
            ? "w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto"
            : "w-full max-w-2xl max-h-[85vh]"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Icon className="text-blue-500 bg-blue-50 p-1 rounded-lg h-8 w-8" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button onClick={() => onClose(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4">
           {content}
        </div>
      </div>
    </div>
  );
}
