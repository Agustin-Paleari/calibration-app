import type { Trial } from "../domain/types";
import { REFERENCE, fmt } from "../domain/calibration";
export function Evolution({ trials }: { trials: Trial[] }) {
  if (!trials.length) return null;
  const w = 600,
    h = 180,
    left = 48,
    right = 16,
    top = 22,
    bottom = 35;
  const deviations = trials.flatMap((t) => [
    t.x - REFERENCE.x,
    t.y - REFERENCE.y,
  ]);
  const range = Math.max(0.075, ...deviations.map(Math.abs)) * 1.15;
  const px = (i: number) =>
    trials.length === 1
      ? (w + left - right) / 2
      : left + (i * (w - left - right)) / (trials.length - 1);
  const py = (n: number) =>
    top + ((range - n) / (2 * range)) * (h - top - bottom);
  const line = (axis: "x" | "y") =>
    trials.map((t, i) => `${px(i)},${py(t[axis] - REFERENCE[axis])}`).join(" ");
  return (
    <div className="evolution">
      <div className="section-heading">
        <div>
          <h3>Precisión, ensayo a ensayo</h3>
          <p className="muted">Desviación respecto del nominal · mm</p>
        </div>
        <div className="chart-legend">
          <span>
            <i className="x" />
            Eje X
          </span>
          <span>
            <i className="y" />
            Eje Y
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Evolución de desviaciones X e Y. Los valores exactos se muestran en la tabla de ensayos."
      >
        <rect
          x={left}
          y={py(0.05)}
          width={w - left - right}
          height={py(-0.05) - py(0.05)}
          fill="#e9f2ea"
        />
        {[range, 0, -range].map((n) => (
          <g key={n}>
            <line
              x1={left}
              x2={w - right}
              y1={py(n)}
              y2={py(n)}
              stroke="#dee5df"
              strokeDasharray={n ? "3 4" : undefined}
            />
            <text
              x={left - 8}
              y={py(n) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#78877e"
            >
              {fmt(n)}
            </text>
          </g>
        ))}
        <polyline
          points={line("x")}
          fill="none"
          stroke="#197653"
          strokeWidth="2.5"
        />
        <polyline
          points={line("y")}
          fill="none"
          stroke="#c99243"
          strokeWidth="2.5"
        />
        {trials.map((t, i) => (
          <g key={t.id}>
            <circle
              cx={px(i)}
              cy={py(t.x - REFERENCE.x)}
              r="4"
              fill="#197653"
            />
            <circle
              cx={px(i)}
              cy={py(t.y - REFERENCE.y)}
              r="4"
              fill="#c99243"
            />
            <text
              x={px(i)}
              y={h - 9}
              textAnchor="middle"
              fontSize="11"
              fill="#78877e"
            >
              #{i + 1}
            </text>
          </g>
        ))}
      </svg>
      <span className="chart-note">
        <i />
        Franja verde: tolerancia de ±0,050 mm
      </span>
      <div className="exposure-evolution">
        <span className="eyebrow">EXPOSICIÓN · SEGUNDOS</span>
        <div>
          {trials.map((t, i) => (
            <span key={t.id}>
              <small>#{i + 1}</small>
              <strong>{fmt(t.exposure)} s</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
