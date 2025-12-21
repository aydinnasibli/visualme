"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getExtendedNodes as dbGetExtendedNodes,
  addExtendedNode as dbAddExtendedNode,
  clearExtendedNodes as dbClearExtendedNodes,
} from "@/lib/actions/extendedNodes";

interface ExtendedNodesContextType {
  extendedNodes: Set<string>;
  addExtendedNode: (nodeId: string, visualizationKey: string) => Promise<void>;
  isNodeExtended: (nodeId: string, visualizationKey: string) => boolean;
  clearExtendedNodes: () => Promise<void>;
  isLoading: boolean;
}

const ExtendedNodesContext = createContext<ExtendedNodesContextType | undefined>(
  undefined
);

export function ExtendedNodesProvider({ children }: { children: ReactNode }) {
  const [extendedNodes, setExtendedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load from database on mount
  useEffect(() => {
    async function loadExtendedNodes() {
      try {
        const nodes = await dbGetExtendedNodes();
        setExtendedNodes(new Set(nodes));
      } catch (error) {
        console.error("Failed to load extended nodes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadExtendedNodes();
  }, []);

  const addExtendedNode = async (nodeId: string, visualizationKey: string) => {
    // Create composite key: visualizationKey + nodeId
    const compositeKey = `${visualizationKey}::${nodeId}`;

    // Optimistic update
    setExtendedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.add(compositeKey);
      return newSet;
    });

    // Persist to database
    try {
      await dbAddExtendedNode(compositeKey);
    } catch (error) {
      console.error("Failed to add extended node:", error);
      // Rollback on error
      setExtendedNodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(compositeKey);
        return newSet;
      });
    }
  };

  const isNodeExtended = (nodeId: string, visualizationKey: string) => {
    const compositeKey = `${visualizationKey}::${nodeId}`;
    return extendedNodes.has(compositeKey);
  };

  const clearExtendedNodes = async () => {
    // Optimistic update
    const previousNodes = extendedNodes;
    setExtendedNodes(new Set());

    // Persist to database
    try {
      await dbClearExtendedNodes();
    } catch (error) {
      console.error("Failed to clear extended nodes:", error);
      // Rollback on error
      setExtendedNodes(previousNodes);
    }
  };

  return (
    <ExtendedNodesContext.Provider
      value={{
        extendedNodes,
        addExtendedNode,
        isNodeExtended,
        clearExtendedNodes,
        isLoading,
      }}
    >
      {children}
    </ExtendedNodesContext.Provider>
  );
}

export function useExtendedNodes() {
  const context = useContext(ExtendedNodesContext);
  if (context === undefined) {
    throw new Error(
      "useExtendedNodes must be used within an ExtendedNodesProvider"
    );
  }
  return context;
}
