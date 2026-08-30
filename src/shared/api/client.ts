import type { DashboardStats, License, Order, User } from "./types";

const backendUrl = process.env.BACKEND_URL || "http://api:3001";
const cookieName = process.env.COOKIE_NAME || "livesession_auth";

export async function me(cookie: string | undefined): Promise<User | null> {
  if (!cookie) return null;
  const res = await fetch(`${backendUrl}/api/auth/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json();
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

export async function adminUsers(cookie: string | undefined): Promise<{ id: number; email: string; role: string; created_at: string }[]> {
  if (!cookie) return [];
  const res = await fetch(`${backendUrl}/api/admin/users`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body.ok ? (body.users as any[]) : [];
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

export { cookieName };
