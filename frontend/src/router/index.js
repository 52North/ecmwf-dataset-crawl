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
    props (route) {
      const crawls = route.query.crawls || ''
      return {
        crawls: crawls === '' ? [] : crawls.split(','),
        query: route.query.q,
      }
    },
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
  routes,
  scrollBehavior (to, from, savedPos) {
    if (to.path === '/crawls/new') {
      return { x: 0, y: 0 }
    } else {
      return savedPos
    }
  }
})
