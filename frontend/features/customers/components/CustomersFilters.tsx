"use client";

import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CustomerStatus, CustomerFilters } from "../types";

type CustomersFiltersProps = {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
};

export function CustomersFilters({ filters, onFiltersChange }: CustomersFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        search: e.target.value || undefined,
        page: 1, // Reset to first page on search
      });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const status = e.target.value as CustomerStatus | "all" | undefined;
      onFiltersChange({
        ...filters,
        status: status || "all",
        page: 1,
      });
    },
    [filters, onFiltersChange]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All Statuses" },
      { value: "hot", label: "Hot" },
      { value: "warm", label: "Warm" },
      { value: "cold", label: "Cold" },
    ],
    []
  );

  return (
    <div className="customers-filters">
      <Input
        id="search-customers"
        label="Search"
        placeholder="Name, phone, or status..."
        value={filters.search || ""}
        onChange={handleSearchChange}
        hint="Search across customer name, phone, and status"
      />
      <Select
        id="status-filter"
        label="Status"
        options={statusOptions}
        value={filters.status || "all"}
        onChange={handleStatusChange}
      />
    </div>
  );
}
