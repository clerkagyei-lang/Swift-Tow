import { Router } from "express";
import { store } from "../lib/store";

const router = Router();

router.post("/auth/register", (req, res) => {
  const { name, email, password, phone, role = "user" } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: "validation_error", message: "All fields are required" });
    return;
  }

  const existing = store.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: "email_taken", message: "Email already registered" });
    return;
  }

  const user = store.createUser({ name, email, password, phone, role: role as "user" | "driver", avatarUrl: null });

  const { password: _, ...safeUser } = user;
  res.status(201).json({ token: user.id, user: safeUser });
});

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "validation_error", message: "Email and password required" });
    return;
  }

  const user = store.getUserByEmail(email);
  if (!user || user.password !== password) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({ token: user.id, user: safeUser });
});

router.get("/auth/profile", (req, res) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "validation_error", message: "userId required" });
    return;
  }

  const user = store.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

router.put("/auth/profile", (req, res) => {
  const { userId, name, phone, avatarUrl } = req.body;

  if (!userId) {
    res.status(400).json({ error: "validation_error", message: "userId required" });
    return;
  }

  const user = store.updateUser(userId, { name, phone, avatarUrl });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
