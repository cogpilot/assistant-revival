import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FolderOpen, Upload, Trash2, Sparkles, LogOut, Home, ArrowLeft, FileCode, FileText, File } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useRef, useState } from "react";
import { toast } from "sonner";

function fileIcon(mimeType: string) {
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json") || mimeType.includes("html") || mimeType.includes("css")) return FileCode;
  if (mimeType.startsWith("text/")) return FileText;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileManager() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.files.list.useQuery(undefined, { enabled: isAuthenticated });
  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => { utils.files.list.invalidate(); toast.success("File uploaded successfully"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => { utils.files.list.invalidate(); toast.success("File deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB limit`); continue; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = (e.target?.result as string).split(",")[1];
        uploadMutation.mutate({ filename: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, base64Data });
      };
      reader.readAsDataURL(file);
    }
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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold">Assistant</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm">Files</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard"><Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Button></Link>
            <Link href="/"><Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Home className="w-4 h-4" /></Button></Link>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">File Manager</h1>
            <p className="text-slate-400 text-sm">{files?.length ?? 0} files stored · Upload code files to reference in AI chat</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? "Uploading…" : "Upload Files"}
          </Button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center mb-8 transition-all ${dragging ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-600"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500" />
          <p className="text-slate-400 text-sm">Drag and drop files here, or <span className="text-blue-400 cursor-pointer">click to browse</span></p>
          <p className="text-slate-600 text-xs mt-1">Max 10 MB per file · Any file type</p>
        </div>

        {/* File list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />)}
          </div>
        ) : files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((f) => {
              const Icon = fileIcon(f.mimeType);
              return (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all group">
                  <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{f.originalName}</p>
                    <p className="text-xs text-slate-500">{formatBytes(f.sizeBytes)} · {f.mimeType} · {new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={f.storageUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 px-2 text-xs">View</Button>
                    </a>
                    <Button
                      variant="ghost" size="sm"
                      className="text-slate-400 hover:text-red-400 h-8 px-2"
                      onClick={() => deleteMutation.mutate({ id: f.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No files yet. Upload your first file to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
