export interface Application {
  id: string;
  company: string;
  position: string;
  status: 'Submitted' | 'Interviewing' | 'Rejected' | 'Offer Received';
  submissionDate: string;
  resumeId: string;
  notes: string[];
  journalEntries: JournalEntry[];
}

export interface Resume {
  id: string;
  name: string;
  content: string;
  tags: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  questions: string[];
  outcome: string;
}

export type ItemType = 'projects' | 'skills' | 'education' | 'certificates' | 'bootcamps' | 'volunteering' | 'workExperience' | 'coursework';