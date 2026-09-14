export type ClassFields<T> = {
    [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K]
}