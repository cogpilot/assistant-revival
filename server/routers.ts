import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  createFile, getFilesByUser, getFileById, deleteFile,
  createChatSession, getChatSessionsByUser, getChatSessionById,
  updateChatSessionTitle, deleteChatSession,
  createChatMessage, getMessagesBySession,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  files: router({
    list: protectedProcedure.query(async ({ ctx }) => getFilesByUser(ctx.user.id)),
    upload: protectedProcedure
      .input(z.object({
        filename: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(128),
        sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
        base64Data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64Data, "base64");
        const key = `users/${ctx.user.id}/files/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return createFile({
          userId: ctx.user.id,
          filename: input.filename,
          originalName: input.filename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          storageKey: key,
          storageUrl: url,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const file = await getFileById(input.id, ctx.user.id);
        if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
        await deleteFile(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  chat: router({
    listSessions: protectedProcedure.query(async ({ ctx }) => getChatSessionsByUser(ctx.user.id)),
    createSession: protectedProcedure
      .input(z.object({ title: z.string().min(1).max(255).optional() }))
      .mutation(async ({ ctx, input }) => createChatSession({ userId: ctx.user.id, title: input.title ?? "New Chat" })),
    deleteSession: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getChatSessionById(input.id, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        await deleteChatSession(input.id, ctx.user.id);
        return { success: true };
      }),
    getSession: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const session = await getChatSessionById(input.id, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        return session;
      }),
    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const session = await getChatSessionById(input.sessionId, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        return getMessagesBySession(input.sessionId);
      }),
    sendMessage: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive(), content: z.string().min(1).max(8000) }))
      .mutation(async ({ ctx, input }) => {
        const session = await getChatSessionById(input.sessionId, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        const userMessage = await createChatMessage({ sessionId: input.sessionId, userId: ctx.user.id, role: "user", content: input.content });
        const history = await getMessagesBySession(input.sessionId);
        const messages = history.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
        if (history.filter((m) => m.role === "user").length === 1) {
          await updateChatSessionTitle(input.sessionId, ctx.user.id, input.content.slice(0, 60) + (input.content.length > 60 ? "…" : ""));
        }
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are Assistant Memorial Edition — a tribute to Replit's Assistant. Help users with coding questions, file analysis, and software development. Be concise, helpful, and precise." },
            ...messages,
          ],
        });
        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const assistantContent = typeof rawContent === "string" ? rawContent : "Sorry, I could not generate a response.";
        const assistantMessage = await createChatMessage({ sessionId: input.sessionId, userId: ctx.user.id, role: "assistant", content: assistantContent });
        return { userMessage, assistantMessage };
      }),
  }),
});

export type AppRouter = typeof appRouter;
