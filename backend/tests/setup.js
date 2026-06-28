/**
 * tests/setup.js
 * Global Jest setup / teardown.
 *
 * Spins up mongodb-memory-server before the test suite and connects Mongoose
 * to it, then tears it all down when every test has finished.
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// ── Global setup ─────────────────────────────────────────────
beforeAll(async () => {
  // Ensure NODE_ENV=test so the app skips the live-DB ready guard
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_agrismart";
  process.env.JWT_EXPIRE  = "1d";

  mongoServer = await MongoMemoryServer.create();
  const uri   = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000); // generous timeout for first-time binary download

// ── Global teardown ───────────────────────────────────────────
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

// ── Between tests: clear all collections ─────────────────────
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
