/**
 * Content/Text Resources Schema
 * Defines all user-facing text that should be configurable per domain/language
 */

export interface CommonContent {
  // App branding text
  appName: string;
  appDescription: string;
  tagline: string;

  // Navigation & UI
  home: string;
  about: string;
  help: string;
  settings: string;
  logout: string;
  login: string;
  register: string;

  // Chat/Messaging
  placeholder: string;
  send: string;
  typing: string;
  startChat: string;
  noMessages: string;
  clearChat: string;

  // Voice
  voiceInput: string;
  voiceOutput: string;
  startListening: string;
  stopListening: string;
  listening: string;
  speaking: string;
  speakResponse: string;

  // Actions
  cancel: string;
  submit: string;
  save: string;
  delete: string;
  edit: string;
  close: string;
  next: string;
  previous: string;

  // Status messages
  loading: string;
  error: string;
  success: string;
  warning: string;
  noResults: string;
  tryAgain: string;

  // Help text
  helpTitle: string;
  helpDescription: string;
  faq: string;
  feedback: string;
  contactUs: string;

  // Footer
  copyright: string;
  privacy: string;
  terms: string;
  about_us: string;
}

/**
 * Fitness-specific content
 */
export interface FitnessContent extends CommonContent {
  // Domain-specific strings
  workoutTips: string;
  exerciseLibrary: string;
  trainingPlans: string;
  nutrition: string;
  progress: string;
  measurements: string;
  goals: string;
  personalBest: string;
  getStarted: string;
  startWorkout: string;
  endWorkout: string;
  workoutHistory: string;
  askFitnessCoach: string;
}

/**
 * Business-specific content
 */
export interface BusinessContent extends CommonContent {
  // Domain-specific strings
  businessTools: string;
  coachingPlans: string;
  resources: string;
  casestudies: string;
  mentorship: string;
  courses: string;
  certifications: string;
  consulting: string;
  getConsultation: string;
  askBusinessCoach: string;
  marketingGuides: string;
  businessStrategy: string;
}

/**
 * Healthcare-specific content
 */
export interface HealthcareContent extends CommonContent {
  // Domain-specific strings
  healthAssessment: string;
  appointments: string;
  medications: string;
  labResults: string;
  symptoms: string;
  illnesses: string;
  treatments: string;
  preventiveCare: string;
  emergency: string;
  askHealthcare: string;
  medicalRecords: string;
  healthHistory: string;
}

/**
 * Language enum
 */
export enum Language {
  EN = 'en',
  TA = 'ta',
  TE = 'te',
  HI = 'hi',
  KN = 'kn',
  ML = 'ml',
  MR = 'mr',
  PA = 'pa',
  BN = 'bn',
  GU = 'gu',
  ES = 'es',
  FR = 'fr',
}

/**
 * Content type mapping
 */
export type DomainContent = FitnessContent | BusinessContent | HealthcareContent;

/**
 * Content manager config
 */
export interface ContentConfig {
  domain: string;
  language: string;
  fallbackLanguage: string;
}
