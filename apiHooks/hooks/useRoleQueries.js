"use client";
import useSWR from "swr";
import api from "@/lib/api";
import { toast } from "sonner";
import { mutate } from "swr";

const ROLE_KEY = "/role-feature-option-list";

// ✅ Get all roles list
export function useRoleList() {
  const fetcher = async (url) => {
    const res = await api.get(url);
    return res?.data?.data || [];
  };

  return useSWR(ROLE_KEY, fetcher, {
    revalidateOnFocus: false,
  });
}

// ✅ Get a single role (for editing)
export function useRole(roleId) {
  const fetcher = async (url) => {
    const res = await api.get(url);
    return res?.data?.data;
  };

  return useSWR(roleId ? `${ROLE_KEY}/${roleId}` : null, fetcher, {
    revalidateOnFocus: false,
  });
}

// Mutations can be simple async functions in SWR architecture, 
// usually called from the component submit handler. 
// Alternatively, we can export custom hooks returning a mutate function.

export function useCreateRole() {
  return async (payload) => {
    try {
      const res = await api.post("/save-role", payload);
      toast.success(res?.data?.message || "Role created successfully");
      mutate(ROLE_KEY);
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create role");
      throw err;
    }
  };
}

export function useUpdateRole() {
  return async (payload) => {
    try {
      const res = await api.post("/update-role", payload);
      toast.success(res?.data?.message || "Role updated successfully");
      mutate(ROLE_KEY);
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update role");
      throw err;
    }
  };
}
