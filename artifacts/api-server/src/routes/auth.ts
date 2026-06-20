import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { name, email, password, phone, role = "user" } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: "validation_error", message: "All fields are required" });
    return;
  }

  const existing = await store.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: "email_taken", message: "Email already registered" });
    return;
  }

  const user = await store.createUser({ name, email, password, phone, role: role as "user" | "driver", avatarUrl: null });
  const { password: _, ...safeUser } = user;
  res.status(201).json({ token: user.id, user: safeUser });
});

router.post("/auth/register-driver", async (req, res) => {
  const { name, email, password, phone, vehicleType, vehiclePlate, licenseNumber } = req.body;

  if (!name || !email || !password || !phone || !vehicleType || !vehiclePlate || !licenseNumber) {
    res.status(400).json({ error: "validation_error", message: "All fields are required" });
    return;
  }

  const [existingDriver, existingUser] = await Promise.all([
    store.getDriverByEmail(email),
    store.getUserByEmail(email),
  ]);
  if (existingDriver || existingUser) {
    res.status(400).json({ error: "email_taken", message: "Email already registered" });
    return;
  }

  const driver = await store.createDriver({
    name,
    email,
    password,
    phone,
    vehicleType,
    vehiclePlate,
    licenseNumber,
    approvalStatus: "pending",
    approvalNote: null,
    isOnline: false,
    currentLocation: null,
    avatarUrl: null,
    rating: 0,
    totalTrips: 0,
    activeJobId: null,
    earningsToday: 0,
    earningsTotal: 0,
  });

  res.status(201).json({
    token: driver.id,
    user: {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      role: "driver" as const,
      avatarUrl: driver.avatarUrl,
      createdAt: driver.createdAt,
      approvalStatus: driver.approvalStatus,
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate,
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "validation_error", message: "Email and password required" });
    return;
  }

  const [user, driver] = await Promise.all([
    store.getUserByEmail(email),
    store.getDriverByEmail(email),
  ]);

  if (user && user.password === password) {
    const { password: _, ...safeUser } = user;
    res.json({ token: user.id, user: safeUser });
    return;
  }

  if (driver && driver.password === password) {
    if (driver.approvalStatus === "suspended") {
      res.status(403).json({ error: "account_suspended", message: "Your driver account has been suspended. Contact support." });
      return;
    }
    res.json({
      token: driver.id,
      user: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: "driver" as const,
        avatarUrl: driver.avatarUrl,
        createdAt: driver.createdAt,
        approvalStatus: driver.approvalStatus,
        rating: driver.rating,
        totalTrips: driver.totalTrips,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        isOnline: driver.isOnline,
      },
    });
    return;
  }

  res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
});

router.get("/auth/profile", async (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "validation_error", message: "userId required" });
    return;
  }

  const [user, driver] = await Promise.all([
    store.getUserById(userId),
    store.getDriverById(userId),
  ]);

  if (user) {
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
    return;
  }

  if (driver) {
    const { password: _, ...safeDriver } = driver;
    res.json({ ...safeDriver, role: "driver" });
    return;
  }

  res.status(404).json({ error: "not_found", message: "User not found" });
});

router.put("/auth/profile", async (req, res) => {
  const { userId, name, phone, avatarUrl } = req.body;

  if (!userId) {
    res.status(400).json({ error: "validation_error", message: "userId required" });
    return;
  }

  const user = await store.updateUser(userId, { name, phone, avatarUrl });
  if (user) {
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
    return;
  }

  res.status(404).json({ error: "not_found", message: "User not found" });
});

export default router;
