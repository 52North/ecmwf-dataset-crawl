import { countries, languages } from 'countries-list'

export type Language = {
  name: string
  iso639_1: string
}

export function getDefaultLanguage (): Language & {iso3166_a2: string} {
  return { name: 'English', iso639_1: 'en', iso3166_a2: 'uk' }
}

export function languagesFromCountry (country: { iso3166_a2?: string }): Language[] {
  const { iso3166_a2 } = country

  if (iso3166_a2) {
    // @ts-ignore
    const langs: string[] = countries[iso3166_a2.toUpperCase()].languages
    if (langs) {
      return langs.map((l: string) => ({
        // @ts-ignore
        name: languages[l].name,
        iso639_1: l,
        iso3166_a2,
      }))
    }
  }

  throw new Error(`No Language matched for ${JSON.stringify(country)}`)
}

type Country = {
  name: string
  iso3166_a2: string
  languages: Language[]
}

/**
 * returns all countries where one of the given languages is first spoken lang
 * @param langs list of iso639_1 language (two-letter) codes
 * @returns Country[]
 */
export function countriesFromLanguages (langs: string[], filterCountryLangs = true): Country[] {
  const codes = Object.keys(countries)
  const res = []
  for (const c of codes) {
    // @ts-ignore
    const country = countries[c]
    // only add when first language matches
    if (langs.indexOf(country.languages[0]) >= 0) {
      res.push({
        name: country.name,
        iso3166_a2: c.toLowerCase(),
        languages: languagesFromCountry({ iso3166_a2: c })
          // only return languages that were requested
          .filter(l => !filterCountryLangs || langs.indexOf(l.iso639_1) > -1)
      })
    }
  }

  return res
}
