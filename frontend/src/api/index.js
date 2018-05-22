import axios from 'axios'

axios.defaults.baseURL = process.env.API_URL

// maintains global state
const store = {
  crawls: null,
  results: null,
  totalResults: null
}

export async function getCrawls (cache = false) {
  if (store.crawls === null || !cache) {
    const res = await axios.get('/crawls')
    store.crawls = res.data
  }

  return store.crawls
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
