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
    { title: "Total Items", value: stats?.totalItems, icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Value", value: stats ? `KES ${stats.totalValue.toLocaleString()}` : null, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Low Stock", value: stats?.lowStockCount, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Out of Stock", value: stats?.outOfStockCount, icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
    { title: "Pending Requisitions", value: stats?.pendingRequisitions, icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Received Today", value: stats?.itemsReceivedToday, icon: Truck, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Issued Today", value: stats?.itemsIssuedToday, icon: RefreshCcw, color: "text-cyan-600", bg: "bg-cyan-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Overview of inventory performance and alerts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Stock Movement (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : chartData ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" />
                    <Bar dataKey="received" name="Received" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issued" name="Issued" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
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
                  <div key={tx.id} className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full mt-1 ${
                      tx.type === 'received' ? 'bg-emerald-100 text-emerald-700' :
                      tx.type === 'issued' ? 'bg-blue-100 text-blue-700' :
                      tx.type === 'returned' ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {tx.type === 'received' && <Truck className="h-4 w-4" />}
                      {tx.type === 'issued' && <ShoppingCart className="h-4 w-4" />}
                      {tx.type === 'returned' && <RefreshCcw className="h-4 w-4" />}
                      {tx.type === 'adjusted' && <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Qty: {tx.quantity} • By {tx.user}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
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