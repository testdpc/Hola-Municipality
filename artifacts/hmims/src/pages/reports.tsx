import { useGetReportCurrentStock, useGetReportLowStock } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const { data: currentStock, isLoading: currentLoading } = useGetReportCurrentStock();
  const { data: lowStock, isLoading: lowLoading } = useGetReportLowStock();

  const handleExport = (reportName: string) => {
    // In a real app, this would trigger a CSV/PDF download
    alert(`Exporting ${reportName}... (Simulation)`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and view inventory analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm border-border/50 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" /> Current Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-between" onClick={() => handleExport('Current Stock')}>
              Export CSV <Download className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border/50 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-between" onClick={() => handleExport('Low Stock')}>
              Export CSV <Download className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Dept Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-between" onClick={() => handleExport('Department Consumption')}>
              Export CSV <Download className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" /> Valuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-between" onClick={() => handleExport('Inventory Valuation')}>
              Export CSV <Download className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <Tabs defaultValue="current" className="w-full">
          <CardHeader className="border-b pb-0 px-6">
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Report Previews</CardTitle>
            </div>
            <TabsList className="bg-transparent h-10 p-0 border-b-0 -mb-px">
              <TabsTrigger value="current" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">Current Stock</TabsTrigger>
              <TabsTrigger value="low" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">Low Stock Alerts</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="current" className="m-0 border-none outline-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Value (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : currentStock?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No items.</TableCell></TableRow>
                  ) : (
                    currentStock?.slice(0, 10).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.itemCode}</TableCell>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell className="text-right">{item.currentQuantity} {item.unitOfMeasure}</TableCell>
                        <TableCell className="text-right">{(item.currentQuantity * item.purchasePrice).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {currentStock && currentStock.length > 10 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground bg-muted/20">Showing 10 of {currentStock.length} items. Export to view all.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="low" className="m-0 border-none outline-none">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Current Qty</TableHead>
                    <TableHead className="text-right">Min Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                  ) : lowStock?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-emerald-600">No low stock items. Everything is optimal.</TableCell></TableRow>
                  ) : (
                    lowStock?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{item.currentQuantity} {item.unitOfMeasure}</TableCell>
                        <TableCell className="text-right">{item.minimumStock}</TableCell>
                        <TableCell>
                          <Badge variant={item.currentQuantity === 0 ? "destructive" : "secondary"} className={item.currentQuantity > 0 ? "bg-amber-100 text-amber-800 border-none" : ""}>
                            {item.currentQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}