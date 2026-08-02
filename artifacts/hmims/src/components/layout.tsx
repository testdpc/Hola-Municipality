import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Package, 
  Layers, 
  Users, 
  Truck, 
  ShoppingCart, 
  FileText, 
  AlertCircle, 
  RefreshCcw, 
  ShieldCheck, 
  Settings,
  LogOut,
  Bell,
  CheckSquare
} from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();

  const clearSession = () => {
    localStorage.removeItem("hmims_token");
    queryClient.removeQueries();
    setLocation("/login");
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: clearSession,
      onError: clearSession,
    });
  };

  const menuGroups = [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: BarChart3 }
      ]
    },
    {
      label: "Inventory",
      items: [
        { label: "Items", href: "/inventory", icon: Package },
        { label: "Categories", href: "/categories", icon: Layers },
        { label: "Suppliers", href: "/suppliers", icon: Users }
      ]
    },
    {
      label: "Procurement",
      items: [
        { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
        { label: "Goods Received", href: "/grn", icon: Truck }
      ]
    },
    {
      label: "Stock Movements",
      items: [
        { label: "Issues", href: "/stock-issues", icon: Truck },
        { label: "Returns", href: "/stock-returns", icon: RefreshCcw },
        { label: "Adjustments", href: "/stock-adjustments", icon: AlertCircle },
        { label: "Stock Taking", href: "/stock-taking", icon: CheckSquare }
      ]
    },
    {
      label: "Reports & Alerts",
      items: [
        { label: "Reports", href: "/reports", icon: FileText },
        { label: "Notifications", href: "/notifications", icon: Bell }
      ]
    },
    {
      label: "Administration",
      items: [
        { label: "Users", href: "/users", icon: Users },
        { label: "Audit Trail", href: "/audit", icon: ShieldCheck },
        { label: "Settings", href: "/settings", icon: Settings }
      ]
    }
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(135deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)] text-muted-foreground">Loading...</div>;

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar/95">
          {/* Expanded header — visible when sidebar is open */}
          <div className="group-data-[collapsible=icon]:hidden flex flex-col items-center gap-3 px-4 py-6">
            <div className="w-28 h-28 rounded-2xl border border-white/10 backdrop-blur-sm p-2 flex items-center justify-center shadow-lg">
              <img
                src="/tana-river-logo.png"
                alt="County Government of Tana River"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="font-extrabold text-xl text-sidebar-foreground tracking-tight block">
                HMIMS
              </span>
              <span className="text-[10px] text-sidebar-foreground/70 leading-tight block mt-0.5">
                Hola Municipality
              </span>
              <span className="text-[9px] text-sidebar-foreground/50 leading-tight block">
                Tana River County
              </span>
            </div>
          </div>
          {/* Collapsed icon — visible only when sidebar is icon-only */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center h-16">
            <div className="w-14 h-14 rounded-xl border border-white/10 backdrop-blur-sm p-1.5 flex items-center justify-center">
              <img
                src="/tana-river-logo.png"
                alt="Tana River County"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {menuGroups.map((group, i) => (
            <SidebarGroup key={i}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.href || location.startsWith(item.href + "/")}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/70 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 truncate rounded-xl border border-white/10 bg-white/5 p-2.5">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground shrink-0 uppercase">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium truncate">{user?.fullName}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user?.role?.replace('_', ' ')}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2 border-white/10 bg-white/5 text-sidebar-foreground hover:bg-white/10" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_32%),linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)]">
        <header className="h-16 border-b border-border/70 bg-card/80 backdrop-blur px-4 shrink-0 flex items-center">
          <SidebarTrigger />
          <div className="ml-4">
            <div className="font-semibold text-lg text-foreground">Hola Municipality</div>
            <div className="text-xs text-muted-foreground">Enterprise inventory command center</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}