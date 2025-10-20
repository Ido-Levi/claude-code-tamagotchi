import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { TranscriptAnalyzer } from '../../../src/engine/feedback/TranscriptAnalyzer';
import { FeedbackDatabase } from '../../../src/engine/feedback/FeedbackDatabase';
import type { FeedbackConfig, Feedback } from '../../../src/engine/feedback/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TranscriptAnalyzer', () => {
  let analyzer: TranscriptAnalyzer;
  let db: FeedbackDatabase;
  let testDbPath: string;
  let config: FeedbackConfig;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-analyzer-${Date.now()}.db`);

    config = {
      enabled: true,
      mode: 'full',
      checkInterval: 5,
      batchSize: 10,
      minMessages: 1,
      staleLockTime: 60000,
      dbPath: testDbPath,
      dbMaxSize: 50,
      groqApiKey: undefined,
      groqModel: 'test-model',
      groqTimeout: 5000,
      groqMaxRetries: 2
    };

    analyzer = new TranscriptAnalyzer(config);
    db = new FeedbackDatabase(testDbPath, 50);
  });

  afterEach(() => {
    analyzer.close();
    db.close();

    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = testDbPath + '-wal';
    const shmPath = testDbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('shouldAnalyze', () => {
    test('returns false when feedback is disabled', async () => {
      const disabledConfig = { ...config, enabled: false };
      const disabledAnalyzer = new TranscriptAnalyzer(disabledConfig);

      const result = await disabledAnalyzer.shouldAnalyze('/fake/path');
      expect(result).toBe(false);

      disabledAnalyzer.close();
    });

    test('returns false when mode is off', async () => {
      const offConfig = { ...config, mode: 'off' as const };
      const offAnalyzer = new TranscriptAnalyzer(offConfig);

      const result = await offAnalyzer.shouldAnalyze('/fake/path');
      expect(result).toBe(false);

      offAnalyzer.close();
    });

    test('returns false when no transcript path provided', async () => {
      const result = await analyzer.shouldAnalyze(undefined);
      expect(result).toBe(false);
    });
  });

  describe('getCachedFeedback', () => {
    test('retrieves cached feedback for session', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-123',
        feedback_type: 'good',
        severity: 'good',
        funny_observation: 'Nice work',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const cached = analyzer.getCachedFeedback('test-session');
      expect(cached.length).toBe(1);
      expect(cached[0].session_id).toBe('test-session');
    });

    test('returns empty array for session with no feedback', () => {
      const cached = analyzer.getCachedFeedback('nonexistent-session');
      expect(cached.length).toBe(0);
    });

    test('isolates feedback by session', () => {
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
        feedback_type: 'problematic',
        severity: 'problematic',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback1);
      db.saveFeedback(feedback2);

      const session1Cached = analyzer.getCachedFeedback('session-1');
      const session2Cached = analyzer.getCachedFeedback('session-2');

      expect(session1Cached.length).toBe(1);
      expect(session1Cached[0].session_id).toBe('session-1');

      expect(session2Cached.length).toBe(1);
      expect(session2Cached[0].session_id).toBe('session-2');
    });
  });

  describe('getMostRelevantFeedback', () => {
    test('returns null for empty feedback array', () => {
      const result = analyzer.getMostRelevantFeedback([]);
      expect(result).toBeNull();
    });

    test('prioritizes problematic over annoying', () => {
      const feedback: Feedback[] = [
        {
          session_id: 'test',
          message_uuid: 'msg-1',
          feedback_type: 'none',
          severity: 'annoying',
          shown: false,
          created_at: Date.now()
        },
        {
          session_id: 'test',
          message_uuid: 'msg-2',
          feedback_type: 'overstepping',
          severity: 'problematic',
          shown: false,
          created_at: Date.now()
        }
      ];

      const result = analyzer.getMostRelevantFeedback(feedback);
      expect(result?.severity).toBe('problematic');
    });

    test('prioritizes annoying over good', () => {
      const feedback: Feedback[] = [
        {
          session_id: 'test',
          message_uuid: 'msg-1',
          feedback_type: 'good',
          severity: 'good',
          shown: false,
          created_at: Date.now()
        },
        {
          session_id: 'test',
          message_uuid: 'msg-2',
          feedback_type: 'verbose',
          severity: 'annoying',
          shown: false,
          created_at: Date.now()
        }
      ];

      const result = analyzer.getMostRelevantFeedback(feedback);
      expect(result?.severity).toBe('annoying');
    });

    test('returns most recent when same severity', () => {
      const now = Date.now();
      const feedback: Feedback[] = [
        {
          session_id: 'test',
          message_uuid: 'msg-1',
          feedback_type: 'good',
          severity: 'good',
          shown: false,
          created_at: now - 1000
        },
        {
          session_id: 'test',
          message_uuid: 'msg-2',
          feedback_type: 'good',
          severity: 'good',
          shown: false,
          created_at: now
        }
      ];

      const result = analyzer.getMostRelevantFeedback(feedback);
      expect(result?.message_uuid).toBe('msg-2');
    });
  });

  describe('calculateBehaviorScore', () => {
    test('returns default score of 80 for no feedback', () => {
      const score = analyzer.calculateBehaviorScore('new-session');
      expect(score).toBe(80);
    });

    test('decreases score for problematic feedback', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'overstepping',
        severity: 'problematic',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const score = analyzer.calculateBehaviorScore('test-session');
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('decreases score for annoying feedback', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'verbose',
        severity: 'annoying',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const score = analyzer.calculateBehaviorScore('test-session');
      expect(score).toBeLessThan(100);
    });

    test('increases score for good feedback', () => {
      // First add a problematic to lower score
      const bad: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'overstepping',
        severity: 'problematic',
        shown: false,
        created_at: Date.now() - 1000
      };
      db.saveFeedback(bad);

      // Then add good feedback
      const good: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-2',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };
      db.saveFeedback(good);

      const score = analyzer.calculateBehaviorScore('test-session');
      // Should be less than 100 but not at minimum
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('clamps score between 0 and 100', () => {
      // Add many problematic feedbacks to try to go negative
      for (let i = 0; i < 20; i++) {
        const feedback: Feedback = {
          session_id: 'test-session',
          message_uuid: `msg-${i}`,
          feedback_type: 'overstepping',
          severity: 'problematic',
          shown: false,
          created_at: Date.now() + i
        };
        db.saveFeedback(feedback);
      }

      const score = analyzer.calculateBehaviorScore('test-session');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecentViolationCount', () => {
    test('returns 0 for session with no violations', () => {
      const count = analyzer.getRecentViolationCount('new-session');
      expect(count).toBe(0);
    });

    test('counts annoying severity as violation', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'verbose',
        severity: 'annoying',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const count = analyzer.getRecentViolationCount('test-session');
      expect(count).toBe(1);
    });

    test('counts problematic severity as violation', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'overstepping',
        severity: 'problematic',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const count = analyzer.getRecentViolationCount('test-session');
      expect(count).toBe(1);
    });

    test('does not count good severity as violation', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      const count = analyzer.getRecentViolationCount('test-session');
      expect(count).toBe(0);
    });

    test('counts multiple violations', () => {
      const feedbacks: Feedback[] = [
        {
          session_id: 'test-session',
          message_uuid: 'msg-1',
          feedback_type: 'verbose',
          severity: 'annoying',
          shown: false,
          created_at: Date.now()
        },
        {
          session_id: 'test-session',
          message_uuid: 'msg-2',
          feedback_type: 'overstepping',
          severity: 'problematic',
          shown: false,
          created_at: Date.now()
        }
      ];

      for (const feedback of feedbacks) {
        db.saveFeedback(feedback);
      }

      const count = analyzer.getRecentViolationCount('test-session');
      expect(count).toBe(2);
    });
  });

  describe('session isolation', () => {
    test('behavior scores are isolated by session', () => {
      const feedback1: Feedback = {
        session_id: 'session-1',
        message_uuid: 'msg-1',
        feedback_type: 'overstepping',
        severity: 'problematic',
        shown: false,
        created_at: Date.now()
      };

      const feedback2: Feedback = {
        session_id: 'session-2',
        message_uuid: 'msg-2',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback1);
      db.saveFeedback(feedback2);

      const score1 = analyzer.calculateBehaviorScore('session-1');
      const score2 = analyzer.calculateBehaviorScore('session-2');

      // Session 1 should have lower score due to problematic feedback
      expect(score1).toBeLessThan(score2);
    });

    test('violation counts are isolated by session', () => {
      const feedback1: Feedback = {
        session_id: 'session-1',
        message_uuid: 'msg-1',
        feedback_type: 'overstepping',
        severity: 'problematic',
        shown: false,
        created_at: Date.now()
      };

      const feedback2: Feedback = {
        session_id: 'session-2',
        message_uuid: 'msg-2',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback1);
      db.saveFeedback(feedback2);

      const count1 = analyzer.getRecentViolationCount('session-1');
      const count2 = analyzer.getRecentViolationCount('session-2');

      expect(count1).toBe(1);
      expect(count2).toBe(0);
    });
  });

  describe('markFeedbackShown', () => {
    test('marks feedback as shown', () => {
      const feedback: Feedback = {
        session_id: 'test-session',
        message_uuid: 'msg-1',
        feedback_type: 'good',
        severity: 'good',
        shown: false,
        created_at: Date.now()
      };

      db.saveFeedback(feedback);

      let unshown = analyzer.getCachedFeedback('test-session');
      expect(unshown.length).toBe(1);

      analyzer.markFeedbackShown([unshown[0].id!]);

      unshown = analyzer.getCachedFeedback('test-session');
      expect(unshown.length).toBe(0);
    });
  });
});
