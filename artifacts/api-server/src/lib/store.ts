import { randomUUID } from "crypto";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "user" | "driver" | "admin";
  avatarUrl: string | null;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  isOnline: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  avatarUrl: string | null;
  rating: number;
  totalTrips: number;
  activeJobId: string | null;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  approvalStatus: "pending" | "approved" | "suspended";
  approvalNote: string | null;
  earningsToday: number;
  earningsTotal: number;
  createdAt: string;
}

export interface TowRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  towType: "flatbed" | "hook_chain" | "repair";
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  pickupLocation: { latitude: number; longitude: number };
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleDetails: string;
  driverId: string | null;
  estimatedArrival: number | null;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  towRequestId: string;
  userId: string;
  driverId: string;
  driverName: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleDetails: string;
  towType: "flatbed" | "hook_chain" | "repair";
  amount: number;
  paymentMethod: "mtn_momo" | "telecel_cash" | "at_money" | "cash" | null;
  paymentStatus: "pending" | "paid";
  completedAt: string;
}

const users = new Map<string, User>();
const drivers = new Map<string, Driver>();
const towRequests = new Map<string, TowRequest>();
const trips = new Map<string, Trip>();
let totalEarnings = 0;

function seedData() {
  const now = new Date().toISOString();

  // Seed admin user
  const adminId = randomUUID();
  users.set(adminId, {
    id: adminId,
    name: "Swift Admin",
    email: "admin@swifttow.com",
    password: "admin123",
    phone: "+233200000000",
    role: "admin",
    avatarUrl: null,
    createdAt: now,
  });

  const driver1Id = randomUUID();
  drivers.set(driver1Id, {
    id: driver1Id,
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
  });

  const driver2Id = randomUUID();
  drivers.set(driver2Id, {
    id: driver2Id,
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
  });

  const driver3Id = randomUUID();
  drivers.set(driver3Id, {
    id: driver3Id,
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
  });

  const userId = randomUUID();
  users.set(userId, {
    id: userId,
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    phone: "+233201234567",
    role: "user",
    avatarUrl: null,
    createdAt: now,
  });

  const trip1Id = randomUUID();
  trips.set(trip1Id, {
    id: trip1Id,
    towRequestId: randomUUID(),
    userId,
    driverId: driver1Id,
    driverName: "Kwame Asante",
    pickupAddress: "Accra Mall, Spintex Road",
    dropoffAddress: "Tema Community 7",
    vehicleDetails: "Toyota Camry - GT 442-22",
    towType: "flatbed",
    amount: 250,
    paymentMethod: "mtn_momo",
    paymentStatus: "paid",
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const trip2Id = randomUUID();
  trips.set(trip2Id, {
    id: trip2Id,
    towRequestId: randomUUID(),
    userId,
    driverId: driver2Id,
    driverName: "Kofi Mensah",
    pickupAddress: "Kotoka International Airport",
    dropoffAddress: "East Legon",
    vehicleDetails: "Honda Accord - GW 234-20",
    towType: "hook_chain",
    amount: 180,
    paymentMethod: "cash",
    paymentStatus: "paid",
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  totalEarnings = 430;
}

seedData();

export const store = {
  users,
  drivers,
  towRequests,
  trips,

  createUser(data: Omit<User, "id" | "createdAt">): User {
    const id = randomUUID();
    const user: User = { ...data, id, createdAt: new Date().toISOString() };
    users.set(id, user);
    return user;
  },

  createDriver(data: Omit<Driver, "id" | "createdAt">): Driver {
    const id = randomUUID();
    const driver: Driver = { ...data, id, createdAt: new Date().toISOString() };
    drivers.set(id, driver);
    return driver;
  },

  getUserByEmail(email: string): User | undefined {
    return Array.from(users.values()).find((u) => u.email === email);
  },

  getDriverByEmail(email: string): Driver | undefined {
    return Array.from(drivers.values()).find((d) => d.email === email);
  },

  getUserById(id: string): User | undefined {
    return users.get(id);
  },

  updateUser(id: string, data: Partial<User>): User | null {
    const user = users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    users.set(id, updated);
    return updated;
  },

  updateDriver(id: string, data: Partial<Driver>): Driver | null {
    const driver = drivers.get(id);
    if (!driver) return null;
    const updated = { ...driver, ...data };
    drivers.set(id, updated);
    return updated;
  },

  getPendingDrivers(): Driver[] {
    return Array.from(drivers.values()).filter((d) => d.approvalStatus === "pending");
  },

  createTowRequest(data: Omit<TowRequest, "id" | "createdAt" | "updatedAt">): TowRequest {
    const id = randomUUID();
    const now = new Date().toISOString();
    const req: TowRequest = { ...data, id, createdAt: now, updatedAt: now };
    towRequests.set(id, req);
    return req;
  },

  updateTowRequest(id: string, data: Partial<TowRequest>): TowRequest | null {
    const req = towRequests.get(id);
    if (!req) return null;
    const updated = { ...req, ...data, updatedAt: new Date().toISOString() };
    towRequests.set(id, updated);
    return updated;
  },

  createTrip(data: Omit<Trip, "id">): Trip {
    const id = randomUUID();
    const trip: Trip = { ...data, id };
    trips.set(id, trip);
    totalEarnings += data.amount;
    return trip;
  },

  getTotalEarnings(): number {
    return totalEarnings;
  },

  markPaymentPaid(tripId: string, method: Trip["paymentMethod"]): Trip | null {
    const trip = trips.get(tripId);
    if (!trip) return null;
    const updated = { ...trip, paymentStatus: "paid" as const, paymentMethod: method };
    trips.set(tripId, updated);
    return updated;
  },

  getStats() {
    const onlineDrivers = Array.from(drivers.values()).filter((d) => d.isOnline).length;
    const activeJobs = Array.from(towRequests.values()).filter(
      (r) => r.status === "accepted" || r.status === "in_progress"
    ).length;
    const pendingRequests = Array.from(towRequests.values()).filter(
      (r) => r.status === "pending"
    ).length;
    const pendingDrivers = Array.from(drivers.values()).filter(
      (d) => d.approvalStatus === "pending"
    ).length;
    const recentRequests = Array.from(towRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      onlineDrivers,
      activeJobs,
      totalEarnings,
      totalTrips: trips.size,
      pendingRequests,
      pendingDrivers,
      recentRequests,
    };
  },
};
