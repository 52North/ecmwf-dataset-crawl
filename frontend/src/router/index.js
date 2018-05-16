import Vue from 'vue'
import Router from 'vue-router'

import CrawlList from '@/components/CrawlList'
import NewCrawl from '@/components/NewCrawl'
import SearchResultList from '@/components/SearchResultList'

Vue.use(Router)

export const routes = [
  {
    icon: 'list',
    path: '/',
    name: 'Search Results',
    component: SearchResultList,
  },
  {
    icon: 'folder',
    path: '/crawls',
    name: 'Crawls',
    component: CrawlList,
  },
  {
    icon: 'create_new_folder',
    path: '/crawls/new',
    name: 'New Crawl',
    component: NewCrawl,
  }
]

export default new Router({
  routes
})
