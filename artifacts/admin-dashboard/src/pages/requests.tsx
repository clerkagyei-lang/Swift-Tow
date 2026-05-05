import { useState } from "react";
import { useListTowRequests, getListTowRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Truck,
  Search,
  ClipboardList,
  MapPin,
  User,
  Phone,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type StatusFilter = "all" | "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Activity },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Truck },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const towTypeLabel: Record<string, string> = {
  flatbed: "Flatbed",
  hook_chain: "Hook & Chain",
  repair: "Roadside Repair",
};

const towTypeBadge: Record<string, string> = {
  flatbed: "bg-primary/10 text-primary",
  hook_chain: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  repair: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data: requests, isLoading } = useListTowRequests(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
    { query: { queryKey: getListTowRequestsQueryKey(statusFilter !== "all" ? { status: statusFilter } : undefined) } }
  );

  const filtered = requests?.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.userName.toLowerCase().includes(q) ||
      r.userPhone.includes(q) ||
      r.pickupAddress.toLowerCase().includes(q) ||
      r.vehicleDetails.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tow Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All customer tow requests across the platform</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList className="w-4 h-4" />
          <span data-testid="text-request-count">{filtered?.length ?? 0} request{filtered?.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by customer, phone, address or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-requests"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No tow requests found</p>
          <p className="text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const status = statusConfig[req.status] ?? statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Card
                key={req.id}
                className="shadow-sm hover:border-primary/30 transition-colors"
                data-testid={`card-request-${req.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <Truck className="w-4 h-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{req.userName}</p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${towTypeBadge[req.towType] || "bg-muted text-muted-foreground"}`}
                        >
                          {towTypeLabel[req.towType]}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                          data-testid={`status-request-${req.id}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />{req.vehicleDetails}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{req.userPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{req.pickupAddress}
                        </span>
                        {req.dropoffAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />To: {req.dropoffAddress}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        {req.amount != null && (
                          <span className="font-semibold text-foreground">
                            GHS {req.amount.toFixed(2)}
                          </span>
                        )}
                        <span>{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</span>
                        <span className="hidden sm:block text-muted-foreground/60">
                          {format(new Date(req.createdAt), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
