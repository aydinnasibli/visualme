"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const STORAGE_KEY = "visualme_extended_nodes";

interface ExtendedNodesContextType {
  extendedNodes: Set<string>;
  addExtendedNode: (nodeId: string) => void;
  isNodeExtended: (nodeId: string) => boolean;
  clearExtendedNodes: () => void;
}

const ExtendedNodesContext = createContext<ExtendedNodesContextType | undefined>(
  undefined
);

// Load from localStorage
function loadFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    }
  } catch (error) {
    console.error("Failed to load extended nodes from storage:", error);
  }
  return new Set();
}

// Save to localStorage
function saveToStorage(nodes: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(nodes)));
  } catch (error) {
    console.error("Failed to save extended nodes to storage:", error);
  }
}

export function ExtendedNodesProvider({ children }: { children: ReactNode }) {
  const [extendedNodes, setExtendedNodes] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setExtendedNodes(loadFromStorage());
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever extendedNodes changes
  useEffect(() => {
    if (isInitialized) {
      saveToStorage(extendedNodes);
    }
  }, [extendedNodes, isInitialized]);

  const addExtendedNode = (nodeId: string) => {
    setExtendedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.add(nodeId);
      return newSet;
    });
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
