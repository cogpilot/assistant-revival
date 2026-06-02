import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Plus, Trash2, Sparkles, LogOut, Home, ArrowLeft, Send, Bot, User } from "lucide-react";
import { Link, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Chat() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const params = useParams<{ id?: string }>();
  const sessionId = params.id ? parseInt(params.id) : null;

  const utils = trpc.useUtils();
  const { data: sessions } = trpc.chat.listSessions.useQuery(undefined, { enabled: isAuthenticated });
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId! },
    { enabled: isAuthenticated && sessionId !== null }
  );

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (s) => { utils.chat.listSessions.invalidate(); window.location.href = `/chat/${s!.id}`; },
    onError: (e) => toast.error(e.message),
  });
  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: () => { utils.chat.listSessions.invalidate(); window.location.href = "/chat"; },
    onError: (e) => toast.error(e.message),
  });
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => { utils.chat.getMessages.invalidate({ sessionId: sessionId! }); utils.chat.listSessions.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !sessionId || sendMessage.isPending) return;
    sendMessage.mutate({ sessionId, content: input.trim() });
    setInput("");
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-400 animate-pulse">Loading…</div></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <Sparkles className="w-12 h-12 text-blue-400" />
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <a href={getLoginUrl()}><Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button></a>
        <Link href="/"><Button variant="ghost" className="text-slate-400 hover:text-white">← Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold">Assistant</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm">Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Button></Link>
            <Link href="/"><Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Home className="w-4 h-4" /></Button></Link>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col flex-shrink-0 hidden md:flex">
          <div className="p-3 border-b border-slate-800">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
              onClick={() => createSession.mutate({})}
              disabled={createSession.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions?.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${sessionId === s.id ? "bg-blue-600/20 border border-blue-500/30" : "hover:bg-slate-800 border border-transparent"}`}
                onClick={() => window.location.href = `/chat/${s.id}`}
              >
                <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-300 truncate flex-1">{s.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); deleteSession.mutate({ id: s.id }); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!sessions || sessions.length === 0) && (
              <p className="text-xs text-slate-600 text-center py-4">No chats yet</p>
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {sessionId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-slate-500 animate-pulse py-8">Loading messages…</div>
                ) : messages && messages.length > 0 ? (
                  messages.map((m) => (
                    <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && (
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-blue-400" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"}`}>
                        {m.role === "assistant" ? <Streamdown>{m.content}</Streamdown> : m.content}
                      </div>
                      {m.role === "user" && (
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Start the conversation below</p>
                  </div>
                )}
                {sendMessage.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-800 p-4 bg-slate-900/50 flex-shrink-0">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <textarea
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ask anything about your code… (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                  />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 px-4 self-end"
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessage.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* No session selected */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
              <MessageSquare className="w-14 h-14 opacity-20" />
              <p className="text-lg">Select a chat or start a new one</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => createSession.mutate({})}>
                <Plus className="w-4 h-4 mr-2" /> New Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
