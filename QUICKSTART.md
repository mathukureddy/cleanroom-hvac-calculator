# Quick Start Guide - Cleanroom HVAC Calculator

## 🚀 Quick Installation

### Prerequisites
- Node.js (v16 or higher) - [Download](https://nodejs.org/)
- MySQL (v8 or higher) - [Download](https://dev.mysql.com/downloads/)
- Git (optional) - [Download](https://git-scm.com/)

---

## Step 1: Database Setup

### Option A: Using Command Line

1. **Start MySQL Server**
   ```bash
   # macOS
   mysql.server start
   
   # Linux
   sudo service mysql start
   
   # Windows
   # Start MySQL from Services or XAMPP/WAMP
   ```

2. **Login to MySQL**
   ```bash
   mysql -u root -p
   # Enter your MySQL root password
   ```

3. **The database will be created automatically** by the init script in the next step!

### Option B: Using MySQL Workbench
- Open MySQL Workbench
- Connect to your local MySQL server
- The database will be created automatically by the init script

---

## Step 2: Backend Setup

```bash
# Navigate to backend directory
cd /Users/credd9/Downloads/cleanroom-app1/backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# Update the following values if needed:
# DB_PASSWORD=your_mysql_password

# Initialize database (creates tables and default data)
npm run db:init

# Start the backend server
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║     🏭 Cleanroom HVAC Calculator API Server               ║
║     Server is running on port 5000                        ║
╚════════════════════════════════════════════════════════════╝
```

---

## Step 3: Frontend Setup

**Open a NEW terminal window** and run:

```bash
# Navigate to frontend directory
cd /Users/credd9/Downloads/cleanroom-app1/frontend

# Install dependencies
npm install

# Start the frontend application
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view cleanroom-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Your browser should automatically open to `http://localhost:3000`

---

## Step 4: Login

### Default Admin Credentials
```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT:** Change the admin password after first login!

---

## 📋 Quick Usage Guide

### For Customers:

1. **Register an Account**
   - Click "Register here" on login page
   - Fill in your details
   - Login with your credentials

2. **Create Your First Project**
   - Click "New Project" on dashboard
   - **Step 1:** Enter project name and location
   - **Step 2:** Add zones with standards and classifications
   - **Step 3:** Add rooms with dimensions and parameters
   - Submit to generate calculations!

3. **View Results**
   - All HVAC calculations are automatically computed
   - View detailed results including CFM, TR, AHU sizing, etc.

### For Administrators:

1. **Manage Customers**
   - Navigate to "Customers" menu
   - Add new customer accounts
   - View all customer projects

2. **View All Projects**
   - Access all customer projects
   - Monitor system usage

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** "Error: connect ECONNREFUSED"
**Solution:** 
- Ensure MySQL is running
- Check `.env` file has correct database credentials
- Run `npm run db:init` to create the database

**Problem:** "Port 5000 already in use"
**Solution:**
- Change PORT in `.env` file to 5001 or another port
- Restart backend server

### Frontend Issues

**Problem:** "Port 3000 already in use"
**Solution:**
- Terminal will ask if you want to use another port, type 'y'
- Or kill the process using port 3000

**Problem:** "Network Error" when making API calls
**Solution:**
- Ensure backend is running on port 5000
- Check that proxy in `frontend/package.json` points to correct backend URL

### Database Issues

**Problem:** "Access denied for user 'root'"
**Solution:**
- Update `DB_PASSWORD` in `backend/.env` with your MySQL password
- Ensure MySQL user has proper permissions

**Problem:** "Unknown database 'cleanroom_db'"
**Solution:**
- Run `npm run db:init` from backend directory
- This will create the database and all tables

---

## 📁 Project Structure

```
cleanroom-app1/
├── backend/                    # Node.js API Server
│   ├── config/
│   │   ├── database.js        # Database connection
│   │   └── initDb.js          # Database initialization
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Auth middleware
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   └── calculationService.js  # HVAC calculations
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Entry point
│
├── frontend/                  # React Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── App.js
│   │   ├── App.css            # Styling
│   │   └── index.js
│   └── package.json
│
├── docs/
│   └── DESIGN.md              # System design documentation
│
└── README.md                  # Main documentation
```

---

## 🎯 Supported Standards

- **ISO 14644-4** (ISO 1-9)
- **FDA 209E** (Class 1, 10, 100, 1K, 10K, 100K)
- **GMP** (Grades A, B, C, D)
- **EU GMP** (Grades A, B, C, D)
- **JIS B 9920** (Classes 1-9)
- **TGA** (0.035 - 3500)
- **BS 5295** (C, D, E or F, G or H, J, K)
- **GERMANY VD** (0-6)
- **AFNOR X44101**
- **NC-Non Classified** (Various filtration levels)
- **ISO 14698** (BSL 1-4)
- **SCHEDULE M** (Grades A, B, C, D)

---

## 📊 What Gets Calculated?

For each room, the system automatically calculates:

✅ Area and Volume
✅ Room CFM and ACPH
✅ Fresh Air and Exhaust requirements
✅ Cooling Load (in TR)
✅ AHU CFM and Size
✅ Static Pressure
✅ Motor Horsepower
✅ Number of Cooling Coil Rows
✅ Filter Stages
✅ Chilled Water Flow (GPM, L/s)
✅ Pipe Sizing (mm)
✅ Terminal Supply Module area

---

## 🔐 Security Notes

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Role-based access control (Admin/Customer)
- SQL injection protection via parameterized queries

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review `docs/DESIGN.md` for detailed documentation
3. Check console logs in browser (F12) and terminal for errors

---

## 🎉 You're All Set!

Your Cleanroom HVAC Calculator is now ready to use!

**Next Steps:**
1. Login with admin credentials
2. Create a test project
3. Explore the calculations
4. Add customer accounts (if admin)
5. Start calculating your cleanroom projects!

---

## 📝 Development Commands

### Backend
```bash
npm start       # Start server
npm run dev     # Start with nodemon (auto-reload)
npm run db:init # Initialize/reset database
```

### Frontend
```bash
npm start       # Start development server
npm run build   # Build for production
```

---

## 🌟 Features Highlights

- 🎨 **Modern UI** - Clean, responsive design
- 🔄 **Real-time Calculations** - Instant HVAC calculations
- 📱 **Responsive** - Works on desktop and tablet
- 🔒 **Secure** - JWT authentication & password hashing
- 📊 **Comprehensive** - 12+ international standards
- 🚀 **Fast** - Optimized performance
- 📈 **Scalable** - Built for growth

---

**Happy Calculating! 🏭**
