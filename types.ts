
export type Language = 'en' | 'bn';

export interface AnalysisResult {
  summary: string;
  keyFindings: string[];
  explanations: {
    term: string;
    description: string;
  }[];
  recommendations: string[];
  rawText?: string;
}

export interface ReportFile {
  file: File;
  preview: string;
  type: 'image' | 'pdf';
}

export interface HistoryItem {
  id: string;
  date: string;
  fileName: string;
  result: string;
  preview: string;
}
