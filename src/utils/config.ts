/**
 * config.ts - Enhanced configuration system for Claude Code Tamagotchi
 * 
 * This module provides comprehensive configuration management for all aspects of the
 * pet system. It supports environment variable overrides, path resolution, and
 * validation of configuration values.
 * 
 * New Features Added:
 * - Configurable statusline components (individual show/hide controls)
 * - Enhanced feedback system configuration
 * - Weather and seasonal effects
 * - Animation and thought system tuning
 * - Debug and logging controls
 * 
 * Configuration Sources (in priority order):
 * 1. Environment variables (highest priority)
 * 2. .env file in project root
 * 3. Default values (fallback)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Load .env file
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Helper to resolve tilde (~) in file paths to user's home directory
 */
function resolvePath(filepath: string): string {
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

export interface Config {
  // Pet settings
  petName: string;
  petType: 'dog' | 'cat' | 'dragon' | 'robot';
  petColor: string;
  
  // Animation
  animationSpeed: number;
  enableBlinking: boolean;
  idleAnimationChance: number;
  walkingAnimationChance: number;
  
  // Environment
  weather: 'sunny' | 'rainy' | 'snowy' | 'cloudy';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  // Statusline Components (all configurable)
  showPet: boolean;
  showStats: boolean;
  showTokens: boolean;
  showGitBranch: boolean;
  showCost: boolean;
  showDuration: boolean;
  showDirectory: boolean;
  showModel: boolean;
  showThoughts: boolean;
  
  // Token tracking
  tokenThreshold: number;
  tokenEstimateRatio: number;
  
  // Decay rates (per minute)
  hungerDecayRate: number;
  happinessDecayRate: number;
  energyDecayRate: number;
  cleanlinessDecayRate: number;
  
  // Features
  enableEvolution: boolean;
  enableAccessories: boolean;
  enableSounds: boolean;
  enableWeatherEffects: boolean;
  
  // Thought system
  conversationThoughtRatio: number;
  
  // Feedback system
  feedbackEnabled: boolean;
  feedbackMode: 'full' | 'passive' | 'off';
  feedbackCheckInterval: number;
  feedbackBatchSize: number;
  feedbackMinMessages: number;
  feedbackStaleLockTime: number;
  feedbackDbPath: string;
  feedbackDbMaxSize: number;
  groqApiKey?: string;
  groqModel: string;
  groqTimeout: number;
  groqMaxRetries: number;
  moodDecayRate: number;
  annoyedThreshold: number;
  angryThreshold: number;
  furiousThreshold: number;
  praiseBoost: number;
  feedbackIconStyle: 'emoji' | 'ascii' | 'minimal';
  feedbackRemarkLength: number;
  showComplianceScore: boolean;
  feedbackMaxHistory: number;
  
  // Paths
  stateFile: string;
  actionFile: string;
  logFile: string;
  
  // Debug
  debugMode: boolean;
  verboseLogging: boolean;
  enableLogging: boolean;
}

export const config: Config = {
  // Pet settings
  petName: process.env.PET_NAME || 'Buddy',
  petType: (['dog', 'cat', 'dragon', 'robot'].includes(process.env.PET_TYPE as string) 
    ? process.env.PET_TYPE as 'dog' | 'cat' | 'dragon' | 'robot' 
    : 'dog'),
  petColor: process.env.PET_COLOR || 'default',
  
  // Animation
  animationSpeed: parseInt(process.env.ANIMATION_SPEED || '300'),
  enableBlinking: process.env.ENABLE_BLINKING !== 'false',
  idleAnimationChance: parseFloat(process.env.IDLE_ANIMATION_CHANCE || '0.1'),
  walkingAnimationChance: parseFloat(process.env.WALKING_ANIMATION_CHANCE || '0.05'),
  
  // Environment
  weather: (['sunny', 'rainy', 'snowy', 'cloudy'].includes(process.env.WEATHER as string)
    ? process.env.WEATHER as 'sunny' | 'rainy' | 'snowy' | 'cloudy'
    : 'sunny'),
  season: (['spring', 'summer', 'fall', 'winter'].includes(process.env.SEASON as string)
    ? process.env.SEASON as 'spring' | 'summer' | 'fall' | 'winter'
    : 'spring'),
  
  // Statusline Components (all configurable)
  showPet: process.env.PET_SHOW_PET !== 'false',
  showStats: process.env.PET_SHOW_STATS !== 'false',
  showTokens: process.env.PET_SHOW_TOKENS !== 'false',
  showGitBranch: process.env.PET_SHOW_GIT_BRANCH !== 'false',
  showCost: process.env.PET_SHOW_COST !== 'false',
  showDuration: process.env.PET_SHOW_DURATION !== 'false',
  showDirectory: process.env.PET_SHOW_DIRECTORY !== 'false',
  showModel: process.env.PET_SHOW_MODEL !== 'false',
  showThoughts: process.env.PET_SHOW_THOUGHTS !== 'false',
  
  // Token tracking
  tokenThreshold: parseInt(process.env.PET_TOKEN_THRESHOLD || '400000'),
  tokenEstimateRatio: parseFloat(process.env.PET_TOKEN_ESTIMATE_RATIO || '4.0'),
  
  // Decay rates
  hungerDecayRate: parseFloat(process.env.HUNGER_DECAY_RATE || '0.5'),
  happinessDecayRate: parseFloat(process.env.HAPPINESS_DECAY_RATE || '0.2'),
  energyDecayRate: parseFloat(process.env.ENERGY_DECAY_RATE || '0.3'),
  cleanlinessDecayRate: parseFloat(process.env.CLEANLINESS_DECAY_RATE || '0.1'),
  
  // Features
  enableEvolution: process.env.ENABLE_EVOLUTION !== 'false',
  enableAccessories: process.env.ENABLE_ACCESSORIES !== 'false',
  enableSounds: process.env.ENABLE_SOUNDS === 'true',
  enableWeatherEffects: process.env.ENABLE_WEATHER_EFFECTS !== 'false',
  
  // Thought system
  conversationThoughtRatio: parseFloat(process.env.PET_CONVERSATION_THOUGHT_RATIO || '1.0'),
  
  // Feedback system
  feedbackEnabled: process.env.PET_FEEDBACK_ENABLED === 'true',
  feedbackMode: (['full', 'passive', 'off'].includes(process.env.PET_FEEDBACK_MODE as string)
    ? process.env.PET_FEEDBACK_MODE as 'full' | 'passive' | 'off'
    : 'full'),
  feedbackCheckInterval: parseInt(process.env.PET_FEEDBACK_CHECK_INTERVAL || '5'),
  feedbackBatchSize: parseInt(process.env.PET_FEEDBACK_BATCH_SIZE || '10'),
  feedbackMinMessages: parseInt(process.env.PET_FEEDBACK_MIN_MESSAGES || '3'),
  feedbackStaleLockTime: parseInt(process.env.PET_FEEDBACK_STALE_LOCK_TIME || '30000'),
  feedbackDbPath: resolvePath(process.env.PET_FEEDBACK_DB_PATH || '~/.claude/pets/feedback.db'),
  feedbackDbMaxSize: parseInt(process.env.PET_FEEDBACK_DB_MAX_SIZE || '50'),
  groqApiKey: process.env.PET_GROQ_API_KEY || process.env.GROQ_API_KEY,
  groqModel: process.env.PET_GROQ_MODEL || 'openai/gpt-oss-20b',
  groqTimeout: parseInt(process.env.PET_GROQ_TIMEOUT || '2000'),
  groqMaxRetries: parseInt(process.env.PET_GROQ_MAX_RETRIES || '2'),
  moodDecayRate: parseInt(process.env.PET_MOOD_DECAY_RATE || '5'),
  annoyedThreshold: parseInt(process.env.PET_ANNOYED_THRESHOLD || '3'),
  angryThreshold: parseInt(process.env.PET_ANGRY_THRESHOLD || '5'),
  furiousThreshold: parseInt(process.env.PET_FURIOUS_THRESHOLD || '8'),
  praiseBoost: parseInt(process.env.PET_PRAISE_BOOST || '10'),
  feedbackIconStyle: (['emoji', 'ascii', 'minimal'].includes(process.env.PET_FEEDBACK_ICON_STYLE as string)
    ? process.env.PET_FEEDBACK_ICON_STYLE as 'emoji' | 'ascii' | 'minimal'
    : 'emoji'),
  feedbackRemarkLength: parseInt(process.env.PET_FEEDBACK_REMARK_LENGTH || '50'),
  showComplianceScore: process.env.PET_SHOW_COMPLIANCE_SCORE === 'true',
  feedbackMaxHistory: parseInt(process.env.PET_FEEDBACK_MAX_HISTORY || '200'),
  
  // Paths
  stateFile: resolvePath(process.env.PET_STATE_FILE || '~/.claude/pets/claude-pet-state.json'),
  actionFile: resolvePath(process.env.PET_ACTION_FILE || '/tmp/pet-action.json'),
  logFile: process.env.LOG_FILE || '/tmp/claude-pet.log',
  
  // Debug
  debugMode: process.env.DEBUG_MODE === 'true',
  verboseLogging: process.env.VERBOSE_LOGGING === 'true',
  enableLogging: process.env.ENABLE_LOGGING === 'true',  // Off by default
};

/**
 * Get weather-based stat modifiers for the pet.
 * Weather affects pet mood and energy levels to create more dynamic interactions.
 */
export function getWeatherEffects() {
  const effects = {
    sunny: { happiness: 0.1, energy: 0.2 },
    rainy: { happiness: -0.1, cleanliness: -0.3 },
    snowy: { energy: -0.2, happiness: 0.05 },
    cloudy: { energy: -0.05, happiness: -0.05 }
  };
  return effects[config.weather] || { happiness: 0, energy: 0 };
}