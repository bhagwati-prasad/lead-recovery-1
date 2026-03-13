import { Injectable } from '@nestjs/common';
import { TranscriptEntry } from '../common/models/call-session.model';
import { SentimentResult, SentimentTimeline } from '../modules/phase4.types';

@Injectable()
export class SentimentAnalyzerService {
  private readonly positiveLexicon = new Set(['yes', 'great', 'good', 'thanks', 'sure', 'continue', 'okay', 'ok']);
  private readonly negativeLexicon = new Set(['no', 'stop', 'never', 'bad', 'angry', 'later', 'bye', 'not interested']);

  analyzeText(text: string, _language: string): SentimentResult {
    const normalized = text.toLowerCase();
    const positiveHits = [...this.positiveLexicon].filter((entry) => normalized.includes(entry)).length;
    const negativeHits = [...this.negativeLexicon].filter((entry) => normalized.includes(entry)).length;

    const raw = positiveHits - negativeHits;
    const score = Math.max(-1, Math.min(1, raw / 3));
    const magnitude = Math.max(0, Math.min(1, (positiveHits + negativeHits) / 4));
    const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

    return { score, magnitude, label };
  }

  analyzeTranscript(entries: TranscriptEntry[], language: string): SentimentTimeline {
    const customerEntries = entries.filter((entry) => entry.speaker === 'customer');
    const points = customerEntries.map((entry) => ({
      timestamp: entry.timestamp,
      score: this.analyzeText(entry.text, language).score,
    }));

    if (points.length === 0) {
      return {
        entries: [],
        overallScore: 0,
        slope: 0,
      };
    }

    const overallScore = points.reduce((sum, entry) => sum + entry.score, 0) / points.length;
    const first = points[0].score;
    const last = points[points.length - 1].score;
    const slope = points.length === 1 ? 0 : (last - first) / (points.length - 1);

    return {
      entries: points,
      overallScore,
      slope,
    };
  }
}