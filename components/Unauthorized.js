"use client";
import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 text-gray-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center">
        <div className="flex justify-center mb-4">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>

        <p className="mt-2 text-sm text-gray-600">
          You don’t have permission to view this page.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
