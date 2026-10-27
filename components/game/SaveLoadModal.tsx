'use client';

import React, { useRef } from 'react';
import { X, Download, Upload, Bookmark, Sparkles } from 'lucide-react';
import { WorldSimulation } from '@/game/simulation';

interface SaveLoadModalProps {
  sim: WorldSimulation;
  onLoadWorldData: (data: unknown) => void;
  onClose: () => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ sim, onLoadWorldData, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const data = {
      version: 1,
      name: sim.name,
      seed: sim.seed,
      width: sim.width,
      height: sim.height,
      year: sim.year,
      tickCount: sim.tickCount,
      worldLaws: sim.worldLaws,
      tiles: sim.tiles,
      entities: sim.entities,
      villages: sim.villages,
      kingdoms: sim.kingdoms,
      historyEvents: sim.historyEvents,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sim.name.toLowerCase().replace(/\s+/g, '_')}_year_${sim.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToLocalStorage = () => {
    const data = {
      version: 1,
      name: sim.name,
      seed: sim.seed,
      width: sim.width,
      height: sim.height,
      year: sim.year,
      tickCount: sim.tickCount,
      worldLaws: sim.worldLaws,
      tiles: sim.tiles,
      entities: sim.entities,
      villages: sim.villages,
      kingdoms: sim.kingdoms,
      historyEvents: sim.historyEvents,
    };
    try {
      localStorage.setItem('worldbox_quick_save', JSON.stringify(data));
      alert('Đã lưu tiến trình thế giới vào bộ nhớ trình duyệt!');
    } catch {
      alert('Không đủ dung lượng bộ nhớ lưu trữ trình duyệt. Vui lòng chọn Tải tệp JSON về máy.');
    }
  };

  const handleLoadFromLocalStorage = () => {
    const raw = localStorage.getItem('worldbox_quick_save');
    if (!raw) {
      alert('Chưa có bản lưu nào trong bộ nhớ trình duyệt!');
      return;
    }
    try {
      const data = JSON.parse(raw);
      onLoadWorldData(data);
      onClose();
    } catch {
      alert('Lỗi đọc bản lưu từ trình duyệt.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string;
        const data = JSON.parse(text);
        onLoadWorldData(data);
        onClose();
      } catch {
        alert('Tệp JSON không hợp lệ hoặc bị hỏng.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-stone-900 border-2 border-stone-800 text-stone-100 rounded-2xl shadow-2xl shadow-black flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg font-bold text-stone-100">
              Lưu & Tải Thế Giới
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng lưu tải"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick save browser buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              Bộ nhớ trình duyệt (Local Storage)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSaveToLocalStorage}
                className="py-2.5 px-3 rounded-xl bg-stone-950 border border-stone-700 hover:bg-stone-800 text-xs font-semibold text-stone-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Lưu nhanh
              </button>
              <button
                type="button"
                onClick={handleLoadFromLocalStorage}
                className="py-2.5 px-3 rounded-xl bg-stone-950 border border-stone-700 hover:bg-stone-800 text-xs font-semibold text-stone-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-emerald-400" />
                Tải bản lưu nhanh
              </button>
            </div>
          </div>

          <div className="h-px bg-stone-800 my-2" />

          {/* Export/Import JSON */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              Tệp tin máy tính (JSON)
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20"
              >
                <Download className="w-4 h-4" />
                Xuất tệp JSON về máy (.json)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-950 border border-stone-700 hover:bg-stone-800 text-xs font-semibold text-stone-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                Nhập bản lưu từ tệp JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
