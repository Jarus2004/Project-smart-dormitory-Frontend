const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("./src/index");

let server;
let port;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe("Face Verification Backend", () => {
  test("should respond to health check", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { ok: true });
  });

  test("should accept detections payload and return ok", async () => {
    const payload = {
      id: "scan-1",
      student_code: "S001",
      direction: "IN",
      confidence: 0.91,
      scanned_at: "2026-08-06T00:00:00Z",
      bounding_box: { x: 100, y: 50, width: 120, height: 140 },
    };

    const res = await fetch(
      `http://127.0.0.1:${port}/api/face-verification/detections`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(typeof body.data, "object");
    assert.equal(body.data.scan.id, payload.id);
    assert.deepEqual(body.data.scan.bounding_box, payload.bounding_box);
    assert.equal(body.data.scan.confidence, payload.confidence);
  });
});
