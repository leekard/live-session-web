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

export type Device = {
  deviceId: string;
  name: string | null;
  status: "active" | "revoked";
  lastSeenAt: string | null;
  createdAt: string;
  license: { plan: License["plan"]; status: string; activatedAt: string | null } | null;
};

export type PlanLimit = {
  plan: string;
  device_limit: number;
  updated_at: string;
};

export type Release = {
  id: number;
  version: string;
  file_name: string;
  file_size: number;
  notes: string | null;
  published: boolean;
  created_at: string;
  published_at: string | null;
};
