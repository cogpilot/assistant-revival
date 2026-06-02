import { useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatContainer } from "@/components/chat/chat-container";
import { FileViewer } from "@/components/files/file-viewer";
import { DiffViewer } from "@/components/diff/diff-viewer";
import { CommandPalette } from "@/components/command-palette";
import { useAssistantStore } from "@/hooks/use-assistant-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";
import type { Session, Checkpoint, CodeChange } from "@shared/schema";

export default function Home() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([]);
  const { toast } = useToast();

  const {
    files,
    sessions,
    addSession,
    currentSessionId,
    clearMessages,
    addCheckpoint,
    updateFileContent,
    restoreCheckpoint,
  } = useAssistantStore();

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleNewSession = useCallback(() => {
    const session: Session = {
      id: crypto.randomUUID(),
      name: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSession(session);
    clearMessages();
    setPendingChanges([]);
    toast({
      title: "New chat started",
      description: "Start a new conversation with Assistant",
    });
  }, [addSession, clearMessages, toast]);

  const handleApplyChanges = useCallback(() => {
    const checkpoint: Checkpoint = {
      id: crypto.randomUUID(),
      sessionId: currentSessionId || "",
      messageId: "",
      description: `Applied ${pendingChanges.length} change${pendingChanges.length !== 1 ? "s" : ""}`,
      files: [...files],
      createdAt: new Date().toISOString(),
    };
    addCheckpoint(checkpoint);

    pendingChanges.forEach((change) => {
      updateFileContent(change.fileId, change.newContent);
    });

    setPendingChanges([]);
    toast({
      title: "Changes applied",
      description: "Your files have been updated. A checkpoint was created for rollback.",
    });
  }, [pendingChanges, files, currentSessionId, addCheckpoint, updateFileContent, toast]);

  const handleRejectChanges = useCallback(() => {
    setPendingChanges([]);
    toast({
      title: "Changes rejected",
      description: "The proposed changes were discarded",
    });
  }, [toast]);

  const handleFileUpload = useCallback(() => {
    const input = document.getElementById("file-upload") as HTMLInputElement;
    input?.click();
  }, []);

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar
          onNewSession={handleNewSession}
          onSelectFile={setSelectedFileId}
          selectedFileId={selectedFileId || undefined}
        />

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border h-14">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm font-medium">
                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.name || "Chat" : "Welcome"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => {
                  // Trigger command palette via keyboard event
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true,
                  });
                  window.dispatchEvent(event);
                }}
                data-testid="button-command-palette"
              >
                <Command className="h-3 w-3" />
                <span className="text-xs">⌘K</span>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={selectedFile ? 60 : 100} minSize={40}>
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <ChatContainer
                      onFileUpload={handleFileUpload}
                      onFileClick={setSelectedFileId}
                    />
                  </div>

                  {pendingChanges.length > 0 && (
                    <DiffViewer
                      changes={pendingChanges}
                      onApply={handleApplyChanges}
                      onReject={handleRejectChanges}
                    />
                  )}
                </div>
              </Panel>

              {selectedFile && (
                <>
                  <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />
                  <Panel defaultSize={40} minSize={20}>
                    <FileViewer
                      file={selectedFile}
                      onClose={() => setSelectedFileId(null)}
                    />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        onNewSession={handleNewSession}
        onSelectFile={setSelectedFileId}
        onRestoreCheckpoint={restoreCheckpoint}
      />
    </SidebarProvider>
  );
}
