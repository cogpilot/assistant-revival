# Assistant Landing - Full-Stack TODO

## Infrastructure
- [x] Initialize project (static → full-stack upgrade: db, server, user)
- [x] Create database schema (users, uploaded_files, chat_sessions, chat_messages)
- [x] Run db:push to create tables in MySQL
- [x] Add server/db.ts query helpers for all tables
- [x] Install all dependencies (pnpm install)

## Backend (tRPC)
- [x] Add tRPC file storage procedures (files.list, files.upload, files.delete)
- [x] Add tRPC chat procedures (chat.listSessions, chat.createSession, chat.deleteSession, chat.getMessages, chat.sendMessage)
- [x] Integrate LLM via invokeLLM for AI chat responses
- [x] Integrate S3 storagePut for file uploads

## Frontend Pages
- [x] Update Home.tsx with auth-aware navigation and CTAs
- [x] Create Dashboard page (quick actions, recent chats, recent files)
- [x] Create FileManager page (drag-and-drop upload, file list, delete)
- [x] Create Chat page (session sidebar, message thread, AI responses)
- [x] Register all routes in App.tsx (/dashboard, /files, /chat, /chat/:id)

## Testing
- [x] Write vitest tests for all new tRPC procedures (10/10 passing)
- [x] Existing auth.logout test still passing

## Deployment
- [ ] Save checkpoint
- [ ] Publish to production
