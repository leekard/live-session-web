export type User = {
  id: number;
  email: string;
  role: "user" | "admin";
};

export type License = {
  id: number;
  user_id: number;
  plan: "free" | "basic" | "pro" | "team";
  status: "active" | "expired" | "revoked";
  license_key?: string;
  device_id: string | null;
  activated_at: string | null;
  expires_at: string | null;
};

export type Order = {
  id: number;
  user_id: number;
  plan: "free" | "basic" | "pro" | "team";
  amount: string;
  currency: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  created_at: string;
};

export type DashboardStats = {
  users: number;
  licensesByStatus: Record<string, number>;
  licensesByPlan: Record<string, number>;
  revenue: number;
};

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};
