# 3D AR Model Viewer & Admin Platform

## Overview

This is a full-stack web application that enables users to upload 3D models and view them in augmented reality (AR) on their devices. The platform supports two user types: regular users who can upload and convert models for AR viewing, and administrators who can manage a public gallery of 3D models with full CRUD capabilities.

**Key Features:**
- Device-specific 3D model conversion (iOS → USDZ, Android → GLB)
- AR viewing via Quick Look (iOS) and WebXR (Android)
- Temporary file management with automatic cleanup
- Admin dashboard for managing public 3D model gallery
- Future-ready configurator architecture for material/texture swapping

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight React Router alternative)

**State Management:**
- Zustand for global state (auth, upload state, theme)
- TanStack Query (React Query) for server state and data fetching
- Persistent state using zustand/middleware for auth tokens and session data

**UI Component System:**
- Shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- Material Design System foundation with custom 3D viewer components
- Dark/light theme support
- Typography: Inter (primary UI) and Space Grotesk (headers)

**3D Model Rendering:**
- Google Model Viewer web component for AR display
- Supports Quick Look AR for iOS (USDZ format)
- Supports WebXR for Android/other devices (GLB format)

**Form Handling:**
- React Hook Form with Zod validation
- Hookform Resolvers for schema validation integration

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js
- TypeScript for type safety across the full stack
- ESM modules (type: "module" in package.json)

**Authentication & Authorization:**
- JWT-based authentication with bcryptjs for password hashing
- Custom auth middleware for protected routes
- Admin middleware for role-based access control
- Tokens stored client-side with 7-day expiration

**File Upload & Processing:**
- Multer for multipart/form-data file uploads
- Memory storage with 100MB file size limit
- Automatic device-based format conversion
- Temporary file cleanup on session expiration or page reload

**3D Model Conversion Strategy:**
- Supports input formats: GLB, GLTF, OBJ, FBX, STL
- Device-type detection determines target format:
  - iOS devices → USDZ format
  - Android/Other → GLB format
  - Both → dual format output
- File copies for GLB/GLTF (native web formats)
- Placeholder conversion logic for format transformation (extensible for tools like fbx2gltf, gltf-transform, gltf-to-usdz)

**Storage Architecture:**
- `/uploads/temp` - Temporary user uploads (auto-deleted)
- `/uploads/admin-models` - Permanent admin model storage
- `/uploads/admin-textures` - Admin texture/material assets
- Session-based file tracking for cleanup
- Periodic cleanup job (hourly) for expired temp files (24hr TTL)

**API Design:**
- RESTful endpoints organized by resource
- JSON request/response format
- Error handling with appropriate HTTP status codes
- CORS and rate limiting ready

### Data Storage

**In-Memory Storage (Development/Demo):**
- MemStorage class implementing IStorage interface
- Maps for users, admin models, configurator metadata, textures, temp uploads
- UUID-based unique identifiers

**Database-Ready Architecture:**
- Drizzle ORM configuration for PostgreSQL
- Neon Database serverless adapter
- Schema definitions in shared/schema.ts
- Migration setup in drizzle.config.ts
- Environment variable: DATABASE_URL

**Data Models:**
- **User**: id, username, hashed password, isAdmin flag
- **AdminModel**: id, title, description, category, visible flag, file paths, timestamps
- **ConfiguratorMetadata**: parts array, textures/materials/colors for future configurator
- **ModelTexture**: texture file associations for admin models
- **TempUpload**: session tracking, device type, conversion status, file paths

### Session Management

**Temporary Upload Lifecycle:**
- Session ID generated on page load (timestamp + random string)
- Files associated with session ID
- Auto-cleanup triggers:
  - Page reload/navigation (new session ID)
  - New upload replaces previous
  - 24-hour expiration (background job)
- Backend endpoint for manual cleanup

**Persistent Gallery:**
- Admin-uploaded models stored permanently
- Visibility toggle for public/private models
- Full CRUD operations require admin authentication

### Build & Deployment

**Development Mode:**
- Vite HMR for frontend
- tsx for backend hot-reload
- Concurrent client/server development

**Production Build:**
- esbuild bundles server code to dist/index.cjs
- Vite builds client to dist/public
- Dependency bundling strategy with allowlist for faster cold starts
- Static file serving from Express

**Environment Configuration:**
- NODE_ENV for environment switching
- SESSION_SECRET for JWT signing
- DATABASE_URL for PostgreSQL connection
- Replit-specific plugins for development tooling

## External Dependencies

### Third-Party Services

**Database:**
- Neon Database (PostgreSQL serverless)
- Drizzle ORM for database operations and migrations

**3D Model Technologies:**
- Google Model Viewer (@google/model-viewer) - AR viewer web component
- Future integration points: fbx2gltf, gltf-transform, gltf-to-usdz for format conversion

### Key NPM Packages

**Frontend:**
- @tanstack/react-query - Server state management
- wouter - Client-side routing
- zustand - Global state management
- @radix-ui/* - Headless UI components
- tailwindcss - Utility-first CSS
- react-hook-form + zod - Form validation
- lucide-react - Icon library

**Backend:**
- express - Web framework
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- multer - File upload middleware
- uuid - Unique ID generation

**Build & Development:**
- vite - Frontend build tool
- esbuild - Backend bundler
- tsx - TypeScript execution
- drizzle-kit - Database migrations

**Development Tools (Replit):**
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer
- @replit/vite-plugin-dev-banner

### File Storage

**Local Filesystem:**
- Static file serving via Express
- Directory structure: uploads/temp, uploads/admin-models, uploads/admin-textures
- CORS headers for cross-origin asset access

**Future Considerations:**
- Cloud storage integration (S3, Cloudflare R2) for production scalability
- CDN for optimized 3D model delivery