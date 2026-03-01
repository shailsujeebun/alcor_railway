export type FieldComponent =
  | 'select'
  | 'text'
  | 'number'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'date'
  | 'color';

export type DataSourceType = 'static' | 'db' | 'api';

export type RuleLeaf = {
  field: string;
  op: 'eq' | 'ne' | 'in' | 'notIn' | 'exists' | 'gt' | 'gte' | 'lt' | 'lte';
  value?: any;
};

export type RuleTree =
  | RuleLeaf
  | { all: RuleTree[] }
  | { any: RuleTree[] }
  | { not: RuleTree };

export interface FieldOption {
  id?: string;
  value: string;
  label: string;
}

export interface OptionsMapping {
  valueKey: string;
  labelKey: string;
}

export interface TemplateFieldSchema {
  id?: string;
  key: string;
  label: string;
  type?: string;
  component?: FieldComponent;
  required?: boolean;
  isRequired?: boolean;
  placeholder?: string;
  group?: string;
  section?: string;
  order?: number;
  dataSource?: DataSourceType;
  staticOptions?: FieldOption[];
  options?: FieldOption[];
  optionsEndpoint?: string;
  optionsQuery?: Record<string, any>;
  dependsOn?: string[];
  optionsMapping?: OptionsMapping;
  visibleIf?: RuleTree;
  requiredIf?: RuleTree;
  resetOnChange?: string[];
  validationRules?: Record<string, any>;
}

export interface TemplateBlockSchema {
  id: string;
  name: string;
  isSystem?: boolean;
  fields: TemplateFieldSchema[];
}
