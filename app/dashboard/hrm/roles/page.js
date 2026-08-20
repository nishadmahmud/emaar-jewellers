"use client";
import React, { useState } from "react";
import { useRoleList } from "@/apiHooks/hooks/useRoleQueries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Pencil, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import HrmPageContainer from "@/components/hrm/HrmPageContainer";
import HrmPageHeader from "@/components/hrm/HrmPageHeader";
import ReportMobileCard from "@/components/analytics/ReportMobileCard";
import { rolesFeatures } from "@/app/constants/roles-feature";

export default function RoleListPage() {
  const { data: roles = [], isLoading, isError } = useRoleList();
  const [search, setSearch] = useState("");

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ProtectedRoute featureName={"HRM"} optionName={"Role List"}>
      <HrmPageContainer className="max-w-7xl">
        <HrmPageHeader title="Role Management">
          <div className="flex flex-col max-md:gap-2 w-full md:w-auto md:flex-row md:items-center md:gap-2">
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search roles..."
                className="pl-8 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href="/dashboard/hrm/roles/add" className="max-md:w-full">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white max-md:w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Role
              </Button>
            </Link>
          </div>
        </HrmPageHeader>

        <Card className="shadow-sm border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : isError ? (
              <p className="text-center py-10 text-red-500">
                Failed to load roles
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-10 text-gray-500">No roles found</p>
            ) : (
              <>
                <section
                  className="md:hidden p-3 space-y-3"
                  aria-label="Roles mobile"
                >
                  {filtered.map((role, idx) => (
                    <RoleMobileCard key={role.id} role={role} index={idx} />
                  ))}
                </section>

                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-violet-50 border-b text-left text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Role Name</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2 text-center">Features</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((role, idx) => (
                        <RoleRow key={role.id} index={idx} role={role} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </HrmPageContainer>
    </ProtectedRoute>
  );
}

function RoleMobileCard({ role, index }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  
  const validLength = rolesFeatures.length;
  
  // Calculate enabled count strictly against rolesFeatures
  const enabledFeatures = rolesFeatures.filter((rf) => {
    const dbMatch = role.features?.find(f => f.name.toLowerCase() === rf.name.toLowerCase());
    return dbMatch?.status === true;
  }).length;

  return (
    <ReportMobileCard
      title={role.name}
      subtitle={`#${index + 1}`}
      fields={[
        {
          key: "desc",
          label: "Description",
          value: role.description || "—",
          fullWidth: true,
        },
        {
          key: "features",
          label: "Features",
          value: `${enabledFeatures} / ${validLength} enabled`,
        },
      ]}
      footer={
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-violet-600"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide" : "View"} permissions ({validLength})
            <ChevronDown
              className={cn(
                "ml-1 h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </Button>
          {expanded ? (
            <div className="pt-1">
              <FeatureGrid features={role.features} />
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-violet-600 border-violet-200"
            onClick={() => router.push(`/dashboard/hrm/roles/edit/${role.id}`)}
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit Role
          </Button>
        </div>
      }
    />
  );
}

function RoleRow({ role, index }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  
  // Always 10 features now
  const validLength = rolesFeatures.length;

  return (
    <>
      <tr
        className={cn(
          "border-b hover:bg-violet-50 transition",
          expanded && "bg-violet-50",
        )}
      >
        <td className="px-4 py-2 align-top">{index + 1}</td>
        <td className="px-4 py-2 align-top font-semibold text-gray-800">
          {role.name}
        </td>
        <td className="px-4 py-2 align-top text-gray-600">
          {role.description || "---"}
        </td>
        <td className="px-4 py-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-violet-600"
          >
            {expanded ? "Hide" : "View"} ({validLength})
            <ChevronDown
              className={cn(
                "ml-1 h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </td>
        <td className="px-4 py-2">
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-violet-600 border-violet-200 hover:bg-violet-50"
              onClick={() => router.push(`/dashboard/hrm/roles/edit/${role.id}`)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-t bg-white">
          <td colSpan={5} className="px-6 py-4">
            <FeatureGrid features={role.features} />
          </td>
        </tr>
      )}
    </>
  );
}

function FeatureGrid({ features }) {
  // We strictly map over rolesFeatures to guarantee no old/orphaned DB data renders.
  const displayFeatures = rolesFeatures.map((rf) => {
    // Find matching feature from DB
    const dbFeature = features.find(
      (f) => f.name.toLowerCase() === rf.name.toLowerCase()
    );

    return {
      ...rf,
      id: dbFeature?.id || rf.name,
      status: dbFeature?.status || false,
      feature_options: rf.feature_options.map((opt) => {
        // Find matching option from DB
        const dbOpt = dbFeature?.feature_options?.find(
          (o) => o.name.toLowerCase() === opt.name.toLowerCase()
        );
        return {
          ...opt,
          id: dbOpt?.id || opt.name,
          status: dbOpt?.status || false,
        };
      }),
    };
  });

  // Only render features that have at least one option, or just render all 10
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {displayFeatures.map((f) => (
        <div
          key={f.id}
          className="border rounded-lg shadow-sm p-3 bg-gray-50 hover:shadow-md transition-all"
        >
          <div className="flex justify-between mb-2 gap-2">
            <span className="font-medium text-gray-800 text-sm break-words">
              {f.name}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs shrink-0",
                f.status
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {f.status ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {f.feature_options.map((opt) => (
              <span
                key={opt.id}
                className={cn(
                  "px-2 py-0.5 rounded border",
                  opt.status
                    ? "bg-violet-100 border-violet-300 text-violet-700"
                    : "bg-gray-100 border-gray-200 text-gray-500",
                )}
              >
                {opt.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
