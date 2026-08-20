"use client";
import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import { toast } from "sonner";

const DESIGNATION_KEY = "/designations";

export default function useDesignations(params = { page: 1, limit: 10, keyword: "" }) {
  const fetcher = async () => {
    const endpoint = params.keyword ? "/search-designation" : "/designation";
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

  const key = [DESIGNATION_KEY, params.page, params.limit, params.keyword];

  const swrObj = useSWR(key, fetcher, { revalidateOnFocus: false });

  const invalidate = () => mutate((k) => Array.isArray(k) && k[0] === DESIGNATION_KEY, undefined, { revalidate: true });

  const createDesignation = async (payload) => {
    try {
      const res = await api.post("/save-designation", payload);
      toast.success(res?.data?.message || "Designation created");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create");
      throw err;
    }
  };

  const updateDesignation = async ({ id, payload }) => {
    try {
      const res = await api.post(`/update-designation/${id}`, payload);
      toast.success(res?.data?.message || "Designation updated");
      invalidate();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
      throw err;
    }
  };

  const deleteDesignation = async (id) => {
    try {
      const res = await api.post("/delete-designation", { designation_id: id });
      toast.success(res?.data?.message || "Designation deleted");
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
    createDesignation, 
    updateDesignation, 
    deleteDesignation 
  };
}
