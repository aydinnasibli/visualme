import { useCallback } from "react";
import {
  useStore,
  getBezierPath,
  ConnectionLineComponentProps,
} from "reactflow";
import { getEdgeParams } from "./edgeUtils";

function FloatingConnectionLine({
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode,
}: ConnectionLineComponentProps) {
  const targetNode = useStore(
    useCallback(
      (store) => ({
        id: "connection-target",
        width: 1,
        height: 1,
        positionAbsolute: { x: toX, y: toY },
      }),
      [toX, toY]
    )
  );

  if (!fromNode) {
    return null;
  }

  const { sx, sy } = getEdgeParams(fromNode, targetNode as any);

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#222"
        strokeWidth={2}
        className="animated"
        d={edgePath}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        stroke="#222"
        strokeWidth={1.5}
      />
    </g>
  );
}

export default FloatingConnectionLine;
