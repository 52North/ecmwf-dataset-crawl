import axios from 'axios'

axios.defaults.baseURL = process.env.API_URL

// maintains global cache
const store = {
  crawls: null,
  results: null,
  totalResults: null,
  languages: null,
}

export async function getCrawls (cache = true) {
  if (store.crawls === null || !cache) {
    const res = await axios.get('/crawls')
    store.crawls = res.data
  }

  return store.crawls
}

export async function addCrawl (params) {
  const res = await axios.put('/crawls', { params })
  return res.data
}

export async function getResults (params, cache = false) {
  if (store.results === null || !cache) {
    const res = await axios.get('/results', { params })
    store.results = res.data
  }

  return store.results
}

export async function getTotalResults (cache = false) {
  if (store.totalResults === null || !cache) {
    const res = await axios.get('/results/counts')
    store.totalResults = res.data
  }

  return store.totalResults
}

export async function exportResults (parameters) {
  const params = Object.assign({
    maxResults: -1,
    format: 'csv',
    download: true
  }, parameters)

  const res = await axios.get('/results', { params })
  return res.data
}

export async function deleteResults (params) {
  // safety
  if (!params.crawls && !params.query) {
    return console.log('trying to delete all results! aborting!')
  }

  const res = await axios.delete('/results', { params })
  return res.data
}

export async function getLanguages (cache = true) {
  if (store.languages === null || !cache) {
    const res = await axios.get('/capabilities/languages')
    store.languages = res.data
  }

  return store.languages
}
