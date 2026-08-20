"use client";
import React from "react";
import { Button } from "@/components/ui/button";

export default function DeleteConfirmation({
  open,
  onConfirm,
  onCancel,
  name,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm max-md:max-w-none p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Delete Designation
        </h3>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-red-600">{name}</span>?
        </p>

        <div className="flex flex-col-reverse max-md:gap-2 sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="max-md:w-full">
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white max-md:w-full"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
