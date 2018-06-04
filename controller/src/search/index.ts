import cfg from '../config'

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
  country?: string // ISO3166-1-alpha2 country code
  language?: string // ISO639-1 language code
  restrictCountry?: boolean
}

export type SearchResult = {
  url: string
  title?: string
}

import { SearchApiGoogle } from './SearchApiGoogle'
export const searcher = new SearchApiGoogle(cfg.search.google)
