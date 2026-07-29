import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
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
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("hmims_token");
        window.location.href = "/login";
      }
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src="/tana-river-logo.jpeg"
              alt="Tana River County"
              className="w-8 h-8 object-contain shrink-0"
            />
            <span className="font-bold text-lg whitespace-nowrap text-sidebar-foreground truncate">
              HMIMS
            </span>
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
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground shrink-0 uppercase">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium truncate">{user?.fullName}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user?.role?.replace('_', ' ')}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <header className="h-16 border-b flex items-center px-4 shrink-0 bg-card">
          <SidebarTrigger />
          <div className="ml-4 font-semibold text-lg">Hola Municipality</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}