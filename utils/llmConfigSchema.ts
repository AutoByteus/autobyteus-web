type RawParameterSchema = {
  parameters?: Array<{
    name?: string;
    type?: string;
    description?: string;
    required?: boolean;
    default_value?: unknown;
    enum_values?: unknown[];
    min_value?: number | null;
    max_value?: number | null;
    pattern?: string | null;
  }>;
};

export type UiModelConfigSchema = Record<string, {
  type?: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number | null;
  maximum?: number | null;
  pattern?: string | null;
  required?: boolean;
}>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const normalizeModelConfigSchema = (schema: unknown): UiModelConfigSchema | null => {
  if (!isObject(schema)) return null;

  if (Array.isArray((schema as RawParameterSchema).parameters)) {
    const normalized: UiModelConfigSchema = {};
    const params = (schema as RawParameterSchema).parameters ?? [];

    for (const param of params) {
      if (!param || typeof param.name !== 'string' || param.name.length === 0) continue;

      normalized[param.name] = {
        type: param.type,
        description: param.description,
        enum: param.enum_values,
        default: param.default_value,
        minimum: param.min_value ?? null,
        maximum: param.max_value ?? null,
        pattern: param.pattern ?? null,
        required: param.required,
      };
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
  }

  return null;
};
