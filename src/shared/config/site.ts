export const siteConfig = {
  name: "LiveSession",
  description:
    "LiveSession — Windows-приложение для репетиций и живых сессий: загрузка аудиодорожек, совмещённая волна с сеткой тактов, синтезируемый метроном и независимый вывод каждого канала на свою пару выходов аудиоустройства.",
  url: "https://livesession.example.com",
  ogImage: "/icon.png",
  appVersion: "1.0.7",
  platform: "Windows",
  downloadUrl: "/#pricing",
  links: {
    github: "https://github.com",
    twitter: "https://twitter.com",
  },
};

export type NavItem = {
  title: string;
  href: string;
};

export const mainNav: NavItem[] = [
  { title: "Возможности", href: "/#features" },
  { title: "Тарифы", href: "/#pricing" },
  { title: "Скачать", href: "/#download" },
  { title: "FAQ", href: "/#faq" },
];

export const accountNav: NavItem[] = [
  { title: "Профиль", href: "/account" },
  { title: "Лицензии", href: "/account/licenses" },
  { title: "Устройства", href: "/account/devices" },
  { title: "Настройки", href: "/account/settings" },
];

export const adminNav: NavItem[] = [
  { title: "Дашборд", href: "/admin" },
  { title: "Пользователи", href: "/admin/users" },
  { title: "Заказы", href: "/admin/orders" },
  { title: "Лицензии", href: "/admin/licenses" },
  { title: "Лимиты", href: "/admin/limits" },
  { title: "Релизы", href: "/admin/releases" },
];

export const siteLinks = {
  account: "/account",
  accountLicenses: "/account/licenses",
  admin: "/admin",
};
