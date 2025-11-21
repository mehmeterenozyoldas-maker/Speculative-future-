
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
    position: [-8, -4, 15],
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
];
