"use client";
import React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DepartmentForm({
  onClose,
  initialData = null,
  onSubmit,
  isLoading,
}) {
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (initialData)
      setForm({
        name: initialData.name,
        description: initialData.description || "",
      });
  }, [initialData]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning("Name required");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Name *</label>
        <Input
          name="name"
          placeholder="Department name"
          value={form.name}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-600">Description</label>
        <Textarea
          name="description"
          rows={3}
          placeholder="Short description"
          value={form.description}
          onChange={handleChange}
        />
      </div>

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
