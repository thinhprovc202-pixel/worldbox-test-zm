import React from 'react';
import { 
  Globe, 
  Sparkles, 
  Crown, 
  Zap, 
  Search,
  Droplets,
  Trees,
  Mountain,
  Flame,
  Sun,
  ShieldAlert,
  Heart,
  Skull,
  Bomb,
  CloudRain,
  User,
  Swords,
  Coins,
  Home,
  Wind,
  Wheat,
  Castle,
  Pickaxe,
  Anchor
} from 'lucide-react';
import { GodCategory, GodPowerId, Species, TileType } from '../game/types';

export interface ActiveTool {
  category: GodCategory;
  subType: string;
}

interface ToolbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  brushSize: number;
  onSetBrushSize: (size: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  brushSize,
  onSetBrushSize,
}) => {
  const categories: { id: GodCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'inspect', label: 'Soi xét', icon: <Search className="w-4 h-4" /> },
    { id: 'terrain', label: 'Địa hình', icon: <Globe className="w-4 h-4" /> },
    { id: 'creatures', label: 'Sinh vật', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'civilization', label: 'Văn minh', icon: <Crown className="w-4 h-4" /> },
    { id: 'powers', label: 'Quyền năng', icon: <Zap className="w-4 h-4" /> },
  ];

  const terrainTools: { id: TileType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'deep_water', label: 'Nước sâu', icon: <Droplets className="w-4 h-4" />, color: 'bg-blue-800' },
    { id: 'shallow_water', label: 'Nước nông', icon: <Droplets className="w-4 h-4" />, color: 'bg-sky-500' },
    { id: 'sand', label: 'Bãi cát', icon: <Sun className="w-4 h-4" />, color: 'bg-yellow-400 text-stone-900' },
    { id: 'plains', label: 'Đồng bằng', icon: <Trees className="w-4 h-4" />, color: 'bg-emerald-500' },
    { id: 'forest', label: 'Rừng rậm', icon: <Trees className="w-4 h-4" />, color: 'bg-green-700' },
    { id: 'mountain', label: 'Núi đá', icon: <Mountain className="w-4 h-4" />, color: 'bg-stone-500' },
    { id: 'snow', label: 'Băng tuyết', icon: <Mountain className="w-4 h-4" />, color: 'bg-slate-200 text-stone-900' },
    { id: 'lava', label: 'Dung nham', icon: <Flame className="w-4 h-4" />, color: 'bg-orange-600' },
  ];

  const creatureTools: { id: Species; label: string; icon: string; desc: string }[] = [
    { id: 'human', label: 'Con người', icon: '🧑', desc: 'Cân bằng & xây dựng vương quốc' },
    { id: 'elf', label: 'Tiên tộc', icon: '🧝', desc: 'Thân thiện với thiên nhiên, nhanh nhẹn' },
    { id: 'orc', label: 'Người Orc', icon: '👹', desc: 'Chiến binh quả cảm, thích chiến đấu' },
    { id: 'dwarf', label: 'Người Lùn', icon: '🧔', desc: 'Thợ rèn dũng mãnh, phòng thủ kiên cố' },
    { id: 'sheep', label: 'Cừu', icon: '🐑', desc: 'Động vật hiền lành, gặm cỏ' },
    { id: 'wolf', label: 'Sói hoang', icon: '🐺', desc: 'Kẻ săn mồi hung hãn theo đàn' },
    { id: 'bear', label: 'Gấu rừng', icon: '🐻', desc: 'Quái thú dũng mãnh bảo vệ lãnh thổ' },
    { id: 'dragon', label: 'Rồng lửa', icon: '🐉', desc: 'Chúa tể bầu trời, phun lửa' },
  ];

  const civTools: { id: string; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'civ_found', label: 'Tạo Làng', icon: <User className="w-4 h-4 text-emerald-400" />, desc: 'Biến dân cư thành người sáng lập làng mới' },
    { id: 'civ_house', label: 'Nhà ở', icon: <Home className="w-4 h-4 text-amber-400" />, desc: 'Đặt nhà ở kiến trúc WorldBox (mái ngói đa tầng, tường đá, dây leo)' },
    { id: 'civ_windmill', label: 'Cối xay gió', icon: <Wind className="w-4 h-4 text-sky-400" />, desc: 'Đặt cối xay gió WorldBox 4 cánh quay và gieo ruộng lúa mì vàng' },
    { id: 'civ_farm', label: 'Nông trại', icon: <Wheat className="w-4 h-4 text-yellow-500" />, desc: 'Đặt trang trại lúa mì và nhà kho nông dân' },
    { id: 'civ_watchtower', label: 'Tháp canh', icon: <Castle className="w-4 h-4 text-purple-400" />, desc: 'Đặt tháp canh gỗ và đá phòng thủ' },
    { id: 'civ_mine', label: 'Hầm mỏ', icon: <Pickaxe className="w-4 h-4 text-stone-400" />, desc: 'Đặt hầm mỏ khai thác đá quý, vàng, sắt, mithril' },
    { id: 'civ_docks', label: 'Bến cảng', icon: <Anchor className="w-4 h-4 text-cyan-400" />, desc: 'Đặt bến cảng hạ thủy thuyền vượt biển' },
    { id: 'civ_war', label: 'Tuyên Chiến', icon: <Swords className="w-4 h-4 text-red-500" />, desc: 'Khiến các vương quốc thù địch và mở chiến tranh' },
    { id: 'civ_peace', label: 'Hòa Bình', icon: <ShieldAlert className="w-4 h-4 text-blue-400" />, desc: 'Ký hiệp ước đình chiến lập lại trật tự' },
    { id: 'civ_resources', label: 'Ban Tài Nguyên', icon: <Coins className="w-4 h-4 text-amber-400" />, desc: 'Tặng 50 gỗ, đá và lương thực cho làng gần nhất' },
  ];

  const powerTools: { id: GodPowerId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'meteor', label: 'Thiên thạch', icon: <Flame className="w-4 h-4" />, color: 'hover:border-orange-500 hover:text-orange-400' },
    { id: 'lightning', label: 'Sấm sét', icon: <Zap className="w-4 h-4" />, color: 'hover:border-sky-400 hover:text-sky-300' },
    { id: 'healing_rain', label: 'Mưa hồi máu', icon: <Heart className="w-4 h-4" />, color: 'hover:border-emerald-400 hover:text-emerald-300' },
    { id: 'fire', label: 'Lửa cháy', icon: <Flame className="w-4 h-4" />, color: 'hover:border-red-500 hover:text-red-400' },
    { id: 'water_rain', label: 'Mưa dập lửa', icon: <CloudRain className="w-4 h-4" />, color: 'hover:border-blue-400 hover:text-blue-300' },
    { id: 'nuke', label: 'Bom nguyên tử', icon: <Bomb className="w-4 h-4" />, color: 'hover:border-yellow-400 hover:text-yellow-300' },
    { id: 'blessing', label: 'Ban phước', icon: <Sun className="w-4 h-4" />, color: 'hover:border-amber-300 hover:text-amber-200' },
    { id: 'bloodlust', label: 'Cuồng nộ', icon: <Skull className="w-4 h-4" />, color: 'hover:border-rose-500 hover:text-rose-400' },
    { id: 'earthquake', label: 'Động đất', icon: <Mountain className="w-4 h-4" />, color: 'hover:border-stone-400 hover:text-stone-300' },
  ];

  const brushSizes = [
    { size: 0, label: '1x1' },
    { size: 1, label: '3x3' },
    { size: 2, label: '5x5' },
    { size: 3, label: '7x7' },
  ];

  return (
    <div className="fixed bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-4xl w-[96vw] flex flex-col items-center gap-1.5 select-none pointer-events-none">
      {/* Floating Brush Size Selector (Positioned above toolbar in the red-marked zone) */}
      {(activeTool.category === 'terrain' || activeTool.category === 'powers') && (
        <div className="pointer-events-auto flex items-center gap-1 bg-stone-900/95 border border-stone-700/80 rounded-xl px-2.5 py-1 shadow-lg shadow-black/70 backdrop-blur-md">
          <span className="text-[11px] text-amber-400 font-mono font-bold tracking-wider mr-0.5">Cọ:</span>
          {brushSizes.map(b => (
            <button
              key={b.size}
              type="button"
              onClick={() => onSetBrushSize(b.size)}
              className={`px-2 py-0.5 text-xs font-mono rounded-lg font-bold transition-all active:scale-95 ${
                brushSize === b.size
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800 bg-stone-950/80 border border-stone-800'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Toolbar Container (Hugging the bottom edge near the black-marked zone) */}
      <div className="pointer-events-auto w-full bg-stone-900/95 border border-stone-800 text-stone-100 rounded-2xl shadow-2xl shadow-black/90 p-2 sm:p-2.5 backdrop-blur-md flex flex-col gap-1.5">
        {/* Category Tabs: full width, clean, uncluttered */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 border-b border-stone-800/80">
          {categories.map(c => {
            const isActive = activeTool.category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  let defaultSub = '';
                  if (c.id === 'terrain') defaultSub = 'plains';
                  else if (c.id === 'creatures') defaultSub = 'human';
                  else if (c.id === 'civilization') defaultSub = 'civ_found';
                  else if (c.id === 'powers') defaultSub = 'meteor';
                  onSelectTool({ category: c.id, subType: defaultSub });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

      {/* Sub-tools selection list */}
      <div className="pt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {activeTool.category === 'inspect' && (
          <div className="flex items-center gap-2 py-1 px-3 text-xs text-stone-300">
            <Search className="w-4 h-4 text-amber-400" />
            <span>Nhấp vào bất kỳ sinh vật, làng mạc, vương quốc hoặc ô đất trên bản đồ để soi xét thông số chi tiết.</span>
          </div>
        )}

        {activeTool.category === 'terrain' &&
          terrainTools.map(t => {
            const isSelected = activeTool.subType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTool({ category: 'terrain', subType: t.id })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-stone-800 border-amber-400 text-white ring-1 ring-amber-400'
                    : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${t.color} inline-block`} />
                <span>{t.label}</span>
              </button>
            );
          })}

        {activeTool.category === 'creatures' &&
          creatureTools.map(c => {
            const isSelected = activeTool.subType === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectTool({ category: 'creatures', subType: c.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-stone-800 border-amber-400 text-white ring-1 ring-amber-400'
                    : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span className="text-base">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}

        {activeTool.category === 'civilization' &&
          civTools.map(c => {
            const isSelected = activeTool.subType === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectTool({ category: 'civilization', subType: c.id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-stone-800 border-amber-400 text-white ring-1 ring-amber-400'
                    : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            );
          })}

        {activeTool.category === 'powers' &&
          powerTools.map(p => {
            const isSelected = activeTool.subType === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectTool({ category: 'powers', subType: p.id })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'bg-stone-800 border-amber-400 text-white ring-1 ring-amber-400'
                    : `bg-stone-950/80 border-stone-800 text-stone-300 ${p.color}`
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            );
          })}
      </div>
    </div>
  </div>
);
};
