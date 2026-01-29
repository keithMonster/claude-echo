import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_BASE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_BASE_DIR, 'projects');

export interface SessionSummary {
  sessionId: string;
  projectName: string;
  timestamp: string;
  lastMessage: string;
  messageCount: number;
  tokensUsed: number;
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
  };
  recentSessions: SessionSummary[];
  dailyActivity: DailyStats[];
  topSkills: SkillStats[];
  topTools: ToolStats[];
}

export async function getHistoryOverview(): Promise<AnalysisResult> {
  const stats = {
    totalSessions: 0,
    totalMessages: 0,
    lastActive: '',
    projectCount: 0,
  };

  const sessions: SessionSummary[] = [];
  const skillCounts = new Map<string, number>();
  const toolCounts = new Map<string, number>();

  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      return { stats, sessions: [], dailyActivity: [], topSkills: [], topTools: [] };
    }

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

        let messageCount = 0;
        let lastUserMessage = '';
        let timestamp = '';
        let sessionId = '';

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (!sessionId && data.sessionId) sessionId = data.sessionId;
            if (!timestamp && data.timestamp) timestamp = data.timestamp;

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

            if (data.role === 'assistant') {
              messageCount++;
              // Analyze tool usage
               if (data.content && Array.isArray(data.content)) {
                for (const block of data.content) {
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
            tokensUsed: 0
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

    // Process top skills
    const topSkills: SkillStats[] = Array.from(skillCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Process top tools
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
