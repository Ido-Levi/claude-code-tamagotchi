#!/bin/bash

# Claude Code Pet - Setup Script
# This script sets up the Claude Code Pet for your system

set -e

echo "🐾 Claude Code Pet Setup 🐾"
echo "=========================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd "$SCRIPT_DIR"
bun install

# Create Claude Code commands directory if it doesn't exist
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"
echo ""
echo "📁 Setting up Claude Code commands..."
mkdir -p "$CLAUDE_COMMANDS_DIR"

# Function to create command with proper path
create_command() {
    local cmd_name=$1
    local src_file="$SCRIPT_DIR/claude-commands/$cmd_name.md"
    local dest_file="$CLAUDE_COMMANDS_DIR/$cmd_name.md"
    
    if [ -f "$src_file" ]; then
        # Replace $PET_PATH with actual path in the command
        sed "s|\$PET_PATH|$SCRIPT_DIR|g" "$src_file" > "$dest_file"
        echo "   ✅ /$cmd_name"
    else
        echo "   ⚠️  Skipping $cmd_name (source file not found)"
    fi
}

# Copy all pet commands
echo ""
echo "Installing commands:"
create_command "pet-pet"
create_command "pet-feed"
create_command "pet-play"
create_command "pet-clean"
create_command "pet-sleep"
create_command "pet-wake"
create_command "pet-stats"
create_command "pet-status"
create_command "pet-name"
# pet-dress removed - accessories feature deprecated
create_command "pet-reset"
create_command "pet-help"
create_command "pet-explain"

# Create or update Claude Code settings for statusline
echo ""
echo "⚙️  Configuring statusline..."

# Create settings directory if it doesn't exist
SETTINGS_DIR="$HOME/.claude"
mkdir -p "$SETTINGS_DIR"

# Create a sample settings file if it doesn't exist
SETTINGS_FILE="$SETTINGS_DIR/settings.json"
STATUSLINE_CONFIG='"statusLine": {
    "type": "command",
    "command": "cd '"'$SCRIPT_DIR'"' && bun run --silent src/index.ts"
  }'

if [ ! -f "$SETTINGS_FILE" ]; then
    # Create new settings file
    cat > "$SETTINGS_FILE" << EOF
{
  $STATUSLINE_CONFIG
}
EOF
    echo "   ✅ Created settings file with pet statusline"
else
    # Check if settings file already has statusLine configuration
    if grep -q '"statusLine"' "$SETTINGS_FILE"; then
        echo "   ⚠️  Settings file already has a statusLine configuration"
        echo ""
        read -p "   Would you like to update it with the pet statusline? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Backup the original file
            cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup"
            
            # Use jq if available, otherwise use a simple replacement
            if command -v jq &> /dev/null; then
                # Use jq to update the statusLine
                jq '.statusLine = {
                    "type": "command",
                    "command": "cd '"'$SCRIPT_DIR'"' && bun run --silent src/index.ts"
                }' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
                echo "   ✅ Updated statusLine configuration (backup saved as settings.json.backup)"
            else
                # Simple text replacement - less reliable but works for basic cases
                # This is a basic implementation that may need refinement
                echo "   ℹ️  Attempting to update settings (jq not found, using basic replacement)"
                
                # Create a new settings file with updated statusLine
                node -e "
                const fs = require('fs');
                const settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
                settings.statusLine = {
                    type: 'command',
                    command: 'cd \\'$SCRIPT_DIR\\' && bun run --silent src/index.ts'
                };
                fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2));
                " && echo "   ✅ Updated statusLine configuration (backup saved as settings.json.backup)"
            fi
        else
            echo "   ℹ️  Skipping statusLine update. To manually update, add:"
            echo ""
            echo "   $STATUSLINE_CONFIG"
            echo ""
        fi
    else
        # No statusLine exists, ask to add it
        echo "   ℹ️  No statusLine configuration found in settings"
        echo ""
        read -p "   Would you like to add the pet statusline? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Backup the original file
            cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup"
            
            # Add statusLine to existing settings
            if command -v jq &> /dev/null; then
                jq '.statusLine = {
                    "type": "command",
                    "command": "cd '"'$SCRIPT_DIR'"' && bun run --silent src/index.ts"
                }' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
                echo "   ✅ Added statusLine configuration (backup saved as settings.json.backup)"
            else
                # Use node for JSON manipulation
                node -e "
                const fs = require('fs');
                const settings = JSON.parse(fs.readFileSync('$SETTINGS_FILE', 'utf8'));
                settings.statusLine = {
                    type: 'command',
                    command: 'cd \\'$SCRIPT_DIR\\' && bun run --silent src/index.ts'
                };
                fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(settings, null, 2));
                " && echo "   ✅ Added statusLine configuration (backup saved as settings.json.backup)"
            fi
        else
            echo "   ℹ️  Skipping statusLine configuration. To manually add, use:"
            echo ""
            echo "   $STATUSLINE_CONFIG"
            echo ""
        fi
    fi
fi

# Note about configuration
echo ""
echo "💡 Tip: You can customize your pet with environment variables!"
echo "   See README.md for all configuration options"

# Make the CLI executable
chmod +x "$SCRIPT_DIR/src/commands/pet-cli.ts"

echo ""
echo "✨ Setup complete! ✨"
echo ""
echo "Your Claude Code Pet is ready to use!"
echo ""
echo "🎮 Available commands:"
echo "   /pet-pet         - Pet your companion"
echo "   /pet-feed [food] - Feed your pet"
echo "   /pet-play [toy]  - Play with your pet"
echo "   /pet-clean       - Give pet a bath"
echo "   /pet-stats       - View detailed stats"
echo "   /pet-help        - Show all commands"
echo "   /pet-explain     - Explain what your pet is doing"
echo ""
echo "📊 Your pet will appear in the Claude Code statusline!"
echo ""
echo "⚠️  Note: If the statusline doesn't update automatically,"
echo "   please restart Claude Code or manually update the settings."
echo ""
echo "Enjoy your new companion! 🐾"