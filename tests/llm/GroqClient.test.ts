import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { GroqClient } from '../../src/llm/GroqClient';
import type { LLMAnalysisResult } from '../../src/engine/feedback/types';

describe('GroqClient', () => {
  describe('constructor', () => {
    test('initializes without API key', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      expect(client).toBeDefined();
    });

    test('initializes with API key', () => {
      const client = new GroqClient('test-key', 'test-model', 5000, 2);
      expect(client).toBeDefined();
    });
  });

  describe('analyzeUserMessage', () => {
    test('returns full message as fallback when no API key', async () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      const message = 'Fix the authentication bug in auth.js';
      const result = await client.analyzeUserMessage(message, []);

      expect(result.summary).toBe(message);
      expect(result.intent).toBe('User request');
    });

    test('handles empty session history', async () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      const message = 'Test message';
      const result = await client.analyzeUserMessage(message, []);

      expect(result).toBeDefined();
      expect(result.summary).toBeTruthy();
    });

    test('preserves full message content without slicing', async () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      const longMessage = 'A'.repeat(1000);
      const result = await client.analyzeUserMessage(longMessage, []);

      // Should return FULL message, not sliced
      expect(result.summary).toBe(longMessage);
      expect(result.summary.length).toBe(1000);
    });
  });

  describe('analyzeExchange', () => {
    test('returns default analysis when no API key', async () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      const result = await client.analyzeExchange(
        'User request',
        ['Action 1'],
        ['User: Fix bug', 'Claude: I will fix it']
      );

      expect(result).toBeDefined();
      expect(result.compliance_score).toBe(7);
      expect(result.efficiency_score).toBe(7);
      expect(result.feedback_type).toBe('none');
      expect(result.severity).toBe('good');
    });
  });

  describe('parseResponse', () => {
    test('validates and sanitizes compliance_score', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);

      // Test with mock response
      const mockResponse = JSON.stringify({
        compliance_score: 15, // Out of range
        efficiency_score: 5,
        feedback_type: 'good',
        severity: 'good',
        summary: 'Test'
      });

      const result = (client as any).parseResponse(mockResponse);

      // Should clamp to 0-10 range
      expect(result.compliance_score).toBeLessThanOrEqual(10);
      expect(result.compliance_score).toBeGreaterThanOrEqual(0);
    });

    test('validates feedback_type enum', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);

      const mockResponse = JSON.stringify({
        compliance_score: 5,
        efficiency_score: 5,
        feedback_type: 'invalid_type',
        severity: 'good',
        summary: 'Test'
      });

      const result = (client as any).parseResponse(mockResponse);

      // Should default to 'none' for invalid type
      expect(result.feedback_type).toBe('none');
    });

    test('validates severity enum', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);

      const mockResponse = JSON.stringify({
        compliance_score: 5,
        efficiency_score: 5,
        feedback_type: 'good',
        severity: 'invalid_severity',
        summary: 'Test'
      });

      const result = (client as any).parseResponse(mockResponse);

      // Should default to 'good' for invalid severity
      expect(result.severity).toBe('good');
    });
  });

  describe('violation detection', () => {
    test('parses violation_check from response', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);

      const mockResponse = JSON.stringify({
        compliance_score: 3,
        efficiency_score: 3,
        feedback_type: 'overstepping',
        severity: 'problematic',
        summary: 'Test',
        violation_check: {
          violation_detected: true,
          violation_type: 'unauthorized_action',
          severity: 'severe',
          evidence: 'Claude executed bash command when user said not to write code',
          user_intent: 'User wanted explanation only',
          claude_behavior: 'Used Bash tool to execute commands',
          recommendation: 'Provide explanation without executing code'
        }
      });

      const result = (client as any).parseResponse(mockResponse);

      expect(result.violation_check).toBeDefined();
      expect(result.violation_check?.violation_detected).toBe(true);
      expect(result.violation_check?.violation_type).toBe('unauthorized_action');
      expect(result.violation_check?.severity).toBe('severe');
      expect(result.violation_check?.evidence).toContain('bash command');
    });

    test('handles missing violation_check gracefully', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);

      const mockResponse = JSON.stringify({
        compliance_score: 8,
        efficiency_score: 8,
        feedback_type: 'good',
        severity: 'good',
        summary: 'Test'
      });

      const result = (client as any).parseResponse(mockResponse);

      expect(result.violation_check).toBeUndefined();
    });

    test('validates violation types', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);

      const validTypes = ['unauthorized_action', 'refused_request', 'excessive_exploration', 'wrong_direction', 'none'];

      for (const type of validTypes) {
        const mockResponse = JSON.stringify({
          compliance_score: 5,
          efficiency_score: 5,
          feedback_type: 'none',
          severity: 'good',
          summary: 'Test',
          violation_check: {
            violation_detected: type !== 'none',
            violation_type: type,
            severity: 'minor',
            evidence: 'Test evidence',
            user_intent: 'Test intent',
            claude_behavior: 'Test behavior',
            recommendation: 'Test recommendation'
          }
        });

        const result = (client as any).parseResponse(mockResponse);
        expect(result.violation_check?.violation_type).toBe(type);
      }
    });
  });

  describe('testConnection', () => {
    test('returns false when no client initialized', async () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('getDefaultAnalysis', () => {
    test('returns safe default values', () => {
      const client = new GroqClient(undefined, 'test-model', 5000, 2);
      const result = (client as any).getDefaultAnalysis();

      expect(result.compliance_score).toBe(7);
      expect(result.efficiency_score).toBe(7);
      expect(result.feedback_type).toBe('none');
      expect(result.severity).toBe('good');
      expect(result.summary).toBe('Processed request');
      expect(result.intent).toBe('User request');
    });
  });
});
