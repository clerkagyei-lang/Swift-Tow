import { useAuthStore } from "@/lib/auth";
import { useGetDashboardStats, useListTowRequests, getListTowRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Truck,
  DollarSign,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  UserCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  accent?: string;
}) {
  return (
    <Card className="shadow-sm" data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${accent || "bg-primary/10"}`}>
            <Icon className={`w-4 h-4 ${accent ? "text-white" : "text-primary"}`} />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20 mt-2" />
        ) : (
          <p className="text-2xl font-bold mt-2 text-foreground" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Activity },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary", icon: Truck },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const towTypeLabel: Record<string, string> = {
  flatbed: "Flatbed",
  hook_chain: "Hook & Chain",
  repair: "Roadside Repair",
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentRequests, isLoading: requestsLoading } = useListTowRequests(
    undefined,
    { query: { queryKey: getListTowRequestsQueryKey(), select: (data) => data.slice(0, 8) } }
  );

  const loading = statsLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live overview of Swift Tow operations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Online Drivers"
          value={stats?.onlineDrivers ?? 0}
          icon={Users}
          loading={loading}
          accent="bg-primary"
        />
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs ?? 0}
          icon={Truck}
          loading={loading}
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingRequests ?? 0}
          icon={AlertCircle}
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingDrivers ?? 0}
          icon={UserCheck}
          loading={loading}
          accent={(stats?.pendingDrivers ?? 0) > 0 ? "bg-amber-500" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Recent Tow Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {requestsLoading ? (
              <div className="divide-y divide-border">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !recentRequests?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No tow requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentRequests.map((req) => {
                  const status = statusConfig[req.status] ?? statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      data-testid={`row-request-${req.id}`}
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 shrink-0">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {req.userName} &mdash; {req.vehicleDetails}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {towTypeLabel[req.towType]} &bull; {req.pickupAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`} data-testid={`status-request-${req.id}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        <span className="text-xs text-muted-foreground hidden md:block">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-1 hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div>
                <p className="text-3xl font-bold text-foreground">
                  GHS {((stats?.totalEarnings ?? 0)).toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total platform earnings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
