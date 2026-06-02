import { z } from "zod";

// File schema for uploaded files
export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  language: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
});

export type File = z.infer<typeof fileSchema>;
export type InsertFile = Omit<File, "id" | "uploadedAt">;

// Message schema for chat
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  mentionedFiles: z.array(z.string()).optional(),
  codeChanges: z.array(z.object({
    fileId: z.string(),
    fileName: z.string(),
    oldContent: z.string(),
    newContent: z.string(),
  })).optional(),
  createdAt: z.string(),
});

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = Omit<Message, "id" | "createdAt">;

// Session schema for chat sessions
export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = Omit<Session, "id" | "createdAt" | "updatedAt">;

// Checkpoint schema for rollback functionality
export const checkpointSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  messageId: z.string(),
  description: z.string(),
  files: z.array(fileSchema),
  createdAt: z.string(),
  // Forking support
  parentCheckpointId: z.string().optional(),
  branchName: z.string().optional(),
});

export type Checkpoint = z.infer<typeof checkpointSchema>;
export type InsertCheckpoint = Omit<Checkpoint, "id" | "createdAt">;

// Session branch schema for forking support
export const sessionBranchSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  name: z.string(),
  parentCheckpointId: z.string(),
  createdAt: z.string(),
  isActive: z.boolean(),
});

export type SessionBranch = z.infer<typeof sessionBranchSchema>;
export type InsertSessionBranch = Omit<SessionBranch, "id" | "createdAt">;

// Code change for diffs
export const codeChangeSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  oldContent: z.string(),
  newContent: z.string(),
});

export type CodeChange = z.infer<typeof codeChangeSchema>;

// User schema (keeping for compatibility)
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id">;

// Assistant prompt schema (matches database schema)
export const assistantPromptSchema = z.object({
  id: z.number(),
  name: z.string(),
  instructions: z.string(),
  isDefault: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type AssistantPrompt = z.infer<typeof assistantPromptSchema>;
export type InsertAssistantPrompt = Omit<AssistantPrompt, "id" | "createdAt" | "updatedAt">;

// Import table definitions from models
import { conversations, messages } from "./models/chat";
import { assistantPrompts } from "./models/assistant-prompt";
import {
  orgParticipants,
  orgHyperedges,
  orgMemory,
  orgArtifacts,
  orgPersona,
  orgBehaviorHistory,
  orgSkillsets,
  orgNetworkTopology,
} from "./models/org-persona-ext";
import { creditUsage } from "./models/credit-usage";

// Re-export table definitions (but not conflicting types)
export { conversations, messages } from "./models/chat";
export { assistantPrompts } from "./models/assistant-prompt";
export {
  orgParticipants,
  orgHyperedges,
  orgMemory,
  orgArtifacts,
  orgPersona,
  orgBehaviorHistory,
  orgSkillsets,
  orgNetworkTopology,
} from "./models/org-persona-ext";
export { creditUsage } from "./models/credit-usage";

// Export insert schemas from models
export type { InsertConversation, InsertMessage as InsertChatMessage } from "./models/chat";
export type { InsertAssistantPrompt as InsertDbAssistantPrompt } from "./models/assistant-prompt";
export type { InsertCreditUsage } from "./models/credit-usage";

// Database types (with Db prefix to avoid conflicts with local types)
export type DbConversation = typeof conversations.$inferSelect;
export type DbMessage = typeof messages.$inferSelect;
export type DbAssistantPrompt = typeof assistantPrompts.$inferSelect;

// Export combined schema object for Drizzle
export const schema = {
  conversations,
  messages,
  assistantPrompts,
  orgParticipants,
  orgHyperedges,
  orgMemory,
  orgArtifacts,
  orgPersona,
  orgBehaviorHistory,
  orgSkillsets,
  orgNetworkTopology,
  creditUsage,
};

// Local/client-side types (these use string IDs for client state)
export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mentionedFiles?: string[];
  createdAt: string;
  metadata?: {
    shellCommands?: string[];
    fileEdits?: Array<{
      file: string;
      added: number;
      removed: number;
    }>;
  };
}

export interface ClientSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCheckpoint {
  id: string;
  sessionId: string;
  messageId: string;
  description: string;
  files: CodeFile[];
  createdAt: string;
}

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  language?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientCodeChange {
  id?: string;
  fileId: string;
  fileName: string;
  oldContent: string;
  newContent: string;
  description?: string;
}

// Legacy type aliases (for backwards compatibility)
export type Conversation = DbConversation;
export type ChatMessage = DbMessage;