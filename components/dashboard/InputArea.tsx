"use client";
import React from 'react';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  autoSelect: boolean;
  setAutoSelect: (value: boolean) => void;
  selectedType: string | null;
  setSelectedType: (value: string | null) => void;
}

const InputArea = ({
  input,
  setInput,
  handleSubmit,
  loading,
  autoSelect,
  setAutoSelect,
  selectedType,
  setSelectedType,
}: InputAreaProps) => {
    React.useEffect(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            const handleInput = () => {
                textarea.style.height = 'auto';
                textarea.style.height = (textarea.scrollHeight) + 'px';
                if (textarea.value === '') {
                    textarea.style.height = '64px'; // reset
                }
            };
            textarea.addEventListener('input', handleInput);
            return () => textarea.removeEventListener('input', handleInput);
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    const chartTypes = [
        // Common / Simple
        { id: 'bar_chart', icon: 'bar_chart', label: 'Bar Chart' },
        { id: 'line_chart', icon: 'show_chart', label: 'Line Chart' },
        { id: 'pie_chart', icon: 'pie_chart', label: 'Pie Chart' },
        { id: 'scatter_plot', icon: 'bubble_chart', label: 'Scatter Plot' },
        { id: 'table', icon: 'table_chart', label: 'Table' },
        // Hierarchical
        { id: 'tree_diagram', icon: 'account_tree', label: 'Tree Diagram' },
        { id: 'mind_map', icon: 'psychology', label: 'Mind Map' },
        // Relational
        { id: 'network_graph', icon: 'hub', label: 'Network Graph' },
        { id: 'venn_diagram', icon: 'adjust', label: 'Venn Diagram' },
        // Flow & Process
        { id: 'flowchart', icon: 'schema', label: 'Flowchart' },
        { id: 'sankey_diagram', icon: 'waterfall_chart', label: 'Sankey Diagram' },
        { id: 'sequence_diagram', icon: 'fast_forward', label: 'Sequence Diagram' },
        // Temporal
        { id: 'timeline', icon: 'timeline', label: 'Timeline' },
        { id: 'gantt_chart', icon: 'view_timeline', label: 'Gantt Chart' },
        // Geospatial
        { id: 'geojson_map', icon: 'map', label: 'GeoJSON Map' },
        // Specialized
        { id: 'word_cloud', icon: 'cloud', label: 'Word Cloud' },
        { id: 'quadrant_chart', icon: 'view_quilt', label: 'Quadrant Chart' },
        { id: 'parallel_coordinates', icon: 'analytics', label: 'Parallel Coordinates' },
        { id: 'funnel_chart', icon: 'filter_list', label: 'Funnel Chart' },
        { id: 'class_diagram', icon: 'widgets', label: 'Class Diagram' },
    ];

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40">
            <div className="glass-panel rounded-2xl p-0 shadow-2xl border border-white/5 ring-1 ring-black/50 relative group transition-all duration-300 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Visualization Mode</span>
                        <div className="bg-black/40 p-1 rounded-lg flex items-center border border-white/5">
                            <button
                                onClick={() => setAutoSelect(true)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${autoSelect ? 'bg-stone-700/80 text-stone-100 shadow-sm border border-white/10' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}`}>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                    AI Auto
                                </span>
                            </button>
                            <button
                                onClick={() => setAutoSelect(false)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!autoSelect ? 'bg-stone-700/80 text-stone-100 shadow-sm border border-white/10' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}`}>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">tune</span>
                                    Manual Select
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`}></span>
                        <span className="text-[10px] text-stone-500 font-mono">{loading ? 'Generating...' : 'Ready'}</span>
                    </div>
                </div>
                <form className="flex flex-col relative" onSubmit={handleSubmit}>
                    {!autoSelect && (
                        <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center gap-4 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] text-stone-500 font-mono uppercase whitespace-nowrap">Chart Type:</span>
                            <div className="flex items-center gap-2">
                                {chartTypes.map(chart => (
                                    <button
                                        key={chart.id}
                                        onClick={() => setSelectedType(chart.id)}
                                        className={`group flex flex-col items-center justify-center w-10 h-10 rounded transition-all ${selectedType === chart.id ? 'bg-primary/10 border border-primary/30 text-primary' : 'hover:bg-white/5 border border-transparent hover:border-white/10 text-stone-500 hover:text-stone-300'}`}
                                        title={chart.label}
                                        type="button">
                                        <span className="material-symbols-outlined text-[20px]">{chart.icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="relative w-full bg-surface-darker/30">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            className="w-full min-h-[64px] max-h-[200px] py-4 pl-5 pr-32 bg-transparent border-0 text-stone-200 text-base placeholder:text-stone-600 focus:ring-0 resize-none leading-relaxed font-light disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Describe the data parameters or adjust styling..."
                            rows={1}></textarea>
                        <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                            <button className="p-2 text-stone-500 hover:text-stone-300 hover:bg-white/5 rounded-full transition-colors tooltip" title="Upload Data" type="button">
                                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                            </button>
                            <button disabled={loading} className="h-9 w-9 flex items-center justify-center rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 border border-white/10 shadow-lg transition-all transform active:scale-95 disabled:opacity-50" type="submit">
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InputArea;
