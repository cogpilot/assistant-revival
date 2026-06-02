import { Check, X, ChevronDown, ChevronUp, Columns, Rows, CheckCircle2, XCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CodeChange } from "@shared/schema";

type ViewMode = "unified" | "split";

interface DiffViewerProps {
  changes: CodeChange[];
  onApply: () => void;
  onReject: () => void;
  onApplyPartial?: (change: CodeChange, acceptedLines: number[]) => void;
}

export function DiffViewer({ changes, onApply, onReject, onApplyPartial }: DiffViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(changes.map((c) => c.fileId))
  );
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [selectedLines, setSelectedLines] = useState<Record<string, Set<number>>>({});

  const toggleFile = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleLineSelection = useCallback((fileId: string, lineIndex: number) => {
    setSelectedLines((prev) => {
      const fileLines = new Set(prev[fileId] || []);
      if (fileLines.has(lineIndex)) {
        fileLines.delete(lineIndex);
      } else {
        fileLines.add(lineIndex);
      }
      return { ...prev, [fileId]: fileLines };
    });
  }, []);

  const selectAllLines = useCallback((fileId: string, lineCount: number) => {
    setSelectedLines((prev) => {
      const allLines = new Set(Array.from({ length: lineCount }, (_, i) => i));
      return { ...prev, [fileId]: allLines };
    });
  }, []);

  const deselectAllLines = useCallback((fileId: string) => {
    setSelectedLines((prev) => {
      const { [fileId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  if (changes.length === 0) return null;

  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Proposed Changes</span>
          <span className="text-xs text-muted-foreground">
            {changes.length} file{changes.length !== 1 ? "s" : ""}
          </span>
          
          {/* View mode toggle */}
          <div className="flex items-center ml-4 border rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={viewMode === "unified"}
                  onPressedChange={() => setViewMode("unified")}
                  className="rounded-r-none border-r"
                  data-testid="toggle-unified-view"
                >
                  <Rows className="h-3 w-3" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Unified view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={viewMode === "split"}
                  onPressedChange={() => setViewMode("split")}
                  className="rounded-l-none"
                  data-testid="toggle-split-view"
                >
                  <Columns className="h-3 w-3" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Split view</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            data-testid="button-reject-changes"
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            data-testid="button-apply-changes"
          >
            <Check className="h-3 w-3 mr-1" />
            Apply All
          </Button>
        </div>
      </div>
      
      <ScrollArea className="max-h-80">
        <div className="p-2 space-y-2">
          {changes.map((change) => (
            <DiffFileCard
              key={change.fileId}
              change={change}
              isExpanded={expandedFiles.has(change.fileId)}
              onToggle={() => toggleFile(change.fileId)}
              viewMode={viewMode}
              selectedLines={selectedLines[change.fileId] || new Set()}
              onToggleLineSelection={(lineIndex) => toggleLineSelection(change.fileId, lineIndex)}
              onSelectAll={(lineCount) => selectAllLines(change.fileId, lineCount)}
              onDeselectAll={() => deselectAllLines(change.fileId)}
              onApplyPartial={onApplyPartial}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface DiffFileCardProps {
  change: CodeChange;
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
  selectedLines: Set<number>;
  onToggleLineSelection: (lineIndex: number) => void;
  onSelectAll: (lineCount: number) => void;
  onDeselectAll: () => void;
  onApplyPartial?: (change: CodeChange, acceptedLines: number[]) => void;
}

function DiffFileCard({
  change,
  isExpanded,
  onToggle,
  viewMode,
  selectedLines,
  onToggleLineSelection,
  onSelectAll,
  onDeselectAll,
  onApplyPartial,
}: DiffFileCardProps) {
  const oldLines = change.oldContent.split("\n");
  const newLines = change.newContent.split("\n");
  
  const diffLines = computeDiff(oldLines, newLines);
  const additions = diffLines.filter((l) => l.type === "add").length;
  const deletions = diffLines.filter((l) => l.type === "remove").length;
  const changeableLines = diffLines.filter((l) => l.type === "add" || l.type === "remove").length;

  const handleApplySelected = useCallback(() => {
    if (onApplyPartial && selectedLines.size > 0) {
      onApplyPartial(change, Array.from(selectedLines));
    }
  }, [onApplyPartial, change, selectedLines]);

  return (
    <div className="rounded-md border border-border overflow-hidden" data-testid={`diff-file-${change.fileId}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs truncate">{change.fileName}</span>
          <span className="text-xs text-chart-2">+{additions}</span>
          <span className="text-xs text-destructive">-{deletions}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <>
          {/* Line selection toolbar */}
          {onApplyPartial && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs text-muted-foreground">
                {selectedLines.size} line{selectedLines.size !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onSelectAll(changeableLines)}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onDeselectAll}
              >
                Clear
              </Button>
              {selectedLines.size > 0 && (
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs ml-auto"
                  onClick={handleApplySelected}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Apply Selected
                </Button>
              )}
            </div>
          )}
          
          {viewMode === "unified" ? (
            <UnifiedDiffView
              diffLines={diffLines}
              selectedLines={selectedLines}
              onToggleLineSelection={onToggleLineSelection}
              showLineSelection={!!onApplyPartial}
            />
          ) : (
            <SplitDiffView
              oldLines={oldLines}
              newLines={newLines}
              diffLines={diffLines}
              selectedLines={selectedLines}
              onToggleLineSelection={onToggleLineSelection}
              showLineSelection={!!onApplyPartial}
            />
          )}
        </>
      )}
    </div>
  );
}

interface UnifiedDiffViewProps {
  diffLines: DiffLine[];
  selectedLines: Set<number>;
  onToggleLineSelection: (lineIndex: number) => void;
  showLineSelection: boolean;
}

function UnifiedDiffView({
  diffLines,
  selectedLines,
  onToggleLineSelection,
  showLineSelection,
}: UnifiedDiffViewProps) {
  let changeLineIndex = 0;
  
  return (
    <div className="overflow-x-auto">
      <pre className="text-xs font-mono">
        {diffLines.map((line, index) => {
          const isChangeLine = line.type === "add" || line.type === "remove";
          const currentChangeIndex = isChangeLine ? changeLineIndex++ : -1;
          const isSelected = isChangeLine && selectedLines.has(currentChangeIndex);
          
          return (
            <div
              key={index}
              className={cn(
                "px-3 py-0.5 flex items-center gap-2",
                line.type === "add" && "bg-chart-2/10 text-chart-2",
                line.type === "remove" && "bg-destructive/10 text-destructive",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
            >
              {showLineSelection && isChangeLine && (
                <button
                  className={cn(
                    "flex-shrink-0 h-4 w-4 rounded border transition-colors",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                  onClick={() => onToggleLineSelection(currentChangeIndex)}
                  data-testid={`line-select-${currentChangeIndex}`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              )}
              <span className="select-none pr-2 text-muted-foreground/50 w-4 text-right">
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
              </span>
              <span className="flex-1">{line.content}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

interface SplitDiffViewProps {
  oldLines: string[];
  newLines: string[];
  diffLines: DiffLine[];
  selectedLines: Set<number>;
  onToggleLineSelection: (lineIndex: number) => void;
  showLineSelection: boolean;
}

function SplitDiffView({
  oldLines,
  newLines,
  diffLines,
  selectedLines,
  onToggleLineSelection,
  showLineSelection,
}: SplitDiffViewProps) {
  // Build aligned pairs for split view
  const pairs = buildSplitPairs(diffLines);
  let changeLineIndex = 0;
  
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-2 text-xs font-mono divide-x divide-border">
        {/* Header */}
        <div className="px-3 py-1 bg-muted/50 text-muted-foreground border-b border-border">
          Original
        </div>
        <div className="px-3 py-1 bg-muted/50 text-muted-foreground border-b border-border">
          Modified
        </div>
        
        {/* Content rows */}
        {pairs.map((pair, index) => {
          const leftIsChange = pair.left?.type === "remove";
          const rightIsChange = pair.right?.type === "add";
          const leftChangeIndex = leftIsChange ? changeLineIndex++ : -1;
          const rightChangeIndex = rightIsChange ? changeLineIndex++ : -1;
          const leftSelected = leftIsChange && selectedLines.has(leftChangeIndex);
          const rightSelected = rightIsChange && selectedLines.has(rightChangeIndex);
          
          return (
            <div key={index} className="contents">
              {/* Left (old) side */}
              <div
                className={cn(
                  "px-3 py-0.5 flex items-center gap-1 min-h-[1.5rem]",
                  pair.left?.type === "remove" && "bg-destructive/10 text-destructive",
                  leftSelected && "ring-2 ring-primary ring-inset"
                )}
              >
                {showLineSelection && leftIsChange && (
                  <button
                    className={cn(
                      "flex-shrink-0 h-4 w-4 rounded border transition-colors",
                      leftSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                    onClick={() => onToggleLineSelection(leftChangeIndex)}
                  >
                    {leftSelected && <Check className="h-3 w-3" />}
                  </button>
                )}
                <span className="select-none text-muted-foreground/50 w-6 text-right">
                  {pair.left ? (pair.leftLineNum ?? "") : ""}
                </span>
                <span className="flex-1 truncate">{pair.left?.content || ""}</span>
              </div>
              
              {/* Right (new) side */}
              <div
                className={cn(
                  "px-3 py-0.5 flex items-center gap-1 min-h-[1.5rem]",
                  pair.right?.type === "add" && "bg-chart-2/10 text-chart-2",
                  rightSelected && "ring-2 ring-primary ring-inset"
                )}
              >
                {showLineSelection && rightIsChange && (
                  <button
                    className={cn(
                      "flex-shrink-0 h-4 w-4 rounded border transition-colors",
                      rightSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                    onClick={() => onToggleLineSelection(rightChangeIndex)}
                  >
                    {rightSelected && <Check className="h-3 w-3" />}
                  </button>
                )}
                <span className="select-none text-muted-foreground/50 w-6 text-right">
                  {pair.right ? (pair.rightLineNum ?? "") : ""}
                </span>
                <span className="flex-1 truncate">{pair.right?.content || ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DiffLine {
  type: "add" | "remove" | "unchanged";
  content: string;
}

interface SplitPair {
  left: DiffLine | null;
  right: DiffLine | null;
  leftLineNum?: number;
  rightLineNum?: number;
}

function buildSplitPairs(diffLines: DiffLine[]): SplitPair[] {
  const pairs: SplitPair[] = [];
  let leftLineNum = 1;
  let rightLineNum = 1;
  let i = 0;

  while (i < diffLines.length) {
    const line = diffLines[i];

    if (line.type === "unchanged") {
      pairs.push({
        left: line,
        right: line,
        leftLineNum: leftLineNum++,
        rightLineNum: rightLineNum++,
      });
      i++;
    } else if (line.type === "remove") {
      // Check if next line is an add (paired change)
      const nextLine = diffLines[i + 1];
      if (nextLine?.type === "add") {
        pairs.push({
          left: line,
          right: nextLine,
          leftLineNum: leftLineNum++,
          rightLineNum: rightLineNum++,
        });
        i += 2;
      } else {
        pairs.push({
          left: line,
          right: null,
          leftLineNum: leftLineNum++,
        });
        i++;
      }
    } else if (line.type === "add") {
      pairs.push({
        left: null,
        right: line,
        rightLineNum: rightLineNum++,
      });
      i++;
    } else {
      i++;
    }
  }

  return pairs;
}

function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      result.push({ type: "add", content: newLines[j] });
      j++;
    } else if (j >= newLines.length) {
      result.push({ type: "remove", content: oldLines[i] });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      result.push({ type: "unchanged", content: oldLines[i] });
      i++;
      j++;
    } else {
      const oldInNew = newLines.slice(j).indexOf(oldLines[i]);
      const newInOld = oldLines.slice(i).indexOf(newLines[j]);

      if (oldInNew === -1 && newInOld === -1) {
        result.push({ type: "remove", content: oldLines[i] });
        result.push({ type: "add", content: newLines[j] });
        i++;
        j++;
      } else if (oldInNew === -1 || (newInOld !== -1 && newInOld < oldInNew)) {
        result.push({ type: "remove", content: oldLines[i] });
        i++;
      } else {
        result.push({ type: "add", content: newLines[j] });
        j++;
      }
    }
  }

  return result;
}

// Export for testing
export { computeDiff, buildSplitPairs, type DiffLine, type SplitPair };
