import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { me, cookieName, adminStats } from "@/shared/api/client";
import type { User } from "@/shared/api/types";

export async function getSession(): Promise<{ user: User | null; cookie: string | undefined }> {
  const store = await cookies();
  const cookie = store.get(cookieName)?.value;
  const user = await me(cookie);
  return { user, cookie };
}

export async function requireUser(): Promise<{ user: User; cookie: string | undefined }> {
  const { user, cookie } = await getSession();
  if (!user) redirect("/login");
  return { user, cookie };
}

export async function requireAdmin(): Promise<{ user: User; cookie: string | undefined }> {
  const { user, cookie } = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/account");
  return { user, cookie };
}

export { adminStats };
