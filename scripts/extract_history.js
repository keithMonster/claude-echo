const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_BASE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_BASE_DIR, 'projects');
const TARGET_DIR = path.join(CLAUDE_BASE_DIR, '_history');

// 确保目标目录存在
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

console.log(`Scanning projects in: ${PROJECTS_DIR}`);
console.log(`Extracting history to: ${TARGET_DIR}`);

function processFile(filePath, projectName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    let sessionId = '';
    const messages = [];
    let startTime = '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (!sessionId && data.sessionId) sessionId = data.sessionId;
        if (!startTime && data.timestamp) startTime = data.timestamp;

        // 提取消息逻辑
        if (data.type === 'user' || data.role === 'user') {
            let text = '';
            if (data.message && data.message.content) {
                 if (typeof data.message.content === 'string') {
                     text = data.message.content;
                 } else if (Array.isArray(data.message.content)) {
                     text = data.message.content.map(b => b.text || '').join('');
                 }
            } else if (data.display) {
                text = data.display;
            }
            // 有些旧格式可能直接在 content 字段
            else if (data.content && typeof data.content === 'string') {
                text = data.content;
            }

            messages.push({
                role: 'user',
                content: text,
                timestamp: data.timestamp
            });
        }
        else if (data.role === 'assistant' || data.type === 'assistant') {
            // 构造助手消息对象
            const result = {
                role: 'assistant',
                timestamp: data.timestamp,
                content: '',
                tools: []
            };

            const contentArray = data.message?.content || data.content;

            if (Array.isArray(contentArray)) {
                for (const block of contentArray) {
                    if (block.type === 'text') {
                        result.content += block.text;
                    }
                    if (block.type === 'tool_use') {
                        result.tools.push({
                            name: block.name,
                            input: block.input,
                            id: block.id
                        });
                    }
                }
            } else if (typeof contentArray === 'string') {
                result.content = contentArray;
            }

            // 只有当有实际内容或工具调用时才保存
            if (result.content || result.tools.length > 0) {
                messages.push(result);
            }
        }

      } catch (e) {
        // ignore parse error for single line
      }
    }

    if (sessionId && messages.length > 0) {
      const sessionDir = path.join(TARGET_DIR, sessionId);
      if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true });
      }

      const sessionData = {
          sessionId,
          projectName,
          startTime,
          messageCount: messages.length,
          messages
      };

      fs.writeFileSync(
          path.join(sessionDir, 'session.json'),
          JSON.stringify(sessionData, null, 2)
      );

      return true;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
  return false;
}

function scanAndExtract() {
  if (!fs.existsSync(PROJECTS_DIR)) {
      console.log('Projects directory not found.');
      return;
  }

  const projectDirs = fs.readdirSync(PROJECTS_DIR);
  let totalSessions = 0;

  for (const projectDirName of projectDirs) {
    const fullProjectDirPath = path.join(PROJECTS_DIR, projectDirName);
    if (!fs.statSync(fullProjectDirPath).isDirectory()) continue;

    const displayProjectName = projectDirName.split('-').pop() || projectDirName;
    console.log(`Processing project: ${displayProjectName}`);

    const files = fs.readdirSync(fullProjectDirPath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && f !== 'sessions-index.json');

    for (const file of jsonlFiles) {
        if (processFile(path.join(fullProjectDirPath, file), displayProjectName)) {
            totalSessions++;
        }
    }
  }

  console.log(`Extraction complete. Processed ${totalSessions} sessions.`);
}

scanAndExtract();
