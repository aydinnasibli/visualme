import { getBezierPath, ConnectionLineComponentProps } from "@xyflow/react";
import { getEdgeParams } from "./edgeUtils";

function FloatingConnectionLine({
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
}: ConnectionLineComponentProps) {
  if (!fromNode) {
    return null;
  }

  // Create a mock target node at the cursor position
  const targetNode = {
    id: "connection-target",
    measured: {
      width: 1,
      height: 1,
    },
    internals: {
      positionAbsolute: { x: toX, y: toY },
    },
  };

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    fromNode,
    targetNode
  );

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos || fromPosition,
    targetPosition: targetPos || toPosition,
    targetX: tx || toX,
    targetY: ty || toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#a855f7"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0 0 6px #a855f7)',
        }}
        d={edgePath}
      />
      <circle
        cx={tx || toX}
        cy={ty || toY}
        fill="#fff"
        r={4}
        stroke="#a855f7"
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(0 0 4px #a855f7)',
        }}
      />
    </g>
  );
}

export default FloatingConnectionLine;
