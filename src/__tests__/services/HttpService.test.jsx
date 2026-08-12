import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "http://localhost:8081";

const server = setupServer(
  http.get(`${BASE_URL}/api/test`, () => HttpResponse.json({ ok: true })),
);

const mockAlert = vi.fn();

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("alert", mockAlert);
  // window.location is replaced entirely by the stub, so give it a pathname
  // that mirrors the GitHub Pages deployment (BASE_PATH) to exercise the
  // base-path-aware session-expiry redirect.
  vi.stubGlobal("location", {
    href: "http://localhost:8081",
    pathname: "/MedTrack_Application/equipment",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function getInterceptorBehavior() {
  return await import("../../services/HttpService");
}

it("attaches JWT Bearer token from sessionStorage", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({
    id: "u1", token: "my-jwt-token",
  }));

  const { default: API } = await getInterceptorBehavior();

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

it("handles 401 by clearing sessionStorage, toasting and redirecting under the base path", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));

  const { default: API, errorEmitter } = await getInterceptorBehavior();
  const dispatchSpy = vi.spyOn(errorEmitter, "dispatchEvent");

  server.use(
    http.get(`${BASE_URL}/api/test`, () => HttpResponse.json(null, { status: 401 })),
  );

  await expect(API.get("/api/test")).rejects.toThrow();

  expect(sessionStorage.getItem("medtrack_user")).toBeNull();
  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      detail: { message: "Session expired. Please login again.", type: "error" },
    }),
  );
  expect(window.location.href).toBe("/MedTrack_Application/login");
});

it("handles 403 with a toast and without redirect", async () => {
  sessionStorage.setItem("medtrack_user", JSON.stringify({ id: "u1", token: "tok" }));

  const { default: API, errorEmitter } = await getInterceptorBehavior();
  const dispatchSpy = vi.spyOn(errorEmitter, "dispatchEvent");

  server.use(
    http.get(`${BASE_URL}/api/test`, () => HttpResponse.json(null, { status: 403 })),
  );

  await expect(API.get("/api/test")).rejects.toThrow();

  expect(sessionStorage.getItem("medtrack_user")).not.toBeNull();
  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      detail: { message: "Access denied: You are not authorised to perform this action.", type: "error" },
    }),
  );
  expect(window.location.href).toBe("http://localhost:8081");
});

it("does not attach token when no user in sessionStorage", async () => {
  const { default: API } = await getInterceptorBehavior();

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
