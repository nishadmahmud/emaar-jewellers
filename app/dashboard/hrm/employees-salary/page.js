"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useGetEmployeeWiseSalesQuery } from "@/apiHooks/hooks/useEmployeeWiseSalesQuery";
import useEmployees from "@/apiHooks/hooks/useEmployeesQuery";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CustomPagination from "@/app/utils/CustomPagination";
import Modal from "@/app/utils/Modal";
import { Loader2, Search, Receipt, User } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import HrmPageContainer from "@/components/hrm/HrmPageContainer";
import HrmPageHeader from "@/components/hrm/HrmPageHeader";
import ReportMobileCard from "@/components/analytics/ReportMobileCard";

const BILLING_MODAL = "billing_modal";

const fmt2 = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toISOStartOfDay = (dateString) => dateString ? `${dateString}T00:00:00.000Z` : "";
const toISOEndOfDay = (dateString) => dateString ? `${dateString}T23:59:59.999Z` : "";

export default function EmployeeSalaryPage() {
    const [page, setPage] = useState(1);
    const limit = 20;
    const [keyword, setKeyword] = useState("");
    const [debounced, setDebounced] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebounced(keyword.trim());
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    // Default to current month
    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [filters, setFilters] = useState({
        start_date: firstDay.toISOString(),
        end_date: lastDay.toISOString(),
    });

    const [dateInput, setDateInput] = useState({
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0]
    });

    // Modal: which employee's sales to show (null = closed)
    const [salesModalEmployee, setSalesModalEmployee] = useState(null);

    const { data: session, status } = useSession();
    const isEmployee = !!session?.isEmployee;
    const employeeId = session?.employee?.id ?? null;

    // When logged in as employee: fetch single employee details
    const { data: singleEmployeeData, isLoading: singleEmpLoading } = useSWR(
        (!!employeeId && isEmployee) ? `/employee/${employeeId}` : null,
        async (url) => {
            const res = await api.get(url);
            return res?.data?.data ?? null;
        }
    );

    // 1. Fetch Employees (Paginated & Searchable) — used only when NOT employee
    const { data: empResult, isLoading: empLoading } = useEmployees({ page, limit, keyword: debounced });
    const employees = isEmployee ? [] : (empResult?.data || []);
    const meta = empResult?.meta || {};

    // 2. Fetch Sales (For aggregation)
    const { data: salesData, isLoading: salesLoading } = useGetEmployeeWiseSalesQuery(
        {
            start_date: filters.start_date,
            end_date: filters.end_date,
            employee_id: isEmployee ? String(employeeId ?? "") : "",
        },
        { skip: status !== "authenticated" }
    );

    // When employee: "my" sales data for the summary card
    const mySalesData = isEmployee ? salesData : null;
    const myIncentiveTotal = useMemo(() => {
        if (!mySalesData?.data || !Array.isArray(mySalesData.data)) return 0;
        return mySalesData.data.reduce((s, r) => s + Number(r?.total_incentive ?? r?.incentive ?? 0), 0);
    }, [mySalesData]);

    // Fetch single employee's sales when modal is open
    const { data: modalSalesData, isLoading: modalSalesLoading } = useGetEmployeeWiseSalesQuery(
        {
            start_date: filters.start_date,
            end_date: filters.end_date,
            employee_id: salesModalEmployee?.id ?? "",
        },
        { skip: !salesModalEmployee }
    );

    // Aggregation Logic
    const aggregatedData = useMemo(() => {
        if (!employees.length) return [];

        const salesByEmployee = {};
        if (salesData?.data && Array.isArray(salesData.data)) {
            salesData.data.forEach(sale => {
                const name = sale.employee_name;
                if (!salesByEmployee[name]) salesByEmployee[name] = 0;
                salesByEmployee[name] += Number(sale.total_incentive || 0);
            });
        }

        return employees.map(emp => {
            const salary = Number(emp.salay_info?.salary || emp.salary_amount || 0);
            const incentive = salesByEmployee[emp.name] || 0;
            return {
                ...emp,
                salary,
                incentive,
                payable: salary + incentive
            };
        });
    }, [employees, salesData]);

    const handleFilterApply = () => {
        setFilters({
            start_date: toISOStartOfDay(dateInput.start),
            end_date: toISOEndOfDay(dateInput.end)
        });
    };

    const isLoading = isEmployee ? singleEmpLoading || salesLoading : (empLoading || salesLoading);

    // Single-employee view (when logged in as employee)
    if (isEmployee) {
        const emp = singleEmployeeData;
        const baseSalary = Number(emp?.salary_amount ?? emp?.salay_info?.salary ?? 0);
        const incentive = myIncentiveTotal;
        const payable = baseSalary + incentive;

        return (
            <ProtectedRoute featureName="HRM" optionName="Employees Salary">
                <HrmPageContainer className="max-w-2xl">
                    <Card>
                        <CardHeader className="flex flex-col max-md:gap-3 sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                My Salary & Incentives
                            </CardTitle>
                            <div className="flex flex-col max-md:w-full sm:flex-row flex-wrap gap-2 items-end w-full">
                                <div className="w-full sm:w-auto">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="h-9 w-full"
                                        value={dateInput.start}
                                        onChange={(e) => setDateInput(prev => ({ ...prev, start: e.target.value }))}
                                    />
                                </div>
                                <div className="w-full sm:w-auto">
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                        type="date"
                                        className="h-9 w-full"
                                        value={dateInput.end}
                                        onChange={(e) => setDateInput(prev => ({ ...prev, end: e.target.value }))}
                                    />
                                </div>
                                <Button size="sm" onClick={handleFilterApply} className="max-md:w-full">Apply</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                            ) : emp ? (
                                <div className="space-y-6">
                                    <div className="rounded-lg border bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">Employee</p>
                                        <p className="text-lg font-semibold">{emp.name}</p>
                                        <p className="text-sm text-gray-500">{emp.designation_info?.name || emp.employee_id || "—"}</p>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-lg border p-4">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Base Salary</p>
                                            <p className="text-xl font-bold mt-1">{fmt2(baseSalary)} BDT</p>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Incentive</p>
                                            <p className="text-xl font-bold mt-1">{fmt2(incentive)} BDT</p>
                                        </div>
                                        <div className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Payable</p>
                                            <p className="text-xl font-bold mt-1">{fmt2(payable)} BDT</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end max-md:justify-stretch">
                                        <Button
                                            variant="outline"
                                            className="max-md:w-full"
                                            onClick={() => setSalesModalEmployee({ id: emp.id, name: emp.name })}
                                        >
                                            <Receipt className="h-4 w-4 mr-2" />
                                            View Sale
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Unable to load your details.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Modal
                        title={`Sales — ${salesModalEmployee?.name ?? ""}`}
                        open={!!salesModalEmployee}
                        onClose={() => setSalesModalEmployee(null)}
                        Icon={Receipt}
                        customDesignFor={BILLING_MODAL}
                        content={
                            salesModalEmployee && (
                                <EmployeeSalesModalContent
                                    data={modalSalesData}
                                    isLoading={modalSalesLoading}
                                    employeeName={salesModalEmployee.name}
                                />
                            )
                        }
                    />
                </HrmPageContainer>
            </ProtectedRoute>
        );
    }

    // Admin: full table view
    return (
        <ProtectedRoute featureName="HRM" optionName="Employees Salary">
            <HrmPageContainer className="max-w-7xl">
                <HrmPageHeader title="Employees Salary & Incentives">
                    <div className="flex flex-col max-md:gap-3 w-full md:w-auto md:flex-row md:items-end md:gap-4">
                        <div className="relative w-full md:w-60">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search employee..."
                                className="pl-8 w-full"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col max-md:w-full sm:flex-row gap-2 items-end">
                            <div className="w-full sm:w-auto">
                                <Label className="text-xs">Start Date</Label>
                                <Input
                                    type="date"
                                    className="h-9 w-full"
                                    value={dateInput.start}
                                    onChange={(e) => setDateInput(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </div>
                            <div className="w-full sm:w-auto">
                                <Label className="text-xs">End Date</Label>
                                <Input
                                    type="date"
                                    className="h-9 w-full"
                                    value={dateInput.end}
                                    onChange={(e) => setDateInput(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                            <Button size="sm" onClick={handleFilterApply} className="max-md:w-full">
                                Filter
                            </Button>
                        </div>
                    </div>
                </HrmPageHeader>

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : (
                            <>
                                <section
                                    className="md:hidden p-3 space-y-3"
                                    aria-label="Employee salary mobile"
                                >
                                    {aggregatedData.length > 0 ? (
                                        aggregatedData.map((row) => (
                                            <ReportMobileCard
                                                key={row.id}
                                                title={row.name}
                                                subtitle={row.designation_info?.name || "—"}
                                                fields={[
                                                    {
                                                        key: "salary",
                                                        label: "Base Salary",
                                                        value: `${fmt2(row.salary)} BDT`,
                                                    },
                                                    {
                                                        key: "incentive",
                                                        label: "Incentive",
                                                        value: `${fmt2(row.incentive)} BDT`,
                                                    },
                                                    {
                                                        key: "payable",
                                                        label: "Payable",
                                                        value: `${fmt2(row.payable)} BDT`,
                                                        valueClassName: "text-violet-700 font-bold",
                                                        fullWidth: true,
                                                    },
                                                ]}
                                                footer={
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() =>
                                                            setSalesModalEmployee({
                                                                id: row.id,
                                                                name: row.name,
                                                            })
                                                        }
                                                    >
                                                        View Sale
                                                    </Button>
                                                }
                                            />
                                        ))
                                    ) : (
                                        <p className="text-center py-8 text-gray-500 text-sm">
                                            No employees found.
                                        </p>
                                    )}
                                </section>

                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee Name</TableHead>
                                                <TableHead>Designation</TableHead>
                                                <TableHead className="text-right">Base Salary</TableHead>
                                                <TableHead className="text-right">Total Incentive</TableHead>
                                                <TableHead className="text-right">Payable Amount</TableHead>
                                                <TableHead className="text-center">Show Sales</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aggregatedData.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell className="font-medium">{row.name}</TableCell>
                                                    <TableCell>{row.designation_info?.name || "-"}</TableCell>
                                                    <TableCell className="text-right">{fmt2(row.salary)}</TableCell>
                                                    <TableCell className="text-right">{fmt2(row.incentive)}</TableCell>
                                                    <TableCell className="text-right font-bold">{fmt2(row.payable)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setSalesModalEmployee({
                                                                    id: row.id,
                                                                    name: row.name,
                                                                })
                                                            }
                                                        >
                                                            View Sale
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {!aggregatedData.length && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center">
                                                        No employees found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {meta?.last_page > 1 && (
                                    <div className="mt-4 flex flex-col max-md:items-stretch max-md:px-3 max-md:pb-4 justify-center md:px-6 md:pb-6">
                                        <CustomPagination
                                            totalPage={meta.last_page}
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
                    title={`Sales — ${salesModalEmployee?.name ?? ""}`}
                    open={!!salesModalEmployee}
                    onClose={() => setSalesModalEmployee(null)}
                    Icon={Receipt}
                    customDesignFor={BILLING_MODAL}
                    content={
                        salesModalEmployee && (
                            <EmployeeSalesModalContent
                                data={modalSalesData}
                                isLoading={modalSalesLoading}
                                employeeName={salesModalEmployee.name}
                            />
                        )
                    }
                />
            </HrmPageContainer>
        </ProtectedRoute>
    );
}

function EmployeeSalesModalContent({ data, isLoading, employeeName }) {
    const rows = useMemo(() => {
        const list = Array.isArray(data?.data) ? data.data : [];
        return list.map((r) => ({
            date: r?.date || "",
            invoiceId: r?.invoice_id || "",
            products: r?.product_names || "",
            saleAmount: Number(r?.paid_amount ?? r?.sale_amount ?? 0),
            incentive: Number(r?.total_incentive ?? r?.incentive ?? 0),
        }));
    }, [data]);
    const totalSale = rows.reduce((s, r) => s + r.saleAmount, 0);
    const totalIncentives = rows.reduce((s, r) => s + r.incentive, 0);

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <>
                    <section className="md:hidden space-y-3" aria-label="Sales mobile">
                        {rows.length > 0 ? (
                            rows.map((r, i) => (
                                <ReportMobileCard
                                    key={`${r.invoiceId}-${i}`}
                                    title={r.invoiceId || "Sale"}
                                    subtitle={r.date || "—"}
                                    fields={[
                                        {
                                            key: "products",
                                            label: "Products",
                                            value: r.products || "—",
                                            fullWidth: true,
                                        },
                                        {
                                            key: "sale",
                                            label: "Sale (BDT)",
                                            value: fmt2(r.saleAmount),
                                        },
                                        {
                                            key: "incentive",
                                            label: "Incentive (BDT)",
                                            value: fmt2(r.incentive),
                                        },
                                    ]}
                                />
                            ))
                        ) : (
                            <p className="text-center text-gray-500 text-sm py-6">
                                No sales found for this period.
                            </p>
                        )}
                    </section>

                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Voucher / Invoice</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead className="text-right">Sale (BDT)</TableHead>
                                    <TableHead className="text-right">Incentive (BDT)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{r.date}</TableCell>
                                        <TableCell>{r.invoiceId}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={r.products}>
                                            {r.products || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">{fmt2(r.saleAmount)}</TableCell>
                                        <TableCell className="text-right">{fmt2(r.incentive)}</TableCell>
                                    </TableRow>
                                ))}
                                {!rows.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-gray-500">
                                            No sales found for this period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {rows.length > 0 && (
                        <div className="flex flex-col max-md:items-stretch sm:items-end gap-1 border-t pt-3 text-sm">
                            <span className="font-semibold">Total Sale: {fmt2(totalSale)} BDT</span>
                            <span className="font-semibold">Total Incentives: {fmt2(totalIncentives)} BDT</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
