const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../src/server");

test("GET /health returns healthy", async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "healthy" });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
