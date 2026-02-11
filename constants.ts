
import { MultiverseNode, FutureType } from './types';

// Colors for different future cones
export const COLORS = {
  [FutureType.ROOT]: '#ffffff',
  [FutureType.PROBABLE]: '#4ade80', // Green-400
  [FutureType.PLAUSIBLE]: '#60a5fa', // Blue-400
  [FutureType.POSSIBLE]: '#a78bfa', // Purple-400
  [FutureType.PREPOSTEROUS]: '#f472b6', // Pink-400
};

// Initial dataset: A designer at the crossroads
export const INITIAL_NODES: MultiverseNode[] = [
  {
    id: 'root',
    parentId: null,
    type: FutureType.ROOT,
    position: [0, 0, 0],
    title: 'Current Self',
    description: 'UX Designer at a mid-sized tech firm. Feeling slightly burnt out by dark patterns. Values empathy but constrained by KPIs.',
    principles: ['User Advocacy', 'Simplicity'],
    color: COLORS[FutureType.ROOT],
    linkedIds: [],
  },
  
  // --- THE UTOPIAN / NEUTRAL HORIZON (Upper Hemisphere) ---
  
  // Probable Future (Linear projection)
  {
    id: 'prob-1',
    parentId: 'root',
    type: FutureType.PROBABLE,
    position: [0, 0, 10], // Straight ahead in time
    title: 'Senior Product Owner',
    description: 'You climbed the ladder. You now manage the metrics you used to hate. Efficiency is king.',
    principles: ['Efficiency', 'Growth', 'Stability'],
    color: COLORS[FutureType.PROBABLE],
    linkedIds: [],
  },
  // Plausible Future (Slight divergence)
  {
    id: 'plaus-1',
    parentId: 'root',
    type: FutureType.PLAUSIBLE,
    position: [5, 2, 12],
    title: 'Freelance Ethical Consultant',
    description: 'You left the firm to advise on "Ethical AI". It pays less, but you sleep better. Clients are rare.',
    principles: ['Ethics', 'Autonomy', 'Transparency'],
    color: COLORS[FutureType.PLAUSIBLE],
    linkedIds: [],
  },
  // Possible Future (New knowledge required)
  {
    id: 'poss-1',
    parentId: 'root',
    type: FutureType.POSSIBLE,
    position: [-8, 4, 15], // Moved slightly up to contrast with dystopia
    title: 'Bio-Digital Weaver',
    description: 'Design has merged with biology. You grow interfaces using mycelium networks. The screen is obsolete.',
    principles: ['Biomimicry', 'Regeneration', 'Symbiosis'],
    color: COLORS[FutureType.POSSIBLE],
    linkedIds: [],
  },
  // Preposterous Future (Radical break)
  {
    id: 'prep-1',
    parentId: 'root',
    type: FutureType.PREPOSTEROUS,
    position: [15, 10, 18],
    title: 'Post-Human Architect',
    description: 'You design experiences for collective consciousnesses uploading to the cloud. Individuality is a legacy concept.',
    principles: ['Transhumanism', 'Collectivism', 'Immortality'],
    color: COLORS[FutureType.PREPOSTEROUS],
    linkedIds: [],
  },
   // Another Preposterous
  {
    id: 'prep-2',
    parentId: 'root',
    type: FutureType.PREPOSTEROUS,
    position: [-12, 8, 14],
    title: 'Neo-Luddite Scribe',
    description: 'Technology collapsed. You are the village record keeper, carving history into stone to preserve it from bit-rot.',
    principles: ['Preservation', 'Tangibility', 'Community'],
    color: COLORS[FutureType.PREPOSTEROUS],
    linkedIds: [],
  },

  // --- EXPANDED UTOPIAS (Balancing the Upper Hemisphere) ---

  {
    id: 'plaus-2',
    parentId: 'root',
    type: FutureType.PLAUSIBLE,
    position: [6, 5, 11],
    title: 'Regenerative Strategist',
    description: 'You shifted the company KPI from "Profit" to "Planetary Health". You design supply chains that heal the soil they harvest from.',
    principles: ['Regeneration', 'Circularity', 'Net-Positive'],
    color: COLORS[FutureType.PLAUSIBLE],
    linkedIds: [],
  },
  {
    id: 'poss-2',
    parentId: 'root',
    type: FutureType.POSSIBLE,
    position: [-5, 9, 16],
    title: 'Empathy Interface Healer',
    description: 'You work in hospitals, designing VR spaces that reduce physical pain for patients through neuro-aesthetic feedback loops.',
    principles: ['Care', 'Neuro-aesthetics', 'Healing'],
    color: COLORS[FutureType.POSSIBLE],
    linkedIds: [],
  },
  {
    id: 'prep-3',
    parentId: 'root',
    type: FutureType.PREPOSTEROUS,
    position: [2, 18, 22],
    title: 'Interspecies Diplomat',
    description: 'You design translation interfaces between humans, whales, and forest networks. The client meeting involves spores and sonar.',
    principles: ['Deep Ecology', 'Non-Human Centric', 'Translation'],
    color: COLORS[FutureType.PREPOSTEROUS],
    linkedIds: [],
  },

  // --- THE DYSTOPIAN UNDERWORLD (Lower Hemisphere) ---
  
  // Probable Dystopia (The Dark Path)
  {
    id: 'prob-dys-1',
    parentId: 'root',
    type: FutureType.PROBABLE,
    position: [0, -12, 10], // Deep below the Probable counterpart
    title: 'Dark Pattern Architect',
    description: 'You stayed and stopped caring. You now design addiction loops for gambling apps targeting minors. The pay is incredible.',
    principles: ['Retention', 'Addiction', 'Obfuscation'],
    color: COLORS[FutureType.PROBABLE],
    linkedIds: [],
  },
  // Plausible Dystopia (Gig Economy Hell)
  {
    id: 'plaus-dys-1',
    parentId: 'root',
    type: FutureType.PLAUSIBLE,
    position: [-6, -15, 12],
    title: 'Platform Serf 492',
    description: 'The gig economy swallowed the industry. You bid against AI for micro-tasks. No benefits, no name, just an ID.',
    principles: ['Survival', 'Speed', 'Compliance'],
    color: COLORS[FutureType.PLAUSIBLE],
    linkedIds: [],
  },
  // Possible Dystopia (Resource Collapse)
  {
    id: 'poss-dys-1',
    parentId: 'root',
    type: FutureType.POSSIBLE,
    position: [8, -18, 16],
    title: 'Climate Triage Officer',
    description: 'Resources collapsed. You design the interfaces that determine calorie rationing for the zones. Red light means starvation.',
    principles: ['Rationing', 'Control', 'Triage'],
    color: COLORS[FutureType.POSSIBLE],
    linkedIds: [],
  },
  // Preposterous Dystopia (The Machine God)
  {
    id: 'prep-dys-1',
    parentId: 'root',
    type: FutureType.PREPOSTEROUS,
    position: [0, -25, 20], // The deepest point
    title: 'Cognitive Battery',
    description: 'The Singularity happened, but it wasn\'t benevolent. Humans are kept in stasis to process captcha-like logic puzzles for the Machine God.',
    principles: ['Submission', 'Processing', 'Silence'],
    color: COLORS[FutureType.PREPOSTEROUS],
    linkedIds: [],
  },

  // --- EXPANDED DYSTOPIAS (Further enhancing the negative Y-axis) ---
  
  {
    id: 'prob-dys-2',
    parentId: 'root',
    type: FutureType.PROBABLE,
    position: [-3, -8, 8],
    title: 'Subscription Life',
    description: 'You own nothing. Your apartment, clothes, and even the software in your fridge are on a daily subscription. Miss a payment, lose your life(style).',
    principles: ['Rent-Seeking', 'Dependency', 'Access over Ownership'],
    color: COLORS[FutureType.PROBABLE],
    linkedIds: [],
  },
  {
    id: 'plaus-dys-2',
    parentId: 'root',
    type: FutureType.PLAUSIBLE,
    position: [6, -14, 14],
    title: 'Biometric Paywall',
    description: 'Privacy is a luxury good. To access public transit or healthcare, you trade real-time biometric data. The poor are open books.',
    principles: ['Surveillance', 'Data Currency', 'Inequality'],
    color: COLORS[FutureType.PLAUSIBLE],
    linkedIds: [],
  },
  {
    id: 'poss-dys-2',
    parentId: 'root',
    type: FutureType.POSSIBLE,
    position: [-10, -20, 18],
    title: 'Memory Holed',
    description: 'AI generates history in real-time to suit political narratives. You work in "Consistency Enforcement," deleting physical artifacts that contradict the feed.',
    principles: ['Revisionism', 'Censorship', 'Fluid Reality'],
    color: COLORS[FutureType.POSSIBLE],
    linkedIds: [],
  },
  {
    id: 'prep-dys-2',
    parentId: 'root',
    type: FutureType.PREPOSTEROUS,
    position: [10, -22, 18],
    title: 'Digital Feudalism',
    description: 'Nation states have dissolved. You live in the Amazon™ Caliphate, designing loyalty rewards for the warrior-caste delivery drones.',
    principles: ['Corporate Sovereignty', 'Loyalty', 'Gamification'],
    color: COLORS[FutureType.PREPOSTEROUS],
    linkedIds: [],
  },
];
