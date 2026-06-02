import { History, RotateCcw, Circle, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BranchIndicator } from "./branch-indicator";
import type { Checkpoint } from "@shared/schema";

interface CheckpointListProps {
  checkpoints: Checkpoint[];
  currentCheckpointId?: string;
  onRestore: (checkpointId: string) => void;
}

export function CheckpointList({ checkpoints, currentCheckpointId, onRestore }: CheckpointListProps) {
  if (checkpoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mb-3">
          <History className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium mb-1">No checkpoints yet</div>
        <div className="text-xs text-muted-foreground">
          Checkpoints are created when changes are applied
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {checkpoints.map((checkpoint, index) => {
          const isCurrent = checkpoint.id === currentCheckpointId;
          const isLatest = index === checkpoints.length - 1;
          const timestamp = new Date(checkpoint.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={checkpoint.id}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-md",
                isCurrent && "bg-accent"
              )}
              data-testid={`checkpoint-${checkpoint.id}`}
            >
              <div className="flex flex-col items-center">
                <Circle
                  className={cn(
                    "h-3 w-3",
                    isLatest ? "fill-primary text-primary" : "fill-muted text-muted-foreground"
                  )}
                />
                {index < checkpoints.length - 1 && (
                  <div className="w-px h-full bg-border mt-1" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {checkpoint.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Branch indicator with fork button */}
                    <BranchIndicator checkpoint={checkpoint} compact />
                    
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onRestore(checkpoint.id)}
                        data-testid={`button-restore-${checkpoint.id}`}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{timestamp}</span>
                  <span>•</span>
                  <span>{checkpoint.files.length} file{checkpoint.files.length !== 1 ? "s" : ""}</span>
                  {checkpoint.branchName && (
                    <>
                      <span>•</span>
                      <span className="text-primary">{checkpoint.branchName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}