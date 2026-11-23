export const HOST: string
export const INDEXNOW_KEY: string
export const KEY_LOCATION: string
export const ENDPOINT: string
export const MAX_URLS: number
export type IndexNowPayload = { host: string; key: string; keyLocation: string; urlList: string[] }
export function parseSitemap(xml: string): Map<string, string>
export function changedUrls(previous: Map<string, string> | null, current: Map<string, string>): string[]
export function buildPayloads(urls: string[]): IndexNowPayload[]
export function isAccepted(status: number): boolean
