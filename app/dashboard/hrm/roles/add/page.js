"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Shield } from "lucide-react";
import Link from "next/link";
import { useCreateRole } from "@/apiHooks/hooks/useRoleQueries";
import { rolesFeatures } from "@/app/constants/roles-feature";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AddRolePage() {
  const router = useRouter();
  const createRole = useCreateRole();

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isPending, setIsPending] = useState(false);

  const [features, setFeatures] = useState(
    rolesFeatures.map((feature) => ({
      ...feature,
      status: false,
      feature_options: feature.feature_options.map((opt) => ({
        ...opt,
        status: false,
      })),
    }))
  );

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
          const detailsEl = document.getElementById(`details-add-${featureIndex}`);
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

  const handleOptionToggle = (featureIndex, optionIndex) => {
    setFeatures((prev) =>
      prev.map((f, fIdx) => {
        if (fIdx !== featureIndex) return f;
        const newOptions = f.feature_options.map((opt, oIdx) =>
          oIdx === optionIndex ? { ...opt, status: !opt.status } : opt
        );
        const anyOptionChecked = newOptions.some((opt) => opt.status);
        return { ...f, status: anyOptionChecked, feature_options: newOptions };
      })
    );
  };

  const handleSelectAllOptions = (featureIndex) => {
    setFeatures((prev) =>
      prev.map((f, idx) => {
        if (idx !== featureIndex) return f;
        const allChecked = f.feature_options.every((opt) => opt.status);
        const newOptions = f.feature_options.map((opt) => ({
          ...opt,
          status: !allChecked,
        }));
        return { ...f, status: !allChecked, feature_options: newOptions };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      features: features.map((f) => ({
        name: f.name,
        status: f.status,
        feature_options: f.feature_options.map((opt) => ({
          name: opt.name,
          status: opt.status,
        })),
      })),
    };

    try {
      setIsPending(true);
      await createRole(payload);
      router.push("/dashboard/hrm/roles");
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  };

  const selectedCount = features.filter((f) => f.status).length;

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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 ring-1 ring-indigo-200">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold leading-snug text-gray-900">
                Create New Role
              </h1>
              <p className="text-sm text-gray-500 leading-tight">
                Define permissions and access levels for your team members
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Basic Info */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px] space-y-1">
                  <Label htmlFor="name" className="text-base">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Sales Manager, Store Admin"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="h-11"
                  />
                </div>
                <div className="flex-1 min-w-[250px] space-y-1">
                  <Label htmlFor="description" className="text-base">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the responsibilities..."
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Accordion */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions & Access</CardTitle>
                  <CardDescription>
                    Select features and specific permissions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 ring-1 ring-primary/20">
                  <span className="text-sm font-medium text-muted-foreground">
                    Selected:
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {selectedCount}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {features.length}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Accordion for each feature */}
              <Accordion type="single" collapsible className="space-y-3">
                {features.map((feature, featureIndex) => {
                  const Icon = feature.icon;
                  const allOptionsChecked =
                    feature.feature_options.length > 0 &&
                    feature.feature_options.every((opt) => opt.status);
                  return (
                    <AccordionItem id={`details-add-${featureIndex}`} key={feature.name} value={feature.name} className="border rounded-md overflow-hidden bg-white mb-2">
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

                            {/* Side‑by‑side grid */}
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
                                      id={`option-${featureIndex}-${optionIndex}`}
                                      checked={option.status}
                                      onCheckedChange={() =>
                                        handleOptionToggle(
                                          featureIndex,
                                          optionIndex
                                        )
                                      }
                                      disabled={!feature.status}
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

          <div className="flex flex-col-reverse max-md:gap-2 sm:flex-row sm:items-center sm:justify-end gap-4 pt-4">
            <Link href="/dashboard/hrm/roles" className="max-md:w-full">
              <Button type="button" variant="outline" size="lg" className="max-md:w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={isPending || !formData.name.trim()}
              className="gap-2 min-w-32 max-md:w-full"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Role
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
