"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomersFilters } from "@/features/customers/components/CustomersFilters";
import { CustomersTable } from "@/features/customers/components/CustomersTable";
import { LeadUploadArea } from "@/features/customers/components/LeadUploadArea";
import {
  getCustomers,
  uploadLeads,
  initiateCall,
} from "@/features/customers/api";
import { logClientEvent } from "@/lib/telemetry/client";
import type { Customer, CustomerFilters, CustomerActionType } from "@/features/customers/types";
import { Card } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { ErrorDisplay } from "@/components/ui/error-display";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: undefined,
    status: "all",
    page: 1,
    pageSize: 50,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadLoading, setIsUploadLoading] = useState(false);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCustomers(filters);
      setCustomers(data);
      logClientEvent({
        type: "customers_list_loaded",
        count: data.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load customers";
      setError(message);
      logClientEvent({
        type: "customers_list_error",
        error: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Apply local filters
  useEffect(() => {
    const filtered = customers.filter((customer) => {
      // Status filter
      if (filters.status && filters.status !== "all" && customer.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = customer.name.toLowerCase().includes(searchLower);
        const matchesPhone = customer.phone.includes(searchLower);
        const matchesStatus = customer.status.includes(searchLower);
        return matchesName || matchesPhone || matchesStatus;
      }

      return true;
    });

    setFilteredCustomers(filtered);
  }, [customers, filters]);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleFiltersChange = useCallback((newFilters: CustomerFilters) => {
    setFilters(newFilters);
  }, []);

  const handleAction = useCallback(
    async (customer: Customer, action: CustomerActionType) => {
      try {
        setIsActionLoading(true);

        switch (action) {
          case "view-detail":
            logClientEvent({
              type: "customer_detail_opened",
              customerId: customer.id,
            });
            router.push(`/customers/${customer.id}`);
            break;

          case "initiate-call":
            logClientEvent({
              type: "call_initiated",
              customerId: customer.id,
              phone: customer.phone,
            });
            await initiateCall(customer.phone);
            console.log(`Call initiated for ${customer.name} at ${customer.phone}`);
            break;

          default:
            console.warn(`Unknown action: ${action}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
        logClientEvent({
          type: "customer_action_error",
          action,
          customerId: customer.id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsActionLoading(false);
      }
    },
    [router]
  );

  const handleUpload = useCallback(async (file: File) => {
    try {
      setIsUploadLoading(true);
      const result = await uploadLeads(file);
      logClientEvent({
        type: "leads_uploaded",
        fileName: file.name,
        imported: result.imported,
      });
      await fetchCustomers();
    } catch (err) {
      throw err;
    } finally {
      setIsUploadLoading(false);
    }
  }, [fetchCustomers]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error && customers.length === 0) {
    return (
      <div className="customers-page">
        <h1>Customers</h1>
        <ErrorDisplay title="Failed to load customers" message={error} retry={fetchCustomers} />
      </div>
    );
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <h1>Customers</h1>
        <p className="customers-subtitle">{filteredCustomers.length} customers</p>
      </div>

      <div className="customers-layout">
        <div className="customers-main">
          <CustomersFilters filters={filters} onFiltersChange={handleFiltersChange} />

          {error && (
            <div className="customers-error" role="alert">
              <strong>Warning:</strong> {error}
            </div>
          )}

          {filteredCustomers.length === 0 ? (
            <Empty
              title="No customers found"
              description="Try adjusting your filters or import new leads"
            />
          ) : (
            <Card title={`Results (${filteredCustomers.length})`}>
              <CustomersTable
                customers={filteredCustomers}
                isLoading={isActionLoading}
                onAction={handleAction}
              />
            </Card>
          )}
        </div>

        <aside className="customers-sidebar">
          <LeadUploadArea onUpload={handleUpload} isLoading={isUploadLoading} />
        </aside>
      </div>
    </div>
  );
}
