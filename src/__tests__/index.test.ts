/**
 * index.test.ts - Integration tests for the enhanced main entry point
 * 
 * These tests verify that the main function properly handles various input scenarios
 * from Claude Code, including TTY mode, JSON input parsing, error conditions, and
 * basic output validation. The tests mock stdin and console.log to isolate the
 * main function behavior.
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
describe('Index.ts Integration', () => {
  let originalStdin: any;
  let originalConsoleLog: any;
  
  beforeEach(() => {
    originalStdin = process.stdin;
    originalConsoleLog = console.log;
  });

  afterEach(() => {
    process.stdin = originalStdin;
    console.log = originalConsoleLog;
  });

  describe('Main Function', () => {
    it('should export a main function', async () => {
      const indexModule = await import('../index');
      expect(typeof indexModule.main).toBe('function');
    });

    it('should execute without errors in TTY mode', async () => {
      const outputs: string[] = [];
      console.log = mock((message: string) => outputs.push(message));
      
      const mockStdin = {
        isTTY: true,
        [Symbol.asyncIterator]: async function* () {
          // No input
        }
      };
      process.stdin = mockStdin as any;

      const { main } = await import('../index');
      
      await expect(async () => {
        await main();
      }).not.toThrow();
      expect(outputs.length).toBeGreaterThanOrEqual(1);
      expect(typeof outputs[0]).toBe('string');
    });

    it('should handle JSON input without errors', async () => {
      const outputs: string[] = [];
      console.log = mock((message: string) => outputs.push(message));

      const testInput = {
        hook_event_name: 'statusline_update',
        session_id: 'test-session',
        transcript_path: '/path/to/transcript',
        cwd: '/test/directory',
        model: { id: 'test', display_name: 'Test Model' },
        workspace: { current_dir: '/test', project_dir: '/test' }
      };

      const mockStdin = {
        isTTY: false,
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(JSON.stringify(testInput));
        }
      };
      process.stdin = mockStdin as any;

      const { main } = await import('../index');
      
      await expect(async () => {
        await main();
      }).not.toThrow();
      expect(outputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle invalid JSON gracefully', async () => {
      const outputs: string[] = [];
      console.log = mock((message: string) => outputs.push(message));

      const mockStdin = {
        isTTY: false,
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('invalid json');
        }
      };
      process.stdin = mockStdin as any;

      const { main } = await import('../index');
      
      await expect(async () => {
        await main();
      }).not.toThrow();
      expect(outputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should produce non-empty output', async () => {
      const outputs: string[] = [];
      console.log = mock((message: string) => outputs.push(message));
      
      const mockStdin = {
        isTTY: true,
        [Symbol.asyncIterator]: async function* () {}
      };
      process.stdin = mockStdin as any;

      const { main } = await import('../index');
      await main();

      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs[0].length).toBeGreaterThan(0);
    });

    it('should handle empty input gracefully', async () => {
      const outputs: string[] = [];
      console.log = mock((message: string) => outputs.push(message));

      const mockStdin = {
        isTTY: false,
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('');
        }
      };
      process.stdin = mockStdin as any;

      const { main } = await import('../index');
      
      await expect(async () => {
        await main();
      }).not.toThrow();
      expect(outputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should output contains expected elements', async () => {
      const outputs: string[] = [];
      console.log = mock((message: string) => outputs.push(message));
      
      const mockStdin = {
        isTTY: true,
        [Symbol.asyncIterator]: async function* () {}
      };
      process.stdin = mockStdin as any;

      const { main } = await import('../index');
      await main();

      const output = outputs[0];
      // Should contain at least some recognizable elements
      const hasEmoji = /[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/u.test(output);
      const hasText = /\w/.test(output);
      
      expect(hasEmoji || hasText).toBe(true);
    });
  });
});