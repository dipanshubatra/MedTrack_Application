import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";
const server = setupServer(
  http.get(, () => HttpResponse.json({ ok: true })),
);
const mockAlert = vi.fn();
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); vi.stubGlobal("alert", mockAlert); });
afterEach(() => { vi.unstubAllGlobals(); });

async function getApi() { return (await import("../../services/HttpService")).default; }

it("attaches JWT Bearer token", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "my-jwt" }));
  const API = await getApi();
  let hdrs;
  server.use(http.get(, ({ request }) => { hdrs = request.headers; return HttpResponse.json({ ok: true }); }));
  await API.get("/api/test");
  expect(hdrs.get("Authorization")).toBe("Bearer my-jwt");
});

it("handles 401 by clearing session and alerting", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));
  const API = await getApi();
  server.use(http.get(, () => HttpResponse.json(null, { status: 401 })));
  await expect(API.get("/api/test")).rejects.toThrow();
  expect(sessionStorage.getItem("medtrack_user")).toBeNull();
  expect(mockAlert).toHaveBeenCalledWith("Session expired. Please login again.");
});

it("handles 403 with access denied alert", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));
  const API = await getApi();
  server.use(http.get(, () => HttpResponse.json(null, { status: 403 })));
  await expect(API.get("/api/test")).rejects.toThrow();
  expect(sessionStorage.getItem("medtrack_user")).not.toBeNull();
  expect(mockAlert).toHaveBeenCalledWith("Access denied: You are not authorised to perform this action.");
});

it("does not attach token when no user", async () => {
  const API = await getApi();
  let hdrs;
  server.use(http.get(, ({ request }) => { hdrs = request.headers; return HttpResponse.json({ ok: true }); }));
  await API.get("/api/test");
  expect(hdrs.get("Authorization")).toBeNull();
});