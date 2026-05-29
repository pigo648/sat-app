import type { ChatMessage } from '../../types/task';

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''} chat-message-in`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
      }`}>
        <span className="text-xs font-bold">{isUser ? '我' : '云'}</span>
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
        isUser
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-white text-gray-700 rounded-tl-sm shadow-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        {message.plans && message.plans.length > 0 && (
          <div className="mt-2 text-xs opacity-70">
            +{message.plans.length} 个方案
          </div>
        )}
        <span className={`text-[10px] mt-1 block ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
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
