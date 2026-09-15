// تعریف اسکین‌ها: هر کدام یک قابلیت واقعی روی گیم‌پلی دارد (نه فقط تغییر ظاهر)

export const SKINS = [
    {
        key: 'dude_red',
        label: 'قرمز',
        price: 0,
        ability: 'none',
        abilityLabel: 'بدون قابلیت ویژه'
    },
    {
        key: 'dude_blue',
        label: 'آبی',
        price: 0,
        ability: 'doubleJump',
        abilityLabel: 'پرش دوبل'
    },
    {
        key: 'dude_green',
        label: 'سبز',
        price: 0,
        ability: 'speedBoost',
        abilityLabel: 'سرعت +۲۰٪'
    },
    {
        key: 'dude_purple',
        label: 'مغناطیسی',
        price: 150,
        ability: 'magnet',
        abilityLabel: 'جذب ستاره از فاصله نزدیک'
    },
    {
        key: 'dude_gold',
        label: 'زرهی',
        price: 250,
        ability: 'shield',
        abilityLabel: 'یک ضربه‌ی رایگان از بمب در هر مرحله'
    }
];

export function getSkin(key) {
    return SKINS.find(s => s.key === key);
}

export const FREE_SKIN_KEYS = SKINS.filter(s => s.price === 0).map(s => s.key);
