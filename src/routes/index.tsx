import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rock Paper Scissors" },
      {
        name: "description",
        content:
          "Play Rock Paper Scissors against the computer. Pick your move and beat the bot.",
      },
      { property: "og:title", content: "Rock Paper Scissors" },
      {
        property: "og:description",
        content:
          "Play Rock Paper Scissors against the computer. Pick your move and beat the bot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

type Move = "rock" | "paper" | "scissors";
type Outcome = "win" | "lose" | "draw";

const MOVES: Record<
  Move,
  { label: string; emoji: string; beats: Move; flavor: string }
> = {
  rock: {
    label: "Rock",
    emoji: "🪨",
    beats: "scissors",
    flavor: "crushes scissors",
  },
  paper: {
    label: "Paper",
    emoji: "📄",
    beats: "rock",
    flavor: "covers rock",
  },
  scissors: {
    label: "Scissors",
    emoji: "✂️",
    beats: "paper",
    flavor: "cuts paper",
  },
};

const MOVE_LIST = Object.keys(MOVES) as Move[];

function randomMove(): Move {
  return MOVE_LIST[Math.floor(Math.random() * MOVE_LIST.length)]!;
}

function decide(player: Move, cpu: Move): Outcome {
  if (player === cpu) return "draw";
  return MOVES[player].beats === cpu ? "win" : "lose";
}

const OUTCOME_COPY: Record<
  Outcome,
  { text: (p: string, c: string) => string; tone: string }
> = {
  win: { text: (p, c) => `${p} beats ${c} — you win!`, tone: "is-win" },
  lose: { text: (p, c) => `${c} beats ${p} — bot wins.`, tone: "is-lose" },
  draw: { text: () => `Same move — it's a draw.`, tone: "is-draw" },
};

function GamePage() {
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [cpuMove, setCpuMove] = useState<Move | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [revealing, setRevealing] = useState(false);

  const play = useCallback((move: Move) => {
    setRevealing(true);
    setPlayerMove(move);
    setCpuMove(null);
    setOutcome(null);

    // suspenseful CPU "shake" before revealing
    let ticks = 0;
    const interval = setInterval(() => {
      setCpuMove(randomMove());
      ticks += 1;
      if (ticks >= 9) {
        clearInterval(interval);
        const cpu = randomMove();
        const result = decide(move, cpu);
        setCpuMove(cpu);
        setOutcome(result);
        setScore((s) => ({
          wins: s.wins + (result === "win" ? 1 : 0),
          losses: s.losses + (result === "lose" ? 1 : 0),
          draws: s.draws + (result === "draw" ? 1 : 0),
        }));
        setRevealing(false);
      }
    }, 70);
  }, []);

  // keyboard shortcuts: R / P / S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (revealing) return;
      const k = e.key.toLowerCase();
      if (k === "r") play("rock");
      else if (k === "p") play("paper");
      else if (k === "s") play("scissors");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, revealing]);

  const reset = () => {
    setScore({ wins: 0, losses: 0, draws: 0 });
    setPlayerMove(null);
    setCpuMove(null);
    setOutcome(null);
  };

  const total = score.wins + score.losses + score.draws;
  const winRate = total ? Math.round((score.wins / total) * 100) : 0;

  return (
    <main className="page">
      <div className="aurora" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand__icon">✊</span>
          <span className="brand__name">Rock&nbsp;·&nbsp;Paper&nbsp;·&nbsp;Scissors</span>
        </div>
        <button className="ghost-btn" onClick={reset}>
          Reset
        </button>
      </header>

      <section className="scoreboard">
        <ScoreCell label="You" value={score.wins} accent="win" />
        <ScoreCell label="Draws" value={score.draws} accent="draw" />
        <ScoreCell label="Bot" value={score.losses} accent="lose" />
        <div className="winrate">
          <span className="winrate__label">Win rate</span>
          <span className="winrate__value">{winRate}%</span>
        </div>
      </section>

      <section className="arena">
        <PlayerPanel
          title="You"
          move={playerMove}
          idle="Pick your move"
          side="left"
          revealReady={outcome !== null}
        />

        <div className="versus">
          <span className="versus__word">VS</span>
          {outcome && (
            <span
              key={`${playerMove}-${cpuMove}-${total}`}
              className={`versus__result ${OUTCOME_COPY[outcome].tone}`}
            >
              {outcome === "win" && "🎉 You win!"}
              {outcome === "lose" && "🤖 Bot wins"}
              {outcome === "draw" && "🤝 Draw"}
            </span>
          )}
          {revealing && (
            <span className="versus__result versus__result--thinking">
              thinking…
            </span>
          )}
        </div>

        <PlayerPanel
          title="Bot"
          move={cpuMove}
          idle={revealing ? "rolling…" : "Waiting for you"}
          side="right"
          revealReady={outcome !== null}
          spinning={revealing}
        />
      </section>

      {outcome && (
        <p className="verdict" key={`v-${total}`}>
          {OUTCOME_COPY[outcome].text(
            playerMove ? MOVES[playerMove].label : "",
            cpuMove ? MOVES[cpuMove].label : "",
          )}
        </p>
      )}

      <section className="controls">
        {MOVE_LIST.map((move) => (
          <button
            key={move}
            className="move-btn"
            disabled={revealing}
            onClick={() => play(move)}
          >
            <span className="move-btn__emoji">{MOVES[move].emoji}</span>
            <span className="move-btn__label">{MOVES[move].label}</span>
            <span className="move-btn__key">{move[0].toUpperCase()}</span>
          </button>
        ))}
      </section>

      <footer className="rules">
        <span>🪨 crushes ✂️</span>
        <span>📄 covers 🪨</span>
        <span>✂️ cuts 📄</span>
      </footer>
    </main>
  );
}

function ScoreCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "win" | "draw" | "lose";
}) {
  return (
    <div className={`score score--${accent}`}>
      <span className="score__value">{value}</span>
      <span className="score__label">{label}</span>
    </div>
  );
}

function PlayerPanel({
  title,
  move,
  idle,
  side,
  revealReady,
  spinning,
}: {
  title: string;
  move: Move | null;
  idle: string;
  side: "left" | "right";
  revealReady: boolean;
  spinning?: boolean;
}) {
  return (
    <div className={`panel panel--${side}`}>
      <h2 className="panel__title">{title}</h2>
      <div
        className={[
          "panel__hand",
          spinning ? "is-spinning" : "",
          move && revealReady ? `is-${move}` : "",
          !move ? "is-idle" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="panel__emoji">{move ? MOVES[move]!.emoji : "❔"}</span>
      </div>
      <p className="panel__name">
        {move ? MOVES[move]!.label : idle}
      </p>
    </div>
  );
}
