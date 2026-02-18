// Example test file
const calculationService = require('../services/calculationService');

describe('Calculation Service Example', () => {
  describe('getAHUSizeByModel', () => {
    it('should return correct AHU size for small CFM', () => {
      const result = calculationService.getAHUSizeByModel(1000);
      expect(result).toBe('200');
    });

    it('should return correct AHU size for medium CFM', () => {
      const result = calculationService.getAHUSizeByModel(5000);
      expect(result).toBe('400');
    });

    it('should return "Refer" for very large CFM', () => {
      const result = calculationService.getAHUSizeByModel(70000);
      expect(result).toBe('Refer');
    });
  });

  describe('getFilterStages', () => {
    it('should return correct stages for ISO classifications', () => {
      expect(calculationService.getFilterStages('ISO 6')).toBe(3);
      expect(calculationService.getFilterStages('ISO 5')).toBe(4);
      expect(calculationService.getFilterStages('ISO 8')).toBe(4);
    });

    it('should return correct stages for GMP classifications', () => {
      expect(calculationService.getFilterStages('GRADE A')).toBe(4);
      expect(calculationService.getFilterStages('GRADE D')).toBe(4);
    });

    it('should return default for unknown classification', () => {
      expect(calculationService.getFilterStages('UNKNOWN')).toBe(3);
    });
  });

  describe('getCoolingCoilRows', () => {
    it('should return correct rows for different classifications', () => {
      expect(calculationService.getCoolingCoilRows('ISO 6')).toBe(3);
      expect(calculationService.getCoolingCoilRows('ISO 5')).toBe(4);
      expect(calculationService.getCoolingCoilRows('GRADE A')).toBe(4);
    });
  });
});
