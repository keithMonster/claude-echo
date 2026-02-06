import React from 'react';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  // Simple markdown-ish rendering since we don't have react-markdown
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold mt-3 mb-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-md font-bold mt-2 mb-1">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="mb-1 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}
