/**
 * StatuslineBuilder.ts - Configurable statusline component system
 * 
 * This module provides a flexible, component-based system for building the Claude Code
 * statusline display. Components are rendered in priority order and can be individually
 * enabled/disabled via configuration.
 * 
 * Key Features:
 * - Modular component architecture with priority-based ordering
 * - Individual component enable/disable controls
 * - Graceful error handling (failed components are skipped)
 * - Automatic formatting with separator pipes
 * - Integration with pet data and Claude Code session info
 */

import { config } from './config';
import { 
  calculateTokens, 
  getGitInfo, 
  formatCost, 
  formatDuration, 
  formatDirectory, 
  formatModel,
  Colors
} from './statusline';

export interface StatuslineInput {
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
  cost?: {
    total_cost_usd?: number | string;
    total_duration_ms?: number | string;
  };
}

export interface StatuslineComponent {
  id: string;
  enabled: boolean;
  render(input: StatuslineInput, petData: any): string;
  priority: number; // Lower number = higher priority (rendered first)
}

/**
 * StatuslineBuilder manages the collection of statusline components and renders them
 * into the final statusline string. Components are sorted by priority and filtered
 * by their enabled status before rendering.
 */
export class StatuslineBuilder {
  private components: StatuslineComponent[] = [];
  
  constructor() {
    this.initializeComponents();
  }
  
  /**
   * Initialize all available statusline components with their default configurations.
   * Components are registered in priority order - lower priority numbers render first.
   */
  private initializeComponents(): void {
    // Pet component
    this.components.push({
      id: 'pet',
      enabled: config.showPet,
      priority: 1,
      render: (_input: StatuslineInput, petData: any) => {
        return petData?.display || '(◕ᴥ◕)';
      }
    });
    
    // Stats component
    this.components.push({
      id: 'stats',
      enabled: config.showStats,
      priority: 2,
      render: (_input: StatuslineInput, petData: any) => {
        return petData?.stats || '';
      }
    });
    
    // Tokens component
    this.components.push({
      id: 'tokens',
      enabled: config.showTokens,
      priority: 3,
      render: (input: StatuslineInput, _petData: any) => {
        const tokenInfo = calculateTokens(input?.session_id);
        return `${tokenInfo.color}${tokenInfo.display}${Colors.RESET}`;
      }
    });
    
    // Context percentage component
    this.components.push({
      id: 'context-percentage',
      enabled: config.showTokens,
      priority: 4,
      render: (input: StatuslineInput, _petData: any) => {
        const tokenInfo = calculateTokens(input?.session_id);
        return `${Colors.CYAN}${tokenInfo.percentage}%${Colors.RESET}`;
      }
    });
    
    // Directory component
    this.components.push({
      id: 'directory',
      enabled: config.showDirectory,
      priority: 5,
      render: (input: StatuslineInput, _petData: any) => {
        const cwd = input?.cwd || input?.workspace?.current_dir || process.cwd();
        return formatDirectory(cwd);
      }
    });
    
    // Git branch component
    this.components.push({
      id: 'git',
      enabled: config.showGitBranch,
      priority: 6,
      render: (input: StatuslineInput, _petData: any) => {
        const cwd = input?.cwd || input?.workspace?.current_dir || process.cwd();
        const gitInfo = getGitInfo(cwd);
        return gitInfo ? gitInfo.display : '';
      }
    });
    
    // Model component
    this.components.push({
      id: 'model',
      enabled: config.showModel,
      priority: 7,
      render: (input: StatuslineInput, _petData: any) => {
        return input?.model?.display_name ? formatModel(input.model.display_name) : '';
      }
    });
    
    // Cost component
    this.components.push({
      id: 'cost',
      enabled: config.showCost,
      priority: 8,
      render: (input: StatuslineInput, _petData: any) => {
        const rawCost = input?.cost?.total_cost_usd || null;
        const costInfo = formatCost(rawCost);
        return costInfo.display;
      }
    });
    
    // Duration component
    this.components.push({
      id: 'duration',
      enabled: config.showDuration,
      priority: 9,
      render: (input: StatuslineInput, _petData: any) => {
        const rawDuration = input?.cost?.total_duration_ms || null;
        const durationInfo = formatDuration(rawDuration);
        return durationInfo.display;
      }
    });
    
    // Thoughts component (last priority)
    this.components.push({
      id: 'thoughts',
      enabled: config.showThoughts,
      priority: 10,
      render: (_input: StatuslineInput, petData: any) => {
        // Prioritize system messages over thoughts
        if (petData?.message) {
          return `💬 ${petData.message}`;
        } else if (petData?.thought) {
          const icon = petData?.feedbackIcon || '💭';
          return `${icon} ${petData.thought}`;
        }
        return '';
      }
    });
  }
  
  /**
   * Build the complete statusline
   */
  build(input: StatuslineInput, petData: any): string {
    const parts: string[] = [];
    
    // Sort components by priority and filter enabled ones
    const enabledComponents = this.components
      .filter(component => component.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    // Render each component
    for (const component of enabledComponents) {
      try {
        const rendered = component.render(input, petData);
        if (rendered && rendered.trim()) {
          parts.push(rendered.trim());
        }
      } catch (error) {
        // Silently skip components that fail to render
        if (config.debugMode) {
          console.error(`Failed to render component ${component.id}:`, error);
        }
      }
    }
    
    // Join with separators
    return parts.join(` ${Colors.DIM}|${Colors.RESET} `);
  }
  
  /**
   * Enable or disable a component
   */
  setComponentEnabled(componentId: string, enabled: boolean): void {
    const component = this.components.find(c => c.id === componentId);
    if (component) {
      component.enabled = enabled;
    }
  }
  
  /**
   * Get list of available components
   */
  getAvailableComponents(): Array<{id: string, enabled: boolean}> {
    return this.components.map(c => ({
      id: c.id,
      enabled: c.enabled
    }));
  }
}