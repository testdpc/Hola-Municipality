import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from "lucide-react";

export function GlobalFilters() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Universal Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Category</h3>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Supplier</h3>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Status</h3>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Date Range</h3>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
