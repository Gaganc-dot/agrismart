/**
 * tests/api.test.js
 * ─────────────────────────────────────────────────────────────────
 * Agri Smart Connect — Automated API Test Suite
 *
 * Coverage:
 *   1. Health Check
 *   2. Auth  — signup, validation, duplicate email, admin block,
 *              signin (wrong creds / unverified), protected route
 *   3. Expenses  — CRUD + summary + ownership isolation
 *   4. Crop Calendar  — create, list, mark stage done, delete
 *   5. Mandi Prices   — list, filter by state, pagination
 *
 * Setup:
 *   - mongodb-memory-server (no real DB)
 *   - supertest (no real HTTP server)
 *   - setup.js wired via jest.config globalSetup / setupFilesAfterFramework
 * ─────────────────────────────────────────────────────────────────
 */

const request  = require("supertest");
const jwt      = require("jsonwebtoken");
const mongoose = require("mongoose");
const app      = require("../app");

// ── Helpers ───────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_agrismart";

/** Create a real User doc and return a signed token for that user */
async function createVerifiedUser(overrides = {}) {
  const User = require("../models/User");
  const data = {
    name:       overrides.name       || "Test Farmer",
    email:      overrides.email      || `farmer_${Date.now()}@test.com`,
    password:   overrides.password   || "password123",
    role:       overrides.role       || "farmer",
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
  };
  const user  = await User.create(data);
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
  return { user, token };
}

// ═════════════════════════════════════════════════════════════════
// 1.  HEALTH CHECK
// ═════════════════════════════════════════════════════════════════
describe("Health Check", () => {
  test("GET / returns API info", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Agri-Smart Connect/i);
  });

  test("GET /api/health returns DB status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // In-memory DB is connected, so db should be 'connected'
    expect(res.body.db).toBe("connected");
  });
});

// ═════════════════════════════════════════════════════════════════
// 2.  AUTH ROUTES
// ═════════════════════════════════════════════════════════════════
describe("Auth — POST /api/auth/signup", () => {
  const validPayload = {
    name:     "Ravi Kumar",
    email:    "ravi@farmtest.com",
    password: "securePass1",
    role:     "farmer",
  };

  test("returns 201 and success message on valid signup", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send(validPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/registration successful/i);
  });

  test("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "No Email", password: "pass123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test("returns 400 when password is shorter than 6 chars", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Short", email: "short@test.com", password: "abc" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("returns 400 on duplicate email", async () => {
    // First registration
    await request(app).post("/api/auth/signup").send(validPayload);
    // Second with same email
    const res = await request(app).post("/api/auth/signup").send(validPayload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test("blocks admin self-registration (403)", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPayload, email: "admin@agri.com", role: "admin" });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe("Auth — POST /api/auth/signin", () => {
  test("returns 401 for wrong credentials", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: "nobody@test.com", password: "wrongpass" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("returns 403 for unverified account", async () => {
    // Create user without verifying
    await request(app)
      .post("/api/auth/signup")
      .send({ name: "Unverified", email: "unverified@test.com", password: "pass1234", role: "farmer" });

    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: "unverified@test.com", password: "pass1234" });

    expect(res.statusCode).toBe(403);
    expect(res.body.isVerified).toBe(false);
  });

  test("signs in successfully and returns token for verified user", async () => {
    const User = require("../models/User");
    // Create a pre-verified user directly in DB
    await User.create({
      name: "Verified Farmer", email: "verified@test.com",
      password: "verified123", role: "farmer", isVerified: true,
    });

    const res = await request(app)
      .post("/api/auth/signin")
      .send({ email: "verified@test.com", password: "verified123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("farmer");
  });
});

describe("Auth — GET /api/auth/me (protected)", () => {
  test("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("returns 401 with a tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer totally.invalid.token");
    expect(res.statusCode).toBe(401);
  });

  test("returns user profile with valid token", async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBeDefined();
  });
});

describe("Auth — PUT /api/auth/profile", () => {
  test("updates buyer profile with spaced Indian phone and company name", async () => {
    const { token } = await createVerifiedUser({
      name: "Test Buyer",
      email: "buyer_profile@test.com",
      role: "buyer",
    });

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Buyer",
        phone: "8530748696",
        farmName: "",
        location: "",
        companyName: "FreshMart Pvt. Ltd.",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe("8530748696");
    expect(res.body.user.companyName).toBe("FreshMart Pvt. Ltd.");
  });

  test("updates farmer profile fields through the same route", async () => {
    const { token } = await createVerifiedUser({
      name: "Test Farmer",
      email: "farmer_profile@test.com",
      role: "farmer",
    });

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Farmer",
        phone: "9876543210",
        farmName: "Green Valley Farm",
        location: "Nashik, Maharashtra",
        companyName: "",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe("9876543210");
    expect(res.body.user.farmName).toBe("Green Valley Farm");
    expect(res.body.user.location).toBe("Nashik, Maharashtra");
  });
});

// ═════════════════════════════════════════════════════════════════
// 3.  EXPENSES  (/api/expenses)
// ═════════════════════════════════════════════════════════════════
describe("Expenses", () => {
  const expensePayload = {
    title:    "Fertilizer purchase",
    amount:   1500,
    type:     "expense",
    category: "fertilizer",
    note:     "Urea bag",
  };

  test("POST /api/expenses — creates expense and returns 201", async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send(expensePayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.expense.title).toBe("Fertilizer purchase");
    expect(res.body.expense.amount).toBe(1500);
  });

  test("GET /api/expenses — lists expenses for authenticated farmer", async () => {
    const { token } = await createVerifiedUser();

    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send(expensePayload);

    const res = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.expenses)).toBe(true);
    expect(res.body.expenses.length).toBe(1);
  });

  test("GET /api/expenses — returns 0 entries for a different farmer", async () => {
    const farmer1 = await createVerifiedUser({ email: "f1@test.com" });
    const farmer2 = await createVerifiedUser({ email: "f2@test.com" });

    // Farmer1 creates an expense
    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${farmer1.token}`)
      .send(expensePayload);

    // Farmer2 should NOT see farmer1's data
    const res = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${farmer2.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.expenses.length).toBe(0);
  });

  test("PUT /api/expenses/:id — updates the expense", async () => {
    const { token } = await createVerifiedUser();
    const create = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send(expensePayload);

    const id = create.body.expense._id;
    const res = await request(app)
      .put(`/api/expenses/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 2000, note: "Updated note" });

    expect(res.statusCode).toBe(200);
    expect(res.body.expense.amount).toBe(2000);
    expect(res.body.expense.note).toBe("Updated note");
  });

  test("PUT /api/expenses/:id — returns 404 for another user's expense", async () => {
    const farmer1 = await createVerifiedUser({ email: "own1@test.com" });
    const farmer2 = await createVerifiedUser({ email: "own2@test.com" });

    const create = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${farmer1.token}`)
      .send(expensePayload);

    const id = create.body.expense._id;
    const res = await request(app)
      .put(`/api/expenses/${id}`)
      .set("Authorization", `Bearer ${farmer2.token}`)
      .send({ amount: 9999 });

    expect(res.statusCode).toBe(404);
  });

  test("DELETE /api/expenses/:id — deletes expense", async () => {
    const { token } = await createVerifiedUser();
    const create = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send(expensePayload);

    const id = create.body.expense._id;
    const del = await request(app)
      .delete(`/api/expenses/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);

    // Verify it's gone
    const list = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(list.body.expenses.length).toBe(0);
  });

  test("GET /api/expenses/summary — returns income/expense totals", async () => {
    const { token } = await createVerifiedUser();

    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Seed sale", amount: 5000, type: "income", category: "sale" });

    await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Labour", amount: 2000, type: "expense", category: "labour" });

    const res = await request(app)
      .get("/api/expenses/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalIncome).toBe(5000);
    expect(res.body.totalExpense).toBe(2000);
    expect(res.body.balance).toBe(3000);
  });

  test("POST /api/expenses — returns 401 without token", async () => {
    const res = await request(app).post("/api/expenses").send(expensePayload);
    expect(res.statusCode).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 4.  CROP CALENDAR  (/api/calendar)
// ═════════════════════════════════════════════════════════════════
describe("Crop Calendar", () => {
  const calendarPayload = {
    cropName:   "Wheat",
    sowingDate: new Date("2025-11-01").toISOString(),
  };

  test("POST /api/calendar — creates calendar with 5 stages", async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send(calendarPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.calendar.cropName).toBe("Wheat");
    expect(Array.isArray(res.body.calendar.stages)).toBe(true);
    expect(res.body.calendar.stages.length).toBeGreaterThanOrEqual(3);
    res.body.calendar.stages.forEach((stage) => {
      expect(stage).toHaveProperty("name");
      expect(stage).toHaveProperty("dueDate");
      expect(stage).toHaveProperty("status", "pending");
    });
  });

  test("POST /api/calendar — returns 400 when cropName is missing", async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send({ sowingDate: "2025-11-01" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/calendar — lists farmer's calendars", async () => {
    const { token } = await createVerifiedUser();

    await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send(calendarPayload);

    await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send({ cropName: "Rice", sowingDate: "2025-06-15" });

    const res = await request(app)
      .get("/api/calendar")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.calendars).toHaveLength(2);
  });

  test("PUT /api/calendar/:id/stage/:stageId — marks stage as done", async () => {
    const { token } = await createVerifiedUser();

    const create = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send(calendarPayload);

    const calId   = create.body.calendar._id;
    const stageId = create.body.calendar.stages[0]._id; // Sowing

    const res = await request(app)
      .put(`/api/calendar/${calId}/stage/${stageId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "done" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const updatedStage = res.body.calendar.stages.find((s) => s._id === stageId);
    expect(updatedStage.status).toBe("done");
  });

  test("DELETE /api/calendar/:id — deletes a calendar", async () => {
    const { token } = await createVerifiedUser();

    const create = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send(calendarPayload);

    const calId = create.body.calendar._id;
    const del   = await request(app)
      .delete(`/api/calendar/${calId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app)
      .get("/api/calendar")
      .set("Authorization", `Bearer ${token}`);

    expect(list.body.calendars).toHaveLength(0);
  });

  test("DELETE /api/calendar/:id — returns 404 for another user's calendar", async () => {
    const farmer1 = await createVerifiedUser({ email: "cal1@test.com" });
    const farmer2 = await createVerifiedUser({ email: "cal2@test.com" });

    const create = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${farmer1.token}`)
      .send(calendarPayload);

    const calId = create.body.calendar._id;
    const res = await request(app)
      .delete(`/api/calendar/${calId}`)
      .set("Authorization", `Bearer ${farmer2.token}`);

    expect(res.statusCode).toBe(404);
  });

  test("GET /api/calendar — returns 401 without token", async () => {
    const res = await request(app).get("/api/calendar");
    expect(res.statusCode).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 5.  MANDI PRICES  (/api/mandi)
// ═════════════════════════════════════════════════════════════════
describe("Mandi Prices", () => {
  const MandiPrice = require("../models/MandiPrice");

  /** Seed a few mandi records directly into the in-memory DB */
  async function seedMandi() {
    await MandiPrice.insertMany([
      {
        state: "Maharashtra", district: "Pune", market: "Pune Mandi",
        commodity: "Tomato", variety: "Local",
        minPrice: 800, maxPrice: 1200, modalPrice: 1000,
        date: "2025-06-01",
      },
      {
        state: "Maharashtra", district: "Nashik", market: "Nashik Mandi",
        commodity: "Onion", variety: "Red",
        minPrice: 500, maxPrice: 900, modalPrice: 700,
        date: "2025-06-01",
      },
      {
        state: "Punjab", district: "Ludhiana", market: "Ludhiana Mandi",
        commodity: "Wheat", variety: "PB50",
        minPrice: 2015, maxPrice: 2100, modalPrice: 2050,
        date: "2025-06-01",
      },
    ]);
  }

  test("GET /api/mandi — returns paginated list", async () => {
    await seedMandi();
    const res = await request(app).get("/api/mandi");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });

  test("GET /api/mandi?state=Maharashtra — filters by state", async () => {
    await seedMandi();
    const res = await request(app).get("/api/mandi?state=Maharashtra");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.every((d) => d.state === "Maharashtra")).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test("GET /api/mandi?commodity=Wheat — filters by commodity", async () => {
    await seedMandi();
    const res = await request(app).get("/api/mandi?commodity=Wheat");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].commodity).toBe("Wheat");
  });

  test("GET /api/mandi?page=1&limit=2 — respects pagination", async () => {
    await seedMandi();
    const res = await request(app).get("/api/mandi?page=1&limit=2");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("pages");
  });

  test("GET /api/mandi — returns 200 even when DB is empty (no 500)", async () => {
    // No seeding — empty collection
    const res = await request(app).get("/api/mandi");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// 6.  404 HANDLING
// ═════════════════════════════════════════════════════════════════
describe("404 Handler", () => {
  test("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
