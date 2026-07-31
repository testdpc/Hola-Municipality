import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { GlobalFilters } from "./GlobalFilters";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="h-20 border-b bg-card px-6 flex items-center gap-4">

      <SidebarTrigger />

      <div className="min-w-fit">
        <h1 className="text-lg font-bold">
          Hola Municipality
        </h1>

        <p className="text-xs text-muted-foreground">
          Inventory Management System
        </p>
      </div>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <GlobalFilters />

      <UserMenu />

    </header>
  );
}