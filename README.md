# Universal Visualization Engine

An AI-powered platform that transforms any text, data, or concept into beautiful interactive visualizations.

## Features Implemented

### 1. Network Graph (Feature 1)
- Interactive node-based visualizations for concepts and relationships
- Uses React Flow with Framer Motion animations
- Best for: concepts, org structures, dependencies, knowledge graphs

### 2. Mind Map (Feature 2)
- Hierarchical mind map visualizations
- Uses Markmap for beautiful, interactive mind maps
- Best for: brainstorming, note hierarchies, idea organization

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualizations**: React Flow, Markmap
- **Animations**: Framer Motion
- **AI**: OpenAI GPT-4
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 20+
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd visualme
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **User Input**: Enter any text, concept, or question you want to visualize
2. **AI Analysis**: GPT-4 analyzes the content and determines:
   - Is it visualizable?
   - Which format is best suited? (Network Graph or Mind Map)
3. **Data Generation**: AI generates structured data for the chosen visualization
4. **Interactive Visualization**: Beautiful, interactive visualization is rendered with animations

## Usage Examples

Try these sample prompts:

- "Explain machine learning and its main branches"
- "Show me the structure of a modern web application"
- "Visualize the process of photosynthesis"
- "Create a mind map of project management concepts"

## Project Structure

```
visualme/
├── app/
│   ├── api/
│   │   └── visualize/          # API endpoint for visualization generation
│   ├── components/             # React components
│   │   ├── NetworkGraph.tsx    # Network graph visualization
│   │   └── MindMap.tsx         # Mind map visualization
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── lib/
│   ├── services/
│   │   └── openai.ts           # OpenAI service layer
│   └── types/
│       └── visualization.ts    # TypeScript types
└── ...
```

## Good Practices Implemented

- **Type Safety**: Full TypeScript implementation with proper types
- **Validation**: Zod schemas for runtime validation of AI responses
- **Error Handling**: Comprehensive error handling throughout the application
- **Separation of Concerns**: Clear separation between API, services, and UI
- **Component Reusability**: Modular component structure
- **Loading States**: Proper loading indicators for async operations
- **User Feedback**: Clear error messages and success states

## Future Enhancements

The project documentation includes 17 more visualization formats that can be added:
- Timelines, Gantt charts, Flowcharts, Sankey diagrams
- Various statistical charts (Line, Bar, Scatter, etc.)
- And more...

## License

MIT
