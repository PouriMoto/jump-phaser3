// دستاوردها بر اساس آمار کلی بازی محاسبه می‌شوند (نه یک فلگ جدا که ممکنه دیرگردن)

export const ACHIEVEMENTS = [
    {
        id: 'star_collector',
        icon: '⭐',
        label: 'ستاره‌جمع‌کن',
        description: '۵۰ ستاره در کل بازی جمع کن',
        check: (stats) => stats.totalStarsCollected >= 50,
        progress: (stats) => Math.min(1, stats.totalStarsCollected / 50)
    },
    {
        id: 'perfectionist',
        icon: '🌟',
        label: 'قهرمان بی‌نقص',
        description: '۵ مرحله را با ۳ ستاره کامل کن',
        check: (stats) => stats.perfectLevels >= 5,
        progress: (stats) => Math.min(1, stats.perfectLevels / 5)
    },
    {
        id: 'tower_conqueror',
        icon: '🏰',
        label: 'فاتح برج',
        description: 'حداقل یک برج را فتح کن',
        check: (stats) => stats.towersCompleted >= 1,
        progress: (stats) => Math.min(1, stats.towersCompleted / 1)
    },
    {
        id: 'explorer',
        icon: '🗺️',
        label: 'کاوشگر',
        description: 'همه‌ی مراحل موجود را تکمیل کن',
        check: (stats) => stats.levelsCompleted >= 8,
        progress: (stats) => Math.min(1, stats.levelsCompleted / 8)
    },
    {
        id: 'consistent',
        icon: '🔥',
        label: 'پایدار',
        description: '۳ روز متوالی بازی کن',
        check: (stats) => stats.bestStreak >= 3,
        progress: (stats) => Math.min(1, stats.bestStreak / 3)
    },
    {
        id: 'coin_collector',
        icon: '🪙',
        label: 'میلیونر کوچک',
        description: 'در کل ۵۰۰ سکه به‌دست بیاور',
        check: (stats) => stats.totalCoinsEarned >= 500,
        progress: (stats) => Math.min(1, stats.totalCoinsEarned / 500)
    }
];
