import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_BASE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_BASE_DIR, 'projects');
const KNOWLEDGE_DIR = path.join(CLAUDE_BASE_DIR, '_rules', 'sessions');

export interface SessionSummary {
  sessionId: string;
  projectName: string;
  timestamp: string;
  lastMessage: string;
  messageCount: number;
  tokensUsed: number;
  knowledge: boolean;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface SkillStats {
  name: string;
  count: number;
}

export interface ToolStats {
  name: string;
  count: number;
}

export interface AnalysisResult {
  stats: {
    totalSessions: number;
    totalMessages: number;
    lastActive: string;
    projectCount: number;
    totalKnowledge: number;
  };
  recentSessions: SessionSummary[];
  dailyActivity: DailyStats[];
  topSkills: SkillStats[];
  topTools: ToolStats[];
}

export interface MessageDetail {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tools?: { name: string; input: any }[];
}

export interface SessionDetail {
  sessionId: string;
  projectName: string;
  messages: MessageDetail[];
  knowledgeContent?: string;
}

export interface KnowledgeItem {
  title: string;
  observation: string;
  rule: string;
  scope: string;
}

export interface KnowledgeSummary {
  sessionId: string;
  title: string;
  preview: string;
  date: string;
  items: KnowledgeItem[];
}

export async function getHistoryOverview(): Promise<AnalysisResult> {
  const stats = {
    totalSessions: 0,
    totalMessages: 0,
    lastActive: '',
    projectCount: 0,
    totalKnowledge: 0,
  };

  const sessions: SessionSummary[] = [];
  const skillCounts = new Map<string, number>();
  const toolCounts = new Map<string, number>();

  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      return { stats, sessions: [], dailyActivity: [], topSkills: [], topTools: [] };
    }

    // Read knowledge files once for efficiency
    const knowledgeSet = new Set<string>();
    if (fs.existsSync(KNOWLEDGE_DIR)) {
      const knowledgeFiles = fs.readdirSync(KNOWLEDGE_DIR);
      knowledgeFiles.forEach(file => {
        if (file.endsWith('.md')) {
          knowledgeSet.add(file.replace('.md', ''));
        }
      });
    }
    stats.totalKnowledge = knowledgeSet.size;

    const projectDirs = fs.readdirSync(PROJECTS_DIR);
    stats.projectCount = projectDirs.length;

    for (const projectDirName of projectDirs) {
      const fullProjectDirPath = path.join(PROJECTS_DIR, projectDirName);
      if (!fs.statSync(fullProjectDirPath).isDirectory()) continue;

      const displayProjectName = projectDirName.split('-').pop() || projectDirName;

      const files = fs.readdirSync(fullProjectDirPath);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && f !== 'sessions-index.json');

      for (const file of jsonlFiles) {
        const filePath = path.join(fullProjectDirPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        let timestamp = '';
        let sessionId = '';
        let messageCount = 0;
        let lastUserMessage = '';

        // First pass: extract session metadata (sessionId, timestamp)
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (!sessionId && data.sessionId) sessionId = data.sessionId;
                if (!timestamp && data.timestamp) timestamp = data.timestamp;
                if (sessionId && timestamp) break;
            } catch(e) {}
        }

        // Second pass: count messages and tools
        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.type === 'user' || data.role === 'user') {
              messageCount++;
              if (data.message?.content) {
                 lastUserMessage = typeof data.message.content === 'string'
                   ? data.message.content
                   : (Array.isArray(data.message.content) && data.message.content.length > 0 && data.message.content[0].text)
                     ? data.message.content[0].text
                     : data.display || '';
              } else {
                 lastUserMessage = data.display || '';
              }
            }

            // Expanded check for assistant messages
            if (data.role === 'assistant' || data.type === 'assistant') {
              messageCount++;
              // Analyze tool usage
               const contentArray = data.message?.content || data.content;
               if (contentArray && Array.isArray(contentArray)) {
                for (const block of contentArray) {
                  if (block.type === 'tool_use') {
                    const toolName = block.name;
                    toolCounts.set(toolName, (toolCounts.get(toolName) || 0) + 1);

                    if (toolName === 'Skill' && block.input?.skill) {
                       const skillName = block.input.skill;
                       skillCounts.set(skillName, (skillCounts.get(skillName) || 0) + 1);
                    }
                  }
                }
              }
            }
          } catch (e) {
            // ignore parse errors
          }
        }

        if (timestamp) {
          stats.totalSessions++;
          stats.totalMessages += messageCount;

          sessions.push({
            sessionId,
            projectName: displayProjectName,
            timestamp,
            lastMessage: lastUserMessage,
            messageCount,
            tokensUsed: 0,
            knowledge: knowledgeSet.has(sessionId)
          });
        }
      }
    }

    sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (sessions.length > 0) {
      stats.lastActive = sessions[0].timestamp;
    }

    const activityMap = new Map<string, number>();
    sessions.forEach(session => {
      const date = new Date(session.timestamp).toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    const dailyActivity: DailyStats[] = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topSkills: SkillStats[] = Array.from(skillCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topTools: ToolStats[] = Array.from(toolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentSessions = sessions.slice(0, 10);

    return {
      stats,
      recentSessions,
      dailyActivity,
      topSkills,
      topTools
    };

  } catch (error) {
    console.error("Error reading Claude history:", error);
    return { stats, sessions: [], dailyActivity: [], topSkills: [], topTools: [] };
  }
}

export async function getSessionKnowledge(sessionId: string): Promise<string | null> {
  const knowledgePath = path.join(KNOWLEDGE_DIR, `${sessionId}.md`);
  if (fs.existsSync(knowledgePath)) {
    return fs.readFileSync(knowledgePath, 'utf-8');
  }
  return null;
}

export async function getAllKnowledgeSummaries(): Promise<KnowledgeSummary[]> {
  const summaries: KnowledgeSummary[] = [];

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    return [];
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const sessionId = file.replace('.md', '');

    // Extract date if available
    const dateMatch = content.match(/> Date:\s*(.+)$/m);
    const date = dateMatch ? dateMatch[1].trim() : '';

    // Parse items
    const items: KnowledgeItem[] = [];
    const blocks = content.split(/^---$/m);
    
    for (const block of blocks) {
      if (!block.trim()) continue;
      
      const itemTitleMatch = block.match(/^#{2,3}\s+(.+)$/m);
      if (!itemTitleMatch) continue;
      
      const itemTitle = itemTitleMatch[1].replace(/💡\s*/, '').trim();
      
      const observationMatch = block.match(/-\s+\*\*Observation\*\*:\s*(.+)$/m);
      const ruleMatch = block.match(/-\s+\*\*Rule\*\*:\s*(.+)$/m);
      const scopeMatch = block.match(/-\s+\*\*Scope\*\*:\s*(.+)$/m);
      
      if (observationMatch || ruleMatch) {
        items.push({
          title: itemTitle,
          observation: observationMatch ? observationMatch[1].trim() : '',
          rule: ruleMatch ? ruleMatch[1].trim() : '',
          scope: scopeMatch ? scopeMatch[1].trim() : 'Global'
        });
      }
    }

    const title = items.length > 0 ? items[0].title : 'Untitled Knowledge';
    const preview = items.length > 0 ? items[0].observation || items[0].rule : '';

    summaries.push({
      sessionId,
      title,
      preview,
      date,
      items
    });
  }

  return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getSessionDetail(targetSessionId: string): Promise<SessionDetail | null> {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return null;
  }

  const projectDirs = fs.readdirSync(PROJECTS_DIR);

  for (const projectDirName of projectDirs) {
    const fullProjectDirPath = path.join(PROJECTS_DIR, projectDirName);
    if (!fs.statSync(fullProjectDirPath).isDirectory()) continue;

    const files = fs.readdirSync(fullProjectDirPath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && f !== 'sessions-index.json');

    for (const file of jsonlFiles) {
      const filePath = path.join(fullProjectDirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      let currentFileSessionId = '';
      const messages: MessageDetail[] = [];

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (!currentFileSessionId && data.sessionId) currentFileSessionId = data.sessionId;

          // Critical Fix: Use sessionId from the line itself if available, fallback to file guess
          const lineSessionId = data.sessionId || currentFileSessionId;

          if (lineSessionId === targetSessionId) {
             const timestamp = data.timestamp || '';

             if (data.type === 'user' || data.role === 'user') {
                let text = '';
                // Try multiple paths for content
                if (data.message?.content) {
                    text = typeof data.message.content === 'string'
                        ? data.message.content
                        : (Array.isArray(data.message.content) && data.message.content.length > 0 && data.message.content[0].text)
                           ? data.message.content[0].text
                           : data.display || '';
                } else if (data.display) {
                    text = data.display;
                }

                messages.push({
                  role: 'user',
                  content: text,
                  timestamp
                });
             }

             // Check both role and type just in case
             if (data.role === 'assistant' || data.type === 'assistant') {
                let text = '';
                const tools: { name: string; input: any }[] = [];
                // CORRECTED PATH: data.message.content with fallback
                const contentArray = data.message?.content || data.content;

                if (contentArray && Array.isArray(contentArray)) {
                  for (const block of contentArray) {
                    if (block.type === 'text') {
                      text += block.text;
                    }
                    if (block.type === 'tool_use') {
                      tools.push({
                        name: block.name,
                        input: block.input
                      });
                    }
                  }
                }

                // Only push if there IS content or tools
                if (text.trim() || tools.length > 0) {
                  messages.push({
                    role: 'assistant',
                    content: text,
                    timestamp,
                    tools
                  });
                }
             }
          }
        } catch (e) {
           // ignore
        }
      }

      // Check if we found ANY messages for this session
      if (messages.length > 0) {
        const detail: SessionDetail = {
          sessionId: targetSessionId,
          projectName: projectDirName.split('-').pop() || projectDirName,
          messages
        };

        const knowledgeContent = await getSessionKnowledge(targetSessionId);
        if (knowledgeContent) {
          detail.knowledgeContent = knowledgeContent;
        }

        return detail;
      }
    }
  }
  return null;
}

export function getProjectsList(): string[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  const projectDirs = fs.readdirSync(PROJECTS_DIR);
  return projectDirs
    .filter(dir => fs.statSync(path.join(PROJECTS_DIR, dir)).isDirectory())
    .map(dir => dir.split('-').pop() || dir);
}

export async function searchByToolOrSkill(type: 'tool' | 'skill', name: string) {
  const results: SessionSummary[] = [];

  if (!fs.existsSync(PROJECTS_DIR)) return [];

  const projectDirs = fs.readdirSync(PROJECTS_DIR);

  for (const projectDirName of projectDirs) {
    const fullProjectDirPath = path.join(PROJECTS_DIR, projectDirName);
    if (!fs.statSync(fullProjectDirPath).isDirectory()) continue;

    const displayProjectName = projectDirName.split('-').pop() || projectDirName;

    const files = fs.readdirSync(fullProjectDirPath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && f !== 'sessions-index.json');

    for (const file of jsonlFiles) {
      const filePath = path.join(fullProjectDirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      let timestamp = '';
      let sessionId = '';
      let messageCount = 0;
      let lastUserMessage = '';
      let hasMatch = false;

      // First pass: extract session metadata
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (!sessionId && data.sessionId) sessionId = data.sessionId;
          if (!timestamp && data.timestamp) timestamp = data.timestamp;
          if (sessionId && timestamp) break;
        } catch(e) {}
      }

      // Second pass: check for match
      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.type === 'user' || data.role === 'user') {
            messageCount++;
            if (data.message?.content) {
               lastUserMessage = typeof data.message.content === 'string'
                 ? data.message.content
                 : (Array.isArray(data.message.content) && data.message.content.length > 0 && data.message.content[0].text)
                   ? data.message.content[0].text
                   : data.display || '';
            } else {
               lastUserMessage = data.display || '';
            }
          }

          if (data.role === 'assistant' || data.type === 'assistant') {
            messageCount++;

            const contentArray = data.message?.content || data.content;
            if (contentArray && Array.isArray(contentArray)) {
              for (const block of contentArray) {
                if (block.type === 'tool_use') {
                  const toolName = block.name;
                  if (type === 'tool' && toolName === name) {
                    hasMatch = true;
                  }
                  if (type === 'skill' && toolName === 'Skill' && block.input?.skill === name) {
                    hasMatch = true;
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      if (hasMatch && timestamp) {
        // Read knowledge files for matching sessions too
        const knowledgeSet = new Set<string>();
        if (fs.existsSync(KNOWLEDGE_DIR)) {
          const knowledgeFiles = fs.readdirSync(KNOWLEDGE_DIR);
          knowledgeFiles.forEach(file => {
            if (file.endsWith('.md')) {
              knowledgeSet.add(file.replace('.md', ''));
            }
          });
        }

        results.push({
          sessionId,
          projectName: displayProjectName,
          timestamp,
          lastMessage: lastUserMessage,
          messageCount,
          tokensUsed: 0,
          knowledge: knowledgeSet.has(sessionId)
        });
      }
    }
  }

  return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
