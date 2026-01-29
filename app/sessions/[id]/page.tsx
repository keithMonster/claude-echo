'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Bot, Terminal, Wrench } from 'lucide-react';
import { useParams } from 'next/navigation';

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
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/sessions/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500 animate-pulse">加载记忆详情...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-xl text-red-500 mb-4">{error || 'Session not found'}</div>
        <Link href="/" className="text-blue-500 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
               <h1 className="text-lg font-bold text-gray-900 truncate">
                 {session.sessionId}
               </h1>
               <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {session.projectName}
               </span>
            </div>
          </div>
        </div>
      </header>

      {/* Message List */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {session.messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] space-y-2`}>
              {/* Text Content */}
              {msg.content && (
                <div className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              )}

              {/* Tool Usage Display */}
              {msg.tools && msg.tools.length > 0 && (
                <div className="space-y-2 mt-2">
                  {msg.tools.map((tool, tIdx) => (
                    <div key={tIdx} className="bg-gray-900 rounded-lg overflow-hidden text-sm border border-gray-800 shadow-sm">
                       <div className="bg-gray-800 px-3 py-2 flex items-center gap-2 text-gray-300 font-mono text-xs border-b border-gray-700">
                          <Terminal className="w-3 h-3 text-green-400" />
                          <span className="font-semibold text-white">{tool.name}</span>
                       </div>
                       <div className="p-3 text-gray-300 font-mono text-xs overflow-x-auto">
                          <pre>{JSON.stringify(tool.input, null, 2)}</pre>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {session.messages.length === 0 && (
           <div className="text-center py-20 text-gray-400">
              Session log is empty or failed to parse.
           </div>
        )}
      </div>
    </main>
  );
}
