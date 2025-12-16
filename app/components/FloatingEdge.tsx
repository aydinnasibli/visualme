import { getBezierPath, useInternalNode, EdgeProps, Position } from "@xyflow/react";

function getNodeIntersection(intersectionNode: any, targetNode: any) {
  const intersectionNodeWidth = intersectionNode.measured?.width ?? 0;
  const intersectionNodeHeight = intersectionNode.measured?.height ?? 0;
  const intersectionNodePosition = intersectionNode.internals?.positionAbsolute;
  const targetPosition = targetNode.internals?.positionAbsolute;

  if (!intersectionNodePosition || !targetPosition) {
    return { x: 0, y: 0 };
  }

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.measured?.width ?? 0) / 2;
  const y1 = targetPosition.y + (targetNode.measured?.height ?? 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

function getEdgePosition(node: any, intersectionPoint: any) {
  const pos = node.internals?.positionAbsolute;
  if (!pos) return Position.Top;

  const width = node.measured?.width ?? 0;
  const height = node.measured?.height ?? 0;

  const nx = Math.round(pos.x);
  const ny = Math.round(pos.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

function getEdgeParams(source: any, target: any) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

export default FloatingEdge;
