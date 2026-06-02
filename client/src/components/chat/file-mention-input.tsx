
import { useState, useRef, useEffect, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { File, X, Star, Sparkles, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FileWithMetadata {
  path: string;
  name: string;
  language?: string;
  content?: string;
  lastModified?: string;
}

interface FileMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  availableFiles: FileWithMetadata[];
  mentionedFiles: string[];
  onMentionFile: (filePath: string) => void;
  onRemoveMention: (filePath: string) => void;
  disabled?: boolean;
  recentFiles?: string[];
}

// Simple keyword extraction for semantic analysis
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but',
    'or', 'nor', 'not', 'what', 'which', 'who', 'this', 'that', 'these',
    'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she',
    'it', 'they', 'them', 'their', 'make', 'change', 'update', 'add',
    'remove', 'delete', 'create', 'fix', 'help', 'want', 'please', 'file',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

// Calculate relevance score for a file based on query
function calculateRelevanceScore(
  file: FileWithMetadata,
  query: string,
  keywords: string[],
  recentFiles: string[] = []
): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const nameLower = file.name.toLowerCase();
  const pathLower = file.path.toLowerCase();

  // Exact name match (highest priority)
  if (nameLower === queryLower) score += 100;
  // Name contains query
  else if (nameLower.includes(queryLower)) score += 50;
  // Path contains query
  else if (pathLower.includes(queryLower)) score += 30;

  // Keyword matches
  for (const keyword of keywords) {
    if (nameLower.includes(keyword)) score += 20;
    if (pathLower.includes(keyword)) score += 10;
    
    // Check file content if available
    if (file.content) {
      const contentLower = file.content.toLowerCase();
      if (contentLower.includes(keyword)) score += 5;
    }
  }

  // Language-specific relevance
  const languageKeywords: Record<string, string[]> = {
    'typescript': ['ts', 'tsx', 'type', 'interface', 'typescript'],
    'javascript': ['js', 'jsx', 'javascript', 'node'],
    'python': ['py', 'python', 'pip', 'django', 'flask'],
    'css': ['css', 'style', 'scss', 'sass', 'tailwind'],
    'html': ['html', 'htm', 'template', 'markup'],
    'json': ['json', 'config', 'package', 'settings'],
    'markdown': ['md', 'readme', 'docs', 'documentation'],
  };

  for (const [lang, langKeywords] of Object.entries(languageKeywords)) {
    if (file.language?.toLowerCase() === lang) {
      for (const keyword of keywords) {
        if (langKeywords.includes(keyword)) score += 15;
      }
    }
  }

  // Recent file bonus
  const recentIndex = recentFiles.indexOf(file.path);
  if (recentIndex !== -1) {
    score += Math.max(0, 25 - recentIndex * 5); // Higher score for more recent
  }

  return score;
}

export function FileMentionInput({
  value,
  onChange,
  onSubmit,
  availableFiles,
  mentionedFiles,
  onMentionFile,
  onRemoveMention,
  disabled,
  recentFiles = [],
}: FileMentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract keywords from the full query for context-aware suggestions
  const queryKeywords = useMemo(() => extractKeywords(value), [value]);

  // Smart file filtering with relevance scoring
  const rankedFiles = useMemo(() => {
    const filesWithScores = availableFiles
      .filter((file) => !mentionedFiles.includes(file.path))
      .map((file) => ({
        file,
        score: calculateRelevanceScore(file, mentionFilter, queryKeywords, recentFiles),
        matchType: getMatchType(file, mentionFilter, queryKeywords, recentFiles),
      }))
      .filter((item) => {
        // If there's a filter, require some match
        if (mentionFilter) {
          const nameLower = item.file.name.toLowerCase();
          const pathLower = item.file.path.toLowerCase();
          const filterLower = mentionFilter.toLowerCase();
          return nameLower.includes(filterLower) || pathLower.includes(filterLower) || item.score > 0;
        }
        // If no filter, show all with score or recent
        return item.score > 0 || recentFiles.includes(item.file.path);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return filesWithScores;
  }, [availableFiles, mentionFilter, queryKeywords, mentionedFiles, recentFiles]);

  // Reset selected index when files change
  useEffect(() => {
    setSelectedIndex(0);
  }, [rankedFiles.length]);

  const handleInput = (newValue: string) => {
    onChange(newValue);
    
    // Detect @ mentions - match file path characters (alphanumeric, dots, slashes, hyphens, underscores)
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([\w\-./]*)$/);
    
    if (atMatch) {
      setMentionFilter(atMatch[1]);
      setShowMentions(true);
      setCursorPosition(cursorPos);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (filePath: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const beforeAt = textBeforeCursor.replace(/@[\w\-./]*$/, '');
    const newValue = `${beforeAt}@${filePath} ${textAfterCursor}`;
    
    onChange(newValue);
    onMentionFile(filePath);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && rankedFiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, rankedFiles.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && showMentions) {
        // Use Enter for selection; Tab key is not intercepted to maintain accessibility
        e.preventDefault();
        if (rankedFiles[selectedIndex]) {
          insertMention(rankedFiles[selectedIndex].file.path);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {mentionedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentionedFiles.map(filePath => (
            <div
              key={filePath}
              className="flex items-center gap-1 px-2 py-1 bg-accent rounded-md text-sm"
            >
              <File className="h-3 w-3" />
              <span>{filePath}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => onRemoveMention(filePath)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type @ to mention files, or ask a question..."
          disabled={disabled}
          className="min-h-[80px]"
        />
        
        {showMentions && (rankedFiles.length > 0 || mentionFilter) && (
          <div className="absolute bottom-full left-0 right-0 mb-2 border rounded-md bg-background shadow-lg z-50">
            <ScrollArea className="max-h-64">
              {rankedFiles.length > 0 ? (
                <div className="p-2 space-y-1">
                  {rankedFiles.map((item, index) => (
                    <Button
                      key={item.file.path}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-2",
                        index === selectedIndex && "bg-accent"
                      )}
                      onClick={() => insertMention(item.file.path)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <File className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{item.file.path}</span>
                      {item.matchType && (
                        <Badge variant="outline" className="text-xs px-1 py-0 flex-shrink-0">
                          {item.matchType === 'suggested' && (
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {item.matchType === 'recent' && (
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {item.matchType}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No matching files found
                </div>
              )}
            </ScrollArea>
            <div className="border-t px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
              <span>↑↓ to navigate • Enter to select</span>
              <span>Esc to close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getMatchType(
  file: FileWithMetadata,
  filter: string,
  keywords: string[],
  recentFiles: string[]
): string | null {
  const nameLower = file.name.toLowerCase();
  const filterLower = filter.toLowerCase();

  // Check if it's a recent file
  if (recentFiles.includes(file.path)) {
    return 'recent';
  }

  // Check if keywords match (suggested based on context)
  if (keywords.length > 0) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword) || file.path.toLowerCase().includes(keyword)) {
        return 'suggested';
      }
    }
  }

  return null;
}

