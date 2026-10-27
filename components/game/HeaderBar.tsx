'use client';

import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Scale, 
  Save, 
  RotateCcw,
  Users,
  Castle,
  Home
} from 'lucide-react';

interface HeaderBarProps {
  worldName: string;
  year: number;
  totalPopulation: number;
  kingdomCount: number;
  villageCount: number;
  simSpeed: number; // 0 = paused, 1 = 1x, 2 = 2x, 5 = 5x
  onSetSpeed: (speed: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHistory: () => void;
  onOpenLaws: () => void;
  onOpenSaveLoad: () => void;
  onResetWorld: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  worldName,
  year,
  totalPopulation,
  kingdomCount,
  villageCount,
  simSpeed,
  onSetSpeed,
  soundEnabled,
  onToggleSound,
  onOpenHistory,
  onOpenLaws,
  onOpenSaveLoad,
  onResetWorld,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-stone-900/90 border-b border-stone-800 text-stone-100 flex items-center justify-between px-3 sm:px-4 select-none backdrop-blur-md">
      {/* World Identity & Year */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medieval text-base sm:text-lg font-bold text-amber-400 tracking-wide truncate max-w-[140px] sm:max-w-xs">
              {worldName}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-stone-800 border border-stone-700 text-stone-300">
              Năm {year}
            </span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
            Kỷ Nguyên Sáng Thế
          </span>
        </div>
      </div>

      {/* World Stats Badges */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950/70 border border-stone-800 text-xs font-mono text-stone-200">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>Dân số: <strong className="text-white">{totalPopulation}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950/70 border border-stone-800 text-xs font-mono text-stone-200">
          <Castle className="w-3.5 h-3.5 text-amber-400" />
          <span>Vương quốc: <strong className="text-white">{kingdomCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950/70 border border-stone-800 text-xs font-mono text-stone-200">
          <Home className="w-3.5 h-3.5 text-emerald-400" />
          <span>Làng: <strong className="text-white">{villageCount}</strong></span>
        </div>
      </div>

      {/* Time & Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Speed cluster */}
        <div className="flex items-center bg-stone-950 rounded-lg p-0.5 border border-stone-800">
          <button
            type="button"
            aria-label="Tạm dừng mô phỏng"
            onClick={() => onSetSpeed(0)}
            className={`p-1.5 rounded-md transition-colors ${
              simSpeed === 0 ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Tốc độ 1x"
            onClick={() => onSetSpeed(1)}
            className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
              simSpeed === 1 ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            1x
          </button>
          <button
            type="button"
            aria-label="Tốc độ 2x"
            onClick={() => onSetSpeed(2)}
            className={`px-2 py-1 text-xs font-mono rounded-md transition-colors ${
              simSpeed === 2 ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            2x
          </button>
          <button
            type="button"
            aria-label="Tốc độ 5x"
            onClick={() => onSetSpeed(5)}
            className={`p-1.5 rounded-md transition-colors flex items-center gap-0.5 ${
              simSpeed === 5 ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">5x</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="h-6 w-px bg-stone-800 mx-0.5" />

        <button
          type="button"
          aria-label="Mở Sử ký thế giới"
          onClick={onOpenHistory}
          title="Sử ký & Lịch sử sự kiện"
          className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          type="button"
          aria-label="Mở Luật thế giới"
          onClick={onOpenLaws}
          title="Luật mô phỏng thế giới"
          className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
        >
          <Scale className="w-4 h-4" />
        </button>

        <button
          type="button"
          aria-label="Lưu hoặc tải bản đồ"
          onClick={onOpenSaveLoad}
          title="Lưu & Tải thế giới"
          className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          type="button"
          aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          onClick={onToggleSound}
          title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
        </button>

        <button
          type="button"
          aria-label="Tạo thế giới mới"
          onClick={onResetWorld}
          title="Tạo thế giới mới"
          className="p-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-400 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
