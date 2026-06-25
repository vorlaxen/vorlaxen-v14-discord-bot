export class EnvUtils {
  static string(name: string, defaultValue?: string): string {
    const value = process.env[name] || defaultValue;
    if (value === undefined) throw new Error(`Missing: ${name}`);
    return value;
  }

  static number(name: string, defaultValue?: number): number {
    const value = process.env[name];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Missing: ${name}`);
    }
    return Number(value);
  }

  static bool(name: string, defaultValue?: boolean): boolean {
    const value = process.env[name];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Missing: ${name}`);
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  static array(name: string, defaultValue?: string[]): string[] {
    const value = process.env[name];
    if (!value) return defaultValue || [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
}
