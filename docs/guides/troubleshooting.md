# Troubleshooting Guide

## 🔧 Database & Prisma

### Issue: "Prisma Client has not been initialized" or Schema Mismatch
**Symptom**: Runtime errors claiming tables don't exist or fields are missing.
**Solution**:
1. Stop the dev server.
2. Run `npx prisma generate` to rebuild the client types.
3. Restart the server.

### Issue: Migration Errors
**Symptom**: `migrate dev` fails.
**Solution**: 
- If in dev, and data loss is acceptable: `npx prisma migrate reset`.
- Otherwise, check for schema conflicts manually.

## 🎨 Styling

### Issue: Classes not applying
**Reason**: Tailwind's JIT compiler might not be watching the file.
**Solution**: Check `tailwind.config.ts` content array. Ensure your file is within `src/**/*.{...}` or `app/**/*.{...}`.

## ⚡ Next.js / Server Actions

### Issue: "Server Functions cannot be imported from Client Components"
**Reason**: Importing a file with database logic directly into a client component without `'use server'` directive at the top of the function/file.
**Solution**: Ensure the action file starts with `'use server'` or pass the action as a prop.

### Issue: Infinite Loop in `useEffect`
**Reason**: Fetching data without dependencies or stable references.
**Solution**: Use `useQuery` (if available) or Server Components for initial fetch.
