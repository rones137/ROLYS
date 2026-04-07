import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Spelling corrections & abbreviation map ──
const SPELLING_MAP: Record<string, string> = {
  "aot": "attack on titan", "snk": "shingeki no kyojin",
  "jjk": "jujutsu kaisen", "mha": "my hero academia", "bnha": "boku no hero academia",
  "opm": "one punch man", "sao": "sword art online", "fmab": "fullmetal alchemist brotherhood",
  "fma": "fullmetal alchemist", "hxh": "hunter x hunter", "dbz": "dragon ball z",
  "dbs": "dragon ball super", "op": "one piece", "ds": "demon slayer",
  "kny": "demon slayer kimetsu no yaiba", "csm": "chainsaw man", "spy x family": "spy x family",
  "jjba": "jojo's bizarre adventure", "aob": "attack on titan", "naruto shippuden": "naruto shippuden",
  "re zero": "re:zero", "rezero": "re:zero", "konosuba": "kono subarashii sekai ni shukufuku wo",
  "danmachi": "is it wrong to try to pick up girls in a dungeon",
  "oregairu": "my teen romantic comedy snafu", "toradora": "toradora",
  "clannad": "clannad", "steins gate": "steins;gate", "steinsgate": "steins;gate",
  "mob psycho": "mob psycho 100", "tog": "tower of god", "solo leveling": "solo leveling",
  "slime": "that time i got reincarnated as a slime", "tensura": "that time i got reincarnated as a slime",
  "shield hero": "the rising of the shield hero", "mushoku tensei": "mushoku tensei",
  "mt": "mushoku tensei", "overlord": "overlord", "konosuba": "konosuba",
  "vinland": "vinland saga", "berserk": "berserk", "bleach": "bleach",
  "gintama": "gintama", "frieren": "frieren beyond journey's end",
  "oshi no ko": "oshi no ko", "bocchi": "bocchi the rock",
  "dandadan": "dandadan", "kaiju no 8": "kaiju no. 8",
  "blue lock": "blue lock", "wind breaker": "wind breaker",
};

// ── Character identification database ──
const CHARACTER_DB: Record<string, { name: string; anime: string; traits: string }> = {
  "spiky blond hair whiskers": { name: "Naruto Uzumaki", anime: "Naruto", traits: "Ninja who dreams of becoming Hokage, uses shadow clones and Rasengan" },
  "straw hat pirate": { name: "Monkey D. Luffy", anime: "One Piece", traits: "Rubber-powered pirate captain seeking the One Piece treasure" },
  "pink hair superhuman punch": { name: "Saitama", anime: "One Punch Man", traits: "Hero who can defeat anyone with a single punch, bored of being too strong" },
  "black hair saiyan": { name: "Goku", anime: "Dragon Ball", traits: "Saiyan warrior who loves fighting and protecting Earth" },
  "white hair ghoul": { name: "Ken Kaneki", anime: "Tokyo Ghoul", traits: "Half-ghoul college student struggling with his identity" },
  "green hair hero": { name: "Izuku Midoriya (Deku)", anime: "My Hero Academia", traits: "Quirkless boy who inherits One For All to become the greatest hero" },
  "silver hair captain": { name: "Gintoki Sakata", anime: "Gintama", traits: "Lazy samurai running odd jobs in Edo-period Japan with aliens" },
  "black notebook death": { name: "Light Yagami", anime: "Death Note", traits: "Genius student who finds a supernatural notebook that kills anyone whose name is written in it" },
  "titan shifting eren": { name: "Eren Yeager", anime: "Attack on Titan", traits: "Young soldier who can transform into the Attack Titan" },
  "chainsaw devil": { name: "Denji", anime: "Chainsaw Man", traits: "Devil hunter who can transform into Chainsaw Man" },
};

// ── Community sentiment data ──
const COMMUNITY_BUZZ: Record<string, string> = {
  "attack on titan": "Widely regarded as one of the greatest anime of all time. The ending was controversial but the journey is universally praised.",
  "one piece": "The GOAT for many fans. Over 1000 episodes but the worldbuilding is unmatched. Gear 5 broke the internet.",
  "jujutsu kaisen": "Massive hype, incredible animation by MAPPA. Season 2 Shibuya arc is considered peak anime.",
  "demon slayer": "Ufotable's animation carries it hard. The fights are visual masterpieces.",
  "chainsaw man": "Polarizing adaptation but the manga is beloved. Very unique shonen that subverts expectations.",
  "frieren": "Surprise hit! A cozy yet profound story about an elf mage reflecting on her journey after defeating the Demon King.",
  "solo leveling": "Manhwa adaptation that delivered. Power fantasy done right with insane production quality.",
  "dandadan": "Science SARU absolutely cooking with the animation. Weird, funny, and surprisingly emotional.",
  "blue lock": "Sports anime on steroids. The ego-driven soccer concept is fresh and addictive.",
  "vinland saga": "Viking epic that evolves from action to pacifism. Season 2's Farmland arc changed perspectives.",
};

// ── Intent detection ──
type Intent = "self_reference" | "greeting" | "character_id" | "quote" | "image" | "trending" | "recommendation" | "manga_search" | "theme" | "release" | "anime_search" | "mode_switch" | "casual";

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase().trim();

  if (/who are you|what are you|your name|about you|what can you do/i.test(lower)) return "self_reference";
  if (/^(hi|hey|hello|yo|sup|what'?s up|howdy|greetings)/i.test(lower)) return "greeting";
  if (/who is this character|identify.*character|character with|character that/i.test(lower)) return "character_id";
  if (/quote|famous line|iconic line|said|says/i.test(lower)) return "quote";
  if (/image|picture|photo|wallpaper|fan ?art|waifu|husbando/i.test(lower)) return "image";
  if (/trending|this season|what'?s hot|popular now|currently airing/i.test(lower)) return "trending";
  if (/recommend|suggest|similar to|like|if i liked|what should i watch|next to watch/i.test(lower)) return "recommendation";
  if (/manga|manhwa|manhua|webtoon|read/i.test(lower)) return "manga_search";
  if (/theme|about|genre|type of|category/i.test(lower)) return "theme";
  if (/when (does|will|is)|release|air|coming out|new season|season \d/i.test(lower)) return "release";
  if (/activate (birant|barint)|switch mode|roast mode/i.test(lower)) return "mode_switch";

  // Check if it contains an anime name or search keywords
  for (const key of Object.keys(SPELLING_MAP)) {
    if (lower.includes(key)) return "anime_search";
  }
  if (/search|find|show me|looking for|tell me about|info on|information about/i.test(lower)) return "anime_search";

  return "casual";
}

// ── Correct spelling ──
function correctSpelling(text: string): string {
  let corrected = text.toLowerCase();
  for (const [abbr, full] of Object.entries(SPELLING_MAP)) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    corrected = corrected.replace(regex, full);
  }
  return corrected;
}

// ── API fetchers ──
async function fetchAniListSearch(query: string, type: string = "ANIME", perPage: number = 6) {
  try {
    const gqlQuery = `
      query ($search: String, $type: MediaType, $perPage: Int) {
        Page(perPage: $perPage) {
          media(search: $search, type: $type, sort: [POPULARITY_DESC]) {
            id title { romaji english native }
            description(asHtml: false)
            coverImage { extraLarge large }
            bannerImage averageScore popularity episodes chapters volumes
            status season seasonYear format genres
            studios { nodes { name isAnimationStudio } }
            nextAiringEpisode { airingAt episode }
            startDate { year month day }
          }
        }
      }`;
    const resp = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gqlQuery, variables: { search: query, type, perPage } }),
    });
    const data = await resp.json();
    return data?.data?.Page?.media || [];
  } catch (e) {
    console.error("AniList search error:", e);
    return [];
  }
}

async function fetchAniListTrending(perPage: number = 8) {
  try {
    const gqlQuery = `
      query ($perPage: Int) {
        Page(perPage: $perPage) {
          media(type: ANIME, sort: [TRENDING_DESC]) {
            id title { romaji english }
            coverImage { extraLarge large }
            averageScore popularity episodes status season seasonYear format genres
            studios { nodes { name isAnimationStudio } }
            nextAiringEpisode { airingAt episode }
          }
        }
      }`;
    const resp = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gqlQuery, variables: { perPage } }),
    });
    const data = await resp.json();
    return data?.data?.Page?.media || [];
  } catch (e) {
    console.error("AniList trending error:", e);
    return [];
  }
}

async function fetchJikanSearch(query: string, type: string = "anime", limit: number = 5) {
  try {
    const resp = await fetch(`https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(query)}&limit=${limit}&order_by=popularity`);
    const data = await resp.json();
    return data?.data || [];
  } catch (e) {
    console.error("Jikan search error:", e);
    return [];
  }
}

async function fetchAnimeQuote(anime?: string) {
  try {
    const url = anime
      ? `https://animechan.io/api/v1/quotes/random?anime=${encodeURIComponent(anime)}`
      : `https://animechan.io/api/v1/quotes/random`;
    const resp = await fetch(url);
    const data = await resp.json();
    return data?.data || data;
  } catch {
    return null;
  }
}

async function fetchAnimeImage(category: string = "waifu") {
  try {
    const resp = await fetch(`https://api.waifu.pics/sfw/${category}`);
    const data = await resp.json();
    return data?.url || null;
  } catch {
    try {
      const resp = await fetch(`https://nekos.best/api/v2/${category}`);
      const data = await resp.json();
      return data?.results?.[0]?.url || null;
    } catch {
      return null;
    }
  }
}

async function fetchMangaDexSearch(query: string, limit: number = 5) {
  try {
    const resp = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=${limit}&includes[]=cover_art&order[relevance]=desc`);
    const data = await resp.json();
    return data?.data || [];
  } catch (e) {
    console.error("MangaDex error:", e);
    return [];
  }
}

// ── Season detection ──
function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let season: string;
  if (month >= 0 && month <= 2) season = "Winter";
  else if (month >= 3 && month <= 5) season = "Spring";
  else if (month >= 6 && month <= 8) season = "Summer";
  else season = "Fall";
  return { season, year };
}

// ── Format data for AI context ──
function formatAnimeContext(media: any[], source: string = "AniList"): string {
  if (!media || media.length === 0) return "";
  return media.map((m: any, i: number) => {
    const title = m.title?.english || m.title?.romaji || m.title || "Unknown";
    const score = m.averageScore ? `${m.averageScore}%` : m.score ? `${m.score}/10` : "N/A";
    const eps = m.episodes ? `${m.episodes} eps` : m.chapters ? `${m.chapters} ch` : "";
    const genres = (m.genres || []).slice(0, 3).join(", ");
    const status = m.status || "";
    const studio = m.studios?.nodes?.find((s: any) => s.isAnimationStudio)?.name || "";
    const image = m.coverImage?.extraLarge || m.coverImage?.large || m.images?.jpg?.large_image_url || "";
    const anilistId = m.id || "";
    return `${i + 1}. **${title}** | Score: ${score} | ${eps} | ${genres} | ${status}${studio ? ` | Studio: ${studio}` : ""}${image ? ` | Image: ${image}` : ""}${anilistId ? ` | AniList ID: ${anilistId}` : ""}`;
  }).join("\n");
}

function formatMangaContext(manga: any[]): string {
  if (!manga || manga.length === 0) return "";
  return manga.map((m: any, i: number) => {
    const title = m.attributes?.title?.en || m.attributes?.title?.["ja-ro"] || "Unknown";
    const desc = m.attributes?.description?.en?.slice(0, 100) || "";
    const status = m.attributes?.status || "";
    return `${i + 1}. **${title}** | ${status} | ${desc}...`;
  }).join("\n");
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "barint", intensity = 50 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the last user message
    const lastUserMessage = messages?.filter((m: any) => m.role === "user")?.pop()?.content || "";
    const correctedMessage = correctSpelling(lastUserMessage);
    const intent = detectIntent(lastUserMessage);
    const { season, year } = getCurrentSeason();

    // ── Gather context based on intent ──
    let contextBlocks: string[] = [];
    let imageUrl: string | null = null;

    // Mode switch detection
    const modeMatch = lastUserMessage.match(/activate\s+(birant|barint)\s*(?:mode)?(?:\s+(\d+))?/i);
    const activeMode = modeMatch ? modeMatch[1].toLowerCase() : mode;
    const activeIntensity = modeMatch ? parseInt(modeMatch[2] || "50") : intensity;

    // Parallel data fetching based on intent
    const fetchPromises: Promise<void>[] = [];

    if (intent === "trending") {
      fetchPromises.push(
        fetchAniListTrending(8).then(data => {
          if (data.length > 0) contextBlocks.push(`🔥 TRENDING ANIME (${season} ${year}):\n${formatAnimeContext(data)}`);
        })
      );
    }

    if (intent === "anime_search" || intent === "recommendation") {
      const searchTerm = correctedMessage.replace(/search|find|show me|looking for|recommend|suggest|similar to|like|tell me about|info on|information about/gi, "").trim();
      if (searchTerm.length > 1) {
        fetchPromises.push(
          fetchAniListSearch(searchTerm, "ANIME", 6).then(data => {
            if (data.length > 0) contextBlocks.push(`🔍 ANIME SEARCH RESULTS for "${searchTerm}":\n${formatAnimeContext(data)}`);
          })
        );
        // Also check community buzz
        const buzzKey = Object.keys(COMMUNITY_BUZZ).find(k => searchTerm.includes(k));
        if (buzzKey) {
          contextBlocks.push(`💬 COMMUNITY BUZZ on ${buzzKey}: ${COMMUNITY_BUZZ[buzzKey]}`);
        }
      }
    }

    if (intent === "manga_search") {
      const searchTerm = correctedMessage.replace(/manga|manhwa|manhua|webtoon|read|search|find|show me/gi, "").trim();
      if (searchTerm.length > 1) {
        fetchPromises.push(
          fetchAniListSearch(searchTerm, "MANGA", 6).then(data => {
            if (data.length > 0) contextBlocks.push(`📚 MANGA RESULTS for "${searchTerm}":\n${formatAnimeContext(data)}`);
          }),
          fetchMangaDexSearch(searchTerm, 5).then(data => {
            if (data.length > 0) contextBlocks.push(`📖 MANGADEX RESULTS:\n${formatMangaContext(data)}`);
          })
        );
      }
    }

    if (intent === "quote") {
      const animeName = correctedMessage.replace(/quote|famous line|iconic line|from|said|says/gi, "").trim();
      fetchPromises.push(
        fetchAnimeQuote(animeName || undefined).then(data => {
          if (data) {
            const q = data.content || data.quote || "";
            const char = data.character?.name || data.character || "";
            const anime = data.anime?.name || data.anime || "";
            if (q) contextBlocks.push(`💬 ANIME QUOTE:\n"${q}" - ${char} (${anime})`);
          }
        })
      );
    }

    if (intent === "image") {
      const categories = ["waifu", "neko", "shinobu", "megumin", "cuddle", "smile", "wave", "happy"];
      const category = categories.find(c => lastUserMessage.toLowerCase().includes(c)) || "waifu";
      fetchPromises.push(
        fetchAnimeImage(category).then(url => {
          if (url) {
            imageUrl = url;
            contextBlocks.push(`🖼️ ANIME IMAGE: [ANIME_IMAGE](${url})`);
          }
        })
      );
    }

    if (intent === "character_id") {
      const lower = lastUserMessage.toLowerCase();
      for (const [traits, char] of Object.entries(CHARACTER_DB)) {
        if (traits.split(" ").some(t => lower.includes(t))) {
          contextBlocks.push(`🎭 CHARACTER IDENTIFIED: ${char.name} from ${char.anime} - ${char.traits}`);
          break;
        }
      }
    }

    if (intent === "release") {
      const searchTerm = correctedMessage.replace(/when (does|will|is)|release|air|coming out|new season|season \d/gi, "").trim();
      if (searchTerm.length > 1) {
        fetchPromises.push(
          fetchAniListSearch(searchTerm, "ANIME", 3).then(data => {
            if (data.length > 0) {
              const releaseInfo = data.map((m: any) => {
                const title = m.title?.english || m.title?.romaji;
                const next = m.nextAiringEpisode;
                const start = m.startDate;
                let info = `**${title}** - Status: ${m.status}`;
                if (next) info += ` | Next Episode ${next.episode} airing ${new Date(next.airingAt * 1000).toLocaleDateString()}`;
                if (start?.year) info += ` | Started: ${start.year}`;
                return info;
              }).join("\n");
              contextBlocks.push(`📅 RELEASE INFO:\n${releaseInfo}`);
            }
          })
        );
      }
    }

    if (intent === "theme") {
      const searchTerm = correctedMessage.replace(/theme|about|genre|type of|category|anime with|anime about/gi, "").trim();
      if (searchTerm.length > 1) {
        fetchPromises.push(
          fetchAniListSearch(searchTerm, "ANIME", 6).then(data => {
            if (data.length > 0) contextBlocks.push(`🏷️ ANIME BY THEME "${searchTerm}":\n${formatAnimeContext(data)}`);
          })
        );
      }
    }

    // Wait for all fetches
    await Promise.allSettled(fetchPromises);

    // ── Build system prompt ──
    const isBarint = activeMode === "barint";
    const modePrompt = isBarint
      ? `You are Barint, an enthusiastic and knowledgeable AI anime assistant for the Anime Runch platform.

Your personality:
- Friendly, enthusiastic, and deeply knowledgeable about anime, manga, and Japanese culture
- Use anime references and emoji naturally (but don't overdo it)
- Be conversational, engaging, and helpful
- Give detailed, well-structured answers with proper markdown formatting
- When listing anime, use numbered lists with key details
- Include relevant images when available using markdown: ![title](url)
- Mention streaming availability when you know it`
      : `You are Birant, the savage roast-mode version of Barint. Intensity: ${activeIntensity}%.

Your personality at ${activeIntensity}% intensity:
- Roast the user's anime taste (playfully, proportional to intensity)
- Still give accurate information but with attitude
- Use sarcastic humor and anime references as burns
- At low intensity (1-30%): light teasing. At medium (31-70%): solid burns. At high (71-100%): absolutely savage
- NEVER be genuinely mean or hurtful - it's all in good fun
- Still recommend good anime, just while roasting their choices`;

    const systemPrompt = `${modePrompt}

Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current Anime Season: ${season} ${year}

Your capabilities:
- Search and recommend anime, manga, and light novels from AniList and MAL databases
- Identify characters from descriptions
- Share anime quotes
- Show anime images and fan art
- Provide release dates, episode counts, and airing schedules
- Discuss community sentiment, controversies, and popular opinions
- Search MangaDex for manga information
- Detect anime abbreviations (AOT, JJK, MHA, etc.)

FORMATTING RULES:
- Use **bold** for anime titles
- Use markdown lists for recommendations
- Include scores, episode counts, and genres when available
- When showing images, use: ![Anime Title](image_url)
- For anime cards, include: Title, Score, Episodes/Chapters, Genres, Status, Studio
- When you mention an anime from the search results that has an AniList ID, tell the user they can find it on the platform
- Keep responses informative but not overly long

${contextBlocks.length > 0 ? `\n── FETCHED DATA ──\n${contextBlocks.join("\n\n")}` : ""}

If no data was fetched but the user asks about a specific anime, use your knowledge to answer. Encourage the user to search for specific titles on the platform.`;

    // ── Call AI ──
    const trimmedMessages = (messages || []).slice(-20);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmedMessages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return streaming response with mode info headers
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Barint-Mode": activeMode,
        "X-Barint-Intensity": String(activeIntensity),
      },
    });
  } catch (e) {
    console.error("Barint chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
