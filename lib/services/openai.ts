import OpenAI from 'openai';
import { z } from 'zod';
import type { NetworkGraphData, VisualizationType } from '../types/visualization';

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Zod schemas for validation
const FormatSelectionSchema = z.object({
  visualizable: z.boolean(),
  format: z.enum(['network_graph', 'mind_map', 'none']),
  reason: z.string(),
});

const NetworkGraphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
    })
  ),
});

/**
 * Analyzes user input and determines the optimal visualization format
 */
export async function analyzeAndSelectFormat(
  userInput: string
): Promise<{ visualizable: boolean; format: VisualizationType | 'none'; reason: string }> {
  const systemPrompt = `You are an AI that analyzes content and determines the best visualization format.

You have access to these visualization formats:
1. network_graph - For concepts with relationships, dependencies, org structures, knowledge graphs
2. mind_map - For brainstorming, hierarchical notes, idea organization, tree structures

Analyze the user's input and determine:
1. Is this content visualizable? (true/false)
2. If yes, which format is most suitable? (network_graph or mind_map)
3. Why did you choose this format?

Respond in JSON format with: { "visualizable": boolean, "format": string, "reason": string }
If not visualizable, use format "none".`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseContent);
    const validated = FormatSelectionSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error in analyzeAndSelectFormat:', error);
    throw new Error('Failed to analyze input');
  }
}

/**
 * Generates network graph data from user input
 */
export async function generateNetworkGraph(userInput: string): Promise<NetworkGraphData> {
  const systemPrompt = `You are an AI that converts text into network graph data.

Create a network graph with nodes and edges representing concepts and their relationships.

Rules:
- Each node should have: id (unique), label (short name), description (optional), category (optional)
- Each edge should have: id (unique), source (node id), target (node id), label (optional)
- Create meaningful relationships that help understand the concept
- Use clear, concise labels
- Maximum 15 nodes for clarity

Respond in JSON format matching this structure:
{
  "nodes": [{"id": "node1", "label": "Label", "description": "...", "category": "..."}],
  "edges": [{"id": "edge1", "source": "node1", "target": "node2", "label": "..."}]
}`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseContent);
    const validated = NetworkGraphSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Error in generateNetworkGraph:', error);
    throw new Error('Failed to generate network graph');
  }
}

/**
 * Generates mind map markdown from user input
 */
export async function generateMindMap(userInput: string): Promise<string> {
  const systemPrompt = `You are an AI that converts text into mind map markdown format.

Create a hierarchical mind map structure using markdown format.

Rules:
- Use markdown headers (# for main topic, ## for subtopics, ### for sub-subtopics, etc.)
- Create a clear hierarchy that represents the information structure
- Keep it organized and logical
- Maximum 4 levels deep for clarity

Example format:
# Main Topic
## Subtopic 1
### Detail 1.1
### Detail 1.2
## Subtopic 2
### Detail 2.1

Respond with ONLY the markdown content, no additional text.`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    return responseContent.trim();
  } catch (error) {
    console.error('Error in generateMindMap:', error);
    throw new Error('Failed to generate mind map');
  }
}
