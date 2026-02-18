const calculationService = require('../../services/calculationService');

describe('Calculation Service', () => {
  
  describe('calculateRoomHVAC', () => {
    test('should calculate HVAC parameters for ISO 5 cleanroom', async () => {
      const roomData = {
        length: 10,
        width: 8,
        height: 3,
        peopleCount: 0,
        equipmentLoad: 0
      };

      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 5',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);

      expect(result).toBeDefined();
      expect(result.area).toBe(80); // 10 * 8
      expect(result.volume).toBe(240); // 10 * 8 * 3
      expect(result.acph).toBeGreaterThan(0);
      expect(result.roomCfm).toBeGreaterThan(0);
      expect(result.ahuSize).toBeDefined();
      expect(result.filterStages).toBeDefined();
    });

    test('should calculate HVAC parameters for GMP Grade A', async () => {
      const roomData = {
        length: 12,
        width: 10,
        height: 3.5,
        peopleCount: 2,
        equipmentLoad: 5
      };

      const zoneData = {
        acphMin: 200,
        acphMax: 300,
        classification: 'GRADE A',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);

      expect(result).toBeDefined();
      expect(result.area).toBe(120);
      expect(result.volume).toBe(420);
      expect(result.acph).toBeGreaterThan(0);
      expect(result.roomCfm).toBeGreaterThan(0);
    });

    test('should handle small room dimensions', async () => {
      const roomData = {
        length: 1,
        width: 1,
        height: 2
      };

      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 7',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);

      expect(result.area).toBe(1);
      expect(result.volume).toBe(2);
      expect(result.roomCfm).toBeGreaterThan(0);
    });

    test('should handle large room dimensions', async () => {
      const roomData = {
        length: 100,
        width: 50,
        height: 5
      };

      const zoneData = {
        acphMin: 30,
        acphMax: 60,
        classification: 'ISO 8',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);

      expect(result.area).toBe(5000);
      expect(result.volume).toBe(25000);
      expect(result.roomCfm).toBeGreaterThan(0);
    });
  });

  describe('getAHUSizeByModel', () => {
    test('should return correct AHU size for small CFM (500)', () => {
      const result = calculationService.getAHUSizeByModel(500);
      expect(result).toBe('200');
    });

    test('should return correct AHU size for medium CFM (2000)', () => {
      const result = calculationService.getAHUSizeByModel(2000);
      expect(result).toBe('250');
    });

    test('should return correct AHU size for large CFM (5000)', () => {
      const result = calculationService.getAHUSizeByModel(5000);
      expect(result).toBe('400');
    });

    test('should return "Refer" for very large CFM (70000)', () => {
      const result = calculationService.getAHUSizeByModel(70000);
      expect(result).toBe('Refer');
    });

    test('should handle zero CFM', () => {
      const result = calculationService.getAHUSizeByModel(0);
      expect(result).toBe('200');
    });

    test('should return correct size for 1300 CFM', () => {
      const result = calculationService.getAHUSizeByModel(1300);
      expect(result).toBe('200');
    });

    test('should return correct size for 3000 CFM', () => {
      const result = calculationService.getAHUSizeByModel(3000);
      expect(result).toBe('315');
    });
  });

  describe('getFilterStages', () => {
    test('should return correct stages for ISO 5 classification', () => {
      const result = calculationService.getFilterStages('ISO 5');
      expect(result).toBe(4);
    });

    test('should return correct stages for ISO 6 classification', () => {
      const result = calculationService.getFilterStages('ISO 6');
      expect(result).toBe(3);
    });

    test('should return correct stages for ISO 7 classification', () => {
      const result = calculationService.getFilterStages('ISO 7');
      expect(result).toBe(3);
    });

    test('should return correct stages for ISO 8 classification', () => {
      const result = calculationService.getFilterStages('ISO 8');
      expect(result).toBe(4);
    });

    test('should return correct stages for GMP Grade A', () => {
      const result = calculationService.getFilterStages('GRADE A');
      expect(result).toBe(4);
    });

    test('should return correct stages for GMP Grade B', () => {
      const result = calculationService.getFilterStages('GRADE B');
      expect(result).toBe(4);
    });

    test('should return correct stages for Grade C', () => {
      const result = calculationService.getFilterStages('GRADE C');
      expect(result).toBe(3);
    });

    test('should return correct stages for Grade D', () => {
      const result = calculationService.getFilterStages('GRADE D');
      expect(result).toBe(4);
    });

    test('should return default for unknown classification', () => {
      const result = calculationService.getFilterStages('Unknown Class');
      expect(result).toBe(3);
    });
  });

  describe('getCoolingCoilRows', () => {
    test('should return correct rows for ISO 5 classification', () => {
      const result = calculationService.getCoolingCoilRows('ISO 5');
      expect(result).toBe(4);
    });

    test('should return correct rows for ISO 6 classification', () => {
      const result = calculationService.getCoolingCoilRows('ISO 6');
      expect(result).toBe(3);
    });

    test('should return correct rows for ISO 7 classification', () => {
      const result = calculationService.getCoolingCoilRows('ISO 7');
      expect(result).toBe(3);
    });

    test('should return correct rows for ISO 8 classification', () => {
      const result = calculationService.getCoolingCoilRows('ISO 8');
      expect(result).toBe(4);
    });

    test('should return correct rows for GMP classifications', () => {
      expect(calculationService.getCoolingCoilRows('GRADE A')).toBe(4);
      expect(calculationService.getCoolingCoilRows('GRADE B')).toBe(4);
      expect(calculationService.getCoolingCoilRows('GRADE C')).toBe(3);
      expect(calculationService.getCoolingCoilRows('GRADE D')).toBe(4);
    });

    test('should return correct rows for NC classification', () => {
      const result = calculationService.getCoolingCoilRows('NC');
      expect(result).toBe(1);
    });

    test('should return default rows for unknown classification', () => {
      const result = calculationService.getCoolingCoilRows('Unknown');
      expect(result).toBe(3);
    });
  });

  describe('getBlowerModel', () => {
    test('should return correct blower for small CFM', () => {
      const result = calculationService.getBlowerModel(500);
      expect(result).toBe('BDB-200');
    });

    test('should return correct blower for medium CFM', () => {
      const result = calculationService.getBlowerModel(3000);
      expect(result).toBe('BDB-315');
    });

    test('should return correct blower for large CFM', () => {
      const result = calculationService.getBlowerModel(10000);
      expect(result).toBe('BDB-560');
    });
  });

  describe('getMotorHP', () => {
    test('should calculate motor HP for given CFM and pressure', () => {
      const result = calculationService.getMotorHP(5000, 150);
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    test('should return valid HP for low CFM', () => {
      const result = calculationService.getMotorHP(1000, 150);
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should return valid HP for high CFM', () => {
      const result = calculationService.getMotorHP(50000, 150);
      expect(result).toBeGreaterThan(10);
    });

    test('should return Refer for extremely high power', () => {
      const result = calculationService.getMotorHP(100000, 500);
      expect(result).toBe('Refer');
    });
  });

  describe('Edge Cases and Comprehensive Calculations', () => {
    test('should handle decimal dimensions', async () => {
      const roomData = {
        length: 10.5,
        width: 8.25,
        height: 3.2
      };

      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 6',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.area).toBeCloseTo(86.625, 2);
      expect(result.volume).toBeCloseTo(277.2, 2);
    });

    test('should calculate with people and equipment load', async () => {
      const roomData = {
        length: 10,
        width: 8,
        height: 3,
        peopleCount: 5,
        equipmentLoad: 10
      };

      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 6',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.coolingLoadTr).toBeGreaterThan(0);
      expect(result.roomAcLoadTr).toBeGreaterThan(0);
    });

    test('should handle ventilation system type', async () => {
      const roomData = {
        length: 10,
        width: 8,
        height: 3
      };

      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 7',
        systemType: 'Ventilation'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.waterVaporKgHr).toBe(0);
      expect(result.roomAcLoadTr).toBe(0);
      expect(result.chilledWaterGpm).toBe(0);
    });

    test('should calculate fresh air and exhaust CFM', async () => {
      const roomData = {
        length: 10,
        width: 8,
        height: 3,
        freshAirRatio: 0.15,
        exhaustRatio: 0.1
      };

      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 6',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.freshAirCfm).toBeGreaterThan(0);
      expect(result.exhaustCfm).toBeGreaterThan(0);
    });

    test('should calculate chilled water parameters', async () => {
      const roomData = {
        length: 15,
        width: 12,
        height: 4,
        peopleCount: 10,
        equipmentLoad: 20
      };

      const zoneData = {
        acphMin: 200,
        acphMax: 300,
        classification: 'ISO 5',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.chilledWaterGpm).toBeGreaterThan(0);
      expect(result.chilledWaterLps).toBeGreaterThan(0);
      expect(result.pipeSizeMm).toBeGreaterThan(0);
    });
  });

  describe('Multiple Room Calculations', () => {
    test('should calculate different rooms independently', async () => {
      const room1 = {
        length: 10,
        width: 8,
        height: 3
      };

      const room2 = {
        length: 15,
        width: 12,
        height: 4
      };

      const zone1 = {
        acphMin: 240,
        acphMax: 480,
        classification: 'ISO 5',
        systemType: 'Chilled Water'
      };

      const zone2 = {
        acphMin: 30,
        acphMax: 60,
        classification: 'ISO 7',
        systemType: 'Chilled Water'
      };

      const result1 = await calculationService.calculateRoomHVAC(room1, zone1);
      const result2 = await calculationService.calculateRoomHVAC(room2, zone2);

      expect(result1.roomCfm).not.toEqual(result2.roomCfm);
      expect(result1.acph).toBeGreaterThan(result2.acph);
      expect(result1.area).toBeLessThan(result2.area);
    });
  });

  describe('Classification Support', () => {
    test('should support ISO classifications', async () => {
      const roomData = { length: 10, width: 8, height: 3 };
      const classifications = ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8'];

      for (const classification of classifications) {
        const result = await calculationService.calculateRoomHVAC(
          roomData,
          { classification, acphMin: 150, acphMax: 240, systemType: 'Chilled Water' }
        );
        expect(result).toBeDefined();
        expect(result.filterStages).toBeGreaterThan(0);
        expect(result.coolingCoilRows).toBeGreaterThan(0);
      }
    });

    test('should support GMP classifications', async () => {
      const roomData = { length: 10, width: 8, height: 3 };
      const classifications = ['GRADE A', 'GRADE B', 'GRADE C', 'GRADE D'];

      for (const classification of classifications) {
        const result = await calculationService.calculateRoomHVAC(
          roomData,
          { classification, acphMin: 150, acphMax: 240, systemType: 'Chilled Water' }
        );
        expect(result).toBeDefined();
        expect(result.filterStages).toBeGreaterThan(0);
      }
    });
  });

  describe('Calculation Accuracy', () => {
    test('should round AHU CFM to nearest 250', async () => {
      const roomData = { length: 10, width: 8, height: 3 };
      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 6',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.ahuCfm % 250).toBe(0);
    });

    test('should calculate terminal supply area correctly', async () => {
      const roomData = { length: 10, width: 8, height: 3 };
      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 6',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      expect(result.terminalSupplySqft).toBeGreaterThan(0);
      expect(typeof result.terminalSupplySqft).toBe('number');
    });

    test('should provide all required output fields', async () => {
      const roomData = { length: 10, width: 8, height: 3 };
      const zoneData = {
        acphMin: 150,
        acphMax: 240,
        classification: 'ISO 6',
        systemType: 'Chilled Water'
      };

      const result = await calculationService.calculateRoomHVAC(roomData, zoneData);
      
      const requiredFields = [
        'area', 'volume', 'roomCfm', 'freshAirCfm', 'exhaustCfm',
        'resultantCfm', 'terminalSupplySqft', 'coolingLoadTr',
        'ahuCfm', 'ahuSize', 'staticPressure', 'blowerModel',
        'motorHp', 'coolingCoilRows', 'filterStages', 'acph'
      ];

      requiredFields.forEach(field => {
        expect(result).toHaveProperty(field);
        expect(result[field]).toBeDefined();
      });
    });
  });
});
