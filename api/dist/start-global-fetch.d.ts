interface BatchResult {
    processed: number;
    added: number;
    failed: number;
    countries: string[];
    cities: string[];
}
declare function startGlobalFetch(): Promise<void>;
declare function quickFetch(continent?: string): Promise<BatchResult>;
export { startGlobalFetch, quickFetch };
//# sourceMappingURL=start-global-fetch.d.ts.map