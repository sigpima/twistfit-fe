import type Database from 'better-sqlite3'

export type AdminStats = {
  blogPosts: { total: number; new30d: number }
  forumPosts: { total: number; new30d: number }
  users: { total: number; new30d: number }
  quizAttempts: { total: number; new30d: number }
  contactMessages: { total: number; unread: number }
}

function count(db: Database.Database, sql: string, param?: string): number {
  const row = (param !== undefined ? db.prepare(sql).get(param) : db.prepare(sql).get()) as {
    count: number
  }
  return row.count
}

export function getAdminStats(db: Database.Database): AdminStats {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  return {
    blogPosts: {
      total: count(db, 'SELECT COUNT(*) AS count FROM blog_posts'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM blog_posts WHERE created_at >= ?', since),
    },
    forumPosts: {
      total: count(db, 'SELECT COUNT(*) AS count FROM forum_posts'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM forum_posts WHERE created_at >= ?', since),
    },
    users: {
      total: count(db, 'SELECT COUNT(*) AS count FROM users'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM users WHERE created_at >= ?', since),
    },
    quizAttempts: {
      total: count(db, 'SELECT COUNT(*) AS count FROM quiz_attempts'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM quiz_attempts WHERE created_at >= ?', since),
    },
    contactMessages: {
      total: count(db, 'SELECT COUNT(*) AS count FROM contact_messages'),
      unread: count(db, 'SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0'),
    },
  }
}
