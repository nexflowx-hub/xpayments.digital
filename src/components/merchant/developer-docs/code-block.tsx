"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type CodeSnippet = {
  lang: string;
  label: string;
  code: string;
};

interface CodeBlockSingleProps {
  code: string;
  lang?: string;
}

export function CodeBlock({ code, lang }: CodeBlockSingleProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        toast.success("Copiado");
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-black/50">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {lang || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex h-6 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="scrollbar-thin overflow-x-auto p-4 text-xs leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface CodeBlockMultiProps {
  snippets: CodeSnippet[];
}

export function CodeBlockMulti({ snippets }: CodeBlockMultiProps) {
  const defaultLang = snippets[0]?.lang || "bash";
  return (
    <Tabs defaultValue={defaultLang}>
      <TabsList className="mb-0 h-9 rounded-b-none border border-b-0 border-border/60 bg-black/50 px-1">
        {snippets.map((s) => (
          <TabsTrigger
            key={s.lang}
            value={s.lang}
            className="gap-1.5 rounded-none border-b-2 border-transparent px-3 text-[11px] data-[state=active]:border-primary data-[state=active]:bg-black/30 data-[state=active]:text-foreground"
          >
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {snippets.map((s) => (
        <TabsContent key={s.lang} value={s.lang} className="mt-0">
          <CodeBlock code={s.code} lang={s.lang} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/* ---------- Shared snippet builders ---------- */

const BASE_URL = "https://api.xpayments.digital/api/v1";

export function curlSnippet(
  endpoint: string,
  body: Record<string, unknown>,
  extraHeaders?: string
): CodeSnippet {
  const headerLines = [
    `  -H "Authorization: Bearer xp_live_xxxxxxxxx"`,
    `  -H "Content-Type: application/json"`,
  ];
  if (extraHeaders) headerLines.push(`  -H "${extraHeaders}"`);
  return {
    lang: "bash",
    label: "cURL",
    code: `curl -X POST \\
  ${BASE_URL}${endpoint} \\
${headerLines.join(" \\ \n")} \\
  -d '${JSON.stringify(body, null, 2)}'`,
  };
}

export function nodeSnippet(
  endpoint: string,
  body: Record<string, unknown>,
  extraHeaders?: string
): CodeSnippet {
  const headers: Record<string, string> = {
    Authorization: "`Bearer ${process.env.XPAYMENTS_API_KEY}`",
    "Content-Type": "application/json",
  };
  if (extraHeaders) headers[extraHeaders.split(":")[0].trim()] = extraHeaders.split(":").slice(1).join(":").trim();
  return {
    lang: "javascript",
    label: "Node.js",
    code: `const response = await fetch(
  "${BASE_URL}${endpoint}",
  {
    method: "POST",
    headers: ${JSON.stringify(headers, null, 6)},
    body: JSON.stringify(${JSON.stringify(body, null, 6)})
  }
);
const payment = await response.json();`,
  };
}

export function phpSnippet(
  endpoint: string,
  body: Record<string, unknown>,
  extraHeaders?: string
): CodeSnippet {
  const headerArr = [
    "'Authorization: Bearer ' . getenv('XPAYMENTS_API_KEY')",
    "'Content-Type: application/json'",
  ];
  if (extraHeaders) headerArr.push(`'${extraHeaders}'`);
  return {
    lang: "php",
    label: "PHP",
    code: `$ch = curl_init('${BASE_URL}${endpoint}');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    ${headerArr.join(",\n    ")}
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${JSON.stringify(body, null, 4)}));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$payment = json_decode($response, true);`,
  };
}

export function buildSnippets(
  endpoint: string,
  body: Record<string, unknown>,
  extraHeaders?: string
): CodeSnippet[] {
  return [curlSnippet(endpoint, body, extraHeaders), nodeSnippet(endpoint, body, extraHeaders), phpSnippet(endpoint, body, extraHeaders)];
}

/* ---------- Inline code ---------- */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-primary">
      {children}
    </code>
  );
}

/* ---------- HTTP Method Badge ---------- */
export function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET: "border-sky-500/25 bg-sky-500/10 text-sky-400",
    POST: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    PUT: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    DELETE: "border-rose-500/25 bg-rose-500/10 text-rose-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
        colorMap[method.toUpperCase()] || colorMap.POST
      )}
    >
      {method.toUpperCase()}
    </span>
  );
}

/* ---------- Callout boxes ---------- */
export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "warning" | "security";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      border: "border-sky-500/25",
      bg: "bg-sky-500/5",
      icon: "text-sky-400",
      title: "text-sky-300",
    },
    warning: {
      border: "border-amber-500/25",
      bg: "bg-amber-500/5",
      icon: "text-amber-400",
      title: "text-amber-300",
    },
    security: {
      border: "border-rose-500/25",
      bg: "bg-rose-500/5",
      icon: "text-rose-400",
      title: "text-rose-300",
    },
  };
  const s = styles[variant];
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", s.border, s.bg)}>
      <div className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2", s.border, s.icon, variant === "security" && "flex items-center justify-center")}>
        {variant === "security" && <span className="text-[8px] font-bold">!</span>}
      </div>
      <div>
        <p className={cn("text-sm font-medium", s.title)}>{title}</p>
        <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Param table ---------- */
export function ParamTable({
  rows,
}: {
  rows: {
    name: string;
    type: string;
    required: "Obrigat\u00f3rio" | "Recomendado" | "Opcional" | "Conforme m\u00e9todo";
    desc: string;
  }[];
}) {
  const reqStyle = (r: string) => {
    if (r === "Obrigat\u00f3rio")
      return "border-rose-500/25 bg-rose-500/10 text-rose-400";
    if (r === "Recomendado")
      return "border-amber-500/25 bg-amber-500/10 text-amber-400";
    return "border-border/60 bg-muted/30 text-muted-foreground";
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Par\u00e2metro</th>
            <th className="px-4 py-2 font-medium">Tipo</th>
            <th className="px-4 py-2 font-medium">Obrigat\u00f3rio</th>
            <th className="px-4 py-2 font-medium">Descri\u00e7\u00e3o</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/30">
              <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.name}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.type}</td>
              <td className="px-4 py-2.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                    reqStyle(r.required)
                  )}
                >
                  {r.required}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Doc Section ---------- */
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export function DocSection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="scroll-mt-24"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

/* ---------- Sub-heading ---------- */
export function SubHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="mt-6 scroll-mt-24 border-b border-border/40 pb-2 text-sm font-semibold tracking-tight"
    >
      {children}
    </h3>
  );
}

/* ---------- Status badge ---------- */
export function StatusBadge({ children, variant = "available" }: { children: React.ReactNode; variant?: "available" | "store" | "new" }) {
  const styles = {
    available: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    store: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    new: "border-violet-500/25 bg-violet-500/10 text-violet-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}
