'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Folder, MessageSquare, User, Bot, ChevronDown, ChevronRight } from 'lucide-react';

interface DateSessionMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DateSessionDetail {
  sessionId: string;
  timestamp: string;
  messages: DateSessionMessage[];
}

interface ProjectDayData {
  projectName: string;
  sessions: DateSessionDetail[];
}

interface DateSessionsResponse {
  date: string;
  projects: ProjectDayData[];
}

export default function DatesPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateData, setDateData] = useState<DateSessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDateData, setLoadingDateData] = useState(false);

  // 展开/收起状态
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // 加载可用日期列表
  useEffect(() => {
    fetch('/api/dates')
      .then(res => res.json())
      .then((dates: string[]) => {
        setAvailableDates(dates);
        if (dates.length > 0 && !selectedDate) {
          // 默认选择最新的日期
          setSelectedDate(dates[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('加载日期列表失败:', err);
        setLoading(false);
      });
  }, []);

  // 加载选定日期的数据
  useEffect(() => {
    if (!selectedDate) return;

    setLoadingDateData(true);
    fetch(`/api/dates/${selectedDate}`)
      .then(res => res.json())
      .then((data: DateSessionsResponse) => {
        setDateData(data);
        // 默认展开所有项目和第一个会话
        const allProjects = new Set(data.projects.map(p => p.projectName));
        setExpandedProjects(allProjects);
        if (data.projects.length > 0 && data.projects[0].sessions.length > 0) {
          setExpandedSessions(new Set([data.projects[0].sessions[0].sessionId]));
        }
        setLoadingDateData(false);
      })
      .catch(err => {
        console.error('加载日期数据失败:', err);
        setLoadingDateData(false);
      });
  }, [selectedDate]);

  // 切换项目展开状态
  const toggleProject = (projectName: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectName)) {
        newSet.delete(projectName);
      } else {
        newSet.add(projectName);
      }
      return newSet;
    });
  };

  // 切换会话展开状态
  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // 展开所有
  const expandAll = () => {
    if (dateData) {
      setExpandedProjects(new Set(dateData.projects.map(p => p.projectName)));
      setExpandedSessions(new Set(dateData.projects.flatMap(p => p.sessions.map(s => s.sessionId))));
    }
  };

  // 收起所有
  const collapseAll = () => {
    setExpandedProjects(new Set());
    setExpandedSessions(new Set());
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500 animate-pulse">加载日期列表...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">按日期查看对话</h1>
            <p className="text-sm text-gray-500">浏览特定日期的所有对话记录</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {availableDates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">暂无对话记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 日期选择器 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="w-4 h-4" />
                    选择日期
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {date} ({new Date(date).toLocaleDateString('zh-CN', { weekday: 'long' })})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 展开/收起按钮 */}
                {dateData && dateData.projects.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={expandAll}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      展开全部
                    </button>
                    <button
                      onClick={collapseAll}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      收起全部
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 日期数据展示 */}
            {loadingDateData ? (
              <div className="text-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">加载对话记录...</p>
              </div>
            ) : dateData?.projects.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>该日期暂无对话记录</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 统计概览 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">
                      {dateData?.projects.reduce((acc, p) => acc + p.sessions.length, 0) || 0}
                    </div>
                    <div className="text-sm text-gray-500">会话总数</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">
                      {dateData?.projects.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">涉及项目</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">
                      {dateData?.projects.reduce(
                        (acc, p) => acc + p.sessions.reduce((sacc, s) => sacc + s.messages.length, 0),
                        0
                      ) || 0}
                    </div>
                    <div className="text-sm text-gray-500">消息总数</div>
                  </div>
                </div>

                {/* 项目对话列表 */}
                {dateData?.projects.map((project) => {
                  const isProjectExpanded = expandedProjects.has(project.projectName);

                  return (
                    <div
                      key={project.projectName}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      {/* 项目标题 - 可点击展开/收起 */}
                      <button
                        onClick={() => toggleProject(project.projectName)}
                        className="w-full bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-blue-500" />
                          <h2 className="font-bold text-gray-900">{project.projectName}</h2>
                          <span className="text-sm text-gray-500">
                            ({project.sessions.length} 个会话)
                          </span>
                        </div>
                        {isProjectExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* 会话列表 */}
                      {isProjectExpanded && (
                        <div className="divide-y divide-gray-50">
                          {project.sessions.map((session) => {
                            const isSessionExpanded = expandedSessions.has(session.sessionId);

                            return (
                              <div key={session.sessionId} className="border-b border-gray-50 last:border-b-0">
                                {/* 会话头部 - 可点击展开/收起 */}
                                <button
                                  onClick={() => toggleSession(session.sessionId)}
                                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 text-sm">
                                    {isSessionExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500">
                                      {new Date(session.timestamp).toLocaleTimeString('zh-CN')}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-mono text-gray-400">
                                      {session.sessionId.slice(0, 12)}...
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-400">
                                      {session.messages.length} 条消息
                                    </span>
                                  </div>
                                </button>

                                {/* 对话内容 */}
                                {isSessionExpanded && (
                                  <div className="px-6 pb-6">
                                    <div className="space-y-4">
                                      {session.messages.map((msg, idx) => (
                                        <div
                                          key={idx}
                                          className={`flex gap-3 ${
                                            msg.role === 'user' ? 'flex-row-reverse' : ''
                                          }`}
                                        >
                                          {/* 头像 */}
                                          <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                              msg.role === 'user'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-purple-100 text-purple-600'
                                            }`}
                                          >
                                            {msg.role === 'user' ? (
                                              <User className="w-4 h-4" />
                                            ) : (
                                              <Bot className="w-4 h-4" />
                                            )}
                                          </div>

                                          {/* 消息内容 */}
                                          <div
                                            className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                                              msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                            }`}
                                          >
                                            {msg.content}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* 会话结束标记 */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                                      <span className="text-xs text-gray-300">— 会话结束 —</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
