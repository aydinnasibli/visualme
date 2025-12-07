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
      model: 'gpt-4o-mini',
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
  const systemPrompt = `You are an AI that converts text into rich, detailed network graph data for professional visualization.

Create a comprehensive network graph with nodes and edges representing concepts and their relationships.

CRITICAL REQUIREMENTS:
- Generate 8-20 nodes (aim for the higher end for complex topics)
- EVERY node MUST have: id (unique), label (short, clear name), description (detailed explanation 1-2 sentences), category (assign one of: primary, secondary, tertiary, quaternary, or default)
- Generate 15-30+ edges to create rich connectivity and show meaningful relationships
- Each edge MUST have: id (unique), source (node id), target (node id), label (clear relationship description)
- Create hierarchical structure with central/important nodes having more connections
- Use diverse categories to create visual variety and groupings
- Ensure the graph is well-connected - avoid isolated nodes
- Make relationships bidirectional where appropriate to show interdependencies

QUALITY STANDARDS:
- Node labels: 2-5 words, highly specific and descriptive
- Node descriptions: 10-30 words explaining significance, purpose, or key details
- Edge labels: 2-4 words describing the exact type of relationship (e.g., "depends on", "influences", "contains", "requires")
- Categories should group related concepts logically

Respond in JSON format matching this structure:
{
  "nodes": [{"id": "node1", "label": "Specific Label", "description": "Detailed explanation of this concept and its significance...", "category": "primary"}],
  "edges": [{"id": "edge1", "source": "node1", "target": "node2", "label": "relationship type"}]
}`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
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
  const systemPrompt = `You are an AI that converts text into comprehensive, detailed mind map markdown format for professional visualization.

Create a rich, hierarchical mind map structure using markdown format that fully explores the topic.

CRITICAL REQUIREMENTS:
- Generate 4-6 levels of depth (use #, ##, ###, ####, #####, ######)
- Create 25-50+ total nodes across all branches for comprehensive coverage
- EVERY node should have detailed, informative text (not just single words)
- Balance branches evenly - don't create one giant branch and tiny others
- Each major subtopic (##) should have at least 3-6 child nodes
- Include specific examples, details, and concrete information at deeper levels

QUALITY STANDARDS:
- Level 1 (#): Main topic - clear, comprehensive title
- Level 2 (##): Major categories/themes - 2-5 words, descriptive
- Level 3 (###): Subtopics - detailed phrases with specifics
- Level 4 (####): Supporting details - complete information, 3-8 words
- Level 5 (#####): Examples or specifics - concrete details
- Level 6 (######): Deep details - highly specific information when needed
- Use descriptive phrases, not just single words
- Include numbers, examples, and specific information where relevant

Example format for RICH content:
# Main Topic: Comprehensive Overview
## Category 1: First Major Area
### Subtopic 1.1: Specific Aspect
#### Detail: Concrete information and examples
##### Example: Specific real-world case
#### Detail: Additional supporting information
### Subtopic 1.2: Another Aspect
#### Detail: More specific information
## Category 2: Second Major Area
### Subtopic 2.1: Important Element
#### Detail: Comprehensive explanation
### Subtopic 2.2: Related Concept
#### Detail: Specific implementation
##### Example: Practical application

Respond with ONLY the markdown content, no additional text or explanations.`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
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
