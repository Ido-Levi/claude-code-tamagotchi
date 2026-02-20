#!/usr/bin/env bun
import { PetEngine } from './engine/PetEngine';
import { config } from './utils/config';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

interface StatusLineInput {
  hook_event_name: string;
  session_id: string;
  transcript_path: string;
  cwd: string;
  model: {
    id: string;
    display_name: string;
  };
  workspace: {
    current_dir: string;
    project_dir: string;
  };
}

function getGitBranch(cwd: string): string | null {
  try {
    // Run git command to get current branch, suppress output
    const branchName = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe', 
    }).trim();
    // Don't show if HEAD (detached)
    if (branchName === 'HEAD') {
      return null;
    }
    return branchName;
  } catch (error) {
    // Not a git repository or git is not installed
    return null;
  }
}

async function main() {
  try {
    // Log that we've been called with animation details (only if logging enabled)
    if (config.enableLogging) {
      const timestamp = Date.now();
      const logMessage = `Called at ${new Date().toISOString()} (${timestamp})\n`;
      fs.appendFileSync(path.join(os.tmpdir(), 'pet-calls.log'), logMessage);
    }
    
    // Read input from stdin (Claude Code provides this)
    let input: StatusLineInput | null = null;
    let cwd = process.cwd();
    
    // Check if we're receiving input from Claude Code
    if (!process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      
      const inputStr = Buffer.concat(chunks).toString();
      
      if (inputStr.trim()) {
        try {
          input = JSON.parse(inputStr);
          cwd = input.cwd || input.workspace?.current_dir || cwd;
        } catch {
          // Not JSON input, ignore
        }
      }
    }
    
    // Initialize pet engine
    const engine = new PetEngine();
    await engine.initialize();
    
    // Pass transcript info if available
    const transcriptPath = input?.transcript_path;
    const sessionId = input?.session_id;
    await engine.update(transcriptPath, sessionId);
    
    // Get pet display
    const petDisplay = engine.getDisplay();
    const stats = engine.getStats();
    
    // Get system message if any
    const message = engine.getSystemMessage();
    
    // Get current thought and feedback icon
    const thought = engine.getCurrentThought();
    const feedbackIcon = engine.getFeedbackIcon();
    
    // Build statusline output
    // Format: [Pet Display] | [Stats] | [Directory (Branch)] | [Model] | [Message or Thought]
    let output = `${petDisplay} | ${stats}`;
    
    // Add directory and git branch if enabled
    const showDirectory = process.env.PET_SHOW_DIRECTORY !== 'false';
    if (showDirectory) {
      const dirName = path.basename(cwd);
      const shortDir = dirName.length > 20 ? dirName.substring(0, 17) + '...' : dirName;
      
      const showGit = process.env.PET_SHOW_GIT_BRANCH !== 'false';
      const branchName = showGit ? getGitBranch(cwd) : null;
      
      let dirSegment = ` | 📁 ${shortDir}`;
      if (branchName) {
        dirSegment += ` (🌿 ${branchName})`;
      }
      output += dirSegment;
    }
    
    // Add model name if enabled (default: true)
    const showModel = process.env.PET_SHOW_MODEL !== 'false';
    if (showModel && input?.model?.display_name) {
      output += ` | 🤖 ${input.model.display_name}`;
    }
    
    // Prioritize system messages over thoughts
    if (message) {
      output += ` | 💬 ${message}`;
    } else if (thought) {
      // Use feedback icon if available, otherwise default thought bubble
      const icon = feedbackIcon || '💭';
      output += ` | ${icon} ${thought}`;
    }
    
    // Output to stdout (first line becomes statusline)
    console.log(output);
    
    // Debug logging if enabled
    if (config.enableLogging && config.debugMode && config.logFile) {
      const fs = await import('fs');
      const logEntry = {
        timestamp: new Date().toISOString(),
        input,
        output,
        stats: engine.getDetailedStats()
      };
      
      fs.appendFileSync(
        config.logFile,
        JSON.stringify(logEntry) + '\n'
      );
    }
    
  } catch (error) {
    // Fallback output on error
    console.log(`(◕ᴥ◕) Pet Error: ${error instanceof Error ? error.message : 'Unknown'} | 📁 ${path.basename(process.cwd())}`);
    
    if (config.debugMode) {
      console.error(error);
    }
  }
}

// Run the main function
main().catch(() => {
  // Silent fail with default output
  console.log('(◕ᴥ◕) Loading... | 📁 ' + path.basename(process.cwd()));
});