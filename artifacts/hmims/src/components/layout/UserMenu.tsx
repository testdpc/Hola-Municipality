import { useGetMe } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMenu() {
  const { data: user } = useGetMe();

  return (
    <div className="flex items-center gap-3 border-l pl-4">
      <Avatar className="h-9 w-9">
        <AvatarFallback>
          {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="hidden lg:block">
        <p className="text-sm font-medium leading-none">{user?.fullName}</p>

        <p className="text-xs text-muted-foreground">
          {user?.role?.replace("_", " ")}
        </p>
      </div>
    </div>
  );
}
