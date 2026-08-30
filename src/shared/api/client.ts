import type { AdminUser, DashboardStats, Device, License, Order, PlanLimit, User } from "./types";

const backendUrl = process.env.BACKEND_URL || "http://api:3001";
const cookieName = process.env.COOKIE_NAME || "livesession_auth";

export async function me(cookie: string | undefined): Promise<User | null> {
  if (!cookie) return null;
  const res = await fetch(`${backendUrl}/api/auth/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[me] NOT OK status=", res.status, "cookieLen=", cookie.length, "backend=", backendUrl);
    return null;
  }
  const body = await res.json();
  console.error("[me] status=", res.status, "bodyOk=", body?.ok, "user=", body?.user?.email || "NULL", "error=", body?.error || body?.message || "none");
  return body.ok ? (body.user as User) : null;
}

export async function myLicenses(cookie: string | undefined): Promise<License[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/licenses/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.licenses as License[]) : [];
}

export async function myOrders(cookie: string | undefined): Promise<Order[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/orders/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.orders as Order[]) : [];
}

export async function myDevices(cookie: string | undefined): Promise<Device[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/devices`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.devices as Device[]) : [];
}

export async function adminUsers(cookie: string | undefined): Promise<AdminUser[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/admin/users`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.users as AdminUser[]) : [];
}

export async function adminLicenses(cookie: string | undefined): Promise<License[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/licenses`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.licenses as License[]) : [];
}

export async function adminOrders(cookie: string | undefined): Promise<Order[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/orders`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.orders as Order[]) : [];
}

export async function adminStats(cookie: string | undefined): Promise<DashboardStats | null> {
  if (!cookie) return null;
  const res = await fetch(`${backendUrl}/api/orders/stats`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.ok ? (body.stats as DashboardStats) : null;
}

export async function adminPlanLimits(cookie: string | undefined): Promise<PlanLimit[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/admin/plan-limits`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.limits as PlanLimit[]) : [];
}

export { cookieName };
