# Duplicate Chapter Fixer

This script fixes the "Token Deploying..." issue by removing duplicate chapters and ensuring readers see the correct token addresses.

## Problem

During chapter publishing, sometimes duplicate chapters are created:

- One chapter without tokens (empty)
- One chapter with tokens (correct)

This causes readers to see "Token Deploying..." instead of the actual voting tokens.

## How to Use

### 1. Navigate to the web directory

```bash
cd web
```

### 2. List all chapters for a story (to identify duplicates)

```bash
npm run fix-duplicates <story-id> list
```

### 3. Fix duplicate chapters

```bash
npm run fix-duplicates <story-id> fix
```

## Finding Your Story ID

1. Go to your story in the app
2. Check the URL: `/story/[STORY_ID]`
3. Or check browser console logs when loading the story page

## Examples

```bash
# List all chapters for story abc123
npm run fix-duplicates abc123 list

# Fix duplicates in story abc123
npm run fix-duplicates abc123 fix
```

## Sample Output

```
🔍 Checking for duplicate chapters in story: abc123
📊 Found 4 total chapters for story abc123

🔄 Found 2 chapters with title: "Chapter 1: The Beginning"
   ✅ Keeping chapter: def456
      - Has Tokens: true
      - Published: true
      - Created: Mon Jan 15 2024 10:30:00 GMT-0800
   🗑️  Deleting duplicate: ghi789
      - Has Tokens: false
      - Published: true
      - Created: Mon Jan 15 2024 10:25:00 GMT-0800
      ✅ Deleted successfully

🎯 Duplicate cleanup completed:
   📊 Total duplicates found: 1
   ✅ Total duplicates fixed: 1
```

## What the Script Does

### Priority Order (highest to lowest):

1. **Chapters with tokens** (plotTokens.length > 0)
2. **Published chapters** (published = true)
3. **Newer chapters** (by createdAt timestamp)

### Safety Features:

- Shows detailed info before deleting
- Only deletes true duplicates (same title + same story)
- Keeps the most complete/recent version
- Provides detailed logging of all actions

## After Running

Once you fix the duplicates:

1. Refresh your app
2. The "Token Deploying..." issue should be resolved
3. Readers should now see the correct tokens for voting

## Environment Setup

The script automatically uses your existing Firebase configuration from `src/utils/firebase.ts`. Make sure your `.env` file contains:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```
