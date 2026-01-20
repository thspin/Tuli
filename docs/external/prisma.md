# Prisma & Database Guide

## 📚 Version
- **Prisma**: `v6.0.0`
- **Client**: `@prisma/client`

## 🔎 Common Patterns

### Fetching Data
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'alice@prisma.io' },
})
```

### Relations
Include related records:
```typescript
const usersWithPosts = await prisma.user.findMany({
  include: {
    posts: true,
  },
})
```

### Filtering
```typescript
const posts = await prisma.post.findMany({
  where: {
    published: true,
    content: { contains: 'Prisma' },
  },
})
```

## 🛠️ Useful Commands
- `npx prisma generate`: Update TypeScript types after schema changes.
- `npx prisma studio`: Open GUI to view/edit data.
- `npx prisma db push`: Rapid prototyping (skip migrations).
