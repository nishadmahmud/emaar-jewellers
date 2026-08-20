"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Select from "react-select";
import useSWR from "swr";
import api from "@/lib/api";
import { ImageUploader } from "@/app/utils/ImageUploader";

export default function EmployeeForm({
  onClose,
  initialData = null,
  onSubmit,
  isLoading,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    work_email: "",
    address: "",
    emergency_mobile_number: "",
    relation_with: "",
    joining_date: "",
    dob: "",
    department_id: "",
    designation_id: "",
    role_id: "",
    blood_group_id: "",
    warehouse_id: "",
    status: "1",
    emp_image: "",
    password: "",
    salary_amount: "",
    nid: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // 🔹 Prefill on edit
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        mobile_number: initialData.mobile_number || "",
        work_email: initialData.work_email || "",
        address: initialData.address || "",
        emergency_mobile_number: initialData.emergency_mobile_number || "",
        relation_with: initialData.relation_with || "",
        joining_date: initialData.joining_date
          ? initialData.joining_date.slice(0, 10)
          : "",
        dob: initialData.dob ? initialData.dob.slice(0, 10) : "",
        department_id: initialData.department_id || "",
        designation_id: initialData.designation_id || "",
        role_id: initialData.role_id || "",
        blood_group_id: initialData.blood_group_id || "",
        warehouse_id: initialData.warehouse_id || "",
        status: initialData.status?.toString() || "1",
        emp_image: initialData.emp_image || "",
        password: "",
        salary_amount: initialData.salary_amount || "",
        nid: initialData.nid || "",
      });
      // show existing photo
      if (initialData.emp_image) setImagePreview(initialData.emp_image);
    } else {
      setImagePreview(null);
    }
  }, [initialData]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSelect = (name, value) =>
    setForm((p) => ({ ...p, [name]: value ? value.value : "" }));

  // 🔹 Fetch dropdown data
  const { data: deps } = useSWR("/department", async (url) => (await api.get(url))?.data?.data?.data || []);
  const { data: desigs } = useSWR("/designation", async (url) => (await api.get(url))?.data?.data?.data || []);
  const { data: roles } = useSWR("/role-list", async (url) => (await api.get(url))?.data?.data || []);
  const { data: bloods } = useSWR("/get-blood-group", async (url) => (await api.get(url))?.data?.data || []);
  const { data: warehouses } = useSWR("/warehouses-list", async (url) => (await api.get(url))?.data?.data || []);

  // 🔹 handleSubmit with image upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.mobile_number.trim() ||
      (!initialData && !form.password.trim())
    ) {
      toast.warning(
        !initialData
          ? "Name, Email, Mobile Number & Password are required!"
          : "Name, Email & Mobile Number are required!"
      );
      return;
    }

    try {
      const payload = { ...form, emp_image: selectedImage || form.emp_image };
      // 🧠 If editing and password is still empty, remove it
      if (initialData && !form.password.trim()) {
        delete payload.password;
      }
      onSubmit(payload);
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    }
  };

  // 🔹 react-select options
  const selectOptions = {
    departments: deps?.map((d) => ({ value: d.id, label: d.name })),
    designations: desigs?.map((d) => ({ value: d.id, label: d.name })),
    roles: roles?.map((r) => ({ value: r.id, label: r.name })),
    bloods: bloods?.map((b) => ({ value: b.id, label: b.blood_group_name })),
    warehouses: warehouses?.map((w) => ({
      value: w.id,
      label: w.name || `Warehouse #${w.id}`,
    })),
    status: [
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
    ],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pr-2 pt-1">
      {/* 🔹 Employee photo upload (Centered at top) */}
      <div className="flex flex-col items-center justify-center mb-6">
        <label className="text-xs text-gray-600 font-medium mb-2">
          Employee Photo
        </label>
        <div className="border border-gray-300 p-3 rounded-md flex flex-col items-center w-full max-w-[200px]">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Employee Preview"
              className="w-20 h-20 object-cover rounded-full mb-2 border"
            />
          ) : (
            <div className="w-20 h-20 mb-2 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
          <ImageUploader
            key={imagePreview} // ✅ forces refresh after upload to re-enable browsing
            onImageChange={(list) => {
              const file = list?.file;
              if (file) {
                setSelectedImage(file);
                setImagePreview(URL.createObjectURL(file));
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* 🔹 Basic Info fills row nicely */}
          <div>
            <label className="text-xs text-gray-600 font-medium">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              placeholder="Employee Name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              name="email"
              placeholder="Personal Email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* 🆕 Fill unused space with address to look balanced */}
          <div>
            <label className="text-xs text-gray-600 font-medium">Address</label>
            <Textarea
              name="address"
              placeholder="Residential or short about employee"
              rows={1}
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">
              Work Email
            </label>
            <Input
              name="work_email"
              placeholder="Official Email"
              value={form.work_email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <Input
              name="mobile_number"
              placeholder="e.g. 017xxxxxxxx"
              value={form.mobile_number}
              onChange={handleChange}
            />
          </div>

          {/* 🔹 Salary Amount */}
          <div>
            <label className="text-xs text-gray-600 font-medium">
              Salary Amount
            </label>
            <Input
              type="number"
              name="salary_amount"
              placeholder="e.g. 25000"
              value={form.salary_amount}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          {/* 🔹 NID */}
          <div>
            <label className="text-xs text-gray-600 font-medium">
              NID Number
            </label>
            <Input
              type="number"
              name="nid"
              placeholder="National ID Number"
              value={form.nid}
              onChange={handleChange}
            />
          </div>

          {/* 🔹 Password */}
          <div className="relative">
            <label className="text-xs text-gray-600 font-medium">
              Password {!initialData && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Set employee password"
                value={form.password}
                onChange={handleChange}
                className="pr-10" // give space for the eye icon
              />
              {/* Eye icon button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1} // prevent stealing focus
              >
                {showPassword ? (
                  // 🟢 open-eye icon (Lucide)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  // 🔴 eye-slash icon (Lucide)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19.5C4.5 19.5 1.5 12 1.5 12a20.682 20.682 0 014.46-5.06M8.25 4.215A9.963 9.963 0 0112 4.5c7.5 0 10.5 7.5 10.5 7.5a20.676 20.676 0 01-2.795 4.034M9.88 9.88a3 3 0 104.24 4.24"
                    />
                    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">
              Department
            </label>
            <Select
              options={selectOptions.departments}
              value={
                selectOptions.departments?.find(
                  (x) => x.value == form.department_id
                ) || null
              }
              onChange={(v) => handleSelect("department_id", v)}
              placeholder="Select Department"
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">
              Designation
            </label>
            <Select
              options={selectOptions.designations}
              value={
                selectOptions.designations?.find(
                  (x) => x.value == form.designation_id
                ) || null
              }
              onChange={(v) => handleSelect("designation_id", v)}
              placeholder="Select Designation"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Role</label>
            <Select
              options={selectOptions.roles}
              value={
                selectOptions.roles?.find((x) => x.value == form.role_id) ||
                null
              }
              onChange={(v) => handleSelect("role_id", v)}
              placeholder="Select Role"
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">
              Warehouse
            </label>
            <Select
              options={selectOptions.warehouses}
              value={
                selectOptions.warehouses?.find(
                  (x) => x.value == form.warehouse_id
                ) || null
              }
              onChange={(v) => handleSelect("warehouse_id", v)}
              placeholder="Select Warehouse"
              className="text-sm"
            />
          </div>
        </div>


      {/* rest of details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-600 font-medium">
            Blood Group
          </label>
          <Select
            options={selectOptions.bloods}
            value={
              selectOptions.bloods?.find(
                (x) => x.value == form.blood_group_id
              ) || null
            }
            onChange={(v) => handleSelect("blood_group_id", v)}
            placeholder="Select Blood Group"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 font-medium">Status</label>
          <Select
            options={selectOptions.status}
            value={
              selectOptions.status.find((x) => x.value == form.status) || null
            }
            onChange={(v) => handleSelect("status", v)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 font-medium">
            Joining Date
          </label>
          <Input
            type="date"
            name="joining_date"
            value={form.joining_date}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 font-medium">
            Date of Birth
          </label>
          <Input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
          />
        </div>

        {/* -- emergency contact -- */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600 font-medium">
            Emergency Contact
          </label>
          <div className="flex flex-col max-md:gap-2 sm:flex-row gap-2">
            <div className="w-full sm:w-1/2">
              <Input
                name="emergency_mobile_number"
                placeholder="Emergency contact number"
                value={form.emergency_mobile_number}
                onChange={handleChange}
              />
            </div>
            <div className="w-full sm:w-1/2">
              <Select
                options={[
                  { value: "", label: "Select" },
                  { value: "Father", label: "Father" },
                  { value: "Mother", label: "Mother" },
                  { value: "Wife", label: "Wife" },
                  { value: "Husband", label: "Husband" },
                  { value: "Brother", label: "Brother" },
                  { value: "Sister", label: "Sister" },
                  { value: "Friend", label: "Friend" },
                  { value: "Colleague", label: "Colleague" },
                ]}
                value={
                  form.relation_with
                    ? { value: form.relation_with, label: form.relation_with }
                    : { value: "", label: "Select" }
                }
                onChange={(option) =>
                  setForm((p) => ({
                    ...p,
                    relation_with: option?.value || "",
                  }))
                }
                placeholder="Select relation"
                className="text-sm"
                styles={{
                  container: (base) => ({
                    ...base,
                    width: "100%",
                  }),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="flex flex-col-reverse max-md:gap-2 sm:flex-row sm:justify-end gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onClose();
            setImagePreview(null);
            setSelectedImage(null);
          }}
          className="focus:ring-2 focus:ring-gray-200 max-md:w-full"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-violet-600 hover:bg-violet-700 text-white max-md:w-full"
        >
          {isLoading ? "Saving..." : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}
