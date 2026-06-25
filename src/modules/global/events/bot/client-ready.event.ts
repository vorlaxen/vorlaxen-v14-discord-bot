import { Events, ActivityType, ClientPresenceStatus } from "discord.js";
import { BotEvent } from "@/shared/types/bot.type";
import { logger } from '@/infra/logger';
import PresenceHelper from "@/shared/utils/bot/presence.util";

const ACTIVITIES = [
    { name: "TypeScript kodluyor", type: ActivityType.Playing, durationMs: 45_000 },
    { name: "GitHub projelerini inceliyor", type: ActivityType.Watching, durationMs: 45_000 },
] as const;

const clientReady: BotEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    once: true,
    execute: async (client) => {
        if (!client.user) {
            logger.error("Bot Client user is not available.");
            return;
        }

        try {
            const presenceHelper = new PresenceHelper(client);
            presenceHelper.setPresence({
                status: "online",
                activities: ACTIVITIES.map(({ name, type }) => ({ name, type }))
            });

            logger.info("Bot Presence rotation initialized.");
        } catch (error) {
            logger.error({ err: error }, 'Bot Critical error in ClientReady event');
        }
    }
};

export default clientReady;