import { Router } from 'express'
import { prisma } from '../db'

export const categoriesRouter = Router()

categoriesRouter.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { slug: 'asc' },
    select: {
      slug: true,
      name: true,
      _count: { select: { problems: { where: { isPublished: true } } } },
    },
  })

  res.json(
    categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      problemCount: c._count.problems,
    })),
  )
})
