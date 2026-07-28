import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck, AlertTriangle, Package, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const typeIcon = (type: string) => {
    switch (type) {
      case "low_stock": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "out_of_stock": return <Package className="h-5 w-5 text-red-500" />;
      case "expiring_item": return <Clock className="h-5 w-5 text-orange-500" />;
      case "pending_approval": return <Bell className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; className: string }> = {
      low_stock: { label: "Low Stock", className: "bg-amber-100 text-amber-800 border-none" },
      out_of_stock: { label: "Out of Stock", className: "bg-red-100 text-red-800 border-none" },
      expiring_item: { label: "Expiring", className: "bg-orange-100 text-orange-800 border-none" },
      pending_approval: { label: "Pending Approval", className: "bg-blue-100 text-blue-800 border-none" },
    };
    const cfg = map[type] || { label: type, className: "bg-gray-100 text-gray-700 border-none" };
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "All notifications marked as read." });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card><CardContent className="h-24 flex items-center justify-center text-muted-foreground">Loading...</CardContent></Card>
        ) : !notifications?.length ? (
          <Card>
            <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Bell className="h-10 w-10 opacity-20" />
              <p>No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={`shadow-sm transition-all ${!n.isRead ? "border-primary/30 bg-primary/5" : "border-border/50"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-semibold ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</span>
                      {typeBadge(n.type)}
                      {!n.isRead && <Badge className="bg-primary/10 text-primary border-none text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)} className="shrink-0 text-xs">
                      Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
