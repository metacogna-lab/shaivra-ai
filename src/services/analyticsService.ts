interface LogEntry {
  sessionUuid: string;
  userUuid: string;
  username: string;
  feature: string;
  details: string;
  timestamp: string;
}

const logs: LogEntry[] = [];

export const analyticsService = {
  logEvent: (sessionUuid: string, userUuid: string, username: string, feature: string, details: string) => {
    const entry: LogEntry = {
      sessionUuid,
      userUuid,
      username,
      feature,
      details,
      timestamp: new Date().toISOString()
    };
    logs.push(entry);
    console.log('[ANALYTICS] Logged:', entry);
  },
  
  getLogs: () => {
    return logs;
  }
};
