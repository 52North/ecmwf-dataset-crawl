import cfg from '../config'

export type Language = {
  name: string
  code: string   // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2 // FIXME rename!
  code3?: string // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
}

// @ts-ignore
import countries from 'world-countries'

export function getDefaultLanguage (): Language {
  return getLanguageFromValue({ code: cfg.defaultLanguage })
}

// FIXME: dont conflate countries & languages! need to think of a concept to translate between the two
export function getLanguageFromValue (values: LangAttrs): Language {
  const valuesEqual = (lhs: string, rhs?: string) => lhs.toLowerCase() === (rhs || '').toLowerCase()

  const { name, code, code3 } = values
  const c = countries.find((c: any) => (
    valuesEqual(c.name.common, name) ||
    valuesEqual(c.cca2, code) ||
    valuesEqual(c.cca3, code3)
  ))
  if (!c) throw new Error(`No Language matched for ${JSON.stringify(values)}`)

  return {
    name: c.name.common,
    code: c.cca2,
    code3: c.cca3,
  }
}

type LangAttrs = {
  name?: string
  code?: string  // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2 // FIXME rename!
  code3?: string // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
}
