"use client";
import React, { useState, useEffect } from "react";
import DepartmentForm from "./department-form";
import DeleteConfirmation from "./delete-confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
import Modal from "@/app/utils/Modal";
import useDepartments from "@/apiHooks/hooks/useDepartmentsQuery";
import CustomPagination from "@/app/utils/CustomPagination";
import ProtectedRoute from "@/components/ProtectedRoute";
import HrmPageContainer from "@/components/hrm/HrmPageContainer";
import HrmPageHeader from "@/components/hrm/HrmPageHeader";
import ReportMobileCard from "@/components/analytics/ReportMobileCard";

const BILLING_MODAL = "billing_modal";
const PAGE_LIMIT = 10;

export default function DepartmentPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDep, setSelectedDep] = useState(null);
  const [deleteData, setDeleteData] = useState({
    open: false,
    id: null,
    name: "",
  });

  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchKey(keyword.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [keyword]);

  const { data, isLoading, createDept, updateDept, deleteDept } =
    useDepartments({
      page,
      limit: PAGE_LIMIT,
      keyword: searchKey,
    });

  const departments = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta?.last_page || 1;
  const currentPage = meta?.current_page || 1;

  const handleSubmit = async (formData) => {
    try {
      if (selectedDep)
        await updateDept({ id: selectedDep.id, payload: formData });
      else await createDept(formData);
      setModalOpen(false);
      setSelectedDep(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDept(deleteData.id);
      setDeleteData({ open: false, id: null, name: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const openCreate = () => {
    setSelectedDep(null);
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    setSelectedDep(dept);
    setModalOpen(true);
  };

  const renderMobileActions = (dept) => (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full text-violet-600 border-violet-200"
        onClick={() => openEdit(dept)}
      >
        <Pencil className="w-4 h-4 mr-1" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-red-600 border-red-200"
        onClick={() =>
          setDeleteData({ open: true, id: dept.id, name: dept.name })
        }
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>
    </div>
  );

  return (
    <ProtectedRoute featureName={"HRM"} optionName={"Department List"}>
      <HrmPageContainer className="max-w-7xl">
        <HrmPageHeader title="Department Management">
          <div className="flex flex-col max-md:gap-2 w-full md:w-auto md:flex-row md:items-center md:gap-2">
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search department..."
                className="pl-8 w-full"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Button
              onClick={openCreate}
              className="bg-violet-600 hover:bg-violet-700 text-white max-md:w-full"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Department
            </Button>
          </div>
        </HrmPageHeader>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : departments.length === 0 ? (
              <p className="text-center py-10 text-gray-500">
                No departments found
              </p>
            ) : (
              <>
                <section
                  className="md:hidden p-3 space-y-3"
                  aria-label="Departments mobile"
                >
                  {departments.map((dept, idx) => (
                    <ReportMobileCard
                      key={dept.id}
                      title={dept.name}
                      subtitle={`#${(currentPage - 1) * PAGE_LIMIT + (idx + 1)}`}
                      fields={[
                        {
                          key: "desc",
                          label: "Description",
                          value: dept.description || "—",
                          fullWidth: true,
                        },
                        {
                          key: "count",
                          label: "Employees",
                          value: String(dept.employee_count ?? 0),
                        },
                      ]}
                      footer={renderMobileActions(dept)}
                    />
                  ))}
                </section>

                <div className="hidden md:block overflow-x-auto m-0">
                  <table className="min-w-full text-sm">
                    <thead className="bg-violet-50">
                      <tr className="text-left text-gray-600 font-medium">
                        <th className="px-4 py-2 border-b">#</th>
                        <th className="px-4 py-2 border-b">Name</th>
                        <th className="px-4 py-2 border-b">Description</th>
                        <th className="px-4 py-2 border-b text-center">
                          Employees
                        </th>
                        <th className="px-4 py-2 border-b text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept, idx) => (
                        <tr
                          key={dept.id}
                          className="hover:bg-violet-50 border-b transition"
                        >
                          <td className="px-4 py-2">
                            {(currentPage - 1) * PAGE_LIMIT + (idx + 1)}
                          </td>
                          <td className="px-4 py-2 font-semibold text-gray-800">
                            {dept.name}
                          </td>
                          <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                            {dept.description || "---"}
                          </td>
                          <td className="px-4 py-2 text-center font-semibold text-violet-700">
                            {dept.employee_count}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(dept)}
                                className="text-violet-600 border-violet-200 hover:bg-violet-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeleteData({
                                    open: true,
                                    id: dept.id,
                                    name: dept.name,
                                  })
                                }
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col max-md:items-stretch max-md:px-3 max-md:pb-4 justify-center mt-6 md:px-6 md:pb-6">
                    <CustomPagination
                      totalPage={totalPages}
                      currentPage={page}
                      setCurrentPage={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Modal
          title={selectedDep ? "Edit Department" : "Add Department"}
          open={isModalOpen}
          onClose={setModalOpen}
          customDesignFor={BILLING_MODAL}
          content={
            <DepartmentForm
              onClose={() => setModalOpen(false)}
              initialData={selectedDep}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          }
        />

        <DeleteConfirmation
          open={deleteData.open}
          name={deleteData.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteData({ open: false, id: null, name: "" })}
        />
      </HrmPageContainer>
    </ProtectedRoute>
  );
}
