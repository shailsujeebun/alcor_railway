type RawOption = {
  id?: bigint | number | string;
  value: string;
  label: string;
  sortOrder?: number | null;
};

type RawField = {
  id?: bigint | number | string;
  fieldKey: string;
  label: string;
  fieldType: string;
  required?: boolean;
  sortOrder?: number;
  section?: string | null;
  validations?: Record<string, any> | null;
  visibilityIf?: Record<string, any> | null;
  requiredIf?: Record<string, any> | null;
  config?: Record<string, any> | null;
  options?: RawOption[];
};

type RawBlock = {
  id: string;
  name: string;
  isSystem?: boolean;
  fields: any[];
};

const YEAR_OPTIONS = Array.from({ length: 77 }, (_, index) => {
  const year = 2026 - index;
  return { value: String(year), label: String(year) };
});

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const DEFAULT_MOTORIZED_BLOCK_FIELDS = [
  // --- Main details ---
  {
    key: 'brand',
    label: 'Make',
    type: 'SELECT',
    component: 'select',
    group: 'Main details',
    order: 1000,
    dataSource: 'api',
  },
  {
    key: 'model',
    label: 'Model',
    type: 'SELECT',
    component: 'select',
    group: 'Main details',
    order: 1010,
    dataSource: 'api',
    dependsOn: ['brand'],
    resetOnChange: [],
  },
  {
    key: 'year_of_manufacture',
    label: 'Year of manufacture',
    type: 'SELECT',
    component: 'select',
    group: 'Main details',
    order: 1020,
    dataSource: 'static',
    staticOptions: YEAR_OPTIONS,
  },
  {
    key: 'condition',
    label: 'Condition',
    type: 'RADIO',
    component: 'radio',
    group: 'Main details',
    order: 1030,
    dataSource: 'static',
    staticOptions: [
      { value: 'new', label: 'New' },
      { value: 'used', label: 'Used' },
      { value: 'demo', label: 'Demo' },
    ],
  },
  {
    key: 'color',
    label: 'Color',
    type: 'SELECT',
    component: 'select',
    group: 'Main details',
    order: 1040,
    dataSource: 'static',
    staticOptions: [
      { value: 'black', label: 'Black' },
      { value: 'white', label: 'White' },
      { value: 'silver', label: 'Silver' },
      { value: 'grey', label: 'Grey' },
      { value: 'blue', label: 'Blue' },
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'orange', label: 'Orange' },
      { value: 'brown', label: 'Brown' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'mileage',
    label: 'Mileage, km',
    type: 'NUMBER',
    component: 'number',
    group: 'Main details',
    order: 1050,
    validationRules: { min: 0, max: 5000000, unit: 'km' },
  },
  {
    key: 'vin',
    label: 'VIN',
    type: 'TEXT',
    component: 'text',
    group: 'Main details',
    order: 1060,
    validationRules: { minLength: 8, maxLength: 32 },
  },

  // --- Technical characteristics ---
  {
    key: 'power',
    label: 'Engine power',
    type: 'NUMBER',
    component: 'number',
    group: 'Technical characteristics',
    order: 2000,
    validationRules: { min: 1, max: 5000 },
  },
  {
    key: 'power_unit',
    label: 'Power unit',
    type: 'RADIO',
    component: 'radio',
    group: 'Technical characteristics',
    order: 2010,
    dataSource: 'static',
    staticOptions: [
      { value: 'hp', label: 'HP' },
      { value: 'kw', label: 'kW' },
    ],
  },
  {
    key: 'fuel',
    label: 'Fuel type',
    type: 'SELECT',
    component: 'select',
    group: 'Technical characteristics',
    order: 2020,
    dataSource: 'static',
    staticOptions: [
      { value: 'diesel', label: 'Diesel' },
      { value: 'petrol', label: 'Petrol' },
      { value: 'electric', label: 'Electric' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'lpg', label: 'LPG' },
      { value: 'cng', label: 'CNG' },
    ],
  },
  {
    key: 'euro',
    label: 'Euro standard',
    type: 'SELECT',
    component: 'select',
    group: 'Technical characteristics',
    order: 2030,
    dataSource: 'static',
    staticOptions: [
      { value: 'euro_1', label: 'Euro 1' },
      { value: 'euro_2', label: 'Euro 2' },
      { value: 'euro_3', label: 'Euro 3' },
      { value: 'euro_4', label: 'Euro 4' },
      { value: 'euro_5', label: 'Euro 5' },
      { value: 'euro_6', label: 'Euro 6' },
      { value: 'euro_7', label: 'Euro 7' },
    ],
  },

  // --- Axes ---
  {
    key: 'gearbox_type',
    label: 'Transmission',
    type: 'SELECT',
    component: 'select',
    group: 'Axes',
    order: 3000,
    dataSource: 'static',
    staticOptions: [
      { value: 'manual', label: 'Manual' },
      { value: 'automatic', label: 'Automatic' },
      { value: 'semi_automatic', label: 'Semi-automatic' },
      { value: 'cvt', label: 'CVT' },
    ],
  },
  {
    key: 'axes',
    label: 'Axes',
    type: 'SELECT',
    component: 'select',
    group: 'Axes',
    order: 3010,
    dataSource: 'static',
    staticOptions: [
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
    ],
  },
  {
    key: 'axle_configuration',
    label: 'Wheel formula',
    type: 'SELECT',
    component: 'select',
    group: 'Axes',
    order: 3020,
    dataSource: 'static',
    staticOptions: [
      { value: '4x2', label: '4x2' },
      { value: '4x4', label: '4x4' },
      { value: '6x2', label: '6x2' },
      { value: '6x4', label: '6x4' },
      { value: '6x6', label: '6x6' },
      { value: '8x4', label: '8x4' },
      { value: '8x8', label: '8x8' },
    ],
  },
  {
    key: 'suspension',
    label: 'Suspension',
    type: 'SELECT',
    component: 'select',
    group: 'Axes',
    order: 3030,
    dataSource: 'static',
    staticOptions: [
      { value: 'leaf', label: 'Leaf' },
      { value: 'air', label: 'Air' },
      { value: 'mixed', label: 'Mixed' },
    ],
  },
  {
    key: 'axes_features',
    label: 'Features',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Axes',
    order: 3040,
    dataSource: 'static',
    staticOptions: [
      { value: 'abs', label: 'ABS' },
      { value: 'ebs', label: 'EBS' },
      { value: 'abd', label: 'ABD' },
      { value: 'asr', label: 'ASR' },
      { value: 'esp', label: 'ESP' },
    ],
  },

  // --- Cab type ---
  {
    key: 'cab_type',
    label: 'Cab type',
    type: 'SELECT',
    component: 'select',
    group: 'Cab type',
    order: 4000,
    dataSource: 'static',
    staticOptions: [
      { value: 'day_cab', label: 'Day cab' },
      { value: 'sleeper_cab', label: 'Sleeper cab' },
      { value: 'crew_cab', label: 'Crew cab' },
    ],
  },
];

const typeToComponent: Record<string, string> = {
  TEXT: 'text',
  NUMBER: 'number',
  PRICE: 'text',
  RICHTEXT: 'textarea',
  SELECT: 'select',
  MULTISELECT: 'select',
  RADIO: 'radio',
  CHECKBOX_GROUP: 'checkbox',
  BOOLEAN: 'checkbox',
  DATE: 'date',
  YEAR_RANGE: 'number',
  COLOR: 'select',
  LOCATION: 'text',
  MEDIA: 'text',
};

const componentToType: Record<string, string> = {
  text: 'TEXT',
  number: 'NUMBER',
  checkbox: 'BOOLEAN',
  radio: 'RADIO',
  textarea: 'RICHTEXT',
  date: 'DATE',
  select: 'SELECT',
};

export function sanitizeFieldPayload(inputField: any, index: number) {
  const config = { ...(inputField.config ?? {}) };
  const component = (
    inputField.component ??
    config.component ??
    typeToComponent[inputField.type] ??
    'text'
  ).toLowerCase();
  const normalizedType =
    (inputField.type as string | undefined)?.toUpperCase() ??
    componentToType[component] ??
    'TEXT';

  const section =
    inputField.group ??
    inputField.section ??
    config.group ??
    config.section ??
    null;
  const sortOrder = Number(inputField.order ?? inputField.sortOrder ?? index);

  const staticOptions = Array.isArray(inputField.staticOptions)
    ? inputField.staticOptions
    : Array.isArray(inputField.options)
      ? inputField.options.map((option: any) => ({
        value: String(option.value ?? ''),
        label: String(option.label ?? option.value ?? ''),
      }))
      : [];

  const normalizedConfig = {
    ...config,
    key: inputField.key,
    label: inputField.label,
    component,
    placeholder: inputField.placeholder ?? config.placeholder,
    group: section ?? undefined,
    order: sortOrder,
    dataSource:
      inputField.dataSource ??
      config.dataSource ??
      (staticOptions.length ? 'static' : 'api'),
    staticOptions,
    optionsEndpoint: inputField.optionsEndpoint ?? config.optionsEndpoint,
    optionsQuery: inputField.optionsQuery ?? config.optionsQuery,
    dependsOn: inputField.dependsOn ?? config.dependsOn ?? [],
    optionsMapping: inputField.optionsMapping ?? config.optionsMapping,
    resetOnChange: inputField.resetOnChange ?? config.resetOnChange ?? [],
  };

  return {
    fieldKey: String(inputField.key),
    label: String(inputField.label ?? inputField.key),
    fieldType: normalizedType,
    required: Boolean(
      inputField.required ??
      inputField.isRequired ??
      inputField.baseRequired ??
      false,
    ),
    sortOrder,
    section,
    validations:
      inputField.validationRules ??
      inputField.validations ??
      config.validationRules ??
      {},
    visibilityIf:
      inputField.visibleIf ?? inputField.visibilityIf ?? config.visibleIf ?? {},
    requiredIf: inputField.requiredIf ?? config.requiredIf ?? {},
    config: normalizedConfig,
    staticOptions,
  };
}

function mapOptions(options: RawOption[] = []) {
  return options.map((option, index) => ({
    id: option.id ? option.id.toString() : `${index}`,
    value: option.value,
    label: option.label,
  }));
}

export function mapFieldToResponse(rawField: RawField) {
  const config = rawField.config ?? {};
  const options = mapOptions(rawField.options ?? []);
  const component = (
    config.component ??
    typeToComponent[rawField.fieldType] ??
    'text'
  ).toLowerCase();

  const dataSource =
    config.dataSource ?? (options.length > 0 ? 'static' : 'api');
  const staticOptions =
    dataSource === 'static'
      ? (Array.isArray(config.staticOptions)
        ? config.staticOptions
        : options
      ).map((option: any, index: number) => ({
        id: option.id ? String(option.id) : `${index}`,
        value: String(option.value),
        label: String(option.label),
      }))
      : [];

  return {
    id: rawField.id ? rawField.id.toString() : undefined,
    key: rawField.fieldKey,
    label: rawField.label,
    type: rawField.fieldType,
    component,
    required: Boolean(rawField.required),
    isRequired: Boolean(rawField.required),
    placeholder: config.placeholder,
    group: config.group ?? rawField.section ?? undefined,
    section: config.group ?? rawField.section ?? undefined,
    order: rawField.sortOrder ?? 0,
    dataSource,
    staticOptions,
    options,
    optionsEndpoint: config.optionsEndpoint,
    optionsQuery: config.optionsQuery,
    dependsOn: config.dependsOn ?? [],
    optionsMapping: config.optionsMapping,
    visibleIf: rawField.visibilityIf ?? {},
    visibilityIf: rawField.visibilityIf ?? {},
    requiredIf: rawField.requiredIf ?? {},
    resetOnChange: config.resetOnChange ?? [],
    validationRules: rawField.validations ?? {},
    validations: rawField.validations ?? {},
  };
}

export function getBuiltInEngineBlock(): RawBlock {
  return {
    id: 'engine_block',
    name: 'Motorized Vehicle Block',
    isSystem: true,
    fields: DEFAULT_MOTORIZED_BLOCK_FIELDS,
  };
}

export function mergeTemplateFieldsWithBlocks(
  templateFields: RawField[],
  blocks: RawBlock[],
): ReturnType<typeof mapFieldToResponse>[] {
  const mappedTemplateFields = templateFields.map((field) =>
    mapFieldToResponse(field),
  );
  const mappedBlockFields = blocks.flatMap((block) =>
    (block.fields ?? []).map((rawField: any, index: number) => {
      const normalized = sanitizeFieldPayload(
        {
          ...rawField,
          section: rawField.group ?? rawField.section ?? block.name,
        },
        index,
      );
      return mapFieldToResponse({
        id: `${block.id}:${normalized.fieldKey}`,
        fieldKey: normalized.fieldKey,
        label: normalized.label,
        fieldType: normalized.fieldType,
        required: normalized.required,
        sortOrder: normalized.sortOrder,
        section: normalized.section,
        validations: normalized.validations,
        visibilityIf: normalized.visibilityIf,
        requiredIf: normalized.requiredIf,
        config: normalized.config,
        options: (normalized.staticOptions ?? []).map(
          (option, optionIndex) => ({
            id: `${block.id}:${normalized.fieldKey}:${optionIndex}`,
            value: option.value,
            label: option.label,
            sortOrder: optionIndex,
          }),
        ),
      });
    }),
  );

  const deduped = new Map<string, ReturnType<typeof mapFieldToResponse>>();
  for (const field of [...mappedTemplateFields, ...mappedBlockFields]) {
    deduped.set(field.key, field);
  }

  return Array.from(deduped.values()).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}
