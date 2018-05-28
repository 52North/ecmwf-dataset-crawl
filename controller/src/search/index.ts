/**
 * implementation classes must implement this interface
 */
export interface SearchApi {
  // async setup like authentication etcpp
  init (): Promise<any>
  search (terms: string[], options?: SearchQueryOptions): Promise<SearchResult[]>
}

export type SearchQueryOptions = {
  numResults?: number
  language?: string
  restrictLang?: boolean
}

export type SearchResult = {
  url: string
  title?: string
}

export * from './SearchApiGoogle'
