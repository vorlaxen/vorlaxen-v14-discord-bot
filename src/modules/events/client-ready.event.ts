import { Events, ActivityType, ClientPresenceStatus } from "discord.js";
import { BotEvent } from "@/shared/types/bot.type";
import logger from "@/infrastructure/logger";
import PresenceHelper from "@/shared/utils/bot/presenceHelper";

const ACTIVITIES = [
    { name: "TypeScript writes", type: ActivityType.Playing, durationMs: 45_000 },
    { name: "Examining GitHub projects", type: ActivityType.Watching, durationMs: 45_000 },
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
            logger.error("Bot Critical error in ClientReady event:", error);
        }
    }
};

export default clientReady;