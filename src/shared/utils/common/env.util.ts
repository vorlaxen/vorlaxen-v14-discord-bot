export class EnvUtils {
    static mustParse<T>(value: string | undefined, name: string, parser: (v: string) => T): T {
        if (!value) throw new Error(`Missing required env var: ${name}`);
        try {
            return parser(value);
        } catch {
            throw new Error(`Invalid value for env var: ${name}`);
        }
    }
}