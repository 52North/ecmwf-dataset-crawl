import { Language } from '../models/Language'

/**
 * implementation classes must implement this interface
 */
export interface TranslationApi {
  // async setup, authentication etcpp
  init (): Promise<any>
  availableLanguages (fromLang?: Language): Promise<Language[]>
  translate (terms: string[], from: Language, to: Language, options?: TranslationQueryOptions): Promise<string[]>
}

export type TranslationQueryOptions = { }

import cfg from '../config'
import TranslationApiAzure from './TranslationApiAzure'
export const translator = new TranslationApiAzure(cfg.translation.azure)
