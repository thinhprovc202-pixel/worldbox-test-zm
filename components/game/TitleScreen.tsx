'use client';

import React, { useState } from 'react';
import { PresetType } from '@/game/generator';
import { Play, Sparkles, Globe, Mountain, Flame, Compass } from 'lucide-react';

interface TitleScreenProps {
  onStart: (worldName: string, preset: PresetType, seed: number, width: number, height: number) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('Thế Giới Khởi Nguyên');
  const [preset, setPreset] = useState<PresetType>('continents');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 900000 + 100000));
  const [mapSize, setMapSize] = useState<'standard' | '4x' | 'huge'>('4x');

  const presets: { id: PresetType; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'continents', name: 'Lục Địa Tự Nhiên', desc: 'Các châu lục xanh mát và đại dương rộng lớn', icon: <Globe className="w-5 h-5 text-emerald-400" /> },
    { id: 'four_kingdoms', name: 'Bốn Vương Quốc', desc: 'Bốn vùng đất cân bằng chia tách bởi eo biển', icon: <Compass className="w-5 h-5 text-blue-400" /> },
    { id: 'islands', name: 'Quần Đảo Rồng', desc: 'Chuỗi đảo nhiệt đới phong phú với nhiều bãi biển', icon: <Sparkles className="w-5 h-5 text-yellow-400" /> },
    { id: 'pangaea', name: 'Đại Lục Pangaea', desc: 'Một siêu lục địa khổng lồ đầy rừng rậm và núi đá', icon: <Mountain className="w-5 h-5 text-stone-400" /> },
    { id: 'volcano', name: 'Vành Đai Núi Lửa', desc: 'Vùng đất dung nham rực lửa với miệng núi lửa trung tâm', icon: <Flame className="w-5 h-5 text-orange-500" /> },
  ];

  const handleStart = () => {
    let w = 200;
    let h = 150;
    if (mapSize === 'standard') {
      w = 100;
      h = 75;
    } else if (mapSize === 'huge') {
      w = 240;
      h = 180;
    }
    onStart(name.trim() || 'Nova Terra', preset, seed, w, h);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center bg-stone-950/95 text-stone-100 p-3 sm:p-4 pt-3 sm:pt-6 pb-28 sm:pb-8 select-none backdrop-blur-sm">
      {/* Background stylized grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#44403c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative max-w-lg w-full bg-stone-900 border-2 border-stone-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/90 flex flex-col gap-3.5 sm:gap-4 my-auto">
        {/* Title lockup */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> God Simulator · World Sandbox 2D
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-medieval drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
            WORLD SIMULATOR
          </h1>
          <p className="text-stone-400 text-[11px] sm:text-xs">
            Tạo dựng thế giới, ban phước cho các giống loài và chứng kiến nền văn minh trỗi dậy.
          </p>
        </div>

        {/* Configuration */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Tên thế giới
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-amber-500"
              placeholder="Nhập tên thế giới..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Quy mô bản đồ (Map Size)
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setMapSize('standard')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                  mapSize === 'standard'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                }`}
              >
                <div className="text-[11px] sm:text-xs font-bold">100 × 75</div>
                <div className="text-[9px] text-stone-400">Tiêu chuẩn</div>
              </button>
              <button
                type="button"
                onClick={() => setMapSize('4x')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all relative ${
                  mapSize === '4x'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                }`}
              >
                <div className="text-[11px] sm:text-xs font-bold">200 × 150</div>
                <div className="text-[9px] text-amber-400 font-semibold">Gấp 4 lần (MVP)</div>
              </button>
              <button
                type="button"
                onClick={() => setMapSize('huge')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                  mapSize === 'huge'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                }`}
              >
                <div className="text-[11px] sm:text-xs font-bold">240 × 180</div>
                <div className="text-[9px] text-stone-400">Khổng lồ</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Hình thái địa hình (World Preset)
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 sm:max-h-40 overflow-y-auto pr-1">
              {presets.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    preset === p.id
                      ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-800/50'
                  }`}
                >
                  <div className="p-1 rounded-md bg-stone-900 border border-stone-800 shrink-0">
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-stone-200 truncate">{p.name}</div>
                    <div className="text-[9px] text-stone-400 line-clamp-1">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-stone-300 uppercase tracking-wider mb-0.5">
                Seed thế giới
              </label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="w-full px-2.5 py-1 bg-stone-950 border border-stone-700 rounded-lg text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 900000 + 100000))}
              className="mt-4 px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-300"
            >
              Ngẫu nhiên
            </button>
          </div>
        </div>

        {/* Start button with safe margin */}
        <div className="pt-1">
          <button
            type="button"
            data-start="true"
            onClick={handleStart}
            className="w-full py-3 px-4 rounded-xl font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-sm tracking-wide"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            BẮT ĐẦU SÁNG THẾ
          </button>
          <div className="text-center text-[10px] text-stone-400 mt-1.5 font-mono">
            Phím tắt: [Space] Dừng/Chạy · [1-5] Tốc độ · [+/-] Phóng to/Thu nhỏ
          </div>
        </div>
      </div>
    </div>
  );
};
