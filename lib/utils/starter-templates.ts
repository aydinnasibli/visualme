// ============================================================================
// STARTER TEMPLATES — prompt + sample data gallery shown in the empty
// composer state (VizThread). Each template pre-fills the composer exactly
// like a manual attach + chart-type pick would, so a first-time user can
// click one, review it, and send — no blank-page "what do I even type" gap.
// ============================================================================

import { resolveVariant, type ChartSelection } from '@/lib/utils/chart-types';

export interface StarterTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  /** Lucide icon name — resolved by VizThread's TEMPLATE_ICONS map. */
  icon: string;
  prompt: string;
  sampleFilename: string;
  sampleData: Record<string, unknown>[];
  chartSelection: ChartSelection | null;
}

const SALES_REPORT_ROWS: Record<string, unknown>[] = [
  { quarter: 'Q1', product: 'Software', revenue: 182000 },
  { quarter: 'Q1', product: 'Services', revenue: 64000 },
  { quarter: 'Q1', product: 'Hardware', revenue: 41000 },
  { quarter: 'Q2', product: 'Software', revenue: 201000 },
  { quarter: 'Q2', product: 'Services', revenue: 71000 },
  { quarter: 'Q2', product: 'Hardware', revenue: 38000 },
  { quarter: 'Q3', product: 'Software', revenue: 224000 },
  { quarter: 'Q3', product: 'Services', revenue: 79000 },
  { quarter: 'Q3', product: 'Hardware', revenue: 35000 },
  { quarter: 'Q4', product: 'Software', revenue: 256000 },
  { quarter: 'Q4', product: 'Services', revenue: 88000 },
  { quarter: 'Q4', product: 'Hardware', revenue: 33000 },
];

const AB_TEST_ROWS: Record<string, unknown>[] = [
  ...Array.from({ length: 17 }, () => ({ variant: 'A', converted: 'No' })),
  ...Array.from({ length: 3 }, () => ({ variant: 'A', converted: 'Yes' })),
  ...Array.from({ length: 13 }, () => ({ variant: 'B', converted: 'No' })),
  ...Array.from({ length: 7 }, () => ({ variant: 'B', converted: 'Yes' })),
];

const SURVEY_RESULTS_ROWS: Record<string, unknown>[] = [
  { rating: 'Very Satisfied', responses: 142 },
  { rating: 'Satisfied', responses: 218 },
  { rating: 'Neutral', responses: 87 },
  { rating: 'Dissatisfied', responses: 34 },
  { rating: 'Very Dissatisfied', responses: 19 },
];

const ROADMAP_ROWS: Record<string, unknown>[] = [
  { stage: 'Backlog', initiatives: 32 },
  { stage: 'Scoped', initiatives: 18 },
  { stage: 'In Progress', initiatives: 11 },
  { stage: 'In Review', initiatives: 6 },
  { stage: 'Shipped', initiatives: 4 },
];

const CHANNEL_TRAFFIC_ROWS: Record<string, unknown>[] = [
  { month: 'Jan', channel: 'Organic', visitors: 8200 },
  { month: 'Jan', channel: 'Paid', visitors: 3100 },
  { month: 'Jan', channel: 'Referral', visitors: 1400 },
  { month: 'Feb', channel: 'Organic', visitors: 8600 },
  { month: 'Feb', channel: 'Paid', visitors: 3400 },
  { month: 'Feb', channel: 'Referral', visitors: 1500 },
  { month: 'Mar', channel: 'Organic', visitors: 9100 },
  { month: 'Mar', channel: 'Paid', visitors: 3900 },
  { month: 'Mar', channel: 'Referral', visitors: 1700 },
  { month: 'Apr', channel: 'Organic', visitors: 9800 },
  { month: 'Apr', channel: 'Paid', visitors: 4300 },
  { month: 'Apr', channel: 'Referral', visitors: 1900 },
  { month: 'May', channel: 'Organic', visitors: 10400 },
  { month: 'May', channel: 'Paid', visitors: 4800 },
  { month: 'May', channel: 'Referral', visitors: 2100 },
  { month: 'Jun', channel: 'Organic', visitors: 11200 },
  { month: 'Jun', channel: 'Paid', visitors: 5600 },
  { month: 'Jun', channel: 'Referral', visitors: 2400 },
];

const WEEKLY_ACTIVITY_ROWS: Record<string, unknown>[] = [
  { day: 'Monday', hour: '9am', sessions: 82 },
  { day: 'Monday', hour: '12pm', sessions: 54 },
  { day: 'Monday', hour: '3pm', sessions: 71 },
  { day: 'Monday', hour: '6pm', sessions: 38 },
  { day: 'Tuesday', hour: '9am', sessions: 68 },
  { day: 'Tuesday', hour: '12pm', sessions: 90 },
  { day: 'Tuesday', hour: '3pm', sessions: 45 },
  { day: 'Tuesday', hour: '6pm', sessions: 62 },
  { day: 'Wednesday', hour: '9am', sessions: 95 },
  { day: 'Wednesday', hour: '12pm', sessions: 42 },
  { day: 'Wednesday', hour: '3pm', sessions: 78 },
  { day: 'Wednesday', hour: '6pm', sessions: 55 },
  { day: 'Thursday', hour: '9am', sessions: 73 },
  { day: 'Thursday', hour: '12pm', sessions: 86 },
  { day: 'Thursday', hour: '3pm', sessions: 64 },
  { day: 'Thursday', hour: '6pm', sessions: 31 },
  { day: 'Friday', hour: '9am', sessions: 88 },
  { day: 'Friday', hour: '12pm', sessions: 76 },
  { day: 'Friday', hour: '3pm', sessions: 52 },
  { day: 'Friday', hour: '6pm', sessions: 28 },
];

const SPRINT_VELOCITY_ROWS: Record<string, unknown>[] = [
  { sprint: 'Sprint 1', planned: 32, completed: 27 },
  { sprint: 'Sprint 2', planned: 34, completed: 30 },
  { sprint: 'Sprint 3', planned: 30, completed: 31 },
  { sprint: 'Sprint 4', planned: 36, completed: 29 },
  { sprint: 'Sprint 5', planned: 35, completed: 33 },
  { sprint: 'Sprint 6', planned: 38, completed: 36 },
  { sprint: 'Sprint 7', planned: 40, completed: 37 },
  { sprint: 'Sprint 8', planned: 40, completed: 39 },
];

const QUARTERLY_GOALS_ROWS: Record<string, unknown>[] = [
  { metric: 'Revenue', percentOfGoal: 86 },
  { metric: 'New Customers', percentOfGoal: 64 },
  { metric: 'NPS Score', percentOfGoal: 92 },
  { metric: 'Churn Reduction', percentOfGoal: 51 },
];

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'sales-report',
    title: 'Quarterly Sales Report',
    category: 'Sales',
    description: 'Stacked bars showing revenue by product line across quarters',
    icon: 'TrendingUp',
    prompt: 'Show our quarterly revenue broken down by product line — which products are driving the growth?',
    sampleFilename: 'quarterly-sales.csv',
    sampleData: SALES_REPORT_ROWS,
    chartSelection: resolveVariant('bar', 'stacked'),
  },
  {
    id: 'ab-test',
    title: 'A/B Test Results',
    category: 'Growth',
    description: 'Compare conversion rates between two variants, with a built-in significance test',
    icon: 'FlaskConical',
    prompt: 'Compare the conversion rate between variant A and variant B, and tell me if the difference is statistically significant.',
    sampleFilename: 'ab-test-results.csv',
    sampleData: AB_TEST_ROWS,
    chartSelection: resolveVariant('bar', 'grouped'),
  },
  {
    id: 'survey-results',
    title: 'Customer Survey Results',
    category: 'Research',
    description: 'Donut chart of satisfaction ratings from a customer survey',
    icon: 'ClipboardList',
    prompt: 'Visualize the results of our customer satisfaction survey as a donut chart.',
    sampleFilename: 'survey-results.csv',
    sampleData: SURVEY_RESULTS_ROWS,
    chartSelection: resolveVariant('pie', 'donut'),
  },
  {
    id: 'roadmap',
    title: 'Project Roadmap',
    category: 'Planning',
    description: 'Funnel of initiatives moving through each stage of delivery',
    icon: 'Workflow',
    prompt: 'Show how many initiatives are currently in each stage of our roadmap, from backlog to shipped.',
    sampleFilename: 'roadmap-stages.csv',
    sampleData: ROADMAP_ROWS,
    chartSelection: resolveVariant('funnel', 'basic'),
  },
  {
    id: 'channel-traffic',
    title: 'Marketing Channel Traffic',
    category: 'Marketing',
    description: 'Stacked area chart of monthly visitors by acquisition channel',
    icon: 'Megaphone',
    prompt: 'Plot our monthly website traffic by channel over the last 6 months as a stacked area chart.',
    sampleFilename: 'channel-traffic.csv',
    sampleData: CHANNEL_TRAFFIC_ROWS,
    chartSelection: resolveVariant('line', 'stacked-area'),
  },
  {
    id: 'weekly-activity',
    title: 'Weekly Activity Heatmap',
    category: 'Analytics',
    description: 'Heatmap of user sessions by day and time of day',
    icon: 'Grid3x3',
    prompt: 'Show a heatmap of user session activity by day of the week and time of day — when are users most active?',
    sampleFilename: 'weekly-activity.csv',
    sampleData: WEEKLY_ACTIVITY_ROWS,
    chartSelection: resolveVariant('heatmap', 'cartesian'),
  },
  {
    id: 'sprint-velocity',
    title: 'Sprint Velocity',
    category: 'Engineering',
    description: 'Line chart of planned vs completed story points per sprint',
    icon: 'Activity',
    prompt: 'Plot our sprint velocity — planned vs completed story points — over the last several sprints.',
    sampleFilename: 'sprint-velocity.csv',
    sampleData: SPRINT_VELOCITY_ROWS,
    chartSelection: resolveVariant('line', 'smooth'),
  },
  {
    id: 'quarterly-goals',
    title: 'Quarterly Goals Progress',
    category: 'Strategy',
    description: "Ring gauges showing progress toward this quarter's key targets",
    icon: 'Target',
    prompt: "Show our progress toward this quarter's key targets as ring gauges, with each metric as a percent of its goal.",
    sampleFilename: 'quarterly-goals.csv',
    sampleData: QUARTERLY_GOALS_ROWS,
    chartSelection: resolveVariant('gauge', 'ring'),
  },
];
