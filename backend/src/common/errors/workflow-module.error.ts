export class WorkflowModuleError extends Error {
  constructor(
    message: string,
    public readonly moduleId: string,
  ) {
    super(message);
    this.name = 'WorkflowModuleError';
  }
}