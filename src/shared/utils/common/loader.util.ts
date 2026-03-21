import * as path from "path";
import * as dotenv from "dotenv";
import * as fs from "fs";

export const loadEnv = () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    const envDir = path.resolve(process.cwd(), "env");
    const envFile = `.env.${nodeEnv}`;
    const envPath = path.join(envDir, envFile);
    const fallbackPath = path.resolve(process.cwd(), envFile);

    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    } else if (fs.existsSync(fallbackPath)) {
        dotenv.config({ path: fallbackPath });
    }
};