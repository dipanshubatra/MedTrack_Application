import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/test`, () => HttpResponse.json({ ok: true })),
);

const mockAlert = vi.fn();
const originalHref = window.location.href;

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
  mockAlert.mockClear();
  vi.stubGlobal("alert", mockAlert);
});

afterEach(() => {
  vi.unstubAllGlobals();
  // Restore location.href
  Object.defineProperty(window, "location", {
    value: { ...window.location, href: originalHref },
    writable: true,
    configurable: true,
  });
});

async function getApi() {
  vi.resetModules();
  const mod = await import("../../services/HttpService");
  return mod.default;
}

it("attaches JWT Bearer token from sessionStorage", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({
    id: "u1", token: "my-jwt-token",
  }));

  const API = await getApi();

  let capturedHeaders;
  server.use(
    http.get(`${BASE_URL}/api/test`, ({ request }) => {
      capturedHeaders = request.headers;
      return HttpResponse.json({ ok: true });
    }),
  );

  await API.get("/api/test");
  expect(capturedHeaders.get("Authorization")).toBe("Bearer my-jwt-token");
});

it("handles 401 by clearing sessionStorage and alerting user", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));

  const API = await getApi();

  server.use(
    http.get(`${BASE_URL}/api/test`, () => HttpResponse.json(null, { status: 401 })),
  );

  await expect(API.get("/api/test")).rejects.toThrow();

  expect(sessionStorage.getItem("medtrack_user")).toBeNull();
  expect(mockAlert).toHaveBeenCalledWith("Session expired. Please login again.");
});

it("handles 403 without clearing session", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));

  const API = await getApi();

  server.use(
    http.get(`${BASE_URL}/api/test`, () => HttpResponse.json(null, { status: 403 })),
  );

  await expect(API.get("/api/test")).rejects.toThrow();

  expect(sessionStorage.getItem("medtrack_user")).not.toBeNull();
  expect(mockAlert).toHaveBeenCalledWith(
    "Access denied: You are not authorised to perform this action.",
  );
});

it("does not attach token when no user in sessionStorage", async () => {
  const API = await getApi();

  let capturedHeaders;
  server.use(
    http.get(`${BASE_URL}/api/test`, ({ request }) => {
      capturedHeaders = request.headers;
      return HttpResponse.json({ ok: true });
    }),
  );

  await API.get("/api/test");
  expect(capturedHeaders.get("Authorization")).toBeNull();
});
