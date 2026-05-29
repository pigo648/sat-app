import { useState, useRef, useEffect } from 'react';
import { useXiaoYunStore } from '../../stores/useXiaoYunStore';
import ChatBubble from './ChatBubble';
import PlanCarousel from './PlanCarousel';
import VoiceInput from './VoiceInput';

interface Props {
  timeRange: { start: string; end: string };
  onClose: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深了，还在为明天做规划吗？';
  if (h < 9) return '早上好！新的一天，让小云帮你规划吧～';
  if (h < 12) return '上午好！精力最充沛的时候，适合安排重要任务哦～';
  if (h < 14) return '中午好！记得吃点东西补充能量～';
  if (h < 18) return '下午好！下午适合处理一些中等强度的任务～';
  return '晚上好！今天辛苦啦，看看还有什么需要安排的～';
}

export default function ChatWindow({ timeRange, onClose }: Props) {
  const { messages, plans, isLoading, error, sendMessage, requestAlternatives, applyPlan, clearConversation } = useXiaoYunStore();
  const [input, setInput] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, plans, isLoading, showFeedbackInput]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    setShowIntro(false);
    const text = input;
    setInput('');
    await sendMessage(text, { tasks: text, timeRange, constraints: '尽量均匀分配，留出休息时间' });
  };

  const handleReject = () => {
    setShowFeedbackInput(true);
    setFeedbackText('');
  };

  const handleSubmitFeedback = async () => {
    const fb = feedbackText.trim() || '请提供不同的时间安排方案，调整任务顺序和时间分配';
    setShowFeedbackInput(false);
    setFeedbackText('');
    await requestAlternatives(fb);
  };

  const handleCancelFeedback = () => {
    setShowFeedbackInput(false);
    setFeedbackText('');
  };

  const handleApply = async (plan: typeof plans[0]) => {
    await applyPlan(plan);
    onClose();
  };

  const handleVoiceResult = (transcript: string) => {
    setInput((prev) => prev + transcript);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17l5.59-5.59L17 10l-7 7z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">小云</h3>
            <p className="text-xs text-green-500">在线 · 你的时间管家</p>
          </div>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
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
          <div className="text-center py-8 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">{getGreeting()}</p>
            <p className="text-xs text-gray-400">
              告诉我今天想做什么，我会帮你合理安排时间
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                '我有3项任务想安排在上午和下午',
                '帮我均衡分配今天的时间',
                '我今天要学习、健身、阅读',
              ].map((hint) => (
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
            <div className="w-8 h-8 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-500">小云正在思考...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-500 bg-red-50 rounded-xl py-2 px-4">
            {error}
          </div>
        )}

        {/* Feedback Input */}
        {showFeedbackInput && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100 animate-slide-up">
            <p className="text-sm text-gray-600 mb-2">告诉小云哪里不满意，我会重新帮你规划～</p>
            <textarea
              className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-primary-200 resize-none"
              rows={3}
              placeholder="例如：任务太密集了、想在上午完成重要任务、需要更多休息时间..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 px-4 py-2 rounded-full text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={handleCancelFeedback}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-full text-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                onClick={handleSubmitFeedback}
              >
                提交反馈
              </button>
            </div>
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
          <VoiceInput
            onResult={handleVoiceResult}
            isListening={isListening}
            onListeningChange={setIsListening}
            disabled={isLoading}
          />
          <input
            type="text"
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-sm outline-none focus:bg-gray-50 focus:ring-2 focus:ring-primary-200 transition-all"
            placeholder={isListening ? '正在聆听...' : '描述你今天想做的事情...'}
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
