// make shure each item contains a single word and not empty strings
export function arrayOfWords (strings) {
  const cleaned = strings.map(v => v.trim().split(' '))

  return []
    .concat(...cleaned)
    .filter(v => !!v)
}
