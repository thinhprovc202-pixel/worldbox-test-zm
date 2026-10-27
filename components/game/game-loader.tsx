'use client'

import dynamic from 'next/dynamic'

const GameApp = dynamic(() => import('./game-app'), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-stone-950 text-amber-400 font-medieval">
      Loading world...
    </div>
  ),
})

export function GameLoader() {
  return <GameApp />
}
