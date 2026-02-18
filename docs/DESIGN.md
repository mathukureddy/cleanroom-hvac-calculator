# Cleanroom HVAC Calculator - Design Documentation

## System Architecture

```mermaid
graph TB
    subgraph "Frontend - React.js"
        UI[User Interface]
        Router[React Router]
        Auth[Auth Components]
        Project[Project Components]
        Customer[Customer Components]
    end
    
    subgraph "Backend - Node.js/Express"
        API[REST API Server]
        AuthCtrl[Auth Controller]
        ProjCtrl[Project Controller]
        CustCtrl[Customer Controller]
        CalcServ[Calculation Service]
    end
    
    subgraph "Database - MySQL"
        DB[(MySQL Database)]
        Tables[Tables: CUSTOMER, LOGIN, PROJECT,<br/>PROJECT_ZONE, ZONE_ROOM,<br/>ROOM_STANDARDS, CLASSIFICATIONS,<br/>PROJECT_ZONE_CALCULATIONS]
    end
    
    UI --> Router
    Router --> Auth
    Router --> Project
    Router --> Customer
    
    Auth --> API
    Project --> API
    Customer --> API
    
    API --> AuthCtrl
    API --> ProjCtrl
    API --> CustCtrl
    
    ProjCtrl --> CalcServ
    CalcServ --> ProjCtrl
    
    AuthCtrl --> DB
    ProjCtrl --> DB
    CustCtrl --> DB
    DB --> Tables
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>API: POST /api/auth/login
    API->>Database: Query user by username
    Database-->>API: User data with hashed password
    API->>API: Verify password with bcrypt
    alt Password Valid
        API->>API: Generate JWT token
        API-->>Frontend: Return token + user data
        Frontend->>Frontend: Store token in localStorage
        Frontend-->>User: Redirect to Dashboard
    else Password Invalid
        API-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show error message
    end
```

## User Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Fill registration form
    Frontend->>Frontend: Validate form data
    Frontend->>API: POST /api/auth/register
    API->>Database: Check if username exists
    API->>Database: Check if email exists
    alt User Already Exists
        API-->>Frontend: 400 Bad Request
        Frontend-->>User: Show error
    else New User
        API->>API: Hash password with bcrypt
        API->>Database: INSERT INTO CUSTOMER
        Database-->>API: Customer ID
        API->>Database: INSERT INTO LOGIN
        API-->>Frontend: 201 Created
        Frontend-->>User: Success, redirect to login
    end
```

## Project Creation Flow

```mermaid
sequenceDiagram
    participant Customer
    participant Frontend
    participant API
    participant CalcService
    participant Database
    
    Customer->>Frontend: Step 1: Enter project details
    Frontend-->>Customer: Show zone form
    Customer->>Frontend: Step 2: Add zone with classification
    Frontend-->>Customer: Show room form
    Customer->>Frontend: Step 3: Add multiple rooms
    Customer->>Frontend: Add more zones (repeat 2-3)
    Customer->>Frontend: Submit project
    
    Frontend->>API: POST /api/projects (with all data)
    API->>Database: BEGIN TRANSACTION
    API->>Database: INSERT INTO PROJECT
    Database-->>API: Project ID
    
    loop For each zone
        API->>Database: INSERT INTO PROJECT_ZONE
        Database-->>API: Zone ID
        
        loop For each room in zone
            API->>Database: INSERT INTO ZONE_ROOM
            Database-->>API: Room ID
            
            API->>CalcService: calculateRoomHVAC(room, zone)
            CalcService->>CalcService: Calculate ACPH, CFM, cooling load
            CalcService->>CalcService: Calculate AHU parameters
            CalcService->>CalcService: Calculate piping specs
            CalcService-->>API: Calculated values
            
            API->>Database: INSERT INTO PROJECT_ZONE_CALCULATIONS
        end
    end
    
    API->>Database: COMMIT TRANSACTION
    API-->>Frontend: 201 Created with Project ID
    Frontend-->>Customer: Success, show project details
```

## HVAC Calculation Process

```mermaid
flowchart TD
    Start[Room Input Data] --> Area[Calculate Area<br/>Area = Length × Width]
    Area --> Volume[Calculate Volume<br/>Volume = Area × Height]
    Volume --> RoomCFM[Calculate Room CFM<br/>CFM = Volume × ACPH / 60]
    RoomCFM --> FreshAir[Calculate Fresh Air<br/>FA = CFM × FA Ratio]
    FreshAir --> Exhaust[Calculate Exhaust<br/>EA = CFM × EA Ratio]
    Exhaust --> Cooling[Calculate Cooling Load<br/>People + Equipment +<br/>Lighting + Infiltration]
    Cooling --> Dehumid[Calculate Dehumidification]
    Dehumid --> Resultant[Calculate Resultant CFM<br/>MAX(CFM + FA, Dehum CFM)]
    Resultant --> Terminal[Calculate Terminal Supply<br/>Based on Classification]
    Terminal --> AHU[Determine AHU Size<br/>Based on CFM]
    AHU --> Motor[Calculate Motor HP<br/>CFM × Pressure / Efficiency]
    Motor --> Coil[Determine Coil Rows<br/>Based on Classification]
    Coil --> Filters[Determine Filter Stages<br/>Based on Classification]
    Filters --> Piping[Calculate Piping<br/>GPM, L/s, Pipe Size]
    Piping --> Output[Save Calculations<br/>to Database]
```

## Customer Management Flow (Admin Only)

```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant API
    participant Database
    
    Admin->>Frontend: Navigate to Customers
    Frontend->>API: GET /api/customers
    API->>API: Check admin role in JWT
    API->>Database: SELECT all customers
    Database-->>API: Customer list
    API-->>Frontend: Return customers
    Frontend-->>Admin: Display customer table
    
    Admin->>Frontend: Click "Add Customer"
    Admin->>Frontend: Fill customer form
    Frontend->>API: POST /api/customers
    API->>Database: Check email/username uniqueness
    API->>API: Hash password
    API->>Database: BEGIN TRANSACTION
    API->>Database: INSERT INTO CUSTOMER
    Database-->>API: Customer ID
    API->>Database: INSERT INTO LOGIN with customer_id
    API->>Database: COMMIT
    API-->>Frontend: 201 Created
    Frontend-->>Admin: Success message
    Frontend->>API: GET /api/customers (refresh)
```

## View Project Details Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Click project
    Frontend->>API: GET /api/projects/:id
    API->>Database: SELECT project with customer
    API->>Database: SELECT zones for project
    loop For each zone
        API->>Database: SELECT rooms for zone
        API->>Database: SELECT calculations for each room
    end
    Database-->>API: Complete project data
    API->>API: Check user authorization
    API-->>Frontend: Return project with zones & rooms
    Frontend->>Frontend: Format and display data
    Frontend-->>User: Show project details with calculations
```

## Database Schema

```mermaid
erDiagram
    CUSTOMER ||--o{ LOGIN : "has"
    CUSTOMER ||--o{ PROJECT : "owns"
    PROJECT ||--o{ PROJECT_ZONE : "contains"
    PROJECT_ZONE }o--|| ROOM_STANDARDS : "uses"
    PROJECT_ZONE }o--|| CLASSIFICATIONS : "classified_as"
    PROJECT_ZONE ||--o{ ZONE_ROOM : "contains"
    ZONE_ROOM ||--o| PROJECT_ZONE_CALCULATIONS : "has"
    ROOM_STANDARDS ||--o{ CLASSIFICATIONS : "has"
    
    CUSTOMER {
        int id PK
        string first_name
        string last_name
        string address
        string phone
        string email
        timestamp create_datetime
        timestamp updated_datetime
    }
    
    LOGIN {
        int id PK
        int customer_id FK
        string username
        string password
        enum role
        timestamp create_datetime
    }
    
    ROOM_STANDARDS {
        int id PK
        string standard
    }
    
    CLASSIFICATIONS {
        int id PK
        int standard_id FK
        string classification
        int acph_min
        int acph_max
        string terminal_filter_coverage
    }
    
    PROJECT {
        int id PK
        int customer_id FK
        string project_name
        string project_location
        decimal peak_max_temp
        decimal peak_min_temp
        decimal outdoor_humidity
        timestamp create_datetime
        timestamp updated_datetime
    }
    
    PROJECT_ZONE {
        int id PK
        int project_id FK
        string zone_name
        int standard_id FK
        int classification_id FK
        enum system_type
        timestamp create_datetime
    }
    
    ZONE_ROOM {
        int id PK
        int zone_id FK
        string room_name
        decimal length_m
        decimal width_m
        decimal height_m
        int people_count
        decimal equipment_load_kw
        decimal lighting_w_per_sqft
        decimal infiltration_per_hr
        decimal fresh_air_ratio
        decimal exhaust_ratio
        decimal temp_required_c
        decimal rh_required_percent
        timestamp create_datetime
    }
    
    PROJECT_ZONE_CALCULATIONS {
        int id PK
        int room_id FK
        decimal area_sqm
        decimal volume_cum
        decimal room_cfm
        decimal fresh_air_cfm
        decimal exhaust_cfm
        decimal cooling_load_tr
        decimal ahu_cfm
        string ahu_size
        int static_pressure
        string blower_model
        decimal motor_hp
        int cooling_coil_rows
        int filter_stages
        decimal chilled_water_gpm
        string pipe_size_mm
        int acph
        timestamp create_datetime
    }
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        React[React.js 18]
        ReactRouter[React Router 6]
        Axios[Axios]
        CSS[CSS3]
    end
    
    subgraph "Backend"
        Node[Node.js]
        Express[Express.js]
        JWT[JWT Auth]
        Bcrypt[Bcrypt]
    end
    
    subgraph "Database"
        MySQL[MySQL 8]
    end
    
    React --> ReactRouter
    React --> Axios
    React --> CSS
    
    Node --> Express
    Express --> JWT
    Express --> Bcrypt
    Express --> MySQL
```

## Key Features

### 1. User Authentication
- JWT-based authentication
- Role-based access control (Admin/Customer)
- Secure password hashing with bcrypt

### 2. Customer Management (Admin)
- Create, read, update, delete customers
- Assign login credentials
- View all customer projects

### 3. Project Management
- Multi-step wizard for project creation
- Support for multiple zones per project
- Multiple rooms per zone
- Environmental parameter configuration

### 4. Standards Support
- ISO 14644-4 (ISO 1-9)
- FDA 209E (Class 1-100K)
- GMP (Grades A-D)
- EU GMP
- JIS B 9920
- TGA, BS 5295, GERMANY VD
- AFNOR X44101
- ISO 14698 (BSL 1-4)
- SCHEDULE M
- NC-Non Classified

### 5. Automated Calculations
- Air Changes Per Hour (ACPH)
- Cubic Feet per Minute (CFM)
- Cooling load in TR
- Fresh air and exhaust requirements
- AHU sizing and specifications
- Motor horsepower
- Cooling coil rows
- Filter stages
- Chilled water flow rates
- Pipe sizing

### 6. Calculation Formulas

#### Basic Calculations
- **Area (m²)** = Length × Width
- **Volume (m³)** = Area × Height
- **Room CFM** = Volume (cuft) × ACPH / 60
- **Fresh Air CFM** = Room CFM × Fresh Air Ratio
- **Exhaust CFM** = Room CFM × Exhaust Ratio

#### Cooling Load
- **People Load** = 70W per person
- **Equipment Load** = Equipment kW × 1000
- **Lighting Load** = Lighting W/sqft × Area sqft
- **Infiltration Load** = Volume × Infiltration × 1.08
- **Total Cooling (TR)** = Total W / 3516.85

#### AHU Sizing
- Based on CFM ranges (200-1450 and beyond)
- Static pressure: 150 (typical)
- **Motor HP** = (CFM × Pressure) / (6356 × η × Safety Factors)

#### Piping
- **GPM** = Cooling Load TR × 24 / 6
- **L/s** = GPM × 0.06309
- **Pipe Size (mm)** = √((4 × GPM × 0.00006309) / (π × Velocity))

## Security Considerations

1. **Password Security**: Bcrypt hashing with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Access**: Admin vs Customer permissions
4. **Input Validation**: Server-side validation
5. **SQL Injection Prevention**: Parameterized queries
6. **CORS Configuration**: Controlled cross-origin access

## Deployment

### Prerequisites
- Node.js v16+
- MySQL v8+
- npm or yarn

### Environment Variables
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=cleanroom_db
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Installation Steps

1. **Initialize Database**
```bash
cd backend
npm install
npm run db:init
```

2. **Start Backend**
```bash
npm start
```

3. **Start Frontend**
```bash
cd frontend
npm install
npm start
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Default Admin: username: `admin`, password: `admin123`

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Customers (Admin)
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Standards
- `GET /api/standards` - Get all standards
- `GET /api/standards/classifications` - Get all classifications
- `GET /api/standards/:id/classifications` - Get classifications for standard

### Projects
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Future Enhancements

1. Export calculations to PDF/Excel
2. Project templates
3. Historical comparison
4. Cost estimation
5. Equipment vendor integration
6. Mobile app
7. Real-time collaboration
8. Advanced reporting and analytics
9. Multi-language support
10. Dark mode
