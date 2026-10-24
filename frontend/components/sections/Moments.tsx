import { Scene } from "@/components/scenes/Scene";
import { MorningScene } from "@/components/scenes/MorningScene";
import { DeskScene } from "@/components/scenes/DeskScene";
import { SofaScene } from "@/components/scenes/SofaScene";

/**
 * Three mornings with the lamp, drawn and animated in code. All three are mornings on purpose: the
 * research guidance is to use bright light soon after waking, and bright light late in the day can
 * make it harder to fall asleep (see `cautions` in data/science.ts).
 */
export function Moments() {
  return (
    <section id="moments" aria-labelledby="moments-title" className="bg-bg-tint py-[var(--section-y)]">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div data-reveal="">
            <p className="kicker">Your mornings</p>
            <h2 id="moments-title" className="mt-4 text-display">
              Thirty minutes, wherever your <span className="text-sunrise">morning</span> happens.
            </h2>
          </div>
          <p data-reveal="" className="max-w-[46ch] text-body-l text-fg-muted lg:pb-2">
            Switch it on, keep it off to one side, and carry on with your morning. No staring at it, no new routine to
            learn.
          </p>
        </div>
      </div>

      {/* Phones: a swipeable row that bleeds to the screen edge. Tablets up: three columns. */}
      <div className="container-x mt-12 max-md:px-0 lg:mt-16">
        <div className="flex snap-x snap-mandatory scroll-px-[var(--gutter)] [scrollbar-width:none] gap-4 overflow-x-auto overscroll-x-contain px-[max(var(--gutter),env(safe-area-inset-left))] pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:gap-6 [&::-webkit-scrollbar]:hidden">
          <Scene
            time="6:45 am"
            title="Before sunrise"
            text="Dark winter mornings, before the sun is up. Switch it on while you wake up."
            label="A woman sits on the edge of her bed in a dark room at dawn, rubbing her eyes. She switches on the lamp beside her bed, its light fills the room, she takes a slow breath and stretches with a smile."
          >
            <MorningScene />
          </Scene>
          <Scene
            time="9:30 am"
            title="At your desk"
            text="Work-from-home calls in a dim room. It sits beside your laptop while you work."
            label="A man slumps at his desk, yawning at his laptop. He switches on the lamp beside it, sits up straight, takes a breath and starts typing with a smile."
            delay={1}
          >
            <DeskScene />
          </Scene>
          <Scene
            time="Sun, 8:00 am"
            title="A slower Sunday"
            text="Chai on the sofa, the lamp at your side. Same thirty minutes, any morning."
            label="A woman in her forties sinks onto the sofa, tired. She switches on the lamp on the side table, sits back with her eyes closed, breathing slowly, then picks up her cup of chai and smiles."
            delay={2}
          >
            <SofaScene />
          </Scene>
        </div>
      </div>
    </section>
  );
}
