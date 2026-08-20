"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useRolePermissions } from "@/apiHooks/hooks/useCheckRolePermissionsQuery";
import { canAccess } from "@/lib/canAccess";
import Unauthorized from "./Unauthorized";

export default function ProtectedRoute({ featureName, optionName, children }) {
  const { data: session, status } = useSession();
  const isEmployee = !!session?.isEmployee;

  // Employees: fetch and verify permissions using SWR
  const { data: features, isLoading, error } = useRolePermissions();

  // Wait for session to load
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  // 🧠 Rule:
  // - If NOT employee → always allow
  // - If employee → check permission
  if (!isEmployee) {
    // Regular user — let them in freely
    return children;
  }

  // Employee: wait for permissions data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !features) {
     // If API failed, might be unauthorized to even fetch or offline
     return <Unauthorized />;
  }

  // Employee: check access
  const hasAccess = canAccess(features, featureName, optionName);

  if (!hasAccess) {
    return <Unauthorized />;
  }

  // All good — employee allowed
  return children;
}
