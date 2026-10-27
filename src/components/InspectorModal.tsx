'use client';

import React from 'react';
import { X, Heart, Shield, Swords, Zap, Skull, Award, Crown, Home, Sparkles, MapPin } from 'lucide-react';
import { Entity, Kingdom, TileType, Village } from '../game/types';

interface InspectorModalProps {
  entity?: Entity;
  village?: Village;
  kingdom?: Kingdom;
  tileInfo?: { x: number; y: number; type: TileType };
  onClose: () => void;
  onBlessEntity?: (entityId: string) => void;
  onStrikeEntity?: (entityId: string) => void;
  onHealEntity?: (entityId: string) => void;
}

const SPECIES_ICONS: Record<string, string> = {
  human: '🧑 Con người',
  elf: '🧝 Tiên tộc',
  orc: '👹 Người Orc',
  dwarf: '🧔 Người Lùn',
  sheep: '🐑 Cừu',
  wolf: '🐺 Sói hoang',
  bear: '🐻 Gấu rừng',
  dragon: '🐉 Rồng lửa',
};

const TILE_NAMES: Record<TileType, string> = {
  deep_water: 'Đại dương sâu',
  shallow_water: 'Vùng nước nông ven bờ',
  sand: 'Bờ cát vàng',
  plains: 'Đồng cỏ xanh tươi',
  forest: 'Rừng rậm nguyên sinh',
  mountain: 'Dãy núi đá hiểm trở',
  snow: 'Đỉnh núi phủ tuyết trắng',
  lava: 'Dòng dung nham nóng chảy',
};

export const InspectorModal: React.FC<InspectorModalProps> = ({
  entity,
  village,
  kingdom,
  tileInfo,
  onClose,
  onBlessEntity,
  onStrikeEntity,
  onHealEntity,
}) => {
  if (!entity && !village && !kingdom && !tileInfo) return null;

  return (
    <div className="fixed top-16 right-4 z-40 w-80 sm:w-96 bg-stone-900/95 border-2 border-stone-800 text-stone-100 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-md flex flex-col select-none max-h-[85vh]">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-950/80 border-b border-stone-800">
        <div className="flex items-center gap-2">
          {entity && <Sparkles className="w-4 h-4 text-amber-400" />}
          {village && !entity && <Home className="w-4 h-4 text-emerald-400" />}
          {kingdom && !village && !entity && <Crown className="w-4 h-4 text-amber-400" />}
          {tileInfo && !entity && !village && !kingdom && <MapPin className="w-4 h-4 text-blue-400" />}
          <span className="font-medieval text-sm font-bold text-stone-200">
            {entity ? 'Thông tin Sinh vật' : village ? 'Thông tin Làng mạc' : kingdom ? 'Thông tin Vương quốc' : 'Thông tin Địa hình'}
          </span>
        </div>
        <button
          type="button"
          aria-label="Đóng bảng thông tin"
          onClick={onClose}
          className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {/* ENTITY CARD */}
        {entity && (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medieval text-lg font-bold text-amber-400 flex items-center gap-1.5">
                  {entity.name}
                  {kingdom && (
                    <span
                      className="w-3 h-3 rounded-full inline-block border border-white/40"
                      style={{ backgroundColor: kingdom.bannerColor }}
                      title={`Vương quốc ${kingdom.name}`}
                    />
                  )}
                </h3>
                <div className="text-xs text-stone-400 font-medium">
                  {SPECIES_ICONS[entity.species] || entity.species} · {entity.gender === 'M' ? 'Nam' : 'Nữ'} · {entity.age} tuổi
                </div>
                {village ? (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                      <Home className="w-3 h-3" /> Dân làng: {village.name}
                    </span>
                    {village.leaderId === entity.id && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 border border-amber-500/50 text-amber-300">
                        <Crown className="w-3 h-3" /> Trưởng làng
                        {village.leaderSinceYear !== undefined && ` · từ năm ${village.leaderSinceYear}`}
                      </span>
                    )}
                    {entity.recruitedAtSpawn && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Được kết nạp vào làng nhờ quy luật đồng tộc 80%">
                        ✦ Đã kết nạp (80%)
                      </span>
                    )}
                    {entity.onBoat && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-950/80 border border-sky-600/60 text-sky-300">
                        ⛵ Hải hành trên thuyền Carrack
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-800 text-stone-400">
                      🏕️ Tự do (Kẻ du mục)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Cấp {entity.level}
                </span>
                <span className="text-[10px] text-stone-400 mt-1">Trạng thái: <strong>{entity.state}</strong></span>
              </div>
            </div>

            {/* Health & Hunger meters */}
            <div className="space-y-2 bg-stone-950 p-3 rounded-xl border border-stone-800/80">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 text-red-400 font-medium">
                    <Heart className="w-3.5 h-3.5 fill-red-400" /> Sinh lực (HP)
                  </span>
                  <span className="font-mono text-xs">{entity.health} / {entity.maxHealth}</span>
                </div>
                <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (entity.health / entity.maxHealth) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    🍖 Độ no
                  </span>
                  <span className="font-mono text-xs">{entity.hunger}%</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, entity.hunger))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Combat Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Swords className="w-3 h-3 text-red-400" /> Sát thương
                </div>
                <div className="font-mono text-sm font-bold text-white mt-0.5">{entity.attackPower}</div>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" /> Giáp
                </div>
                <div className="font-mono text-sm font-bold text-white mt-0.5">{entity.defense}</div>
              </div>
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                <div className="text-[10px] text-stone-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-yellow-400" /> Đã diệt
                </div>
                <div className="font-mono text-sm font-bold text-white mt-0.5">{entity.kills}</div>
              </div>
            </div>

            {/* Traits */}
            {entity.traits.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Đặc tính bẩm sinh (Traits)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entity.traits.map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-800 border border-stone-700 text-stone-200"
                    >
                      ✦ {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* God Actions on Entity */}
            <div className="pt-2 border-t border-stone-800 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onHealEntity?.(entity.id)}
                className="py-1.5 px-2 rounded-lg bg-emerald-950/70 border border-emerald-700/60 hover:bg-emerald-900 text-emerald-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Heart className="w-3 h-3" /> Hồi máu
              </button>
              <button
                type="button"
                onClick={() => onBlessEntity?.(entity.id)}
                className="py-1.5 px-2 rounded-lg bg-amber-950/70 border border-amber-700/60 hover:bg-amber-900 text-amber-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Ban phước
              </button>
              <button
                type="button"
                onClick={() => onStrikeEntity?.(entity.id)}
                className="py-1.5 px-2 rounded-lg bg-red-950/70 border border-red-700/60 hover:bg-red-900 text-red-300 text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3" /> Sét đánh
              </button>
            </div>
          </div>
        )}

        {/* VILLAGE CARD */}
        {village && (
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <div>
              <h4 className="font-['MedievalSharp'] text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <Home className="w-4 h-4" /> {village.name}
              </h4>
              <div className="text-xs text-stone-400">
                Dân số: <strong className="text-white">{village.population}</strong> / {village.maxPopulation} · Lãnh thổ: {village.territory.length} ô
              </div>
            </div>

            {/* Resources breakdown */}
            <div className="grid grid-cols-4 gap-1.5 bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block">🌲 Gỗ</span>
                <strong className="text-amber-200">{village.resources.wood}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">🪨 Đá</span>
                <strong className="text-stone-300">{village.resources.stone}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">🍞 Lương</span>
                <strong className="text-yellow-400">{village.resources.food}</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">🪙 Vàng</span>
                <strong className="text-amber-400">{village.resources.gold}</strong>
              </div>
            </div>

            {/* Buildings list */}
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                Công trình ({village.buildings.length})
              </span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {village.buildings.map((b, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-300">
                    {b.type === 'town_hall' ? '🏰 Tòa thị chính' : b.type === 'house' ? '🏠 Nhà ở' : b.type === 'farm' ? '🌾 Ruộng lúa' : '🗼 Tháp canh'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KINGDOM CARD */}
        {kingdom && (
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full inline-block border border-white"
                  style={{ backgroundColor: kingdom.bannerColor }}
                />
                <h4 className="font-['MedievalSharp'] text-base font-bold text-amber-400">
                  Vương quốc {kingdom.name}
                </h4>
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Chủng tộc: <strong>{kingdom.species}</strong> · Thành lập từ Năm {kingdom.createdAtYear}
              </div>
            </div>

            {kingdom.enemyKingdomIds.length > 0 && (
              <div className="bg-red-950/40 border border-red-800/80 p-2 rounded-lg text-xs text-red-300 flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Đang chiến tranh với {kingdom.enemyKingdomIds.length} vương quốc đối địch!</span>
              </div>
            )}
          </div>
        )}

        {/* TILE INFO */}
        {tileInfo && !entity && !village && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-stone-200">
              Tọa độ: ({tileInfo.x}, {tileInfo.y})
            </h4>
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300">
              Địa hình: <strong className="text-amber-400">{TILE_NAMES[tileInfo.type] || tileInfo.type}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
