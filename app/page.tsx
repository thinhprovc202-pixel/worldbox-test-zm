import { GameLoader } from '@/components/game/game-loader'

export default function Page() {
  return (
    <main className="h-dvh w-full overflow-hidden">
      <h1 className="sr-only">World Simulator - God Sandbox</h1>
      <GameLoader />
    </main>
  )
}
