"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getVisualizationById } from "@/lib/actions/profile";
import type { VisualizationResponse } from "@/lib/types/visualization";

interface VisualizationLoaderProps {
  onLoad: (input: string, result: VisualizationResponse) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function VisualizationLoader({
  onLoad,
  onError,
  onLoadingChange,
}: VisualizationLoaderProps) {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId && isSignedIn) {
      const loadVisualization = async () => {
        onLoadingChange(true);
        onError('');
        try {
          const response = await getVisualizationById(loadId);
          if (response.success && response.data) {
            const input = response.data.metadata.originalInput || '';
            const result: VisualizationResponse = {
              success: true,
              type: response.data.type,
              data: response.data.data,
              reason: '',
            };
            onLoad(input, result);
          } else {
            onError(response.error || 'Failed to load visualization');
          }
        } catch (err) {
          onError('An error occurred while loading the visualization');
          console.error(err);
        } finally {
          onLoadingChange(false);
        }
      };
      loadVisualization();
    }
  }, [searchParams, isSignedIn, onLoad, onError, onLoadingChange]);

  return null;
}
