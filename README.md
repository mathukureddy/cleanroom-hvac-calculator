# Cleanroom HVAC Calculator Application

A comprehensive web application for calculating cleanroom HVAC requirements based on various international standards including ISO 14644, FDA 209E, GMP, and more.

## Features

- User authentication and role-based access control
- Admin dashboard for customer management
- Multi-page project wizard for cleanroom calculations
- Support for 12+ international cleanroom standards
- Automatic calculation of HVAC parameters
- Zone and room-level configuration
- Project management and history

## Technology Stack

### Frontend
- React.js 18
- React Router for navigation
- Axios for API calls
- CSS3 for styling

### Backend
- Node.js with Express.js
- MySQL database
- JWT authentication
- Bcrypt for password hashing

## Project Structure

```
cleanroom-app1/
├── backend/              # Node.js backend
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js        # Entry point
├── frontend/            # React frontend
│   ├── public/         # Static files
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── services/    # API services
│       ├── utils/       # Utility functions
│       └── App.js       # Main app component
└── docs/               # Documentation
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=cleanroom_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

Initialize the database:

```bash
npm run db:init
```

Start the backend server:

```bash
npm start
# or for development with auto-reload
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The application will open at `http://localhost:3000`

## Default Credentials

**Admin User:**
- Username: admin
- Password: admin123
- Role: admin

## Database Schema

### Tables

1. **CUSTOMER** - Customer profile information
2. **LOGIN** - Authentication credentials
3. **ROOM_STANDARDS** - Cleanroom standards reference
4. **CLASSIFICATIONS** - Classification data with ACPH values
5. **PROJECT** - Project summary information
6. **PROJECT_ZONE** - Zone-level data for each project
7. **ZONE_ROOM** - Room-level dimensions and parameters
8. **PROJECT_ZONE_CALCULATIONS** - Calculated HVAC values

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Customer Management (Admin only)
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Standards & Classifications
- `GET /api/standards` - Get all standards
- `GET /api/classifications/:standard` - Get classifications for a standard

## Usage

1. **Login/Register**: Access the application with your credentials
2. **Create Project**: Enter project name and location
3. **Add Zones**: Select standards and classifications for each zone
4. **Configure Rooms**: Enter room dimensions and parameters
5. **View Results**: Review calculated HVAC requirements
6. **Export/Save**: Save calculations for future reference

## Calculations

The application performs complex HVAC calculations including:
- Air Changes Per Hour (ACPH)
- Cooling load (TR)
- Fresh air and exhaust requirements
- AHU sizing
- Duct and pipe sizing
- Filter specifications

## Contributing

This is a proprietary application. For support or questions, contact the development team.

## License

Copyright © 2026. All rights reserved.
