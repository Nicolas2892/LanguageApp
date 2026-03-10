# Best Practice.md

# Coding
## Core Development Stack
You are an expert in TypeScript, Node. js, Next. js App Router, React, Supabase, Shadc UI, Radix UI, and Tailwind CSS.

## GitHub
- make a new Git repository for this project. I would like you then to make clean commit messages, save them locally and then push them to Github, so that we always have a saved version of the project and it's easier for us to revert back in case we make any changes. Set up a GitHub repository, configure everything and just use Git and GitHub for the rest of the project.

## Package Management & Environment
- **Package Manager**: Use 'pnpm' exclusively (never npm or yarn)
- **Server Configuration**: Server always runs on port 3000
- **MCP Integration**: Utilize available MCP servers for knowledgebase and understanding
- **Console Monitoring**: Actively fetch and analyze logs from the console
- **Package Installation**: Only install packages when explicitly requested

## Development Philosophy
- Prioritize iteration and modularization over coWduplication
- Proactively suggest performance improvements
- Identify potential security vulnerabilities and provide solutions
- Write concise, technical TypeScript with accurate examples
- Include comments to clarify technical concepts and functions
- Favor functional and declarative patterns over class-based approaches

## Project Structure

### Directory Organization
- **App Router**: Utilize the app/ directory structure (layout.tsx, page.tsx, loading.tsx, error.tsx)
- **Component Location**: Place components in "/app/components' grouped by use case in subdirectories
- **UI Components**: Always leverage "/components/ui" for building new components
- **Feature Grouping**: Organize files by domain (e.g., features/auth, features/dashboard)
- **Utilities**: Use lib/ for low-level logic, Supabase clients, and third-party utilities
- **Supabase Assets**: ALWAYS store migrations and edge functions in the supabase/ directory
- **Directory Naming**: Use Lowercase with dashes (e.g.,components/auth-wizard)

### Code Architecture
- Export order: exported component → subcomponents - helpers + static content → types
- Use named exports for components
- Implement helper functions to avoid code duplication
- Create modular, reusable components


# TypeScript Standards

### Type System
- Write all code in TypeScript (no exceptions)
- Prefer interfaces over types for object shapes
- Avoid "any" type - use "unknown" or explicit types instead
- Use interfaces for component props and data models
- Replace enums with plain object maps
- Enable TypeScript strict mode

### Naming Conventions
- Use descriptive variable names with auxiliary verbs (isLoading, hasError, canSubmit)
- Maintain consistent naming patterns across the codebase

## Supabase Implementation

### Client Architecture
- Separate environments using "Lib/supabase/server.ts" and Lib/supabase/client.ts*
- Never access Supabase directly in components - use server actions or API routes
- Use anon key only in client components for public queries
- Reserve service_role key for server-side operations only

### Security Configuration
- Enable Row Level Security (RLS) from project inception
- Implement Supabase Auth from day one
- Write RLS rules validating user identity via auth.uid() or request.auth
- Store secrets in Supabase function environment variables
- Limit data exposure - return only necessary fields from database

### Environment Management
- Store all keys in environment variables
- Use "env. local' for development-only secrets
- Never expose secrets in browser-accessible code
