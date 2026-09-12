import React from 'react';
import {
  Atom,
  Sparkles,
  Building2,
  FlaskConical,
  Cpu,
  GraduationCap,
  Briefcase,
  Layers,
} from 'lucide-react';

export function getEngagementIcon(title: string, id: string): React.ComponentType<{ className?: string }> {
  const lower = (title + ' ' + id).toLowerCase();

  if (lower.includes('quantum') || lower.includes('qc')) {
    return Atom;
  }
  if (lower.includes('wics') || lower.includes('women')) {
    return Sparkles;
  }
  if (lower.includes('stanford')) {
    return Building2;
  }
  if (lower.includes('pairr') || lower.includes('paiir') || lower.includes('research') || lower.includes('lab')) {
    return FlaskConical;
  }
  if (lower.includes('aws') || lower.includes('ml') || lower.includes('cloud') || lower.includes('ai')) {
    return Cpu;
  }
  if (lower.includes('davis') || lower.includes('student') || lower.includes('cs') || lower.includes('academic')) {
    return GraduationCap;
  }

  return Briefcase;
}

export { Layers };
