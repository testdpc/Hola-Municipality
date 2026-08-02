import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListInventoryItems } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Eye, Filter } from "lucide-react";

export default function InventoryList() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useListInventoryItems({ search });
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Items</h1>
          <p className="text-muted-foreground mt-1">Manage stock levels, items, and locations.</p>
        </div>
        <Button onClick={() => setLocation("/inventory/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by code, name or description..." 
                className="pl-9 bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 ml-auto w-full sm:w-auto">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Item Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price (KES)</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No items found.</TableCell>
                  </TableRow>
                ) : (
                  items?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setLocation(`/inventory/${item.id}`)}>
                      <TableCell className="font-mono text-xs">{item.itemCode}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.itemName}</TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell className="text-right font-medium">{item.currentQuantity} {item.unitOfMeasure}</TableCell>
                      <TableCell className="text-right">{item.purchasePrice.toLocaleString()}</TableCell>
                      <TableCell>{item.shelfBinLocation || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.status === "available" ? "default" :
                          item.status === "low_stock" ? "secondary" : "destructive"
                        } className={
                          item.status === "available" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
                          item.status === "low_stock" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""
                        }>
                          {item.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setLocation(`/inventory/${item.id}`); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}