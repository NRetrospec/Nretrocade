import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all games with search and filter
export const listGames = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    multiplayerOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      const searchTerm = args.search; // Narrow the type
      let searchQuery = ctx.db
        .query("games")
        .withSearchIndex("search_games", (q) => q.search("title", searchTerm));

      if (args.category) {
        const category = args.category; // Narrow the type
        searchQuery = searchQuery.filter((q) => q.eq(q.field("category"), category));
      }

      if (args.multiplayerOnly) {
        searchQuery = searchQuery.filter((q) => q.eq(q.field("isMultiplayer"), true));
      }

      return await searchQuery.take(50);
    }

    let query = ctx.db.query("games");

    if (args.category) {
      const category = args.category; // Narrow the type
      query = query.filter((q) => q.eq(q.field("category"), category));
    }

    if (args.multiplayerOnly) {
      query = query.filter((q) => q.eq(q.field("isMultiplayer"), true));
    }

    return await query.order("desc").take(50);
  },
});

// Get single game
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

// Seed some example games
export const seedGames = mutation({
  args: {},
  handler: async (ctx) => {
    const games = [
      {
        title: "Bloons Tower Defense",
        swfUrl: "https://phreshhhhh.github.io/BTD2/bloonstd2.swf",
        thumbnail: "/thumbnails/btd.jpg",
        description: "Strategic tower defense game",
        tags: ["Strategy", "Defense", "Popular"],
        isMultiplayer: false,
        category: "Strategy",
        difficulty: "Medium" as const,
        playCount: 0,
      },
      {
        title: "Club Penguin",
        swfUrl: "/games/clubpenguin.swf",
        thumbnail: "/thumbnails/clubpenguin.jpg",
        description: "Virtual world MMO",
        tags: ["MMO", "Social", "Adventure"],
        isMultiplayer: true,
        category: "Adventure",
        difficulty: "Easy" as const,
        playCount: 0,
      },
      {
        title: "Robot Unicorn",
        swfUrl: "/games/guitar.swf",
        thumbnail: "/thumbnails/guitar.jpg",
        description: "Rhythm guitar game",
        tags: ["Music", "Rhythm", "Skill"],
        isMultiplayer: false,
        category: "Music",
        difficulty: "Hard" as const,
        playCount: 0,
      },
      {
        title: "Sonny",
        swfUrl: "https://phreshhhhh.github.io/SONNY/sonny-505817f.swf",
        thumbnail: "/thumbnails/stickwar.jpg",
        description: "Strategy war game",
        tags: ["Strategy", "War", "Action"],
        isMultiplayer: false,
        category: "Strategy",
        difficulty: "Medium" as const,
        playCount: 0,
      },
      {
        title: "PPG Brawl",
        swfUrl: "https://phreshhhhh.github.io/PP-G/301661_ppg_newgrounds202c.swf",
        thumbnail: "/thumbnails/stickwar.jpg",
        description: "Fighting game",
        tags: ["Action"],
        isMultiplayer: false,
        category: "Action",
        difficulty: "Medium" as const,
        playCount: 0,
      },
      // Add more games here
      {
        title: "Pac-Man Platformer",
        swfUrl: "https://phreshhhhh.github.io/pacmanplatform/pacman%20Platformer",
        thumbnail: "https://i.postimg.cc/QdHCh2yd/Pacmanplatform-PIC.png",
        description: "Classic arcade maze game",
        tags: ["Arcade", "Classic", "Maze"],
        isMultiplayer: false,
        category: "Platform",
        difficulty: "Easy" as const,
        playCount: 0,
      },
      {
        title: "Tetris",
        swfUrl: "/games/tetris.swf",
        thumbnail: "/thumbnails/tetris.jpg",
        description: "Puzzle game of falling blocks",
        tags: ["Puzzle", "Classic", "Strategy"],
        isMultiplayer: false,
        category: "Puzzle",
        difficulty: "Medium" as const,
        playCount: 0,
      },
      {
        title: "Super Mario Bros",
        swfUrl: "/games/mario.swf",
        thumbnail: "/thumbnails/mario.jpg",
        description: "Platform adventure game",
        tags: ["Platform", "Adventure", "Classic"],
        isMultiplayer: false,
        category: "Adventure",
        difficulty: "Medium" as const,
        playCount: 0,
      },
    ];

    for (const game of games) {
      // Check if game already exists to avoid duplicates
      const existing = await ctx.db.query("games").filter(q => q.eq(q.field("title"), game.title)).take(1);
      if (existing.length === 0) {
        await ctx.db.insert("games", game);
      }
    }

    return "Games seeded successfully";
  },
});
