import { ParsedLog } from './mock-data';

export class LogParser {
  static parse(raw: string): ParsedLog {
    // 1. Try Huawei CSV Format (Heuristic: Comma separated, contains "Operation" or date format like "25/11/2025")
    // Example: Query logs,Warning,," 25/11/2025...",...
    if (raw.includes(',') && (raw.match(/\d{2}\/\d{2}\/\d{4}/) || raw.split(',').length >= 8)) {
      try {
        const csvParsed = this.parseHuaweiCSV(raw);
        if (csvParsed) return csvParsed;
      } catch (e) {
        // distinct failure, fallthrough
      }
    }

    // 2. Try CEF
    if (raw.includes('CEF:')) {
      return this.parseCEF(raw);
    }
    
    // 3. Try Key-Value (KV_EXT) - rough heuristic: looks for k=v patterns
    if (raw.match(/(\w+)=([^\s]+)/g)) {
      return this.parseKV(raw);
    }

    // 4. Fallback
    return this.parseSyslog(raw);
  }

  private static parseHuaweiCSV(raw: string): ParsedLog | null {
    // Simple CSV splitter that respects quotes would be better, but for this prototype we'll do a basic split
    // Real CSV parsing should handle escaped quotes, etc.
    // Format: Operation,Level,Operator,Time,Source,Terminal IP Address,Operation Object,Result,Details
    
    // Regex to match CSV fields handling quotes
    const matches = raw.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    // Fallback split if regex fails or simple line
    const parts = matches || raw.split(',');

    if (parts.length < 5) return null;

    // Helper to clean quotes and extra whitespace
    const clean = (s: string) => s ? s.replace(/^"|"$/g, '').trim() : '';

    const operation = clean(parts[0]);
    const level = clean(parts[1]);
    // parts[2] is Operator (often empty)
    let user = clean(parts[2]);
    if (!user) user = 'system'; // Default if empty

    const timeStr = clean(parts[3]); 
    // Time often has a tab or extra chars in the provided sample: "    25/11/2025..."
    
    const source = clean(parts[4]);
    const ip = clean(parts[5]);
    const obj = clean(parts[6]);
    const result = clean(parts[7]);
    const details = parts.slice(8).join(',').replace(/^"|"$/g, '').trim(); // Join rest as details

    // Map Levels to standard severity
    let severity = 'info';
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('risk') || lowerLevel.includes('critical')) severity = 'critical';
    else if (lowerLevel.includes('warning') || lowerLevel.includes('major')) severity = 'high';
    else if (lowerLevel.includes('minor')) severity = 'low';

    return {
      format: 'HUAWEI_CSV',
      timestamp: timeStr, // Keep original string, or parse if needed
      operation,
      severity,
      user,
      source,
      src_ip: ip,
      target: obj,
      status: result,
      message: details,
      raw_level: level
    };
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
