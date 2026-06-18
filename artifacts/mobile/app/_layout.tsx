function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Define route flags
    const inAuth = segments[0] === "auth";
    const inDriver = segments[0] === "(driver)";
    const inTabs = segments[0] === "(tabs)";
    const inAdmin = segments[0] === "admin";
    // ADDED THIS: correctly define inPending
    const inPending = segments[1] === "pending-approval"; 

    // Redirect to login if not authenticated
    if (!user && !inAuth) {
      router.replace("/auth/login" as any);
      return;
    }

    // Handle authenticated users
    if (user && inAuth && !inPending) {
      if (user.role === "driver" && user.approvalStatus === "pending") {
        router.replace("/auth/pending-approval" as any);
      } else if (user.role === "driver") {
        router.replace("/(driver)/" as any);
      } else if (user.role === "admin") {
        router.replace("/admin" as any);
      } else {
        router.replace("/(tabs)/" as any);
      }
      return;
    }

    // Pending driver protection
    if (user?.role === "driver" && user.approvalStatus === "pending" && !inPending) {
      router.replace("/auth/pending-approval" as any);
      return;
    }

    // Admin routing protection
    if (user?.role === "admin" && !inAdmin && !inAuth) {
      router.replace("/admin" as any);
      return;
    }

    // Role-based routing protection
    if (user && user.role === "driver" && user.approvalStatus === "approved" && inTabs) {
      router.replace("/(driver)/" as any);
      return;
    }
    
    if (user && user.role !== "driver" && user.role !== "admin" && inDriver) {
      router.replace("/(tabs)/" as any);
      return; // Added return here
    }
  }, [user, isLoading, segments]);

  if (isLoading) return null;
  // ... rest of your return
