import { ParsedLog } from './mock-data';

export class LogParser {
  static parse(raw: string): ParsedLog {
    // 1. Try CEF
    if (raw.includes('CEF:')) {
      return this.parseCEF(raw);
    }
    
    // 2. Try Key-Value (KV_EXT) - rough heuristic: looks for k=v patterns
    if (raw.match(/(\w+)=([^\s]+)/g)) {
      return this.parseKV(raw);
    }

    // 3. Fallback
    return this.parseSyslog(raw);
  }

  private static parseCEF(raw: string): ParsedLog {
    // Basic CEF parser: CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
    const parts = raw.split('|');
    const extension = parts[parts.length - 1];
    const extMap: any = {};
    
    if (extension) {
      const matches = extension.match(/(\w+)=([^=]+)(?=\s\w+=|$)/g);
      if (matches) {
        matches.forEach(m => {
          const [k, v] = m.split('=');
          extMap[k.trim()] = v.trim();
        });
      }
    }

    return {
      format: 'CEF',
      vendor: parts[1],
      product: parts[2],
      version: parts[3],
      signature: parts[4],
      name: parts[5],
      severity: parts[6],
      ...extMap
    };
  }

  private static parseKV(raw: string): ParsedLog {
    const map: any = { format: 'KV_EXT' };
    const matches = raw.match(/(\w+)=("[^"]*"|[^"\s]+)/g);
    
    if (matches) {
      matches.forEach(m => {
        const [k, v] = m.split('=');
        map[k] = v.replace(/"/g, ''); // simple unquote
      });
    }
    return map;
  }

  private static parseSyslog(raw: string): ParsedLog {
    return {
      format: 'SYSLOG',
      message: raw
    };
  }
}
