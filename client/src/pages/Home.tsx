import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Zap, Shield, Users, GitBranch, Sparkles, ArrowRight, Github, ExternalLink, LogIn, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm hover:text-blue-400 transition hidden sm:block">Features</a>
            <a href="#docs" className="text-sm hover:text-blue-400 transition hidden sm:block">Documentation</a>
            <a href="https://github.com/drzo/assistant-revival" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 bg-transparent">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </a>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <motion.div
          className="container max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            A Tribute to Replit's Assistant
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Your AI Coding Assistant
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Chat with AI, upload code files, get smart suggestions, and apply changes with confidence.
            A lightweight memorial edition of Replit's Assistant tool — now with persistent storage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
            <a href="https://github.com/drzo/assistant-revival" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 bg-transparent">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="font-bold text-blue-400">50+</div>
              <div className="text-slate-400">Components</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="font-bold text-blue-400">0</div>
              <div className="text-slate-400">TypeScript Errors</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="font-bold text-blue-400">24/7</div>
              <div className="text-slate-400">Uptime</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-900/50">
        <div className="container">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Everything you need for AI-powered coding assistance — now with persistent storage and user accounts
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 p-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          </motion.div>

          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {steps.map((step, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <span className="text-blue-400 font-semibold">{idx + 1}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Built With Modern Tech</h2>
            <p className="text-slate-300">Production-ready full-stack for performance and reliability</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Frontend</h3>
              <ul className="space-y-2 text-slate-300">
                <li>✓ React 19 with TypeScript</li>
                <li>✓ Vite for fast builds</li>
                <li>✓ Tailwind CSS + shadcn/ui</li>
                <li>✓ tRPC for type-safe API calls</li>
                <li>✓ Framer Motion animations</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Backend</h3>
              <ul className="space-y-2 text-slate-300">
                <li>✓ Express.js + tRPC server</li>
                <li>✓ MySQL database via Drizzle ORM</li>
                <li>✓ S3-compatible file storage</li>
                <li>✓ Manus OAuth authentication</li>
                <li>✓ Built-in LLM integration</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-20 px-4">
        <div className="container max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Getting Started</h2>
            <p className="text-slate-300">Quick setup guide for developers</p>
          </motion.div>

          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Installation</h3>
              <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-x-auto">
                <code>{`git clone https://github.com/drzo/assistant-revival.git
cd assistant-revival
npm install
npm run dev`}</code>
              </pre>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">File Mentions</h3>
              <p className="text-slate-300 mb-4">
                Reference files in your messages using the @mention syntax:
              </p>
              <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300">
                <code>@app.tsx Can you add error handling to this component?</code>
              </pre>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-y border-slate-700">
        <motion.div
          className="container max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-8">
            Sign in to access your personal AI coding assistant with file storage and persistent chat history
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Open Dashboard
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Sign In Free
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
            <a href="https://github.com/drzo/assistant-revival" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 bg-transparent">
                View Repository
                <Github className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                <li><a href="#docs" className="hover:text-blue-400 transition">Documentation</a></li>
                <li><a href="https://github.com/drzo/assistant-revival" className="hover:text-blue-400 transition">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">App</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/dashboard" className="hover:text-blue-400 transition">Dashboard</Link></li>
                <li><Link href="/files" className="hover:text-blue-400 transition">File Manager</Link></li>
                <li><Link href="/chat" className="hover:text-blue-400 transition">AI Chat</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://github.com/drzo/assistant-revival/blob/master/README.md" className="hover:text-blue-400 transition">README</a></li>
                <li><a href="https://github.com/drzo/assistant-revival/blob/master/QUICKSTART.md" className="hover:text-blue-400 transition">Quick Start</a></li>
                <li><a href="https://github.com/drzo/assistant-revival/blob/master/RENDER_DEPLOY.md" className="hover:text-blue-400 transition">Deploy Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <p className="text-sm text-slate-400">
                A tribute to Replit's Assistant tool. Built with care for developers.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 Assistant Memorial Edition. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { icon: Code2, title: "AI Chat", description: "Real-time conversation with AI for code suggestions, explanations, and debugging assistance" },
  { icon: GitBranch, title: "File Storage", description: "Upload and manage code files persistently — reference them with @mentions in any chat" },
  { icon: Zap, title: "Smart Diffs", description: "Preview proposed changes side-by-side before applying them to your code" },
  { icon: Shield, title: "Checkpoints", description: "Automatic versioning with rollback capability for safe experimentation" },
  { icon: Users, title: "User Accounts", description: "Secure OAuth authentication with personal workspaces and persistent history" },
  { icon: Sparkles, title: "Dark Mode", description: "Beautiful dark theme by default with light mode toggle for comfortable coding" }
];

const steps = [
  { title: "Sign In", description: "Authenticate with your Manus account to access your personal workspace" },
  { title: "Upload Files", description: "Add code files to your file manager for persistent storage and AI context" },
  { title: "Start a Chat", description: "Create a new chat session and mention files with @filename syntax" },
  { title: "Review Changes", description: "Preview proposed changes in the diff viewer before applying" },
  { title: "Apply or Reject", description: "Apply changes to create a checkpoint or reject them to continue" },
  { title: "Manage History", description: "View all your chat sessions and files — everything persists across sessions" }
];
