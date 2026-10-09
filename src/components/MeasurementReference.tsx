export function MeasurementReference() {
  return (
    <figure className="measurement-reference">
      <svg
        viewBox="0 0 240 155"
        role="img"
        aria-label="Vista superior del bloque: X nominal 12 mm, Y nominal 10 mm y un único hueco central"
      >
        <rect
          x="60"
          y="28"
          width="120"
          height="100"
          rx="4"
          fill="#e7f2eb"
          stroke="#397d61"
          strokeWidth="2"
        />
        <circle
          cx="120"
          cy="78"
          r="17"
          fill="white"
          stroke="#397d61"
          strokeWidth="2"
        />
        <path
          d="M60 22V15m0 4h120m0-4v7M189 28h10m-5 0v100m-5 0h10"
          fill="none"
          stroke="#718779"
        />
        <g fill="#285c46" fontSize="13" fontFamily="inherit">
          <text x="120" y="11" textAnchor="middle">
            X · 12 mm
          </text>
          <text
            x="211"
            y="79"
            textAnchor="middle"
            transform="rotate(90 211 79)"
          >
            Y · 10 mm
          </text>
        </g>
      </svg>
      <figcaption>Vista superior</figcaption>
    </figure>
  );
}
