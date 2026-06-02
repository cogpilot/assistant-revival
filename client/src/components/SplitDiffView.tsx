import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, X, Columns2, Rows2 } from "lucide-react";

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: { left?: number; right?: number };
}

export interface SplitDiffViewProps {
  /** Original code (before) */
  original: string;
  /** Modified code (after) */
  modified: string;
  /** Language for syntax identification */
  language?: string;
  /** Filename displayed in header */
  filename?: string;
  /** Called when user accepts all changes */
  onAccept?: () => void;
  /** Called when user rejects all changes */
  onReject?: () => void;
  /** Called when a single line change is accepted/rejected */
  onLineAction?: (lineIndex: number, action: "accept" | "reject") => void;
  /** Class name for the container */
  className?: string;
}

/**
 * Computes a simple line diff between two texts.
 * Uses a longest common subsequence approach for basic diffing.
 */
function computeDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");
  const result: DiffLine[] = [];

  let leftNum = 1;
  let rightNum = 1;
  let i = 0;
  let j = 0;

  // Simple diff: match lines greedily, mark unmatched as removed/added
  while (i < originalLines.length && j < modifiedLines.length) {
    if (originalLines[i] === modifiedLines[j]) {
      result.push({
        type: "unchanged",
        content: originalLines[i],
        lineNumber: { left: leftNum++, right: rightNum++ },
      });
      i++;
      j++;
    } else {
      // Look ahead to find the next matching line
      let foundInModified = -1;
      let foundInOriginal = -1;

      for (let k = j + 1; k < Math.min(j + 10, modifiedLines.length); k++) {
        if (originalLines[i] === modifiedLines[k]) {
          foundInModified = k;
          break;
        }
      }

      for (let k = i + 1; k < Math.min(i + 10, originalLines.length); k++) {
        if (originalLines[k] === modifiedLines[j]) {
          foundInOriginal = k;
          break;
        }
      }

      if (foundInOriginal !== -1 && (foundInModified === -1 || foundInOriginal - i <= foundInModified - j)) {
        // Lines removed from original
        while (i < foundInOriginal) {
          result.push({
            type: "removed",
            content: originalLines[i],
            lineNumber: { left: leftNum++ },
          });
          i++;
        }
      } else if (foundInModified !== -1) {
        // Lines added in modified
        while (j < foundInModified) {
          result.push({
            type: "added",
            content: modifiedLines[j],
            lineNumber: { right: rightNum++ },
          });
          j++;
        }
      } else {
        // No match found nearby, treat as remove + add
        result.push({
          type: "removed",
          content: originalLines[i],
          lineNumber: { left: leftNum++ },
        });
        result.push({
          type: "added",
          content: modifiedLines[j],
          lineNumber: { right: rightNum++ },
        });
        i++;
        j++;
      }
    }
  }

  // Remaining lines from original (removed)
  while (i < originalLines.length) {
    result.push({
      type: "removed",
      content: originalLines[i],
      lineNumber: { left: leftNum++ },
    });
    i++;
  }

  // Remaining lines from modified (added)
  while (j < modifiedLines.length) {
    result.push({
      type: "added",
      content: modifiedLines[j],
      lineNumber: { right: rightNum++ },
    });
    j++;
  }

  return result;
}

type ViewMode = "split" | "unified";

export function SplitDiffView({
  original,
  modified,
  filename,
  onAccept,
  onReject,
  onLineAction,
  className,
}: SplitDiffViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const diff = useMemo(() => computeDiff(original, modified), [original, modified]);

  const addedCount = diff.filter((l) => l.type === "added").length;
  const removedCount = diff.filter((l) => l.type === "removed").length;

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          {filename && (
            <span className="text-sm font-mono font-medium">{filename}</span>
          )}
          <span className="text-xs text-green-500">+{addedCount}</span>
          <span className="text-xs text-red-500">-{removedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "split" ? "unified" : "split")}
            title={viewMode === "split" ? "Switch to unified view" : "Switch to split view"}
          >
            {viewMode === "split" ? (
              <Rows2 className="w-4 h-4" />
            ) : (
              <Columns2 className="w-4 h-4" />
            )}
          </Button>
          {onReject && (
            <Button variant="ghost" size="sm" onClick={onReject} className="text-red-500 hover:text-red-600">
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          )}
          {onAccept && (
            <Button variant="ghost" size="sm" onClick={onAccept} className="text-green-500 hover:text-green-600">
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
          )}
        </div>
      </div>

      {/* Diff content */}
      <div className="overflow-x-auto text-sm font-mono">
        {viewMode === "split" ? (
          <SplitView diff={diff} onLineAction={onLineAction} />
        ) : (
          <UnifiedView diff={diff} onLineAction={onLineAction} />
        )}
      </div>
    </div>
  );
}

function SplitView({
  diff,
  onLineAction,
}: {
  diff: DiffLine[];
  onLineAction?: (index: number, action: "accept" | "reject") => void;
}) {
  // Pair removed/added lines for side-by-side display
  const pairs: { left: DiffLine | null; right: DiffLine | null; index: number }[] = [];
  let idx = 0;

  while (idx < diff.length) {
    const line = diff[idx];
    if (line.type === "unchanged") {
      pairs.push({ left: line, right: line, index: idx });
      idx++;
    } else if (line.type === "removed") {
      // Check if next line is added (paired change)
      const next = idx + 1 < diff.length ? diff[idx + 1] : null;
      if (next && next.type === "added") {
        pairs.push({ left: line, right: next, index: idx });
        idx += 2;
      } else {
        pairs.push({ left: line, right: null, index: idx });
        idx++;
      }
    } else {
      // added without a paired remove
      pairs.push({ left: null, right: line, index: idx });
      idx++;
    }
  }

  return (
    <table className="w-full border-collapse">
      <tbody>
        {pairs.map((pair, i) => (
          <tr key={i} className="group">
            {/* Left (original) */}
            <td className="w-10 text-right pr-2 text-muted-foreground select-none border-r text-xs align-top py-0.5">
              {pair.left?.lineNumber.left ?? ""}
            </td>
            <td
              className={cn(
                "px-3 py-0.5 whitespace-pre-wrap break-all border-r w-1/2",
                pair.left?.type === "removed" && "bg-red-500/10 text-red-300"
              )}
            >
              {pair.left?.content ?? ""}
            </td>

            {/* Right (modified) */}
            <td className="w-10 text-right pr-2 text-muted-foreground select-none border-r text-xs align-top py-0.5">
              {pair.right?.lineNumber.right ?? ""}
            </td>
            <td
              className={cn(
                "px-3 py-0.5 whitespace-pre-wrap break-all w-1/2",
                pair.right?.type === "added" && "bg-green-500/10 text-green-300"
              )}
            >
              {pair.right?.content ?? ""}
            </td>

            {/* Line action button */}
            {onLineAction && (pair.left?.type === "removed" || pair.right?.type === "added") && (
              <td className="w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="text-green-500 hover:text-green-400 p-0.5"
                  onClick={() => onLineAction(pair.index, "accept")}
                  title="Accept this change"
                >
                  <Check className="w-3 h-3" />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UnifiedView({
  diff,
  onLineAction,
}: {
  diff: DiffLine[];
  onLineAction?: (index: number, action: "accept" | "reject") => void;
}) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {diff.map((line, i) => (
          <tr key={i} className="group">
            <td className="w-10 text-right pr-2 text-muted-foreground select-none text-xs align-top py-0.5">
              {line.lineNumber.left ?? ""}
            </td>
            <td className="w-10 text-right pr-2 text-muted-foreground select-none text-xs align-top py-0.5 border-r">
              {line.lineNumber.right ?? ""}
            </td>
            <td className="w-5 text-center select-none text-xs py-0.5">
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </td>
            <td
              className={cn(
                "px-3 py-0.5 whitespace-pre-wrap break-all",
                line.type === "added" && "bg-green-500/10 text-green-300",
                line.type === "removed" && "bg-red-500/10 text-red-300"
              )}
            >
              {line.content}
            </td>
            {onLineAction && line.type !== "unchanged" && (
              <td className="w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="text-green-500 hover:text-green-400 p-0.5"
                  onClick={() => onLineAction(i, "accept")}
                  title="Accept this change"
                >
                  <Check className="w-3 h-3" />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { computeDiff };
