// هر دنیا: ۳ مرحله‌ی معمولی (جمع‌کردن ستاره) + ۱ مرحله‌ی برج (صعود عمودی، مرحله‌ی نهایی دنیا)

function buildNormalLevels(count, baseBombSpeed, baseBombCount, starBounce) {
    const levels = [];
    for (let i = 0; i < count; i++) {
        const difficulty = 1 + i * 0.25;
        levels.push({
            type: 'normal',
            bombSpeedRange: baseBombSpeed.map(v => Math.round(v * difficulty)),
            bombCount: baseBombCount + Math.floor(i / 2),
            starBounce
        });
    }
    return levels;
}

function buildTowerLevel(floors, bombSpeed) {
    return {
        type: 'tower',
        floors,
        bombSpeedRange: bombSpeed
    };
}

export const WORLDS = [
    {
        id: 'sea',
        name: 'دریا و کشتی',
        icon: '🌊',
        color: 0x1e88e5,
        bgKey: 'bg_sea',
        musicKey: 'music_sea',
        platformKey: 'platform_ship',
        locked: false,
        levels: [
            ...buildNormalLevels(3, [-150, 150], 1, [0.4, 0.8]),
            buildTowerLevel(20, [-120, 120])
        ]
    },
    {
        id: 'jungle',
        name: 'جنگل',
        icon: '🌴',
        color: 0x43a047,
        bgKey: 'bg_jungle',
        musicKey: 'music_jungle',
        platformKey: 'platform_jungle',
        locked: false,
        levels: [
            ...buildNormalLevels(3, [-190, 190], 1, [0.35, 0.75]),
            buildTowerLevel(20, [-150, 150])
        ]
    },
    {
        id: 'cave',
        name: 'غار',
        icon: '🕳️',
        color: 0x5c6bc0,
        locked: true,
        levels: [
            ...buildNormalLevels(3, [-220, 220], 2, [0.3, 0.7]),
            buildTowerLevel(20, [-180, 180])
        ]
    },
    {
        id: 'magma',
        name: 'ماگما',
        icon: '🌋',
        color: 0xe64a19,
        locked: true,
        levels: [
            ...buildNormalLevels(3, [-260, 260], 2, [0.3, 0.9]),
            buildTowerLevel(20, [-210, 210])
        ]
    },
    {
        id: 'mountain',
        name: 'قله‌ی کوه',
        icon: '⛰️',
        color: 0x78909c,
        locked: true,
        levels: [
            ...buildNormalLevels(3, [-300, 300], 3, [0.3, 0.9]),
            buildTowerLevel(20, [-240, 240])
        ]
    }
];

export function getWorld(worldId) {
    return WORLDS.find(w => w.id === worldId);
}

export function getWorldIndex(worldId) {
    return WORLDS.findIndex(w => w.id === worldId);
}

export function getNextLevelRef(worldId, levelIdx) {
    const world = getWorld(worldId);
    if (levelIdx + 1 < world.levels.length) {
        return { worldId, levelIdx: levelIdx + 1 };
    }
    const worldIndex = getWorldIndex(worldId);
    const nextWorld = WORLDS[worldIndex + 1];
    if (nextWorld && !nextWorld.locked) {
        return { worldId: nextWorld.id, levelIdx: 0 };
    }
    return null;
}
