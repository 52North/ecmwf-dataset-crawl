import { countriesFromLanguages } from '../../models/Language'
import { translator } from '../../translation'

export async function getLanguages () {
  return translator.availableLanguages()
}

export async function getCountries () {
  const langs = await translator.availableLanguages()
  return countriesFromLanguages(langs.map(l => l.iso639_1))
}
