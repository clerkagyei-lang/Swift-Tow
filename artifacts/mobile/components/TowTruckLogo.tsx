import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export default function TowTruckLogo({ size = 40, color = "#FF6B00" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x="4" y="22" width="36" height="20" rx="3" fill={color} />
      <Path
        d="M40 28 L56 28 L60 38 L40 38 Z"
        fill={color}
        opacity="0.85"
      />
      <Rect x="8" y="18" width="24" height="8" rx="2" fill={color} opacity="0.7" />
      <Path
        d="M28 10 L36 18 L12 18 L12 10 Z"
        fill={color}
        opacity="0.55"
      />
      <Circle cx="16" cy="44" r="6" fill="#34495E" />
      <Circle cx="16" cy="44" r="3" fill="#F5F5F5" />
      <Circle cx="50" cy="44" r="6" fill="#34495E" />
      <Circle cx="50" cy="44" r="3" fill="#F5F5F5" />
      <Path
        d="M36 14 L48 14 L48 22"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Rect x="2" y="30" width="4" height="6" rx="1" fill={color} opacity="0.6" />
    </Svg>
  );
}
