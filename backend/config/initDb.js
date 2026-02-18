const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

async function initializeDatabase() {
  let connection;
  
  try {
    // Connect without database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'cleanroom_db'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'cleanroom_db'}' created or already exists`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'cleanroom_db'}`);

    // Create CUSTOMER table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS CUSTOMER (
        id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(100) UNIQUE,
        create_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ CUSTOMER table created');

    // Create LOGIN table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS LOGIN (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'customer') DEFAULT 'customer',
        create_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ LOGIN table created');

    // Create ROOM_STANDARDS table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ROOM_STANDARDS (
        id INT PRIMARY KEY AUTO_INCREMENT,
        standard VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    console.log('✅ ROOM_STANDARDS table created');

    // Create CLASSIFICATIONS table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS CLASSIFICATIONS (
        id INT PRIMARY KEY AUTO_INCREMENT,
        standard_id INT NOT NULL,
        classification VARCHAR(100) NOT NULL,
        acph_min INT NOT NULL,
        acph_max INT NOT NULL,
        terminal_filter_coverage VARCHAR(50),
        FOREIGN KEY (standard_id) REFERENCES ROOM_STANDARDS(id) ON DELETE CASCADE,
        UNIQUE KEY unique_standard_class (standard_id, classification)
      )
    `);
    console.log('✅ CLASSIFICATIONS table created');

    // Create PROJECT table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PROJECT (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        project_name VARCHAR(200) NOT NULL,
        project_location VARCHAR(200) NOT NULL,
        peak_max_temp DECIMAL(5,2),
        peak_min_temp DECIMAL(5,2),
        outdoor_humidity DECIMAL(5,2),
        create_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES CUSTOMER(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ PROJECT table created');

    // Create PROJECT_ZONE table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PROJECT_ZONE (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        zone_name VARCHAR(100) NOT NULL,
        standard_id INT NOT NULL,
        classification_id INT NOT NULL,
        system_type ENUM('Chilled Water', 'DX', 'Ventilation') DEFAULT 'Chilled Water',
        create_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES PROJECT(id) ON DELETE CASCADE,
        FOREIGN KEY (standard_id) REFERENCES ROOM_STANDARDS(id),
        FOREIGN KEY (classification_id) REFERENCES CLASSIFICATIONS(id)
      )
    `);
    console.log('✅ PROJECT_ZONE table created');

    // Create ZONE_ROOM table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ZONE_ROOM (
        id INT PRIMARY KEY AUTO_INCREMENT,
        zone_id INT NOT NULL,
        room_name VARCHAR(100) NOT NULL,
        length_m DECIMAL(10,2) NOT NULL,
        width_m DECIMAL(10,2) NOT NULL,
        height_m DECIMAL(10,2) NOT NULL,
        people_count INT DEFAULT 0,
        equipment_load_kw DECIMAL(10,2) DEFAULT 0,
        lighting_w_per_sqft DECIMAL(10,2) DEFAULT 1.75,
        infiltration_per_hr DECIMAL(10,2) DEFAULT 2,
        fresh_air_ratio DECIMAL(5,3) DEFAULT 0.1,
        exhaust_ratio DECIMAL(5,3) DEFAULT 0,
        temp_required_c DECIMAL(5,2) DEFAULT 24,
        rh_required_percent DECIMAL(5,2) DEFAULT 50,
        create_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES PROJECT_ZONE(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ ZONE_ROOM table created');

    // Create PROJECT_ZONE_CALCULATIONS table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PROJECT_ZONE_CALCULATIONS (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        area_sqm DECIMAL(10,2),
        volume_cum DECIMAL(10,2),
        room_cfm DECIMAL(10,2),
        fresh_air_cfm DECIMAL(10,2),
        exhaust_cfm DECIMAL(10,2),
        water_vapor_kg_hr DECIMAL(10,2),
        dehumidification_cfm DECIMAL(10,2),
        resultant_cfm DECIMAL(10,2),
        terminal_supply_sqft DECIMAL(10,2),
        cooling_load_tr DECIMAL(10,2),
        room_ac_load_tr DECIMAL(10,2),
        cfm_ac_load_tr DECIMAL(10,2),
        ahu_cfm DECIMAL(10,2),
        ahu_size VARCHAR(50),
        static_pressure INT,
        blower_model VARCHAR(50),
        motor_hp DECIMAL(5,2),
        cooling_coil_rows INT,
        ahu_cooling_load_tr DECIMAL(10,2),
        filter_stages INT,
        chilled_water_gpm DECIMAL(10,2),
        chilled_water_lps DECIMAL(10,2),
        flow_velocity_ms DECIMAL(10,2),
        pipe_size_mm VARCHAR(20),
        acph INT,
        create_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES ZONE_ROOM(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ PROJECT_ZONE_CALCULATIONS table created');

    // Insert standards
    const standards = [
      'ISO 14644-4', 'FDA 209E', 'GMP', 'JIS B 9920', 'EU GMP', 
      'TGA', 'BS 5295', 'GERMANY VD', 'AFNOR X44101', 
      'NC-Non Classified', 'ISO 14698', 'SCHEDULE M'
    ];

    for (const standard of standards) {
      await connection.query(
        'INSERT IGNORE INTO ROOM_STANDARDS (standard) VALUES (?)',
        [standard]
      );
    }
    console.log('✅ Standards inserted');

    // Insert classifications with ACPH data
    const classificationsData = [
      ['ISO 14644-4', 'ISO 9', 5, 15],
      ['ISO 14644-4', 'ISO 8', 20, 60],
      ['ISO 14644-4', 'ISO 7', 60, 150],
      ['ISO 14644-4', 'ISO 6', 150, 240],
      ['ISO 14644-4', 'ISO 5', 240, 500],
      ['ISO 14644-4', 'ISO 4', 300, 600],
      ['ISO 14644-4', 'ISO 3', 400, 750],
      ['ISO 14644-4', 'ISO 2', 500, 750],
      ['ISO 14644-4', 'ISO 1', 500, 750],
      ['FDA 209E', 'Class100K', 12, 25],
      ['FDA 209E', 'Class10K', 30, 60],
      ['FDA 209E', 'Class1K', 80, 130],
      ['FDA 209E', 'Class 100', 150, 300],
      ['FDA 209E', 'Class 10', 180, 400],
      ['FDA 209E', 'Class 1', 240, 500],
      ['GMP', 'Grade D (ISO 8 at Rest & Not Defined)', 20, 40],
      ['GMP', 'Grade C (ISO 7 at Rest & ISO 8 in Oper.)', 60, 120],
      ['GMP', 'Grade B (ISO 5 at Rest & ISO 7 in Oper.)', 120, 180],
      ['GMP', 'Grade A (ISO 5 at Rest & ISO 5 in Oper.)', 180, 240],
      ['JIS B 9920', 'JIS Class 9', 10, 20],
      ['JIS B 9920', 'JIS Class 8', 20, 60],
      ['JIS B 9920', 'JIS Class 7', 60, 120],
      ['JIS B 9920', 'JIS Class 6', 120, 180],
      ['JIS B 9920', 'JIS Class 5', 180, 240],
      ['JIS B 9920', 'JIS Class 4', 240, 350],
      ['JIS B 9920', 'JIS Class 3', 350, 500],
      ['JIS B 9920', 'JIS Class 2', 400, 600],
      ['JIS B 9920', 'JIS Class 1', 400, 600],
      ['EU GMP', 'Grade D (ISO 7 at Rest & ISO 8 in Oper.)', 40, 80],
      ['EU GMP', 'Grade C (ISO 7 at Rest & ISO 7 in Oper.)', 80, 120],
      ['EU GMP', 'Grade B (ISO 5 at Rest & ISO 7 in Oper.)', 120, 180],
      ['EU GMP', 'Grade A (ISO 5 at Rest & ISO 5 in Oper.)', 180, 240],
      ['TGA', '3500', 15, 40],
      ['TGA', '350', 40, 80],
      ['TGA', '35', 80, 130],
      ['TGA', '3.5', 130, 300],
      ['TGA', '0.35', 180, 400],
      ['TGA', '0.035', 240, 500],
      ['BS 5295', 'K', 12, 25],
      ['BS 5295', 'J', 30, 80],
      ['BS 5295', 'G or H', 120, 180],
      ['BS 5295', 'E or F', 240, 350],
      ['BS 5295', 'D', 350, 600],
      ['BS 5295', 'C', 400, 600],
      ['GERMANY VD', '6', 20, 60],
      ['GERMANY VD', '5', 60, 120],
      ['GERMANY VD', '4', 120, 180],
      ['GERMANY VD', '3', 180, 240],
      ['GERMANY VD', '2', 240, 360],
      ['GERMANY VD', '1', 360, 550],
      ['GERMANY VD', '0', 400, 600],
      ['AFNOR X44101', '4000000', 20, 50],
      ['AFNOR X44101', '400000', 60, 120],
      ['AFNOR X44101', '4000', 120, 240],
      ['NC-Non Classified', '20µ', 5, 15],
      ['NC-Non Classified', '15µ', 5, 20],
      ['NC-Non Classified', '10µ', 10, 25],
      ['NC-Non Classified', '5µ', 15, 25],
      ['NC-Non Classified', '1µ', 15, 25],
      ['NC-Non Classified', 'No-Filtration', 5, 10],
      ['NC-Non Classified', 'Positive Pressure', 5, 10],
      ['NC-Non Classified', 'Exhaust', 0, 0],
      ['ISO 14698', 'BSL - 1', 6, 12],
      ['ISO 14698', 'BSL - 2', 10, 15],
      ['ISO 14698', 'BSL - 3', 15, 20],
      ['ISO 14698', 'BSL - 4', 20, 30],
      ['SCHEDULE M', 'GRADE CLASS A', 80, 100],
      ['SCHEDULE M', 'GRADE CLASS B', 60, 80],
      ['SCHEDULE M', 'GRADE CLASS C', 40, 60],
      ['SCHEDULE M', 'GRADE CLASS D', 20, 40]
    ];

    for (const [standard, classification, acphMin, acphMax] of classificationsData) {
      const [standardRows] = await connection.query(
        'SELECT id FROM ROOM_STANDARDS WHERE standard = ?',
        [standard]
      );
      
      if (standardRows.length > 0) {
        await connection.query(
          'INSERT IGNORE INTO CLASSIFICATIONS (standard_id, classification, acph_min, acph_max) VALUES (?, ?, ?, ?)',
          [standardRows[0].id, classification, acphMin, acphMax]
        );
      }
    }
    console.log('✅ Classifications inserted');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin customer
    const [adminCustomer] = await connection.query(
      'INSERT IGNORE INTO CUSTOMER (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      ['System', 'Administrator', 'admin@cleanroom.com', '0000000000', 'System']
    );

    if (adminCustomer.insertId || adminCustomer.affectedRows > 0) {
      // Get customer ID
      const [customers] = await connection.query(
        'SELECT id FROM CUSTOMER WHERE email = ?',
        ['admin@cleanroom.com']
      );

      if (customers.length > 0) {
        await connection.query(
          'INSERT IGNORE INTO LOGIN (customer_id, username, password, role) VALUES (?, ?, ?, ?)',
          [customers[0].id, 'admin', hashedPassword, 'admin']
        );
        console.log('✅ Admin user created (username: admin, password: admin123)');
      }
    }

    console.log('\n✅✅✅ Database initialization completed successfully! ✅✅✅\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();
