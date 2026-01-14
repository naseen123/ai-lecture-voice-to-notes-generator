
export enum NoteFormat {
  BULLET = 'Bullet Points',
  PARAGRAPH = 'Paragraph Format'
}

export interface ProcessingResult {
  transcription: string;
  notes: string;
  format: NoteFormat;
}

export interface AppState {
  view: 'upload' | 'result';
  isProcessing: boolean;
  result: ProcessingResult | null;
  error: string | null;
}
