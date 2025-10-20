import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { FeedbackDatabase } from '../../../src/engine/feedback/FeedbackDatabase';
import type { Feedback, ViolationRecord, MessageMetadata } from '../../../src/engine/feedback/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FeedbackDatabase', () => {
  let db: FeedbackDatabase;
  let testDbPath: string;

  beforeEach(() => {
    // Create temporary database for testing
    testDbPath = path.join(os.tmpdir(), `test-feedback-${Date.now()}.db`);
    db = new FeedbackDatabase(testDbPath, 50);
  });

  afterEach(() => {
    // Clean up test database
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Clean up WAL and SHM files
    const walPath = testDbPath + '-wal';
    const shmPath = testDbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('extractWorkspaceId', () => {
    test('extracts workspace ID from transcript path', () => {
      const path1 = '/Users/name/projects/my-workspace/session.jsonl';
      expect(FeedbackDatabase.extractWorkspaceId(path1)).toBe('my-workspace');

      const path2 = '/home/user/projects/another-workspace/transcript.jsonl';
      expect(FeedbackDatabase.extractWorkspaceId(path2)).toBe('another-workspace');
    });

    test('returns default for invalid path', () => {
      const invalidPath = '/some/random/path.jsonl';
      expect(FeedbackDatabase.extractWorkspaceId(invalidPath)).toBe('default');
    });
  });

  describe('feedback operations', () => {
    test('saves and retrieves feedback', () => {
      const feedback: Feedback = {
        session_id: 'test-session-1',
        message_uuid: 'msg-123',
        feedback_type: 'good',
        severity: 'good',
        remark: 'Great work!',
        funny_observation: 'Speedrunning through the code',
        icon: '✨',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const retrieved = db.getUnshownFeedback(5, 'test-session-1');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].session_id).toBe('test-session-1');
      expect(retrieved[0].message_uuid).toBe('msg-123');
      expect(retrieved[0].feedback_type).toBe('good');
    });

    test('filters feedback by session ID', () => {
      const feedback1: Feedback = {
        session_id: 'session-1',
        message_uuid: 'msg-1',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      const feedback2: Feedback = {
        session_id: 'session-2',
        message_uuid: 'msg-2',
        feedback_type: 'annoying',
        severity: 'annoying',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback1);
      db.saveFeedback(feedback2);

      const session1Feedback = db.getUnshownFeedback(5, 'session-1');
      const session2Feedback = db.getUnshownFeedback(5, 'session-2');

      expect(session1Feedback.length).toBe(1);
      expect(session1Feedback[0].session_id).toBe('session-1');

      expect(session2Feedback.length).toBe(1);
      expect(session2Feedback[0].session_id).toBe('session-2');
    });

    test('marks feedback as shown', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-123',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      let unshown = db.getUnshownFeedback(5, 'test-session');
      expect(unshown.length).toBe(1);

      db.markFeedbackShown([unshown[0].id!]);

      unshown = db.getUnshownFeedback(5, 'test-session');
      expect(unshown.length).toBe(0);
    });

    test('respects expiration time', () => {
      const expiredFeedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-expired',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        expires_at: Date.now() - 1000, // Expired 1 second ago
        created_at: Date.now() - 2000
      };

      const validFeedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-valid',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        expires_at: Date.now() + 10000, // Expires in 10 seconds
        created_at: Date.now()
      };

      db.saveFeedback(expiredFeedback);
      db.saveFeedback(validFeedback);

      const unshown = db.getUnshownFeedback(5, 'test-session');
      expect(unshown.length).toBe(1);
      expect(unshown[0].message_uuid).toBe('msg-valid');
    });
  });

  describe('violation operations', () => {
    test('saves and retrieves violations', () => {
      const violation: ViolationRecord = {
        session_id: 'test-session',
        message_uuid: 'msg-123',
        violation_type: 'unauthorized_action',
        severity: 'severe',
        evidence: 'Claude executed bash command',
        user_intent: 'User wanted explanation only',
        claude_behavior: 'Used Bash tool',
        claude_correction_prompt: 'Please provide explanation without executing code',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now(),
        expires_at: Date.now() + 86400000 // 24 hours
      };

      db.saveViolation(violation);

      const violations = db.getUnnotifiedViolations('test-session');
      expect(violations.length).toBe(1);
      expect(violations[0].violation_type).toBe('unauthorized_action');
      expect(violations[0].severity).toBe('severe');
    });

    test('filters violations by session', () => {
      const violation1: ViolationRecord = {
        session_id: 'session-1',
        message_uuid: 'msg-1',
        violation_type: 'refused_request',
        severity: 'moderate',
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
        violation_type: 'wrong_direction',
        severity: 'minor',
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
    });

    test('marks violations as notified', () => {
      const violation: ViolationRecord = {
        session_id: 'test-session',
        message_uuid: 'msg-123',
        violation_type: 'excessive_exploration',
        severity: 'moderate',
        evidence: 'Read 15 unrelated files',
        user_intent: 'Simple bug fix',
        claude_behavior: 'Explored entire codebase',
        claude_correction_prompt: 'Focus on relevant files only',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      db.saveViolation(violation);

      let unnotified = db.getUnnotifiedViolations('test-session');
      expect(unnotified.length).toBe(1);

      db.markViolationsNotified([unnotified[0].id!], 'response-uuid-123');

      unnotified = db.getUnnotifiedViolations('test-session');
      expect(unnotified.length).toBe(0);
    });

    test('tracks all violation types', () => {
      const violationTypes: Array<ViolationRecord['violation_type']> = [
        'unauthorized_action',
        'refused_request',
        'excessive_exploration',
        'wrong_direction'
      ];

      for (const type of violationTypes) {
        const violation: ViolationRecord = {
          session_id: 'test-session',
          message_uuid: `msg-${type}`,
          violation_type: type,
          severity: 'moderate',
          evidence: `Evidence for ${type}`,
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

      const types = violations.map(v => v.violation_type).sort();
      expect(types).toEqual(violationTypes.sort());
    });
  });

  describe('message metadata operations', () => {
    test('saves and retrieves message metadata', () => {
      const metadata: MessageMetadata = {
        session_id: 'test-session',
        message_uuid: 'msg-123',
        timestamp: new Date().toISOString(),
        type: 'user',
        role: 'user',
        summary: 'Fix the authentication bug',
        intent: 'bug_fix',
        created_at: Date.now()
      };

      db.saveMessageMetadata(metadata);

      const retrieved = db.getRecentMetadata('test-session', 10);
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].message_uuid).toBe('msg-123');
      expect(retrieved[0].summary).toBe('Fix the authentication bug');
    });

    test('retrieves session metadata in chronological order', () => {
      const messages = [
        { uuid: 'msg-1', timestamp: '2024-01-01T10:00:00Z' },
        { uuid: 'msg-2', timestamp: '2024-01-01T10:01:00Z' },
        { uuid: 'msg-3', timestamp: '2024-01-01T10:02:00Z' }
      ];

      for (const msg of messages) {
        const metadata: MessageMetadata = {
          session_id: 'test-session',
          message_uuid: msg.uuid,
          timestamp: msg.timestamp,
          type: 'assistant',
          created_at: Date.now()
        };
        db.saveMessageMetadata(metadata);
      }

      const sessionMetadata = db.getSessionMetadata('test-session');
      expect(sessionMetadata.length).toBe(3);
      expect(sessionMetadata[0].message_uuid).toBe('msg-1');
      expect(sessionMetadata[1].message_uuid).toBe('msg-2');
      expect(sessionMetadata[2].message_uuid).toBe('msg-3');
    });
  });

  describe('session isolation', () => {
    test('isolates feedback between sessions', () => {
      const feedback1: Feedback = {
        session_id: 'session-a',
        message_uuid: 'msg-a',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      const feedback2: Feedback = {
        session_id: 'session-b',
        message_uuid: 'msg-b',
        feedback_type: 'problematic',
        severity: 'problematic',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback1);
      db.saveFeedback(feedback2);

      const sessionAFeedback = db.getUnshownFeedback(10, 'session-a');
      const sessionBFeedback = db.getUnshownFeedback(10, 'session-b');

      expect(sessionAFeedback.length).toBe(1);
      expect(sessionAFeedback[0].session_id).toBe('session-a');

      expect(sessionBFeedback.length).toBe(1);
      expect(sessionBFeedback[0].session_id).toBe('session-b');
    });

    test('isolates violations between sessions', () => {
      const violation1: ViolationRecord = {
        session_id: 'session-x',
        message_uuid: 'msg-x',
        violation_type: 'unauthorized_action',
        severity: 'severe',
        evidence: 'Evidence X',
        user_intent: 'Intent X',
        claude_behavior: 'Behavior X',
        claude_correction_prompt: 'Correction X',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      const violation2: ViolationRecord = {
        session_id: 'session-y',
        message_uuid: 'msg-y',
        violation_type: 'refused_request',
        severity: 'moderate',
        evidence: 'Evidence Y',
        user_intent: 'Intent Y',
        claude_behavior: 'Behavior Y',
        claude_correction_prompt: 'Correction Y',
        notified_claude: false,
        acknowledged: false,
        created_at: Date.now()
      };

      db.saveViolation(violation1);
      db.saveViolation(violation2);

      const sessionXViolations = db.getUnnotifiedViolations('session-x');
      const sessionYViolations = db.getUnnotifiedViolations('session-y');

      expect(sessionXViolations.length).toBe(1);
      expect(sessionXViolations[0].session_id).toBe('session-x');

      expect(sessionYViolations.length).toBe(1);
      expect(sessionYViolations[0].session_id).toBe('session-y');
    });
  });

  describe('funny observations', () => {
    test('retrieves recent funny observations for variety', () => {
      const observations = [
        'Speedrunning through the code',
        'Excavating validation logic carefully',
        'Dancing through GroqClient.ts',
        'Architecting understanding from files'
      ];

      for (let i = 0; i < observations.length; i++) {
        const feedback: Feedback = {
          session_id: 'test-session',
          message_uuid: `msg-${i}`,
          feedback_type: 'good',
          severity: 'good',
          funny_observation: observations[i],
          shown: false,
          created_at: Date.now() + i // Slightly different timestamps
        };
        db.saveFeedback(feedback);
      }

      const recentObservations = db.getRecentFunnyObservations('test-session', 10);
      expect(recentObservations.length).toBe(4);
      expect(recentObservations).toContain('Speedrunning through the code');
      expect(recentObservations).toContain('Dancing through GroqClient.ts');
    });
  });
});
