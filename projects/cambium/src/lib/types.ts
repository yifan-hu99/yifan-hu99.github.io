export type Intent = { query: string; roles: string[]; location: string; remote: boolean; contract: boolean; excludeFullTime: boolean; horizon: number; roleFamily?: 'translation'|'fde'|'evaluation'|'creative'|'engineering'; aiRequired?: boolean; industry?: string; industryRequired?: boolean; engagementPreference?: 'freelance'|'full-time'; allowAdjacent?: boolean };
export type Opportunity = { id: string; title: string; organization: string; summary: string; location: string; modality: string; engagement: string; compensation: string; type: 'PUBLISHED'|'INFERRED_SIGNAL'; source: string; url: string; sources: string[]; publishedAt: string|null; observedAt: string; evidence: string; why: string[]; caveat: string; demo: boolean; score: number; contact: string|null; nextAction?: string; matchTier?: 'exact'|'adjacent'; facts?: OpportunityFacts; brief?: OpportunityBrief; matchContext?: Intent };
export type SourceReport = { id: string; status: string; detail: string; count?: number };
export type SearchOutcome = { opportunities: Opportunity[]; report: SourceReport[]; metrics: { candidates: number; rejected: number; duplicates: number; durationMs: number }; intent: Intent };
export type ChatMessage = { id: string; role: string; text: string; blocks: { opportunities?: Opportunity[]; report?: SourceReport[]; intent?: Intent; metrics?: SearchOutcome['metrics'] }; createdAt?: string };
export type Conversation = { id: string; title: string; messages?: ChatMessage[] };
export type ProfileData = { name: string; location: string; skills: string; preferences: string; portfolio: string; useForMatching: boolean; useForDrafts: boolean };
export type LibraryItem = { id: string; opportunityId: string; status: string; notes: string; opportunity: { payload: Opportunity }; events: { id: string; type: string; detail: string; createdAt: string }[] };
export const statuses = ['SAVED','CONTACTED','WAITING','IN_PROGRESS','WON','CLOSED'] as const;

export type SourceLink={url:string;label:string;sourceUrl:string};
export type SourceEmail={value:string;sourceUrl:string;evidence:string};
export type OpportunityFacts={requirements:string[];responsibilities:string[];restrictions:string[];deadline:string|null;contactName:string|null;emails:SourceEmail[];website:SourceLink|null;application:SourceLink|null;businessSignal:string|null};
export type OpportunityBrief={
 version:1;
 whyThis:{description:string;responsibilities:string[];evidence:string;sourceUrl:string|null;evidenceLevel:string;uncertainty:string};
 whyYou:{basis:string;matches:string[];gaps:string[];profileUsed:boolean};
 whyNow:{publishedAt:string|null;observedAt:string|null;deadline:string|null;reason:string;businessSignal:string|null;uncertainty:string};
 conditions:{compensation:string;location:string;engagement:string;modality:string;requirements:string[];restrictions:string[]};
 contactRoutes:{website:SourceLink|null;original:string|null;application:SourceLink|null;person:string|null;emails:SourceEmail[];provenance:string;publisher:string};
 nextAction:{person:string;channel:string;message:string;prepare:string[];followUp:string};
};
