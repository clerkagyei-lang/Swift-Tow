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

// In-memory cache for real-time driver locations only (not persisted — live GPS)
const driverLocationCache = new Map<string, { latitude: number; longitude: number } | null>();

const SEED_ADMIN_ID    = "00000000-0000-0000-0000-000000000001";
const SEED_DRIVER_1_ID = "00000000-0000-0000-0000-000000000011";
const SEED_DRIVER_2_ID = "00000000-0000-0000-0000-000000000012";
const SEED_DRIVER_3_ID = "00000000-0000-0000-0000-000000000013";
const SEED_PENDING_1_ID = "00000000-0000-0000-0000-000000000021";
const SEED_PENDING_2_ID = "00000000-0000-0000-0000-000000000022";
const SEED_USER_ID     = "00000000-0000-0000-0000-000000000031";

async function seedData() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.id, SEED_ADMIN_ID)).limit(1);
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  await db.insert(usersTable).values([
    {
      id: SEED_ADMIN_ID,
      name: "Swift Admin",
      email: "admin@swifttow.com",
      password: "admin123",
      phone: "+233200000000",
      role: "admin",
      avatarUrl: null,
      createdAt: now,
    },
    {
      id: SEED_USER_ID,
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "+233201234567",
      role: "user",
      avatarUrl: null,
      createdAt: now,
    },
  ]).onConflictDoNothing();

  await db.insert(driversTable).values([
    {
      id: SEED_DRIVER_1_ID,
      name: "Kwame Asante",
      email: "kwame@swifttow.com",
      password: "driver123",
      phone: "+233244567890",
      isOnline: true,
      currentLocation: { latitude: 5.614818, longitude: -0.205874 },
      avatarUrl: null,
      rating: 4.8,
      totalTrips: 142,
      activeJobId: null,
      vehicleType: "Flatbed Tow Truck",
      vehiclePlate: "GR 4421-22",
      licenseNumber: "GHA-DL-2019-00441",
      approvalStatus: "approved",
      approvalNote: null,
      earningsToday: 250,
      earningsTotal: 4200,
      createdAt: now,
    },
    {
      id: SEED_DRIVER_2_ID,
      name: "Kofi Mensah",
      email: "kofi@swifttow.com",
      password: "driver123",
      phone: "+233245678901",
      isOnline: true,
      currentLocation: { latitude: 5.603717, longitude: -0.186964 },
      avatarUrl: null,
      rating: 4.6,
      totalTrips: 89,
      activeJobId: null,
      vehicleType: "Hook & Chain Truck",
      vehiclePlate: "GW 2234-20",
      licenseNumber: "GHA-DL-2020-00789",
      approvalStatus: "approved",
      approvalNote: null,
      earningsToday: 150,
      earningsTotal: 2800,
      createdAt: now,
    },
    {
      id: SEED_DRIVER_3_ID,
      name: "Ama Owusu",
      email: "ama@swifttow.com",
      password: "driver123",
      phone: "+233246789012",
      isOnline: false,
      currentLocation: null,
      avatarUrl: null,
      rating: 4.9,
      totalTrips: 210,
      activeJobId: null,
      vehicleType: "Flatbed Tow Truck",
      vehiclePlate: "AW 5567-21",
      licenseNumber: "GHA-DL-2018-00221",
      approvalStatus: "approved",
      approvalNote: null,
      earningsToday: 0,
      earningsTotal: 6100,
      createdAt: now,
    },
    {
      id: SEED_PENDING_1_ID,
      name: "Yaw Darko",
      email: "yaw.darko@gmail.com",
      password: "driver123",
      phone: "+233247112233",
      isOnline: false,
      currentLocation: null,
      avatarUrl: null,
      rating: 0,
      totalTrips: 0,
      activeJobId: null,
      vehicleType: "Wheel-Lift Truck",
      vehiclePlate: "AS 1192-23",
      licenseNumber: "GHA-DL-2023-00912",
      approvalStatus: "pending",
      approvalNote: null,
      earningsToday: 0,
      earningsTotal: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: SEED_PENDING_2_ID,
      name: "Akosua Frimpong",
      email: "akosua.f@gmail.com",
      password: "driver123",
      phone: "+233243998877",
      isOnline: false,
      currentLocation: null,
      avatarUrl: null,
      rating: 0,
      totalTrips: 0,
      activeJobId: null,
      vehicleType: "Flatbed Tow Truck",
      vehiclePlate: "ER 8834-22",
      licenseNumber: "GHA-DL-2022-00554",
      approvalStatus: "pending",
      approvalNote: null,
      earningsToday: 0,
      earningsTotal: 0,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ]).onConflictDoNothing();

  const trip1Id = randomUUID();
  const trip2Id = randomUUID();
  const req1Id = randomUUID();
  const req2Id = randomUUID();

  await db.insert(tripsTable).values([
    {
      id: trip1Id,
      towRequestId: req1Id,
      userId: SEED_USER_ID,
      driverId: SEED_DRIVER_1_ID,
      driverName: "Kwame Asante",
      pickupAddress: "Accra Mall, Spintex Road",
      dropoffAddress: "Tema Community 7",
      vehicleDetails: "Toyota Camry - GT 442-22",
      towType: "flatbed",
      amount: 250,
      paymentMethod: "mtn_momo",
      paymentStatus: "paid",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: trip2Id,
      towRequestId: req2Id,
      userId: SEED_USER_ID,
      driverId: SEED_DRIVER_2_ID,
      driverName: "Kofi Mensah",
      pickupAddress: "Kotoka International Airport",
      dropoffAddress: "East Legon",
      vehicleDetails: "Honda Accord - GW 234-20",
      towType: "hook_chain",
      amount: 180,
      paymentMethod: "cash",
      paymentStatus: "paid",
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]).onConflictDoNothing();
}

function mergeLocation(driver: Driver): Driver {
  const cached = driverLocationCache.get(driver.id);
  if (cached !== undefined) {
    return { ...driver, currentLocation: cached };
  }
  return driver;
}

export const store = {
  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = randomUUID();
    const user = { ...data, id, createdAt: new Date().toISOString() };
    await db.insert(usersTable).values(user);
    return user;
  },

  async createDriver(data: Omit<Driver, "id" | "createdAt">): Promise<Driver> {
    const id = randomUUID();
    const driver = { ...data, id, createdAt: new Date().toISOString() };
    await db.insert(driversTable).values(driver as any);
    return driver;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return rows[0];
  },

  async getDriverByEmail(email: string): Promise<Driver | undefined> {
    const rows = await db.select().from(driversTable).where(eq(driversTable.email, email)).limit(1);
    return rows[0] ? mergeLocation(rows[0] as Driver) : undefined;
  },

  async getUserById(id: string): Promise<User | undefined> {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return rows[0];
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const rows = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
    return rows[0] ?? null;
  },

  async getDriverById(id: string): Promise<Driver | undefined> {
    const rows = await db.select().from(driversTable).where(eq(driversTable.id, id)).limit(1);
    return rows[0] ? mergeLocation(rows[0] as Driver) : undefined;
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<Driver | null> {
    // currentLocation writes go to cache only for real-time; persist everything else
    const { currentLocation, ...dbData } = data as any;
    if (currentLocation !== undefined) {
      driverLocationCache.set(id, currentLocation);
    }
    if (Object.keys(dbData).length > 0) {
      const rows = await db.update(driversTable).set(dbData).where(eq(driversTable.id, id)).returning();
      return rows[0] ? mergeLocation(rows[0] as Driver) : null;
    }
    // Only location changed — return merged driver from DB
    const rows = await db.select().from(driversTable).where(eq(driversTable.id, id)).limit(1);
    return rows[0] ? mergeLocation(rows[0] as Driver) : null;
  },

  async updateDriverLocationCache(id: string, location: { latitude: number; longitude: number } | null): Promise<void> {
    driverLocationCache.set(id, location);
  },

  async getDrivers(filters?: { online?: boolean }): Promise<Driver[]> {
    const rows = await db.select().from(driversTable);
    let drivers = rows.map((d) => mergeLocation(d as Driver));
    if (filters?.online !== undefined) {
      drivers = drivers.filter((d) => d.isOnline === filters.online);
    }
    return drivers;
  },

  async getPendingDrivers(): Promise<Driver[]> {
    const rows = await db.select().from(driversTable).where(eq(driversTable.approvalStatus, "pending"));
    return rows.map((d) => mergeLocation(d as Driver));
  },

  async createTowRequest(data: Omit<TowRequest, "id" | "createdAt" | "updatedAt">): Promise<TowRequest> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const req = { ...data, id, createdAt: now, updatedAt: now } as TowRequest;
    await db.insert(towRequestsTable).values(req as any);
    return req;
  },

  async getTowRequests(filters?: { userId?: string; driverId?: string; status?: string }): Promise<TowRequest[]> {
    let query = db.select().from(towRequestsTable);
    const conditions = [];
    if (filters?.userId) conditions.push(eq(towRequestsTable.userId, filters.userId));
    if (filters?.driverId) conditions.push(eq(towRequestsTable.driverId, filters.driverId));
    if (filters?.status) conditions.push(eq(towRequestsTable.status, filters.status as any));

    const rows = conditions.length > 0
      ? await db.select().from(towRequestsTable).where(and(...conditions)).orderBy(desc(towRequestsTable.createdAt))
      : await db.select().from(towRequestsTable).orderBy(desc(towRequestsTable.createdAt));

    return rows as unknown as TowRequest[];
  },

  async getTowRequestById(id: string): Promise<TowRequest | undefined> {
    const rows = await db.select().from(towRequestsTable).where(eq(towRequestsTable.id, id)).limit(1);
    return rows[0] as unknown as TowRequest | undefined;
  },

  async updateTowRequest(id: string, data: Partial<TowRequest>): Promise<TowRequest | null> {
    const rows = await db.update(towRequestsTable)
      .set({ ...data, updatedAt: new Date().toISOString() } as any)
      .where(eq(towRequestsTable.id, id))
      .returning();
    return (rows[0] as unknown as TowRequest) ?? null;
  },

  async createTrip(data: Omit<Trip, "id">): Promise<Trip> {
    const id = randomUUID();
    const trip = { ...data, id } as Trip;
    await db.insert(tripsTable).values(trip as any);
    return trip;
  },

  async getTripsByUser(userId: string): Promise<Trip[]> {
    const rows = await db.select().from(tripsTable)
      .where(eq(tripsTable.userId, userId))
      .orderBy(desc(tripsTable.completedAt));
    return rows as unknown as Trip[];
  },

  async getTripById(id: string): Promise<Trip | undefined> {
    const rows = await db.select().from(tripsTable).where(eq(tripsTable.id, id)).limit(1);
    return rows[0] as unknown as Trip | undefined;
  },

  async markPaymentPaid(tripId: string, method: Trip["paymentMethod"]): Promise<Trip | null> {
    const rows = await db.update(tripsTable)
      .set({ paymentStatus: "paid", paymentMethod: method })
      .where(eq(tripsTable.id, tripId))
      .returning();
    return (rows[0] as unknown as Trip) ?? null;
  },

  async getTotalEarnings(): Promise<number> {
    const result = await db.select({ total: sql<number>`coalesce(sum(${tripsTable.amount}), 0)` }).from(tripsTable);
    return result[0]?.total ?? 0;
  },

  async getStats() {
    const [drivers, activeTows, pendingTows, totalEarnings, totalTrips, pendingDrivers, recentRequests] =
      await Promise.all([
        db.select().from(driversTable),
        db.select().from(towRequestsTable).where(or(
          eq(towRequestsTable.status, "accepted"),
          eq(towRequestsTable.status, "in_progress"),
        )),
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
      totalEarnings: totalEarnings[0]?.total ?? 0,
      totalTrips: Number(totalTrips[0]?.count ?? 0),
      pendingRequests: pendingTows.length,
      pendingDrivers: pendingDrivers.length,
      recentRequests: recentRequests as unknown as TowRequest[],
    };
  },

  seed: seedData,
};
