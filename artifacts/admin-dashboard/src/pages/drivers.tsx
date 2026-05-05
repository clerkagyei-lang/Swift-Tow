import { useState, useCallback } from "react";
import { useAuthStore } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Search,
  Users,
  Star,
  Truck,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ApprovalStatus = "pending" | "approved" | "suspended" | "all";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  approvalStatus: "pending" | "approved" | "suspended";
  licenseNumber?: string;
  vehicleType?: string;
  approvalNote?: string;
}

function useAdminDrivers(adminUserId: string, status: ApprovalStatus) {
  return useQuery<Driver[]>({
    queryKey: ["admin-drivers", status],
    queryFn: async () => {
      const params = new URLSearchParams({ userId: adminUserId });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/drivers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
  });
}

function useApproveDriver(adminUserId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, note }: { driverId: string; note?: string }) => {
      const res = await fetch(`/api/admin/drivers/${driverId}/approve?userId=${adminUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to approve driver");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-drivers"] }),
  });
}

function useRejectDriver(adminUserId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, note }: { driverId: string; note?: string }) => {
      const res = await fetch(`/api/admin/drivers/${driverId}/reject?userId=${adminUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to reject driver");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-drivers"] }),
  });
}

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  suspended: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

export default function DriversPage() {
  const adminUserId = useAuthStore((s) => s.adminUserId)!;
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");

  const { data: drivers, isLoading } = useAdminDrivers(adminUserId, statusFilter);
  const approve = useApproveDriver(adminUserId);
  const reject = useRejectDriver(adminUserId);

  const filtered = drivers?.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.phone.includes(q)
    );
  });

  function openAction(driver: Driver, type: "approve" | "reject") {
    setSelectedDriver(driver);
    setActionType(type);
    setNote("");
  }

  function closeDialog() {
    setSelectedDriver(null);
    setActionType(null);
    setNote("");
  }

  async function handleConfirm() {
    if (!selectedDriver || !actionType) return;
    const mutation = actionType === "approve" ? approve : reject;
    try {
      await mutation.mutateAsync({ driverId: selectedDriver.id, note: note || undefined });
      toast({
        title: actionType === "approve" ? "Driver approved" : "Driver rejected",
        description: `${selectedDriver.name} has been ${actionType === "approve" ? "approved" : "rejected"}.`,
      });
      closeDialog();
    } catch {
      toast({ title: "Action failed", description: "Please try again.", variant: "destructive" });
    }
  }

  const isPending = approve.isPending || reject.isPending;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Driver Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and manage driver applications</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span data-testid="text-driver-count">{filtered?.length ?? 0} driver{filtered?.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApprovalStatus)}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No drivers found</p>
          <p className="text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
              data-testid={`card-driver-${driver.id}`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-secondary-foreground font-semibold text-sm shrink-0">
                {driver.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{driver.name}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge[driver.approvalStatus]}`}
                    data-testid={`status-driver-${driver.id}`}
                  >
                    {driver.approvalStatus.charAt(0).toUpperCase() + driver.approvalStatus.slice(1)}
                  </span>
                  {driver.isOnline && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Online
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />{driver.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />{driver.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />{driver.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />{driver.totalTrips} trips
                  </span>
                </div>
                {driver.approvalNote && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {driver.approvalNote}
                  </p>
                )}
              </div>

              {driver.approvalStatus === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                    onClick={() => openAction(driver, "approve")}
                    data-testid={`button-approve-${driver.id}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => openAction(driver, "reject")}
                    data-testid={`button-reject-${driver.id}`}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {driver.approvalStatus === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 shrink-0"
                  onClick={() => openAction(driver, "reject")}
                  data-testid={`button-suspend-${driver.id}`}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Suspend
                </Button>
              )}

              {driver.approvalStatus === "suspended" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20 shrink-0"
                  onClick={() => openAction(driver, "approve")}
                  data-testid={`button-reinstate-${driver.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Reinstate
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDriver} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Driver Application" : "Reject / Suspend Driver"}
            </DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-secondary-foreground font-semibold text-sm">
                  {selectedDriver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedDriver.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDriver.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Note (optional)
                </label>
                <Textarea
                  placeholder={actionType === "approve" ? "Add a welcome note..." : "Reason for rejection..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  data-testid="textarea-note"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={isPending} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={isPending}
              data-testid="button-confirm"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
