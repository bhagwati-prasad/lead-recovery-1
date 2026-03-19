export type CustomerStatus = "hot" | "warm" | "cold";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  status: CustomerStatus;
  score: number;
}

export interface CustomerListResponse {
  items: Customer[];
  total?: number;
  offset?: number;
  limit?: number;
}

export interface LeadUploadResponse {
  ok: boolean;
  imported: number;
  message?: string;
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type CustomerActionType =
  | "view-detail"
  | "initiate-call"
  | "delete"
  | "edit";
