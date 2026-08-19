"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * 极小的折线图。不引图表库 —— 这里只需要一条线和一条零轴。
 *
 * 宽度量容器再画，而不是 viewBox 拉伸：拉伸会把线宽和端点方块
 * 一起横向拉扁，在这套等宽、无圆角的样式里一眼就看得出来。
 */
export default function Spark({
  values,
  height = 30,
}: {
  values: (number | null)[];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setWidth(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nums = values.filter((v): v is number => v !== null);
  const ready = width > 0 && nums.length >= 2;

  let body: React.ReactNode = null;
  if (ready) {
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

    body = (
      <svg width={width} height={height} aria-hidden>
        {min < 0 && (
          <line x1={pad} x2={width - pad} y1={y(0)} y2={y(0)} className="spark-zero" />
        )}
        <polyline points={pts} className="spark-line" />
        {last !== null && last !== undefined && (
          <rect
            x={x(values.length - 1) - 1.5}
            y={y(last) - 1.5}
            width="3"
            height="3"
            className="spark-dot"
          />
        )}
      </svg>
    );
  }

  return (
    <div className="spark" ref={ref} style={{ height }}>
      {body}
    </div>
  );
}
