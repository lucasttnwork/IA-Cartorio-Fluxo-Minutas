#!/bin/bash

# ============================================================================
# Minuta Canvas - Development Environment Setup Script
# ============================================================================
# This script sets up and runs the development environment for the
# Minuta Canvas document processing system.
#
# Usage:
#   chmod +x init.sh
#   ./init.sh
#
# On Windows, run this script using Git Bash, WSL, or similar bash environment.
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo ""
echo "============================================================================"
echo "   Minuta Canvas - Document Processing & Draft Generation System"
echo "============================================================================"
echo ""

# Check for required tools
print_info "Checking required tools..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi
print_success "npm $(npm -v) found"

# Check for package manager (prefer pnpm, fallback to npm)
PACKAGE_MANAGER="npm"
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    print_success "pnpm found - using pnpm as package manager"
else
    print_info "pnpm not found - using npm as package manager"
fi

# Check for environment file
print_info "Checking environment configuration..."

if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    print_warning "No .env file found. Creating .env.local from template..."

    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_warning "Created .env.local - Please update with your actual credentials!"
    else
        # Create a template .env.local
        cat > .env.local << 'EOF'
# ============================================================================
# Minuta Canvas - Environment Variables
# ============================================================================
# Copy this file to .env.local and fill in your values

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# For server-side operations (Edge Functions / Worker)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Document AI
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GOOGLE_PROJECT_ID=your-google-project-id
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
DOCUMENT_AI_LOCATION=us  # or eu

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
VITE_APP_NAME=Minuta Canvas
VITE_APP_URL=http://localhost:5173
EOF
        print_warning "Created .env.local template - Please update with your actual credentials!"
    fi
    echo ""
    print_warning "=========================================="
    print_warning "IMPORTANT: Before continuing, update .env.local with:"
    print_warning "  - Supabase project URL and keys"
    print_warning "  - Google Cloud credentials"
    print_warning "  - Gemini API key"
    print_warning "=========================================="
    echo ""
fi

# Check if frontend directory exists
FRONTEND_DIR="."
if [ -d "frontend" ]; then
    FRONTEND_DIR="frontend"
elif [ -d "client" ]; then
    FRONTEND_DIR="client"
elif [ -d "src" ]; then
    FRONTEND_DIR="."
fi

# Install dependencies
print_info "Installing dependencies..."
echo ""

if [ "$FRONTEND_DIR" != "." ]; then
    print_info "Installing frontend dependencies in $FRONTEND_DIR..."
    cd "$FRONTEND_DIR"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    print_success "Dependencies installed successfully"
else
    print_info "node_modules already exists. Skipping install. Run '$PACKAGE_MANAGER install' manually if needed."
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_warning "No package.json found. Creating initial React + Vite project structure..."

    # Initialize a new Vite + React + TypeScript project
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm create vite@latest . --template react-ts
        pnpm install
    else
        npm create vite@latest . -- --template react-ts
        npm install
    fi

    # Install additional dependencies
    print_info "Installing additional project dependencies..."
    DEPS="@supabase/supabase-js @tanstack/react-query zustand framer-motion @xyflow/react @tiptap/react @tiptap/starter-kit @tiptap/extension-highlight react-router-dom react-dropzone date-fns"
    DEV_DEPS="tailwindcss postcss autoprefixer @types/react @types/react-dom typescript eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser"

    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm add $DEPS
        pnpm add -D $DEV_DEPS
    else
        npm install $DEPS
        npm install -D $DEV_DEPS
    fi

    # Initialize Tailwind CSS
    npx tailwindcss init -p

    print_success "Project initialized successfully"
fi

# Return to root if we changed directory
if [ "$FRONTEND_DIR" != "." ]; then
    cd ..
fi

# Check for worker directory
if [ -d "worker" ]; then
    print_info "Installing worker dependencies..."
    cd worker
    if [ ! -d "node_modules" ]; then
        if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
            pnpm install
        else
            npm install
        fi
    fi
    cd ..
    print_success "Worker dependencies installed"
fi

# Setup Supabase local development (if supabase CLI is available)
if command -v supabase &> /dev/null; then
    print_info "Supabase CLI found"

    if [ ! -d "supabase" ]; then
        print_info "Initializing Supabase local project..."
        supabase init
    fi

    print_info "You can start Supabase locally with: supabase start"
else
    print_info "Supabase CLI not found. Install it for local development:"
    print_info "  npm install -g supabase"
    print_info "  # or"
    print_info "  brew install supabase/tap/supabase"
fi

# Print summary and startup instructions
echo ""
echo "============================================================================"
print_success "Development environment setup complete!"
echo "============================================================================"
echo ""
echo "To start the development server:"
echo ""
if [ "$FRONTEND_DIR" != "." ]; then
    echo "  cd $FRONTEND_DIR && $PACKAGE_MANAGER run dev"
else
    echo "  $PACKAGE_MANAGER run dev"
fi
echo ""
echo "The application will be available at:"
echo ""
echo "  ${GREEN}http://localhost:5173${NC}"
echo ""
echo "============================================================================"
echo "Project Structure:"
echo "============================================================================"
echo ""
echo "  Frontend (React + Vite + TypeScript)"
echo "    - TailwindCSS for styling"
echo "    - Framer Motion for animations"
echo "    - React Flow (Xyflow) for infinite canvas"
echo "    - Tiptap for rich text editing"
echo "    - Zustand for state management"
echo ""
echo "  Backend (Supabase)"
echo "    - PostgreSQL with Row Level Security"
echo "    - Supabase Auth for authentication"
echo "    - Supabase Storage for documents"
echo "    - Supabase Realtime for live updates"
echo "    - Supabase Queues (pgmq) for job processing"
echo ""
echo "  Worker (Node.js + TypeScript)"
echo "    - Document AI OCR integration"
echo "    - Gemini API for AI extraction"
echo "    - Consensus engine"
echo "    - Entity resolution"
echo ""
echo "============================================================================"
echo "Quick Commands:"
echo "============================================================================"
echo ""
echo "  Start frontend:        $PACKAGE_MANAGER run dev"
echo "  Build for production:  $PACKAGE_MANAGER run build"
echo "  Run linting:           $PACKAGE_MANAGER run lint"
echo "  Type check:            $PACKAGE_MANAGER run typecheck"
echo ""
if [ -d "worker" ]; then
echo "  Start worker:          cd worker && $PACKAGE_MANAGER run dev"
echo ""
fi
if command -v supabase &> /dev/null; then
echo "  Start Supabase local:  supabase start"
echo "  Stop Supabase local:   supabase stop"
echo "  Apply migrations:      supabase db push"
echo "  Generate types:        supabase gen types typescript --local > src/types/database.ts"
echo ""
fi
echo "============================================================================"
echo "Environment Variables Required:"
echo "============================================================================"
echo ""
echo "  VITE_SUPABASE_URL          - Your Supabase project URL"
echo "  VITE_SUPABASE_ANON_KEY     - Your Supabase anon/public key"
echo "  SUPABASE_SERVICE_ROLE_KEY  - Service role key (for worker)"
echo "  GEMINI_API_KEY             - Google Gemini API key"
echo "  GOOGLE_PROJECT_ID          - Google Cloud project ID"
echo "  DOCUMENT_AI_PROCESSOR_ID   - Document AI processor ID"
echo ""
echo "============================================================================"
echo ""

# Start the development server
print_info "Starting development server..."
echo ""

if [ "$FRONTEND_DIR" != "." ]; then
    cd "$FRONTEND_DIR"
fi

if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm run dev
else
    npm run dev
fi
