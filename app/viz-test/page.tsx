"use client";

import dynamic from "next/dynamic";

const DynLoader = () => (
  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">Loading…</div>
);
const dyn = (fn: () => Promise<{ default: React.ComponentType<any> }>) =>
  dynamic(fn, { ssr: false, loading: DynLoader });

const NetworkGraph     = dyn(() => import("@/components/visualizations/NetworkGraph"));
const MindMap          = dyn(() => import("@/components/visualizations/MindMap"));
const TreeDiagram      = dyn(() => import("@/components/visualizations/TreeDiagram"));
const Timeline         = dyn(() => import("@/components/visualizations/Timeline"));
const GanttChart       = dyn(() => import("@/components/visualizations/GanttChart"));
const AnimatedTimeline = dyn(() => import("@/components/visualizations/AnimatedTimeline"));
const Flowchart        = dyn(() => import("@/components/visualizations/Flowchart"));
const SankeyDiagram    = dyn(() => import("@/components/visualizations/SankeyDiagram"));
const SwimlaneDiagram  = dyn(() => import("@/components/visualizations/SwimlaneDiagram"));
const LineChart        = dyn(() => import("@/components/visualizations/LineChart"));
const BarChart         = dyn(() => import("@/components/visualizations/BarChart"));
const ScatterPlot      = dyn(() => import("@/components/visualizations/ScatterPlot"));
const Heatmap          = dyn(() => import("@/components/visualizations/Heatmap"));
const RadarChart       = dyn(() => import("@/components/visualizations/RadarChart"));
const PieChart         = dyn(() => import("@/components/visualizations/PieChart"));
const ComparisonTable  = dyn(() => import("@/components/visualizations/ComparisonTable"));
const ParallelCoords   = dyn(() => import("@/components/visualizations/ParallelCoordinates"));
const WordCloud        = dyn(() => import("@/components/visualizations/WordCloud"));
const SyntaxDiagram    = dyn(() => import("@/components/visualizations/SyntaxDiagram"));

// ─── Mock data ────────────────────────────────────────────────────────────────

const networkData = {
  nodes: [
    { id: "n1", label: "Machine Learning", category: "Core", description: "A branch of AI that enables systems to learn from data and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves.", extendable: true, metadata: { keyPoints: ["Supervised learning", "Unsupervised learning", "Reinforcement learning"], relatedConcepts: ["Deep Learning", "Neural Networks"] } },
    { id: "n2", label: "Neural Networks", category: "Core", description: "Computing systems inspired by biological neural networks. They consist of layers of interconnected nodes and are the foundation of modern deep learning approaches.", extendable: true, metadata: { keyPoints: ["Layers", "Weights", "Activation functions"], relatedConcepts: ["Deep Learning", "Backpropagation"] } },
    { id: "n3", label: "Deep Learning", category: "Core", description: "A subset of machine learning using neural networks with many layers. It excels at tasks like image recognition, natural language processing, and speech recognition.", extendable: false },
    { id: "n4", label: "Training Data", category: "Data", description: "The dataset used to train a machine learning model. Its quality and quantity directly affect model performance.", extendable: false },
    { id: "n5", label: "Model Evaluation", category: "Process", description: "The process of assessing model performance using metrics such as accuracy, precision, recall, and F1 score.", extendable: false },
    { id: "n6", label: "Overfitting", category: "Challenges", description: "When a model learns the training data too well, including noise, and performs poorly on new data.", extendable: false },
    { id: "n7", label: "Gradient Descent", category: "Algorithms", description: "An optimization algorithm used to minimize the loss function by iteratively adjusting model parameters.", extendable: false },
    { id: "n8", label: "Backpropagation", category: "Algorithms", description: "An algorithm for training neural networks by calculating the gradient of the loss function with respect to each weight.", extendable: false },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", label: "uses" },
    { id: "e2", source: "n2", target: "n3", label: "enables" },
    { id: "e3", source: "n4", target: "n1", label: "feeds" },
    { id: "e4", source: "n1", target: "n5", label: "requires" },
    { id: "e5", source: "n4", target: "n6", label: "causes" },
    { id: "e6", source: "n7", target: "n2", label: "trains" },
    { id: "e7", source: "n8", target: "n7", label: "computes" },
  ],
};

const mindMapData = {
  root: {
    id: "root", content: "React.js", description: "A JavaScript library for building user interfaces, developed by Meta.", level: 0, extendable: true,
    metadata: { keyPoints: ["Component-based", "Virtual DOM", "Declarative UI"], relatedConcepts: ["Vue", "Angular"] },
    children: [
      {
        id: "n1", content: "Components", description: "Reusable UI building blocks that accept props and return JSX.", level: 1, extendable: true,
        metadata: { keyPoints: ["Functional", "Class-based", "Props & State"], relatedConcepts: ["JSX", "Hooks"] },
        children: [
          { id: "n1.1", content: "Functional", description: "Modern components defined as JavaScript functions.", level: 2, extendable: false },
          { id: "n1.2", content: "Class-based", description: "Legacy components using ES6 class syntax.", level: 2, extendable: false },
        ],
      },
      {
        id: "n2", content: "Hooks", description: "Functions that let you use state and React features in functional components.", level: 1, extendable: true,
        metadata: { keyPoints: ["useState", "useEffect", "useContext"], relatedConcepts: ["State Management"] },
        children: [
          { id: "n2.1", content: "useState", description: "Manages local component state.", level: 2, extendable: false },
          { id: "n2.2", content: "useEffect", description: "Handles side effects like data fetching.", level: 2, extendable: false },
          { id: "n2.3", content: "useContext", description: "Consumes React context values.", level: 2, extendable: false },
        ],
      },
      {
        id: "n3", content: "Virtual DOM", description: "An in-memory representation of the real DOM for efficient updates.", level: 1, extendable: false,
      },
      {
        id: "n4", content: "Ecosystem", description: "Libraries and tools that complement React development.", level: 1, extendable: false,
        children: [
          { id: "n4.1", content: "Redux", description: "State management library.", level: 2, extendable: false },
          { id: "n4.2", content: "Next.js", description: "React framework for production.", level: 2, extendable: false },
        ],
      },
    ],
  },
};

const treeData = {
  name: "Programming Languages",
  attributes: { description: "Top-level taxonomy of programming languages.", extendable: true },
  children: [
    {
      name: "Compiled",
      attributes: { description: "Languages compiled directly to machine code.", extendable: false },
      children: [
        { name: "C++", attributes: { description: "Low-level systems language.", extendable: false } },
        { name: "Rust", attributes: { description: "Memory-safe systems language.", extendable: false } },
        { name: "Go", attributes: { description: "Concurrent, statically typed language by Google.", extendable: false } },
      ],
    },
    {
      name: "Interpreted",
      attributes: { description: "Languages executed at runtime by an interpreter.", extendable: false },
      children: [
        { name: "Python", attributes: { description: "General-purpose scripting language.", extendable: false } },
        { name: "JavaScript", attributes: { description: "Web's primary scripting language.", extendable: false } },
        { name: "Ruby", attributes: { description: "Productivity-focused scripting language.", extendable: false } },
      ],
    },
    {
      name: "JVM-based",
      attributes: { description: "Languages running on the Java Virtual Machine.", extendable: false },
      children: [
        { name: "Java", attributes: { description: "Platform-independent OOP language.", extendable: false } },
        { name: "Kotlin", attributes: { description: "Modern, concise JVM language.", extendable: false } },
        { name: "Scala", attributes: { description: "Functional + OOP JVM language.", extendable: false } },
      ],
    },
  ],
};

const timelineData = {
  items: [
    { id: "1", content: "World Wide Web invented", start: "1991-08-06", type: "point" as const, group: "tech" },
    { id: "2", content: "Google founded", start: "1998-09-04", type: "point" as const, group: "companies" },
    { id: "3", content: "Dot-com bubble", start: "1997-01-01", end: "2001-12-31", type: "range" as const, group: "events" },
    { id: "4", content: "iPhone launched", start: "2007-06-29", type: "point" as const, group: "tech" },
    { id: "5", content: "Bitcoin introduced", start: "2009-01-03", type: "point" as const, group: "tech" },
    { id: "6", content: "Cloud computing era", start: "2006-01-01", end: "2016-12-31", type: "range" as const, group: "events" },
    { id: "7", content: "ChatGPT released", start: "2022-11-30", type: "point" as const, group: "tech" },
    { id: "8", content: "Facebook founded", start: "2004-02-04", type: "point" as const, group: "companies" },
  ],
  groups: [
    { id: "tech", content: "Technology" },
    { id: "companies", content: "Companies" },
    { id: "events", content: "Eras" },
  ],
};

const ganttData = {
  tasks: [
    { id: "t1", name: "Requirements Gathering", start: "2025-01-06", end: "2025-01-17", progress: 0, dependencies: [], type: "task" as const },
    { id: "t2", name: "System Design", start: "2025-01-20", end: "2025-02-07", progress: 0, dependencies: ["t1"], type: "task" as const },
    { id: "t3", name: "Database Schema", start: "2025-02-10", end: "2025-02-21", progress: 0, dependencies: ["t2"], type: "task" as const },
    { id: "t4", name: "Backend Development", start: "2025-02-24", end: "2025-04-04", progress: 0, dependencies: ["t3"], type: "task" as const },
    { id: "t5", name: "Frontend Development", start: "2025-03-03", end: "2025-04-11", progress: 0, dependencies: ["t2"], type: "task" as const },
    { id: "m1", name: "Beta Release", start: "2025-04-14", end: "2025-04-14", progress: 0, dependencies: ["t4", "t5"], type: "milestone" as const },
    { id: "t6", name: "QA & Testing", start: "2025-04-14", end: "2025-05-02", progress: 0, dependencies: ["m1"], type: "task" as const },
    { id: "t7", name: "Deployment", start: "2025-05-05", end: "2025-05-09", progress: 0, dependencies: ["t6"], type: "task" as const },
  ],
};

const animatedTimelineData = {
  steps: [
    { id: "1", title: "Idea & Research", description: "Identify the problem space and validate the concept through user research and market analysis.", timestamp: "Week 1-2" },
    { id: "2", title: "Design Prototype", description: "Create wireframes and interactive prototypes to test user flows before writing code.", timestamp: "Week 3-4" },
    { id: "3", title: "MVP Development", description: "Build the minimum viable product focusing on core features that solve the primary user problem.", timestamp: "Week 5-10" },
    { id: "4", title: "User Testing", description: "Release to a small group of early adopters and collect qualitative and quantitative feedback.", timestamp: "Week 11-12" },
    { id: "5", title: "Iterate & Improve", description: "Implement feedback, fix bugs, and polish the product based on real-world usage data.", timestamp: "Week 13-16" },
    { id: "6", title: "Public Launch", description: "Full product launch with marketing campaign, press release, and onboarding optimization.", timestamp: "Week 17" },
  ],
};

const flowchartData = {
  nodes: [
    { id: "1", type: "start" as const, data: { label: "User Request" }, position: { x: 200, y: 0 } },
    { id: "2", type: "process" as const, data: { label: "Validate Input" }, position: { x: 200, y: 100 } },
    { id: "3", type: "decision" as const, data: { label: "Valid?" }, position: { x: 200, y: 200 } },
    { id: "4", type: "output" as const, data: { label: "Return Error" }, position: { x: 400, y: 300 } },
    { id: "5", type: "process" as const, data: { label: "Authenticate User" }, position: { x: 0, y: 300 } },
    { id: "6", type: "decision" as const, data: { label: "Authorized?" }, position: { x: 0, y: 400 } },
    { id: "7", type: "process" as const, data: { label: "Process Request" }, position: { x: 0, y: 500 } },
    { id: "8", type: "output" as const, data: { label: "Return Response" }, position: { x: 0, y: 600 } },
    { id: "9", type: "end" as const, data: { label: "End" }, position: { x: 0, y: 700 } },
  ],
  edges: [
    { id: "e1", source: "1", target: "2" },
    { id: "e2", source: "2", target: "3" },
    { id: "e3", source: "3", target: "4", label: "No" },
    { id: "e4", source: "3", target: "5", label: "Yes" },
    { id: "e5", source: "5", target: "6" },
    { id: "e6", source: "6", target: "4", label: "No" },
    { id: "e7", source: "6", target: "7", label: "Yes" },
    { id: "e8", source: "7", target: "8" },
    { id: "e9", source: "8", target: "9" },
  ],
};

const sankeyData = {
  nodes: [
    { id: "visits", name: "Website Visits" },
    { id: "landing", name: "Landing Page" },
    { id: "blog", name: "Blog Posts" },
    { id: "signup", name: "Sign Up Page" },
    { id: "free", name: "Free Users" },
    { id: "paid", name: "Paid Users" },
    { id: "churned", name: "Churned" },
  ],
  links: [
    { source: "visits", target: "landing", value: 10000 },
    { source: "visits", target: "blog", value: 4000 },
    { source: "landing", target: "signup", value: 3000 },
    { source: "blog", target: "signup", value: 1200 },
    { source: "signup", target: "free", value: 2800 },
    { source: "free", target: "paid", value: 900 },
    { source: "free", target: "churned", value: 1900 },
    { source: "paid", target: "churned", value: 150 },
  ],
};

const swimlaneData = {
  lanes: [
    { id: "customer", name: "Customer" },
    { id: "sales", name: "Sales" },
    { id: "engineering", name: "Engineering" },
    { id: "qa", name: "QA" },
  ],
  tasks: [
    { id: "t1", lane: "customer", content: "Submit Request", position: 0 },
    { id: "t2", lane: "sales", content: "Review & Qualify", position: 1 },
    { id: "t3", lane: "sales", content: "Create Proposal", position: 2 },
    { id: "t4", lane: "customer", content: "Approve Proposal", position: 3 },
    { id: "t5", lane: "engineering", content: "Development Sprint", position: 4 },
    { id: "t6", lane: "qa", content: "Testing & Review", position: 5 },
    { id: "t7", lane: "sales", content: "Delivery & Sign-off", position: 6 },
  ],
};

const lineChartData = {
  data: [
    { name: "Jan", revenue: 42000, expenses: 28000, profit: 14000 },
    { name: "Feb", revenue: 38000, expenses: 25000, profit: 13000 },
    { name: "Mar", revenue: 55000, expenses: 30000, profit: 25000 },
    { name: "Apr", revenue: 61000, expenses: 32000, profit: 29000 },
    { name: "May", revenue: 74000, expenses: 35000, profit: 39000 },
    { name: "Jun", revenue: 82000, expenses: 38000, profit: 44000 },
    { name: "Jul", revenue: 91000, expenses: 41000, profit: 50000 },
    { name: "Aug", revenue: 88000, expenses: 39000, profit: 49000 },
  ],
  lines: ["revenue", "expenses", "profit"],
};

const barChartData = {
  data: [
    { name: "Python", popularity: 31, jobs: 88, growth: 15 },
    { name: "JavaScript", popularity: 64, jobs: 95, growth: 8 },
    { name: "TypeScript", popularity: 43, jobs: 72, growth: 25 },
    { name: "Rust", popularity: 18, jobs: 35, growth: 42 },
    { name: "Go", popularity: 22, jobs: 58, growth: 18 },
    { name: "Kotlin", popularity: 16, jobs: 44, growth: 12 },
  ],
  bars: ["popularity", "jobs", "growth"],
};

const scatterData = {
  data: [
    { x: 2, y: 4, z: 10, name: "Product A", category: "Category 1" },
    { x: 5, y: 8, z: 25, name: "Product B", category: "Category 1" },
    { x: 9, y: 3, z: 15, name: "Product C", category: "Category 2" },
    { x: 3, y: 9, z: 30, name: "Product D", category: "Category 2" },
    { x: 7, y: 6, z: 20, name: "Product E", category: "Category 3" },
    { x: 1, y: 2, z: 8, name: "Product F", category: "Category 1" },
    { x: 8, y: 7, z: 35, name: "Product G", category: "Category 3" },
    { x: 4, y: 5, z: 12, name: "Product H", category: "Category 2" },
    { x: 6, y: 1, z: 18, name: "Product I", category: "Category 3" },
  ],
};

const heatmapData = {
  data: [
    ...["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].flatMap(day =>
      ["9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM"].map(hour => ({
        x: day, y: hour,
        value: Math.floor(Math.random() * 80) + (hour === "12PM" || hour === "2PM" ? 40 : 0)
      }))
    )
  ],
};

const radarData = {
  data: [
    { subject: "Speed", frontend: 85, backend: 72, mobile: 68 },
    { subject: "Security", frontend: 70, backend: 95, mobile: 88 },
    { subject: "Scalability", frontend: 78, backend: 90, mobile: 60 },
    { subject: "DX", frontend: 92, backend: 80, mobile: 75 },
    { subject: "Performance", frontend: 80, backend: 88, mobile: 82 },
    { subject: "Testing", frontend: 75, backend: 85, mobile: 70 },
  ],
  metrics: ["frontend", "backend", "mobile"],
};

const pieData = {
  data: [
    { name: "JavaScript", value: 64, color: "#f59e0b" },
    { name: "Python", value: 31, color: "#8b5cf6" },
    { name: "Java", value: 18, color: "#06b6d4" },
    { name: "TypeScript", value: 43, color: "#10b981" },
    { name: "C#", value: 14, color: "#ec4899" },
    { name: "Other", value: 29, color: "#6366f1" },
  ],
};

const comparisonData = {
  columns: [
    { id: "feature", header: "Feature", accessorKey: "feature" },
    { id: "react", header: "React", accessorKey: "react" },
    { id: "vue", header: "Vue", accessorKey: "vue" },
    { id: "angular", header: "Angular", accessorKey: "angular" },
  ],
  data: [
    { feature: "Learning Curve", react: "Medium", vue: "Easy", angular: "Steep" },
    { feature: "Performance", react: "Excellent", vue: "Excellent", angular: "Good" },
    { feature: "Ecosystem", react: "Massive", vue: "Large", angular: "Large" },
    { feature: "TypeScript", react: "Optional", vue: "Optional", angular: "Built-in" },
    { feature: "Two-way Binding", react: false, vue: true, angular: true },
    { feature: "Mobile Support", react: "React Native", vue: "Vue Native", angular: "Ionic" },
    { feature: "SSR", react: "Next.js", vue: "Nuxt.js", angular: "Universal" },
    { feature: "Maintained by", react: "Meta", vue: "Community", angular: "Google" },
  ],
};

const parallelData = {
  data: [
    { price: 35, speed: 95, battery: 80, display: 90, camera: 85 },
    { price: 60, speed: 88, battery: 70, display: 95, camera: 92 },
    { price: 20, speed: 72, battery: 90, display: 75, camera: 65 },
    { price: 80, speed: 98, battery: 60, display: 98, camera: 96 },
    { price: 45, speed: 85, battery: 85, display: 82, camera: 78 },
    { price: 15, speed: 65, battery: 95, display: 68, camera: 55 },
  ],
  dimensions: ["price", "speed", "battery", "display", "camera"],
};

const wordCloudData = {
  words: [
    { text: "React", value: 90 }, { text: "TypeScript", value: 75 }, { text: "Next.js", value: 85 },
    { text: "JavaScript", value: 95 }, { text: "Node.js", value: 70 }, { text: "GraphQL", value: 55 },
    { text: "Docker", value: 65 }, { text: "AWS", value: 68 }, { text: "Prisma", value: 50 },
    { text: "Tailwind", value: 78 }, { text: "Vercel", value: 62 }, { text: "MongoDB", value: 58 },
    { text: "Redux", value: 52 }, { text: "Testing", value: 45 }, { text: "CI/CD", value: 48 },
    { text: "Performance", value: 60 }, { text: "Security", value: 55 }, { text: "API", value: 72 },
    { text: "Git", value: 80 }, { text: "Linux", value: 58 },
  ],
};

const syntaxData = {
  syntax: "REST API Endpoint Structure",
  rules: [
    { name: "HTTP Method", pattern: "GET | POST | PUT | DELETE | PATCH" },
    { name: "Base URL", pattern: "https://api.example.com/v1" },
    { name: "Resource Path", pattern: "/resources/{id}" },
    { name: "Query Params", pattern: "?filter=value&sort=asc&limit=20" },
    { name: "Request Body", pattern: '{ "key": "value", ... }' },
    { name: "Response", pattern: '{ "data": [...], "meta": { "total": n } }' },
  ],
};

// ─── Layout ───────────────────────────────────────────────────────────────────

const VIZZES = [
  { id: 1,  label: "Network Graph",        component: <NetworkGraph data={networkData} readOnly /> },
  { id: 2,  label: "Mind Map",             component: <MindMap data={mindMapData} readOnly /> },
  { id: 3,  label: "Tree Diagram",         component: <TreeDiagram data={treeData} readOnly /> },
  { id: 4,  label: "Timeline",             component: <Timeline data={timelineData} readOnly /> },
  { id: 5,  label: "Gantt Chart",          component: <GanttChart data={ganttData} /> },
  { id: 6,  label: "Animated Timeline",    component: <AnimatedTimeline data={animatedTimelineData} readOnly /> },
  { id: 7,  label: "Flowchart",            component: <Flowchart data={flowchartData} readOnly /> },
  { id: 8,  label: "Sankey Diagram",       component: <SankeyDiagram data={sankeyData} readOnly /> },
  { id: 9,  label: "Swimlane Diagram",     component: <SwimlaneDiagram data={swimlaneData} readOnly /> },
  { id: 10, label: "Line Chart",           component: <LineChart data={lineChartData} readOnly /> },
  { id: 11, label: "Bar Chart",            component: <BarChart data={barChartData} readOnly /> },
  { id: 12, label: "Scatter Plot",         component: <ScatterPlot data={scatterData} readOnly /> },
  { id: 13, label: "Heatmap",              component: <Heatmap data={heatmapData} readOnly /> },
  { id: 14, label: "Radar Chart",          component: <RadarChart data={radarData} readOnly /> },
  { id: 15, label: "Pie Chart",            component: <PieChart data={pieData} readOnly /> },
  { id: 16, label: "Comparison Table",     component: <ComparisonTable data={comparisonData} readOnly /> },
  { id: 17, label: "Parallel Coordinates", component: <ParallelCoords data={parallelData} readOnly /> },
  { id: 18, label: "Word Cloud",           component: <WordCloud data={wordCloudData} readOnly /> },
  { id: 19, label: "Syntax Diagram",       component: <SyntaxDiagram data={syntaxData} readOnly /> },
];

export default function VizTestPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Visualization Test Page</h1>
        <p className="text-zinc-500 text-sm mt-1">All 19 visualization types rendered with mock data</p>
      </div>
      <div className="grid grid-cols-1 gap-10">
        {VIZZES.map(({ id, label, component }) => (
          <div key={id} className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-600">{String(id).padStart(2, "0")}</span>
              <span className="text-sm font-semibold text-zinc-200">{label}</span>
            </div>
            <div className="h-[520px] w-full">
              {component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
