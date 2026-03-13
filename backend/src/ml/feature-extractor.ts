import { Injectable } from '@nestjs/common';
import { TranscriptEntry } from '../common/models/call-session.model';
import { ConversationStrategy } from '../modules/phase2.types';
import { FeatureVector } from '../modules/phase4.types';
import { SentimentAnalyzerService } from '../services/sentiment-analyzer.service';

interface FeatureExtractorInput {
  transcript: TranscriptEntry[];
  conversationStrategy: ConversationStrategy;
  endReason: string;
  objectionsDetected: number;
  objectionResolvedHints: number;
  callDurationSeconds?: number;
  avgAgentResponseMs?: number;
  stageDropDepth?: number;
  previousCallAttempts?: number;
}

@Injectable()
export class FeatureExtractor {
  constructor(private readonly sentimentAnalyzerService: SentimentAnalyzerService) {}

  extract(input: FeatureExtractorInput): FeatureVector {
    const totalTurns = input.transcript.filter((entry) => entry.speaker === 'customer').length;
    const sentimentTimeline = this.sentimentAnalyzerService.analyzeTranscript(
      input.transcript,
      input.conversationStrategy.agentPersona.language,
    );
    const firstGoalTurn = this.findFirstGoalTurn(input.transcript, input.conversationStrategy);
    const mandatoryGoals = input.conversationStrategy.goals.filter((goal) => goal.isMandatory).length;
    const goalAchievementRate = mandatoryGoals === 0 ? 1 : (input.endReason === 'goal-achieved' ? 1 : 0);

    return {
      goalAchievementRate,
      totalTurns,
      turnsToFirstGoal: firstGoalTurn,
      objectionCount: input.objectionsDetected,
      resolvedObjectionRate: input.objectionsDetected === 0
        ? 1
        : Math.max(0, Math.min(1, input.objectionResolvedHints / input.objectionsDetected)),
      hardRejectionEncountered: input.endReason === 'customer-declined' ? 1 : 0,
      escalationTriggered: input.endReason === 'escalation-triggered' ? 1 : 0,
      sentimentTrajectory: sentimentTimeline.slope,
      callDurationSeconds: input.callDurationSeconds ?? this.estimateDuration(input.transcript),
      avgAgentResponseMs: input.avgAgentResponseMs ?? this.estimateAvgAgentLatency(input.transcript),
      stageDropDepth: input.stageDropDepth ?? 1,
      previousCallAttempts: input.previousCallAttempts ?? 0,
    };
  }

  private findFirstGoalTurn(transcript: TranscriptEntry[], strategy: ConversationStrategy): number {
    const signals = strategy.goals.map((goal) => goal.completionSignal.toLowerCase());
    const customerTurns = transcript.filter((entry) => entry.speaker === 'customer');
    for (let index = 0; index < customerTurns.length; index += 1) {
      const turn = customerTurns[index].text.toLowerCase();
      if (signals.some((signal) => signal.split(' ').some((part) => part.length > 3 && turn.includes(part)))) {
        return index + 1;
      }
    }

    return customerTurns.length === 0 ? 0 : customerTurns.length;
  }

  private estimateDuration(transcript: TranscriptEntry[]): number {
    if (transcript.length < 2) {
      return 0;
    }

    const first = transcript[0].timestamp.getTime();
    const last = transcript[transcript.length - 1].timestamp.getTime();
    return Math.max(0, Math.round((last - first) / 1000));
  }

  private estimateAvgAgentLatency(transcript: TranscriptEntry[]): number {
    const responseTimes: number[] = [];
    for (let index = 1; index < transcript.length; index += 1) {
      const current = transcript[index];
      const previous = transcript[index - 1];
      if (previous.speaker === 'customer' && current.speaker === 'agent') {
        responseTimes.push(Math.max(0, current.timestamp.getTime() - previous.timestamp.getTime()));
      }
    }

    if (responseTimes.length === 0) {
      return 0;
    }

    return Math.round(responseTimes.reduce((sum, entry) => sum + entry, 0) / responseTimes.length);
  }
}