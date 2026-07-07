"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Search, Download, MoreHorizontal, Eye, Snowflake,
  ShieldCheck, Ban, Users, Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminMerchants } from "@/hooks/queries";
import { xpApi } from "@/lib/api/xpApi";
import { StatCard, PageHeader, EmptyState } from "@/components/shared";
import { StatusBadge } from "@/components/shared/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { AdminMerchant } from "@/types";

const PAGE_SIZE = 8;

export default function AdminMerchantsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAdminMerchants();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [kycFilter, setKycFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [suspendTarget, setSuspendTarget] = React.useState<AdminMerchant | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminMerchant["status"] }) =>
      xpApi.admin.setMerchantStatus(id, status),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "merchants"] });
      toast.success("Merchant updated", {
        description: `Status set to "${vars.status}".`,
      });
    },
    onError: () => toast.error("Failed to update merchant"),
  });

  const applyStatus = (m: AdminMerchant, status: AdminMerchant["status"]) => {
    if (status === "suspended") {
      setSuspendTarget(m);
      return;
    }
    statusMutation.mutate({ id: m.id, status });
  };

  const filtered = React.useMemo(() => {
    const list = (data ?? []).slice();
    return list.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        const hit =
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (kycFilter !== "all" && m.kycStatus !== kycFilter) return false;
      return true;
    });
  }, [data, search, statusFilter, kycFilter]);

  React.useEffect(() => setPage(1), [search, statusFilter, kycFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const all = data ?? [];
  const stats = {
    total: all.length,
    active: all.filter((m) => m.status === "active").length,
    frozen: all.filter((m) => m.status === "frozen").length,
    pendingKyc: all.filter((m) => m.kycStatus === "pending").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Merchants"
        description="Manage every merchant account on the platform."
        breadcrumbs={[{ label: "Admin" }, { label: "Merchants" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.success("Export started", {
                description: "Merchant CSV will download shortly.",
              })
            }
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard label="Total merchants" value={stats.total} icon={Building2} accent="blue" format={(n) => formatNumber(n)} />
            <StatCard label="Active" value={stats.active} icon={ShieldCheck} accent="green" format={(n) => formatNumber(n)} />
            <StatCard label="Frozen" value={stats.frozen} icon={Snowflake} accent="violet" format={(n) => formatNumber(n)} />
            <StatCard label="Pending KYC" value={stats.pendingKyc} icon={Clock} accent="amber" format={(n) => formatNumber(n)} />
          </>
        )}
      </div>

      {/* Filters + table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, ID…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue placeholder="KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_submitted">Not submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No merchants match"
              description="Try adjusting your search or filter criteria."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                <TableHead>Merchant</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/12 text-xs font-semibold text-primary">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.country}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell><StatusBadge status={m.kycStatus} /></TableCell>
                  <TableCell><RiskCell score={m.riskScore} /></TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatCurrency(m.revenue, "EUR", { compact: true })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatCurrency(m.volume, "EUR", { compact: true })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => toast.info(`Viewing ${m.name}`, { description: m.id })}>
                          <Eye className="mr-2 h-4 w-4" /> View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => applyStatus(m, "active")} disabled={m.status === "active"}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Approve / Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => applyStatus(m, "frozen")} disabled={m.status === "frozen"}>
                          <Snowflake className="mr-2 h-4 w-4" /> Freeze
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => applyStatus(m, "suspended")}
                          disabled={m.status === "suspended"}
                        >
                          <Ban className="mr-2 h-4 w-4" /> Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!isLoading && pageRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Suspend confirm */}
      <AlertDialog
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              Suspend merchant?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately block payments and payouts for{" "}
              <span className="font-semibold text-foreground">
                {suspendTarget?.name}
              </span>{" "}
              ({suspendTarget?.id}). The merchant will be unable to process
              transactions until reinstated. This action is logged for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 text-white hover:bg-rose-500/90"
              disabled={statusMutation.isPending}
              onClick={() => {
                if (suspendTarget) {
                  statusMutation.mutate({ id: suspendTarget.id, status: "suspended" });
                  setSuspendTarget(null);
                }
              }}
            >
              {statusMutation.isPending ? "Suspending…" : "Suspend merchant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RiskCell({ score }: { score: number }) {
  const color =
    score < 30
      ? "text-emerald-400"
      : score < 60
      ? "text-amber-400"
      : "text-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            score < 30 && "bg-emerald-400",
            score >= 30 && score < 60 && "bg-amber-400",
            score >= 60 && "bg-rose-400"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("font-mono text-xs font-semibold tabular-nums", color)}>
        {score}
      </span>
    </div>
  );
}
