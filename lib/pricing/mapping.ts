// Map Pokemon set names to TCGPlayer group IDs
export const SET_TO_GROUP_ID_MAP: Record<string, number> = {
  // Recent Scarlet & Violet Era (with alternate names)
  'ME01: Mega Evolution': 24380,
  'SV: Black Bolt': 24325,
  'SV: White Flare': 24326,
  'SV10: Destined Rivals': 24269,
  'Destined Rivals': 24269, // Add alternate
  'SV09: Journey Together': 24073,
  'Journey Together': 24073, // Add alternate
  "McDonald's Promos 2024": 24163,
  'SV: Prismatic Evolutions': 23821,
  'Prismatic Evolutions': 23821, // Add alternate
  'SV08: Surging Sparks': 23651,
  'Surging Sparks': 23651, // Add alternate
  'SV07: Stellar Crown': 23537,
  'Stellar Crown': 23537, // Add alternate
  'Trick or Trade BOOster Bundle 2024': 23561,
  'SV: Shrouded Fable': 23529,
  'Shrouded Fable': 23529, // Add alternate
  'Battle Academy 2024': 23520,
  'SV06: Twilight Masquerade': 23473,
  'Twilight Masquerade': 23473, // Add alternate
  'SV05: Temporal Forces': 23381,
  'Temporal Forces': 23381, // Add alternate
  'SV: Paldean Fates': 23353,
  'Paldean Fates': 23353, // Add alternate
  'Trading Card Game Classic': 23323,
  'SV04: Paradox Rift': 23286,
  'Paradox Rift': 23286, // Add alternate
  'My First Battle': 23330,
  'SV: Scarlet & Violet 151': 23237,
  '151': 23237, // Add alternate
  "McDonald's Promos 2023": 23306,
  'Trick or Trade BOOster Bundle 2023': 23266,
  'SV03: Obsidian Flames': 23228,
  'Obsidian Flames': 23228, // Add alternate
  'SV02: Paldea Evolved': 23120,
  'Paldea Evolved': 23120, // Add alternate
  'SV: Scarlet & Violet Promo Cards': 22872,
  'Scarlet & Violet Black Star Promos': 22872, // Add alternate
  'SV01: Scarlet & Violet Base Set': 22873,
  'Scarlet & Violet': 22873, // Add alternate
  'SVE: Scarlet & Violet Energies': 24382,
  'Scarlet & Violet Energies': 24382, // Add alternate

  // Sword & Shield Era
  'Crown Zenith': 17688,
  'Crown Zenith: Galarian Gallery': 17689,
  'Crown Zenith Galarian Gallery': 17689, // Add alternate
  'Prize Pack Series Cards': 22880,
  'SWSH12: Silver Tempest': 3170,
  'Silver Tempest': 3170, // Add alternate
  'SWSH12: Silver Tempest Trainer Gallery': 17674,
  'Silver Tempest Trainer Gallery': 17674, // Add alternate
  'SWSH11: Lost Origin': 3118,
  'Lost Origin': 3118, // Add alternate
  'SWSH11: Lost Origin Trainer Gallery': 3172,
  'Lost Origin Trainer Gallery': 3172, // Add alternate
  'Trick or Trade BOOster Bundle': 3179,
  "McDonald's Promos 2022": 3150,
  "McDonald's Collection 2022": 3150, // Add alternate
  'Pokemon GO': 3064,
  'Pokémon GO': 3064, // Add alternate
  'SWSH10: Astral Radiance': 3040,
  'Astral Radiance': 3040, // Add alternate
  'SWSH10: Astral Radiance Trainer Gallery': 3068,
  'Astral Radiance Trainer Gallery': 3068, // Add alternate
  'Battle Academy 2022': 3051,
  'SWSH09: Brilliant Stars': 2948,
  'Brilliant Stars': 2948, // Add alternate
  'SWSH09: Brilliant Stars Trainer Gallery': 3020,
  'Brilliant Stars Trainer Gallery': 3020, // Add alternate
  'SWSH08: Fusion Strike': 2906,
  'Fusion Strike': 2906, // Add alternate
  Celebrations: 2867,
  'Celebrations: Classic Collection': 2931,
  'SWSH07: Evolving Skies': 2848,
  'Evolving Skies': 2848, // Add alternate
  'SWSH06: Chilling Reign': 2807,
  'Chilling Reign': 2807, // Add alternate
  'SWSH05: Battle Styles': 2765,
  'Battle Styles': 2765, // Add alternate
  'First Partner Pack': 2776,
  'Shining Fates': 2754,
  'Shining Fates: Shiny Vault': 2781,
  'Shining Fates Shiny Vault': 2781, // Add alternate
  "McDonald's 25th Anniversary Promos": 2782,
  "McDonald's Collection 2021": 2782, // Add alternate
  'SWSH04: Vivid Voltage': 2701,
  'Vivid Voltage': 2701, // Add alternate
  "Champion's Path": 2685,
  'SWSH03: Darkness Ablaze': 2675,
  'Darkness Ablaze': 2675, // Add alternate
  'Battle Academy': 2686,
  'SWSH02: Rebel Clash': 2626,
  'Rebel Clash': 2626, // Add alternate
  'SWSH01: Sword & Shield Base Set': 2585,
  'Sword & Shield': 2585, // Add alternate
  'SWSH: Sword & Shield Promo Cards': 2545,
  'SWSH Black Star Promos': 2545, // Add alternate

  // Sun & Moon Era
  'SM - Cosmic Eclipse': 2534,
  'Cosmic Eclipse': 2534, // Add alternate
  "McDonald's Promos 2019": 2555,
  "McDonald's Collection 2019": 2555, // Add alternate
  'Hidden Fates': 2480,
  'Hidden Fates: Shiny Vault': 2594,
  'Hidden Fates Shiny Vault': 2594, // Add alternate
  'SM - Unified Minds': 2464,
  'Unified Minds': 2464, // Add alternate
  'SM - Unbroken Bonds': 2420,
  'Unbroken Bonds': 2420, // Add alternate
  'Detective Pikachu': 2409,
  'SM - Team Up': 2377,
  'Team Up': 2377, // Add alternate
  'SM - Lost Thunder': 2328,
  'Lost Thunder': 2328, // Add alternate
  "McDonald's Promos 2018": 2364,
  "McDonald's Collection 2018": 2364, // Add alternate
  'Miscellaneous Cards & Products': 2374,
  'Dragon Majesty': 2295,
  'SM - Celestial Storm': 2278,
  'Celestial Storm': 2278, // Add alternate
  'World Championship Decks': 2282,
  'SM - Forbidden Light': 2209,
  'Forbidden Light': 2209, // Add alternate
  'SM Trainer Kit: Alolan Sandslash & Alolan Ninetales': 2208,
  'SM - Ultra Prism': 2178,
  'Ultra Prism': 2178, // Add alternate
  "McDonald's Promos 2017": 2148,
  "McDonald's Collection 2017": 2148, // Add alternate
  'SM - Crimson Invasion': 2071,
  'Crimson Invasion': 2071, // Add alternate
  'Shining Legends': 2054,
  'SM - Burning Shadows': 1957,
  'Burning Shadows': 1957, // Add alternate
  'Alternate Art Promos': 1938,
  'SM - Guardians Rising': 1919,
  'Guardians Rising': 1919, // Add alternate
  'Ash vs Team Rocket Deck Kit (JP Exclusive)': 23095,
  'SM Trainer Kit: Lycanroc & Alolan Raichu': 2069,
  'SM Base Set': 1863,
  'Sun & Moon': 1863, // Add alternate
  'SM Promos': 1861,
  'SM Black Star Promos': 1861, // Add alternate

  // XY Era
  'XY - Evolutions': 1842,
  Evolutions: 1842, // Add alternate
  'Deck Exclusives': 1840,
  "McDonald's Promos 2016": 3087,
  "McDonald's Collection 2016": 3087, // Add alternate
  'XY - Steam Siege': 1815,
  'Steam Siege': 1815, // Add alternate
  'League & Championship Cards': 1539,
  'XY - Fates Collide': 1780,
  'Fates Collide': 1780, // Add alternate
  'XY Trainer Kit: Pikachu Libre & Suicune': 1796,
  Generations: 1728,
  'Generations: Radiant Collection': 1729,
  'XY - BREAKpoint': 1701,
  BREAKpoint: 1701, // Add alternate
  "McDonald's Promos 2015": 1694,
  "McDonald's Collection 2015": 1694, // Add alternate
  'XY - BREAKthrough': 1661,
  BREAKthrough: 1661, // Add alternate
  'XY - Ancient Origins': 1576,
  'Ancient Origins': 1576, // Add alternate
  'XY - Roaring Skies': 1534,
  'Roaring Skies': 1534, // Add alternate
  'XY Trainer Kit: Latias & Latios': 1536,
  'Jumbo Cards': 1528,
  'Double Crisis': 1525,
  'XY - Primal Clash': 1509,
  'Primal Clash': 1509, // Add alternate
  'XY Trainer Kit: Bisharp & Wigglytuff': 1533,
  'XY - Phantom Forces': 1494,
  'Phantom Forces': 1494, // Add alternate
  'XY - Furious Fists': 1481,
  'Furious Fists': 1481, // Add alternate
  "McDonald's Promos 2014": 1692,
  "McDonald's Collection 2014": 1692, // Add alternate
  'XY - Flashfire': 1464,
  Flashfire: 1464, // Add alternate
  'XY Trainer Kit: Sylveon & Noivern': 1532,
  'XY Base Set': 1387,
  XY: 1387, // Add alternate
  'XY Promos': 1451,
  'XY Black Star Promos': 1451, // Add alternate
  'Kalos Starter Set': 1522,

  // Black & White Era
  'Legendary Treasures': 1409,
  'Legendary Treasures: Radiant Collection': 1465,
  'Plasma Blast': 1370,
  'Plasma Freeze': 1382,
  'Plasma Storm': 1413,
  'Boundaries Crossed': 1408,
  'Dragon Vault': 1426,
  'Dragons Exalted': 1394,
  "McDonald's Promos 2012": 1427,
  "McDonald's Collection 2012": 1427, // Add alternate
  'Dark Explorers': 1386,
  'Next Destinies': 1412,
  'Noble Victories': 1385,
  'BW Trainer Kit: Excadrill & Zoroark': 1538,
  'Emerging Powers': 1424,
  "McDonald's Promos 2011": 1401,
  "McDonald's Collection 2011": 1401, // Add alternate
  'Black and White': 1400,
  'Black & White': 1400, // Add alternate
  'Black and White Promos': 1407,
  'BW Black Star Promos': 1407, // Add alternate

  // HeartGold & SoulSilver Era
  'Call of Legends': 1415,
  'Professor Program Promos': 2332,
  Triumphant: 1381,
  'HS—Triumphant': 1381, // Add alternate
  Undaunted: 1403,
  'HS—Undaunted': 1403, // Add alternate
  'Pikachu World Collection Promos': 2205,
  'HGSS Trainer Kit: Gyarados & Raichu': 1540,
  Unleashed: 1399,
  'HS—Unleashed': 1399, // Add alternate
  'HeartGold SoulSilver': 1402,
  'HeartGold & SoulSilver': 1402, // Add alternate
  'HGSS Promos': 1453,
  'HGSS Black Star Promos': 1453, // Add alternate

  // Diamond & Pearl Era
  Rumble: 1433,
  'Pokémon Rumble': 1433, // Add alternate
  Arceus: 1391,
  'Supreme Victors': 1384,
  'Rising Rivals': 1367,
  'Burger King Promos': 2175,
  Platinum: 1406,
  Stormfront: 1369,
  'Countdown Calendar Promos': 2155,
  'Legends Awakened': 1417,
  'Majestic Dawn': 1390,
  'Great Encounters': 1405,
  'Secret Wonders': 1380,
  'DP Training Kit 1 Blue': 609,
  'DP Training Kit 1 Gold': 610,
  'DP Trainer Kit: Manaphy & Lucario': 1541,
  'Mysterious Treasures': 1368,
  'Diamond and Pearl': 1430,
  'Diamond & Pearl': 1430, // Add alternate
  'Diamond and Pearl Promos': 1421,
  'DP Black Star Promos': 1421, // Add alternate

  // EX Era
  'Power Keepers': 1383,
  'Dragon Frontiers': 1411,
  'Crystal Guardians': 1395,
  'Holon Phantoms': 1379,
  'Legend Maker': 1378,
  'Delta Species': 1429,
  'Unseen Forces': 1398,
  Emerald: 1410,
  Deoxys: 1404,
  'Team Rocket Returns': 1428,
  'EX Battle Stadium': 1853,
  'FireRed & LeafGreen': 1419,
  'Kids WB Promos': 2214,
  'Hidden Legends': 1416,
  'Team Magma vs Team Aqua': 1377,
  Dragon: 1376,
  Sandstorm: 1392,
  'Ruby and Sapphire': 1393,
  'Ruby & Sapphire': 1393, // Add alternate

  // e-Card Era
  Skyridge: 1372,
  Aquapolis: 1397,
  'Best of Promos': 1455,
  'Best of Game': 1455, // Add alternate
  Expedition: 1375,
  'Expedition Base Set': 1375, // Add alternate

  // Wizards Era
  'Legendary Collection': 1374,
  'Neo Destiny': 1444,
  'Neo Revelation': 1389,
  'Southern Islands': 648,
  'Neo Discovery': 1434,
  'Neo Genesis': 1396,
  'Gym Challenge': 1440,
  'Gym Heroes': 1441,
  'Team Rocket': 1373,
  'Base Set 2': 605,
  Fossil: 630,
  'WoTC Promo': 1418,
  'Wizards Black Star Promos': 1418, // Add alternate
  Jungle: 635,
  'Base Set': 604,
  Base: 604, // Add alternate
  'Base Set (Shadowless)': 1663,

  // Special Sets
  'Blister Exclusives': 2289,
  'EX Trainer Kit 1: Latias & Latios': 1543,
  'EX Trainer Kit Latias': 1543, // Add alternate
  'EX Trainer Kit 2: Plusle & Minun': 1542,
  'EX Trainer Kit 2 Plusle': 1542, // Add alternate
  'EX Trainer Kit 2 Minun': 1542, // Add alternate
  'Nintendo Promos': 1423,
  'Nintendo Black Star Promos': 1423, // Add alternate

  // POP Series
  'POP Series 1': 1422,
  'POP Series 2': 1447,
  'POP Series 3': 1442,
  'POP Series 4': 1452,
  'POP Series 5': 1439,
  'POP Series 6': 1432,
  'POP Series 7': 1414,
  'POP Series 8': 1450,
  'POP Series 9': 1446,

  // Special Collections
  'Pokémon Futsal Collection': 2374, // Map to Miscellaneous
};

// Helper functions remain the same
export async function fetchAllGroups() {
  const response = await fetch('https://tcgcsv.com/tcgplayer/3/groups');
  if (!response.ok) {
    throw new Error('Failed to fetch TCGPlayer groups');
  }
  return response.json();
}

export function getGroupIdForSet(setName: string): number | null {
  return SET_TO_GROUP_ID_MAP[setName] || null;
}

export function findGroupIdByPartialMatch(setName: string): number | null {
  const normalizedSetName = setName.toLowerCase().trim();

  for (const [mapSetName, groupId] of Object.entries(SET_TO_GROUP_ID_MAP)) {
    if (
      mapSetName.toLowerCase().includes(normalizedSetName) ||
      normalizedSetName.includes(mapSetName.toLowerCase())
    ) {
      return groupId;
    }
  }

  return null;
}
