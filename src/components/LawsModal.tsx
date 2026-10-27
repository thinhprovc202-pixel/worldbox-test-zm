'use client';

import React from 'react';
import { X, Scale, Check } from 'lucide-react';
import { WorldLaws } from '../game/types';

interface LawsModalProps {
  laws: WorldLaws;
  onUpdateLaws: (laws: WorldLaws) => void;
  onClose: () => void;
}

export const LawsModal: React.FC<LawsModalProps> = ({ laws, onUpdateLaws, onClose }) => {
  const toggleLaw = (key: keyof WorldLaws) => {
    onUpdateLaws({
      ...laws,
      [key]: !laws[key],
    });
  };

  const lawItems: { key: keyof WorldLaws; title: string; desc: string }[] = [
    {
      key: 'hunger',
      title: 'Đói khát (Hunger)',
      desc: 'Sinh vật cần ăn lương thực hoặc gặm cỏ để duy trì sinh lực; đói lâu sẽ mất máu và chết.',
    },
    {
      key: 'aging',
      title: 'Lão hóa & Tuổi thọ (Aging)',
      desc: 'Sinh vật tăng tuổi theo năm tháng và có thể qua đời vì già yếu (trừ sinh vật có đặc tính Bất tử).',
    },
    {
      key: 'kingdomWars',
      title: 'Chiến tranh Vương quốc (Kingdom Wars)',
      desc: 'Các vương quốc có thể mâu thuẫn ranh giới, tuyên chiến và tiến quân xâm chiếm lẫn nhau.',
    },
    {
      key: 'peacefulMode',
      title: 'Chế độ Thái bình (Peaceful Mode)',
      desc: 'Vô hiệu hóa mọi hiềm khích và giao tranh, tất cả các giống loài cùng chung sống trong hòa bình.',
    },
    {
      key: 'animalBreeding',
      title: 'Sinh sản & Nhân giống (Breeding)',
      desc: 'Dân cư trong làng và động vật hoang dã tự sinh sôi nảy nở thế hệ mới khi có đủ điều kiện thức ăn.',
    },
    {
      key: 'vegetationGrowth',
      title: 'Tự nhiên sinh sôi (Flora Growth)',
      desc: 'Rừng cây và đồng cỏ tự nhiên sinh sôi, lan tỏa sang các vùng đất màu mỡ lân cận.',
    },
    {
      key: 'villageRecruitment',
      title: 'Kết nạp Đồng tộc (Village Recruitment 80%)',
      desc: 'Khi spawn sinh vật vào làng cùng chủng tộc, có xác suất 80% NPC sẽ được nhập tịch kết nạp làm dân làng.',
    },
    {
      key: 'disasters',
      title: 'Thiên tai & Sự kiện (Disasters)',
      desc: 'Cho phép các biến động tự nhiên như cháy rừng, sấm sét ngẫu nhiên trong thế giới.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none backdrop-blur-sm">
      <div className="relative max-w-lg w-full bg-stone-900 border-2 border-stone-800 text-stone-100 rounded-2xl shadow-2xl shadow-black flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg font-bold text-stone-100">
              Luật Mô Phỏng Thế Giới (World Laws)
            </h2>
          </div>
          <button
            type="button"
            aria-label="Đóng bảng luật"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Laws list */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {lawItems.map(item => {
            const isEnabled = laws[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleLaw(item.key)}
                className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-stone-700 cursor-pointer transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-stone-200">{item.title}</h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                    isEnabled
                      ? 'bg-amber-500 border-amber-400 text-stone-950'
                      : 'bg-stone-900 border-stone-700 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
