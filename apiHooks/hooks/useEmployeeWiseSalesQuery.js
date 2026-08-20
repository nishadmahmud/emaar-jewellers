"use client";
import useSWR from "swr";
import api from "@/lib/api";

export function useGetEmployeeWiseSalesQuery({ start_date, end_date, employee_id }, options = {}) {
  const fetcher = async () => {
    const res = await api.post("/employee-wise-sales", {
      start_date,
      end_date,
      employee_id,
    });
    return res?.data;
  };

  const key = options.skip ? null : ["/employee-wise-sales", start_date, end_date, employee_id];

  const swrObj = useSWR(key, fetcher, { revalidateOnFocus: false });

  return {
    data: swrObj.data,
    isLoading: swrObj.isLoading || swrObj.isValidating,
    error: swrObj.error,
  };
}
