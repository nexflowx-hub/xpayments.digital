"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  backgroundColor: "oklch(0.2 0.016 255 / 0.95)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "#e4e4e7",
  backdropFilter: "blur(8px)",
};

const axisStyle = {
  fontSize: 11,
  fill: "oklch(0.68 0.02 255)",
};

const CHART_COLORS = [
  "oklch(0.62 0.21 258)",
  "oklch(0.70 0.17 158)",
  "oklch(0.78 0.16 78)",
  "oklch(0.66 0.20 300)",
  "oklch(0.68 0.20 20)",
  "oklch(0.72 0.15 200)",
];

export function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span>{p.name}:</span>
          <span className="font-medium text-foreground">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaTrend({
  data,
  dataKey = "value",
  xKey = "date",
  color = "oklch(0.62 0.21 258)",
  height = 240,
  formatter,
  className,
}: {
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  formatter?: (v: number) => string;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => (formatter ? formatter(v) : v)}
          />
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineTrend({
  data,
  lines,
  xKey = "date",
  height = 240,
  formatter,
  className,
}: {
  data: any[];
  lines: { key: string; color: string; name?: string }[];
  xKey?: string;
  height?: number;
  formatter?: (v: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (formatter ? formatter(v) : v)} />
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {lines.map((l, i) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name ?? l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarTrend({
  data,
  dataKey,
  xKey = "date",
  color = "oklch(0.62 0.21 258)",
  height = 240,
  formatter,
  className,
  stacked,
}: {
  data: any[];
  dataKey: string | { key: string; color: string; name?: string }[];
  xKey?: string;
  color?: string;
  height?: number;
  formatter?: (v: number) => string;
  className?: string;
  stacked?: boolean;
}) {
  const bars = Array.isArray(dataKey) ? dataKey : [{ key: dataKey, color, name: dataKey }];
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (formatter ? formatter(v) : v)} />
          <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.04)" }} content={<ChartTooltip formatter={formatter} />} />
          {bars.map((b, i) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name ?? b.key}
              fill={b.color}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? "a" : undefined}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  height = 240,
  formatter,
  className,
}: {
  data: { name: string; value: number }[];
  height?: number;
  formatter?: (v: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "oklch(0.68 0.02 255)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export { CHART_COLORS };
