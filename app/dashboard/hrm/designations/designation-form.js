"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DesignationForm({
  onClose,
  initialData = null,
  onSubmit,
  isLoading,
}) {
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = [];

    if (!form.name.trim()) errors.push("Name");
    if (!form.description.trim()) errors.push("Description");

    if (errors.length > 0) {
      toast.warning(
        `Please fill the required field${
          errors.length > 1 ? "s" : ""
        }: ${errors.join(", ")}`
      );
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      {/* Name Field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          required
          name="name"
          placeholder="Enter designation name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

      {/* Description Field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          required
          name="description"
          rows={3}
          placeholder="Enter description"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-col-reverse max-md:gap-2 sm:flex-row sm:justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="max-md:w-full"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="max-md:w-full">
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
