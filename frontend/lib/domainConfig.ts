export type DomainTheme = {
  // Header
  gradient: string;
  headerTitle: string;
  headerSubtitle: string;
  // Landing page
  welcomeIcon: string;
  welcomeHeading: string;
  welcomeSubtext: string;
  suggestedQuestions: string[];
  // Input area
  inputPlaceholder: string;
  inputFocus: string;
  footerText: string;
  // Buttons
  accentColor: string;
  accentHover: string;
  accentDisabled: string;
  accentBorder: string;
  // Message bubble — user
  userBubble: string;
  loadingDot: string;
  // Message bubble — assistant headings
  h1Color: string;
  h2Color: string;
  // Message bubble — audio button
  audioBtn: string;
  // Message bubble — cited sources
  sourcesBorder: string;
  sourcesLabel: string;
  sourceItem: string;
  sourceTitle: string;
  sourceCategory: string;
  sourceImageBorder: string;
  // Suggested questions chip
  chipBorder: string;
  chipBorderHover: string;
  chipText: string;
  chipTextHover: string;
  chipBgHover: string;
  chipLabel: string;
  // Background
  messageBg: string;
};

const DOMAIN_THEMES: Record<string, DomainTheme> = {
  fitness: {
    gradient: 'bg-gradient-to-r from-red-700 via-red-600 to-red-800',
    headerTitle: 'Your Personal Fitness Assistant',
    headerSubtitle: 'Get expert fitness guidance powered by AI. Ask anything about workouts, health, and training.',
    welcomeIcon: '💪',
    welcomeHeading: 'Welcome to Your Fitness Journey',
    welcomeSubtext: 'Ask any fitness question and receive personalized expert guidance',
    suggestedQuestions: [
      'How do I start working out as a beginner?',
      'How can I increase my stamina and endurance?',
      'Why does exercise reduce stress and anxiety?',
      'What is the best way to recover after intense training?',
      'How does exercise improve brain health?',
      'What are effective breathing techniques during workouts?',
    ],
    inputPlaceholder: 'Ask me anything about fitness... (Shift+Enter for new line)',
    inputFocus: 'focus:border-red-600 focus:ring-2 focus:ring-red-500/50',
    footerText: 'Powered by AI • Expert Fitness Knowledge • Instant Responses',
    accentColor: 'bg-red-700',
    accentHover: 'hover:bg-red-800',
    accentDisabled: 'disabled:bg-red-300',
    accentBorder: 'border-red-100',
    userBubble: 'bg-red-700 text-white rounded-tr-sm',
    loadingDot: 'bg-red-400',
    h1Color: 'text-red-700',
    h2Color: 'text-red-600',
    audioBtn: 'bg-red-100 hover:bg-red-200 disabled:bg-red-200 text-red-700',
    sourcesBorder: 'border-red-300',
    sourcesLabel: 'text-red-700',
    sourceItem: 'text-red-900 bg-red-50 border border-red-200',
    sourceTitle: 'text-red-800',
    sourceCategory: 'text-red-600',
    sourceImageBorder: 'border-red-200',
    chipBorder: 'border-red-300',
    chipBorderHover: 'hover:border-red-600',
    chipText: 'text-red-900',
    chipTextHover: 'hover:text-red-700',
    chipBgHover: 'hover:bg-red-50',
    chipLabel: 'text-red-700',
    messageBg: 'bg-gradient-to-b from-white to-red-50',
  },
  plants: {
    gradient: 'bg-gradient-to-r from-green-700 via-green-600 to-green-800',
    headerTitle: 'Your Personal Plant Care Assistant',
    headerSubtitle: 'Get expert plant care guidance powered by AI. Ask anything about growing, caring, and nurturing plants.',
    welcomeIcon: '🌱',
    welcomeHeading: 'Welcome to Your Plant Journey',
    welcomeSubtext: 'Ask any plant care question and receive personalized expert guidance',
    suggestedQuestions: [
      'How do I care for indoor plants with low light?',
      'What is the best soil mix for succulents?',
      'How often should I water my plants?',
      'Why are my plant leaves turning yellow?',
      'Which plants are best for beginners?',
      'How do I propagate plants from cuttings?',
    ],
    inputPlaceholder: 'Ask me anything about plants and gardening... (Shift+Enter for new line)',
    inputFocus: 'focus:border-green-600 focus:ring-2 focus:ring-green-500/50',
    footerText: 'Powered by AI • Expert Plant Care Knowledge • Instant Responses',
    accentColor: 'bg-green-700',
    accentHover: 'hover:bg-green-800',
    accentDisabled: 'disabled:bg-green-300',
    accentBorder: 'border-green-100',
    userBubble: 'bg-green-700 text-white rounded-tr-sm',
    loadingDot: 'bg-green-400',
    h1Color: 'text-green-700',
    h2Color: 'text-green-600',
    audioBtn: 'bg-green-100 hover:bg-green-200 disabled:bg-green-200 text-green-700',
    sourcesBorder: 'border-green-300',
    sourcesLabel: 'text-green-700',
    sourceItem: 'text-green-900 bg-green-50 border border-green-200',
    sourceTitle: 'text-green-800',
    sourceCategory: 'text-green-600',
    sourceImageBorder: 'border-green-200',
    chipBorder: 'border-green-300',
    chipBorderHover: 'hover:border-green-600',
    chipText: 'text-green-900',
    chipTextHover: 'hover:text-green-700',
    chipBgHover: 'hover:bg-green-50',
    chipLabel: 'text-green-700',
    messageBg: 'bg-gradient-to-b from-white to-green-50',
  },
};

const domain = process.env.NEXT_PUBLIC_DOMAIN ?? 'fitness';
export const dc = DOMAIN_THEMES[domain] ?? DOMAIN_THEMES.fitness;
