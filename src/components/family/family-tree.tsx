"use client";

import { useEffect, useRef, useCallback } from "react";
import * as f3 from "family-chart";
import "family-chart/styles/family-chart.css";
import { RotateCcw, Users } from "lucide-react";
import type { FamilyMember } from "@/types/family";
import type { RelationshipDisplay } from "@/types/relationships";
import type { Chart, TreeDatum } from "family-chart";
import {
  transformToFamilyChartData,
  findMainPerson,
  getInitials,
} from "@/lib/family-chart-utils";
import { Button } from "@/components/ui/button";

interface FamilyTreeProps {
  members: FamilyMember[];
  relationships: RelationshipDisplay[];
  onNodeClick?: (memberId: string) => void;
}

/**
 * Create custom card HTML with SMART-MED teal theme
 * Uses DOM methods to safely create content
 */
function createCardHtml(d: TreeDatum): string {
  const data = d.data as {
    "full name": string;
    gender: "M" | "F";
    isRegistered: boolean;
  };

  const isMale = data.gender === "M";
  const isRegistered = data.isRegistered;
  const fullName = String(data["full name"] || "Unknown");
  const initials = getInitials(fullName);

  // Theme colors
  const bgColor = isRegistered
    ? "#ccfbf1" // teal-100
    : isMale
      ? "#e0f2fe" // sky-100
      : "#fce7f3"; // pink-100

  const borderColor = isRegistered
    ? "#0d9488" // teal-600
    : isMale
      ? "#3b82f6" // blue-500
      : "#ec4899"; // pink-500

  const avatarBg = isRegistered
    ? "#0d9488" // teal-600
    : isMale
      ? "#60a5fa" // blue-400
      : "#f472b6"; // pink-400

  // Truncate long names
  const displayName =
    fullName.length > 14 ? fullName.slice(0, 13) + "..." : fullName;

  // Build HTML string with escaped content
  const youLabel = isRegistered
    ? '<div style="font-size: 11px; color: #0d9488; font-weight: 600; margin-top: 4px;">(You)</div>'
    : "";

  return `
    <div class="family-card" style="
      width: 140px;
      padding: 16px;
      background: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 16px;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 4px 12px -2px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    ">
      <div style="
        width: 48px;
        height: 48px;
        background: ${avatarBg};
        border-radius: 50%;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      ">${initials}</div>
      <div style="
        font-weight: 600;
        font-size: 14px;
        color: #1f2937;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${displayName}</div>
      ${youLabel}
    </div>
  `;
}

export function FamilyTree({
  members,
  relationships,
  onNodeClick,
}: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || members.length === 0) return;

    // Clear any existing chart
    container.textContent = "";

    // Transform data to family-chart format
    const chartData = transformToFamilyChartData(members, relationships);
    const mainPersonId = findMainPerson(chartData);

    if (!mainPersonId || chartData.length === 0) return;

    try {
      // Create the chart
      const chart = f3.createChart(container, chartData);
      chartRef.current = chart;

      // Configure spacing per Linear ARY-9 spec
      chart.setCardXSpacing(250).setCardYSpacing(150);

      // Set up HTML cards with custom styling
      chart
        .setCardHtml()
        .setStyle("rect")
        .setCardDisplay([["full name"]])
        .setCardInnerHtmlCreator(createCardHtml)
        .setOnCardClick((e: MouseEvent, d: TreeDatum) => {
          if (onNodeClick && d.id) {
            onNodeClick(d.id);
          }
        });

      // Update tree with initial render, fit to container
      chart.updateTree({ initial: true, tree_position: "fit" });
    } catch (error) {
      console.error("Error creating family chart:", error);
    }

    // Cleanup on unmount
    return () => {
      container.textContent = "";
      chartRef.current = null;
    };
  }, [members, relationships, onNodeClick]);

  // Reset view to fit tree in container
  const handleReset = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.updateTree({ tree_position: "fit" });
    }
  }, []);

  // Empty state
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground border rounded-xl bg-muted/20">
        <Users className="h-12 w-12 mb-4" />
        <p>No family members to display</p>
      </div>
    );
  }

  return (
    <div className="relative w-full border rounded-xl bg-muted/20 overflow-hidden shadow-sm">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="h-9 w-9 bg-background shadow-sm"
          aria-label="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Chart container - 500px height per Linear spec */}
      <div
        ref={containerRef}
        id="FamilyChart"
        className="w-full h-[500px]"
        style={{ touchAction: "none" }}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm">
        Drag to pan &bull; Scroll to zoom &bull; Click card for details
      </div>
    </div>
  );
}
