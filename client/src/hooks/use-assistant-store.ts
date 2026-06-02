import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { File, Message, Session, Checkpoint, CodeChange, SessionBranch } from "@shared/schema";

interface AssistantSettings {
  autoApplyChanges: boolean;
  autoRestartWorkflow: boolean;
  mode: 'basic' | 'advanced';
}

interface AssistantState {
  sessions: Session[];
  currentSessionId: string | null;
  sessionMessages: Record<string, Message[]>;
  files: File[];
  checkpoints: Checkpoint[];
  branches: SessionBranch[];
  currentBranchId: string | null;
  pendingChanges: CodeChange[];
  isLoading: boolean;
  isStreaming: boolean;
  settings: AssistantSettings;

  messages: Message[];

  setCurrentSession: (sessionId: string | null) => void;
  addSession: (session: Session) => void;
  deleteSession: (sessionId: string) => void;

  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  addFile: (file: File) => void;
  removeFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  clearFiles: () => void;

  addCheckpoint: (checkpoint: Checkpoint) => void;
  restoreCheckpoint: (checkpointId: string) => void;
  
  // Forking methods
  forkFromCheckpoint: (checkpointId: string, branchName: string) => SessionBranch | null;
  switchBranch: (branchId: string) => void;
  getBranchCheckpoints: (branchId: string) => Checkpoint[];
  getCheckpointBranches: (checkpointId: string) => SessionBranch[];

  setPendingChanges: (changes: CodeChange[]) => void;
  applyPendingChanges: () => void;
  clearPendingChanges: () => void;

  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  updateSettings: (settings: Partial<AssistantSettings>) => void;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      sessionMessages: {},
      files: [],
      checkpoints: [],
      branches: [],
      currentBranchId: null,
      pendingChanges: [],
      isLoading: false,
      isStreaming: false,
      settings: {
        autoApplyChanges: false,
        autoRestartWorkflow: true,
        mode: 'basic',
      },

      get messages() {
        const state = get();
        if (!state.currentSessionId) return [];
        return state.sessionMessages[state.currentSessionId] || [];
      },

      setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

      addSession: (session) => set((state) => ({ 
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
        sessionMessages: {
          ...state.sessionMessages,
          [session.id]: [],
        },
      })),

      deleteSession: (sessionId) => set((state) => {
        const { [sessionId]: _, ...remainingMessages } = state.sessionMessages;
        // Also clear currentBranchId if it belongs to a deleted session's branch
        const deletedBranchIds = state.branches
          .filter((b) => b.sessionId === sessionId)
          .map((b) => b.id);
        const newCurrentBranchId = deletedBranchIds.includes(state.currentBranchId || '')
          ? null
          : state.currentBranchId;
        return {
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          sessionMessages: remainingMessages,
          checkpoints: state.checkpoints.filter((c) => c.sessionId !== sessionId),
          branches: state.branches.filter((b) => b.sessionId !== sessionId),
          currentBranchId: newCurrentBranchId,
        };
      }),

      addMessage: (message) => set((state) => {
        if (!state.currentSessionId) return state;
        const currentMessages = state.sessionMessages[state.currentSessionId] || [];
        return {
          sessionMessages: {
            ...state.sessionMessages,
            [state.currentSessionId]: [...currentMessages, message],
          },
        };
      }),

      updateMessage: (id, updates) => set((state) => {
        if (!state.currentSessionId) return state;
        const currentMessages = state.sessionMessages[state.currentSessionId] || [];
        return {
          sessionMessages: {
            ...state.sessionMessages,
            [state.currentSessionId]: currentMessages.map((m) => 
              m.id === id ? { ...m, ...updates } : m
            ),
          },
        };
      }),

      clearMessages: () => set((state) => {
        if (!state.currentSessionId) return state;
        return {
          sessionMessages: {
            ...state.sessionMessages,
            [state.currentSessionId]: [],
          },
        };
      }),

      addFile: (file) => set((state) => ({
        files: [...state.files, file],
      })),

      removeFile: (fileId) => set((state) => ({
        files: state.files.filter((f) => f.id !== fileId),
      })),

      updateFileContent: (fileId, content) => set((state) => ({
        files: state.files.map((f) => 
          f.id === fileId ? { ...f, content, size: content.length } : f
        ),
      })),

      clearFiles: () => set({ files: [] }),

      addCheckpoint: (checkpoint) => set((state) => ({
        checkpoints: [...state.checkpoints, checkpoint],
      })),

      restoreCheckpoint: (checkpointId) => {
        const state = get();
        const checkpoint = state.checkpoints.find((c) => c.id === checkpointId);
        if (checkpoint) {
          set({ files: checkpoint.files });
        }
      },

      // Forking methods
      forkFromCheckpoint: (checkpointId, branchName) => {
        const state = get();
        const checkpoint = state.checkpoints.find((c) => c.id === checkpointId);
        if (!checkpoint) return null;

        const newBranch: SessionBranch = {
          id: crypto.randomUUID(),
          sessionId: checkpoint.sessionId,
          name: branchName,
          parentCheckpointId: checkpointId,
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        // Create initial checkpoint for the new branch
        const branchCheckpoint: Checkpoint = {
          id: crypto.randomUUID(),
          sessionId: checkpoint.sessionId,
          messageId: checkpoint.messageId,
          description: `Branch: ${branchName}`,
          files: [...checkpoint.files],
          createdAt: new Date().toISOString(),
          parentCheckpointId: checkpointId,
          branchName: branchName,
        };

        set((s) => ({
          branches: [...s.branches, newBranch],
          checkpoints: [...s.checkpoints, branchCheckpoint],
          currentBranchId: newBranch.id,
          files: checkpoint.files,
        }));

        return newBranch;
      },

      switchBranch: (branchId) => {
        const state = get();
        const branch = state.branches.find((b) => b.id === branchId);
        if (!branch) return;

        // Find the latest checkpoint for this branch, sorted by createdAt
        // Pre-parse timestamps to avoid repeated Date instantiation in sort
        const branchCheckpoints = state.checkpoints
          .filter((c) => c.branchName === branch.name && c.sessionId === branch.sessionId)
          .map((c) => ({ checkpoint: c, timestamp: new Date(c.createdAt).getTime() }))
          .sort((a, b) => b.timestamp - a.timestamp);
        const latestCheckpoint = branchCheckpoints[0]?.checkpoint;

        if (latestCheckpoint) {
          set({
            currentBranchId: branchId,
            files: latestCheckpoint.files,
          });
        }
      },

      getBranchCheckpoints: (branchId) => {
        const state = get();
        const branch = state.branches.find((b) => b.id === branchId);
        if (!branch) return [];
        
        return state.checkpoints.filter(
          (c) => c.branchName === branch.name && c.sessionId === branch.sessionId
        );
      },

      getCheckpointBranches: (checkpointId) => {
        const state = get();
        return state.branches.filter((b) => b.parentCheckpointId === checkpointId);
      },

      setPendingChanges: (changes) => set({ pendingChanges: changes }),

      applyPendingChanges: () => {
        const state = get();
        
        if (state.pendingChanges.length === 0) return;
        
        // Apply all pending changes to files
        const updatedFiles = state.files.map((file) => {
          const change = state.pendingChanges.find((c) => c.fileId === file.id || c.fileName === file.name);
          if (change) {
            return { ...file, content: change.newContent, size: change.newContent.length };
          }
          return file;
        });
        
        // Create new files if they don't exist
        const newFiles = state.pendingChanges
          .filter(change => !state.files.some(f => f.id === change.fileId || f.name === change.fileName))
          .map(change => ({
            id: change.fileId || `file-${Date.now()}-${Math.random()}`,
            name: change.fileName,
            content: change.newContent,
            size: change.newContent.length,
            language: change.fileName.split('.').pop() || 'plaintext',
            uploadedAt: new Date().toISOString(),
          }));
        
        set({ 
          files: [...updatedFiles, ...newFiles], 
          pendingChanges: [] 
        });
      },

      clearPendingChanges: () => set({ pendingChanges: [] }),

      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "assistant-memorial-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        sessionMessages: state.sessionMessages,
        files: state.files,
        checkpoints: state.checkpoints,
        branches: state.branches,
        currentBranchId: state.currentBranchId,
        currentSessionId: state.currentSessionId,
        settings: state.settings,
      }),
    }
  )
);