'use client';

import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  MessageSquare,
  FolderGit2,
  Clock,
  Wrench,
  Zap,
  X,
  Loader2,
  Brain,
  User,
  Bot,
  Terminal,
  ExternalLink,
  Target,
  FileText,
  Calendar
} from 'lucide-react';
import { Markdown } from '@/app/components/Markdown';

interface Stats {
  totalSessions: number;
  totalMessages: number;
  lastActive: string;
  projectCount: number;
  totalKnowledge: number;
}

interface Session {
  sessionId: string;
  projectName: string;
  timestamp: string;
  lastMessage: string;
  messageCount: number;
  knowledge: boolean;
}

interface DailyData {
  date: string;
  count: number;
}

interface SkillStats {
  name: string;
  count: number;
}

interface ToolStats {
  name: string;
  count: number;
}

interface DashboardData {
  stats: Stats;
  recentSessions: Session[];
  dailyActivity: DailyData[];
  topSkills: SkillStats[];
  topTools: ToolStats[];
}

interface MessageDetail {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tools?: { name: string; input: any }[];
}

interface SessionDetail {
  sessionId: string;
  projectName: string;
  messages: MessageDetail[];
  knowledgeContent?: string;
}

interface KnowledgeItem {
  title: string;
  observation: string;
  rule: string;
  scope: string;
}

interface KnowledgeSummary {
  sessionId: string;
  title: string;
  preview: string;
  date: string;
  items: KnowledgeItem[];
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalMaxWidth, setModalMaxWidth] = useState('max-w-2xl');

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const openSessionModal = async (sessionId: string) => {
    setModalOpen(true);
    setModalTitle("会话详情: " + sessionId);
    setModalContent(null);
    setLoadingModal(true);
    setModalMaxWidth('max-w-4xl');

    try {
      const res = await fetch("/api/sessions/" + sessionId);
      const detail: SessionDetail = await res.json();

      setModalContent(
        <div className="space-y-6">
          {detail.knowledgeContent && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-6">
              <h4 className="flex items-center gap-2 text-amber-800 font-bold mb-4">
                <Brain className="w-5 h-5" />
                提取的知识/规则
              </h4>
              <div className="bg-white/50 rounded-lg p-4 border border-amber-200/50">
                <Markdown content={detail.knowledgeContent} />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-bold text-gray-700 flex items-center gap-2 px-2">
              <MessageSquare className="w-4 h-4" />
              对话历史
            </h4>
            <div className="space-y-4">
              {detail.messages
                .filter(msg => {
                  if (msg.role === 'assistant') {
                    return (msg.content && msg.content.trim().length > 0) || (msg.tools && msg.tools.length > 0);
                  }
                  return true;
                })
                .map((msg, idx) => (
                  <div key={idx} className={"flex gap-3 " + (msg.role === 'user' ? 'flex-row-reverse' : '')}>
                    <div className={"w-8 h-8 rounded-full flex items-center justify-center shrink-0 " + (
                      msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className="max-w-[85%] space-y-2">
                      {msg.content && (
                        <div className={"p-3 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm " + (
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        )}>
                          {msg.content}
                        </div>
                      )}
                      {msg.tools && msg.tools.map((tool, tIdx) => (
                        <div key={tIdx} className="bg-gray-900 rounded-lg overflow-hidden text-xs border border-gray-800">
                          <div className="bg-gray-800 px-2 py-1 flex items-center gap-2 text-gray-400 font-mono border-b border-gray-700">
                            <Terminal className="w-3 h-3 text-green-400" />
                            <span>{tool.name}</span>
                          </div>
                          <div className="p-2 text-gray-300 font-mono overflow-x-auto max-h-40">
                            <pre>{JSON.stringify(tool.input, null, 2)}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <Link 
              href={"/sessions/" + sessionId}
              className="text-sm flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
            >
              在独立页面查看完整日志 <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      );
    } catch (e) {
      setModalContent(<div className="text-red-500 text-center py-10">加载失败，请重试</div>);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleChartClick = async (clickedData: any, type: 'tool' | 'skill') => {
    if (!clickedData || !clickedData.activeLabel) return;
    const name = clickedData.activeLabel;

    setModalOpen(true);
    setModalTitle((type === 'tool' ? '工具' : '技能') + ": " + name);
    setModalContent(null);
    setLoadingModal(true);
    setModalMaxWidth('max-w-2xl');

    try {
      const res = await fetch("/api/search?type=" + type + "&name=" + encodeURIComponent(name));
      const results = await res.json();

      setModalContent(
        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {results.length === 0 ? (
             <div className="text-gray-500 text-center py-8">未找到相关记录</div>
          ) : (
             results.map((r: any) => (
               <button 
                  onClick={() => openSessionModal(r.sessionId)}
                  key={r.sessionId} 
                  className="text-left p-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 transition-all group"
               >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded group-hover:bg-white">{r.projectName}</span>
                      {r.knowledge && (
                        <div className="flex items-center" title="包含知识提取">
                          <Brain className="w-3 h-3 text-amber-500" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(r.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 truncate">{r.lastMessage || '(无消息)'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-600">{r.messageCount} 条消息</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      点击查看详情 <ExternalLink className="w-2 h-2" />
                    </span>
                  </div>
               </button>
             ))
          )}
        </div>
      );
    } catch (e) {
      setModalContent(<div className="text-red-500 text-center py-10">加载失败，请重试</div>);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleProjectClick = async () => {
    setModalOpen(true);
    setModalTitle('活跃项目列表');
    setModalContent(null);
    setLoadingModal(true);
    setModalMaxWidth('max-w-2xl');

    try {
      const res = await fetch("/api/search?type=project");
      const projects = await res.json();

      setModalContent(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {projects.map((p: string) => (
             <div key={p} className="p-3 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm text-gray-700 break-all">
                {p}
             </div>
          ))}
        </div>
      );
    } catch (e) {
      setModalContent(<div className="text-red-500 text-center py-10">加载失败</div>);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleKnowledgeClick = async () => {
    setModalOpen(true);
    setModalTitle('沉淀知识库');
    setModalContent(null);
    setLoadingModal(true);
    setModalMaxWidth('max-w-3xl');

    try {
      const res = await fetch("/api/knowledge");
      const knowledge: KnowledgeSummary[] = await res.json();

      setModalContent(
        <div className="grid grid-cols-1 gap-6 max-h-[70vh] overflow-y-auto pr-2">
          {knowledge.length === 0 ? (
             <div className="text-gray-500 text-center py-12">
               <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p>尚未提取任何知识条目</p>
             </div>
          ) : (
            knowledge.map((session) => (
              <div
                key={session.sessionId}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-gray-600">源会话: {session.sessionId.slice(0, 8)}...</span>
                  </div>
                  <button 
                    onClick={() => openSessionModal(session.sessionId)}
                    className="text-[10px] text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200"
                  >
                    查看详情 <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                
                <div className="p-5 space-y-4">
                  {session.items.map((item, idx) => (
                    <div key={idx} className="space-y-3 pb-4 last:pb-0 border-b last:border-0 border-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg shrink-0 mt-0.5">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h6 className="font-bold text-gray-800 text-sm">{item.title}</h6>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {session.date || 'Unknown'}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">
                              {item.scope}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pl-9">
                        {item.observation && (
                          <div className="bg-gray-50 rounded-lg p-3 text-xs leading-relaxed text-gray-600">
                             <div className="flex items-center gap-1 font-bold text-gray-400 mb-1 uppercase tracking-wider text-[9px]">
                               <FileText className="w-2.5 h-2.5" /> Observation
                             </div>
                             {item.observation}
                          </div>
                        )}
                        {item.rule && (
                          <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-3 text-xs leading-relaxed text-amber-900 shadow-inner">
                             <div className="flex items-center gap-1 font-bold text-amber-400 mb-1 uppercase tracking-wider text-[9px]">
                               <Zap className="w-2.5 h-2.5" /> Core Rule
                             </div>
                             {item.rule}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      );
    } catch (e) {
      setModalContent(<div className="text-red-500 py-10 text-center">加载知识库失败</div>);
    } finally {
      setLoadingModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500 animate-pulse font-medium">扫描神经记忆中...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Claude Echo</h1>
            <p className="text-gray-500 mt-1">认知交互分析与进化洞察</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dates"
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
            >
              <Calendar className="w-4 h-4" />
              按日期查看
            </Link>
            <div className="text-sm text-gray-400">
              v0.2.2 深度洞察版
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            icon={<MessageSquare className="w-5 h-5 text-blue-500" />}
            label="会话总数"
            value={data.stats.totalSessions}
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-green-500" />}
            label="消息总数"
            value={data.stats.totalMessages}
          />
           <StatCard
            icon={<FolderGit2 className="w-5 h-5 text-purple-500" />}
            label="活跃项目"
            value={data.stats.projectCount}
            clickable
            onClick={handleProjectClick}
          />
          <StatCard
            icon={<Brain className="w-5 h-5 text-amber-500" />}
            label="沉淀知识"
            value={data.stats.totalKnowledge}
            clickable
            onClick={handleKnowledgeClick}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-orange-500" />}
            label="最近活跃"
            value={new Date(data.stats.lastActive).toLocaleDateString()}
            subtext={new Date(data.stats.lastActive).toLocaleTimeString()}
          />
        </div>

        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            交互节奏
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{fill: '#3b82f6', strokeWidth: 2}}
                  activeDot={{r: 6}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Tools Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gray-400" />
                常用工具 Top 10 <span className="text-xs font-normal text-gray-400 ml-2">(点击查看详情)</span>
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topTools}
                    layout="vertical"
                    margin={{ left: 40 }}
                    onClick={(d) => handleChartClick(d, 'tool')}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{fill: '#4b5563', fontSize: 12}}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                       cursor={{fill: '#f9fafb'}}
                       contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Skills Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-gray-400" />
                常用技能 Top 10 <span className="text-xs font-normal text-gray-400 ml-2">(点击查看详情)</span>
              </h2>
               {data.topSkills && data.topSkills.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topSkills}
                      layout="vertical"
                      margin={{ left: 40 }}
                      onClick={(d) => handleChartClick(d, 'skill')}
                      style={{ cursor: 'pointer' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{fill: '#4b5563', fontSize: 12}}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                         cursor={{fill: '#f9fafb'}}
                         contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
               ) : (
                 <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                    <Zap className="w-12 h-12 mb-2 opacity-20" />
                    <p>暂未检测到技能使用</p>
                 </div>
               )}
            </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最近对话</h2>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-amber-500" /> 包含知识</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentSessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => openSessionModal(session.sessionId)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {session.projectName}
                    </span>
                    {session.knowledge && (
                      <Brain className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(session.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 truncate font-medium">
                    {session.lastMessage || "(无用户消息)"}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                  {session.messageCount} 条消息
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className={"bg-white rounded-2xl shadow-2xl w-full " + modalMaxWidth + " overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]"} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-lg truncate pr-4">{modalTitle}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                  <p>Searching...</p>
                </div>
              ) : (
                modalContent
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, label, value, subtext, clickable, onClick }: { icon: any, label: string, value: string | number, subtext?: string, clickable?: boolean, onClick?: () => void }) {
  return (
    <div
      className={"bg-white p-6 rounded-xl shadow-sm border border-gray-100 " + (clickable ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : '')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
        {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
      </div>
    </div>
  );
}
