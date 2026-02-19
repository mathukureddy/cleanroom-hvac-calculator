#!/bin/bash

# AWS EC2 Deployment Script for Cleanroom HVAC Calculator
# This script automates the deployment on a fresh Ubuntu EC2 instance

set -e  # Exit on error

echo "============================================"
echo "Cleanroom HVAC Calculator - AWS Deployment"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root or with sudo"
    exit 1
fi

# Get EC2 public IP
print_info "Detecting EC2 public IP address..."
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "")

if [ -z "$EC2_PUBLIC_IP" ]; then
    print_warning "Could not auto-detect EC2 IP. Please enter manually:"
    read -p "EC2 Public IP: " EC2_PUBLIC_IP
fi

print_info "Using IP address: $EC2_PUBLIC_IP"

# Prompt for database password
print_info "Enter MySQL password for the application (default: Cleanroom@123):"
read -sp "Password: " DB_PASSWORD
echo ""
DB_PASSWORD=${DB_PASSWORD:-Cleanroom@123}

# Prompt for JWT secret
print_info "Enter JWT secret key (or press Enter to generate):"
read -sp "JWT Secret: " JWT_SECRET
echo ""
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    print_info "Generated JWT Secret: $JWT_SECRET"
fi

# Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
print_info "Installing Node.js 16.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
    print_info "Node.js $(node --version) installed"
else
    print_info "Node.js $(node --version) already installed"
fi

# Install MySQL
print_info "Installing MySQL Server..."
if ! command -v mysql &> /dev/null; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y mysql-server
    print_info "MySQL installed"
else
    print_info "MySQL already installed"
fi

# Install Nginx
print_info "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    print_info "Nginx installed"
else
    print_info "Nginx already installed"
fi

# Install Git
print_info "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
fi

# Install PM2
print_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_info "PM2 installed"
else
    print_info "PM2 already installed"
fi

# Configure MySQL
print_info "Configuring MySQL..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cleanroom_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'cleanroom_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cleanroom_db.* TO 'cleanroom_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
print_info "MySQL database and user configured"

# Clone or update repository
print_info "Setting up application code..."
APP_DIR="$HOME/cleanroom-hvac-calculator"

if [ -d "$APP_DIR" ]; then
    print_info "Updating existing repository..."
    cd "$APP_DIR"
    git pull origin main
else
    print_info "Cloning repository..."
    git clone https://github.com/mathukureddy/cleanroom-hvac-calculator.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Setup Backend
print_info "Setting up backend..."
cd "$APP_DIR/backend"

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install

# Create .env file
print_info "Creating backend .env file..."
cat > .env << EOF
PORT=5001
DB_HOST=localhost
DB_USER=cleanroom_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=cleanroom_db
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOF

# Initialize database
print_info "Initializing database..."
npm run db:init

# Stop existing PM2 process if running
pm2 stop cleanroom-backend 2>/dev/null || true
pm2 delete cleanroom-backend 2>/dev/null || true

# Start backend with PM2
print_info "Starting backend with PM2..."
pm2 start server.js --name cleanroom-backend
pm2 save
pm2 startup | grep -v "PM2" | sudo bash || true

# Setup Frontend
print_info "Setting up frontend..."
cd "$APP_DIR/frontend"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
npm install

# Create production environment file
print_info "Creating frontend .env.production file..."
cat > .env.production << EOF
REACT_APP_API_URL=/api
EOF

# Build frontend
print_info "Building frontend..."
npm run build

# Deploy frontend to Nginx
print_info "Deploying frontend to Nginx..."
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# Configure Nginx
print_info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/cleanroom > /dev/null << EOF
server {
    listen 80;
    server_name $EC2_PUBLIC_IP _;

    root /var/www/html;
    index index.html;

    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/cleanroom /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_info "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
print_info "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure Firewall
print_info "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw status

# Create backup script
print_info "Creating backup script..."
mkdir -p "$HOME/backups"
cat > "$HOME/backup-database.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u cleanroom_user -p"$DB_PASSWORD" cleanroom_db > "$BACKUP_DIR/cleanroom_db_$DATE.sql"
# Keep only last 7 backups
ls -t "$BACKUP_DIR"/cleanroom_db_*.sql | tail -n +8 | xargs -r rm
echo "Backup completed: $BACKUP_DIR/cleanroom_db_$DATE.sql"
EOF
chmod +x "$HOME/backup-database.sh"

# Create update script
print_info "Creating update script..."
cat > "$HOME/update-app.sh" << 'EOF'
#!/bin/bash
set -e

echo "Updating Cleanroom HVAC Calculator..."

# Navigate to app directory
cd ~/cleanroom-hvac-calculator

# Pull latest code
git pull origin main

# Update backend
echo "Updating backend..."
cd backend
npm install
pm2 restart cleanroom-backend

# Update frontend
echo "Updating frontend..."
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/

echo "Update completed successfully!"
pm2 status
EOF
chmod +x "$HOME/update-app.sh"

# Display status
echo ""
echo "============================================"
print_info "Deployment completed successfully!"
echo "============================================"
echo ""
echo "Application Details:"
echo "  URL:          http://$EC2_PUBLIC_IP"
echo "  Backend API:  http://$EC2_PUBLIC_IP/api"
echo "  Database:     cleanroom_db"
echo ""
echo "Admin Credentials (default):"
echo "  Email:    admin@cleanroom.com"
echo "  Password: Admin@123"
echo ""
echo "Useful Commands:"
echo "  Check backend:  pm2 status"
echo "  View logs:      pm2 logs cleanroom-backend"
echo "  Restart:        pm2 restart cleanroom-backend"
echo "  Update app:     ~/update-app.sh"
echo "  Backup DB:      ~/backup-database.sh"
echo ""
echo "Next Steps:"
echo "  1. Open http://$EC2_PUBLIC_IP in your browser"
echo "  2. Login with admin credentials"
echo "  3. Change default admin password"
echo "  4. (Optional) Setup custom domain and SSL"
echo ""
print_warning "Important: Update AWS Security Group to allow:"
print_warning "  - Port 80 (HTTP) from 0.0.0.0/0"
print_warning "  - Port 443 (HTTPS) from 0.0.0.0/0"
print_warning "  - Port 22 (SSH) from your IP only"
echo ""
