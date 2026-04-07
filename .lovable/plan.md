

# Plan: Recode Barint AI + Fix All Errors

## Overview
Rebuild the Barint AI assistant based on the anime-oracle-ai reference project's architecture, and fix all existing bugs across the platform.

## Technical Details

### 1. Rebuild the Edge Function (`supabase/functions/barint-chat/index.ts`)
Port the comprehensive edge function from the reference repo, adapted for this project:
- **Intent detection system**: Multi-priority query processing (self-reference, greetings, character identification, quotes, images, trending, recommendations, manga search, themes, release dates, explicit anime search, casual fallback)
- **Spelling corrections & Japanese keyword mapping**: Extensive dictionary for anime title abbreviations and misspellings (e.g., "aot" -> "attack on titan", "jjk" -> "jujutsu kaisen")
- **Multi-API data fetching**: Jikan (MAL), AniList GraphQL, AnimeChan quotes, Waifu.pics/Nekos.best images, MangaDex, AnimeThemes
- **Character identification database**: Trait-based character matching from descriptions
- **Community sentiment data**: Buzz/controversy context for popular anime
- **Dual mode system**: Barint (friendly) and Birant (roast mode) with intensity levels (1-100%)
- **Model fallback**: Primary model with automatic fallback to lighter model on rate limits, plus retry logic with exponential backoff
- **Rate limit headers**: Pass remaining count and reset time back to client
- **Current date/season awareness**: Dynamic season detection and date context in prompts
- **Conversation memory**: Last 20 messages for context
- **Data formatting**: Convert API results into structured context for the AI model
- **Remove caching** (no `anime_cache` table in this project) -- fetch fresh from APIs

### 2. Rebuild Barint Page (`src/pages/Barint.tsx`)
Port the improved UI and features:
- **Markdown rendering**: Install `react-markdown` and render AI responses with proper markdown (bold, code blocks, links, images)
- **Streaming link parsing**: Detect and display streaming service links (Crunchyroll, Netflix, etc.) as clickable buttons
- **Image display**: Parse `[ANIME_IMAGE](url)` patterns and render inline images with download buttons
- **Copy message button**: Allow copying AI responses
- **Mode switching**: "activate birant mode" / "activate barint mode" commands with intensity support
- **Chat sidebar**: Multiple conversations with history, rename, delete
- **Auto-generated titles**: Edge function to generate conversation titles (or do it client-side)
- **Usage tracking**: Show remaining messages, rate limit countdown
- **Improved streaming**: Retry with exponential backoff, abort controller support, network error handling
- **Better suggestion chips**: Context-aware quick prompts

### 3. Fix Existing Bugs
- **Search page (`src/pages/Search.tsx`)**: Ensure `primaryOccupations` is always treated as array, fix `.slice` errors on non-array values
- **Home/MangaHome/NovelHome pages**: Verify AniList API calls work and handle errors gracefully with loading states instead of blank screens
- **Novel/Manga editors**: Verify all toolbar functions work, fix any TypeScript errors
- **Image quality**: Use `extraLarge` or `large` image URLs from AniList instead of `medium`

### 4. Supporting Files

**New/modified files:**
- `supabase/functions/barint-chat/index.ts` -- Complete rewrite with multi-API, intent detection, dual mode
- `src/pages/Barint.tsx` -- Complete rewrite with markdown, images, streaming links, chat history sidebar, mode switching
- `src/pages/Search.tsx` -- Bug fixes for array safety
- `src/lib/anilist.ts` -- Ensure image URLs use highest quality available
- `package.json` -- Add `react-markdown` dependency

**No database migration needed** -- the existing `barint_chats` table handles chat persistence.

### 5. Implementation Order
1. Fix all existing bugs (Search, blank pages, image quality)
2. Rebuild edge function with full feature set
3. Rebuild Barint page with new UI
4. Install react-markdown and test end-to-end

