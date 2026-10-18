import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiClientError,
  apiClient,
  isDemoFallbackEnabled,
} from "../lib/api/client.ts";

test("demo fallback is disabled when the public flag is absent", () => {
  assert.equal(isDemoFallbackEnabled, false);
});

test("raw GET accepts the health endpoint's non-enveloped JSON", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const health = await apiClient.getRaw("/health");

  assert.deepEqual(health, { status: "ok" });
});

test("enveloped GET preserves the backend error code and message", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: {
          code: "DESTINATION_NOT_FOUND",
          message: "Teams destination was not found.",
        },
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );

  await assert.rejects(apiClient.get("/api/destinations/DEST-MISSING"), {
    name: "ApiClientError",
    code: "DESTINATION_NOT_FOUND",
    message: "Teams destination was not found.",
    status: 404,
  });
});

test("GET accepts the reactions endpoint's data-only response envelope", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ data: { reactions: [{ reaction: "like", emoji: "👍", count: 3 }] } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  const data = await apiClient.get("/api/notifications/NOT-1/reactions");

  assert.deepEqual(data, { reactions: [{ reaction: "like", emoji: "👍", count: 3 }] });
});

test("raw GET turns a failed HTTP response into an API client error", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ status: "unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });

  await assert.rejects(apiClient.getRaw("/ready"), (error) => {
    assert.equal(error instanceof ApiClientError, true);
    assert.equal(error.code, "REQUEST_FAILED");
    assert.equal(error.status, 503);
    return true;
  });
});

test("enveloped DELETE keeps the request method and encoded destination path", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  let request;
  globalThis.fetch = async (url, init) => {
    request = { url: String(url), init };
    return new Response(
      JSON.stringify({ success: true, data: { destination_id: "destination / 1" }, error: null }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  await apiClient.delete("/api/destinations/destination%20%2F%201");

  assert.match(request.url, /\/api\/destinations\/destination%20%2F%201$/);
  assert.equal(request.init.method, "DELETE");
});
