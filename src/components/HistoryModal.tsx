import React, { useState } from 'react';
import { X, BookOpen, Crown, Swords, Sparkles, Trees, Flame } from 'lucide-react';
import { HistoryEvent } from '../game/types';

interface HistoryModalProps {
  events: HistoryEvent[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ events, onClose }) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.category === filter);

  const getCategoryIcon = (category: HistoryEvent['category']) => {
    switch (category) {
      case 'kingdom':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />;
      case 'war':
        return <Swords className="w-3.5 h-3.5 text-red-400" />;
      case 'god':
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case 'nature':
      default:
        return <Trees className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none backdrop-blur-sm">
      <div className="relative max-w-xl w-full bg-stone-900 border-2 border-stone-800 text-stone-100 rounded-2xl shadow-2xl shadow-black flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg font-bold text-stone-100">
              Sử Ký Thế Giới (Chronicles)
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng sử ký"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-950/60 border-b border-stone-800 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'kingdom', label: 'Vương quốc' },
            { id: 'war', label: 'Chiến tranh' },
            { id: 'god', label: 'Quyền năng thần' },
            { id: 'nature', label: 'Tự nhiên' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === f.id
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events Timeline */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs">
              Chưa có sự kiện lịch sử nào được ghi nhận.
            </div>
          ) : (
            filteredEvents.map(e => (
              <div
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 hover:border-stone-700 transition-colors"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-stone-900 border border-stone-800 shrink-0">
                  {getCategoryIcon(e.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-stone-200 truncate">{e.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-amber-400/90 shrink-0">
                      Năm {e.year}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">{e.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
