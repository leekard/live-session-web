import type { Metadata } from "next";
import { adminNav } from "@/shared/config/site";
import { PageShell } from "@/widgets";

export const metadata: Metadata = {
  title: "Административная панель",
  robots: { index: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PageShell title="Админ-панель" nav={adminNav}>
      {children}
    </PageShell>
  );
}
