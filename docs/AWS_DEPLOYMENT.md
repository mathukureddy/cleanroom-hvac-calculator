# AWS Deployment Guide - Cleanroom HVAC Calculator

## Deployment Architecture

```
Internet
    ↓
AWS Route53 (Optional - DNS)
    ↓
Application Load Balancer (ALB) / EC2 Public IP
    ↓
EC2 Instance(s)
    ├── Nginx (Reverse Proxy)
    ├── React Frontend (Static Files)
    ├── Node.js Backend API
    └── MySQL Database (or RDS)
```

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured
- Domain name (optional, can use EC2 public IP)
- Basic knowledge of AWS services

## Deployment Options

### Option 1: Single EC2 Instance (Recommended for Starting)
- **Cost**: ~$10-30/month
- **Setup Time**: 30-45 minutes
- **Best For**: Development, small teams, POC

### Option 2: Multi-Service AWS (Production)
- **Services**: EC2 + RDS + S3 + CloudFront + ALB
- **Cost**: ~$50-150/month
- **Setup Time**: 2-3 hours
- **Best For**: Production, high availability

## Quick Start - Option 1: Single EC2 Instance

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Configure Instance:**
   - **Name**: cleanroom-hvac-app
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.medium (2 vCPU, 4 GB RAM)
   - **Key Pair**: Create new or select existing
   - **Network Settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere (0.0.0.0/0)
     - Allow HTTPS (port 443) from anywhere (0.0.0.0/0)
     - Allow Custom TCP (port 5001) from anywhere (for backend)
   - **Storage**: 20 GB gp3

3. **Launch Instance** and note the Public IPv4 address

### Step 2: Connect to EC2 Instance

```bash
# Download your key pair (e.g., cleanroom-key.pem)
chmod 400 cleanroom-key.pem

# Connect to instance
ssh -i cleanroom-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### Step 3: Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16.x
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install MySQL
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation
# Set root password: Cleanroom@123
# Answer Y to all prompts

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### Step 4: Configure MySQL

```bash
# Login to MySQL
sudo mysql -u root -p
# Enter password: Cleanroom@123
```

Run these MySQL commands:

```sql
-- Create database
CREATE DATABASE cleanroom_db;

-- Create application user
CREATE USER 'cleanroom_user'@'localhost' IDENTIFIED BY 'Cleanroom@123';

-- Grant privileges
GRANT ALL PRIVILEGES ON cleanroom_db.* TO 'cleanroom_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Step 5: Deploy Application Code

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/mathukureddy/cleanroom-hvac-calculator.git

# Navigate to project
cd cleanroom-hvac-calculator
```

### Step 6: Setup Backend

```bash
# Navigate to backend
cd ~/cleanroom-hvac-calculator/backend

# Install dependencies
npm install

# Create production .env file
cat > .env << 'EOF'
PORT=5001
DB_HOST=localhost
DB_USER=cleanroom_user
DB_PASSWORD=Cleanroom@123
DB_NAME=cleanroom_db
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
NODE_ENV=production
EOF

# Initialize database
npm run db:init

# Test backend
npm start
# Press Ctrl+C after verifying it starts successfully

# Start backend with PM2
pm2 start server.js --name cleanroom-backend
pm2 save
pm2 startup
# Follow the command it provides
```

### Step 7: Build and Deploy Frontend

```bash
# Navigate to frontend
cd ~/cleanroom-hvac-calculator/frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << 'EOF'
REACT_APP_API_URL=http://<YOUR-EC2-PUBLIC-IP>:5001/api
EOF

# Build for production
npm run build

# Copy build to nginx directory
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### Step 8: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cleanroom
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name <YOUR-EC2-PUBLIC-IP>;  # or your domain name

    root /var/www/html;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cleanroom /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### Step 9: Configure Firewall

```bash
# Allow Nginx
sudo ufw allow 'Nginx Full'

# Allow SSH
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### Step 10: Update Frontend API URL

```bash
# Update the .env.production with correct API URL
cd ~/cleanroom-hvac-calculator/frontend

# Edit to use same domain (since Nginx proxies /api)
cat > .env.production << 'EOF'
REACT_APP_API_URL=/api
EOF

# Rebuild
npm run build

# Copy to nginx
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
```

### Step 11: Verify Deployment

```bash
# Check backend status
pm2 status

# Check backend logs
pm2 logs cleanroom-backend

# Check Nginx status
sudo systemctl status nginx

# Check MySQL status
sudo systemctl status mysql

# Test API endpoint
curl http://localhost:5001/api/standards
```

### Step 12: Access Application

Open your browser and navigate to:
- **Application**: `http://<YOUR-EC2-PUBLIC-IP>`
- **Login**: Use admin credentials or register new user

## Adding SSL/HTTPS (Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

## Monitoring and Maintenance

### Check Application Status

```bash
# Backend status
pm2 status
pm2 logs cleanroom-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# System resources
htop
df -h
free -h
```

### Restart Services

```bash
# Restart backend
pm2 restart cleanroom-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Update Application

```bash
# Pull latest code
cd ~/cleanroom-hvac-calculator
git pull origin main

# Update backend
cd backend
npm install
pm2 restart cleanroom-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
```

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
mysqldump -u cleanroom_user -p cleanroom_db > ~/backups/cleanroom_db_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u cleanroom_user -p cleanroom_db < ~/backups/cleanroom_db_YYYYMMDD_HHMMSS.sql
```

## Security Best Practices

1. **Change default passwords**
2. **Enable AWS Security Groups** - Restrict SSH to your IP
3. **Use SSL/HTTPS** - Get free certificate from Let's Encrypt
4. **Regular updates**: `sudo apt update && sudo apt upgrade`
5. **Enable automatic security updates**
6. **Use environment variables** - Never commit secrets to Git
7. **Setup CloudWatch** - Monitor logs and metrics
8. **Regular backups** - Automate database backups
9. **Use IAM roles** - If accessing other AWS services
10. **Enable AWS CloudTrail** - Audit API calls

## Troubleshooting

### Backend Not Starting
```bash
pm2 logs cleanroom-backend
# Check for port conflicts, database connection errors
```

### Frontend Shows Blank Page
```bash
# Check browser console for API errors
# Verify REACT_APP_API_URL is correct
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Error
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u cleanroom_user -p -h localhost cleanroom_db
```

### Port Already in Use
```bash
# Find process using port 5001
sudo lsof -i :5001

# Kill process
kill -9 <PID>
```

## Cost Optimization

1. **Right-size instance**: Start with t2.micro for testing
2. **Use Reserved Instances**: Save up to 70% for long-term
3. **Enable Auto-Scaling**: Scale based on demand
4. **Use RDS Free Tier**: First year free
5. **CloudFront**: Cache static content
6. **Spot Instances**: For non-critical workloads

## Production Checklist

- [ ] EC2 instance launched and configured
- [ ] MySQL installed and secured
- [ ] Application code deployed
- [ ] Backend running with PM2
- [ ] Frontend built and served by Nginx
- [ ] Nginx configured as reverse proxy
- [ ] Firewall configured
- [ ] SSL certificate installed (if using domain)
- [ ] Database initialized with seed data
- [ ] Monitoring setup (PM2, CloudWatch)
- [ ] Backup strategy implemented
- [ ] Security groups configured
- [ ] Application tested and accessible
- [ ] Domain configured (optional)
- [ ] Documentation updated

## Next Steps

1. **Custom Domain**: Point your domain to EC2 IP
2. **CDN**: Use CloudFront for global delivery
3. **Load Balancer**: Add ALB for high availability
4. **RDS**: Migrate to managed database
5. **S3**: Store static assets on S3
6. **Auto Scaling**: Add EC2 Auto Scaling Group
7. **CI/CD**: Setup GitHub Actions for automated deployment

## Support

For issues or questions:
- Check logs: `pm2 logs`, Nginx logs, MySQL logs
- Review AWS documentation
- GitHub Issues: https://github.com/mathukureddy/cleanroom-hvac-calculator/issues
