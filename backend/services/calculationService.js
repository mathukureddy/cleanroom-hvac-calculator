// Cleanroom HVAC Calculation Service
// Based on Excel formulas from Input BOD and Output BOD sheets

class CalculationService {
  
  /**
   * Main calculation function for a room
   */
  async calculateRoomHVAC(roomData, zoneData) {
    const {
      length,
      width,
      height,
      peopleCount = 0,
      equipmentLoad = 0,
      lighting = 1.75,
      infiltration = 2,
      freshAirRatio = 0.1,
      exhaustRatio = 0,
      tempRequired = 24,
      rhRequired = 50
    } = roomData;

    const {
      acphMin = 150,
      acphMax = 240,
      classification = 'ISO 6',
      systemType = 'Chilled Water'
    } = zoneData;

    // Use average ACPH
    const acph = Math.round((acphMin + acphMax) / 2);

    // Area calculation: length * width (in m²)
    const areaSqm = length * width;
    
    // Area in square feet
    const areaSqft = areaSqm * 10.76;

    // Volume calculation: area * height (in m³)
    const volumeCum = areaSqm * height;

    // Volume in cubic feet
    const volumeCuft = volumeCum * 35.3147;

    // Room CFM = Volume(cuft) * ACPH / 60
    const roomCfm = Math.ceil((volumeCuft * acph) / 60);

    // Fresh Air CFM = Room CFM * Fresh Air Ratio
    const freshAirCfm = Math.ceil(roomCfm * freshAirRatio);

    // Exhaust CFM = Room CFM * Exhaust Ratio
    const exhaustCfm = Math.ceil(roomCfm * exhaustRatio);

    // Water vapor removal (if HVAC system)
    const waterVaporKgHr = systemType !== 'Ventilation' 
      ? ((freshAirCfm * 0.075 * 60) / 2.20462) * 0.015 / 7000 
      : 0;

    // Dehumidification CFM
    const dehumidificationCfm = systemType !== 'Ventilation'
      ? Math.ceil(waterVaporKgHr / (0.68 * 0.015))
      : 0;

    // Resultant CFM = MAX(Room CFM + Fresh Air CFM, Dehumidification CFM)
    const resultantCfm = Math.ceil(Math.max(roomCfm + freshAirCfm, dehumidificationCfm) / 25) * 25;

    // Terminal Supply Module calculation (based on classification)
    let terminalSupplyRatio = 250; // default
    if (classification.includes('ISO 6') || classification.includes('GRADE B') || classification.includes('1K')) {
      terminalSupplyRatio = 175;
    } else if (classification.includes('ISO 5') || classification.includes('GRADE A') || classification === '100') {
      terminalSupplyRatio = 100;
    } else if (classification.includes('ISO 7') || classification.includes('GRADE C') || classification.includes('10K')) {
      terminalSupplyRatio = 250;
    } else if (classification.includes('ISO 8') || classification.includes('GRADE D') || classification.includes('100K')) {
      terminalSupplyRatio = 250;
    } else if (classification.includes('NC') || classification.includes('Micron')) {
      terminalSupplyRatio = 350;
    }

    const terminalSupplySqft = Math.ceil((resultantCfm / terminalSupplyRatio) * 100) / 100;

    // Cooling load calculation
    // Sensible heat from people: 70W per person
    const peopleCoolingW = peopleCount * 70;
    
    // Equipment load (already in kW, convert to W)
    const equipmentCoolingW = equipmentLoad * 1000;
    
    // Lighting load: W/sqft * area
    const lightingCoolingW = lighting * areaSqft;
    
    // Infiltration load (simplified)
    const infiltrationCoolingW = volumeCuft * infiltration * 1.08;
    
    // Total cooling load in Watts
    const totalCoolingW = peopleCoolingW + equipmentCoolingW + lightingCoolingW + infiltrationCoolingW;
    
    // Convert to TR (1 TR = 3516.85 W)
    const coolingLoadTr = Math.ceil((totalCoolingW / 3516.85) * 2) / 2; // Round to nearest 0.5 TR

    // Room AC load calculation
    const roomAcLoadTr = systemType !== 'Ventilation' 
      ? Math.ceil((totalCoolingW / 12000) * 2) / 2 
      : 0;

    // CFM AC load
    const cfmAcLoadTr = systemType !== 'Ventilation'
      ? Math.ceil((resultantCfm / (systemType === 'Chilled Water' ? 400 : 300)) * 2) / 2
      : 0;

    // AHU CFM (sum of all rooms in zone - simplified for single room)
    const ahuCfm = Math.ceil(resultantCfm / 250) * 250;

    // AHU Size determination
    const ahuSize = this.getAHUSizeByModel(ahuCfm);

    // Static Pressure (fixed at 150 for this example)
    const staticPressure = 150;

    // Blower Model based on CFM
    const blowerModel = this.getBlowerModel(ahuCfm);

    // Motor HP calculation
    const motorHp = this.getMotorHP(ahuCfm, staticPressure);

    // Cooling coil rows based on system and classification
    const coolingCoilRows = this.getCoolingCoilRows(classification);

    // AHU Cooling Load
    const ahuCoolingLoadTr = Math.max(coolingLoadTr, cfmAcLoadTr);

    // Filter stages
    const filterStages = this.getFilterStages(classification);

    // Chilled water calculations
    const chilledWaterGpm = systemType === 'Chilled Water' 
      ? Math.round((ahuCoolingLoadTr * 24 / 6) * 100) / 100
      : 0;
    
    const chilledWaterLps = chilledWaterGpm * 0.06309;
    
    const flowVelocityMs = 2; // Typical value
    
    const pipeSizeMm = chilledWaterGpm > 0 
      ? Math.ceil(Math.sqrt((4 * chilledWaterGpm * 0.00006309) / (3.14 * flowVelocityMs)) * 1000)
      : 0;

    return {
      area: Math.round(areaSqm * 100) / 100,
      volume: Math.round(volumeCum * 100) / 100,
      roomCfm,
      freshAirCfm,
      exhaustCfm,
      waterVaporKgHr: Math.round(waterVaporKgHr * 100) / 100,
      dehumidificationCfm,
      resultantCfm,
      terminalSupplySqft,
      coolingLoadTr,
      roomAcLoadTr,
      cfmAcLoadTr,
      ahuCfm,
      ahuSize,
      staticPressure,
      blowerModel,
      motorHp,
      coolingCoilRows,
      ahuCoolingLoadTr,
      filterStages,
      chilledWaterGpm,
      chilledWaterLps: Math.round(chilledWaterLps * 100) / 100,
      flowVelocityMs,
      pipeSizeMm,
      acph
    };
  }

  /**
   * Get AHU size based on CFM (from Excel logic)
   */
  getAHUSizeByModel(cfm) {
    if (cfm <= 1300) return '200';
    if (cfm <= 1600) return '225';
    if (cfm <= 2100) return '250';
    if (cfm <= 2700) return '280';
    if (cfm <= 3450) return '315';
    if (cfm <= 4250) return '355';
    if (cfm <= 5250) return '400';
    if (cfm <= 6750) return '450';
    if (cfm <= 8500) return '500';
    if (cfm <= 10750) return '560';
    if (cfm <= 13500) return '630';
    if (cfm <= 17000) return '710';
    if (cfm <= 21500) return '800';
    if (cfm <= 27000) return '900';
    if (cfm <= 34000) return '1000';
    if (cfm <= 43000) return '1120';
    if (cfm <= 49000) return '1200';
    if (cfm <= 68000) return '1450';
    return 'Refer';
  }

  /**
   * Get blower model (simplified)
   */
  getBlowerModel(cfm) {
    const size = this.getAHUSizeByModel(cfm);
    return `BDB-${size}`;
  }

  /**
   * Calculate motor HP based on CFM and static pressure
   */
  getMotorHP(cfm, staticPressure) {
    const power = (cfm * staticPressure) / (6356 * 0.7 * 0.9 * 1.1 * 25.4);
    
    const hpOptions = [1, 1.5, 2, 3, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75];
    
    for (const hp of hpOptions) {
      if (power <= hp) return hp;
    }
    
    return 'Refer';
  }

  /**
   * Get number of cooling coil rows based on classification
   */
  getCoolingCoilRows(classification) {
    if (classification.includes('ISO 9') || classification.includes('ISO 7') || 
        classification.includes('ISO 6') || classification.includes('ISO 4') ||
        classification.includes('GRADE C') || classification.includes('10K') || 
        classification.includes('1K')) {
      return 3;
    }
    
    if (classification.includes('ISO 5') || classification.includes('ISO 3') || 
        classification.includes('ISO 2') || classification.includes('ISO 1') ||
        classification.includes('GRADE A') || classification.includes('GRADE B') ||
        classification.includes('100')) {
      return 4;
    }
    
    if (classification.includes('ISO 8') || classification.includes('GRADE D') || 
        classification.includes('100K')) {
      return 4;
    }
    
    if (classification.includes('NC')) {
      return 1;
    }
    
    return 3; // default
  }

  /**
   * Get number of filter stages based on classification
   */
  getFilterStages(classification) {
    const upper = classification.toUpperCase();
    
    if (upper.includes('ISO 9') || upper.includes('ISO 8') || 
        upper.includes('GRADE D') || upper.includes('CLASS 100,000') || 
        upper.includes('CLASS 100K')) {
      return 4;
    }
    
    if (upper.includes('ISO 7') || upper.includes('GRADE C') || 
        upper.includes('CLASS 10,000') || upper.includes('CLASS 10K') ||
        upper.includes('ISO 6') || upper.includes('CLASS 1,000') || 
        upper.includes('CLASS 1K')) {
      return 3;
    }
    
    if (upper.includes('ISO 5') || upper.includes('GRADE A') || 
        upper.includes('GRADE B') || upper.includes('CLASS 100') ||
        upper.includes('ISO 4') || upper.includes('ISO 3') || 
        upper.includes('ISO 2') || upper.includes('ISO 1')) {
      return 4;
    }
    
    if (upper.includes('NCV20')) return 1;
    if (upper.includes('NCV-10')) return 2;
    if (upper.includes('NCV-5')) return 3;
    if (upper.includes('NCAC-10')) return 1;
    if (upper.includes('NCAC-5')) return 2;
    if (upper.includes('NCAC-1')) return 3;
    
    return 3; // default
  }
}

module.exports = new CalculationService();
