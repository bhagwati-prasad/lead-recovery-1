import { Injectable } from '@nestjs/common';
import { AssessmentFactor, AssessmentResult, ConversationEndReason } from '../modules/phase2.types';

@Injectable()
export class AssessmentService {
  evaluate(input: {
    mandatoryGoals: number;
    achievedGoals: number;
    endReason: ConversationEndReason;
    turnCount: number;
    maxTurns: number;
    objectionCount: number;
  }): AssessmentResult {
    const factors: AssessmentFactor[] = [
      {
        name: 'goals-achieved',
        weight: 0.4,
        value: input.mandatoryGoals === 0 ? 1 : input.achievedGoals / input.mandatoryGoals,
        label: `${input.achievedGoals}/${input.mandatoryGoals}`,
      },
      {
        name: 'no-hard-rejection',
        weight: 0.25,
        value: input.endReason === 'customer-declined' ? 0 : 1,
        label: input.endReason,
      },
      {
        name: 'objection-load',
        weight: 0.2,
        value: input.objectionCount === 0 ? 1 : Math.max(0.3, 1 - input.objectionCount * 0.2),
        label: `${input.objectionCount} detected`,
      },
      {
        name: 'turn-efficiency',
        weight: 0.15,
        value: input.maxTurns === 0 ? 1 : Math.max(0, 1 - input.turnCount / input.maxTurns),
        label: `${input.turnCount}/${input.maxTurns}`,
      },
    ];

    const score = Number(
      factors.reduce((sum, factor) => sum + factor.value * factor.weight, 0).toFixed(2),
    );

    const recommendation = score >= 0.7
      ? 'close-recovered'
      : score >= 0.45
        ? 'schedule-follow-up'
        : input.endReason === 'customer-declined'
          ? 'close-failed'
          : 'escalate';

    return {
      score,
      factors,
      recommendation,
    };
  }
}
