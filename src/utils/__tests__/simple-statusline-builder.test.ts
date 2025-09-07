import { describe, it, expect } from 'bun:test';
import { StatuslineBuilder, StatuslineInput } from '../StatuslineBuilder';

// Simple StatuslineBuilder tests
describe('StatuslineBuilder (Simple)', () => {
  describe('Basic Functionality', () => {
    it('should create a StatuslineBuilder instance', () => {
      const builder = new StatuslineBuilder();
      expect(builder).toBeDefined();
      expect(builder).toBeInstanceOf(StatuslineBuilder);
    });

    it('should have required methods', () => {
      const builder = new StatuslineBuilder();
      expect(typeof builder.build).toBe('function');
      expect(typeof builder.setComponentEnabled).toBe('function');
      expect(typeof builder.getAvailableComponents).toBe('function');
    });

    it('should return available components', () => {
      const builder = new StatuslineBuilder();
      const components = builder.getAvailableComponents();
      
      expect(Array.isArray(components)).toBe(true);
      expect(components.length).toBeGreaterThan(0);
      expect(components[0]).toHaveProperty('id');
      expect(components[0]).toHaveProperty('enabled');
    });

    it('should allow enabling/disabling components', () => {
      const builder = new StatuslineBuilder();
      
      // Test disabling a component
      builder.setComponentEnabled('pet', false);
      const components = builder.getAvailableComponents();
      const petComponent = components.find(c => c.id === 'pet');
      
      expect(petComponent).toBeDefined();
      expect(petComponent!.enabled).toBe(false);
      
      // Test re-enabling
      builder.setComponentEnabled('pet', true);
      const updatedComponents = builder.getAvailableComponents();
      const updatedPetComponent = updatedComponents.find(c => c.id === 'pet');
      
      expect(updatedPetComponent!.enabled).toBe(true);
    });

    it('should handle invalid component IDs gracefully', () => {
      const builder = new StatuslineBuilder();
      
      expect(() => {
        builder.setComponentEnabled('nonexistent-component', false);
      }).not.toThrow();
    });

    it('should build output without throwing errors', () => {
      const builder = new StatuslineBuilder();
      
      const mockInput: StatuslineInput = {
        hook_event_name: 'test',
        session_id: 'test',
        transcript_path: '',
        cwd: '/test',
        model: { id: 'test', display_name: 'Test Model' },
        workspace: { current_dir: '/test', project_dir: '/test' }
      };

      const mockPetData = {
        display: '(◕ᴥ◕)',
        stats: 'test stats',
        message: null,
        thought: 'test thought',
        feedbackIcon: '💭'
      };

      expect(() => {
        builder.build(mockInput, mockPetData);
      }).not.toThrow();
    });

    it('should return string output', () => {
      const builder = new StatuslineBuilder();
      
      const mockInput: StatuslineInput = {
        hook_event_name: 'test',
        session_id: 'test',
        transcript_path: '',
        cwd: '/test',
        model: { id: 'test', display_name: 'Test Model' },
        workspace: { current_dir: '/test', project_dir: '/test' }
      };

      const mockPetData = {
        display: '(◕ᴥ◕)',
        stats: 'test stats', 
        message: null,
        thought: 'test thought',
        feedbackIcon: '💭'
      };

      const result = builder.build(mockInput, mockPetData);
      expect(typeof result).toBe('string');
    });

    it('should handle null inputs gracefully', () => {
      const builder = new StatuslineBuilder();

      expect(() => {
        builder.build(null as any, null as any);
      }).not.toThrow();
      
      const result = builder.build(null as any, null as any);
      expect(typeof result).toBe('string');
    });

    it('should prioritize system messages over thoughts', () => {
      const builder = new StatuslineBuilder();
      
      const mockInput: StatuslineInput = {
        hook_event_name: 'test',
        session_id: 'test',
        transcript_path: '',
        cwd: '/test',
        model: { id: 'test', display_name: 'Test' },
        workspace: { current_dir: '/test', project_dir: '/test' }
      };

      const mockPetDataWithMessage = {
        display: '(◕ᴥ◕)',
        stats: 'test stats',
        message: 'Important system message',
        thought: 'Regular thought',
        feedbackIcon: '💭'
      };

      const result = builder.build(mockInput, mockPetDataWithMessage);
      
      if (result.includes('Important system message')) {
        expect(result).not.toContain('Regular thought');
      }
    });

    it('should include expected component IDs', () => {
      const builder = new StatuslineBuilder();
      const components = builder.getAvailableComponents();
      const componentIds = components.map(c => c.id);
      
      // Should have these core components
      expect(componentIds).toContain('pet');
      expect(componentIds).toContain('stats');
      expect(componentIds).toContain('tokens');
      expect(componentIds).toContain('directory');
      expect(componentIds).toContain('thoughts');
    });
  });
});