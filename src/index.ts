#!/usr/bin/env bun

/**
 * index.ts - Enhanced main entry point for Claude Code Tamagotchi
 * 
 * This is the primary entry point that integrates the pet system with Claude Code's
 * statusline. The main function handles stdin input from Claude Code, processes it
 * through the pet engine, and outputs a formatted statusline.
 * 
 * Key Enhancements:
 * - Modular statusline building with configurable components
 * - Enhanced JSON input processing from Claude Code
 * - Debug logging integration when enabled
 * - Graceful error handling with fallback output
 * - Session and transcript awareness for activity tracking
 */

import { PetEngine } from './engine/PetEngine';
import { config } from './utils/config';
import { StatuslineBuilder, StatuslineInput } from './utils/StatuslineBuilder';
import * as path from 'path';
import * as fs from 'fs';

export async function main() {
  try {
    // Log that we've been called with animation details (only if logging enabled)
    if (config.enableLogging) {
      const timestamp = Date.now();
      const logMessage = `Called at ${new Date().toISOString()} (${timestamp})\n`;
      fs.appendFileSync('/tmp/pet-calls.log', logMessage);
    }
    
    // Read input from stdin (Claude Code provides this)
    let input: StatuslineInput | null = null;
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
          cwd = input?.cwd || input?.workspace?.current_dir || cwd;
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
    
    // Prepare pet data for statusline builder - this aggregates all pet state
    // information needed by the various statusline components
    const petData = {
      display: engine.getDisplay(),
      stats: engine.getStats(),
      message: engine.getSystemMessage(),
      thought: engine.getCurrentThought(),
      feedbackIcon: engine.getFeedbackIcon()
    };
    
    // Create statusline builder and build output - uses the new component system
    // to assemble the final statusline from configured components
    const statuslineBuilder = new StatuslineBuilder();
    const output = statuslineBuilder.build(input || {
      hook_event_name: '',
      session_id: '',
      transcript_path: '',
      cwd: process.cwd(),
      model: { id: '', display_name: '' },
      workspace: { current_dir: process.cwd(), project_dir: process.cwd() }
    }, petData);
    
    // Output to stdout (first line becomes statusline)
    console.log(output);
    
    // Debug logging if enabled
    if (config.enableLogging && config.debugMode && config.logFile) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        input,
        output,
        petData,
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