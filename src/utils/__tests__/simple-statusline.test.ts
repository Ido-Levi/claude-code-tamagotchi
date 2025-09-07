import { describe, it, expect } from 'bun:test';
import { formatCost, formatDuration, formatDirectory, formatModel, Colors } from '../statusline';

// Simple unit tests focusing on formatting functions that don't require complex mocking
describe('Statusline Utilities (Simple)', () => {
  describe('formatCost', () => {
    it('should handle zero cost', () => {
      const result = formatCost(0);
      expect(result.raw).toBe(0);
      expect(result.display).toContain('--');
    });

    it('should handle null cost', () => {
      const result = formatCost(null);
      expect(result.raw).toBe(0);
      expect(result.display).toContain('--');
    });

    it('should format cent costs', () => {
      const result = formatCost(0.15);
      expect(result.raw).toBe(0.15);
      expect(result.display).toContain('15¢');
    });

    it('should format dollar costs', () => {
      const result = formatCost(2.45);
      expect(result.raw).toBe(2.45);
      expect(result.display).toContain('$2.45');
    });

    it('should handle string input', () => {
      const result = formatCost('1.50');
      expect(result.raw).toBe(1.5);
      expect(result.display).toContain('$1.50');
    });
  });

  describe('formatDuration', () => {
    it('should handle zero duration', () => {
      const result = formatDuration(0);
      expect(result.raw).toBe(0);
      expect(result.display).toContain('--');
    });

    it('should handle null duration', () => {
      const result = formatDuration(null);
      expect(result.raw).toBe(0);
      expect(result.display).toContain('--');
    });

    it('should format millisecond durations', () => {
      const result = formatDuration(250);
      expect(result.raw).toBe(250);
      expect(result.display).toContain('250ms');
    });

    it('should format second durations', () => {
      const result = formatDuration(2500);
      expect(result.raw).toBe(2500);
      expect(result.display).toContain('2.5s');
    });

    it('should format minute durations', () => {
      const result = formatDuration(150000); // 2.5 minutes
      expect(result.raw).toBe(150000);
      expect(result.display).toContain('2.5m');
    });

    it('should handle string input', () => {
      const result = formatDuration('3000');
      expect(result.raw).toBe(3000);
      expect(result.display).toContain('3.0s');
    });
  });

  describe('formatDirectory', () => {
    it('should format normal directory names', () => {
      const result = formatDirectory('/home/user/my-project');
      expect(result).toContain('📁');
      expect(result).toContain('my-project');
    });

    it('should truncate long directory names', () => {
      const result = formatDirectory('/home/user/very-long-project-name-that-exceeds-the-twenty-character-limit');
      expect(result).toContain('📁');
      expect(result).toContain('very-long-project'); // Should be truncated
      expect(result).toContain('...');
    });

    it('should handle root directory', () => {
      const result = formatDirectory('/');
      expect(result).toContain('📁');
    });

    it('should handle empty path', () => {
      const result = formatDirectory('');
      expect(result).toContain('📁');
    });
  });

  describe('formatModel', () => {
    it('should format model names with brackets', () => {
      const result = formatModel('Sonnet 4');
      expect(result).toContain('[Sonnet 4]');
      expect(result).toContain(Colors.BOLD);
      expect(result).toContain(Colors.BLUE);
      expect(result).toContain(Colors.RESET);
    });

    it('should handle empty model names', () => {
      const result = formatModel('');
      expect(result).toContain('[]');
    });

    it('should handle long model names', () => {
      const result = formatModel('Claude 3.5 Sonnet New Architecture');
      expect(result).toContain('[Claude 3.5 Sonnet New Architecture]');
    });
  });

  describe('Colors constant', () => {
    it('should export all required color codes', () => {
      expect(Colors.RED).toBe('\x1b[31m');
      expect(Colors.GREEN).toBe('\x1b[32m');
      expect(Colors.YELLOW).toBe('\x1b[33m');
      expect(Colors.BLUE).toBe('\x1b[34m');
      expect(Colors.MAGENTA).toBe('\x1b[35m');
      expect(Colors.CYAN).toBe('\x1b[36m');
      expect(Colors.WHITE).toBe('\x1b[37m');
      expect(Colors.BOLD).toBe('\x1b[1m');
      expect(Colors.DIM).toBe('\x1b[2m');
      expect(Colors.RESET).toBe('\x1b[0m');
    });
  });
});