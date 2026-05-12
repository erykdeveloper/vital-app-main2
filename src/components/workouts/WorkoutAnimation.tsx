import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkoutAnimationVariant = "running" | "strength" | "home" | "hiit" | "bike" | "calisthenics";

interface WorkoutAnimationProps {
  variant: WorkoutAnimationVariant;
  title: string;
  label?: string;
  className?: string;
}

function RunnerScene() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="presentation" aria-hidden="true">
      <path className="vital-track-line" d="M-30 150 H350" />
      <path className="vital-track-line vital-track-line-2" d="M-80 166 H300" />
      <g className="vital-run-body" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="162" cy="48" r="14" className="fill-primary" />
        <path d="M162 64 L156 98" className="vital-body-stroke" />
        <path className="vital-run-arm-a vital-body-stroke" d="M158 74 L126 86" />
        <path className="vital-run-arm-b vital-body-stroke" d="M160 76 L190 91" />
        <path className="vital-run-leg-a vital-body-stroke" d="M156 98 L128 130 L102 140" />
        <path className="vital-run-leg-b vital-body-stroke" d="M156 98 L182 127 L208 134" />
      </g>
      <circle className="vital-pulse-dot" cx="236" cy="54" r="5" />
      <circle className="vital-pulse-dot vital-pulse-dot-2" cx="92" cy="62" r="4" />
    </svg>
  );
}

function StrengthScene() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="presentation" aria-hidden="true">
      <path d="M58 138 H262" className="vital-equipment-stroke" />
      <path d="M95 138 V160 M225 138 V160" className="vital-equipment-stroke" />
      <g className="vital-bar-lift" strokeLinecap="round" strokeLinejoin="round">
        <path d="M78 78 H242" className="vital-body-stroke" />
        <path d="M72 62 V94 M248 62 V94" className="vital-body-stroke" />
        <path d="M58 66 V90 M262 66 V90" className="vital-body-stroke" />
      </g>
      <g className="vital-press-body" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="154" cy="114" r="12" className="fill-primary" />
        <path d="M142 126 H202" className="vital-body-stroke" />
        <path d="M162 105 L130 82 M178 105 L210 82" className="vital-body-stroke" />
        <path d="M196 126 L224 144 M176 126 L150 144" className="vital-body-stroke" />
      </g>
    </svg>
  );
}

function HomeScene() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="presentation" aria-hidden="true">
      <path d="M74 152 H246" className="vital-equipment-stroke" />
      <path d="M90 72 L160 36 L230 72" className="vital-equipment-stroke" />
      <path d="M106 72 V132 H214 V72" className="vital-equipment-stroke" />
      <g className="vital-squat-body" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="160" cy="82" r="13" className="fill-primary" />
        <path d="M160 96 L160 120" className="vital-body-stroke" />
        <path d="M160 104 L132 116 M160 104 L188 116" className="vital-body-stroke" />
        <path d="M160 120 L136 142 L114 142" className="vital-body-stroke" />
        <path d="M160 120 L186 142 L208 142" className="vital-body-stroke" />
      </g>
    </svg>
  );
}

function HiitScene() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="presentation" aria-hidden="true">
      <circle cx="160" cy="96" r="62" className="vital-hiit-ring" />
      <circle cx="160" cy="96" r="42" className="vital-hiit-ring vital-hiit-ring-2" />
      <g className="vital-jump-body" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="160" cy="58" r="13" className="fill-primary" />
        <path d="M160 72 L160 110" className="vital-body-stroke" />
        <path d="M158 82 L124 58 M162 82 L196 58" className="vital-body-stroke" />
        <path d="M160 110 L134 144 M160 110 L188 144" className="vital-body-stroke" />
      </g>
      <path className="vital-track-line" d="M82 156 H238" />
    </svg>
  );
}

function BikeScene() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="presentation" aria-hidden="true">
      <g className="vital-bike-wheel">
        <circle cx="102" cy="132" r="34" className="vital-equipment-stroke" />
        <path d="M102 98 V166 M68 132 H136 M78 108 L126 156 M126 108 L78 156" className="vital-equipment-stroke" />
      </g>
      <g className="vital-bike-wheel">
        <circle cx="222" cy="132" r="34" className="vital-equipment-stroke" />
        <path d="M222 98 V166 M188 132 H256 M198 108 L246 156 M246 108 L198 156" className="vital-equipment-stroke" />
      </g>
      <path d="M102 132 L146 92 L174 132 L222 132 L174 132 L146 132 L102 132" className="vital-body-stroke" />
      <path d="M146 92 L168 78 L190 86" className="vital-body-stroke" />
      <g className="vital-pedal" strokeLinecap="round">
        <circle cx="174" cy="132" r="5" className="fill-primary" />
        <path d="M174 132 L194 120 M174 132 L154 144" className="vital-body-stroke" />
      </g>
      <g className="vital-bike-rider" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="158" cy="58" r="12" className="fill-primary" />
        <path d="M158 72 L146 94" className="vital-body-stroke" />
        <path d="M150 82 L124 104 M150 82 L188 86" className="vital-body-stroke" />
        <path d="M146 94 L174 132 M146 94 L126 126" className="vital-body-stroke" />
      </g>
    </svg>
  );
}

function CalisthenicsScene() {
  return (
    <svg viewBox="0 0 320 190" className="h-full w-full" role="presentation" aria-hidden="true">
      <path d="M78 46 H242 M92 46 V164 M228 46 V164" className="vital-equipment-stroke" />
      <g className="vital-pull-body" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="160" cy="80" r="13" className="fill-primary" />
        <path d="M160 94 L160 128" className="vital-body-stroke" />
        <path d="M158 98 L126 48 M162 98 L194 48" className="vital-body-stroke" />
        <path d="M160 128 L140 154 M160 128 L180 154" className="vital-body-stroke" />
      </g>
    </svg>
  );
}

const scenes: Record<WorkoutAnimationVariant, () => JSX.Element> = {
  running: RunnerScene,
  strength: StrengthScene,
  home: HomeScene,
  hiit: HiitScene,
  bike: BikeScene,
  calisthenics: CalisthenicsScene,
};

export function WorkoutAnimation({ variant, title, label = "Animação interna", className }: WorkoutAnimationProps) {
  const Scene = scenes[variant];

  return (
    <div
      className={cn(
        "vital-workout-video relative min-h-[230px] overflow-hidden rounded-[2rem] border border-white/5 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),transparent_36%),linear-gradient(145deg,hsl(var(--secondary)),hsl(var(--background-strong)))]",
        className,
      )}
      role="img"
      aria-label={`Vídeo animado: ${title}`}
    >
      <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-glow">
          <PlayCircle className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">loop</span>
      </div>
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-6 top-16 h-20 w-20 rounded-full border border-primary/20" />
        <div className="absolute bottom-6 right-8 h-28 w-28 rounded-full border border-white/10" />
      </div>
      <div className="absolute inset-x-0 bottom-0 top-8">
        <Scene />
      </div>
    </div>
  );
}
