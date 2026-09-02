import type { Metadata } from "next";
import { accountNav } from "@/shared/config/site";
import { getSession } from "@/shared/lib/auth";
import { PageShell } from "@/widgets";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false },
};

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await getSession();
  const nav = user?.role === "admin"
    ? [...accountNav, { title: "Админ-панель", href: "/admin" }]
    : accountNav;

  return (
    <PageShell title="Личный кабинет" nav={nav}>
      {children}
    </PageShell>
  );
}
