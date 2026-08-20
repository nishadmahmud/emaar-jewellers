"use client";
import useSWR from "swr";
import axios from "axios";
import { useSession } from "next-auth/react";

export function useRolePermissions() {
  const { data: session } = useSession();
  const employeeId = session?.employee?.id;
  const token = session?.accessToken;
  const enable = !!session?.isEmployee && !!employeeId;

  const fetcher = async (url) => {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data?.data?.role?.features || [];
  };

  return useSWR(
    enable ? `${process.env.NEXT_PUBLIC_API}/employee/${employeeId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}
