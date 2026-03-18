"use client";

import React from "react";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusBadgeColor, formatPhone, formatScore } from "../utils";
import type { Customer, CustomerActionType } from "../types";

type CustomersTableProps = {
  customers: Customer[];
  isLoading?: boolean;
  onAction: (customer: Customer, action: CustomerActionType) => void;
};

export function CustomersTable({
  customers,
  isLoading = false,
  onAction,
}: CustomersTableProps) {
  return (
    <Table
      columns={[
        {
          key: "name",
          header: "Name",
          render: (customer: Customer) => customer.name,
        },
        {
          key: "phone",
          header: "Phone",
          render: (customer: Customer) => formatPhone(customer.phone),
        },
        {
          key: "status",
          header: "Status",
          render: (customer: Customer) => (
            <Badge variant={getStatusBadgeColor(customer.status) as any}>
              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </Badge>
          ),
        },
        {
          key: "score",
          header: "Score",
          render: (customer: Customer) => formatScore(customer.score),
          cellClassName: "text-right",
        },
        {
          key: "actions",
          header: "Actions",
          render: (customer: Customer) => (
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAction(customer, "view-detail")}
                disabled={isLoading}
              >
                View
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onAction(customer, "initiate-call")}
                disabled={isLoading}
              >
                Call
              </Button>
            </div>
          ),
        },
      ]}
      data={customers}
      getRowKey={(customer) => customer.id}
      emptyText="No customers found. Try adjusting your filters or upload leads."
      caption="Customer list with contact info and conversion scores"
    />
  );
}
