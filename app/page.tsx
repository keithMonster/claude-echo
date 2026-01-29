'use client';

import { useEffect, useState } from 'react';
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
  Zap
} from 'lucide-react';

interface Stats {
  totalSessions: number;
  totalMessages: number;
  lastActive: string;
  projectCount: number;
}

interface Session {
  sessionId: string;
  projectName: string;
  timestamp: string;
  lastMessage: string;
  messageCount: number;
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

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500 animate-pulse">Scanning Neural Memories...</div>
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
          <div className="text-sm text-gray-400">
            v0.1.1 功能更新版
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                常用工具 Top 10
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topTools} layout="vertical" margin={{ left: 40 }}>
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
                常用技能 Top 10
              </h2>
               {data.topSkills && data.topSkills.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topSkills} layout="vertical" margin={{ left: 40 }}>
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
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-lg font-semibold">最近对话</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentSessions.map((session) => (
              <div key={session.sessionId} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {session.projectName}
                    </span>
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
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: any, label: string, value: string | number, subtext?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
