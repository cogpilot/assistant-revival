import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  FileText,
  History,
  Settings,
  Search,
  Plus,
  RotateCcw,
  GitBranch,
  Save,
  Moon,
  Sun,
  Trash2,
  Upload,
  Download,
  Clock,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAssistantStore } from "@/hooks/use-assistant-store";
import { useTheme } from "@/components/theme-provider";
import type { Session, Checkpoint, File } from "@shared/schema";

interface CommandPaletteProps {
  onNewSession: () => void;
  onSelectFile: (fileId: string) => void;
  onRestoreCheckpoint: (checkpointId: string) => void;
}

interface RecentAction {
  id: string;
  type: "session" | "checkpoint" | "file" | "command";
  label: string;
  timestamp: string;
  data?: string;
}

export function CommandPalette({
  onNewSession,
  onSelectFile,
  onRestoreCheckpoint,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

  const { theme, toggleTheme } = useTheme();
  const {
    sessions,
    files,
    checkpoints,
    currentSessionId,
    setCurrentSession,
    clearMessages,
    clearFiles,
  } = useAssistantStore();

  // Load recent actions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("assistant-recent-actions");
      if (stored) {
        setRecentActions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent actions:", e);
    }
  }, []);

  // Save recent action
  const addRecentAction = useCallback((action: Omit<RecentAction, "id" | "timestamp">) => {
    setRecentActions((prev) => {
      const newAction: RecentAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      // Keep only the last 10 actions, deduplicate by label
      const filtered = prev.filter((a) => a.label !== action.label);
      const updated = [newAction, ...filtered].slice(0, 10);
      localStorage.setItem("assistant-recent-actions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Also support Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleNewSession = useCallback(() => {
    onNewSession();
    addRecentAction({ type: "command", label: "New Chat" });
    setOpen(false);
  }, [onNewSession, addRecentAction]);

  const handleSelectSession = useCallback((session: Session) => {
    setCurrentSession(session.id);
    addRecentAction({ type: "session", label: session.name, data: session.id });
    setOpen(false);
  }, [setCurrentSession, addRecentAction]);

  const handleSelectFile = useCallback((file: File) => {
    onSelectFile(file.id);
    addRecentAction({ type: "file", label: file.name, data: file.id });
    setOpen(false);
  }, [onSelectFile, addRecentAction]);

  const handleRestoreCheckpoint = useCallback((checkpoint: Checkpoint) => {
    onRestoreCheckpoint(checkpoint.id);
    addRecentAction({ type: "checkpoint", label: checkpoint.description, data: checkpoint.id });
    setOpen(false);
  }, [onRestoreCheckpoint, addRecentAction]);

  const handleToggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    toggleTheme();
    addRecentAction({ type: "command", label: `Switch to ${newTheme} mode` });
    setOpen(false);
  }, [theme, toggleTheme, addRecentAction]);

  const handleClearChat = useCallback(() => {
    clearMessages();
    addRecentAction({ type: "command", label: "Clear chat history" });
    setOpen(false);
  }, [clearMessages, addRecentAction]);

  const handleClearFiles = useCallback(() => {
    clearFiles();
    addRecentAction({ type: "command", label: "Clear all files" });
    setOpen(false);
  }, [clearFiles, addRecentAction]);

  const currentCheckpoints = checkpoints.filter((c) => c.sessionId === currentSessionId);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Actions */}
        {recentActions.length > 0 && (
          <CommandGroup heading="Recent">
            {recentActions.slice(0, 5).map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => {
                  if (action.type === "session" && action.data) {
                    const session = sessions.find((s) => s.id === action.data);
                    if (session) handleSelectSession(session);
                  } else if (action.type === "file" && action.data) {
                    const file = files.find((f) => f.id === action.data);
                    if (file) handleSelectFile(file);
                  } else if (action.type === "checkpoint" && action.data) {
                    const checkpoint = checkpoints.find((c) => c.id === action.data);
                    if (checkpoint) handleRestoreCheckpoint(checkpoint);
                  }
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={handleNewSession}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleToggleTheme}>
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
            <CommandShortcut>⌘⇧T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleClearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear Chat History</span>
          </CommandItem>
          <CommandItem onSelect={handleClearFiles}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear All Files</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Sessions */}
        {sessions.length > 0 && (
          <CommandGroup heading="Chats">
            {sessions.slice(0, 8).map((session) => (
              <CommandItem
                key={session.id}
                onSelect={() => handleSelectSession(session)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>{session.name}</span>
                {session.id === currentSessionId && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Files */}
        {files.length > 0 && (
          <CommandGroup heading="Files">
            {files.slice(0, 8).map((file) => (
              <CommandItem
                key={file.id}
                onSelect={() => handleSelectFile(file)}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{file.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {file.language}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Checkpoints */}
        {currentCheckpoints.length > 0 && (
          <CommandGroup heading="Checkpoints">
            {currentCheckpoints.slice(0, 5).map((checkpoint) => (
              <CommandItem
                key={checkpoint.id}
                onSelect={() => handleRestoreCheckpoint(checkpoint)}
              >
                <History className="mr-2 h-4 w-4" />
                <span>{checkpoint.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(checkpoint.createdAt).toLocaleDateString()}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Git Integration Preview */}
        <CommandGroup heading="Git (Coming Soon)">
          <CommandItem disabled>
            <GitBranch className="mr-2 h-4 w-4 opacity-50" />
            <span className="opacity-50">Create Branch from Checkpoint</span>
          </CommandItem>
          <CommandItem disabled>
            <Save className="mr-2 h-4 w-4 opacity-50" />
            <span className="opacity-50">Auto-commit Changes</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Hook for using command palette programmatically
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
