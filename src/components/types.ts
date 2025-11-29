export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  questions: string[];
  outcome: string;
}

export interface Application {
  id: string;
  company: string;
  position: string;
  status: 'Submitted' | 'Interviewing' | 'Rejected' | 'Offer Received';
  submissionDate: string;
  resumeId: string;
  notes: string[];
  journalEntries: JournalEntry[];
  questions?: string[]; // Optional as it might be migrated to journalEntries
  outcome?: string;     // Optional as it might be migrated to journalEntries
}

export interface Resume {
  id: string;
  name: string;
  content: string; // Deprecated: use sections. This will be generated from sections.
  sections?: Record<string, string>;
  tags: string[];
}

export type ItemType = 'projects' | 'skills' | 'education' | 'certificates & awards' | 'bootcamps' | 'volunteering' | 'experience' | 'coursework';