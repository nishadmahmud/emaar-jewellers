"use client";
import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import { toast } from "sonner";

const DEPARTMENT_KEY = "/departments";

export default function useDepartments(params = { page: 1, limit: 20, keyword: "" }) {
  const fetcher = async () => {
    const endpoint = params.keyword ? "/search-department" : "/department";
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
    const data = response?.data?.data || [];
    const meta = response?.data || {};
    return { data, meta };
  };

  const key = [DEPARTMENT_KEY, params.page, params.limit, params.keyword];

  const swrObj = useSWR(key, fetcher, { revalidateOnFocus: false });

  const invalidate = () => mutate((k) => Array.isArray(k) && k[0] === DEPARTMENT_KEY, undefined, { revalidate: true });

  const createDept = async (payload) => {
    try {
      const res = await api.post("/save-department", payload);
      toast.success(res?.data?.message || "Department created");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create");
      throw err;
    }
  };

  const updateDept = async ({ id, payload }) => {
    try {
      const res = await api.post(`/update-department/${id}`, payload);
      toast.success(res?.data?.message || "Department updated");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
      throw err;
    }
  };

  const deleteDept = async (id) => {
    try {
      const res = await api.post("/delete-department", { departmentId: id });
      toast.success(res?.data?.message || "Department deleted");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
      throw err;
    }
  };

  // Keep API similar to react-query format expected by components
  return { 
    data: swrObj.data, 
    isLoading: swrObj.isLoading || swrObj.isValidating, 
    error: swrObj.error,
    createDept, 
    updateDept, 
    deleteDept 
  };
}
