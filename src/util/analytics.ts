export type AnalyticsData = CrashReport;

interface CrashReport {
  app: {
    version: string;
    commit: string;
    debug: boolean;
  };
  device: {
    manufacturer: string;
    model: string;
    sdk: number;
  }
  timestamp: number;
  stacktrace: string;
}