export type Role = "user" | "assistant";
export type Length = "minimal" | "short" | "normal" | "long";
export type ProfileMode = "rp" | "development" | "questions";

export interface Profile {
  name: string;
  mode: ProfileMode;
  persona: string;
  context: string;
  tone: string;
  outputFormat: "markdown" | "plain" | "list" | "table" | "json";
  includeCodeBlocks: boolean;
  includeIntroduction: boolean;
  includeConclusion: boolean;
  length: Length;
  maxTokens: number;
  language: string;
  languageRule: string;
  uncertainty: string;
  positiveRules: string;
  forbiddenRules: string;
  scope: string;
  sources: string;
  userContext: string;
  fewShot: string;
  referenceDocuments: string;
  temperature: number;
  numCtx: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  think: boolean;
  seed: number | null;
  rpCharacter: string;
  rpScene: string;
  rpRelationship: string;
  rpRules: string;
  developmentStack: string;
  developmentStyle: string;
  developmentConventions: string;
  questionsStyle: string;
}

export interface SavedProfile {
  id: string;
  name: string;
  mode: ProfileMode;
  profile: Profile;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  profileId: string;
  profileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  role: Role;
  content: string;
  error?: boolean;
  truncated?: boolean;
}

export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "done"; truncated: boolean }
  | { type: "error"; message: string };
