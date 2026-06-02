import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getFilesByUser: vi.fn(async () => []),
  createFile: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
  getFileById: vi.fn(async () => undefined),
  deleteFile: vi.fn(async () => {}),
  createChatSession: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date(), updatedAt: new Date() })),
  getChatSessionsByUser: vi.fn(async () => []),
  getChatSessionById: vi.fn(async () => undefined),
  updateChatSessionTitle: vi.fn(async () => {}),
  deleteChatSession: vi.fn(async () => {}),
  createChatMessage: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
  getMessagesBySession: vi.fn(async () => []),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({ key, url: `/manus-storage/${key}` })),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: "Hello from AI!" } }],
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.id).toBe(42);
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx = { ...makeCtx(), user: null } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Files ────────────────────────────────────────────────────────────────────

describe("files.list", () => {
  it("returns an empty array when user has no files", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.files.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("files.upload", () => {
  it("uploads a file and returns the created record", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.files.upload({
      filename: "test.ts",
      mimeType: "text/typescript",
      sizeBytes: 128,
      base64Data: Buffer.from("const x = 1;").toString("base64"),
    });
    expect(result).toBeDefined();
    expect(result?.filename).toBe("test.ts");
  });
});

describe("files.delete", () => {
  it("throws NOT_FOUND when file does not belong to user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.files.delete({ id: 999 })).rejects.toThrow("File not found");
  });
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

describe("chat.listSessions", () => {
  it("returns an empty array when user has no sessions", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.listSessions();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("chat.createSession", () => {
  it("creates a session with default title", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.createSession({});
    expect(result?.title).toBe("New Chat");
    expect(result?.userId).toBe(42);
  });

  it("creates a session with custom title", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.createSession({ title: "My Debug Session" });
    expect(result?.title).toBe("My Debug Session");
  });
});

describe("chat.getSession", () => {
  it("throws NOT_FOUND when session does not belong to user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.chat.getSession({ id: 999 })).rejects.toThrow("Session not found");
  });
});

describe("chat.deleteSession", () => {
  it("throws NOT_FOUND when session does not belong to user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.chat.deleteSession({ id: 999 })).rejects.toThrow("Session not found");
  });
});
