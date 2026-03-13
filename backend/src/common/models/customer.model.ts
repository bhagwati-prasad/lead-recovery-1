export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}