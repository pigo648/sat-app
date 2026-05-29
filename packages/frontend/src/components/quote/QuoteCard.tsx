import type { Quote } from '../../types/task';

interface Props {
  quote: Quote;
}

export default function QuoteCard({ quote }: Props) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 animate-slide-up">
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-primary-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 leading-relaxed italic">"{quote.text}"</p>
            <p className="text-xs text-primary-500 mt-2 font-medium">—— {quote.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
