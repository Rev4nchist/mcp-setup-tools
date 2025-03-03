#!/usr/bin/env node

/**
 * Automated MCP Setup Script for Cursor IDE
 * This script handles the complete setup of Model Context Protocol for any project
 * with intelligent analysis and configuration.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

// Create interface for user input if needed
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  memoryDirName: '.mcp',
  memoryFileName: 'ai_memory.json',
  rulesDirName: '.cursor/rules',
  mcpPort: 3002
};

/**
 * Main setup function
 */
async function setupMCP() {
  console.log('\n🚀 Starting MCP Setup Process...\n');
  
  try {
    // Step 1: Install MCP Memory Server locally
    await installMCPServer();
    
    // Step 2: Analyze project structure with enhanced detection
    const projectInfo = analyzeProject();
    console.log(`\n✅ Project analyzed: ${projectInfo.name} (${projectInfo.type})`);
    
    // Step 3: Create project directories
    createDirectories();
    
    // Step 4: Configure Cursor
    configureCursor();
    
    // Step 5: Generate project rules
    generateRules(projectInfo);
    
    // Step 6: Extract project context from documentation
    const projectContext = extractProjectContext();
    
    // Step 7: Create initial memory file with project context
    createMemoryFile(projectInfo, projectContext);
    
    // Step 8: Create memory management utilities
    createMemoryUtilities();
    
    // Step 9: Create Cursor workspace settings
    createCursorWorkspaceSettings();
    
    // Step 10: Verification step
    performVerification();
    
    // Success message with progress report
    console.log('\n🎉 MCP Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Restart Cursor IDE');
    console.log('  2. Open your project');
    console.log('  3. Start coding with persistent AI assistance');
    console.log('\n💡 Try using the memory utilities:');
    console.log('  - Run `npm run mcp` to start the MCP server');
    console.log('  - Run `npm run mcp:backup` to create a backup of your memory file\n');
  } catch (error) {
    console.error('\n❌ Setup Failed:', error.message);
    console.log('\nPlease try manually following the steps in the documentation.');
  } finally {
    rl.close();
  }
}

/**
 * Install MCP Memory Server locally as a dev dependency
 */
async function installMCPServer() {
  console.log('📦 Installing MCP Memory Server locally...');
  
  try {
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      console.log('  ⚠️ No package.json found, creating one...');
      execSync('npm init -y', { stdio: 'ignore' });
    }
    
    // Install as dev dependency
    execSync('npm install --save-dev @modelcontextprotocol/server-memory', { 
      stdio: ['inherit', 'inherit', 'inherit'] 
    });
    console.log('  ✓ MCP Memory Server installed as local dev dependency');
    
    // Update package.json to add scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts.mcp = `modelcontextprotocol-memory-server --port ${CONFIG.mcpPort}`;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('  ✓ Added MCP script to package.json');
  } catch (error) {
    throw new Error(`Failed to install MCP Memory Server: ${error.message}`);
  }
}

/**
 * Analyze the project structure to determine type, frameworks, etc.
 * with enhanced detection capabilities
 */
function analyzeProject() {
  console.log('🔍 Analyzing project structure...');
  
  const projectInfo = {
    name: path.basename(process.cwd()),
    type: 'unknown',
    frameworks: [],
    patterns: {
      auth: null,
      dataManagement: null,
      ui: null
    },
    testing: [],
    config: [],
    isMonorepo: false,
    repoRoot: null
  };
  
  // Check for git repository
  if (fs.existsSync('.git')) {
    projectInfo.repoRoot = process.cwd();
  } else {
    // Try to find git repository in parent directories
    let currentDir = process.cwd();
    while (currentDir !== path.parse(currentDir).root) {
      if (fs.existsSync(path.join(currentDir, '.git'))) {
        projectInfo.repoRoot = currentDir;
        break;
      }
      currentDir = path.dirname(currentDir);
    }
  }
  
  // Check if it's a monorepo by looking for common indicators
  if (fs.existsSync('lerna.json') || 
      fs.existsSync('pnpm-workspace.yaml') || 
      (fs.existsSync('package.json') && 
       JSON.parse(fs.readFileSync('package.json', 'utf8')).workspaces)) {
    projectInfo.isMonorepo = true;
  }
  
  // Check for configuration files
  const configFiles = [
    '.eslintrc.js', '.eslintrc.json', '.eslintrc', 
    'tsconfig.json', 'babel.config.js', 'jest.config.js',
    '.prettierrc', '.prettierrc.js', '.stylelintrc',
    'vite.config.js', 'vite.config.ts', 'webpack.config.js',
    'next.config.js', 'nuxt.config.js', 'angular.json',
    '.env', '.env.local', '.env.development'
  ];
  
  for (const file of configFiles) {
    if (fs.existsSync(file)) {
      projectInfo.config.push(file);
    }
  }
  
  // Check package.json for JS/TS projects
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    projectInfo.name = packageJson.name || projectInfo.name;
    
    // Determine project type and frameworks
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Testing frameworks
    if (deps.jest) projectInfo.testing.push('Jest');
    if (deps.mocha) projectInfo.testing.push('Mocha');
    if (deps.chai) projectInfo.testing.push('Chai');
    if (deps.cypress) projectInfo.testing.push('Cypress');
    if (deps['@testing-library/react']) projectInfo.testing.push('React Testing Library');
    if (deps['@testing-library/vue']) projectInfo.testing.push('Vue Testing Library');
    
    if (deps.react) {
      projectInfo.frameworks.push('React');
      if (deps.next) {
        projectInfo.type = 'Next.js';
        projectInfo.frameworks.push('Next.js');
      } else if (deps['react-native']) {
        projectInfo.type = 'React Native';
        projectInfo.frameworks.push('React Native');
      } else {
        projectInfo.type = 'React';
      }
    } else if (deps.vue) {
      projectInfo.type = 'Vue';
      projectInfo.frameworks.push('Vue');
      if (deps.nuxt) {
        projectInfo.frameworks.push('Nuxt.js');
      }
    } else if (deps.angular) {
      projectInfo.type = 'Angular';
      projectInfo.frameworks.push('Angular');
    } else if (deps.svelte) {
      projectInfo.type = 'Svelte';
      projectInfo.frameworks.push('Svelte');
    } else if (deps.express || deps.koa || deps.hapi || deps.fastify) {
      projectInfo.type = 'Node.js';
      if (deps.express) projectInfo.frameworks.push('Express');
      if (deps.koa) projectInfo.frameworks.push('Koa');
      if (deps.hapi) projectInfo.frameworks.push('Hapi');
      if (deps.fastify) projectInfo.frameworks.push('Fastify');
    }
    
    // State management
    if (deps.redux || deps['@reduxjs/toolkit']) {
      projectInfo.frameworks.push('Redux');
    }
    if (deps.mobx) {
      projectInfo.frameworks.push('MobX');
    }
    if (deps.zustand) {
      projectInfo.frameworks.push('Zustand');
    }
    if (deps.jotai) {
      projectInfo.frameworks.push('Jotai');
    }
    if (deps.recoil) {
      projectInfo.frameworks.push('Recoil');
    }
    
    // Identify auth patterns
    if (deps.firebase || deps['firebase-admin']) {
      projectInfo.frameworks.push('Firebase');
      projectInfo.patterns.auth = 'Firebase Authentication';
    } else if (deps.auth0) {
      projectInfo.patterns.auth = 'Auth0';
    } else if (deps['@clerk/nextjs'] || deps['@clerk/clerk-react']) {
      projectInfo.patterns.auth = 'Clerk';
    } else if (deps['next-auth']) {
      projectInfo.patterns.auth = 'NextAuth.js';
    } else if (deps.passport) {
      projectInfo.patterns.auth = 'Passport.js';
    } else if (deps.keycloak) {
      projectInfo.patterns.auth = 'Keycloak';
    }
    
    // Identify data management patterns
    if (deps.firebase || deps['firebase-admin']) {
      projectInfo.patterns.dataManagement = 'Firebase Firestore';
    } else if (deps.prisma) {
      projectInfo.patterns.dataManagement = 'Prisma';
    } else if (deps.mongoose) {
      projectInfo.patterns.dataManagement = 'MongoDB (Mongoose)';
    } else if (deps.sequelize) {
      projectInfo.patterns.dataManagement = 'SQL (Sequelize)';
    } else if (deps.typeorm) {
      projectInfo.patterns.dataManagement = 'TypeORM';
    } else if (deps['@prisma/client']) {
      projectInfo.patterns.dataManagement = 'Prisma';
    } else if (deps['@tanstack/react-query']) {
      projectInfo.patterns.dataManagement = 'React Query';
    } else if (deps.apollo || deps['@apollo/client']) {
      projectInfo.patterns.dataManagement = 'Apollo GraphQL';
    } else if (deps.swr) {
      projectInfo.patterns.dataManagement = 'SWR';
    }
    
    // Identify UI patterns
    if (deps.tailwindcss) {
      projectInfo.patterns.ui = 'Tailwind CSS';
    } else if (deps['@mui/material'] || deps['@material-ui/core']) {
      projectInfo.patterns.ui = 'Material UI';
    } else if (deps['@chakra-ui/react']) {
      projectInfo.patterns.ui = 'Chakra UI';
    } else if (deps.bootstrap || deps['react-bootstrap']) {
      projectInfo.patterns.ui = 'Bootstrap';
    } else if (deps['styled-components']) {
      projectInfo.patterns.ui = 'Styled Components';
    } else if (deps['@emotion/react']) {
      projectInfo.patterns.ui = 'Emotion';
    } else if (deps['@radix-ui/react-dialog']) {
      projectInfo.patterns.ui = 'Radix UI';
    } else if (deps['@mantine/core']) {
      projectInfo.patterns.ui = 'Mantine UI';
    } else if (deps['@headlessui/react']) {
      projectInfo.patterns.ui = 'Headless UI';
    }
  } 
  // Python project detection
  else if (fs.existsSync('requirements.txt') || fs.existsSync('Pipfile') || fs.existsSync('pyproject.toml')) {
    projectInfo.type = 'Python';
    
    // Check for Django or Flask
    if (fs.existsSync('manage.py') || fs.existsSync('django_project')) {
      projectInfo.frameworks.push('Django');
    } else if (fs.existsSync('app.py') || fs.readdirSync('.').some(f => fs.existsSync(f) && fs.statSync(f).isFile() && path.extname(f) === '.py' && fs.readFileSync(f, 'utf8').includes('Flask(__name__'))) {
      projectInfo.frameworks.push('Flask');
    } else if (fs.existsSync('fastapi') || fs.readdirSync('.').some(f => fs.existsSync(f) && fs.statSync(f).isFile() && path.extname(f) === '.py' && fs.readFileSync(f, 'utf8').includes('FastAPI('))) {
      projectInfo.frameworks.push('FastAPI');
    }
    
    // Check for testing frameworks
    if (fs.existsSync('pytest.ini') || fs.existsSync('conftest.py')) {
      projectInfo.testing.push('pytest');
    }
    if (fs.existsSync('unittest') || fs.readdirSync('.').some(f => fs.existsSync(f) && fs.statSync(f).isFile() && path.extname(f) === '.py' && fs.readFileSync(f, 'utf8').includes('unittest.TestCase'))) {
      projectInfo.testing.push('unittest');
    }
  }
  
  // Analyze directory structure for deeper understanding
  try {
    const topLevelDirs = fs.readdirSync('.').filter(f => fs.statSync(f).isDirectory());
    
    // Check for typical directories
    if (topLevelDirs.includes('src')) projectInfo.hasSourceDir = true;
    if (topLevelDirs.includes('tests') || topLevelDirs.includes('__tests__')) projectInfo.hasTestsDir = true;
    if (topLevelDirs.includes('docs')) projectInfo.hasDocsDir = true;
    if (topLevelDirs.includes('scripts')) projectInfo.hasScriptsDir = true;
    
    // Look for component patterns in React/Next.js projects
    if (projectInfo.type === 'React' || projectInfo.type === 'Next.js') {
      const componentPatterns = {
        atomic: ['atoms', 'molecules', 'organisms', 'templates'].every(dir => 
          findDir('.', dir)),
        featureBased: findDir('.', 'features'),
        pageBased: findDir('.', 'pages')
      };
      
      if (componentPatterns.atomic) {
        projectInfo.componentPattern = 'Atomic Design';
      } else if (componentPatterns.featureBased) {
        projectInfo.componentPattern = 'Feature-based';
      } else if (componentPatterns.pageBased) {
        projectInfo.componentPattern = 'Page-based';
      }
    }
  } catch (e) {
    // Ignore directory reading errors
  }
  
  return projectInfo;
}

/**
 * Helper function to find a directory recursively
 */
function findDir(baseDir, targetDir, maxDepth = 3) {
  if (maxDepth <= 0) return false;
  
  try {
    const entries = fs.readdirSync(baseDir);
    
    // Check if current level has the target directory
    if (entries.includes(targetDir) && 
        fs.statSync(path.join(baseDir, targetDir)).isDirectory()) {
      return true;
    }
    
    // Check subdirectories
    for (const entry of entries) {
      const fullPath = path.join(baseDir, entry);
      if (fs.statSync(fullPath).isDirectory() && 
          !entry.startsWith('.') && 
          entry !== 'node_modules') {
        if (findDir(fullPath, targetDir, maxDepth - 1)) {
          return true;
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  return false;
}

/**
 * Extract useful context from project documentation
 */
function extractProjectContext() {
  console.log('📄 Extracting project context from documentation...');
  
  let context = "";
  
  // Extract from README
  if (fs.existsSync('README.md')) {
    console.log('  ✓ Found README.md, extracting context');
    const readme = fs.readFileSync('README.md', 'utf8');
    
    // Extract project title
    const titleMatch = readme.match(/^# (.+)$/m);
    if (titleMatch) {
      context += `Project title: ${titleMatch[1]}\n\n`;
    }
    
    // Extract project description
    const descriptionMatch = readme.match(/^# .+\n\n(.+?)(\n\n|$)/m);
    if (descriptionMatch) {
      context += `Project description: ${descriptionMatch[1]}\n\n`;
    }
    
    // Add reference to README
    context += `README.md found in project root.\n`;
  }
  
  // Check for architecture docs
  const docFiles = ['ARCHITECTURE.md', 'docs/architecture.md', 'DESIGN.md', 'docs/design.md'];
  for (const file of docFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✓ Found ${file}, adding reference`);
      context += `Architecture documentation found at ${file}.\n`;
      break;
    }
  }
  
  // Check for contribution guidelines
  if (fs.existsSync('CONTRIBUTING.md')) {
    console.log('  ✓ Found CONTRIBUTING.md, adding reference');
    context += `Contribution guidelines found at CONTRIBUTING.md.\n`;
  }
  
  return context || "No detailed project documentation found.";
}

/**
 * Create necessary directories
 */
function createDirectories() {
  console.log('📁 Creating project directories...');
  
  // Create .mcp directory
  if (!fs.existsSync(CONFIG.memoryDirName)) {
    fs.mkdirSync(CONFIG.memoryDirName);
    console.log(`  ✓ Created ${CONFIG.memoryDirName} directory`);
  } else {
    console.log(`  ✓ ${CONFIG.memoryDirName} directory already exists`);
  }
  
  // Create .mcp/backups directory for memory backups
  const backupDir = path.join(CONFIG.memoryDirName, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
    console.log(`  ✓ Created ${backupDir} directory for memory backups`);
  }
  
  // Create .cursor/rules directory
  if (!fs.existsSync(CONFIG.rulesDirName)) {
    fs.mkdirSync(CONFIG.rulesDirName, { recursive: true });
    console.log(`  ✓ Created ${CONFIG.rulesDirName} directory`);
  } else {
    console.log(`  ✓ ${CONFIG.rulesDirName} directory already exists`);
  }
}

/**
 * Configure Cursor IDE to use MCP with local installation
 */
function configureCursor() {
  console.log('⚙️ Configuring Cursor IDE...');
  
  // Determine OS-specific config directory
  let configDir;
  if (os.platform() === 'win32') {
    configDir = path.join(process.env.APPDATA, 'Cursor', 'User');
  } else if (os.platform() === 'darwin') {
    configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User');
  } else {
    configDir = path.join(os.homedir(), '.config', 'Cursor', 'User');
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Create configuration file
  const memoryFilePath = path.join(process.cwd(), CONFIG.memoryDirName, CONFIG.memoryFileName);
  const configPath = path.join(configDir, 'claude_desktop_config.json');
  
  const config = {
    mcp: {
      server: {
        // Use npx to run from node_modules
        command: `npx modelcontextprotocol-memory-server --port ${CONFIG.mcpPort}`,
        env: {
          MEMORY_FILE_PATH: memoryFilePath
        }
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  ✓ Created Cursor configuration at: ${configPath}`);
}

/**
 * Create utility scripts for memory management
 */
function createMemoryUtilities() {
  console.log('🛠️ Creating memory utilities...');
  
  // Create memory backup script
  const backupScriptPath = path.join(CONFIG.memoryDirName, 'backup-memory.js');
  const backupScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Backup memory file
const memoryFile = path.join('.mcp', 'ai_memory.json');
if (fs.existsSync(memoryFile)) {
  const backupDir = path.join('.mcp', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFile = path.join(backupDir, \`memory-\${timestamp}.json\`);
  
  fs.copyFileSync(memoryFile, backupFile);
  console.log(\`Memory backed up to \${backupFile}\`);
}
`;
  
  fs.writeFileSync(backupScriptPath, backupScript);
  fs.chmodSync(backupScriptPath, '755');
  
  // Create a simple memory explorer script
  const explorerScriptPath = path.join(CONFIG.memoryDirName, 'memory-explorer.js');
  const explorerScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');

const MEMORY_FILE = path.join('.mcp', 'ai_memory.json');
const PORT = 3003;

// Simple HTML memory viewer
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    try {
      const memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
      const entriesHtml = memory.entries.map(entry => \`
        <div class="memory-entry">
          <div class="entry-header">
            <span class="entry-id">\${entry.id}</span>
            <span class="entry-timestamp">\${new Date(entry.timestamp).toLocaleString()}</span>
          </div>
          <div class="entry-content">\${entry.content}</div>
        </div>
      \`).join('');
      
      res.end(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MCP Memory Explorer</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .memory-entry { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
            .entry-header { display: flex; justify-content: space-between; margin-bottom: 10px; color: #666; }
            .entry-id { font-weight: bold; }
            .entry-content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>MCP Memory Explorer</h1>
          <p>Displaying memory entries from \${MEMORY_FILE}</p>
          <div class="memory-entries">
            \${entriesHtml}
          </div>
        </body>
        </html>
      \`);
    } catch (error) {
      res.end(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MCP Memory Explorer - Error</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #c00; }
          </style>
        </head>
        <body>
          <h1>Error</h1>
          <p>Could not read memory file: \${error.message}</p>
        </body>
        </html>
      \`);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(\`Memory Explorer started at http://localhost:\${PORT}\`);
  console.log('Press Ctrl+C to stop');
});
`;
  
  fs.writeFileSync(explorerScriptPath, explorerScript);
  fs.chmodSync(explorerScriptPath, '755');
}

/**
 * Create Cursor workspace settings
 */
function createCursorWorkspaceSettings() {
  console.log('⚙️ Creating Cursor workspace settings...');
  
  const cursorDir = '.cursor';
  const settingsPath = path.join(cursorDir, 'settings.json');
  
  // Create .cursor directory if it doesn't exist
  if (!fs.existsSync(cursorDir)) {
    fs.mkdirSync(cursorDir);
  }
  
  // Create or update settings.json
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      console.log('  ⚠️ Could not parse existing settings.json, creating new one');
    }
  }
  
  // Add AI-specific settings
  settings = {
    ...settings,
    "ai.autoUseContextFiles": true,
    "ai.memoryManagement": {
      "enabled": true,
      "persistMemoryBetweenSessions": true
    },
    "ai.modelResponsiveness": "fast",
    "ai.codeGeneration": {
      "useCompletionForInlineCompletion": true
    }
  };
  
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log(`  ✓ Created Cursor workspace settings at: ${settingsPath}`);
}

/**
 * Perform verification to ensure MCP is working properly
 */
function performVerification() {
  console.log('🔍 Verifying MCP setup...');
  
  // Check memory file exists
  const memoryPath = path.join(CONFIG.memoryDirName, CONFIG.memoryFileName);
  if (fs.existsSync(memoryPath)) {
    console.log(`  ✓ Memory file exists at: ${memoryPath}`);
  } else {
    console.log(`  ⚠️ Memory file not found at: ${memoryPath}`);
  }
  
  // Check package.json scripts
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.mcp) {
      console.log('  ✓ MCP script found in package.json');
    } else {
      console.log('  ⚠️ MCP script not found in package.json');
    }
  } catch (error) {
    console.log('  ⚠️ Could not check package.json for MCP script');
  }
  
  // Check Cursor config
  let configDir;
  if (os.platform() === 'win32') {
    configDir = path.join(process.env.APPDATA, 'Cursor', 'User');
  } else if (os.platform() === 'darwin') {
    configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User');
  } else {
    configDir = path.join(os.homedir(), '.config', 'Cursor', 'User');
  }
  
  const configPath = path.join(configDir, 'claude_desktop_config.json');
  if (fs.existsSync(configPath)) {
    console.log(`  ✓ Cursor configuration found at: ${configPath}`);
  } else {
    console.log(`  ⚠️ Cursor configuration not found at: ${configPath}`);
  }
}

/**
 * Generate project-specific rules based on analysis
 */
function generateRules(projectInfo) {
  console.log('📝 Generating project rules...');
  
  // Create main project rule
  createProjectRule(projectInfo);
  
  // Create specialized rules based on detected patterns
  if (projectInfo.patterns.auth) {
    createAuthRule(projectInfo);
  }
  
  if (projectInfo.patterns.dataManagement) {
    createDataManagementRule(projectInfo);
  }
  
  if (projectInfo.patterns.ui) {
    createUIComponentsRule(projectInfo);
  }
  
  // Create best practices rule
  createBestPracticesRule(projectInfo);
}

/**
 * Create the main project rule file
 */
function createProjectRule(projectInfo) {
  const rulePath = path.join(CONFIG.rulesDirName, 'project-rules.mdc');
  
  // Determine file globs based on project type
  let globs;
  if (projectInfo.type === 'Next.js' || projectInfo.type === 'React') {
    globs = '"**/*.{ts,tsx,js,jsx}"';
  } else if (projectInfo.type === 'Vue') {
    globs = '"**/*.{vue,js,ts}"';
  } else if (projectInfo.type === 'Angular') {
    globs = '"**/*.{ts,html,scss}"';
  } else if (projectInfo.type === 'Python') {
    globs = '"**/*.py"';
  } else {
    globs = '"**/*"';
  }
  
  // Create rule content
  const ruleContent = `---
description: Main project rules and context
globs: ${globs}
---
# ${projectInfo.name} Project Rules

## About This Project

This is a ${projectInfo.type} project ${projectInfo.frameworks.length > 0 ? `with ${projectInfo.frameworks.join(', ')}` : ''}.
${projectInfo.patterns.auth ? `The project uses ${projectInfo.patterns.auth} for authentication.` : ''}
${projectInfo.patterns.dataManagement ? `It uses ${projectInfo.patterns.dataManagement} for data management.` : ''}
${projectInfo.patterns.ui ? `The UI is built with ${projectInfo.patterns.ui}.` : ''}

## Technical Stack

${projectInfo.frameworks.map(fw => `- ${fw}`).join('\n')}
${projectInfo.patterns.auth ? `- ${projectInfo.patterns.auth}` : ''}
${projectInfo.patterns.dataManagement ? `- ${projectInfo.patterns.dataManagement}` : ''}
${projectInfo.patterns.ui ? `- ${projectInfo.patterns.ui}` : ''}

## Project Structure

- Analyze the project structure to understand the organization
- Look for patterns in directory names and file organization
- Understand the relationship between different components

## Rule References

${projectInfo.patterns.auth ? '@file:.cursor/rules/auth-rules.mdc\n' : ''}${projectInfo.patterns.dataManagement ? '@file:.cursor/rules/data-management-rules.mdc\n' : ''}${projectInfo.patterns.ui ? '@file:.cursor/rules/ui-components-rules.mdc\n' : ''}@file:.cursor/rules/best-practices.mdc

## MCP Memory Server Configuration

The Model Context Protocol (MCP) Memory Server is configured to store persistent memories at:
${CONFIG.memoryDirName}/${CONFIG.memoryFileName} (within the project directory)

## Memory Utilization Best Practices

1. **Progressive Memory Building**: Add new memories that enhance understanding of the project's evolution
2. **Contextual Recall**: Reference relevant past decisions when providing recommendations
3. **Implementation Consistency**: Ensure new code suggestions align with established patterns
4. **Documentation Integration**: Reference project requirements in memory usage
5. **Communication Continuity**: Maintain awareness of communication style and preferences

## Coding Standards

1. Follow the established patterns in the codebase
2. Implement proper error handling and validation
3. Write clean, maintainable, and self-documenting code
4. Organize code logically and maintain separation of concerns
5. Follow security best practices for the platform
`;

  fs.writeFileSync(rulePath, ruleContent);
  console.log(`  ✓ Created project rule: ${rulePath}`);
}

/**
 * Create authentication rule file
 */
function createAuthRule(projectInfo) {
  const rulePath = path.join(CONFIG.rulesDirName, 'auth-rules.mdc');
  
  // Determine file globs based on project type
  let globs;
  if (projectInfo.type === 'Next.js' || projectInfo.type === 'React') {
    globs = '"**/auth/**/*.{ts,tsx,js,jsx}"';
  } else if (projectInfo.type === 'Vue') {
    globs = '"**/auth/**/*.{vue,js,ts}"';
  } else if (projectInfo.type === 'Angular') {
    globs = '"**/auth/**/*.{ts,html}"';
  } else if (projectInfo.type === 'Python') {
    globs = '"**/auth/**/*.py"';
  } else {
    globs = '"**/auth/**/*"';
  }
  
  // Create template based on auth provider
  let implementation = '';
  if (projectInfo.patterns.auth === 'Firebase Authentication') {
    implementation = `
### Firebase Authentication

- Use Firebase Authentication methods for user management
- Implement proper error handling for authentication operations
- Follow Firebase best practices for security rules
- Use proper TypeScript types for user objects`;
  } else if (projectInfo.patterns.auth === 'Clerk') {
    implementation = `
### Clerk Integration

- Use Clerk's provided hooks and components for authentication flows
- Follow Clerk's middleware pattern for protected routes
- Implement proper role-based access control using Clerk's user metadata
- Use Clerk's theming capabilities for consistent styling`;
  } else if (projectInfo.patterns.auth === 'Auth0') {
    implementation = `
### Auth0 Integration

- Use Auth0's SDK for authentication flows
- Implement proper role-based access control using Auth0 roles and permissions
- Follow Auth0's best practices for token handling
- Implement proper error handling for authentication operations`;
  } else if (projectInfo.patterns.auth === 'NextAuth.js') {
    implementation = `
### NextAuth.js Integration

- Configure providers appropriate for your application
- Use NextAuth.js session hooks for authentication state
- Implement callbacks for customizing session and JWT handling
- Follow best practices for protected routes`;
  } else {
    implementation = `
### Authentication Implementation

- Implement secure authentication flows
- Use proper error handling for authentication operations
- Follow best practices for token/session management
- Implement proper role-based access control`;
  }
  
  const ruleContent = `---
description: Authentication guidelines and patterns
globs: ${globs}
---
# Authentication Guidelines

## Pattern

Authentication in this project is implemented using ${projectInfo.patterns.auth}.

## Authentication Implementation
${implementation}

## Memory Usage For Authentication

When working with authentication files, apply these specific memory retrieval and application guidelines:

### Authentication Flow Context

- Reference previous implementation details of the authentication flow
- Recall user role management implementation details
- Remember discussions about authentication state persistence

## Best Practices

1. Never store sensitive authentication data in client-side state
2. Implement proper error handling for all authentication operations
3. Use proper types for user and session objects
4. Follow the principle of least privilege for authentication operations
5. Implement proper loading and error states for authentication UI
`;

  fs.writeFileSync(rulePath, ruleContent);
  console.log(`  ✓ Created authentication rule: ${rulePath}`);
}

/**
 * Create data management rule file
 */
function createDataManagementRule(projectInfo) {
  const rulePath = path.join(CONFIG.rulesDirName, 'data-management-rules.mdc');
  
  // Determine file globs based on project type
  let globs;
  if (projectInfo.type === 'Next.js' || projectInfo.type === 'React') {
    globs = '"**/lib/**/*.{ts,js},**/hooks/**/*.{ts,tsx,js,jsx},**/data/**/*.{ts,js}"';
  } else if (projectInfo.type === 'Vue') {
    globs = '"**/store/**/*.{js,ts},**/services/**/*.{js,ts}"';
  } else if (projectInfo.type === 'Angular') {
    globs = '"**/services/**/*.ts,**/store/**/*.ts"';
  } else if (projectInfo.type === 'Python') {
    globs = '"**/models/**/*.py,**/db/**/*.py"';
  } else {
    globs = '"**/data/**/*,**/models/**/*"';
  }
  
  // Create template based on data management pattern
  let implementation = '';
  if (projectInfo.patterns.dataManagement === 'Firebase Firestore') {
    implementation = `
### Firebase Firestore

- Organize Firestore collections by entity type
- Implement proper security rules for data access control
- Use batch operations for related data changes
- Structure data for efficient queries and minimal reads/writes`;
  } else if (projectInfo.patterns.dataManagement === 'React Query') {
    implementation = `
### React Query Integration

- Use React Query hooks for data fetching and caching
- Implement proper query keys for cache management
- Use proper error handling and loading states
- Leverage React Query's background refetching capabilities`;
  } else if (projectInfo.patterns.dataManagement === 'Prisma') {
    implementation = `
### Prisma Integration

- Define clear and comprehensive data models in the schema
- Use Prisma Client for type-safe database queries
- Leverage Prisma's transaction API for related operations
- Implement proper error handling for database operations`;
  } else if (projectInfo.patterns.dataManagement === 'MongoDB (Mongoose)') {
    implementation = `
### Mongoose Integration

- Define clear schema definitions with validation
- Use Mongoose middleware for pre/post operation hooks
- Implement proper indexing for performance
- Use proper error handling for database operations`;
  } else {
    implementation = `
### Data Management Implementation

- Organize data models logically by entity type
- Implement proper data validation
- Use transactions for related data changes
- Implement proper error handling for data operations`;
  }
  
  const ruleContent = `---
description: Data management guidelines and patterns
globs: ${globs}
---
# Data Management Guidelines

## Pattern

Data management in this project primarily uses ${projectInfo.patterns.dataManagement}.

## Data Management Implementation
${implementation}

## Memory Usage For Data Management

When working with data management, apply these memory retrieval and application guidelines:

### Data Model

- Reference the data model structure
- Recall discussions about data properties and relationships
- Remember specific requirements for data validation

### Query Patterns

- Reference established patterns for data access
- Recall discussions about query optimizations
- Remember specific requirements for data filtering and sorting

## Best Practices

1. Implement proper types for all data models
2. Use validation for data integrity
3. Implement proper error handling for all data operations
4. Follow the principle of least privilege for data access
5. Implement optimistic updates for a better user experience
6. Use proper loading and error states for data-dependent UI
7. Minimize data fetching and leverage caching where appropriate
`;

  fs.writeFileSync(rulePath, ruleContent);
  console.log(`  ✓ Created data management rule: ${rulePath}`);
}

/**
 * Create UI components rule file
 */
function createUIComponentsRule(projectInfo) {
  const rulePath = path.join(CONFIG.rulesDirName, 'ui-components-rules.mdc');
  
  // Determine file globs based on project type
  let globs;
  if (projectInfo.type === 'Next.js' || projectInfo.type === 'React') {
    globs = '"**/components/**/*.{tsx,jsx,ts,js}"';
  } else if (projectInfo.type === 'Vue') {
    globs = '"**/components/**/*.vue"';
  } else if (projectInfo.type === 'Angular') {
    globs = '"**/components/**/*.ts,**/components/**/*.html,**/components/**/*.scss"';
  } else {
    globs = '"**/components/**/*,**/ui/**/*"';
  }
  
  // Create template based on UI framework
  let implementation = '';
  if (projectInfo.patterns.ui === 'Tailwind CSS') {
    implementation = `
### Tailwind CSS Usage

- Use Tailwind CSS utility classes for styling
- Implement consistent spacing and sizing patterns
- Use Tailwind's theme extension for project-specific styles
- Follow responsive design best practices`;
  } else if (projectInfo.patterns.ui === 'Material UI') {
    implementation = `
### Material UI Integration

- Use Material UI components for consistent design
- Follow Material Design principles for spacing and layout
- Leverage theme customization for consistent branding
- Use proper component composition patterns`;
  } else if (projectInfo.patterns.ui === 'Chakra UI') {
    implementation = `
### Chakra UI Integration

- Use Chakra UI components for accessible UI elements
- Leverage Chakra's theme for consistent styling
- Use Chakra's layout components for responsive design
- Follow accessibility best practices`;
  } else if (projectInfo.patterns.ui === 'Radix UI') {
    implementation = `
### Radix UI Integration

- Use Radix UI primitives for complex interactive components
- Follow Radix UI's composition pattern for component customization
- Implement proper accessibility features using Radix UI's built-in support
- Use consistent styling patterns with Radix UI components`;
  } else {
    implementation = `
### UI Component Implementation

- Organize components by function and reusability
- Use consistent naming and structural patterns
- Implement proper component composition
- Follow accessibility best practices`;
  }
  
  const ruleContent = `---
description: UI component guidelines and patterns
globs: ${globs}
---
# UI Components Guidelines

## Pattern

UI components in this project are built using ${projectInfo.patterns.ui || 'standard patterns'}.

## UI Implementation

### Component Organization

- Organize components by function and reusability
- Use a consistent naming convention for components
- Implement proper component composition patterns
- Separate presentation components from container components
${implementation}

## Memory Usage For UI Components

When working with UI components, apply these memory retrieval and application guidelines:

### Component Library Usage

- Reference the established patterns for using UI components
- Recall discussions about component customization
- Remember specific requirements for component behavior

### Design System

- Reference the design system guidelines
- Recall discussions about design consistency
- Remember specific requirements for responsive behavior

## Best Practices

1. Implement proper types for all component props
2. Use proper semantic elements for accessibility
3. Implement proper keyboard navigation and focus management
4. Follow a consistent styling pattern
5. Implement proper loading and error states for data-dependent components
6. Use proper animations and transitions where appropriate
7. Implement proper form handling and validation
`;

  fs.writeFileSync(rulePath, ruleContent);
  console.log(`  ✓ Created UI components rule: ${rulePath}`);
}

/**
 * Create best practices rule file
 */
function createBestPracticesRule(projectInfo) {
  const rulePath = path.join(CONFIG.rulesDirName, 'best-practices.mdc');
  
  // Skip if file already exists
  if (fs.existsSync(rulePath)) {
    console.log(`  ✓ Best practices rule already exists: ${rulePath}`);
    return;
  }
  
  // Create best practices based on project type
  let practices = '';
  if (projectInfo.type === 'Next.js') {
    practices = `
Next.js Best Practices:

- Utilize Next.js App Router for improved performance and easier data fetching
- Implement proper error boundaries to handle and display errors gracefully
- Use suspense and concurrent features for efficient data fetching and rendering
- Leverage Next.js built-in optimizations like code splitting and image optimization
- Implement proper server-side rendering and static generation where appropriate

React Best Practices:

- Use functional components and hooks instead of class components for better code organization
- Implement proper use of React.memo and useMemo for performance optimization
- Follow the React hooks rules strictly to avoid common pitfalls
- Utilize context API for efficient state management across components
- Implement proper prop type validation for better code maintainability`;
  } else if (projectInfo.type === 'React') {
    practices = `
React Best Practices:

- Use functional components and hooks instead of class components for better code organization
- Implement proper use of React.memo and useMemo for performance optimization
- Follow the React hooks rules strictly to avoid common pitfalls
- Utilize context API for efficient state management across components
- Implement proper prop type validation for better code maintainability`;
  } else if (projectInfo.type === 'Vue') {
    practices = `
Vue Best Practices:

- Use Vue Composition API for better code organization and reusability
- Implement proper component structure with clear separation of concerns
- Follow Vue's official style guide for consistent code style
- Utilize Vue's reactivity system efficiently
- Implement proper error handling and form validation`;
  } else if (projectInfo.type === 'Angular') {
    practices = `
Angular Best Practices:

- Follow Angular's official style guide for consistent code style
- Implement proper component design with clear inputs and outputs
- Utilize Angular's dependency injection system effectively
- Implement proper error handling and validation
- Use Angular's change detection strategies for performance optimization`;
  } else if (projectInfo.type === 'Python') {
    practices = `
Python Best Practices:

- Follow PEP 8 style guide for consistent code style
- Use type hints for better code documentation and tooling
- Implement proper error handling with try/except blocks
- Use context managers for resource management
- Implement proper logging for debugging and monitoring`;
  } else {
    practices = `
General Best Practices:

- Follow consistent code style and formatting
- Implement proper error handling and validation
- Write clear and comprehensive documentation
- Use meaningful variable and function names
- Write unit tests for critical functionality
- Follow security best practices for the platform`;
  }
  
  // Add framework-specific best practices
  if (projectInfo.patterns.auth === 'Firebase Authentication') {
    practices += `

Firebase Best Practices:

- Use Firebase Authentication for secure user management
- Implement proper Firebase Security Rules for data protection
- Utilize Firebase Firestore for efficient data storage
- Implement proper error handling and offline support with Firebase
- Use Firebase Performance Monitoring for identifying and fixing performance issues`;
  }
  
  if (projectInfo.patterns.ui === 'Tailwind CSS') {
    practices += `

Tailwind CSS Best Practices:

- Use Tailwind CSS for efficient and consistent styling
- Implement proper responsive design using Tailwind's utility classes
- Utilize Tailwind's custom configuration for project-specific styles
- Implement proper accessibility practices with Tailwind's focus and screen reader classes
- Use Tailwind's component extraction patterns for reusable UI elements`;
  }
  
  const ruleContent = `---
description: Best practices to implement for the tech stack used
globs: 
---
${practices}

General Standards:

- Keep components small and focused for better maintainability
- Follow proper state management patterns
- Implement proper testing practices with unit and integration tests
- Use linting and formatting tools for consistent code style and quality
- Implement proper error handling and logging throughout the application
`;

  fs.writeFileSync(rulePath, ruleContent);
  console.log(`  ✓ Created best practices rule: ${rulePath}`);
}

/**
 * Create initial memory file with enhanced context
 */
function createMemoryFile(projectInfo, projectContext) {
  console.log('💾 Creating initial memory file...');
  
  const memoryPath = path.join(CONFIG.memoryDirName, CONFIG.memoryFileName);
  
  // Create initial memory content
  const initialMemory = {
    entries: [
      {
        id: "initial-setup",
        timestamp: new Date().toISOString(),
        content: `MCP Memory Server successfully configured for ${projectInfo.name}. This project uses ${projectInfo.type}${projectInfo.frameworks.length > 0 ? ` with ${projectInfo.frameworks.join(', ')}` : ''}. ${projectInfo.patterns.auth ? `Authentication is handled by ${projectInfo.patterns.auth}.` : ''} ${projectInfo.patterns.dataManagement ? `Data management is handled by ${projectInfo.patterns.dataManagement}.` : ''} ${projectInfo.patterns.ui ? `UI is built with ${projectInfo.patterns.ui}.` : ''}`
      },
      {
        id: "project-context",
        timestamp: new Date().toISOString(),
        content: projectContext
      }
    ]
  };
  
  fs.writeFileSync(memoryPath, JSON.stringify(initialMemory, null, 2));
  console.log(`  ✓ Created enhanced memory file at: ${memoryPath}`);
}

// Run the setup
setupMCP(); 