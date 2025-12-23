"use client";

import React, { useEffect, useRef } from 'react';
import { Timeline as VisTimelineType, TimelineOptions } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { TimelineData } from '@/lib/types/visualization';

interface TimelineProps {
  data: TimelineData;
  readOnly?: boolean;
}

export default function Timeline({ data, readOnly = false }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimelineType | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || !data.items) return;

    // Destroy previous instance
    if (timelineRef.current) {
      timelineRef.current.destroy();
      timelineRef.current = null;
    }

    // Process items
    // Ensure start/end are Date objects or strings that Vis accepts
    const items = new DataSet(data.items.map(item => ({
      id: item.id,
      content: item.content,
      start: item.start,
      end: item.end,
      group: item.group,
      type: item.type,
      className: 'custom-timeline-item'
    })));

    // Process groups if any
    const groups = data.groups ? new DataSet(data.groups) : null;

    const options: TimelineOptions = {
      width: '100%',
      height: '100%',
      stack: true,
      showCurrentTime: true,
      zoomMin: 1000 * 60 * 60 * 24, // One day in milliseconds
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
      editable: !readOnly && {
        add: false,         // add new items by double tapping
        updateTime: true,  // drag items horizontally
        updateGroup: true, // drag items from one group to another
        remove: true,       // delete an item by tapping the delete button top right
      },
      margin: {
        item: 10, // minimal margin between items
        axis: 5   // minimal margin between items and the axis
      },
      orientation: {
        axis: 'top',
        item: 'top'
      }
    };

    timelineRef.current = new VisTimelineType(containerRef.current, items, groups || undefined, options);

    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [data, readOnly]);

  return (
    <div className="w-full h-[600px] bg-[#0f1419] rounded-2xl border border-zinc-800/50 relative overflow-hidden shadow-2xl p-4">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
