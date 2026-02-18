const db = require('../config/database');
const calculationService = require('../services/calculationService');

// Get all projects for a user
exports.getAllProjects = async (req, res) => {
  try {
    let query = `
      SELECT p.*, c.first_name, c.last_name, c.email,
        (SELECT COUNT(*) FROM PROJECT_ZONE WHERE project_id = p.id) as zone_count
      FROM PROJECT p
      JOIN CUSTOMER c ON p.customer_id = c.id
    `;
    
    const params = [];
    
    // If not admin, only show user's projects
    if (req.user.role !== 'admin') {
      query += ' WHERE p.customer_id = ?';
      params.push(req.user.customerId);
    }
    
    query += ' ORDER BY p.create_datetime DESC';
    
    const [projects] = await db.query(query, params);
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single project with zones and rooms
exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Get project
    const [projects] = await db.query(
      `SELECT p.*, c.first_name, c.last_name, c.email 
       FROM PROJECT p
       JOIN CUSTOMER c ON p.customer_id = c.id
       WHERE p.id = ?`,
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projects[0];

    // Check authorization
    if (req.user.role !== 'admin' && project.customer_id !== req.user.customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get zones
    const [zones] = await db.query(
      `SELECT pz.*, rs.standard, c.classification, c.acph_min, c.acph_max
       FROM PROJECT_ZONE pz
       JOIN ROOM_STANDARDS rs ON pz.standard_id = rs.id
       JOIN CLASSIFICATIONS c ON pz.classification_id = c.id
       WHERE pz.project_id = ?`,
      [projectId]
    );

    // Get rooms for each zone
    for (let zone of zones) {
      const [rooms] = await db.query(
        `SELECT zr.*, pzc.*
         FROM ZONE_ROOM zr
         LEFT JOIN PROJECT_ZONE_CALCULATIONS pzc ON zr.id = pzc.room_id
         WHERE zr.zone_id = ?`,
        [zone.id]
      );
      zone.rooms = rooms;
    }

    project.zones = zones;
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { projectName, projectLocation, peakMaxTemp, peakMinTemp, outdoorHumidity, zones } = req.body;

    // Validate input
    if (!projectName || !projectLocation) {
      await connection.rollback();
      return res.status(400).json({ message: 'Project name and location are required' });
    }

    const customerId = req.user.role === 'admin' && req.body.customerId 
      ? req.body.customerId 
      : req.user.customerId;

    // Create project
    const [projectResult] = await connection.query(
      `INSERT INTO PROJECT (customer_id, project_name, project_location, peak_max_temp, peak_min_temp, outdoor_humidity) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, projectName, projectLocation, peakMaxTemp || null, peakMinTemp || null, outdoorHumidity || null]
    );

    const projectId = projectResult.insertId;

    // Create zones if provided
    if (zones && Array.isArray(zones)) {
      for (const zone of zones) {
        const [zoneResult] = await connection.query(
          `INSERT INTO PROJECT_ZONE (project_id, zone_name, standard_id, classification_id, system_type)
           VALUES (?, ?, ?, ?, ?)`,
          [projectId, zone.zoneName, zone.standardId, zone.classificationId, zone.systemType || 'Chilled Water']
        );

        const zoneId = zoneResult.insertId;

        // Create rooms if provided
        if (zone.rooms && Array.isArray(zone.rooms)) {
          for (const room of zone.rooms) {
            const [roomResult] = await connection.query(
              `INSERT INTO ZONE_ROOM (zone_id, room_name, length_m, width_m, height_m, people_count, 
                equipment_load_kw, lighting_w_per_sqft, infiltration_per_hr, fresh_air_ratio, 
                exhaust_ratio, temp_required_c, rh_required_percent)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                zoneId, room.roomName, room.length, room.width, room.height,
                room.peopleCount || 0, room.equipmentLoad || 0, room.lighting || 1.75,
                room.infiltration || 2, room.freshAirRatio || 0.1, room.exhaustRatio || 0,
                room.tempRequired || 24, room.rhRequired || 50
              ]
            );

            // Calculate HVAC parameters
            const calculations = await calculationService.calculateRoomHVAC(room, zone);
            
            // Save calculations
            await connection.query(
              `INSERT INTO PROJECT_ZONE_CALCULATIONS (
                room_id, area_sqm, volume_cum, room_cfm, fresh_air_cfm, exhaust_cfm,
                water_vapor_kg_hr, dehumidification_cfm, resultant_cfm, terminal_supply_sqft,
                cooling_load_tr, room_ac_load_tr, cfm_ac_load_tr, ahu_cfm, ahu_size,
                static_pressure, blower_model, motor_hp, cooling_coil_rows, ahu_cooling_load_tr,
                filter_stages, chilled_water_gpm, chilled_water_lps, flow_velocity_ms, pipe_size_mm, acph
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                roomResult.insertId, calculations.area, calculations.volume, calculations.roomCfm,
                calculations.freshAirCfm, calculations.exhaustCfm, calculations.waterVaporKgHr,
                calculations.dehumidificationCfm, calculations.resultantCfm, calculations.terminalSupplySqft,
                calculations.coolingLoadTr, calculations.roomAcLoadTr, calculations.cfmAcLoadTr,
                calculations.ahuCfm, calculations.ahuSize, calculations.staticPressure,
                calculations.blowerModel, calculations.motorHp, calculations.coolingCoilRows,
                calculations.ahuCoolingLoadTr, calculations.filterStages, calculations.chilledWaterGpm,
                calculations.chilledWaterLps, calculations.flowVelocityMs, calculations.pipeSizeMm,
                calculations.acph
              ]
            );
          }
        }
      }
    }

    await connection.commit();

    res.status(201).json({ 
      message: 'Project created successfully',
      projectId: projectId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { projectName, projectLocation, peakMaxTemp, peakMinTemp, outdoorHumidity } = req.body;

    // Check if project exists and user has access
    const [projects] = await db.query('SELECT customer_id FROM PROJECT WHERE id = ?', [projectId]);
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user.role !== 'admin' && projects[0].customer_id !== req.user.customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update project
    await db.query(
      `UPDATE PROJECT SET project_name = ?, project_location = ?, peak_max_temp = ?, 
       peak_min_temp = ?, outdoor_humidity = ? WHERE id = ?`,
      [projectName, projectLocation, peakMaxTemp, peakMinTemp, outdoorHumidity, projectId]
    );

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if project exists and user has access
    const [projects] = await db.query('SELECT customer_id FROM PROJECT WHERE id = ?', [projectId]);
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user.role !== 'admin' && projects[0].customer_id !== req.user.customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete project (CASCADE will handle zones, rooms, and calculations)
    await db.query('DELETE FROM PROJECT WHERE id = ?', [projectId]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
