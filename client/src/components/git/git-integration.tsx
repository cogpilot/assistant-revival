import { useState, useCallback, useEffect } from "react";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  FileText,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Checkpoint, CodeChange } from "@shared/schema";

interface GitStatus {
  isRepo: boolean;
  branch: string;
  changes: GitFileChange[];
  ahead: number;
  behind: number;
  hasUncommittedChanges: boolean;
}

interface GitFileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "untracked";
  staged: boolean;
}

interface GitIntegrationProps {
  checkpoint?: Checkpoint;
  pendingChanges?: CodeChange[];
  onCommit?: (message: string) => void;
}

// Simulated git status for demo (in real implementation, this would call server API)
function useGitStatus() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulated API call - in real implementation, call /api/git/status
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setStatus({
        isRepo: true,
        branch: "main",
        changes: [],
        ahead: 0,
        behind: 0,
        hasUncommittedChanges: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get git status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}

export function GitIntegration({ checkpoint, pendingChanges, onCommit }: GitIntegrationProps) {
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const { status, loading, error, refresh } = useGitStatus();
  const { toast } = useToast();

  // Generate commit message from checkpoint or changes
  const generateCommitMessage = useCallback(() => {
    if (checkpoint) {
      return checkpoint.description;
    }
    if (pendingChanges && pendingChanges.length > 0) {
      const MAX_FILES_TO_SHOW = 3;
      const fileNames = pendingChanges.slice(0, MAX_FILES_TO_SHOW).map((c) => c.fileName);
      const remaining = pendingChanges.length - MAX_FILES_TO_SHOW;
      if (remaining > 0) {
        return `Update ${fileNames.join(", ")} and ${remaining} more`;
      }
      return `Update ${fileNames.join(", ")}`;
    }
    return "";
  }, [checkpoint, pendingChanges]);

  // Auto-generate commit message when dialog opens
  useEffect(() => {
    if (showCommitDialog && !commitMessage) {
      setCommitMessage(generateCommitMessage());
    }
  }, [showCommitDialog, generateCommitMessage, commitMessage]);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) return;

    setIsCommitting(true);
    try {
      // In real implementation, call /api/git/commit
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      onCommit?.(commitMessage);
      toast({
        title: "Changes committed",
        description: `Committed with message: "${commitMessage}"`,
      });
      setShowCommitDialog(false);
      setCommitMessage("");
      refresh();
    } catch (err) {
      toast({
        title: "Commit failed",
        description: err instanceof Error ? err.message : "Failed to commit changes",
        variant: "destructive",
      });
    } finally {
      setIsCommitting(false);
    }
  }, [commitMessage, onCommit, toast, refresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading git status...</span>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>{error || "Not a git repository"}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        {/* Branch indicator */}
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{status.branch}</span>
        </div>

        {/* Sync status */}
        {(status.ahead > 0 || status.behind > 0) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {status.ahead > 0 && (
              <Badge variant="outline" className="px-1 py-0">
                ↑{status.ahead}
              </Badge>
            )}
            {status.behind > 0 && (
              <Badge variant="outline" className="px-1 py-0">
                ↓{status.behind}
              </Badge>
            )}
          </div>
        )}

        {/* Changes indicator */}
        {status.hasUncommittedChanges && (
          <Badge variant="secondary" className="text-xs">
            {status.changes.length} change{status.changes.length !== 1 ? "s" : ""}
          </Badge>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh status</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1"
                onClick={() => setShowCommitDialog(true)}
                disabled={!pendingChanges?.length && !checkpoint}
              >
                <GitCommit className="h-3.5 w-3.5" />
                <span className="text-xs">Commit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Commit changes</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* File changes list */}
      {status.changes.length > 0 && (
        <ScrollArea className="max-h-32">
          <div className="px-3 py-2 space-y-1">
            {status.changes.map((change) => (
              <div
                key={change.path}
                className="flex items-center gap-2 text-xs"
              >
                <StatusIcon status={change.status} />
                <span className="truncate flex-1">{change.path}</span>
                {change.staged && (
                  <Badge variant="outline" className="px-1 py-0 text-xs">
                    staged
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Commit dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
            <DialogDescription>
              Create a git commit from the current checkpoint or pending changes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="commit-message">Commit message</Label>
              <Textarea
                id="commit-message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                className="min-h-[100px]"
              />
            </div>

            {pendingChanges && pendingChanges.length > 0 && (
              <div className="grid gap-2">
                <Label>Files to commit</Label>
                <div className="border rounded-md p-2 space-y-1 max-h-32 overflow-auto">
                  {pendingChanges.map((change) => (
                    <div
                      key={change.fileId}
                      className="flex items-center gap-2 text-xs"
                    >
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{change.fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCommitDialog(false)}
              disabled={isCommitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || isCommitting}
            >
              {isCommitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Committing...
                </>
              ) : (
                <>
                  <GitCommit className="h-4 w-4 mr-2" />
                  Commit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusIcon({ status }: { status: GitFileChange["status"] }) {
  switch (status) {
    case "added":
      return <Plus className="h-3 w-3 text-chart-2" />;
    case "modified":
      return <FileText className="h-3 w-3 text-yellow-500" />;
    case "deleted":
      return <Minus className="h-3 w-3 text-destructive" />;
    case "untracked":
      return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
    default:
      return null;
  }
}

// Auto-commit hook for checkpoint creation
export function useAutoCommit() {
  const { toast } = useToast();

  const autoCommit = useCallback(async (checkpoint: Checkpoint) => {
    try {
      // In real implementation, call /api/git/commit
      console.log("Auto-committing checkpoint:", checkpoint.description);
      
      toast({
        title: "Auto-committed",
        description: `Changes committed: "${checkpoint.description}"`,
      });
    } catch (err) {
      console.error("Auto-commit failed:", err);
    }
  }, [toast]);

  return { autoCommit };
}
