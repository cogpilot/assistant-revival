import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  MessageSquare,
  FolderOpen,
  Home,
  LayoutDashboard,
  Plus,
  Moon,
  Sun,
  Search,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export interface CommandAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  group: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  /** Additional actions to register in the palette */
  extraActions?: CommandAction[];
}

export function CommandPalette({ extraActions = [] }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [recentActions, setRecentActions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("command-palette-recent");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Register global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const trackRecent = useCallback(
    (actionId: string) => {
      setRecentActions((prev) => {
        const updated = [actionId, ...prev.filter((id) => id !== actionId)].slice(0, 5);
        try {
          localStorage.setItem("command-palette-recent", JSON.stringify(updated));
        } catch {
          // ignore storage errors
        }
        return updated;
      });
    },
    []
  );

  const handleSelect = useCallback(
    (action: CommandAction) => {
      setOpen(false);
      trackRecent(action.id);
      action.onSelect();
    },
    [trackRecent]
  );

  const navigationActions: CommandAction[] = [
    {
      id: "nav-home",
      label: "Go to Home",
      icon: <Home className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => navigate("/"),
    },
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: "⌘D",
      group: "Navigation",
      onSelect: () => navigate("/dashboard"),
    },
    {
      id: "nav-chat",
      label: "Go to Chat",
      icon: <MessageSquare className="w-4 h-4" />,
      shortcut: "⌘J",
      group: "Navigation",
      onSelect: () => navigate("/chat"),
    },
    {
      id: "nav-files",
      label: "Go to Files",
      icon: <FolderOpen className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => navigate("/files"),
    },
  ];

  const actionItems: CommandAction[] = [
    {
      id: "action-new-chat",
      label: "New Chat Session",
      icon: <Plus className="w-4 h-4" />,
      shortcut: "⌘N",
      group: "Actions",
      onSelect: () => navigate("/chat"),
    },
    {
      id: "action-search",
      label: "Search Files",
      icon: <Search className="w-4 h-4" />,
      group: "Actions",
      onSelect: () => navigate("/files"),
    },
    {
      id: "action-toggle-theme",
      label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      icon: theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      group: "Actions",
      onSelect: () => toggleTheme?.(),
    },
  ];

  const allActions = [...navigationActions, ...actionItems, ...extraActions];

  // Build recent group
  const recentGroup = recentActions
    .map((id) => allActions.find((a) => a.id === id))
    .filter(Boolean) as CommandAction[];

  // Group actions by their group field
  const groups = new Map<string, CommandAction[]>();
  for (const action of allActions) {
    const existing = groups.get(action.group) || [];
    existing.push(action);
    groups.set(action.group, existing);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recentGroup.length > 0 && (
          <CommandGroup heading="Recent">
            {recentGroup.map((action) => (
              <CommandItem
                key={`recent-${action.id}`}
                value={action.label}
                onSelect={() => handleSelect(action)}
              >
                {action.icon}
                <span>{action.label}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {Array.from(groups.entries()).map(([group, actions]) => (
          <CommandGroup key={group} heading={group}>
            {actions.map((action) => (
              <CommandItem
                key={action.id}
                value={action.label}
                onSelect={() => handleSelect(action)}
              >
                {action.icon}
                <span>{action.label}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
