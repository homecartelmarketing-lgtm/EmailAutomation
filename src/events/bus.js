import { EventEmitter } from 'node:events';

/**
 * Global event bus for broadcasting real-time storefront behavioral events
 * to connected admin dashboards and SSE subscribers.
 */
export const eventBus = new EventEmitter();

// Allow up to 100 concurrent dashboard viewers without warning
eventBus.setMaxListeners(100);
