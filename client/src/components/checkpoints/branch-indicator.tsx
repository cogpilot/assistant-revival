import { useState, useCallback } from "react";
import { GitBranch, GitFork, ChevronDown, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAssistantStore } from "@/hooks/use-assistant-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Checkpoint } from "@shared/schema";

interface BranchIndicatorProps {
  checkpoint?: Checkpoint;
  compact?: boolean;
}

export function BranchIndicator({ checkpoint, compact = false }: BranchIndicatorProps) {
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const { toast } = useToast();

  const {
    branches,
    currentBranchId,
    currentSessionId,
    forkFromCheckpoint,
    switchBranch,
    getCheckpointBranches,
  } = useAssistantStore();

  // Get branches for the current session
  const sessionBranches = branches.filter((b) => b.sessionId === currentSessionId);
  const currentBranch = branches.find((b) => b.id === currentBranchId);
  
  // Get branches that fork from this checkpoint
  const childBranches = checkpoint ? getCheckpointBranches(checkpoint.id) : [];

  const handleFork = useCallback(() => {
    if (!checkpoint || !newBranchName.trim()) return;

    const branch = forkFromCheckpoint(checkpoint.id, newBranchName.trim());
    if (branch) {
      toast({
        title: "Branch created",
        description: `Created branch "${branch.name}" from checkpoint`,
      });
      setShowForkDialog(false);
      setNewBranchName("");
    } else {
      toast({
        title: "Failed to create branch",
        description: "Could not create branch from this checkpoint",
        variant: "destructive",
      });
    }
  }, [checkpoint, newBranchName, forkFromCheckpoint, toast]);

  const handleSwitchBranch = useCallback((branchId: string) => {
    switchBranch(branchId);
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      toast({
        title: "Switched branch",
        description: `Now on branch "${branch.name}"`,
      });
    }
  }, [switchBranch, branches, toast]);

  if (compact) {
    return (
      <>
        {/* Compact view - just show fork button */}
        {checkpoint && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => setShowForkDialog(true)}
            title="Fork from this checkpoint"
          >
            <GitFork className="h-3 w-3" />
          </Button>
        )}

        {/* Branch badges */}
        {childBranches.length > 0 && (
          <div className="flex gap-1 ml-1">
            {childBranches.slice(0, 2).map((branch) => (
              <Badge
                key={branch.id}
                variant="outline"
                className="text-xs px-1 py-0 cursor-pointer hover:bg-accent"
                onClick={() => handleSwitchBranch(branch.id)}
              >
                <GitBranch className="h-2 w-2 mr-0.5" />
                {branch.name}
              </Badge>
            ))}
            {childBranches.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{childBranches.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Fork dialog */}
        <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Branch</DialogTitle>
              <DialogDescription>
                Fork the conversation from this checkpoint to explore an alternative path.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="branch-name">Branch name</Label>
                <Input
                  id="branch-name"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g., alternative-approach"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFork();
                  }}
                />
              </div>
              {checkpoint && (
                <div className="text-sm text-muted-foreground">
                  Forking from: <span className="font-medium">{checkpoint.description}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFork} disabled={!newBranchName.trim()}>
                <GitFork className="h-4 w-4 mr-2" />
                Create Branch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Branch selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="truncate max-w-[120px]">
              {currentBranch?.name || "main"}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Branches</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Main branch (default) */}
          <DropdownMenuItem
            onClick={() => {
              useAssistantStore.setState({ currentBranchId: null });
              toast({ title: "Switched to main branch" });
            }}
            className={cn(!currentBranchId && "bg-accent")}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            <span>main</span>
            {!currentBranchId && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>

          {/* Session branches */}
          {sessionBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleSwitchBranch(branch.id)}
              className={cn(currentBranchId === branch.id && "bg-accent")}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              <span className="truncate">{branch.name}</span>
              {currentBranchId === branch.id && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          ))}

          {checkpoint && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowForkDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <span>New branch from current...</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Fork dialog */}
      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Branch</DialogTitle>
            <DialogDescription>
              Fork the conversation from the current checkpoint to explore an alternative path.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="branch-name">Branch name</Label>
              <Input
                id="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g., alternative-approach"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFork();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFork} disabled={!newBranchName.trim()}>
              <GitFork className="h-4 w-4 mr-2" />
              Create Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
