# Explain the Pet Status Line

Explain to the user the details of the "Pet" status line.  To do this, you must first (a) check for existing log files that contain recent statusline outputs, then (b) interpret the status line's output using the information below, and answer any follow-up questions about the status line from this information.

To find and explain the status line you will need to:

### Step 1: Check for Existing Log File

The tamagotchi application creates a detailed debug log when both logging and debug mode are enabled. Check this file:

```bash
# Check if debug logging is available (contains statusline data)
if [ -f "/tmp/claude-pet.log" ]; then
    echo "Found detailed debug log. Recent statusline outputs:"
    tail -3 /tmp/claude-pet.log | jq -r '.output // empty' 2>/dev/null | head -3
    echo ""
    echo "Most recent full entry:"
    tail -1 /tmp/claude-pet.log | jq '.' 2>/dev/null
else
    echo "No detailed debug log found at /tmp/claude-pet.log"
    echo "Debug logging is not enabled - see Step 2 below"
fi
```

### Step 2: Enable Debug Logging if Log File Doesn't Exist

If the log file doesn't exist, the user needs to enable both logging and debug mode:

```bash
# Enable debug logging to generate the statusline log file
export ENABLE_LOGGING=true
export DEBUG_MODE=true

# The log will be created on the next statusline update
# User should trigger a statusline update and then re-run this command
```

**IMPORTANT:** If the log file doesn't exist, clearly explain to the user:
1. Debug logging is currently disabled
2. They need to run BOTH: `export ENABLE_LOGGING=true` AND `export DEBUG_MODE=true`
3. Only `ENABLE_LOGGING=true` creates basic call timestamps - you need BOTH variables for statusline data
4. After enabling both, they should trigger a Claude Code statusline update (by typing something)
5. Then re-run this explanation command to see the logged statusline output

### Step 3: Analyze Current Statusline

If log files exist, extract the most recent statusline output and break it down element by element using the component reference below. Parse the statusline string and explain each section:

1. **Pet Display Section** (face, weather, name, mood, alerts)
2. **Pet Stats Section** (hunger, energy, cleanliness, happiness with percentages)  
3. **Context Information** (tokens, percentage, directory, git, model, cost, duration)
4. **Pet Thoughts** (the message at the end)

### Step 4: Provide Actionable Advice

Based on the pet's current state (especially critical stats showing ⚠️), provide specific commands the user can run to help their pet.

### Step 5: Follow-up Questions

Ask the user if there are any follow-up questions about the status line you can answer.

## Status Line Components (Left to Right)

Components display in priority order, separated by dim `|` characters. Each component can be individually enabled/disabled via environment variables.

### 1. Pet Display 🐕
**What it shows:** The pet's current face/animation and mood
**Examples:** 
- `(◕ᴥ◕)` - Happy dog
- `(◔ᴥ◔)` - Sleepy dog  
- `(╥﹏╥)` - Sad/hungry dog
- `(눈_눈)` - Annoyed dog
- `(◡ᴥ◡)` - Content dog

**Configuration:** `PET_SHOW_PET=true/false` (default: true)
**Notes:** Face changes based on pet stats (hunger, happiness, energy, cleanliness) and includes breathing animations

### 2. Pet Stats 📊
**What it shows:** Current stat levels as colored bars
**Examples:**
- `🍖85% ❤️92% 💤75% 🧼60%` - All stats healthy
- `🍖12% ❤️45% 💤30% 🧼90%` - Low hunger/happiness/energy, clean

**Icons:**
- 🍖 - Hunger (food level)
- ❤️ - Happiness 
- 💤 - Energy (rest level)
- 🧼 - Cleanliness

**Colors:**
- Green (70-100%) - Healthy
- Yellow (30-69%) - Caution  
- Red (0-29%) - Critical

**Configuration:** `PET_SHOW_STATS=true/false` (default: true)

### 3. Tokens 🪙
**What it shows:** Estimated token count from conversation transcript
**Examples:**
- `🪙 2.1K` - 2,100 tokens estimated
- `🪙 450` - 450 tokens
- `🪙 15.7K` - 15,700 tokens (getting full)

**Colors:**
- Green (0-69%) - Safe range
- Yellow (70-89%) - Approaching limit
- Red (90-100%) - Near context limit

**Configuration:** `PET_SHOW_TOKENS=true/false` (default: true)
**Technical:** Uses `PET_TOKEN_THRESHOLD=400000` and `PET_TOKEN_ESTIMATE_RATIO=4.0`

### 4. Context Percentage 📈
**What it shows:** Token usage as percentage of context window
**Examples:**
- `42%` - 42% of context used
- `87%` - 87% context used (yellow warning)
- `94%` - 94% context used (red critical)

**Colors:** Same as tokens (green/yellow/red)
**Configuration:** Same as tokens component
**Notes:** Always shows alongside tokens when enabled

### 5. Directory 📁
**What it shows:** Current working directory name
**Examples:**
- `📁 my-project`
- `📁 claude-code-tamago...` (truncated if >20 chars)
- `📁 backend`

**Configuration:** `PET_SHOW_DIRECTORY=true/false` (default: true)
**Color:** Cyan

### 6. Git Branch ⎇
**What it shows:** Current git branch with contextual coloring
**Examples:**
- `⎇ main` (green)
- `⎇ feature/new-ui` (blue) 
- `⎇ hotfix/critical-bug` (red)
- `⎇ develop` (magenta)

**Colors:**
- Green - main/master branches
- Blue - feature/* or feat/* branches  
- Red - hotfix/* or fix/* branches
- Magenta - other branches

**Configuration:** `PET_SHOW_GIT_BRANCH=true/false` (default: true)

### 7. Model 🤖
**What it shows:** Current Claude model being used (from Claude Code input)
**Examples:**
- `[Sonnet 4]`
- `[Claude 3.5 Sonnet]`
- `[Claude 3 Opus]`
- `[Claude 3 Haiku]`

**Configuration:** `PET_SHOW_MODEL=true/false` (default: true)
**Color:** Bold blue
**Data source:** `model.display_name` from Claude Code statusline input

### 8. Cost 💰
**What it shows:** Estimated API cost for current session
**Examples:**
- `<1¢` - Less than 1 cent (dim)
- `15¢` - 15 cents (yellow)
- `50¢` - 50 cents (yellow)
- `$2.45` - $2.45 (yellow if <$100, red if ≥$100)
- `--` - No cost data available (dim)

**Configuration:** `PET_SHOW_COST=true/false` (default: true)
**Data source:** `cost.total_cost_usd` from Claude Code statusline input

### 9. Duration ⏱️
**What it shows:** Total response time for current session  
**Examples:**
- `250ms` - 250 milliseconds (green)
- `3.2s` - 3.2 seconds (green if <10s, yellow if <60s)
- `2.5m` - 2.5 minutes (yellow)
- `35.5m` - 35.5 minutes (yellow)
- `1.2h` - 1.2 hours (red)
- `--` - No duration data available (dim)

**Configuration:** `PET_SHOW_DURATION=true/false` (default: true)
**Data source:** `cost.total_duration_ms` from Claude Code statusline input

### 10. Thoughts/Messages 💭
**What it shows:** Pet thoughts or system messages (lowest priority, appears last)
**Examples:**
- `💭 I wonder what we're building today?`
- `🤖 Claude's being extra helpful today!` (AI feedback enabled)
- `💬 Pet is hungry! Use /pet-feed to feed.` (system message)
- `🎯 Nice error handling there!` (AI feedback)

**Icons:**
- 💭 - Regular thoughts
- 💬 - System messages (higher priority)
- 🤖/🎯/😊/😤 - AI feedback icons (based on feedback type)

**Configuration:** `PET_SHOW_THOUGHTS=true/false` (default: true)

## Configuration Quick Reference

### Component Configuration

Pet components can be disabled individually:

```bash
# Show/hide individual components
export PET_SHOW_PET=true          # Pet face/animation
export PET_SHOW_STATS=true        # Hunger/happiness/energy/cleanliness 
export PET_SHOW_TOKENS=true       # Token count and percentage
export PET_SHOW_GIT_BRANCH=true   # Git branch info
export PET_SHOW_COST=true         # API cost estimates
export PET_SHOW_DURATION=true     # Response time
export PET_SHOW_DIRECTORY=true    # Current directory
export PET_SHOW_MODEL=true        # Claude model name
export PET_SHOW_THOUGHTS=true     # Pet thoughts/messages
```

### Project-Specific Configuration

This project uses environment variable overrides that affect pet behavior:

```bash
# Pet behavior modifications (automatically set)
PET_HUNGER_DECAY=0                    # Disables hunger decay
PET_THOUGHT_WEIGHT_NEEDS=0            # No hunger/energy thoughts
PET_THOUGHT_WEIGHT_CODING=50          # Emphasizes coding-related thoughts
PET_THOUGHT_WEIGHT_RANDOM=30          # Some random thoughts
PET_THOUGHT_WEIGHT_MOOD=20            # Mood-based thoughts
PET_FEEDBACK_ENABLED=true             # Enables AI feedback system
PET_GROQ_API_KEY="${GROQ_API_KEY:-}"  # Uses your GROQ_API_KEY if set
PET_FEEDBACK_DEBUG=true               # Enables debug logging
PET_VIOLATION_CHECK_ENABLED=true      # Enables violation detection
```

## Dynamic Elements

Several components change dynamically:

**Pet Face:** Changes every few updates based on:
- Current mood (happy/sad/sleepy/annoyed)  
- Stat levels (hungry pets look sad)
- Breathing animation for lifelike feel

**Token Colors:** Shift from green → yellow → red as context fills up

**Git Branch Colors:** Automatic based on branch naming conventions

**Thought Content:** Rotates through 200+ contextual thoughts based on:
- Pet mood and needs
- Current coding activity
- AI feedback (if enabled)
- Time of day and session length

## AI Feedback System (Optional)

When `PET_FEEDBACK_ENABLED=true` and `PET_GROQ_API_KEY` is set:
- Pet observes Claude's behavior and generates witty commentary
- Feedback appears in thoughts section with special icons
- Pet mood influenced by Claude's "compliance score"
- Uses Groq API for fast, lightweight LLM analysis