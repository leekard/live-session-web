import type {
  LicenseStatus,
  OrderStatus,
  PlanType,
  Role,
} from "./types";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanType;
  createdAt: string;
};

export type License = {
  id: string;
  userId: string;
  plan: PlanType;
  status: LicenseStatus;
  activatedOn: string;
  expiresOn: string | null;
};

export type Order = {
  id: string;
  userId: string;
  plan: PlanType;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
};

export const currentUser: User = {
  id: "usr_1",
  name: "Иван Петров",
  email: "ivan@example.com",
  role: "user",
  plan: "pro",
  createdAt: "2026-01-12T10:00:00Z",
};

export const myLicense: License = {
  id: "lic_1001",
  userId: "usr_1",
  plan: "pro",
  status: "active",
  activatedOn: "2026-02-03T00:00:00Z",
  expiresOn: "2027-02-03T00:00:00Z",
};

export const users: User[] = [
  currentUser,
  {
    id: "usr_2",
    name: "Анна Смирнова",
    email: "anna@example.com",
    role: "user",
    plan: "basic",
    createdAt: "2026-03-01T08:30:00Z",
  },
  {
    id: "usr_3",
    name: "Пётр Волков",
    email: "petr@example.com",
    role: "user",
    plan: "free",
    createdAt: "2026-04-15T11:20:00Z",
  },
  {
    id: "usr_4",
    name: "Мария Козлова",
    email: "maria@example.com",
    role: "admin",
    plan: "team",
    createdAt: "2026-02-20T09:45:00Z",
  },
];

export const licenses: License[] = [
  myLicense,
  {
    id: "lic_1002",
    userId: "usr_2",
    plan: "basic",
    status: "active",
    activatedOn: "2026-03-02T00:00:00Z",
    expiresOn: "2026-09-02T00:00:00Z",
  },
  {
    id: "lic_1003",
    userId: "usr_2",
    plan: "basic",
    status: "expired",
    activatedOn: "2025-09-02T00:00:00Z",
    expiresOn: "2026-03-02T00:00:00Z",
  },
  {
    id: "lic_1004",
    userId: "usr_3",
    plan: "free",
    status: "active",
    activatedOn: "2026-04-15T00:00:00Z",
    expiresOn: null,
  },
];

export const orders: Order[] = [
  {
    id: "ord_9001",
    userId: "usr_1",
    plan: "pro",
    amount: 5900,
    currency: "RUB",
    status: "paid",
    createdAt: "2026-02-03T00:00:00Z",
  },
  {
    id: "ord_9002",
    userId: "usr_2",
    plan: "basic",
    amount: 2900,
    currency: "RUB",
    status: "paid",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "ord_9003",
    userId: "usr_3",
    plan: "free",
    amount: 0,
    currency: "RUB",
    status: "pending",
    createdAt: "2026-04-20T14:00:00Z",
  },
  {
    id: "ord_9004",
    userId: "usr_1",
    plan: "basic",
    amount: 2900,
    currency: "RUB",
    status: "refunded",
    createdAt: "2026-01-20T09:00:00Z",
  },
];
