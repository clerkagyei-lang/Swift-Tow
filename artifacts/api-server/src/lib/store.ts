import { randomUUID } from "crypto";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  driversTable,
  towRequestsTable,
  tripsTable,
  type User,
  type Driver,
  type TowRequest,
  type Trip,
} from "@workspace/db";

export type { User, Driver, TowRequest, Trip };

// ─── In-memory fallback (used when DATABASE_URL is not set e.g. Railway) ─────
const memUsers = new Map<string, User>();
const memDrivers = new Map<string, Driver>();
const memTowRequests = new Map<string, TowRequest>();
const memTrips = new Map<string, Trip>();
let memTotalEarnings = 0;

// Real-time GPS cache (always in-memory — too frequent for DB writes)
const driverLocationCache = new Map<string, { latitude: number; longitude: number } | null>();

const SEED_ADMIN_ID     = "00000000-0000-0000-0000-000000000001";
const SEED_DRIVER_1_ID  = "00000000-0000-0000-0000-000000000011";
const SEED_DRIVER_2_ID  = "00000000-0000-0000-0000-000000000012";
const SEED_DRIVER_3_ID  = "00000000-0000-0000-0000-000000000013";
const SEED_PENDING_1_ID = "00000000-0000-0000-0000-000000000021";
const SEED_PENDING_2_ID = "00000000-0000-0000-0000-000000000022";
const SEED_USER_ID      = "00000000-0000-0000-0000-000000000031";

const SEED_DRIVERS = [
  {
    id: SEED_DRIVER_1_ID, name: "Kwame Asante", email: "kwame@swifttow.com", password: "driver123",
    phone: "+233244567890", isOnline: true, currentLocation: { latitude: 5.614818, longitude: -0.205874 },
    avatarUrl: null, rating: 4.8, totalTrips: 142, activeJobId: null, vehicleType: "Flatbed Tow Truck",
    vehiclePlate: "GR 4421-22", licenseNumber: "GHA-DL-2019-00441", approvalStatus: "approved" as const,
    approvalNote: null, earningsToday: 250, earningsTotal: 4200,
  },
  {
    id: SEED_DRIVER_2_ID, name: "Kofi Mensah", email: "kofi@swifttow.com", password: "driver123",
    phone: "+233245678901", isOnline: true, currentLocation: { latitude: 5.603717, longitude: -0.186964 },
    avatarUrl: null, rating: 4.6, totalTrips: 89, activeJobId: null, vehicleType: "Hook & Chain Truck",
    vehiclePlate: "GW 2234-20", licenseNumber: "GHA-DL-2020-00789", approvalStatus: "approved" as const,
    approvalNote: null, earningsToday: 150, earningsTotal: 2800,
  },
  {
    id: SEED_DRIVER_3_ID, name: "Ama Owusu", email: "ama@swifttow.com", password: "driver123",
    phone: "+233246789012", isOnline: false, currentLocation: null,
    avatarUrl: null, rating: 4.9, totalTrips: 210, activeJobId: null, vehicleType: "Flatbed Tow Truck",
    vehiclePlate: "AW 5567-21", licenseNumber: "GHA-DL-2018-00221", approvalStatus: "approved" as const,
    approvalNote: null, earningsToday: 0, earningsTotal: 6100,
  },
  {
    id: SEED_PENDING_1_ID, name: "Yaw Darko", email: "yaw.darko@gmail.com", password: "driver123",
    phone: "+233247112233", isOnline: false, currentLocation: null,
    avatarUrl: null, rating: 0, totalTrips: 0, activeJobId: null, vehicleType: "Wheel-Lift Truck",
    vehiclePlate: "AS 1192-23", licenseNumber: "GHA-DL-2023-00912", approvalStatus: "pending" as const,
    approvalNote: null, earningsToday: 0, earningsTotal: 0,
  },
  {
    id: SEED_PENDING_2_ID, name: "Akosua Frimpong", email: "akosua.f@gmail.com", password: "driver123",
    phone: "+233243998877", isOnline: false, currentLocation: null,
    avatarUrl: null, rating: 0, totalTrips: 0, activeJobId: null, vehicleType: "Flatbed Tow Truck",
    vehiclePlate: "ER 8834-22", licenseNumber: "GHA-DL-2022-00554", approvalStatus: "pending" as const,
    approvalNote: null, earningsToday: 0, earningsTotal: 0,
  },
];

function mergeLocation(driver: Driver): Driver {
  const cached = driverLocationCache.get(driver.id);
  if (cached !== undefined) return { ...driver, currentLocation: cached };
  return driver;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seedDatabase(now: string) {
  if (!db) return;
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, SEED_ADMIN_ID)).limit(1);
  if (existing.length > 0) return;

  await db.insert(usersTable).values([
    { id: SEED_ADMIN_ID, name: "Swift Admin", email: "admin@swifttow.com", password: "admin123", phone: "+233200000000", role: "admin", avatarUrl: null, createdAt: now },
    { id: SEED_USER_ID, name: "John Doe", email: "john@example.com", password: "password123", phone: "+233201234567", role: "user", avatarUrl: null, createdAt: now },
  ]).onConflictDoNothing();

  await db.insert(driversTable).values(
    SEED_DRIVERS.map((d, i) => ({
      ...d,
      createdAt: i >= 3
        ? new Date(Date.now() - (i === 3 ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000)).toISOString()
        : now,
    })) as any
  ).onConflictDoNothing();

  await db.insert(tripsTable).values([
    {
      id: randomUUID(), towRequestId: randomUUID(), userId: SEED_USER_ID,
      driverId: SEED_DRIVER_1_ID, driverName: "Kwame Asante",
      pickupAddress: "Accra Mall, Spintex Road", dropoffAddress: "Tema Community 7",
      vehicleDetails: "Toyota Camry - GT 442-22", towType: "flatbed", amount: 250,
      paymentMethod: "mtn_momo", paymentStatus: "paid",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: randomUUID(), towRequestId: randomUUID(), userId: SEED_USER_ID,
      driverId: SEED_DRIVER_2_ID, driverName: "Kofi Mensah",
      pickupAddress: "Kotoka International Airport", dropoffAddress: "East Legon",
      vehicleDetails: "Honda Accord - GW 234-20", towType: "hook_chain", amount: 180,
      paymentMethod: "cash", paymentStatus: "paid",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as any).onConflictDoNothing();
}

function seedMemory(now: string) {
  if (memUsers.has(SEED_ADMIN_ID)) return;
  memUsers.set(SEED_ADMIN_ID, { id: SEED_ADMIN_ID, name: "Swift Admin", email: "admin@swifttow.com", password: "admin123", phone: "+233200000000", role: "admin", avatarUrl: null, createdAt: now });
  memUsers.set(SEED_USER_ID, { id: SEED_USER_ID, name: "John Doe", email: "john@example.com", password: "password123", phone: "+233201234567", role: "user", avatarUrl: null, createdAt: now });

  SEED_DRIVERS.forEach((d, i) => {
    const createdAt = i >= 3
      ? new Date(Date.now() - (i === 3 ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000)).toISOString()
      : now;
    memDrivers.set(d.id, { ...d, createdAt } as Driver);
  });

  const t1 = { id: randomUUID(), towRequestId: randomUUID(), userId: SEED_USER_ID, driverId: SEED_DRIVER_1_ID, driverName: "Kwame Asante", pickupAddress: "Accra Mall, Spintex Road", dropoffAddress: "Tema Community 7", vehicleDetails: "Toyota Camry - GT 442-22", towType: "flatbed" as const, amount: 250, paymentMethod: "mtn_momo" as const, paymentStatus: "paid" as const, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() };
  const t2 = { id: randomUUID(), towRequestId: randomUUID(), userId: SEED_USER_ID, driverId: SEED_DRIVER_2_ID, driverName: "Kofi Mensah", pickupAddress: "Kotoka International Airport", dropoffAddress: "East Legon", vehicleDetails: "Honda Accord - GW 234-20", towType: "hook_chain" as const, amount: 180, paymentMethod: "cash" as const, paymentStatus: "paid" as const, completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() };
  memTrips.set(t1.id, t1);
  memTrips.set(t2.id, t2);
  memTotalEarnings = 430;
}

async function seed() {
  const now = new Date().toISOString();
  if (db) {
    await seedDatabase(now);
  } else {
    seedMemory(now);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = {
  seed,

  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = randomUUID();
    const user = { ...data, id, createdAt: new Date().toISOString() } as User;
    if (db) {
      await db.insert(usersTable).values(user);
    } else {
      memUsers.set(id, user);
    }
    return user;
  },

  async createDriver(data: Omit<Driver, "id" | "createdAt">): Promise<Driver> {
    const id = randomUUID();
    const driver = { ...data, id, createdAt: new Date().toISOString() } as Driver;
    if (db) {
      await db.insert(driversTable).values(driver as any);
    } else {
      memDrivers.set(id, driver);
    }
    return driver;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (db) {
      const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      return rows[0];
    }
    return Array.from(memUsers.values()).find((u) => u.email === email);
  },

  async getDriverByEmail(email: string): Promise<Driver | undefined> {
    if (db) {
      const rows = await db.select().from(driversTable).where(eq(driversTable.email, email)).limit(1);
      return rows[0] ? mergeLocation(rows[0] as Driver) : undefined;
    }
    const d = Array.from(memDrivers.values()).find((d) => d.email === email);
    return d ? mergeLocation(d) : undefined;
  },

  async getUserById(id: string): Promise<User | undefined> {
    if (db) {
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
      return rows[0];
    }
    return memUsers.get(id);
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    if (db) {
      const rows = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
      return rows[0] ?? null;
    }
    const user = memUsers.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    memUsers.set(id, updated);
    return updated;
  },

  async getDriverById(id: string): Promise<Driver | undefined> {
    if (db) {
      const rows = await db.select().from(driversTable).where(eq(driversTable.id, id)).limit(1);
      return rows[0] ? mergeLocation(rows[0] as Driver) : undefined;
    }
    const d = memDrivers.get(id);
    return d ? mergeLocation(d) : undefined;
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver | null> {
    const { currentLocation, ...dbData } = data as any;
    if (currentLocation !== undefined) driverLocationCache.set(id, currentLocation);

    if (db) {
      if (Object.keys(dbData).length > 0) {
        const rows = await db.update(driversTable).set(dbData).where(eq(driversTable.id, id)).returning();
        return rows[0] ? mergeLocation(rows[0] as Driver) : null;
      }
      const rows = await db.select().from(driversTable).where(eq(driversTable.id, id)).limit(1);
      return rows[0] ? mergeLocation(rows[0] as Driver) : null;
    }
    const driver = memDrivers.get(id);
    if (!driver) return null;
    const updated = { ...driver, ...data };
    memDrivers.set(id, updated);
    return mergeLocation(updated);
  },

  async updateDriverLocationCache(id: string, location: { latitude: number; longitude: number } | null): Promise<void> {
    driverLocationCache.set(id, location);
  },

  async getDrivers(filters?: { online?: boolean }): Promise<Driver[]> {
    let drivers: Driver[];
    if (db) {
      const rows = await db.select().from(driversTable);
      drivers = rows.map((d) => mergeLocation(d as Driver));
    } else {
      drivers = Array.from(memDrivers.values()).map(mergeLocation);
    }
    if (filters?.online !== undefined) drivers = drivers.filter((d) => d.isOnline === filters.online);
    return drivers;
  },

  async getPendingDrivers(): Promise<Driver[]> {
    if (db) {
      const rows = await db.select().from(driversTable).where(eq(driversTable.approvalStatus, "pending"));
      return rows.map((d) => mergeLocation(d as Driver));
    }
    return Array.from(memDrivers.values()).filter((d) => d.approvalStatus === "pending").map(mergeLocation);
  },

  async createTowRequest(data: Omit<TowRequest, "id" | "createdAt" | "updatedAt">): Promise<TowRequest> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const req = { ...data, id, createdAt: now, updatedAt: now } as TowRequest;
    if (db) {
      await db.insert(towRequestsTable).values(req as any);
    } else {
      memTowRequests.set(id, req);
    }
    return req;
  },

  async getTowRequests(filters?: { userId?: string; driverId?: string; status?: string }): Promise<TowRequest[]> {
    if (db) {
      const conditions = [];
      if (filters?.userId) conditions.push(eq(towRequestsTable.userId, filters.userId));
      if (filters?.driverId) conditions.push(eq(towRequestsTable.driverId, filters.driverId));
      if (filters?.status) conditions.push(eq(towRequestsTable.status, filters.status as any));
      const rows = conditions.length > 0
        ? await db.select().from(towRequestsTable).where(and(...conditions)).orderBy(desc(towRequestsTable.createdAt))
        : await db.select().from(towRequestsTable).orderBy(desc(towRequestsTable.createdAt));
      return rows as unknown as TowRequest[];
    }
    let results = Array.from(memTowRequests.values());
    if (filters?.userId) results = results.filter((r) => r.userId === filters.userId);
    if (filters?.driverId) results = results.filter((r) => r.driverId === filters.driverId);
    if (filters?.status) results = results.filter((r) => r.status === filters.status);
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getTowRequestById(id: string): Promise<TowRequest | undefined> {
    if (db) {
      const rows = await db.select().from(towRequestsTable).where(eq(towRequestsTable.id, id)).limit(1);
      return rows[0] as unknown as TowRequest | undefined;
    }
    return memTowRequests.get(id);
  },

  async updateTowRequest(id: string, data: Partial<TowRequest>): Promise<TowRequest | null> {
    if (db) {
      const rows = await db.update(towRequestsTable)
        .set({ ...data, updatedAt: new Date().toISOString() } as any)
        .where(eq(towRequestsTable.id, id))
        .returning();
      return (rows[0] as unknown as TowRequest) ?? null;
    }
    const req = memTowRequests.get(id);
    if (!req) return null;
    const updated = { ...req, ...data, updatedAt: new Date().toISOString() };
    memTowRequests.set(id, updated);
    return updated;
  },

  async createTrip(data: Omit<Trip, "id">): Promise<Trip> {
    const id = randomUUID();
    const trip = { ...data, id } as Trip;
    if (db) {
      await db.insert(tripsTable).values(trip as any);
    } else {
      memTrips.set(id, trip);
      memTotalEarnings += data.amount;
    }
    return trip;
  },

  async getTripsByUser(userId: string): Promise<Trip[]> {
    if (db) {
      const rows = await db.select().from(tripsTable)
        .where(eq(tripsTable.userId, userId))
        .orderBy(desc(tripsTable.completedAt));
      return rows as unknown as Trip[];
    }
    return Array.from(memTrips.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },

  async getTripsByDriver(driverId: string): Promise<Trip[]> {
    if (db) {
      const rows = await db.select().from(tripsTable)
        .where(eq(tripsTable.driverId, driverId))
        .orderBy(desc(tripsTable.completedAt));
      return rows as unknown as Trip[];
    }
    return Array.from(memTrips.values())
      .filter((t) => t.driverId === driverId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },

  async getTripById(id: string): Promise<Trip | undefined> {
    if (db) {
      const rows = await db.select().from(tripsTable).where(eq(tripsTable.id, id)).limit(1);
      return rows[0] as unknown as Trip | undefined;
    }
    return memTrips.get(id);
  },

  async markPaymentPaid(tripId: string, method: Trip["paymentMethod"]): Promise<Trip | null> {
    if (db) {
      const rows = await db.update(tripsTable)
        .set({ paymentStatus: "paid", paymentMethod: method })
        .where(eq(tripsTable.id, tripId))
        .returning();
      return (rows[0] as unknown as Trip) ?? null;
    }
    const trip = memTrips.get(tripId);
    if (!trip) return null;
    const updated = { ...trip, paymentStatus: "paid" as const, paymentMethod: method };
    memTrips.set(tripId, updated);
    return updated;
  },

  async getStats() {
    if (db) {
      const [drivers, activeTows, pendingTows, earningsResult, tripsResult, pendingDrivers, recentRequests] =
        await Promise.all([
          db.select().from(driversTable),
          db.select().from(towRequestsTable).where(or(eq(towRequestsTable.status, "accepted"), eq(towRequestsTable.status, "in_progress"))),
          db.select().from(towRequestsTable).where(eq(towRequestsTable.status, "pending")),
          db.select({ total: sql<number>`coalesce(sum(${tripsTable.amount}), 0)` }).from(tripsTable),
          db.select({ count: sql<number>`count(*)` }).from(tripsTable),
          db.select().from(driversTable).where(eq(driversTable.approvalStatus, "pending")),
          db.select().from(towRequestsTable).orderBy(desc(towRequestsTable.createdAt)).limit(5),
        ]);
      const onlineDrivers = drivers.map((d) => mergeLocation(d as Driver)).filter((d) => d.isOnline).length;
      return {
        onlineDrivers,
        activeJobs: activeTows.length,
        totalEarnings: earningsResult[0]?.total ?? 0,
        totalTrips: Number(tripsResult[0]?.count ?? 0),
        pendingRequests: pendingTows.length,
        pendingDrivers: pendingDrivers.length,
        recentRequests: recentRequests as unknown as TowRequest[],
      };
    }
    // In-memory fallback
    const onlineDrivers = Array.from(memDrivers.values()).map(mergeLocation).filter((d) => d.isOnline).length;
    const activeJobs = Array.from(memTowRequests.values()).filter((r) => r.status === "accepted" || r.status === "in_progress").length;
    const pendingRequests = Array.from(memTowRequests.values()).filter((r) => r.status === "pending").length;
    const pendingDrivers = Array.from(memDrivers.values()).filter((d) => d.approvalStatus === "pending").length;
    const recentRequests = Array.from(memTowRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    return { onlineDrivers, activeJobs, totalEarnings: memTotalEarnings, totalTrips: memTrips.size, pendingRequests, pendingDrivers, recentRequests };
  },
};
