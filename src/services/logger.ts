export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  warn: (msg: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  error: (msg: string, meta?: any) => {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message: msg, ...meta }));
  }
};
