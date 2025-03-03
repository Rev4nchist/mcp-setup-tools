# MCP Setup for Cursor IDE

This package provides automated setup for the Model Context Protocol (MCP) Memory Server in Cursor IDE. The MCP enables persistent memory across AI assistant conversations, project-specific rules, and enhanced code assistance.

## Quick Start

Choose one of the following methods to run the setup script:

### Windows

Double-click the `setup-mcp.bat` file or run it from the command prompt:

```
setup-mcp.bat
```

### macOS / Linux

Run the setup script from the terminal:

```bash
chmod +x setup-mcp.sh
./setup-mcp.sh
```

### Manual (Any Platform)

If you prefer to run the JavaScript script directly:

```bash
node setup-mcp.js
```

## What This Script Does

1. **Installs MCP Memory Server** locally as a dev dependency to your project
2. **Analyzes your project** to determine its type, frameworks, and patterns
3. **Extracts context** from your project documentation
4. **Configures Cursor IDE** to use the MCP server
5. **Creates project-specific rules** based on your tech stack
6. **Sets up a memory file** within your project structure
7. **Creates memory utilities** for backup and exploration
8. **Optimizes Cursor workspace settings** for AI assistance

## Configuration

The setup creates a `.mcp` directory in your project with:

- `ai_memory.json` - The memory file that stores conversations
- `backups/` - Directory for memory backups
- `backup-memory.js` - Utility script for creating backups
- `memory-explorer.js` - Simple web viewer for memory entries
  
It also creates a `.cursor/rules` directory with:

- `project-rules.mdc` - Main project rules and context
- `auth-rules.mdc` - Authentication guidelines (if detected)
- `data-management-rules.mdc` - Data management guidelines (if detected)
- `ui-components-rules.mdc` - UI component guidelines (if detected)
- `best-practices.mdc` - Best practices for your tech stack

## After Setup

1. **Restart Cursor IDE** to apply the configuration
2. **Start the MCP server** with `npm run mcp`
3. **Start coding** with enhanced AI assistance and memory persistence
4. **Create backups** with `npm run mcp:backup` periodically
5. **View memory entries** with `npm run mcp:explore`

## Memory File Structure

The memory file stores structured "memories" in JSON format:

```json
{
  "entries": [
    {
      "id": "initial-setup",
      "timestamp": "2023-05-10T12:34:56.789Z",
      "content": "MCP Memory Server successfully configured for project-name."
    },
    {
      "id": "project-context",
      "timestamp": "2023-05-10T12:34:56.789Z",
      "content": "Project documentation and context extracted from README.md and other sources."
    },
    // Additional entries will be added as you work with the AI assistant
  ]
}
```

## Project Rules

The rules files tell Claude how to understand and work with your codebase. They include:

- Project structure information
- Technical stack details
- Coding patterns
- Best practices
- Memory utilization guidelines

## Customizing Rules

You can customize any of the generated rule files in the `.cursor/rules` directory to better match your specific project requirements or preferences.

## Troubleshooting

- **Node.js Required**: Make sure Node.js is installed on your system
- **Permissions**: Ensure you have write permissions in the project directory
- **Configuration Not Applied**: Make sure to restart Cursor after setup
- **Memory Not Updating**: Check if the MCP server is running with `npm run mcp`
- **Package.json Issues**: If you encounter issues with package.json, run `npm init -y` before setup

## Future Directions

The MCP setup process has several planned enhancements for future versions:

### Team Collaboration
- Shared team memories across multiple developers
- Memory conflict resolution for collaborative editing
- Memory versioning aligned with git branches
- Team-specific rules and preferences

### Continuous Learning
- Periodic update of rules based on evolving codebase
- Integration with CI/CD to update memories with each build
- Automatic extraction of new project patterns
- Learning from code review comments

### IDE Integration
- Deeper integration with Cursor IDE features
- Memory visualization tools within the IDE
- Rule editing interface with syntax highlighting
- AI-assisted rule generation and refinement

### Advanced Analysis
- Code quality insights based on memory patterns
- Performance optimization suggestions
- Security vulnerability detection
- Pattern-based refactoring suggestions

### Multi-Project Context
- Context sharing across related projects
- Workspace-level memories for multi-project solutions
- Cross-project pattern recognition
- Organizational knowledge base integration

## License

MIT 