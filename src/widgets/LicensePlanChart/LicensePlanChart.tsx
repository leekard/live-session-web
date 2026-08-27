"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { licenses } from "@/shared/mock/data";
import type { PlanType } from "@/shared/mock/types";

const planLabel: Record<PlanType, string> = {
  free: "Бесплатный",
  basic: "Базовый",
  pro: "Профессиональный",
  team: "Командный",
};

const planColor: Record<PlanType, string> = {
  free: "#52525b",
  basic: "#748bd5",
  pro: "#ff832b",
  team: "#8a9ee0",
};

export function LicensePlanChart() {
  const data = (Object.keys(planLabel) as PlanType[]).map((plan) => ({
    name: planLabel[plan],
    value: licenses.filter((l) => l.plan === plan).length,
    color: planColor[plan],
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#ffffff",
            }}
            itemStyle={{ color: "#ffffff" }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ color: "#a1a1aa", fontSize: "14px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
