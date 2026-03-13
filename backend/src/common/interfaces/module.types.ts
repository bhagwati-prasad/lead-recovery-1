export type ModuleInput = Record<string, unknown>;
export type ModuleOutput = Record<string, unknown>;

export interface ValidationError {
  field: string;
  message: string;
}