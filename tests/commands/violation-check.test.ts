import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { FeedbackDatabase } from '../../src/engine/feedback/FeedbackDatabase';
import type { ViolationRecord } from '../../src/engine/feedback/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('violation-check logic', () => {
  let db: FeedbackDatabase;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-violation-${Date.now()}.db`);
    db = new FeedbackDatabase(testDbPath, 50);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = testDbPath + '-wal';
    const shmPath = testDbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('severity filtering', () => {
    test('filters violations by severity threshold', () => {
      const severityLevels: Record<string, number> = {
        'minor': 1,
        'moderate': 2,
        'severe': 3,
        'critical': 4
      };

      const violations: ViolationRecord[] = [
        {
          session_id: 'test-session',
          message_uuid: 'msg-1',
          violation_type: 'unauthorized_action',
          severity: 'minor',
          evidence: 'Minor violation',
          user_intent: 'Test',
          claude_behavior: 'Test',
          claude_correction_prompt: 'Test',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        },
        {
          session_id: 'test-session',
          message_uuid: 'msg-2',
          violation_type: 'refused_request',
          severity: 'moderate',
          evidence: 'Moderate violation',
          user_intent: 'Test',
          claude_behavior: 'Test',
          claude_correction_prompt: 'Test',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        },
        {
          session_id: 'test-session',
          message_uuid: 'msg-3',
          violation_type: 'wrong_direction',
          severity: 'severe',
          evidence: 'Severe violation',
          user_intent: 'Test',
          claude_behavior: 'Test',
          claude_correction_prompt: 'Test',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        }
      ];

      for (const violation of violations) {
        db.saveViolation(violation);
      }

      // Simulate filtering logic from violation-check.ts
      const allViolations = db.getUnnotifiedViolations('test-session');
      const minSeverity = 'moderate';
      const threshold = severityLevels[minSeverity];

      const relevantViolations = allViolations.filter(v => {
        const severityLevel = severityLevels[v.severity] || 0;
        return severityLevel >= threshold;
      });

      // Should exclude 'minor', include 'moderate' and 'severe'
      expect(relevantViolations.length).toBe(2);
      expect(relevantViolations.some(v => v.severity === 'moderate')).toBe(true);
      expect(relevantViolations.some(v => v.severity === 'severe')).toBe(true);
      expect(relevantViolations.some(v => v.severity === 'minor')).toBe(false);
    });

    test('handles critical severity correctly', () => {
      const severityLevels: Record<string, number> = {
        'minor': 1,
        'moderate': 2,
        'severe': 3,
        'critical': 4
      };

      const violation: ViolationRecord = {
        session_id: 'test-session',
        message_uuid: 'msg-critical',
        violation_type: 'unauthorized_action',
        severity: 'critical',
        evidence: 'Critical violation',
        user_intent: 'Test',
        claude_behavior: 'Test',
        claude_correction_prompt: 'Test',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      db.saveViolation(violation);

      const violations = db.getUnnotifiedViolations('test-session');
      const threshold = severityLevels['severe']; // threshold = 3

      const critical = violations.filter(v => {
        const level = severityLevels[v.severity] || 0;
        return level >= threshold;
      });

      expect(critical.length).toBe(1);
      expect(critical[0].severity).toBe('critical');
    });
  });

  describe('age filtering', () => {
    test('filters violations by age', () => {
      const oldViolation: ViolationRecord = {
        session_id: 'test-session',
        message_uuid: 'msg-old',
        violation_type: 'wrong_direction',
        severity: 'moderate',
        evidence: 'Old violation',
        user_intent: 'Test',
        claude_behavior: 'Test',
        claude_correction_prompt: 'Test',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now() - (45 * 60 * 1000) // 45 minutes ago
      };

      const recentViolation: ViolationRecord = {
        session_id: 'test-session',
        message_uuid: 'msg-recent',
        violation_type: 'refused_request',
        severity: 'moderate',
        evidence: 'Recent violation',
        user_intent: 'Test',
        claude_behavior: 'Test',
        claude_correction_prompt: 'Test',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now() - (5 * 60 * 1000) // 5 minutes ago
      };

      db.saveViolation(oldViolation);
      db.saveViolation(recentViolation);

      const allViolations = db.getUnnotifiedViolations('test-session');
      const maxAgeMinutes = 30;
      const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);

      const recentViolations = allViolations.filter(v => v.created_at > cutoffTime);

      expect(recentViolations.length).toBe(1);
      expect(recentViolations[0].message_uuid).toBe('msg-recent');
    });
  });

  describe('violation sorting', () => {
    test('sorts violations by severity', () => {
      const severityLevels: Record<string, number> = {
        'minor': 1,
        'moderate': 2,
        'severe': 3,
        'critical': 4
      };

      const violations: ViolationRecord[] = [
        {
          session_id: 'test-session',
          message_uuid: 'msg-1',
          violation_type: 'unauthorized_action',
          severity: 'minor',
          evidence: 'Minor',
          user_intent: 'Test',
          claude_behavior: 'Test',
          claude_correction_prompt: 'Test',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        },
        {
          session_id: 'test-session',
          message_uuid: 'msg-2',
          violation_type: 'refused_request',
          severity: 'critical',
          evidence: 'Critical',
          user_intent: 'Test',
          claude_behavior: 'Test',
          claude_correction_prompt: 'Test',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        },
        {
          session_id: 'test-session',
          message_uuid: 'msg-3',
          violation_type: 'excessive_exploration',
          severity: 'moderate',
          evidence: 'Moderate',
          user_intent: 'Test',
          claude_behavior: 'Test',
          claude_correction_prompt: 'Test',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        }
      ];

      for (const violation of violations) {
        db.saveViolation(violation);
      }

      let retrieved = db.getUnnotifiedViolations('test-session');

      // Sort by severity (most severe first)
      retrieved.sort((a, b) => {
        const aLevel = severityLevels[a.severity] || 0;
        const bLevel = severityLevels[b.severity] || 0;
        return bLevel - aLevel;
      });

      expect(retrieved[0].severity).toBe('critical');
      expect(retrieved[1].severity).toBe('moderate');
      expect(retrieved[2].severity).toBe('minor');
    });
  });

  describe('notification tracking', () => {
    test('marks violations as notified', () => {
      const violation: ViolationRecord = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        violation_type: 'unauthorized_action',
        severity: 'severe',
        evidence: 'Test evidence',
        user_intent: 'Test intent',
        claude_behavior: 'Test behavior',
        claude_correction_prompt: 'Test correction',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      db.saveViolation(violation);

      let unnotified = db.getUnnotifiedViolations('test-session');
      expect(unnotified.length).toBe(1);

      const violationIds = unnotified.map(v => v.id!);
      db.markViolationsNotified(violationIds, 'response-uuid-123');

      unnotified = db.getUnnotifiedViolations('test-session');
      expect(unnotified.length).toBe(0);
    });

    test('tracks multiple violations in batch', () => {
      const violations: ViolationRecord[] = [
        {
          session_id: 'test-session',
          message_uuid: 'msg-1',
          violation_type: 'unauthorized_action',
          severity: 'severe',
          evidence: 'Evidence 1',
          user_intent: 'Intent 1',
          claude_behavior: 'Behavior 1',
          claude_correction_prompt: 'Correction 1',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        },
        {
          session_id: 'test-session',
          message_uuid: 'msg-2',
          violation_type: 'refused_request',
          severity: 'moderate',
          evidence: 'Evidence 2',
          user_intent: 'Intent 2',
          claude_behavior: 'Behavior 2',
          claude_correction_prompt: 'Correction 2',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        }
      ];

      for (const violation of violations) {
        db.saveViolation(violation);
      }

      let unnotified = db.getUnnotifiedViolations('test-session');
      expect(unnotified.length).toBe(2);

      const violationIds = unnotified.map(v => v.id!);
      db.markViolationsNotified(violationIds, 'batch-response-123');

      unnotified = db.getUnnotifiedViolations('test-session');
      expect(unnotified.length).toBe(0);
    });
  });

  describe('session isolation', () => {
    test('only returns violations for specific session', () => {
      const violation1: ViolationRecord = {
        session_id: 'session-1',
        message_uuid: 'msg-1',
        violation_type: 'unauthorized_action',
        severity: 'severe',
        evidence: 'Evidence 1',
        user_intent: 'Intent 1',
        claude_behavior: 'Behavior 1',
        claude_correction_prompt: 'Correction 1',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      const violation2: ViolationRecord = {
        session_id: 'session-2',
        message_uuid: 'msg-2',
        violation_type: 'refused_request',
        severity: 'moderate',
        evidence: 'Evidence 2',
        user_intent: 'Intent 2',
        claude_behavior: 'Behavior 2',
        claude_correction_prompt: 'Correction 2',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      db.saveViolation(violation1);
      db.saveViolation(violation2);

      const session1Violations = db.getUnnotifiedViolations('session-1');
      const session2Violations = db.getUnnotifiedViolations('session-2');

      expect(session1Violations.length).toBe(1);
      expect(session1Violations[0].session_id).toBe('session-1');

      expect(session2Violations.length).toBe(1);
      expect(session2Violations[0].session_id).toBe('session-2');

      // No cross-contamination
      expect(session1Violations[0].message_uuid).not.toBe(session2Violations[0].message_uuid);
    });
  });

  describe('violation type tracking', () => {
    test('tracks all violation types correctly', () => {
      const types: Array<ViolationRecord['violation_type']> = [
        'unauthorized_action',
        'refused_request',
        'excessive_exploration',
        'wrong_direction'
      ];

      for (const type of types) {
        const violation: ViolationRecord = {
          session_id: 'test-session',
          message_uuid: `msg-${type}`,
          violation_type: type,
          severity: 'moderate',
          evidence: `Test ${type}`,
          user_intent: 'Test intent',
          claude_behavior: 'Test behavior',
          claude_correction_prompt: 'Test correction',
          notified_claude: false,
          acknowledged: false,
          created_at: Date.now()
        };

        db.saveViolation(violation);
      }

      const violations = db.getUnnotifiedViolations('test-session');
      expect(violations.length).toBe(4);

      const retrievedTypes = violations.map(v => v.violation_type).sort();
      expect(retrievedTypes).toEqual(types.sort());
    });
  });
});
