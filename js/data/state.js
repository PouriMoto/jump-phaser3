// مدیریت داده‌های ماندگار بازی (localStorage): اسکین، سکه، استریک روزانه، آمار دستاوردها، پیشرفت مراحل

import { WORLDS } from './worlds.js';
import { FREE_SKIN_KEYS } from './skins.js';

const STORAGE_KEY = 'phaser_platformer_save_v3';

function todayStr() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(a, b) {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function buildDefaultProgress() {
    const progress = {};
    WORLDS.forEach((world, wIndex) => {
        progress[world.id] = world.levels.map((_, lIndex) => ({
            unlocked: wIndex === 0 && lIndex === 0,
            stars: 0
        }));
    });
    return progress;
}

const DEFAULT_STATE = {
    selectedSkin: 'dude_red',
    ownedSkins: [...FREE_SKIN_KEYS],
    highScore: 0,
    musicOn: true,
    sfxOn: true,
    coins: 0,
    streak: 0,
    lastPlayedDate: null,
    stats: {
        totalStarsCollected: 0,
        totalCoinsEarned: 0,
        levelsCompleted: 0,
        perfectLevels: 0,
        towersCompleted: 0,
        bestStreak: 0
    },
    progress: buildDefaultProgress()
};

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return structuredCloneSafe(DEFAULT_STATE);
        const parsed = JSON.parse(raw);

        const mergedProgress = buildDefaultProgress();
        Object.keys(parsed.progress || {}).forEach(worldId => {
            if (mergedProgress[worldId]) {
                parsed.progress[worldId].forEach((lvl, i) => {
                    if (mergedProgress[worldId][i]) mergedProgress[worldId][i] = lvl;
                });
            }
        });

        return {
            ...structuredCloneSafe(DEFAULT_STATE),
            ...parsed,
            stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
            ownedSkins: parsed.ownedSkins && parsed.ownedSkins.length ? parsed.ownedSkins : [...FREE_SKIN_KEYS],
            progress: mergedProgress
        };
    } catch (e) {
        return structuredCloneSafe(DEFAULT_STATE);
    }
}

function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        // localStorage در دسترس نیست — نادیده می‌گیریم
    }
}

export const GameState = {
    data: load(),

    // ---- اسکین ----
    getSkin() {
        return this.data.selectedSkin;
    },
    setSkin(skinKey) {
        if (!this.isSkinOwned(skinKey)) return false;
        this.data.selectedSkin = skinKey;
        save(this.data);
        return true;
    },
    isSkinOwned(skinKey) {
        return this.data.ownedSkins.includes(skinKey);
    },
    buySkin(skinKey, price) {
        if (this.isSkinOwned(skinKey)) return true;
        if (this.data.coins < price) return false;
        this.data.coins -= price;
        this.data.ownedSkins.push(skinKey);
        save(this.data);
        return true;
    },

    // ---- امتیاز و سکه ----
    getHighScore() {
        return this.data.highScore;
    },
    updateHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = score;
            save(this.data);
            return true;
        }
        return false;
    },
    getCoins() {
        return this.data.coins;
    },
    addCoins(amount) {
        this.data.coins += amount;
        this.data.stats.totalCoinsEarned += amount;
        save(this.data);
    },

    // ---- صدا ----
    isMusicOn() {
        return this.data.musicOn;
    },
    toggleMusic() {
        this.data.musicOn = !this.data.musicOn;
        save(this.data);
        return this.data.musicOn;
    },
    isSfxOn() {
        return this.data.sfxOn;
    },
    toggleSfx() {
        this.data.sfxOn = !this.data.sfxOn;
        save(this.data);
        return this.data.sfxOn;
    },

    // ---- پیشرفت مراحل ----
    getLevelProgress(worldId, levelIdx) {
        return this.data.progress[worldId]?.[levelIdx] || { unlocked: false, stars: 0 };
    },
    completeLevel(worldId, levelIdx, starsEarned, nextRef, { isTower } = {}) {
        const levelProgress = this.data.progress[worldId][levelIdx];
        const firstTimeCompleting = levelProgress.stars === 0;

        levelProgress.stars = Math.max(levelProgress.stars, starsEarned);
        levelProgress.unlocked = true;

        if (nextRef) {
            this.data.progress[nextRef.worldId][nextRef.levelIdx].unlocked = true;
        }

        if (firstTimeCompleting) {
            this.data.stats.levelsCompleted += 1;
            if (starsEarned >= 3) this.data.stats.perfectLevels += 1;
            if (isTower) this.data.stats.towersCompleted += 1;
        }
        save(this.data);
    },

    // ---- آمار برای دستاوردها ----
    recordStarCollected(value) {
        this.data.stats.totalStarsCollected += 1;
        this.addCoins(value);
    },
    getStats() {
        return this.data.stats;
    },

    // ---- استریک و جایزه‌ی روزانه ----
    // برمی‌گرداند: { isNewDay, streak, rewardCoins } — rewardCoins فقط اگر روز جدید باشد صفر نیست
    recordDailyLogin() {
        const today = todayStr();
        const last = this.data.lastPlayedDate;

        if (last === today) {
            return { isNewDay: false, streak: this.data.streak, rewardCoins: 0 };
        }

        if (last === null) {
            this.data.streak = 1;
        } else {
            const diff = daysBetween(last, today);
            this.data.streak = diff === 1 ? this.data.streak + 1 : 1;
        }

        this.data.lastPlayedDate = today;
        this.data.stats.bestStreak = Math.max(this.data.stats.bestStreak, this.data.streak);

        const rewardCoins = 10 + Math.min(this.data.streak, 10) * 5; // پاداش بیشتر برای استریک بلندتر
        this.data.coins += rewardCoins;
        this.data.stats.totalCoinsEarned += rewardCoins;

        save(this.data);
        return { isNewDay: true, streak: this.data.streak, rewardCoins };
    },
    getStreak() {
        return this.data.streak;
    }
};
