"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ExtendedNodesContextType {
  extendedNodes: Set<string>;
  addExtendedNode: (nodeId: string) => void;
  isNodeExtended: (nodeId: string) => boolean;
  clearExtendedNodes: () => void;
}

const ExtendedNodesContext = createContext<ExtendedNodesContextType | undefined>(
  undefined
);

export function ExtendedNodesProvider({ children }: { children: ReactNode }) {
  const [extendedNodes, setExtendedNodes] = useState<Set<string>>(new Set());

  const addExtendedNode = (nodeId: string) => {
    setExtendedNodes((prev) => new Set(prev).add(nodeId));
  };

  const isNodeExtended = (nodeId: string) => {
    return extendedNodes.has(nodeId);
  };

  const clearExtendedNodes = () => {
    setExtendedNodes(new Set());
  };

  return (
    <ExtendedNodesContext.Provider
      value={{
        extendedNodes,
        addExtendedNode,
        isNodeExtended,
        clearExtendedNodes,
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
