"use client";

/**
 * 极小的折线图。不引图表库 —— 这里只需要一条线和一条零轴，
 * 引一整个库进来是给几百 KB 换一条 polyline。
 */
export default function Spark({
  values,
  width = 168,
  height = 30,
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
}) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return <svg width={width} height={height} />;

  const min = Math.min(...nums, 0);
  const max = Math.max(...nums, 0);
  const span = max - min || 1;
  const pad = 2;
  const x = (i: number) => (i / (values.length - 1)) * (width - pad * 2) + pad;
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  const pts = values
    .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");

  const last = values[values.length - 1];

  return (
    <svg width={width} height={height} className="spark" aria-hidden>
      {min < 0 && (
        <line x1={pad} x2={width - pad} y1={y(0)} y2={y(0)} className="spark-zero" />
      )}
      <polyline points={pts} className="spark-line" />
      {last !== null && last !== undefined && (
        <rect x={x(values.length - 1) - 1.5} y={y(last) - 1.5} width="3" height="3" className="spark-dot" />
      )}
    </svg>
  );
}
