import {
  deleteResults as deleteResultsFromDb,
  getResults as getResultsFromDb,
  getResultCount as getResultCountFromDb,
} from '../../elastic'

/**
 * Deletes crawl results based on filter
 *
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * returns DeleteResponse
 **/
export async function deleteResults (crawls?: string[], query?: string) {
  return deleteResultsFromDb(crawls, query)
}

/**
 * Get count of crawl results with optional filtering
 *
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * returns Integer
 **/
export async function getResultCount (crawls?: string[], query?: string) {
  return getResultCountFromDb(crawls, query)
}

/**
 * Get crawl results with optional filtering
 *
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * maxResults Integer The amount of results to return (optional)
 * page Integer To page through the results (optional)
 * format String Format in which results are returned (optional)
 * download Boolean Whether to send an attachment header (optional)
 * returns List
 **/
export async function getResults (crawls?: string[], query?: string, from?: number, size?: number) {
  return getResultsFromDb(crawls, query, from, size)
}

/**
 * Only defined to handle preflight CORS requests
 *
 * no response value expected for this operation
 **/
export async function handlePreflight3 () {
  return new Promise(function (resolve, reject) {
    resolve()
  })
}
