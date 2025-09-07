# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Run the pet in statusline mode (main entry point)
bun run src/index.ts

# Development mode with auto-reload
bun run dev

# Build for distribution
bun run build

# Reset pet to initial state
bun run reset

# Run demo mode
bun run demo
```

### Installation & Setup
```bash
# Install dependencies
bun install

# Run the setup script (configures Claude Code settings and commands)
./setup.sh

# Global installation
bun add -g github:Ido-Levi/claude-code-tamagotchi
```

### CLI Commands (when installed globally)
```bash
claude-code-tamagotchi <command> [args]
# Commands: feed, play, pet, clean, sleep, wake, stats, status, name, reset, help
```

## Architecture Overview

This is a virtual pet (Tamagotchi) that lives in the Claude Code statusline. The pet responds to user interactions through slash commands and tracks its state persistently.

### Core Components

1. **Entry Point** (`src/index.ts`): Reads stdin from Claude Code, updates pet state, outputs statusline display.

2. **Pet Engine** (`src/engine/PetEngine.ts`): Central orchestrator that manages state updates, animations, and actions. Coordinates between all subsystems.

3. **State Management** (`src/engine/StateManager.ts`): Handles persistent state storage in `~/.claude/pets/claude-pet-state.json`. Tracks stats (hunger, energy, cleanliness, happiness), timestamps, and session data.

4. **Activity System** (`src/engine/ActivitySystem.ts`): Applies activity-based decay to pet stats rather than time-based. Stats decrease based on coding session activity.

5. **Thought System** (`src/engine/ThoughtSystem.ts`): Generates contextual thoughts based on pet mood, needs, and coding activity. Pulls from 200+ thoughts organized by category in `src/engine/thoughts/`.

6. **AI Feedback System** (`src/engine/feedback/FeedbackSystem.ts`): **NEW** - Optional AI-powered system that analyzes Claude Code's behavior and generates contextual pet reactions using Groq LLM API. Monitors conversation transcripts and provides witty observations.

7. **Command Processing** (`src/commands/CommandProcessor.ts`): Handles slash commands (feed, play, clean, etc.) by writing action files that the pet engine reads on next update.

8. **Animation Manager** (`src/engine/AnimationManager.ts`): Enhanced with mood-based face variations and smooth breathing animations. Each mood has distinct visual representations.

### Data Flow

1. Claude Code calls the pet with statusline update (JSON via stdin)
2. Pet engine loads state, checks for pending actions, applies activity updates
3. Animation and thought systems generate display elements
4. Formatted statusline output sent to stdout
5. State persisted for next update

### Key Environment Variables

The pet is highly configurable through environment variables:

**Core Settings:**
- `PET_STATE_FILE`: State persistence location
- `PET_DECAY_INTERVAL`: Updates between stat decreases  
- `PET_THOUGHT_FREQUENCY`: Updates between thoughts
- `PET_CHATTINESS`: How talkative (quiet/normal/chatty)

**AI Feedback System (Optional):**
- `PET_FEEDBACK_ENABLED`: Enable AI-powered observations (true/false)
- `PET_GROQ_API_KEY`: Your Groq API key from https://console.groq.com/keys
- `PET_GROQ_MODEL`: LLM model to use (default: openai/gpt-oss-20b, alt: llama-3.1-8b-instant)
- `PET_FEEDBACK_CHECK_INTERVAL`: Updates between feedback checks (default: 5)
- `PET_FEEDBACK_DEBUG`: Enable debug logging (true/false)

Various decay rates and thresholds for customization

### Claude Code Integration

- **Statusline**: Configured in `~/.claude/settings.json` to run the pet command
- **Slash Commands**: `/pet-*` commands in `~/.claude/commands/` directory
- **Session Awareness**: Tracks update counts and timestamps to detect coding sessions

The pet only updates during active Claude Code conversations, making it activity-driven rather than real-time.

## New Features (Latest Commit)

### Enhanced Configurable Statusline System
The statusline has been completely redesigned with a modular component architecture:

**Features:**
- **Individual component controls**: Each statusline element can be enabled/disabled
- **Priority-based rendering**: Components render in configurable priority order  
- **Graceful error handling**: Failed components are silently skipped
- **Token tracking**: Smart estimation from Claude Code transcript files
- **Git integration**: Branch detection with semantic coloring
- **Cost/duration tracking**: API usage monitoring when available

**New Environment Variables:**
- `PET_SHOW_PET`, `PET_SHOW_STATS`, `PET_SHOW_TOKENS` - Component visibility controls
- `PET_SHOW_GIT_BRANCH`, `PET_SHOW_COST`, `PET_SHOW_DURATION` - Additional components  
- `PET_SHOW_DIRECTORY`, `PET_SHOW_MODEL`, `PET_SHOW_THOUGHTS` - More customization
- `PET_TOKEN_THRESHOLD`, `PET_TOKEN_ESTIMATE_RATIO` - Token calculation tuning

### New Commands
- **`/pet-explain`**: Analyzes and explains the current statusline contents with debugging info

### AI-Powered Feedback System
The pet can now watch Claude Code work and provide witty, contextual observations about what's happening. This uses Groq's fast LLM API to analyze conversation transcripts in real-time.

**Features:**
- Analyzes Claude's actions and provides sassy (but friendly) commentary
- Mood changes based on Claude's behavior score
- Generates unique observations for each action
- Lightweight background processing to avoid impacting performance
- SQLite database for feedback history

**Setup:**
1. Get a free API key from https://console.groq.com/keys
2. Run `./enable-feedback.sh` to configure environment variables
3. The pet will start providing AI-generated observations

### Enhanced Animation System
- **Mood-based faces**: Each mood has unique facial expressions that alternate
- **Breathing animations**: Subtle animation creates lifelike appearance
- **Smooth transitions**: Better animation flow between different states
- **Activity indicators**: Visual cues for long coding sessions

### Technical Improvements
- Removed hardcoded API keys for security
- Simplified prompt engineering for better LLM responses
- Improved error handling with proper logging
- Streamlined mood/severity system
- Cleaner separation of concerns in feedback system