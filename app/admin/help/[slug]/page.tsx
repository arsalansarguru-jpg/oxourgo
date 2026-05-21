import { notFound } from 'next/navigation'

import { AdminHelpArticle } from '@/components/admin/help-center/admin-help-article'
import { HELP_ARTICLES } from '@/lib/admin/help-center/articles'
import { filterArticlesForRole, getArticleBySlug } from '@/lib/admin/help-center/search'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function AdminHelpArticlePage({ params }: Props) {
  const summary = await requireAdminPageAccess('/admin/help')
  const { slug } = await params
  const article = getArticleBySlug(HELP_ARTICLES, slug)
  if (!article) notFound()

  const allowed = filterArticlesForRole([article], summary.appRole)
  if (allowed.length === 0) notFound()

  return <AdminHelpArticle article={article} />
}
