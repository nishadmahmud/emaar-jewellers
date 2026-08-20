"use client";
import React, { useState, useEffect } from "react";
import useEmployees from "@/apiHooks/hooks/useEmployeesQuery";
import Modal from "@/app/utils/Modal";
import CustomPagination from "@/app/utils/CustomPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import DeleteConfirmation from "./delete-confirmation";
import EmployeeForm from "./employee-form";
import useSWR from "swr";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import HrmPageContainer from "@/components/hrm/HrmPageContainer";
import HrmPageHeader from "@/components/hrm/HrmPageHeader";
import ReportMobileCard from "@/components/analytics/ReportMobileCard";

const BILLING_MODAL = "billing_modal";
const PAGE_LIMIT = 20;

export default function EmployeePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [deleteData, setDeleteData] = useState({
    open: false,
    id: null,
    name: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data, isLoading, createEmployee, updateEmployee, deleteEmployee } =
    useEmployees({ page, limit: PAGE_LIMIT, keyword: debounced });

  const employees = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta?.last_page || 1;
  const currentPage = meta?.current_page || page;

  const { data: roleList } = useSWR("/role-list", async (url) => (await api.get(url))?.data?.data || []);

  const roleMap = roleList
    ? Object.fromEntries(roleList.map((r) => [r.id, r.name]))
    : {};

  const handleSubmit = async (formData) => {
    try {
      if (selectedEmp)
        await updateEmployee({ id: selectedEmp.id, payload: formData });
      else await createEmployee(formData);
      setModalOpen(false);
      setSelectedEmp(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteData.id);
      setDeleteData({ open: false, id: null, name: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const openCreate = () => {
    setSelectedEmp(null);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setSelectedEmp(emp);
    setModalOpen(true);
  };

  const statusLabel = (emp) =>
    emp.status === "1" ? "Active" : "Inactive";

  const statusClass = (emp) =>
    emp.status === "1"
      ? "text-emerald-700"
      : "text-red-600";

  const renderMobileActions = (emp) => (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full text-violet-600 border-violet-200"
        onClick={() => openEdit(emp)}
      >
        <Pencil className="w-4 h-4 mr-1" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-red-600 border-red-200"
        onClick={() =>
          setDeleteData({ open: true, id: emp.id, name: emp.name })
        }
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>
    </div>
  );

  return (
    <ProtectedRoute featureName={"HRM"} optionName={"Employee List"}>
      <HrmPageContainer className="max-w-7xl">
        <HrmPageHeader title="Employee Management">
          <div className="flex flex-col max-md:gap-2 w-full md:w-auto md:flex-row md:items-center md:gap-2">
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employee..."
                className="pl-8 w-full focus:ring-2 focus:ring-violet-300"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Button
              onClick={openCreate}
              className="bg-violet-600 hover:bg-violet-700 text-white max-md:w-full"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Employee
            </Button>
          </div>
        </HrmPageHeader>

        <Card className="shadow-sm border border-violet-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-center py-10 text-gray-500">
                No employees found
              </p>
            ) : (
              <>
                <section
                  className="md:hidden p-3 space-y-3"
                  aria-label="Employees mobile"
                >
                  {employees.map((emp, index) => (
                    <ReportMobileCard
                      key={emp.id}
                      title={emp.name}
                      subtitle={`#${(currentPage - 1) * PAGE_LIMIT + (index + 1)}`}
                      fields={[
                        {
                          key: "email",
                          label: "Email",
                          value: emp.email || "—",
                          fullWidth: true,
                        },
                        {
                          key: "contact",
                          label: "Contact",
                          value: emp.mobile_number || "—",
                        },
                        {
                          key: "role",
                          label: "Role",
                          value: roleMap[emp.role_id] || "—",
                        },
                        {
                          key: "status",
                          label: "Status",
                          value: statusLabel(emp),
                          valueClassName: statusClass(emp),
                        },
                      ]}
                      footer={
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <img
                              src={emp.emp_image || "/placeholder-user.svg"}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover border"
                            />
                          </div>
                          {renderMobileActions(emp)}
                        </div>
                      }
                    />
                  ))}
                </section>

                <div className="hidden md:block overflow-x-auto m-0">
                  <table className="min-w-full text-sm">
                    <thead className="bg-violet-50 sticky top-0">
                      <tr className="text-left text-gray-600 font-medium">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Photo</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, index) => (
                        <tr
                          key={emp.id}
                          className="hover:bg-violet-50 border-b transition text-gray-700"
                        >
                          <td className="px-3 py-2">
                            {(currentPage - 1) * PAGE_LIMIT + (index + 1)}
                          </td>
                          <td className="px-3 py-2">
                            <img
                              src={emp.emp_image || "/placeholder-user.svg"}
                              alt="emp"
                              className="w-8 h-8 rounded-full object-cover border"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">{emp.name}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {emp.email || "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {emp.mobile_number}
                          </td>
                          <td className="px-3 py-2">
                            {roleMap[emp.role_id] || "—"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                emp.status === "1"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {statusLabel(emp)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(emp)}
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
                                    id: emp.id,
                                    name: emp.name,
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
          title={selectedEmp ? "Edit Employee" : "Add Employee"}
          open={isModalOpen}
          onClose={setModalOpen}
          customDesignFor="employee_modal"
          content={
            <EmployeeForm
              onClose={() => setModalOpen(false)}
              initialData={selectedEmp}
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
