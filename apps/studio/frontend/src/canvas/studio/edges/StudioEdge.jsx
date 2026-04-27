import React from 'react';
import { getBezierPath, BaseEdge } from '@xyflow/react';

export function StudioEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  selected,
}) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const stroke = selected ? 'oklch(78% 0.2 265)' : 'oklch(55% 0.15 265 / 0.7)';

  return (
    <>
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="oklch(65% 0.2 265)"
          strokeWidth={8}
          strokeOpacity={0.12}
          strokeLinecap="round"
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: 2,
          strokeOpacity: selected ? 1 : 0.7,
          strokeDasharray: '6 4',
          transition: 'stroke 250ms, stroke-opacity 250ms',
        }}
      />
    </>
  );
}
