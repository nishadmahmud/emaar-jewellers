"use client";
import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import { toast } from "sonner";

const EMPLOYEE_KEY = "/employees";

export default function useEmployees(params = { page: 1, limit: 10, keyword: "" }) {
  const fetcher = async () => {
    const endpoint = params.keyword ? "/search-employee" : "/employee";
    let res;

    if (params.keyword?.trim()) {
      res = await api.post(
        `${endpoint}?page=${params.page}&limit=${params.limit}`,
        { keyword: params.keyword }
      );
    } else {
      res = await api.get(
        `${endpoint}?page=${params.page}&limit=${params.limit}`
      );
    }

    const response = res?.data;
    const data = response?.data?.data || response?.data || [];
    const meta = response?.data || {};
    return { data, meta };
  };

  const key = [EMPLOYEE_KEY, params.page, params.limit, params.keyword];

  const swrObj = useSWR(key, fetcher, { revalidateOnFocus: false });

  const invalidate = () => mutate((k) => Array.isArray(k) && k[0] === EMPLOYEE_KEY, undefined, { revalidate: true });

  const createEmployee = async (payload) => {
    try {
      const res = await api.post("/save-employee", payload);
      toast.success(res?.data?.message || "Employee added successfully");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add");
      throw err;
    }
  };

  const updateEmployee = async ({ id, payload }) => {
    try {
      const res = await api.post("/update-employee", { emp_id: id, ...payload });
      toast.success(res?.data?.message || "Employee updated");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
      throw err;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const res = await api.post("/delete-employee", { employee_id: id });
      toast.success(res?.data?.message || "Deleted successfully");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
      throw err;
    }
  };

  return { 
    data: swrObj.data, 
    isLoading: swrObj.isLoading || swrObj.isValidating, 
    error: swrObj.error,
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
  };
}
