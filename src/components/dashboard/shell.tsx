"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Menu, X, ChevronDown, Sun, Moon, LogOut, User as UserIcon,
  Settings, CreditCard, Globe, Check, Command, Sparkles, PanelLeftClose,
  PanelLeft, LifeBuoy, ExternalLink, ShieldCheck, Plus, ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { merchantNav, adminNav, type NavSection } from "@/config";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { APP_NAME } from "@/config";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
        <span className="text-sm font-bold text-white">X</span>
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </span>
          <span className="text-[10px] text-muted-foreground">Payments OS</span>
        </div>
      )}
    </div>
  );
}

function WorkspaceSwitcher({ compact }: { compact?: boolean }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = React.useState(user?.company ?? "Nimbus Labs");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-border/60 bg-card/40 px-2.5 py-2 text-left transition hover:bg-card/70",
            compact && "justify-center"
          )}
        >
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary/80 to-primary/40 text-[11px] font-semibold text-white">
            {workspace?.[0] ?? "N"}
          </div>
          {!compact && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{workspace}</p>
                <p className="truncate text-[10px] text-muted-foreground">Merchant workspace</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setWorkspace("Nimbus Labs")}>
          <div className="mr-2 grid h-6 w-6 place-items-center rounded bg-primary/20 text-[10px] font-semibold text-primary">N</div>
          Nimbus Labs
          <Check className="ml-auto h-3.5 w-3.5" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setWorkspace("Quanta Pay")}>
          <div className="mr-2 grid h-6 w-6 place-items-center rounded bg-emerald-500/20 text-[10px] font-semibold text-emerald-400">Q</div>
          Quanta Pay
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setWorkspace("Vertex Commerce")}>
          <div className="mr-2 grid h-6 w-6 place-items-center rounded bg-violet-500/20 text-[10px] font-semibold text-violet-400">V</div>
          Vertex Commerce
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="mr-2 h-4 w-4" /> New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavList({
  sections,
  active,
  onSelect,
}: {
  sections: NavSection[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                    isActive
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge className="h-[18px] min-w-[18px] px-1 text-[10px] font-semibold" variant="default">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({
  sections,
  active,
  onSelect,
  collapsed,
}: {
  sections: NavSection[];
  active: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
}) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center border-b border-border/60 px-4", collapsed && "justify-center px-2")}>
        {collapsed ? <Logo compact /> : <Logo />}
      </div>
      <div className={cn("px-3 pt-3", collapsed && "px-2")}>
        <WorkspaceSwitcher compact={collapsed} />
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 px-2 py-4">
            {sections.flatMap((s) => s.items).map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  title={item.label}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition",
                    isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        ) : (
          <NavList sections={sections} active={active} onSelect={onSelect} />
        )}
      </div>
      {!collapsed && user && (
        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar className="h-8 w-8 border border-border/60">
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/40 text-xs font-semibold text-white">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { setCommandOpen, setNotificationsOpen, toggleSidebar } = useUi();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="safe-top sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl sm:px-5">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={toggleSidebar}>
        <PanelLeft className="h-[18px] w-[18px]" />
      </Button>

      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 flex-1 items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 text-sm text-muted-foreground transition hover:bg-card/70 sm:max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search payments, customers…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] sm:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => toast.info("Live mode", { description: "You are operating in Live mode." })}>
          <span className="flex items-center gap-1 rounded-md bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(true)}>
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        {mounted && (
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-lg p-0.5 transition hover:bg-muted/60">
              <Avatar className="h-8 w-8 border border-border/60">
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/40 text-xs font-semibold text-white">
                  {user ? initials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><UserIcon className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuItem><CreditCard className="mr-2 h-4 w-4" /> Billing</DropdownMenuItem>
            <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" /> Security</DropdownMenuItem>
            <DropdownMenuItem><LifeBuoy className="mr-2 h-4 w-4" /> Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-400 focus:text-rose-400" onClick={() => { logout(); toast.success("Signed out"); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function CommandPalette({
  items,
  active,
  onSelect,
}: {
  items: NavSection[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const { commandOpen, setCommandOpen } = useUi();
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search pages, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {items.map((section) => (
          <CommandGroup key={section.id} heading={section.label}>
            {section.items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => { onSelect(item.id); setCommandOpen(false); }}
                className={cn(active === item.id && "bg-primary/10")}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => { toast.success("Export started", { description: "CSV will be emailed when ready." }); setCommandOpen(false); }}>
            <ExternalLink className="mr-2 h-4 w-4" /> Export payments (CSV)
          </CommandItem>
          <CommandItem onSelect={() => { toast.success("New payment link created"); setCommandOpen(false); }}>
            <Plus className="mr-2 h-4 w-4" /> Create payment link
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUi();
  const notifications = [
    { id: 1, title: "Large payout approved", desc: "€48,200.00 to Acme Ltd", time: "2m ago", type: "success" },
    { id: 2, title: "Risk alert: velocity rule", desc: "Card ending 4821 — 14 attempts in 60s", time: "18m ago", type: "warning" },
    { id: 3, title: "New webhook delivery failed", desc: "https://api.merchant.io/xp/events", time: "1h ago", type: "error" },
    { id: 4, title: "Monthly statement ready", desc: "November 2025 statement available", time: "3h ago", type: "info" },
    { id: 5, title: "KYC approved", desc: "Vertex Commerce is now verified", time: "5h ago", type: "success" },
  ];
  const dot: Record<string, string> = {
    success: "bg-emerald-400", warning: "bg-amber-400", error: "bg-rose-400", info: "bg-sky-400",
  };
  return (
    <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      <SheetContent className="w-full border-border/60 bg-background/95 sm:max-w-md">
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Notifications</h3>
              <Badge variant="secondary" className="text-[10px]">{notifications.length}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
            {notifications.map((n) => (
              <div key={n.id} className="mb-1 flex gap-3 rounded-lg p-3 transition hover:bg-muted/50">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot[n.type])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border/60 p-3">
            <Button variant="outline" className="w-full" size="sm">Mark all as read</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DashboardShell({
  mode,
  children,
}: {
  mode: "merchant" | "admin";
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUi();
  const { user } = useAuth();
  const sections = mode === "merchant" ? merchantNav : adminNav;
  const active = mode === "merchant" ? useUi().activeMerchantView : useUi().activeAdminView;
  const select = mode === "merchant" ? useUi().setMerchantView : useUi().setAdminView;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/60 bg-sidebar/50 backdrop-blur-xl transition-[width] duration-200 lg:block",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarBody
          sections={sections}
          active={active}
          onSelect={select}
          collapsed={sidebarCollapsed}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 border-border/60 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody sections={sections} active={active} onSelect={select} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setSidebarOpen(true)} />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette items={sections} active={active} onSelect={select} />
      <NotificationsPanel />
    </div>
  );
}
