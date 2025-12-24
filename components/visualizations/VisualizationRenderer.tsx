"use client";

import React from "react";
import { VISUALIZATION_COMPONENTS } from "./VisualizationFactory";
import type { VisualizationType, VisualizationData } from "@/lib/types/visualization";

interface VisualizationRendererProps {
  type: VisualizationType;
  data: VisualizationData;
  readOnly?: boolean;
}

export default function VisualizationRenderer({
  type,
  data,
  readOnly = false,
}: VisualizationRendererProps) {
  const SpecificComponent = VISUALIZATION_COMPONENTS[type];

  if (!SpecificComponent) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Visualization type "{type}" not supported.
      </div>
    );
  }

  return <SpecificComponent data={data as any} readOnly={readOnly} />;
}
