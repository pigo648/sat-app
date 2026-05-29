import type { ChatMessage } from '../../types/task';

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''} chat-message-in`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gradient-to-br from-primary-300 to-primary-500 text-white'
      }`}>
        {isUser ? (
          <span className="text-xs font-bold">我</span>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
        isUser
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-white text-gray-700 rounded-tl-sm shadow-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        {message.plans && message.plans.length > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] bg-gray-100 rounded-full px-2 py-0.5 text-gray-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {message.plans.length} 个时间方案
          </div>
        )}
        <span className={`text-[10px] mt-1.5 block ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
