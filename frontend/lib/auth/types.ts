export type Role = "admin" | "sales_manager" | "readonly";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type Session = {
  token: string;
  user: AuthUser;
  role: Role;
};
