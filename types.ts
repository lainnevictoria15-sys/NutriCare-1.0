export enum Gender {
  Male = 'Masculino',
  Female = 'Feminino',
  Other = 'Outro'
}

export enum PatientStatus {
  Active = 'Ativo',
  Inactive = 'Inativo',
  Bedridden = 'Acamado',
  Hospitalized = 'Hospitalizado',
  Conscious = 'Consciente',
  Unconscious = 'Inconsciente',
  HomeCare = 'Home Care'
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  livingArrangement: string; // "Com quem mora"
}

export interface ResponsibleParty {
  name: string;
  relation: string;
  contact: string;
}

export interface InitialContact {
  notes: string; // Family situation, service explanation
  pricingAgreed: string;
  paymentMethod: string;
  nfcGenerated: boolean; // "NFC já foi gerada e enviada?"
  date: string;
}

export interface Anamnesis {
  date: string;
  weight: number;
  height: number;
  bodyDistribution: string; // 'distribution corporal'
  ageAssessment: string; // 'avaliação da idade'
  clinicalStatus: PatientStatus[]; // Changed to array for multiple statuses
  mobilityNotes: string; // e.g., escaras details
  financialStatus: string; // low, medium, high - affects diet choice
  foodRestrictions: string[]; // what cannot eat
  foodPreferences: string[]; // what likes
  dietType: string; // Changed to string to allow manual input
  goals: string[]; // e.g., muscle gain, wound healing
  liquidRequirement: number; // ml per day
  mealsPerDay: number;
  mealScheduleNotes: string;
}

export interface MealItem {
  food: string;
  portion: string;
  unit?: string; // g, kg, ml, colher
  calories?: number;
}

export interface Meal {
  name: string; // Breakfast, Lunch, etc.
  time: string;
  items: MealItem[];
}

export interface DailyDiet {
  dayOfWeek: string; // Monday, Tuesday...
  meals: Meal[];
}

export interface DietPlan {
  id: string;
  createdAt: string;
  weeks: DailyDiet[]; // Array of 7 days
  notes: string;
  explanation?: string; // "Why this diet?"
  macros?: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
  };
}

export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  age: number; // Automatically calculated
  gender: Gender;
  contact: ContactInfo;
  responsible?: ResponsibleParty; // Optional
  initialContact?: InitialContact;
  anamnesis?: Anamnesis;
  currentDietPlan?: DietPlan;
}

export interface Appointment {
  id: string;
  patientId: string; // If "Other", this might be empty or special ID
  patientName: string;
  date: string; // ISO string
  time: string;
  type: 'Online' | 'Presencial (Consultório)' | 'Presencial (Domicílio)';
  location: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  isReturn?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  tags: string[]; // e.g., "Low Carb", "Hypercaloric"
  calories?: number;
  restrictions?: string[];
  isManual?: boolean;
}