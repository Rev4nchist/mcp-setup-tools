@echo off

echo 🚀 MCP Setup Wrapper (Local Installation)
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Visit: https://nodejs.org/
    exit /b 1
)

echo 💫 Starting MCP setup with local project installation...
echo    This will configure MCP to work specifically with this project
echo.

:: Run the setup script
node setup-mcp.js

:: Check if the script executed successfully
if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ MCP setup completed successfully!
    echo    The MCP Memory Server has been installed as a local dependency.
    echo    Project-specific rules have been created in .cursor/rules/
    echo    Memory storage has been set up in the .mcp/ directory
    echo.
    echo    To start using MCP:
    echo    1. Restart Cursor IDE
    echo    2. Start the server with: npm run mcp
    echo    3. Begin working with AI assistance
    echo.
    echo    Your memory will be stored locally in this project!
) else (
    echo.
    echo ❌ MCP setup encountered an error.
    echo    Please check the output above for details.
)

pause 