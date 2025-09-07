/**
 * statusline.ts - Utility functions for statusline component formatting
 * 
 * This module provides the core formatting and data processing functions used by
 * statusline components. Each function handles a specific aspect of the statusline
 * display: tokens, git info, costs, durations, directories, and model names.
 * 
 * Key Features:
 * - Smart token counting from Claude Code transcript files
 * - Git branch detection with semantic coloring
 * - Cost and duration formatting with threshold-based colors
 * - Consistent ANSI color scheme across all components
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';

// ANSI color codes for terminal formatting
export const Colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  RESET: '\x1b[0m'
};

export interface TokenInfo {
  total: number;
  percentage: number;
  display: string;
  color: string;
}

export interface GitInfo {
  branch: string;
  display: string;
}

export interface CostInfo {
  raw: number;
  display: string;
}

export interface DurationInfo {
  raw: number;
  display: string;
}

/**
 * Calculate token count and percentage from transcript
 */
export function calculateTokens(sessionId?: string): TokenInfo {
  let totalTokens = 0;
  
  if (sessionId && sessionId !== 'null') {
    try {
      // Find transcript file in Claude projects directory
      const claudeDir = path.join(process.env.HOME || '~', '.claude', 'projects');
      const transcriptPath = findTranscriptFile(claudeDir, sessionId);
      
      if (transcriptPath && fs.existsSync(transcriptPath)) {
        const totalChars = fs.statSync(transcriptPath).size;
        totalTokens = Math.round(totalChars / config.tokenEstimateRatio);
      }
    } catch (error) {
      // Silently fail - tokens will show as 0
    }
  }
  
  const percentage = Math.min(100, Math.round((totalTokens * 100) / config.tokenThreshold));
  
  // Format with K notation
  let display: string;
  if (totalTokens >= 1000) {
    display = `${(totalTokens / 1000).toFixed(1)}K`;
  } else {
    display = totalTokens.toString();
  }
  
  // Color based on percentage
  let color: string;
  if (percentage >= 90) {
    color = Colors.RED;
  } else if (percentage >= 70) {
    color = Colors.YELLOW;
  } else {
    color = Colors.GREEN;
  }
  
  return {
    total: totalTokens,
    percentage,
    display: `🪙 ${display}`,
    color
  };
}

/**
 * Find transcript file by session ID in Claude Code projects directory structure.
 * Searches subdirectories for files matching the pattern: {sessionId}.jsonl
 */
function findTranscriptFile(baseDir: string, sessionId: string): string | null {
  try {
    if (!fs.existsSync(baseDir)) return null;
    
    // Look for sessionId.jsonl in subdirectories
    const subdirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const subdir of subdirs) {
      const transcriptPath = path.join(baseDir, subdir, `${sessionId}.jsonl`);
      if (fs.existsSync(transcriptPath)) {
        return transcriptPath;
      }
    }
  } catch (error) {
    // Silently fail
  }
  
  return null;
}

/**
 * Get git branch information
 */
export function getGitInfo(cwd?: string): GitInfo | null {
  try {
    const options = cwd ? { cwd } : {};
    
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir', { ...options, stdio: 'ignore' });
    
    // Get current branch
    const branch = execSync('git branch --show-current', { ...options, encoding: 'utf8' }).trim();
    
    if (!branch) return null;
    
    // Color branch based on name patterns
    let color: string;
    if (branch === 'main' || branch === 'master') {
      color = Colors.GREEN;
    } else if (branch.startsWith('feature/') || branch.startsWith('feat/')) {
      color = Colors.BLUE;
    } else if (branch.startsWith('hotfix/') || branch.startsWith('fix/')) {
      color = Colors.RED;
    } else {
      color = Colors.MAGENTA;
    }
    
    return {
      branch,
      display: `${color}⎇ ${branch}${Colors.RESET}`
    };
  } catch (error) {
    return null;
  }
}

/**
 * Format cost in human-readable way
 */
export function formatCost(rawCost: number | string | null): CostInfo {
  const cost = parseFloat(String(rawCost || '0'));
  
  if (isNaN(cost) || cost === 0) {
    return {
      raw: 0,
      display: `${Colors.DIM}--${Colors.RESET}`
    };
  }
  
  const cents = Math.round(cost * 100);
  
  let display: string;
  if (cents === 0) {
    display = `${Colors.DIM}<1¢${Colors.RESET}`;
  } else if (cents < 100) {
    display = `${Colors.YELLOW}${cents}¢${Colors.RESET}`;
  } else if (cents < 10000) {
    display = `${Colors.YELLOW}$${(cents / 100).toFixed(2)}${Colors.RESET}`;
  } else {
    display = `${Colors.RED}$${(cents / 100).toFixed(2)}${Colors.RESET}`;
  }
  
  return {
    raw: cost,
    display
  };
}

/**
 * Format duration in human-readable way
 */
export function formatDuration(rawDuration: number | string | null): DurationInfo {
  const ms = parseInt(String(rawDuration || '0'));
  
  if (isNaN(ms) || ms === 0) {
    return {
      raw: 0,
      display: `${Colors.DIM}--${Colors.RESET}`
    };
  }
  
  const seconds = ms / 1000;
  
  let display: string;
  if (ms < 1000) {
    display = `${Colors.GREEN}${ms}ms${Colors.RESET}`;
  } else if (seconds < 10) {
    display = `${Colors.GREEN}${seconds.toFixed(1)}s${Colors.RESET}`;
  } else if (seconds < 60) {
    display = `${Colors.YELLOW}${Math.round(seconds)}s${Colors.RESET}`;
  } else if (seconds < 3600) {
    const minutes = seconds / 60;
    display = `${Colors.YELLOW}${minutes.toFixed(1)}m${Colors.RESET}`;
  } else {
    const hours = seconds / 3600;
    display = `${Colors.RED}${hours.toFixed(1)}h${Colors.RESET}`;
  }
  
  return {
    raw: ms,
    display
  };
}

/**
 * Format directory name
 */
export function formatDirectory(dirPath: string): string {
  const dirName = path.basename(dirPath);
  const shortDir = dirName.length > 20 ? dirName.substring(0, 17) + '...' : dirName;
  return `${Colors.CYAN}📁 ${shortDir}${Colors.RESET}`;
}

/**
 * Format model name
 */
export function formatModel(modelName: string): string {
  return `${Colors.BOLD}${Colors.BLUE}[${modelName}]${Colors.RESET}`;
}