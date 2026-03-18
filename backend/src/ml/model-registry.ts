import { Injectable } from '@nestjs/common';
import { GradientBoostedAssessmentModel } from './gradient-boosted.model';
import { LogisticRegressionModel } from './logistic-regression.model';
import { MLAssessmentModel } from './ml-assessment-model.interface';
import { MockAssessmentModel } from './mock-assessment.model';

@Injectable()
export class ModelRegistry {
  private activeModel: MLAssessmentModel;

  constructor(
    private readonly gradientBoostedAssessmentModel: GradientBoostedAssessmentModel,
    private readonly logisticRegressionModel: LogisticRegressionModel,
    private readonly mockAssessmentModel: MockAssessmentModel,
  ) {
    this.activeModel = this.logisticRegressionModel;
  }

  getActive(): MLAssessmentModel {
    return this.activeModel;
  }

  list(): Array<{ version: string }> {
    return [this.logisticRegressionModel, this.gradientBoostedAssessmentModel, this.mockAssessmentModel].map((model) => ({
      version: model.version,
    }));
  }

  use(version: string): void {
    if (version === this.gradientBoostedAssessmentModel.version) {
      this.activeModel = this.gradientBoostedAssessmentModel;
      return;
    }

    if (version === this.logisticRegressionModel.version) {
      this.activeModel = this.logisticRegressionModel;
      return;
    }

    if (version === this.mockAssessmentModel.version) {
      this.activeModel = this.mockAssessmentModel;
      return;
    }

    throw new Error(`Unknown model version: ${version}`);
  }
}