import Link from "next/link";
import Image from "next/image";
import { mainNav, siteConfig, siteLinks } from "@/shared/config/site";
import { getSession } from "@/shared/lib/auth";
import { Button, Container } from "@/shared/ui";
import { LogoutButton } from "./LogoutButton";

export async function SiteHeader() {
  const { user } = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-background/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-zinc-50"
        >
          <Image
            src="/icon.png"
            alt="LiveSession"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                href={user.role === "admin" ? siteLinks.admin : siteLinks.account}
                variant="ghost"
                size="sm"
              >
                Профиль
              </Button>
              <LogoutButton />
            </>
          ) : (
            <Button href={siteLinks.account} variant="ghost" size="sm">
              Войти
            </Button>
          )}
          <Button href="/#pricing" size="sm">
            Купить
          </Button>
        </div>
      </Container>
    </header>
  );
}
