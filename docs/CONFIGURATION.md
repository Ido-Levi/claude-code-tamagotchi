# Configuration Guide 🎨

Your Tamagotchi is fully customizable through environment variables! Set these in your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) or before running Claude Code.

## Complete Environment Variables List

### 📍 Core Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_STATE_FILE` | `~/.claude/pets/claude-pet-state.json` | Where your pet's data lives |
| `PET_NAME` | `Buddy` | Your pet's default name (can change with `/pet-name`) |
| `PET_TYPE` | `dog` | Pet type (dog, cat, dragon, robot) |

### 📊 Statusline Components
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_SHOW_PET` | `true` | Show pet face and animation |
| `PET_SHOW_STATS` | `true` | Show hunger/energy/cleanliness/happiness stats |
| `PET_SHOW_TOKENS` | `true` | Show token count and context percentage |
| `PET_SHOW_DIRECTORY` | `true` | Show current directory name |
| `PET_SHOW_GIT_BRANCH` | `true` | Show git branch with colored indicators |
| `PET_SHOW_MODEL` | `true` | Show Claude model name |
| `PET_SHOW_COST` | `true` | Show estimated API cost |
| `PET_SHOW_DURATION` | `true` | Show response duration |
| `PET_SHOW_THOUGHTS` | `true` | Show pet thoughts and messages |
| `PET_SHOW_SESSION` | `false` | Show session update counter in stats |

### 🪙 Token Tracking
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_TOKEN_THRESHOLD` | `400000` | Context window size for percentage calculations |
| `PET_TOKEN_ESTIMATE_RATIO` | `4.0` | Characters per token estimation ratio |


### ⏱️ Decay Rates (How Fast Stats Drop)
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_DECAY_INTERVAL` | `20` | Updates between stat decreases |
| `PET_HUNGER_DECAY` | `0.9` | Hunger decrease per interval |
| `PET_ENERGY_DECAY` | `0.75` | Energy decrease per interval |
| `PET_CLEAN_DECAY` | `0.6` | Cleanliness decrease per interval |
| `PET_SLEEP_RECOVERY` | `3` | Energy gained per update when sleeping |

### 💭 Thought System
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_THOUGHT_FREQUENCY` | `15` | Updates between thoughts |
| `PET_THOUGHT_MIN_DURATION` | `3000` | Min milliseconds before changing thought |
| `PET_THOUGHT_COOLDOWN` | `10` | Min updates between thoughts |
| `PET_CHATTINESS` | `normal` | How talkative (quiet/normal/chatty) |
| `PET_NEED_THRESHOLD` | `40` | Stat level that triggers need thoughts |
| `PET_CRITICAL_THRESHOLD` | `20` | Stat level for urgent thoughts |

### 🎲 Thought Category Weights
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_THOUGHT_WEIGHT_NEEDS` | `40` | Weight for hunger/energy/clean thoughts |
| `PET_THOUGHT_WEIGHT_CODING` | `25` | Weight for code observations |
| `PET_THOUGHT_WEIGHT_RANDOM` | `20` | Weight for philosophical musings |
| `PET_THOUGHT_WEIGHT_MOOD` | `15` | Weight for mood-based thoughts |

### 🤖 AI Feedback System
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_FEEDBACK_ENABLED` | `false` | Enable AI-powered observations |
| `GROQ_API_KEY` or `PET_GROQ_API_KEY` | - | Your Groq API key from https://console.groq.com/keys |
| `PET_GROQ_MODEL` | `openai/gpt-oss-20b` | LLM model (alt: `llama-3.1-8b-instant`) |
| `PET_FEEDBACK_CHECK_INTERVAL` | `5` | Check every N updates |
| `PET_FEEDBACK_DEBUG` | `false` | Enable debug logging |
| `PET_FEEDBACK_LOG_DIR` | `~/.claude/pets/logs` | Log file location |

### 🛡️ Violation Detection
| Variable | Default | Description |
|----------|---------|-------------|
| `PET_VIOLATION_CHECK_ENABLED` | `true` | Enable/disable violation checking |
| `PET_ANNOYED_THRESHOLD` | `3` | Violations before pet gets annoyed |
| `PET_ANGRY_THRESHOLD` | `5` | Violations before pet gets angry |

## Statusline Customization Examples 🎨

### Minimal Statusline
Just the pet and stats:
```bash
export PET_SHOW_TOKENS=false
export PET_SHOW_DIRECTORY=false
export PET_SHOW_GIT_BRANCH=false
export PET_SHOW_MODEL=false
export PET_SHOW_COST=false
export PET_SHOW_DURATION=false
export PET_SHOW_THOUGHTS=false
```

### Developer Focus
Code-centric information:
```bash
export PET_SHOW_PET=false
export PET_SHOW_STATS=false
export PET_SHOW_COST=false
export PET_SHOW_DURATION=false
# Keeps tokens, directory, git, model, thoughts
```

### Performance Monitor
Track API usage and performance:
```bash
export PET_SHOW_PET=false
export PET_SHOW_STATS=false
export PET_SHOW_DIRECTORY=false
export PET_SHOW_GIT_BRANCH=false
export PET_SHOW_THOUGHTS=false
# Keeps tokens, model, cost, duration
```

## Personality Presets & Recipes 🧪

Want a specific personality? Here are some tested configurations:

### 🦥 The Sleepy Pet
Always tired, loves naps:
```bash
export PET_ENERGY_DECAY=3        # Gets tired super fast
export PET_SLEEP_RECOVERY=1      # Sleeps longer
export PET_THOUGHT_WEIGHT_MOOD=30  # More sleepy thoughts
```

### 🍕 The Never-Hungry Pet
Food? What's food?
```bash
export PET_HUNGER_DECAY=0        # Never gets hungry
export PET_THOUGHT_WEIGHT_NEEDS=10  # Rarely thinks about food
```

### 🎭 The Drama Queen
Everything is urgent!
```bash
export PET_NEED_THRESHOLD=70     # Complains early
export PET_CRITICAL_THRESHOLD=50  # Panics often
export PET_CHATTINESS=chatty
export PET_THOUGHT_WEIGHT_NEEDS=60
```

### 🧘 The Zen Master
Eternally content:
```bash
export PET_DECAY_INTERVAL=100    # Barely needs anything
export PET_HUNGER_DECAY=0.1
export PET_ENERGY_DECAY=0.1
export PET_CLEAN_DECAY=0.1
export PET_CHATTINESS=quiet
export PET_THOUGHT_WEIGHT_RANDOM=50  # Philosophical thoughts
```

### 🎮 The Gamer Pet
High energy, always ready to play:
```bash
export PET_ENERGY_DECAY=0.2      # Rarely gets tired
export PET_SLEEP_RECOVERY=10     # Quick power naps
export PET_THOUGHT_WEIGHT_MOOD=40  # Excited thoughts
```

### 🤖 The Debugger
Obsessed with your code:
```bash
export PET_THOUGHT_WEIGHT_CODING=70  # Mostly code observations
export PET_THOUGHT_WEIGHT_RANDOM=5
export PET_THOUGHT_FREQUENCY=10      # Comments frequently
```

### 👻 The Silent Companion
Just vibes, no words:
```bash
export PET_THOUGHT_FREQUENCY=9999    # Almost never speaks
export PET_THOUGHT_COOLDOWN=100
export PET_SHOW_SESSION=false        # Minimal UI
```

### 🦸 The Motivational Coach
Your personal cheerleader:
```bash
export PET_CHATTINESS=chatty
export PET_THOUGHT_WEIGHT_MOOD=50
export PET_CRITICAL_THRESHOLD=10     # Never negative
export PET_THOUGHT_COOLDOWN=5        # Constant encouragement
```

## Multiple Pets

You can have different pets for different projects:

```bash
# Add to your ~/.bashrc or ~/.zshrc for different pets
export PET_STATE_FILE=~/.claude/pets/work-pet.json  # Your work pet
export PET_STATE_FILE=~/.claude/pets/personal-pet.json  # Your personal pet
export PET_STATE_FILE=~/.claude/pets/weekend-pet.json  # Your weekend project pet
```

Mix and match these settings to create your perfect coding companion!