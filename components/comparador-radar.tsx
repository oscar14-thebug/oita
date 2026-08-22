"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORES = ["#0D9488", "#0B1220", "#D97706", "#DC2626"];

export interface SerieComparador {
  key: string;
  nombre: string;
}

export function ComparadorRadar({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: SerieComparador[];
}) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 3]} tickCount={4} />
        {series.map((serie, i) => (
          <Radar
            key={serie.key}
            name={serie.nombre}
            dataKey={serie.key}
            stroke={COLORES[i % COLORES.length]}
            fill={COLORES[i % COLORES.length]}
            fillOpacity={0.15}
          />
        ))}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
