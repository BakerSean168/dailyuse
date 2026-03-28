import type {
  AIEvaluationOverview,
  GetAIEvaluationOverviewInput,
  IAIEvaluationReportPort,
} from '../../ports';

export class AIEvaluationReportService {
  constructor(private readonly evaluationReportPort: IAIEvaluationReportPort) {}

  async getOverview(
    input: GetAIEvaluationOverviewInput = {},
  ): Promise<AIEvaluationOverview> {
    return this.evaluationReportPort.getOverview(input);
  }
}
