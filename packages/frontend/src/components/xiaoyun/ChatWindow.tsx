import { useState, useRef, useEffect } from 'react';
import { useXiaoYunStore } from '../../stores/useXiaoYunStore';
import ChatBubble from './ChatBubble';
import PlanCarousel from './PlanCarousel';

interface Props {
  timeRange: { start: string; end: string };
  onClose: () => void;
}

export default function ChatWindow({ timeRange, onClose }: Props) {
  const { messages, plans, isLoading, error, sendMessage, requestAlternatives, applyPlan, clearConversation } = useXiaoYunStore();
  const [input, setInput] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    setShowIntro(false);
    const text = input;
    setInput('');
    await sendMessage(text, { tasks: text, timeRange, constraints: '尽量均匀分配，留出休息时间' });
  };

  const handleReject = async () => {
    setInput('');
    await requestAlternatives('请提供不同的时间安排方案，调整任务顺序和时间分配');
  };

  const handleApply = async (plan: typeof plans[0]) => {
    await applyPlan(plan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 text-sm font-bold">云</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">小云</h3>
            <p className="text-xs text-green-500">在线 · AI 时间助手</p>
          </div>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          onClick={() => { clearConversation(); onClose(); }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {showIntro && messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">☁️</div>
            <p className="text-sm text-gray-500 mb-1">你好！我是小云 👋</p>
            <p className="text-xs text-gray-400">
              告诉我今天要做什么，我会帮你合理安排时间
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['我有3项任务想安排在上午和下午', '帮我均衡分配今天的时间', '我今天要学习、健身、阅读'].map((hint) => (
                <button
                  key={hint}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors"
                  onClick={() => { setInput(hint); }}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 text-xs font-bold">云</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-500 bg-red-50 rounded-xl py-2 px-4">
            {error}
          </div>
        )}

        {/* Plan Carousel */}
        {plans.length > 0 && (
          <PlanCarousel
            plans={plans}
            onSelect={handleApply}
            onReject={handleReject}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 12px, 12px)' }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-sm outline-none focus:bg-gray-50 focus:ring-2 focus:ring-primary-200 transition-all"
            placeholder="描述你今天想做的事情..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0 transition-colors"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
