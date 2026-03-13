import { Injectable } from '@nestjs/common';
import { Objection } from '../common/models/funnel.model';

export interface IntentResult {
  intentLabel: string;
  confidence: number;
  detectedObjection?: Objection;
}

@Injectable()
export class IntentClassifierService {
  classify(text: string, objections: Objection[]): IntentResult {
    const normalized = text.trim().toLowerCase();

    if (normalized.length === 0) {
      return { intentLabel: 'off-topic', confidence: 0.35 };
    }

    if (/\b(no|not interested|stop|do not call|dont call)\b/.test(normalized)) {
      return { intentLabel: 'hard-rejection', confidence: 0.92 };
    }

    if (/\b(yes|okay|ok|sure|continue|proceed)\b/.test(normalized)) {
      return { intentLabel: 'consent', confidence: 0.88 };
    }

    if (/\b(why|what|how|when|\?)\b/.test(normalized)) {
      return { intentLabel: 'question', confidence: 0.8 };
    }

    const objection = objections.find((entry) => normalized.includes(entry.title.toLowerCase().split(' ')[0]));
    if (objection) {
      return { intentLabel: 'objection', confidence: 0.77, detectedObjection: objection };
    }

    return { intentLabel: 'statement', confidence: 0.6 };
  }
}
