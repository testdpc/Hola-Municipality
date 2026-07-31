import { useGetDashboardStats, useGetRecentTransactions, useGetStockMovementChart } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, AlertTriangle, XCircle, ShoppingCart, Truck, RefreshCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: transactions, isLoading: txLoading } = useGetRecentTransactions();
  const { data: chartData, isLoading: chartLoading } = useGetStockMovementChart();

  const statCards = [
    { title: "Total Items", value: stats?.totalItems, icon: Package, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { title: "Total Value", value: stats ? `KES ${stats.totalValue.toLocaleString()}` : null, icon: DollarSign, color: "text-[hsl(var(--chart-2))]", bg: "bg-[hsl(var(--chart-2))]/10", border: "border-[hsl(var(--chart-2))]/20" },
    { title: "Low Stock", value: stats?.lowStockCount, icon: AlertTriangle, color: "text-[hsl(var(--chart-5))]", bg: "bg-[hsl(var(--chart-5))]/10", border: "border-[hsl(var(--chart-5))]/20" },
    { title: "Out of Stock", value: stats?.outOfStockCount, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
    { title: "Pending Requisitions", value: stats?.pendingRequisitions, icon: ShoppingCart, color: "text-[hsl(var(--chart-4))]", bg: "bg-[hsl(var(--chart-4))]/10", border: "border-[hsl(var(--chart-4))]/20" },
    { title: "Received Today", value: stats?.itemsReceivedToday, icon: Truck, color: "text-[hsl(var(--chart-3))]", bg: "bg-[hsl(var(--chart-3))]/10", border: "border-[hsl(var(--chart-3))]/20" },
    { title: "Issued Today", value: stats?.itemsIssuedToday, icon: RefreshCcw, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time inventory overview and system alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className={`shadow-sm border ${stat.border} hover:shadow-md transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Stock Movement (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : chartData ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="received" name="Received" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="issued" name="Issued" fill="hsl(var(--chart-5))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto">
                {transactions?.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      tx.type === 'received' ? 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]' :
                      tx.type === 'issued' ? 'bg-primary/10 text-primary' :
                      tx.type === 'returned' ? 'bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]' :
                      'bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))]'
                    }`}>
                      {tx.type === 'received' && <Truck className="h-4 w-4" />}
                      {tx.type === 'issued' && <ShoppingCart className="h-4 w-4" />}
                      {tx.type === 'returned' && <RefreshCcw className="h-4 w-4" />}
                      {tx.type === 'adjusted' && <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {tx.quantity} • By {tx.user}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {format(new Date(tx.timestamp), "MMM d, HH:mm")}
                    </div>
                  </div>
                ))}
                {transactions?.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">No recent transactions.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}