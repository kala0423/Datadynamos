
export interface CertificateData {
  certificateId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  passes: number;
  originalHash: string;
  finalHash: string;
  wipeDate: string;
  success: boolean;
  toolVersion: string;
  standardCompliance: string;
  qrUrl: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export enum WipeStatus {
  IDLE = 'IDLE',
  WIPING = 'WIPING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
