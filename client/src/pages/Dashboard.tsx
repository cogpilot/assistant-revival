import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FolderOpen, MessageSquare, Upload, Plus, Sparkles, LogOut, Home } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { data: files } = trpc.files.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sessions } = trpc.chat.listSessions.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <Sparkles className="w-12 h-12 text-blue-400" />
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="text-slate-400">Access your personal AI coding assistant</p>
        <a href={getLoginUrl()}>
          <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
        </a>
        <Link href="/">
          <Button variant="ghost" className="text-slate-400 hover:text-white">← Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold">Assistant</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">{user?.name ?? user?.email}</span>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back{user?.name ? `, ${user.name}` : ""}!</h1>
          <p className="text-slate-400">Your personal AI coding assistant workspace</p>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <Link href="/chat">
            <Card className="bg-blue-600/10 border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-500/30 transition-colors">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <CardTitle className="text-white text-base">New Chat</CardTitle>
                <CardDescription className="text-slate-400 text-sm">Start an AI coding session</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/files">
            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/40 transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center mb-2 group-hover:bg-slate-600 transition-colors">
                  <Upload className="w-5 h-5 text-slate-300" />
                </div>
                <CardTitle className="text-white text-base">Upload Files</CardTitle>
                <CardDescription className="text-slate-400 text-sm">Add code files for AI context</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/files">
            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/40 transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center mb-2 group-hover:bg-slate-600 transition-colors">
                  <FolderOpen className="w-5 h-5 text-slate-300" />
                </div>
                <CardTitle className="text-white text-base">File Manager</CardTitle>
                <CardDescription className="text-slate-400 text-sm">{files?.length ?? 0} files stored</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent sessions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Chats</h2>
            <Link href="/chat">
              <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-800 bg-transparent text-slate-300">
                <Plus className="w-4 h-4 mr-1" /> New Chat
              </Button>
            </Link>
          </div>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <Link key={s.id} href={`/chat/${s.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/40 transition-all cursor-pointer">
                    <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-200 truncate">{s.title}</span>
                    <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No chats yet. Start your first session!</p>
            </div>
          )}
        </div>

        {/* Recent files */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Files</h2>
            <Link href="/files">
              <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-800 bg-transparent text-slate-300">
                View All
              </Button>
            </Link>
          </div>
          {files && files.length > 0 ? (
            <div className="space-y-2">
              {files.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-200 truncate">{f.originalName}</span>
                  <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
                    {(f.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No files uploaded yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
