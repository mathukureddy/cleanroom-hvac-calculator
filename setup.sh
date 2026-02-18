#!/bin/bash

# Cleanroom HVAC Calculator - Setup Script
# This script automates the setup process

set -e  # Exit on error

echo "=============================================="
echo "🏭 Cleanroom HVAC Calculator Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "Download from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) found${NC}"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}⚠️  MySQL command not found in PATH${NC}"
    echo "Please ensure MySQL is installed and running."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ MySQL found${NC}"
fi

echo ""
echo "=============================================="
echo "📦 Installing Backend Dependencies"
echo "=============================================="
cd backend
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo ""
echo "=============================================="
echo "🗄️  Database Configuration"
echo "=============================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo ""
    echo -e "${BLUE}Please update backend/.env with your MySQL credentials:${NC}"
    echo "  - DB_PASSWORD (your MySQL root password)"
    echo ""
    read -p "Press Enter to continue after updating .env..."
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo "=============================================="
echo "🔧 Initializing Database"
echo "=============================================="
echo "This will create the database and seed data..."
npm run db:init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database initialized successfully${NC}"
else
    echo -e "${RED}❌ Database initialization failed${NC}"
    echo "Please check your MySQL credentials in backend/.env"
    exit 1
fi

echo ""
echo "=============================================="
echo "📦 Installing Frontend Dependencies"
echo "=============================================="
cd ../frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

cd ..

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd backend"
echo "   $ npm start"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend"
echo "   $ npm start"
echo ""
echo "🌐 Access the application at: http://localhost:3000"
echo ""
echo "🔐 Default Admin Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Main documentation"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - docs/DESIGN.md - System architecture"
echo "   - PROJECT_SUMMARY.md - Project overview"
echo ""
echo "=============================================="
echo "Happy Calculating! 🏭✨"
echo "=============================================="
