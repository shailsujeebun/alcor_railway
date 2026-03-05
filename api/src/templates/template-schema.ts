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

const CURRENT_YEAR = new Date().getUTCFullYear();
const YEAR_OPTIONS = Array.from({ length: 80 }, (_, index) => {
  const year = CURRENT_YEAR - index;
  return { value: String(year), label: String(year) };
});
const YEAR_OPTIONS_WITH_FUTURE = Array.from({ length: 96 }, (_, index) => {
  const year = CURRENT_YEAR + 15 - index;
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
  // --- Basic characteristics ---
  {
    key: 'category',
    label: 'Category',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1000,
    dataSource: 'static',
    staticOptions: [{ value: 'car', label: 'Car' }],
    required: true,
  },
  {
    key: 'brand',
    label: 'Brand',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1010,
    dataSource: 'api',
    required: true,
  },
  {
    key: 'model',
    label: 'Model',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1020,
    dataSource: 'api',
    dependsOn: ['brand'],
    resetOnChange: [],
    required: true,
  },
  {
    key: 'right_hand_drive',
    label: 'Right-hand drive',
    type: 'BOOLEAN',
    component: 'checkbox',
    group: 'Basic characteristics',
    order: 1030,
  },
  {
    key: 'year_of_manufacture_year',
    label: 'Year of manufacture (year)',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1040,
    dataSource: 'static',
    staticOptions: YEAR_OPTIONS,
    required: true,
  },
  {
    key: 'year_of_manufacture_month',
    label: 'Year of manufacture (month)',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1050,
    dataSource: 'static',
    staticOptions: MONTH_OPTIONS,
  },
  {
    key: 'first_registration_year',
    label: 'First registration (year)',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1060,
    dataSource: 'static',
    staticOptions: YEAR_OPTIONS,
  },
  {
    key: 'first_registration_month',
    label: 'First registration (month)',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1070,
    dataSource: 'static',
    staticOptions: MONTH_OPTIONS,
  },
  {
    key: 'technical_inspection_year',
    label: 'Technical inspection valid till (year)',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1080,
    dataSource: 'static',
    staticOptions: YEAR_OPTIONS_WITH_FUTURE,
  },
  {
    key: 'technical_inspection_month',
    label: 'Technical inspection valid till (month)',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1090,
    dataSource: 'static',
    staticOptions: MONTH_OPTIONS,
  },
  {
    key: 'vin',
    label: 'VIN',
    type: 'TEXT',
    component: 'text',
    group: 'Basic characteristics',
    order: 1100,
    validationRules: { minLength: 17, maxLength: 17 },
  },
  {
    key: 'condition',
    label: 'Condition',
    type: 'RADIO',
    component: 'radio',
    group: 'Basic characteristics',
    order: 1110,
    dataSource: 'static',
    staticOptions: [
      { value: 'new', label: 'New' },
      { value: 'used', label: 'Used' },
      { value: 'crashed', label: 'Crashed' },
      { value: 'for_parts', label: 'For parts' },
      { value: 'defect', label: 'With a defect' },
      { value: 'remanufactured', label: 'Remanufactured' },
      { value: 'demo', label: 'Demonstration' },
    ],
    required: true,
  },
  {
    key: 'technical_condition',
    label: 'Technical condition',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Basic characteristics',
    order: 1120,
    dataSource: 'static',
    staticOptions: [
      { value: 'runs', label: 'Runs and drives' },
      { value: 'needs_service', label: 'Needs service' },
      { value: 'after_accident', label: 'After accident' },
      { value: 'fresh_import', label: 'Fresh import' },
    ],
  },
  {
    key: 'previous_owners',
    label: 'Number of previous owners',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1130,
    dataSource: 'static',
    staticOptions: [
      { value: '0', label: '0' },
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5_plus', label: '5+' },
    ],
  },
  {
    key: 'mileage',
    label: 'Mileage',
    type: 'NUMBER',
    component: 'number',
    group: 'Basic characteristics',
    order: 1140,
    validationRules: { min: 0, max: 5000000, unit: 'km' },
  },
  {
    key: 'body_type',
    label: 'Body type',
    type: 'SELECT',
    component: 'select',
    group: 'Basic characteristics',
    order: 1150,
    dataSource: 'static',
    staticOptions: [
      { value: 'sedan', label: 'Sedan' },
      { value: 'hatchback', label: 'Hatchback' },
      { value: 'wagon', label: 'Wagon' },
      { value: 'coupe', label: 'Coupe' },
      { value: 'suv', label: 'SUV' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'van', label: 'Van' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'colour',
    label: 'Colour',
    type: 'COLOR',
    component: 'color',
    group: 'Basic characteristics',
    order: 1160,
    dataSource: 'static',
    staticOptions: [
      { value: '#FFFFFF', label: 'White' },
      { value: '#000000', label: 'Black' },
      { value: '#C0C0C0', label: 'Silver' },
      { value: '#666666', label: 'Grey' },
      { value: '#1D4ED8', label: 'Blue' },
      { value: '#DC2626', label: 'Red' },
      { value: '#15803D', label: 'Green' },
      { value: '#F59E0B', label: 'Yellow' },
      { value: '#92400E', label: 'Brown' },
    ],
  },
  {
    key: 'doors',
    label: 'Number of doors',
    type: 'RADIO',
    component: 'radio',
    group: 'Basic characteristics',
    order: 1170,
    dataSource: 'static',
    staticOptions: [
      { value: '2_3', label: '2/3' },
      { value: '4_5', label: '4/5' },
      { value: '6_7', label: '6/7' },
    ],
  },
  {
    key: 'seats',
    label: 'Number of seats',
    type: 'NUMBER',
    component: 'number',
    group: 'Basic characteristics',
    order: 1180,
    validationRules: { min: 1, max: 120 },
  },
  {
    key: 'net_weight',
    label: 'Net weight',
    type: 'NUMBER',
    component: 'number',
    group: 'Basic characteristics',
    order: 1190,
    validationRules: { min: 0, max: 1000000, unit: 'kg' },
  },

  // --- Engine, gearbox ---
  {
    key: 'engine_mark',
    label: 'Engine mark',
    type: 'SELECT',
    component: 'select',
    group: 'Engine, gearbox',
    order: 2000,
    dataSource: 'static',
    staticOptions: [
      { value: 'oem', label: 'OEM' },
      { value: 'aftermarket', label: 'Aftermarket' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'engine_model',
    label: 'Engine model',
    type: 'TEXT',
    component: 'text',
    group: 'Engine, gearbox',
    order: 2010,
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'fuel',
    label: 'Fuel',
    type: 'SELECT',
    component: 'select',
    group: 'Engine, gearbox',
    order: 2020,
    dataSource: 'static',
    staticOptions: [
      { value: 'diesel', label: 'Diesel' },
      { value: 'petrol', label: 'Petrol' },
      { value: 'electric', label: 'Electric' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'lpg', label: 'LPG' },
      { value: 'cng', label: 'CNG' },
      { value: 'hydrogen', label: 'Hydrogen' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'power',
    label: 'Power',
    type: 'NUMBER',
    component: 'number',
    group: 'Engine, gearbox',
    order: 2030,
    validationRules: { min: 1, max: 5000 },
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'power_unit',
    label: 'Power unit',
    type: 'RADIO',
    component: 'radio',
    group: 'Engine, gearbox',
    order: 2040,
    dataSource: 'static',
    staticOptions: [
      { value: 'hp', label: 'HP' },
      { value: 'kw', label: 'kW' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'engine_volume',
    label: 'Engine volume',
    type: 'NUMBER',
    component: 'number',
    group: 'Engine, gearbox',
    order: 2050,
    validationRules: { min: 0, max: 50000, unit: 'cm³' },
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'emission_sticker',
    label: 'Emission sticker',
    type: 'RADIO',
    component: 'radio',
    group: 'Engine, gearbox',
    order: 2060,
    dataSource: 'static',
    staticOptions: [
      { value: '1', label: '1 (none)' },
      { value: '2', label: '2 (red)' },
      { value: '3', label: '3 (yellow)' },
      { value: '4', label: '4 (green)' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'euro',
    label: 'Euro',
    type: 'RADIO',
    component: 'radio',
    group: 'Engine, gearbox',
    order: 2070,
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
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'fuel_consumption',
    label: 'Fuel consumption',
    type: 'NUMBER',
    component: 'number',
    group: 'Engine, gearbox',
    order: 2080,
    validationRules: { min: 0, max: 200, unit: 'l/100km' },
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'fuel_consumption_unit',
    label: 'Fuel consumption unit',
    type: 'RADIO',
    component: 'radio',
    group: 'Engine, gearbox',
    order: 2090,
    dataSource: 'static',
    staticOptions: [
      { value: 'l_100km', label: 'l/100km' },
      { value: 'l_h', label: 'l/h' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },

  {
    key: 'gearbox_type',
    label: 'Gearbox type',
    type: 'SELECT',
    component: 'select',
    group: 'Engine, gearbox',
    order: 2100,
    dataSource: 'static',
    staticOptions: [
      { value: 'manual', label: 'Manual' },
      { value: 'automatic', label: 'Automatic' },
      { value: 'semi_automatic', label: 'Semi-automatic' },
      { value: 'cvt', label: 'CVT' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'number_of_gears',
    label: 'Number of gears',
    type: 'SELECT',
    component: 'select',
    group: 'Engine, gearbox',
    order: 2110,
    dataSource: 'static',
    staticOptions: [
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
      { value: '7', label: '7' },
      { value: '8', label: '8' },
      { value: '9', label: '9' },
      { value: '10', label: '10' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'gearbox_brand',
    label: 'Gearbox brand',
    type: 'TEXT',
    component: 'text',
    group: 'Engine, gearbox',
    order: 2120,
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'gearbox_model',
    label: 'Gearbox model',
    type: 'TEXT',
    component: 'text',
    group: 'Engine, gearbox',
    order: 2130,
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'drive_type',
    label: 'Drive type',
    type: 'RADIO',
    component: 'radio',
    group: 'Engine, gearbox',
    order: 2140,
    dataSource: 'static',
    staticOptions: [
      { value: 'awd', label: 'All-Wheel Drive' },
      { value: 'fwd', label: 'Front-Wheel Drive' },
      { value: 'rwd', label: 'Rear-Wheel Drive' },
    ],
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },

  // --- Axles, brakes ---
  {
    key: 'axle_configuration',
    label: 'Axle configuration',
    type: 'SELECT',
    component: 'select',
    group: 'Axles, brakes',
    order: 3000,
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
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'tyre_size',
    label: 'Tyre size',
    type: 'TEXT',
    component: 'text',
    group: 'Axles, brakes',
    order: 3010,
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'tyre_condition_percent',
    label: 'Tyre condition (%)',
    type: 'NUMBER',
    component: 'number',
    group: 'Axles, brakes',
    order: 3020,
    validationRules: { min: 0, max: 100, unit: '%' },
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },
  {
    key: 'tyre_condition_mm',
    label: 'Tyre condition (mm)',
    type: 'NUMBER',
    component: 'number',
    group: 'Axles, brakes',
    order: 3030,
    validationRules: { min: 0, max: 100, unit: 'mm' },
    visibleIf: { field: 'context.category.hasEngine', op: 'eq', value: true },
  },

  // --- Additional options ---
  {
    key: 'air_conditioning',
    label: 'Air conditioning',
    type: 'BOOLEAN',
    component: 'checkbox',
    group: 'Additional options',
    order: 4000,
  },
  {
    key: 'air_conditioning_type',
    label: 'Air conditioning type',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4010,
    dataSource: 'static',
    staticOptions: [
      { value: 'climate_control', label: 'Climate control' },
      { value: 'dual_zone', label: 'Dual-zone climate control' },
      { value: 'multi_zone', label: 'Multi-zone climate control' },
    ],
    visibleIf: { field: 'air_conditioning', op: 'eq', value: 'true' },
  },
  {
    key: 'powered_windows',
    label: 'Powered windows',
    type: 'BOOLEAN',
    component: 'checkbox',
    group: 'Additional options',
    order: 4020,
  },
  {
    key: 'powered_windows_scope',
    label: 'Powered windows scope',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4030,
    dataSource: 'static',
    staticOptions: [
      { value: 'front', label: 'Front' },
      { value: 'front_rear', label: 'Front and rear' },
    ],
    visibleIf: { field: 'powered_windows', op: 'eq', value: 'true' },
  },
  {
    key: 'interior_material',
    label: 'Interior material',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4040,
    dataSource: 'static',
    staticOptions: [
      { value: 'alcantara', label: 'Alcantara' },
      { value: 'combination', label: 'Combination' },
      { value: 'fabric', label: 'Fabric' },
      { value: 'faux_leather', label: 'Faux leather' },
      { value: 'leather', label: 'Leather' },
      { value: 'velour', label: 'Velour' },
    ],
  },
  {
    key: 'interior_colour',
    label: 'Interior colour',
    type: 'COLOR',
    component: 'color',
    group: 'Additional options',
    order: 4050,
    dataSource: 'static',
    staticOptions: [
      { value: '#111827', label: 'Black' },
      { value: '#374151', label: 'Grey' },
      { value: '#92400E', label: 'Brown' },
      { value: '#F3F4F6', label: 'Beige' },
      { value: '#1F2937', label: 'Dark grey' },
    ],
  },
  {
    key: 'steering_wheel_adjustment',
    label: 'Steering wheel adjustment',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4060,
    dataSource: 'static',
    staticOptions: [
      { value: 'height', label: 'By height' },
      { value: 'height_reach', label: 'By height and reach' },
    ],
  },
  {
    key: 'power_steering',
    label: 'Power steering',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4070,
    dataSource: 'static',
    staticOptions: [
      { value: 'electrohydraulic', label: 'Electrohydraulic' },
      { value: 'eps', label: 'EPS' },
      { value: 'hydraulic', label: 'Hydraulic' },
    ],
  },
  {
    key: 'spare_wheel',
    label: 'Spare wheel',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4080,
    dataSource: 'static',
    staticOptions: [
      { value: 'donut', label: 'Donut' },
      { value: 'full_size', label: 'Full-size' },
    ],
  },
  {
    key: 'adjustable_seats',
    label: 'Adjustable seats',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4090,
    dataSource: 'static',
    staticOptions: [
      { value: 'driver_electric', label: 'Driver seat electric adjustment' },
      { value: 'driver_manual', label: 'Driver seat manual adjustment' },
      {
        value: 'front_back_electric',
        label: 'Front and back seats electric adjustment',
      },
      { value: 'front_electric', label: 'Front seats electric adjustment' },
      { value: 'front_manual', label: 'Front seats manual adjustment' },
    ],
  },
  {
    key: 'seat_position_memory',
    label: 'Seat position memory',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4100,
    dataSource: 'static',
    staticOptions: [
      { value: 'driver', label: 'Driver seat' },
      { value: 'front', label: 'Front seats' },
      { value: 'front_back', label: 'Front and back seats' },
    ],
  },
  {
    key: 'seat_heater',
    label: 'Seat heater',
    type: 'RADIO',
    component: 'radio',
    group: 'Additional options',
    order: 4110,
    dataSource: 'static',
    staticOptions: [
      { value: 'front', label: 'Front seats' },
      { value: 'front_back', label: 'Front and back seats' },
    ],
  },
  {
    key: 'cabin_and_comfort',
    label: 'Cabin and comfort',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Cabin and comfort',
    order: 5000,
    dataSource: 'static',
    staticOptions: [
      { value: 'sunroof', label: 'Sunroof' },
      { value: 'heated_steering_wheel', label: 'Heated steering wheel' },
      { value: 'rain_sensor', label: 'Rain sensor' },
      { value: 'cruise_control', label: 'Cruise control' },
      { value: 'adaptive_cruise', label: 'Adaptive cruise control' },
      { value: 'keyless_entry', label: 'Keyless entry' },
    ],
  },
  {
    key: 'multimedia',
    label: 'Multimedia',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Multimedia',
    order: 5100,
    dataSource: 'static',
    staticOptions: [
      { value: 'bluetooth', label: 'Bluetooth' },
      { value: 'apple_carplay', label: 'Apple CarPlay' },
      { value: 'android_auto', label: 'Android Auto' },
      { value: 'usb', label: 'USB' },
      { value: 'premium_audio', label: 'Premium audio' },
      { value: 'navigation', label: 'Navigation' },
    ],
  },
  {
    key: 'safety_features',
    label: 'Safety features',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Safety features',
    order: 5200,
    dataSource: 'static',
    staticOptions: [
      { value: 'abs', label: 'ABS' },
      { value: 'esp', label: 'ESP' },
      { value: 'traction_control', label: 'Traction control' },
      { value: 'lane_assist', label: 'Lane assist' },
      { value: 'blind_spot', label: 'Blind spot monitoring' },
      { value: 'airbags', label: 'Airbags' },
    ],
  },
  {
    key: 'parking_assistance_system',
    label: 'Parking assistance system',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Parking assistance system',
    order: 5300,
    dataSource: 'static',
    staticOptions: [
      { value: 'front_sensors', label: 'Front sensors' },
      { value: 'rear_sensors', label: 'Rear sensors' },
      { value: 'rear_camera', label: 'Rear camera' },
      { value: 'surround_view', label: '360 camera' },
      { value: 'auto_park', label: 'Automatic parking' },
    ],
  },
  {
    key: 'headlights',
    label: 'Headlights',
    type: 'RADIO',
    component: 'radio',
    group: 'Optics',
    order: 5400,
    dataSource: 'static',
    staticOptions: [
      { value: 'bi_xenon', label: 'Bi-xenon' },
      { value: 'halogen', label: 'Halogen' },
      { value: 'laser', label: 'Laser' },
      { value: 'led', label: 'LED' },
      { value: 'matrix', label: 'Matrix' },
      { value: 'xenon', label: 'Xenon' },
    ],
  },
  {
    key: 'additional_equipment',
    label: 'Additional equipment',
    type: 'CHECKBOX_GROUP',
    component: 'checkbox',
    group: 'Additional equipment',
    order: 5500,
    dataSource: 'static',
    staticOptions: [
      { value: 'tow_bar', label: 'Tow bar' },
      { value: 'roof_rack', label: 'Roof rack' },
      { value: 'alarm', label: 'Alarm' },
      { value: 'immobilizer', label: 'Immobilizer' },
      { value: 'tinted_windows', label: 'Tinted windows' },
    ],
  },

  // --- More details ---
  {
    key: 'more_details',
    label: 'More details',
    type: 'RICHTEXT',
    component: 'textarea',
    group: 'More details',
    order: 6000,
    placeholder:
      'Indicate additional characteristics or special features of your vehicle.',
  },

  // --- Ad parameters ---
  {
    key: 'advert_type',
    label: 'Advert type',
    type: 'RADIO',
    component: 'radio',
    group: 'Ad parameters',
    order: 7000,
    dataSource: 'static',
    staticOptions: [
      { value: 'sale', label: 'Sale' },
      { value: 'sale_rent', label: 'Sale / Rent' },
      { value: 'rent', label: 'Rent' },
    ],
  },
  {
    key: 'price',
    label: 'Price',
    type: 'NUMBER',
    component: 'number',
    group: 'Ad parameters',
    order: 7010,
    validationRules: { min: 0, max: 1000000000 },
  },
  {
    key: 'currency',
    label: 'Currency',
    type: 'SELECT',
    component: 'select',
    group: 'Ad parameters',
    order: 7020,
    dataSource: 'static',
    staticOptions: [
      { value: 'EUR', label: '€ EUR' },
      { value: 'USD', label: '$ USD' },
      { value: 'GBP', label: '£ GBP' },
      { value: 'UAH', label: '₴ UAH' },
    ],
  },
  {
    key: 'vat_type',
    label: 'VAT',
    type: 'RADIO',
    component: 'radio',
    group: 'Ad parameters',
    order: 7030,
    dataSource: 'static',
    staticOptions: [
      { value: 'excluding', label: 'excluding VAT' },
      { value: 'including', label: 'including VAT' },
    ],
  },
  {
    key: 'vat_percent',
    label: 'VAT %',
    type: 'NUMBER',
    component: 'number',
    group: 'Ad parameters',
    order: 7040,
    validationRules: { min: 0, max: 100, unit: '%' },
  },
  {
    key: 'warranty',
    label: 'Warranty',
    type: 'SELECT',
    component: 'select',
    group: 'Ad parameters',
    order: 7050,
    dataSource: 'static',
    staticOptions: [
      { value: 'none', label: 'No warranty' },
      { value: '3_months', label: '3 months' },
      { value: '6_months', label: '6 months' },
      { value: '12_months', label: '12 months' },
      { value: '24_months', label: '24 months' },
    ],
  },
  {
    key: 'seller_stock_id',
    label: 'Seller stock ID',
    type: 'TEXT',
    component: 'text',
    group: 'Ad parameters',
    order: 7060,
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
  COLOR: 'color',
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
  color: 'COLOR',
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
