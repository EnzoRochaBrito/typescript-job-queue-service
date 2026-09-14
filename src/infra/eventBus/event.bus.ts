export class EventBus<E extends Record<string, unknown>> {
    private listeners = new Map<keyof E, Set<(payload: any) => void>>();

    constructor() { }

    static loadEventBus<T extends Record<string, unknown>>() {
        return new EventBus<T>()
    } 

    on<K extends keyof E>(event: K, listener: (payload: E[K]) => void) {
        if (!this.listeners.has(event))
            this.listeners.set(event, new Set());

        this.listeners.get(event)!.add(listener);

        return () => {
            this.listeners.get(event)?.delete(listener);
        };
    }

    emit<K extends keyof E>(event: K, payload: E[K]) {
        this.listeners.get(event)?.forEach(listener => {
            listener(payload);
        });
    }
}