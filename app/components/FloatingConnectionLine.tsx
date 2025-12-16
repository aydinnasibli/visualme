import { useCallback } from "react";
import {
  useStore,
  getBezierPath,
  ConnectionLineComponentProps,
} from "@xyflow/react";

function getNodeIntersection(intersectionNode: any, targetNode: any) {
  const {
    width: intersectionNodeWidth,
    height: intersectionNodeHeight,
    positionAbsolute: intersectionNodePosition,
  } = intersectionNode;
  const targetPosition = targetNode.positionAbsolute;

  const w = intersectionNodeWidth! / 2;
  const h = intersectionNodeHeight! / 2;

  const x2 = intersectionNodePosition!.x + w;
  const y2 = intersectionNodePosition!.y + h;
  const x1 = targetPosition!.x + (targetNode.width || 0) / 2;
  const y1 = targetPosition!.y + (targetNode.height || 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

function getEdgeParams(source: any, target: any) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
  };
}

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

  const { sx, sy } = getEdgeParams(fromNode, targetNode);

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
        stroke="#b1b1b7"
        strokeWidth={3}
        className="animated"
        d={edgePath}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        stroke="#b1b1b7"
        strokeWidth={2}
      />
    </g>
  );
}

export default FloatingConnectionLine;
