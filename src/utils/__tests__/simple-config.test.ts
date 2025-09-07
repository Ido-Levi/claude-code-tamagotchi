import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

// Simple config tests that don't rely on complex mocking
describe('Config Module (Simple)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create clean environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clear module cache
    const configModulePath = require.resolve('../config');
    if (require.cache[configModulePath]) {
      delete require.cache[configModulePath];
    }
  });

  describe('Basic Configuration Loading', () => {
    it('should load config module without throwing', () => {
      expect(() => {
        require('../config');
      }).not.toThrow();
    });

    it('should export a config object', () => {
      const { config } = require('../config');
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have expected pet settings', () => {
      process.env.PET_NAME = 'TestPet';
      process.env.PET_TYPE = 'cat';
      
      const { config } = require('../config');
      expect(config.petName).toBe('TestPet');
      expect(config.petType).toBe('cat');
    });

    it('should validate pet type and use default for invalid values', () => {
      process.env.PET_TYPE = 'invalid-type';
      
      const { config } = require('../config');
      expect(config.petType).toBe('dog'); // Should fallback to default
    });

    it('should handle boolean environment variables', () => {
      process.env.PET_SHOW_PET = 'false';
      process.env.DEBUG_MODE = 'true';
      
      const { config } = require('../config');
      expect(config.showPet).toBe(false);
      expect(config.debugMode).toBe(true);
    });

    it('should handle numeric environment variables', () => {
      process.env.ANIMATION_SPEED = '500';
      process.env.PET_TOKEN_THRESHOLD = '100000';
      
      const { config } = require('../config');
      expect(config.animationSpeed).toBe(500);
      expect(config.tokenThreshold).toBe(100000);
    });

    it('should validate weather values', () => {
      process.env.WEATHER = 'sunny';
      const { config: config1 } = require('../config');
      expect(config1.weather).toBe('sunny');
      
      // Clear and test invalid
      delete require.cache[require.resolve('../config')];
      process.env.WEATHER = 'invalid-weather';
      const { config: config2 } = require('../config');
      expect(config2.weather).toBe('sunny'); // Should fallback
    });

    it('should validate season values', () => {
      process.env.SEASON = 'winter';
      const { config: config1 } = require('../config');
      expect(config1.season).toBe('winter');
      
      // Clear and test invalid
      delete require.cache[require.resolve('../config')];
      process.env.SEASON = 'invalid-season';
      const { config: config2 } = require('../config');
      expect(config2.season).toBe('spring'); // Should fallback
    });
  });

  describe('Path Resolution', () => {
    it('should handle tilde path resolution', () => {
      const { config } = require('../config');
      
      // Check that stateFile contains a resolved path
      expect(config.stateFile).toBeDefined();
      expect(typeof config.stateFile).toBe('string');
      expect(config.stateFile.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Flags', () => {
    it('should handle feedback system settings', () => {
      process.env.PET_FEEDBACK_ENABLED = 'true';
      process.env.PET_FEEDBACK_MODE = 'passive';
      
      const { config } = require('../config');
      expect(config.feedbackEnabled).toBe(true);
      expect(config.feedbackMode).toBe('passive');
    });

    it('should validate feedback mode values', () => {
      process.env.PET_FEEDBACK_MODE = 'invalid-mode';
      
      const { config } = require('../config');
      expect(config.feedbackMode).toBe('full'); // Should fallback
    });
  });

  describe('Weather Effects Function', () => {
    it('should export getWeatherEffects function', () => {
      const module = require('../config');
      expect(typeof module.getWeatherEffects).toBe('function');
    });

    it('should return weather effects object', () => {
      const { getWeatherEffects } = require('../config');
      const effects = getWeatherEffects();
      
      expect(effects).toBeDefined();
      expect(typeof effects).toBe('object');
    });
  });
});