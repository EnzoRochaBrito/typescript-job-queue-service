import { EventBus } from "./event.bus";
import type { QueueEvents } from "./events";

export const eventBus = EventBus.loadEventBus<QueueEvents>()