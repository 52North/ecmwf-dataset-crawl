import cfg from '../config'
import { Language } from '../models/Language'

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
  language?: Language
  restrictLang?: boolean
}

export type SearchResult = {
  url: string
  title?: string
}

import { SearchApiGoogle } from './SearchApiGoogle'
export const searcher = new SearchApiGoogle(cfg.search.google)
