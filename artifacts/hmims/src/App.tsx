import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AppLayout } from '@/components/layout';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// Attach the JWT from localStorage to every API request
setAuthTokenGetter(() => localStorage.getItem('hmims_token'));

import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import InventoryList from '@/pages/inventory';
import InventoryForm from '@/pages/inventory-form';
import Categories from '@/pages/categories';
import Suppliers from '@/pages/suppliers';
import Departments from '@/pages/departments';
import Units from '@/pages/units';
import Stores from '@/pages/stores';
import Users from '@/pages/users';
import PurchaseOrders from '@/pages/purchase-orders';
import PurchaseOrderForm from '@/pages/purchase-order-form';
import PurchaseOrderDetail from '@/pages/purchase-order-detail';
import GRNs from '@/pages/grn';
import GRNForm from '@/pages/grn-form';
import GRNDetail from '@/pages/grn-detail';
import StockIssues from '@/pages/stock-issues';
import StockIssueForm from '@/pages/stock-issue-form';
import Reports from '@/pages/reports';
import StockReturns from '@/pages/stock-returns';
import StockAdjustments from '@/pages/stock-adjustments';
import StockTaking from '@/pages/stock-taking';
import Notifications from '@/pages/notifications';
import AuditTrail from '@/pages/audit';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  const token = localStorage.getItem("hmims_token");
  if (!token) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/"><Redirect to="/dashboard" /></Route>

      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>

      {/* Inventory */}
      <Route path="/inventory"><ProtectedRoute component={InventoryList} /></Route>
      <Route path="/inventory/new"><ProtectedRoute component={InventoryForm} /></Route>
      <Route path="/inventory/:id"><ProtectedRoute component={InventoryForm} /></Route>
      <Route path="/categories"><ProtectedRoute component={Categories} /></Route>
      <Route path="/suppliers"><ProtectedRoute component={Suppliers} /></Route>
      <Route path="/departments"><ProtectedRoute component={Departments} /></Route>
      <Route path="/units"><ProtectedRoute component={Units} /></Route>
      <Route path="/stores"><ProtectedRoute component={Stores} /></Route>

      {/* Procurement */}
      <Route path="/purchase-orders"><ProtectedRoute component={PurchaseOrders} /></Route>
      <Route path="/purchase-orders/new"><ProtectedRoute component={PurchaseOrderForm} /></Route>
      <Route path="/purchase-orders/:id/edit"><ProtectedRoute component={PurchaseOrderForm} /></Route>
      <Route path="/purchase-orders/:id"><ProtectedRoute component={PurchaseOrderDetail} /></Route>
      <Route path="/grn"><ProtectedRoute component={GRNs} /></Route>
      <Route path="/grn/new"><ProtectedRoute component={GRNForm} /></Route>
      <Route path="/grn/:id"><ProtectedRoute component={GRNDetail} /></Route>

      {/* Stock Movements */}
      <Route path="/stock-issues"><ProtectedRoute component={StockIssues} /></Route>
      <Route path="/stock-issues/new"><ProtectedRoute component={StockIssueForm} /></Route>
      <Route path="/stock-returns"><ProtectedRoute component={StockReturns} /></Route>
      <Route path="/stock-adjustments"><ProtectedRoute component={StockAdjustments} /></Route>
      <Route path="/stock-taking"><ProtectedRoute component={StockTaking} /></Route>

      {/* Reports & Admin */}
      <Route path="/reports"><ProtectedRoute component={Reports} /></Route>
      <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/audit"><ProtectedRoute component={AuditTrail} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
