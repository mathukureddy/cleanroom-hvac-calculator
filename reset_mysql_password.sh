#!/bin/bash

# MySQL Password Reset Script for macOS - MySQL 8+ Compatible

echo "=============================================="
echo "🔐 MySQL Root Password Reset (MySQL 8+)"
echo "=============================================="
echo ""

# Stop MySQL
echo "1. Stopping MySQL..."
brew services stop mysql
sleep 2

# Start in safe mode
echo "2. Starting MySQL in safe mode..."
mysqld_safe --skip-grant-tables > /dev/null 2>&1 &
sleep 5

echo "3. Resetting password..."

# Connect and reset password - MySQL 8+ way
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Cleanroom@123';
FLUSH PRIVILEGES;
EOF

RESULT=$?

# Stop safe mode
echo "4. Stopping safe mode..."
killall mysqld mysqld_safe 2>/dev/null
sleep 2

# Start MySQL normally
echo "5. Starting MySQL normally..."
brew services start mysql
sleep 3

if [ $RESULT -eq 0 ]; then
    # Test connection
    echo "6. Testing connection..."
    if mysql -u root -p'Cleanroom@123' -e "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ MySQL root password has been set to: Cleanroom@123"
        echo ""
        echo "📝 Updating backend/.env file..."
        
        # Update .env file
        cd /Users/credd9/Downloads/cleanroom-app1/backend
        cat > .env << 'ENVFILE'
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Cleanroom@123
DB_NAME=cleanroom_db
JWT_SECRET=cleanroom_hvac_secret_key_2026_secure
JWT_EXPIRE=7d
NODE_ENV=development
ENVFILE
        
        echo "✅ .env file updated!"
        echo ""
        echo "🚀 Now initializing database..."
        npm run db:init
    else
        echo "⚠️  Could not verify connection"
    fi
else
    echo "❌ Password reset failed"
fi

echo ""
echo "=============================================="
