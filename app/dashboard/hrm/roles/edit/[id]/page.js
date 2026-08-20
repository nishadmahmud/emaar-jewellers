"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Shield, Loader2 } from "lucide-react";
import { useRole, useUpdateRole } from "@/apiHooks/hooks/useRoleQueries";
import { rolesFeatures } from "@/app/constants/roles-feature";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function EditRolePage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: roleData, isLoading } = useRole(id);
  const updateRole = useUpdateRole();

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [features, setFeatures] = useState([]);
  const [isPending, setIsPending] = useState(false);

  /** ✅ Preload role data */
  useEffect(() => {
    if (roleData) {
      setFormData({
        name: roleData.name,
        description: roleData.description || "",
      });

      // Merge to keep icons consistent
      const merged = rolesFeatures.map((f) => {
        const existing = roleData.features.find(
          (r) => r.name.toLowerCase() === f.name.toLowerCase()
        );
        if (existing) {
          return {
            ...f,
            id: existing.id,
            role_id: roleData.id,
            status: !!existing.status,
            feature_options: f.feature_options.map((opt) => {
              const match = existing.feature_options.find(
                (eo) => eo.name.toLowerCase() === opt.name.toLowerCase()
              );
              return { ...opt, id: match?.id, status: !!match?.status };
            }),
          };
        } else {
          return {
            ...f,
            role_id: roleData.id,
            status: false,
            feature_options: f.feature_options.map((o) => ({
              ...o,
              status: false,
            })),
          };
        }
      });
      setFeatures(merged);
    }
  }, [roleData]);

  /** Input handler */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (featureIndex) => {
    setFeatures((prev) =>
      prev.map((f, idx) => {
        if (idx !== featureIndex) return f;
        const newStatus = !f.status;
        
        // Auto-expand the accordion natively when checking the box
        if (newStatus) {
          const detailsEl = document.getElementById(`details-edit-${featureIndex}`);
          if (detailsEl && !detailsEl.open) {
            detailsEl.open = true;
          }
        }

        return {
          ...f,
          status: newStatus,
        };
      })
    );
  };

  /** ✅ Toggle single option */
  const handleOptionToggle = (fIdx, oIdx) => {
    setFeatures((prev) =>
      prev.map((f, i) => {
        if (i !== fIdx) return f;
        const newOptions = f.feature_options.map((opt, j) =>
          j === oIdx ? { ...opt, status: !opt.status } : opt
        );
        const anyChecked = newOptions.some((opt) => opt.status);
        return { ...f, status: anyChecked, feature_options: newOptions };
      })
    );
  };

  /** ✅ Select All / Deselect All */
  const handleSelectAllOptions = (featureIndex) => {
    setFeatures((prev) =>
      prev.map((f, idx) => {
        if (idx !== featureIndex) return f;
        const allChecked = f.feature_options.every((opt) => opt.status);
        const newOpts = f.feature_options.map((o) => ({
          ...o,
          status: !allChecked,
        }));
        return { ...f, status: !allChecked, feature_options: newOpts };
      })
    );
  };

  /** ✅ Submit form */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const payload = {
      id: roleData.id,
      name: formData.name,
      description: formData.description,
      features,
    };
    try {
      setIsPending(true);
      await updateRole(payload);
      router.push("/dashboard/hrm/roles");
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  const selectedCount = features.filter((f) => f.status).length;

  /** Loader state */
  if (isLoading || !roleData)
    return (
      <div className="flex h-screen justify-center items-center text-muted-foreground">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        Loading role data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 max-md:px-3 sm:px-4 py-4 max-md:py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <Link href="/dashboard/hrm/roles">
            <Button variant="ghost" size="sm" className="mb-2 gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Roles
            </Button>
          </Link>
          <div className="flex flex-col max-md:items-start sm:flex-row sm:items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 ring-1 ring-indigo-200">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold leading-snug text-gray-900">
                Edit Role – {formData.name}
              </h1>
              <p className="text-sm text-gray-500">
                Update permissions and access controls
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Modify role details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-base">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Sales Manager"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-base">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="resize-none"
                    placeholder="Describe this role..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Accordion */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Permissions & Access</CardTitle>
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg">
                  <span className="text-sm font-medium">
                    Selected: {selectedCount}/{features.length}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Accordion type="multiple" className="space-y-3">
                {features.map((feature, featureIndex) => {
                  const Icon = feature.icon;
                  const allOptionsChecked =
                    feature.feature_options.length > 0 &&
                    feature.feature_options.every((opt) => opt.status);

                  return (
                    <AccordionItem id={`details-edit-${featureIndex}`} key={feature.name} value={feature.name} className="border rounded-md overflow-hidden bg-white mb-2">
                      <AccordionTrigger className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-3 w-full hover:no-underline focus:outline-none">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${feature.status
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-500"
                              }`}
                          >
                            {Icon ? <Icon className="h-4 w-4" /> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={feature.status}
                              onCheckedChange={() => handleFeatureToggle(featureIndex)}
                              className="h-5 w-5"
                            />
                            <Label
                              className="font-semibold cursor-pointer text-base text-gray-800"
                            >
                              {feature.name}
                            </Label>
                          </div>
                        </div>

                        {feature.status && (
                          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
                            {feature.feature_options.filter((o) => o.status).length || 0} enabled
                          </span>
                        )}
                      </AccordionTrigger>

                      <AccordionContent>
                        {feature.feature_options.length > 0 && (
                          <div className="mt-3 px-1 pb-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Permissions
                              </h4>
                              {feature.feature_options.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleSelectAllOptions(featureIndex)
                                  }
                                  className="h-6 text-xs"
                                  disabled={!feature.status}
                                >
                                  {allOptionsChecked
                                    ? "Deselect All"
                                    : "Select All"}
                                </Button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {feature.feature_options.map(
                                (option, optionIndex) => (
                                  <div
                                    key={option.name}
                                    className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors border ${option.status
                                        ? "border-primary bg-primary/10"
                                        : "border-transparent hover:bg-muted/50"
                                      }`}
                                  >
                                    <Checkbox
                                      checked={option.status}
                                      onCheckedChange={() =>
                                        handleOptionToggle(
                                          featureIndex,
                                          optionIndex
                                        )
                                      }
                                      disabled={!feature.status}
                                      id={`option-${featureIndex}-${optionIndex}`}
                                      className="h-4 w-4"
                                    />
                                    <Label
                                      htmlFor={`option-${featureIndex}-${optionIndex}`}
                                      className={`text-sm cursor-pointer whitespace-nowrap ${!feature.status
                                          ? "text-muted-foreground"
                                          : ""
                                        }`}
                                    >
                                      {option.name}
                                    </Label>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse max-md:gap-2 sm:flex-row sm:justify-end gap-3 pt-4">
            <Link href="/dashboard/hrm/roles" className="max-md:w-full">
              <Button type="button" variant="outline" className="max-md:w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending || !formData.name.trim()}
              className="gap-2 min-w-32 max-md:w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" /> Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Update Role
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
