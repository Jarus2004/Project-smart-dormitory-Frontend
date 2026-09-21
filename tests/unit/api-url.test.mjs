import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_API_BASE_URL,
  resolveApiBaseUrl,
} from "../../src/services/api-url.js";

describe("resolveApiBaseUrl", () => {
  it("uses the configured VITE_API_URL when it is present", () => {
    const resolved = resolveApiBaseUrl({
      VITE_API_URL: "http://127.0.0.1:3000/api",
    });

    assert.equal(resolved, "http://127.0.0.1:3000/api");
  });

  it("falls back to the local backend on port 3000 when env is missing", () => {
    const resolved = resolveApiBaseUrl({});

    assert.equal(resolved, DEFAULT_API_BASE_URL);
    assert.equal(resolved, "http://localhost:3000/api");
  });
});
