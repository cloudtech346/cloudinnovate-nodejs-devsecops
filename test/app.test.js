const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/server");

test("GET /health returns healthy", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);

  assert.deepEqual(response.body, {
    status: "healthy"
  });
});