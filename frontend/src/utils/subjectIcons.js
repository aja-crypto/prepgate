// Subject + recommendation icon mapping
// Icons are stored as stable string identifiers and rendered with Lucide React.
import {
  BookOpen, Brain, Calculator, Code2, Cpu, Database, Network, Atom, GitBranch,
  CircuitBoard, Wrench, Target, Flame, RefreshCw, Clock, TrendingUp, CheckCircle2,
  AlertTriangle, ListChecks, PlayCircle, BarChart3, Sparkles, Zap,
} from 'lucide-react';

// Stable identifier per subject name (canonical + aliases). Never render raw emoji.
const SUBJECT_ICON_MAP = {
  'engineering mathematics': Calculator,
  'engineering maths': Calculator,
  'mathematics': Calculator,
  'maths': Calculator,
  'digital logic': CircuitBoard,
  'computer organization': Cpu,
  'coa': Cpu,
  'programming & ds': Code2,
  'programming & data structures': Code2,
  'programming': Code2,
  'data structures': Code2,
  'c programming': Code2,
  'algorithms': GitBranch,
  'operating systems': Cpu,
  'os': Cpu,
  'dbms': Database,
  'computer networks': Network,
  'cn': Network,
  'theory of computation': Atom,
  'toc': Atom,
  'compiler design': Wrench,
  'compiler': Wrench,
  'aptitude': Brain,
  'general aptitude': Brain,
};

// Icon for generic recommendation types
export const REC_ICONS = {
  weak: AlertTriangle,
  topic: ListChecks,
  pyq: Target,
  revision: RefreshCw,
  mock: BarChart3,
  next: Sparkles,
  review: RefreshCw,
  study: BookOpen,
  done: CheckCircle2,
  time: Clock,
  trend: TrendingUp,
  play: PlayCircle,
  energy: Zap,
  default: BookOpen,
};

/** Resolve a Lucide icon component for a subject name (case-insensitive). */
export function subjectIcon(name = '', fallback = BookOpen) {
  if (!name) return fallback;
  return SUBJECT_ICON_MAP[name.toLowerCase().trim()] || fallback;
}

/** Resolve a Lucide icon component for a recommendation type key. */
export function recIcon(type = 'default') {
  return REC_ICONS[type] || REC_ICONS.default;
}

/** Map an arbitrary source icon string to a Lucide icon (used when data may carry emoji or mojibake). */
export function safeIcon(iconStr, name, fallback = BookOpen) {
  if (iconStr && iconStr.codePointAt(0) <= 0xFFFF && SUBJECT_ICON_MAP[name?.toLowerCase?.()]) {
    return SUBJECT_ICON_MAP[name.toLowerCase()];
  }
  return subjectIcon(name, fallback);
}
