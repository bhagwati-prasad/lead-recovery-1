import type { Customer, CustomerStatus } from "./types";

export function filterCustomers(
  customers: Customer[],
  search?: string,
  status?: CustomerStatus | "all"
): Customer[] {
  return customers.filter((customer) => {
    // Status filter
    if (status && status !== "all" && customer.status !== status) {
      return false;
    }

    // Search filter (name, phone, status)
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = customer.name.toLowerCase().includes(searchLower);
      const matchesPhone = customer.phone.includes(searchLower);
      const matchesStatus = customer.status.includes(searchLower);

      if (!matchesName && !matchesPhone && !matchesStatus) {
        return false;
      }
    }

    return true;
  });
}

export function getStatusBadgeColor(status: CustomerStatus): string {
  switch (status) {
    case "hot":
      return "badge-danger";
    case "warm":
      return "badge-warning";
    case "cold":
      return "badge-info";
    default:
      return "badge-default";
  }
}

export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");

  // If 10 digits, format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // If 11 digits starting with 1, format as +1 (XXX) XXX-XXXX
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if not standard format
  return phone;
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export async function validateUploadFile(file: File): Promise<{ valid: boolean; error?: string }> {
  const maxSize = 10 * 1024 * 1024; // 10 MB
  const allowedTypes = [
    "text/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  const allowedExtensions = [".csv", ".json", ".xlsx", ".xls"];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than 10 MB (current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    };
  }

  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some((ext) => file.name.endsWith(ext));

  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: "Please upload a CSV, JSON, or XLSX file",
    };
  }

  return { valid: true };
}
