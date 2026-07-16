"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, Palette, ShieldCheck, Code2, Bell, CreditCard, ScrollText,
  Users, Lock, Plus, Copy, Check, Upload, Trash2, Monitor, Smartphone,
  Crown, Shield, Eye, Database, Mail, AlertTriangle, CheckCircle2, LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/shared";
import { useT } from "@/lib/i18n";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/stores/auth";
import { API_BASE_URL, COUNTRY_LIST } from "@/config";
import { cn, formatDate, initials } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "api", label: "API", icon: Code2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "compliance", label: "Compliance", icon: ScrollText },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: Lock },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const t = useT();
  const [active, setActive] = React.useState<TabId>("company");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.settings")}
        description="Manage your merchant account, branding, security and team."
      />
      <Tabs value={active} onValueChange={(v) => setActive(v as TabId)} className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <TabsList className="flex h-fit flex-col gap-1 self-start bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={cn(
                "flex w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium data-[state=active]:border-border/60 data-[state=active]:bg-card/80 data-[state=active]:shadow-sm",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-w-0">
          <TabsContent value="company"><CompanyTab /></TabsContent>
          <TabsContent value="brand"><BrandTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          <TabsContent value="api"><ApiTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="billing"><BillingTab /></TabsContent>
          <TabsContent value="compliance"><ComplianceTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="roles"><RolesTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ---------- Company ----------
const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  website: z.string().url("Enter a valid URL (https://…)"),
  country: z.string().min(1, "Select a country"),
  industry: z.string().min(1, "Select an industry"),
  supportEmail: z.string().email("Enter a valid email"),
});
type CompanyForm = z.infer<typeof companySchema>;

const INDUSTRIES = ["E-commerce", "SaaS", "Marketplace", "Travel", "iGaming", "Crypto", "Financial Services", "Other"];

function CompanyTab() {
  const { user } = useAuth();
  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: user?.company ?? "Nimbus Labs",
      website: "https://nimbuslabs.io",
      country: "Portugal",
      industry: "SaaS",
      supportEmail: "support@nimbuslabs.io",
    },
  });

  const onSubmit = (values: CompanyForm) => {
    toast.success("Company settings saved");
    console.log(values);
  };

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Company profile</h3>
        <p className="text-xs text-muted-foreground">Public-facing details shown on invoices and receipts.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {COUNTRY_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supportEmail"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Support email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormDescription>Used for customer-facing receipts and disputes.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>Save changes</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// ---------- Brand ----------
const BRAND_COLORS = [
  { name: "Electric", value: "oklch(0.62 0.21 258)" },
  { name: "Emerald", value: "oklch(0.70 0.17 158)" },
  { name: "Amber", value: "oklch(0.78 0.16 78)" },
  { name: "Violet", value: "oklch(0.66 0.20 300)" },
  { name: "Rose", value: "oklch(0.68 0.20 20)" },
  { name: "Sky", value: "oklch(0.72 0.15 200)" },
];

function BrandTab() {
  const [color, setColor] = React.useState(BRAND_COLORS[0].value);
  const [logoName, setLogoName] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Brand & appearance</h3>
        <p className="text-xs text-muted-foreground">Customize how XPayments appears to your customers.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <Label>Logo</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/40 py-8 transition hover:border-primary/40 hover:bg-muted/30"
            >
              {logoName ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <p className="text-sm font-medium">{logoName}</p>
                  <p className="text-[11px] text-muted-foreground">Click to replace</p>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop your logo here</p>
                  <p className="text-[11px] text-muted-foreground">PNG or SVG, max 2MB · 1:1 recommended</p>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setLogoName(f.name);
                  toast.success("Logo uploaded");
                }
              }}
            />
          </div>

          <div>
            <Label>Brand color</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "relative h-10 w-10 rounded-lg border-2 transition",
                    color === c.value ? "border-foreground" : "border-transparent",
                  )}
                  style={{ background: c.value }}
                  title={c.name}
                >
                  {color === c.value && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Preview</Label>
          <div className="mt-1.5 overflow-hidden rounded-xl border border-border/60 bg-background/40">
            <div className="border-b border-border/40 p-4" style={{ background: `${color}18` }}>
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg font-bold text-white" style={{ background: color }}>
                  {logoName ? "L" : "N"}
                </div>
                <div>
                  <p className="text-sm font-semibold">Nimbus Labs</p>
                  <p className="text-[11px] text-muted-foreground">Pay with confidence</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-3 h-2 w-24 rounded-full" style={{ background: color }} />
              <div className="mb-2 h-2 w-full rounded-full bg-muted/60" />
              <div className="mb-2 h-2 w-3/4 rounded-full bg-muted/60" />
              <Button size="sm" className="mt-3 w-full" style={{ background: color, borderColor: color }}>
                Pay €42.00
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => toast.success("Brand settings saved")}>Save changes</Button>
      </div>
    </Card>
  );
}

// ---------- Security ----------
const passwordSchema = z.object({
  current: z.string().min(1, "Current password is required"),
  next: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.next === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

const SESSIONS = [
  { id: "s1", device: "MacBook Pro · Chrome", location: "Lisbon, PT", ip: "188.250.x.x", current: true, icon: Monitor },
  { id: "s2", device: "iPhone 15 · Safari", location: "Lisbon, PT", ip: "188.250.x.x", current: false, icon: Smartphone },
  { id: "s3", device: "Windows · Edge", location: "Porto, PT", ip: "81.20.x.x", current: false, icon: Monitor },
];

function SecurityTab() {
  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });
  const [mfa, setMfa] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-5">
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="text-xs text-muted-foreground">Use at least 8 characters with a mix of letters, numbers and symbols.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => { toast.success("Password updated"); form.reset(); })} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="current"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Current password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="next"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Update password</Button>
            </div>
          </form>
        </Form>
      </Card>

      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Two-factor authentication
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Require a 6-digit code from your authenticator app on every login.
            </p>
          </div>
          <Switch checked={mfa} onCheckedChange={(v) => { setMfa(v); toast.success(v ? "2FA enabled" : "2FA disabled"); }} />
        </div>
        {mfa && (
          <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-300">
            2FA is active · Authenticator app configured on Mar 14, 2025
          </div>
        )}
      </Card>

      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Active sessions</h3>
            <p className="text-xs text-muted-foreground">Devices currently signed in to your account.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {SESSIONS.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
              <div className="rounded-lg bg-muted/40 p-2"><s.icon className="h-4 w-4 text-muted-foreground" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.device}</p>
                <p className="text-[11px] text-muted-foreground">{s.location} · {s.ip}</p>
              </div>
              {s.current ? (
                <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/12 text-emerald-400">This device</Badge>
              ) : (
                <Button variant="ghost" size="sm" className="gap-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                  <LogOut className="h-3.5 w-3.5" /> Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- API ----------
function ApiTab() {
  const [version, setVersion] = React.useState("2025-01-15");
  const [allowlist, setAllowlist] = React.useState("188.250.0.0/16\n81.20.0.0/16");

  const copy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
    } else toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-5">
          <h3 className="text-sm font-semibold">API access</h3>
          <p className="text-xs text-muted-foreground">Base URL and version for all API requests.</p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Base URL</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input readOnly value={API_BASE_URL} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(API_BASE_URL)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <Label>API version</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="mt-1.5 w-full sm:w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-01-15">2025-01-15 (latest)</SelectItem>
                <SelectItem value="2024-11-01">2024-11-01</SelectItem>
                <SelectItem value="2024-08-01">2024-08-01</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Pin to a version for predictable behavior. New versions are backward-compatible.</p>
          </div>
          <div>
            <Label>IP allowlist</Label>
            <Textarea
              value={allowlist}
              onChange={(e) => setAllowlist(e.target.value)}
              spellCheck={false}
              className="mt-1.5 h-28 resize-none font-mono text-xs"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">One CIDR per line. Empty = allow from any IP (less secure).</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => toast.success("API settings saved")}>Save changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Notifications ----------
const NOTIF_EVENTS = [
  { id: "payment", label: "Payment received", desc: "When a customer payment is captured.", email: true, push: false },
  { id: "payout", label: "Payout created", desc: "When a payout is queued for processing.", email: true, push: true },
  { id: "dispute", label: "Dispute opened", desc: "When a chargeback or dispute is created.", email: true, push: true },
  { id: "risk", label: "Risk alert", desc: "When a high-risk transaction is flagged.", email: true, push: true },
  { id: "summary", label: "Weekly summary", desc: "Monday-morning recap of last week's activity.", email: true, push: false },
];

function NotificationsTab() {
  const [events, setEvents] = React.useState(NOTIF_EVENTS);
  const toggle = (id: string, channel: "email" | "push") =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, [channel]: !e[channel] } : e)));

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <p className="text-xs text-muted-foreground">Choose which events trigger email and push notifications.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Event</th>
              <th className="pb-2 text-center font-medium">Email</th>
              <th className="pb-2 text-center font-medium">Push</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-border/30">
                <td className="py-3">
                  <p className="font-medium">{e.label}</p>
                  <p className="text-[11px] text-muted-foreground">{e.desc}</p>
                </td>
                <td className="py-3 text-center">
                  <Switch checked={e.email} onCheckedChange={() => toggle(e.id, "email")} />
                </td>
                <td className="py-3 text-center">
                  <Switch checked={e.push} onCheckedChange={() => toggle(e.id, "push")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => toast.success("Notification preferences saved")}>Save preferences</Button>
      </div>
    </Card>
  );
}

// ---------- Billing ----------
function BillingTab() {
  const usage = [
    { label: "API calls", used: 184230, limit: 500000, unit: "" },
    { label: "Payment volume", used: 842310, limit: 2000000, unit: "€" },
    { label: "Webhook deliveries", used: 12480, limit: 100000, unit: "" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-border/60 bg-gradient-to-r from-primary/10 to-violet-500/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-semibold">Pro plan</h3>
              <Badge variant="outline" className="border-amber-500/25 bg-amber-500/12 text-amber-400">Active</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">€499 / month · renews on Feb 1, 2025</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Manage plan</Button>
            <Button size="sm" className="gap-1.5"><Crown className="h-3.5 w-3.5" /> Upgrade</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          {usage.map((u) => {
            const pct = (u.used / u.limit) * 100;
            return (
              <div key={u.label}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{u.label}</p>
                  <p className="text-xs font-medium">{pct.toFixed(0)}%</p>
                </div>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {u.unit}{u.used.toLocaleString()} <span className="text-muted-foreground">/ {u.unit}{u.limit.toLocaleString()}</span>
                </p>
                <Progress value={pct} className={cn("mt-2 h-1.5", pct > 80 && "[&>div]:bg-amber-400", pct > 95 && "[&>div]:bg-rose-400")} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Payment method</h3>
          <p className="text-xs text-muted-foreground">Card used for subscription billing.</p>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-12 place-items-center rounded bg-muted/40 text-[10px] font-bold">VISA</div>
            <div>
              <p className="font-mono text-sm">•••• 4242</p>
              <p className="text-[11px] text-muted-foreground">Expires 09/27</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Need a past invoice?</p>
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={() => toast.success("Opening invoices…")}>
            View all invoices <Mail className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Compliance ----------
const KYC_DOCS = [
  { id: "d1", name: "Certificate of Incorporation.pdf", type: "Article", status: "approved", date: "2024-09-12" },
  { id: "d2", name: "Passport_Mariana.pdf", type: "Passport", status: "approved", date: "2024-09-12" },
  { id: "d3", name: "Address_Proof.pdf", type: "Address proof", status: "approved", date: "2024-09-15" },
  { id: "d4", name: "Beneficial_Owners.xlsx", type: "UBO declaration", status: "approved", date: "2024-09-18" },
];

function ComplianceTab() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-emerald-500/12 p-3 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">KYC verified</h3>
              <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/12 text-emerald-400">Approved</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your merchant account completed KYC verification on Sep 18, 2024. All payment methods are enabled.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Verification badges</h3>
          <p className="text-xs text-muted-foreground">Compliance programs your account has passed.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Identity verified", icon: ShieldCheck },
            { label: "Business verified", icon: Building2 },
            { label: "AML screening passed", icon: ScrollText },
            { label: "Sanctions cleared", icon: CheckCircle2 },
            { label: "PEP checked", icon: Eye },
            { label: "UBO declared", icon: Users },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
              <b.icon className="h-3.5 w-3.5" />
              {b.label}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Submitted documents</h3>
            <p className="text-xs text-muted-foreground">All documents are encrypted at rest.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload more</Button>
        </div>
        <div className="flex flex-col gap-2">
          {KYC_DOCS.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2.5">
              <div className="rounded-lg bg-muted/40 p-2"><ScrollText className="h-4 w-4 text-muted-foreground" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">{d.type} · uploaded {formatDate(d.date)}</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/12 text-emerald-400">{d.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- Users ----------
const TEAM = [
  { id: "u1", name: "Mariana Costa", email: "mariana@nimbuslabs.io", role: "Owner", status: "active" },
  { id: "u2", name: "Tiago Silva", email: "tiago@nimbuslabs.io", role: "Admin", status: "active" },
  { id: "u3", name: "Ana Ferreira", email: "ana@nimbuslabs.io", role: "Developer", status: "active" },
  { id: "u4", name: "Bruno Lima", email: "bruno@nimbuslabs.io", role: "Analyst", status: "active" },
  { id: "u5", name: "Clara Nunes", email: "clara@nimbuslabs.io", role: "Viewer", status: "paused" },
];

function UsersTab() {
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("Developer");

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Team members</h3>
          <p className="text-xs text-muted-foreground">{TEAM.length} members in this workspace</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Invite
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Member</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {TEAM.map((m) => (
              <tr key={m.id} className="border-b border-border/30 transition hover:bg-muted/30">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">{initials(m.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <Badge variant="outline" className="border-border/60 bg-muted/30">{m.role}</Badge>
                </td>
                <td className="py-3"><StatusBadge status={m.status} /></td>
                <td className="py-3 text-right">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>They'll receive an email invitation to join this workspace.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Owner", "Admin", "Developer", "Analyst", "Viewer"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
                setInviteOpen(false);
                setEmail("");
                toast.success(`Invitation sent to ${email}`);
              }}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------- Roles ----------
const ROLES = [
  { id: "owner", label: "Owner", icon: Crown, desc: "Full access including billing and account deletion." },
  { id: "admin", label: "Admin", icon: Shield, desc: "Manage everything except account-level changes." },
  { id: "developer", label: "Developer", icon: Code2, desc: "API keys, webhooks, and read access to data." },
  { id: "analyst", label: "Analyst", icon: Database, desc: "Read access to analytics and reports." },
  { id: "viewer", label: "Viewer", icon: Eye, desc: "Read-only access to dashboards." },
];

const PERMISSIONS = [
  { id: "dashboard", label: "View dashboard" },
  { id: "payments", label: "Manage payments" },
  { id: "wallets", label: "Manage wallets" },
  { id: "apikeys", label: "Manage API keys" },
  { id: "users", label: "Manage users" },
  { id: "billing", label: "View billing" },
  { id: "compliance", label: "Manage compliance" },
];

// Matrix: role -> permission -> bool
const MATRIX: Record<string, Record<string, boolean>> = {
  owner: Object.fromEntries(PERMISSIONS.map((p) => [p.id, true])),
  admin: Object.fromEntries(PERMISSIONS.map((p) => [p.id, true])),
  developer: Object.fromEntries(PERMISSIONS.map((p) => [p.id, ["dashboard", "payments", "wallets", "apikeys"].includes(p.id)])),
  analyst: Object.fromEntries(PERMISSIONS.map((p) => [p.id, ["dashboard", "billing"].includes(p.id)])),
  viewer: Object.fromEntries(PERMISSIONS.map((p) => [p.id, p.id === "dashboard"])),
};

function RolesTab() {
  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">Roles & permissions</h3>
        <p className="text-xs text-muted-foreground">Define what each role can do in your workspace.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="pb-3 font-medium">Permission</th>
              {ROLES.map((r) => (
                <th key={r.id} className="pb-3 text-center font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <r.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{r.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.id} className="border-b border-border/30">
                <td className="py-3 text-sm">{p.label}</td>
                {ROLES.map((r) => (
                  <td key={r.id} className="py-3 text-center">
                    {MATRIX[r.id]?.[p.id] ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="mx-auto block h-1 w-3 rounded-full bg-muted/60" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.id} className="rounded-lg border border-border/40 bg-background/40 p-3">
            <div className="flex items-center gap-2">
              <r.icon className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{r.label}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
