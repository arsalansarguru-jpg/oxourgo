import type { AppAuthRole } from '@/lib/auth/roles'

import type { HelpArticle } from '@/lib/admin/help-center/types'

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function articleMatchesRole(article: HelpArticle, role: AppAuthRole): boolean {
  if (article.roles === 'all') return true
  return article.roles.includes(role)
}

export function filterArticlesForRole(articles: HelpArticle[], role: AppAuthRole): HelpArticle[] {
  return articles.filter((a) => articleMatchesRole(a, role))
}

export function searchHelpArticles(articles: HelpArticle[], query: string, role: AppAuthRole): HelpArticle[] {
  const scoped = filterArticlesForRole(articles, role)
  const q = normalize(query)
  if (!q) return scoped

  return scoped
    .map((article) => {
      let score = 0
      const haystack = [
        article.title,
        article.description,
        ...article.keywords,
        ...article.sections.map((s) => `${s.title} ${s.body}`),
      ]
        .join(' ')
        .toLowerCase()

      if (normalize(article.title).includes(q)) score += 10
      if (normalize(article.description).includes(q)) score += 5
      if (article.keywords.some((k) => normalize(k).includes(q))) score += 4
      if (haystack.includes(q)) score += 2

      return { article, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.article)
}

export function getArticleBySlug(articles: HelpArticle[], slug: string): HelpArticle | undefined {
  return articles.find((a) => a.slug === slug)
}
