import { CacheEntry, CacheStats } from '../types';
import { INITIAL_CACHE_ENTRIES } from '../data/mockData';

const CACHE_STORAGE_KEY = 'noa_logistics_cache_db_v1';
const STATS_STORAGE_KEY = 'noa_logistics_cache_stats_v1';

function normalizeHebrewQuery(query: string): string {
  return query
    .trim()
    .replace(/[?,.!"']/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export class LogisticsCacheEngine {
  private cacheList: CacheEntry[] = [];
  private stats: CacheStats = {
    totalHits: 61,
    totalTokensSaved: 36050,
    totalApiCallsSaved: 61,
    estimatedEnergySavedWh: 12.2,
    cacheHitRatioPercent: 74,
  };

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const saved = localStorage.getItem(CACHE_STORAGE_KEY);
      if (saved) {
        this.cacheList = JSON.parse(saved);
      } else {
        this.cacheList = [...INITIAL_CACHE_ENTRIES];
        this.saveCache();
      }

      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) {
        this.stats = JSON.parse(savedStats);
      }
    } catch {
      this.cacheList = [...INITIAL_CACHE_ENTRIES];
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.cacheList));
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Storage fallback
    }
  }

  public findInCache(userQuery: string): CacheEntry | null {
    const norm = normalizeHebrewQuery(userQuery);
    if (!norm) return null;

    // Check exact or partial intent matches
    const matched = this.cacheList.find((entry) => {
      const entryKeyNorm = normalizeHebrewQuery(entry.queryKey);
      if (norm === entryKeyNorm) return true;
      if (norm.includes('אותה הזמנה') && entryKeyNorm.includes('אותה הזמנה')) return true;
      if (norm.includes('פקדונ') && entryKeyNorm.includes('פקדונ')) return true;
      if (norm.includes('דבק 114') && entryKeyNorm.includes('דבק 114')) return true;
      if (norm.includes('שבוע שעבר') && entryKeyNorm.includes('שבוע שעבר')) return true;
      return false;
    });

    if (matched) {
      // Record Hit
      matched.hitCount += 1;
      matched.tokensSavedCount += 600;
      matched.lastUsed = new Date().toISOString().replace('T', ' ').substring(0, 16);

      this.stats.totalHits += 1;
      this.stats.totalTokensSaved += 600;
      this.stats.totalApiCallsSaved += 1;
      this.stats.estimatedEnergySavedWh = parseFloat((this.stats.totalApiCallsSaved * 0.2).toFixed(1));
      this.saveCache();
      return matched;
    }

    return null;
  }

  public getCacheList(): CacheEntry[] {
    return this.cacheList;
  }

  public getStats(): CacheStats {
    return this.stats;
  }

  public addCacheEntry(queryKey: string, category: string, responseHtml: string): CacheEntry {
    const newEntry: CacheEntry = {
      id: `cache-${Date.now()}`,
      queryKey,
      category,
      responseHtml,
      hitCount: 1,
      tokensSavedCount: 600,
      lastUsed: new Date().toISOString().replace('T', ' ').substring(0, 16),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    this.cacheList.unshift(newEntry);
    this.saveCache();
    return newEntry;
  }

  public deleteCacheEntry(id: string) {
    this.cacheList = this.cacheList.filter((item) => item.id !== id);
    this.saveCache();
  }

  public clearAllCache() {
    this.cacheList = [];
    this.saveCache();
  }
}

export const globalCacheEngine = new LogisticsCacheEngine();
