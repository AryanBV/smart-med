"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import calcTree from "relatives-tree";
import type { ExtNode, Gender, RelType } from "relatives-tree/lib/types";
import type { FamilyMember } from "@/types/family";
import type { RelationshipDisplay } from "@/types/relationships";
import { transformToTreeNodes, findRootNode } from "@/lib/tree-utils";
import { cn } from "@/lib/utils";

// Constants for layout
const NODE_WIDTH = 120;
const NODE_HEIGHT = 80;
const LEVEL_HEIGHT = 120;

interface FamilyTreeProps {
  members: FamilyMember[];
  relationships: RelationshipDisplay[];
  onNodeClick?: (memberId: string) => void;
}

interface PositionedNode {
  id: string;
  x: number;
  y: number;
  displayName: string;
  gender: "male" | "female";
  isRegistered: boolean;
}

interface Connector {
  id: string;
  points: string; // SVG path
  type: "parent-child" | "spouse";
}

export function FamilyTree({ members, relationships, onNodeClick }: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positionedNodes, setPositionedNodes] = useState<PositionedNode[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [viewBox, setViewBox] = useState("0 0 800 600");
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate tree layout
  useEffect(() => {
    if (members.length === 0) return;

    const treeNodes = transformToTreeNodes(members, relationships);
    const rootId = findRootNode(treeNodes);

    if (!rootId) return;

    try {
      // Format for relatives-tree library
      // Note: Using type assertions because the library uses const enums which can't be imported with isolatedModules
      const libNodes = treeNodes.map((node) => ({
        id: node.id,
        gender: node.gender as Gender,
        parents: node.parents.map((p) => ({ id: p.id, type: p.type as RelType })),
        siblings: node.siblings.map((s) => ({ id: s.id, type: s.type as RelType })),
        spouses: node.spouses.map((s) => ({ id: s.id, type: s.type as RelType })),
        children: node.children.map((c) => ({ id: c.id, type: c.type as RelType })),
      }));

      const treeResult = calcTree(libNodes, { rootId });

      // Position nodes based on tree calculation
      const positioned: PositionedNode[] = [];
      const connectorList: Connector[] = [];

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      treeResult.nodes.forEach((treeNode: ExtNode) => {
        const originalNode = treeNodes.find((n) => n.id === treeNode.id);
        if (!originalNode) return;

        const x = treeNode.left * (NODE_WIDTH + 40) + 100;
        const y = treeNode.top * LEVEL_HEIGHT + 100;

        positioned.push({
          id: treeNode.id,
          x,
          y,
          displayName: originalNode.displayName,
          gender: originalNode.gender,
          isRegistered: originalNode.isRegistered,
        });

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + NODE_WIDTH);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
      });

      // Generate connectors for parent-child relationships
      relationships
        .filter((r) => r.relationshipType === "child")
        .forEach((rel) => {
          const parent = positioned.find((n) => n.id === rel.memberId);
          const child = positioned.find((n) => n.id === rel.relatedMemberId);

          if (parent && child) {
            const startX = parent.x + NODE_WIDTH / 2;
            const startY = parent.y + NODE_HEIGHT;
            const endX = child.x + NODE_WIDTH / 2;
            const endY = child.y;
            const midY = (startY + endY) / 2;

            connectorList.push({
              id: `${rel.memberId}-${rel.relatedMemberId}`,
              points: `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`,
              type: "parent-child",
            });
          }
        });

      // Generate connectors for spouse relationships (avoid duplicates)
      const spouseConnectorIds = new Set<string>();
      relationships
        .filter((r) => r.relationshipType === "spouse")
        .forEach((rel) => {
          const connectorId = [rel.memberId, rel.relatedMemberId].sort().join("-");
          if (spouseConnectorIds.has(connectorId)) return;
          spouseConnectorIds.add(connectorId);

          const spouse1 = positioned.find((n) => n.id === rel.memberId);
          const spouse2 = positioned.find((n) => n.id === rel.relatedMemberId);

          if (spouse1 && spouse2) {
            const y = spouse1.y + NODE_HEIGHT / 2;
            const x1 = Math.min(spouse1.x, spouse2.x) + NODE_WIDTH;
            const x2 = Math.max(spouse1.x, spouse2.x);

            connectorList.push({
              id: `spouse-${connectorId}`,
              points: `M ${x1} ${y} L ${x2} ${y}`,
              type: "spouse",
            });
          }
        });

      setPositionedNodes(positioned);
      setConnectors(connectorList);

      // Set viewBox with padding
      const padding = 50;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;
      setViewBox(`${minX - padding} ${minY - padding} ${width} ${height}`);

    } catch (error) {
      console.error("Error calculating tree layout:", error);
      // Fallback: simple grid layout
      const positioned = members.map((member, index) => ({
        id: member.id,
        x: (index % 3) * (NODE_WIDTH + 40) + 100,
        y: Math.floor(index / 3) * LEVEL_HEIGHT + 100,
        displayName: member.full_name,
        gender: (member.gender === "male" || member.gender === "female"
          ? member.gender
          : "male") as "male" | "female",
        isRegistered: member.is_registered || false,
      }));
      setPositionedNodes(positioned);
      setConnectors([]);
    }
  }, [members, relationships]);

  // Pan handlers (Mouse)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as Element).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers (Mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - transform.x, y: touch.clientY - transform.y });
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setTransform((prev) => ({
        ...prev,
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      }));
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.5), 2),
    }));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No family members to display
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] border rounded-lg bg-muted/20 overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 2) }))}
          className="p-2 bg-background border rounded-md hover:bg-muted"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.5) }))}
          className="p-2 bg-background border rounded-md hover:bg-muted"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-background border rounded-md hover:bg-muted text-xs"
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>

      {/* Tree SVG */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          viewBox={viewBox}
          className="w-full h-full"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Connectors (render behind nodes) */}
          {connectors.map((connector) => (
            <path
              key={connector.id}
              d={connector.points}
              fill="none"
              stroke={connector.type === "spouse" ? "#ec4899" : "#6b7280"}
              strokeWidth={connector.type === "spouse" ? 2 : 1.5}
              strokeDasharray={connector.type === "spouse" ? "4,4" : "none"}
            />
          ))}

          {/* Nodes */}
          {positionedNodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onNodeClick?.(node.id)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onNodeClick?.(node.id)}
              aria-label={`${node.displayName}, ${node.gender === 'female' ? 'Female' : 'Male'} family member`}
            >
              {/* Node background */}
              <rect
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                fill={node.gender === "female" ? "#fce7f3" : "#dbeafe"}
                stroke={node.isRegistered ? "#10b981" : (node.gender === "female" ? "#ec4899" : "#3b82f6")}
                strokeWidth={node.isRegistered ? 3 : 1.5}
                className="transition-all hover:stroke-[3px]"
              />

              {/* Avatar circle */}
              <circle
                cx={NODE_WIDTH / 2}
                cy={25}
                r={18}
                fill={node.gender === "female" ? "#f472b6" : "#60a5fa"}
              />

              {/* Initials */}
              <text
                x={NODE_WIDTH / 2}
                y={30}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {node.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </text>

              {/* Name */}
              <text
                x={NODE_WIDTH / 2}
                y={58}
                textAnchor="middle"
                fill="#374151"
                fontSize="11"
                fontWeight="500"
              >
                {node.displayName.length > 12
                  ? node.displayName.slice(0, 11) + "..."
                  : node.displayName}
              </text>

              {/* "You" indicator */}
              {node.isRegistered && (
                <text
                  x={NODE_WIDTH / 2}
                  y={72}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="9"
                  fontWeight="600"
                >
                  (You)
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
        Drag to pan - Scroll to zoom - Click node to view
      </div>
    </div>
  );
}
