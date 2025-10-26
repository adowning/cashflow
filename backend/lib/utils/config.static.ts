export const THEME_OPTION = ['light', 'dark'];
export const TRANSACTION_TYPE = ['deposit', 'withdraw', 'bet', 'win', 'bonus'];
export const TRANSACTION_CATEGORY = ['payment', 'sport', 'casino'];
export const ROLE_OPTION = ['admin', 'user'];
export const STATUS_OPTION = ['active', 'blocked'];
export const DEPOSIT_STATUS_OPTION = ['pending', 'process', 'success', 'failed'];
export const WITHDRAW_STATUS_OPTION = ['pending', 'process', 'success', 'failed', 'payoutPending'];
export const AFFILIATE_ROLE = ['company', 'master', 'affiliate', 'subAffiliate'];
export const AFFILIATE_STATUS = ['active', 'disabled'];
// ------------------------GS CASINO------------------------
export const GAME_TYPE = [
    'SLOT',
    'LIVE_CASINO',
    'SPORT_BOOK',
    'VIRTUAL_SPORT',
    'LOTTERY',
    'QIPAI',
    'P2P',
    'FISHING',
    'COCK_FIGHTING',
    'BONUS',
    'ESPORT',
    'POKER',
    'OTHERS',
    'LIVE_CASINO_PREMIUM'
];

export const GS_CURRENCY_RATIO = {
    PYG2: 1000,
    COP2: 1000,
    IDR2: 1000,
    IRR2: 1000,
    KHR2: 1000,
    KRW2: 1000,
    LAK2: 1000,
    LBP2: 1000,
    MMK2: 1000,
    UZS2: 1000,
    VND2: 1000,
    MMK3: 100
};

export const GS_CURRENCY = [
    'AED',
    'AMD',
    'AOA',
    'ARS',
    'AUD',
    'AZN',
    'BDT',
    'BGN',
    'BND',
    'BRL',
    'CAD',
    'CHF',
    'CLP',
    'CNY',
    'COP',
    'CRC',
    'CZK',
    'DKK',
    'DZD',
    'EGP',
    'ETB',
    'EUR',
    'FRF',
    'GBP',
    'GC',
    'GTQ',
    'HKD',
    'HNL',
    'HRK',
    'HUF',
    'IDR',
    'INR',
    'IRR',
    'JPY',
    'KES',
    'KHR',
    'KRW',
    'KSH',
    'LAK',
    'LBP',
    'LKR',
    'MAD',
    'MMK',
    'MNT',
    'MXN',
    'MYR',
    'NGN',
    'NOK',
    'NPR',
    'NTD',
    'NZD',
    'PEN',
    'PHP',
    'PKR',
    'PLN',
    'PTI',
    'PTV',
    'PYG',
    'RON',
    'RUB',
    'SAR',
    'SC',
    'SEK',
    'SGD',
    'THB',
    'TND',
    'TRY',
    'TWD',
    'UAH',
    'UGX',
    'USD',
    'USDT',
    'UZS',
    'VES',
    'VND',
    'ZAR',
    'ZMW',
    'BOB',
    'UAH',
    'UYU',
    'XAF',
    'CDF',
    'GYD',
    'TOP',
    'PYG2',
    'COP2',
    'IDR2',
    'IRR2',
    'KHR2',
    'KRW2',
    'LAK2',
    'LBP2',
    'MMK2',
    'UZS2',
    'VND2',
    'MMK3'
];

export const GS_TRANSACTION_ACTION = [
    'BET',
    'FREEBET',
    'SETTLED',
    'ROLLBACK',
    'CANCEL',
    'ADJUSTMENT',
    'JACKPOT',
    'BONUS',
    'TIP',
    'PROMO',
    'LEADERBOARD',
    'BET_PRESERVE',
    'PRESERVE_REFUND'
];

export const GS_PRODUCT_CODE = [
    1009, // CQ9
    1020, // WM Casino
    1022, // Sexy_gaming
    1033, // SV388cockfighting
    1050, // PlayStar
    1055, // MrSlotty
    1056, // TrueLab
    1058, // BGaming
    1060, // Volt Entertainment
    1062, // Fazi
    1064, // Netgame
    1065, // Kiron
    1067, // RedRake
    1070, // Booongo
    1080, // Venus
    1097, // FuntaGaming
    1098, // Felix
    1111, // GamingWorld
    1101, // ZeusPlay
    1102, // KAGaming
    1138, // Spribe
    1139, // Fastspin
    1149, // AI Live Casino
    1148, // WOW Gaming
    1006, // Pragmatic Play
    1011, // Play Tech
    1016, // YeeBet
    1091, // Jili tcg
    1018, // live_22
    1012, // SBO
    1052, // DreamGaming
    1085, // JDB
    1049, // Evoplay
    1153, // Hacksaw
    1154, // Bigpot
    1157, // IMoon
    1161, // TADA
    1166, // NO LIMIT CITY (ASIA)
    1167, // BIG TIME GAMING (ASIA)
    1172, // WORLD ENTERTAINMENT
    1183, // FB SPORT
    1152, // 1XBET
    1168, // Netent（ASIA）
    1169, // Red Tiger（ASIA）
    1040, // WBET
    1184, // RICH88
    1079, // Fachai
    1046, // IBC-SABA
    1185, // SA Gaming
    1002, // Evolution Gaming（ASIA）
    1038, // King855/CT855
    1191, // King855/CT855
    1007, // PG Soft
    1156, // Betfair
    1158, // Pascal Gaming
    1004, // BigGaming
    1160, // EPICWIN
    1163, // NOVOMATIC
    1162, // Octoplay
    1165, // aviatrix
    1164, // DIGITAIN
    1170, // smartsoft
    1171, // FIABLE GAMES
    1173, // Evolution (LATAM)
    1174, // Netent (LATAM)
    1175, // Red Tiger (LATAM)
    1176, // no limit city (LATAM)
    1177, // big time gaming(LATAM)
    1115, // BOOMING GAMES
    1186, // ENDORPHINA
    1187, // WINFINITY
    1192, // AMIGO GAMING
    1193, // FB Games
    1197, // Habanero
    1194, // PRETTY GAMING
    1203, // PlayAce
    1221, // SPADE GAMING
    1204, // ADVANTPLAY
    1222, // TF Gaming
    1220, // ASTAR
    1205, // AMBPOKER
    1206, // SlotXO(AMB)
    1207, // PG SOFT (AMB)
    1225, // JOKER
    1229, // PANDA SPORTS
    1223, // ALLBET
    1224, // GEMINI
    1230, // BETSOLUTIONS
    1231, // SIMPLE PLAY
    1232, // QQKENO
    1233, // NEX4D
    1227, // UG
    1237, // KAIYUANGAMING
    1239, // Hotdog
    1228, // CMD
    1238, // KA Gaming (Direct Line)
    1007, // PG Soft (THB)
    1091, // JE:JILI
    1240, // TCG SEA LOTTO
    1241, // TCG LOTTO
    1244, // BETBY
    1242 // PLAYTECH(Q6)
];

// ------------------------AG CASINO------------------------
export const AG_CURRENCY = [
    'BR_BRL',
    'GB_GBP',
    'DK_DKK',
    'DE_EUR',
    'ES_EUR',
    'FI_EUR',
    'FR_EUR',
    'ID_IDR',
    'IT_EUR',
    'NL_EUR',
    'NO_NOK',
    'PL_PLN',
    'PT_EUR',
    'TH_THB',
    'TR_TRY',
    'VN_VND',
    'MM_MMK',
    'SG_SGD',
    'NG_NGN',
    'US_USD',
    'PK_PKR',
    'CO_COP',
    'PH_PHP',
    'MX_MXN'
];

export const AG_CURRENCY_OBJ = {
    BRL: 'BR_BRL',
    GBP: 'GB_GBP',
    DKK: 'DK_DKK',
    EUR: 'DE_EUR',
    // EUR: 'ES_EUR',
    // EUR: 'FI_EUR',
    // EUR: 'FR_EUR',
    // EUR: 'IT_EUR',
    // EUR: 'PT_EUR',
    // EUR: 'NL_EUR',
    IDR: 'ID_IDR',
    NOK: 'NO_NOK',
    PLN: 'PL_PLN',
    THB: 'TH_THB',
    TRY: 'TR_TRY',
    VND: 'VN_VND',
    MMK: 'MM_MMK',
    SGD: 'SG_SGD',
    NGN: 'NG_NGN',
    USD: 'US_USD',
    PKR: 'PK_PKR',
    COP: 'CO_COP',
    PHP: 'PH_PHP',
    MXN: 'MX_MXN'
};

export const GAME_BANNER = [{
  "_id": {
    "$oid": "685fdffd2126835d243794e9"
  },
  "gameCode": "126",
  "ownImg": "game-1751793232360.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794ea"
  },
  "gameCode": "98",
  "ownImg": "game-1751793178010.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794eb"
  },
  "gameCode": "68",
  "ownImg": "game-1751793148187.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794ec"
  },
  "gameCode": "1543462",
  "ownImg": "game-1751793202630.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794ed"
  },
  "gameCode": "1695365",
  "ownImg": "game-1751793092322.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794ee"
  },
  "gameCode": "48",
  "ownImg": "game-1751792884973.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794ef"
  },
  "gameCode": "57",
  "ownImg": "game-1751792934181.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f0"
  },
  "gameCode": "67",
  "ownImg": "game-1751793550073.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f1"
  },
  "gameCode": "1682240",
  "ownImg": "game-1751792735418.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f2"
  },
  "gameCode": "53",
  "ownImg": "game-1751793911445.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f4"
  },
  "gameCode": "42",
  "ownImg": "game-1751793968531.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f5"
  },
  "gameCode": "1879752",
  "ownImg": "game-1751793347534.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f6"
  },
  "gameCode": "PG_PinataWins",
  "ownImg": "game-1751793496540.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f7"
  },
  "gameCode": "PG_WildBandito",
  "ownImg": "game-1751793642404.AVIF"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794f9"
  },
  "gameCode": "AG_PRAGMATIC_vs243mwarrior",
  "ownImg": "game-1751721502203.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794fa"
  },
  "gameCode": "AG_PRAGMATIC_vs20doghouse",
  "ownImg": "game-1751729857909.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794fb"
  },
  "gameCode": "AG_PRAGMATIC_vs40pirate",
  "ownImg": "game-1751728419544.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794fc"
  },
  "gameCode": "AG_PRAGMATIC_vs20rhino",
  "ownImg": "game-1751726150855.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794fd"
  },
  "gameCode": "AG_PRAGMATIC_vs25pandagold",
  "ownImg": "game-1751728255046.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794fe"
  },
  "gameCode": "AG_PRAGMATIC_vs4096bufking",
  "ownImg": "game-1751732243192.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243794ff"
  },
  "gameCode": "AG_PRAGMATIC_vs25pyramid",
  "ownImg": "game-1751728643958.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379501"
  },
  "gameCode": "AG_PRAGMATIC_vs5ultra",
  "ownImg": "game-1751730441104.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379502"
  },
  "gameCode": "AG_PRAGMATIC_vs25jokerking",
  "ownImg": "game-1751727280576.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379504"
  },
  "gameCode": "AG_PRAGMATIC_vs10madame",
  "ownImg": "game-1751727670576.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379505"
  },
  "gameCode": "AG_PRAGMATIC_vs15diamond",
  "ownImg": "game-1751722567435.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379507"
  },
  "gameCode": "AG_PRAGMATIC_vs25wildspells",
  "ownImg": "game-1751731628132.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379508"
  },
  "gameCode": "AG_PRAGMATIC_vs10bbbonanza",
  "ownImg": "game-1751733353124.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379509"
  },
  "gameCode": "AG_PRAGMATIC_vs10cowgold",
  "ownImg": "game-1751722039574.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437950b"
  },
  "gameCode": "AG_PRAGMATIC_vs25mustang",
  "ownImg": "game-1751728075832.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437950d"
  },
  "gameCode": "AG_PRAGMATIC_vs243dancingpar",
  "ownImg": "game-1751722423502.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437950e"
  },
  "gameCode": "AG_PRAGMATIC_vs576treasures",
  "ownImg": "game-1751731726930.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437950f"
  },
  "gameCode": "AG_PRAGMATIC_vs20hburnhs",
  "ownImg": "game-1751726737620.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379510"
  },
  "gameCode": "AG_PRAGMATIC_vs20emptybank",
  "ownImg": "game-1751723378257.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379511"
  },
  "gameCode": "AG_PRAGMATIC_vs20midas",
  "ownImg": "game-1751729996335.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379512"
  },
  "gameCode": "AG_PRAGMATIC_vs20olympgate",
  "ownImg": "game-1751725775190.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379513"
  },
  "gameCode": "AG_PRAGMATIC_vswayslight",
  "ownImg": "game-1751727624103.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379514"
  },
  "gameCode": "AG_PRAGMATIC_vs20vegasmagic",
  "ownImg": "game-1751730518679.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379515"
  },
  "gameCode": "AG_PRAGMATIC_vs20fruitparty",
  "ownImg": "game-1751725415873.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379516"
  },
  "gameCode": "AG_PRAGMATIC_vs20fparty2",
  "ownImg": "game-1751725446649.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379517"
  },
  "gameCode": "AG_PRAGMATIC_vswaysdogs",
  "ownImg": "game-1751729888106.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379518"
  },
  "gameCode": "AG_PRAGMATIC_vs50juicyfr",
  "ownImg": "game-1751727332502.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379519"
  },
  "gameCode": "AG_PRAGMATIC_vs25pandatemple",
  "ownImg": "game-1751728270318.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437951a"
  },
  "gameCode": "AG_PRAGMATIC_vswaysbufking",
  "ownImg": "game-1751732215187.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437951b"
  },
  "gameCode": "AG_PRAGMATIC_vs40wildwest",
  "ownImg": "game-1751731663571.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437951c"
  },
  "gameCode": "AG_PRAGMATIC_vs20chickdrop",
  "ownImg": "game-1751721602628.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437951d"
  },
  "gameCode": "AG_PRAGMATIC_vs40spartaking",
  "ownImg": "game-1751729128097.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437951e"
  },
  "gameCode": "AG_PRAGMATIC_vswaysrhino",
  "ownImg": "game-1751726196017.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437951f"
  },
  "gameCode": "AG_PRAGMATIC_vs20sbxmas",
  "ownImg": "game-1751729641967.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379520"
  },
  "gameCode": "AG_PRAGMATIC_vs10fruity2",
  "ownImg": "game-1751723437433.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379522"
  },
  "gameCode": "AG_PRAGMATIC_vs5drhs",
  "ownImg": "game-1751723059562.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379523"
  },
  "gameCode": "AG_PRAGMATIC_vs12bbb",
  "ownImg": "game-1751732916644.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379525"
  },
  "gameCode": "AG_PRAGMATIC_vswayslions",
  "ownImg": "game-1751706739345.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379527"
  },
  "gameCode": "AG_PRAGMATIC_vs50pixie",
  "ownImg": "game-1751728498018.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379528"
  },
  "gameCode": "AG_PRAGMATIC_vs10floatdrg",
  "ownImg": "game-1751724996195.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379529"
  },
  "gameCode": "AG_PRAGMATIC_vs20fruitsw",
  "ownImg": "game-1751729562701.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437952a"
  },
  "gameCode": "AG_PRAGMATIC_vs20rhinoluxe",
  "ownImg": "game-1751726171292.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437952b"
  },
  "gameCode": "AG_PRAGMATIC_vswaysmadame",
  "ownImg": "game-1751727688219.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437952c"
  },
  "gameCode": "AG_PRAGMATIC_vs1024temuj",
  "ownImg": "game-1751729783948.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437952d"
  },
  "gameCode": "AG_PRAGMATIC_vs40pirgold",
  "ownImg": "game-1751728451888.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437952e"
  },
  "gameCode": "AG_PRAGMATIC_vs25mmouse",
  "ownImg": "game-1751727962097.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437952f"
  },
  "gameCode": "AG_PRAGMATIC_vs10threestar",
  "ownImg": "game-1751730170626.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379531"
  },
  "gameCode": "AG_PRAGMATIC_vs243lionsgold",
  "ownImg": "game-1751706611171.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379533"
  },
  "gameCode": "AG_PRAGMATIC_vs25davinci",
  "ownImg": "game-1751722395153.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379534"
  },
  "gameCode": "AG_PRAGMATIC_vs7776secrets",
  "ownImg": "game-1751710031212.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379535"
  },
  "gameCode": "AG_PRAGMATIC_vs25wolfgold",
  "ownImg": "game-1751731815250.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379536"
  },
  "gameCode": "AG_PRAGMATIC_vs50safariking",
  "ownImg": "game-1751728887024.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379537"
  },
  "gameCode": "AG_PRAGMATIC_vs25peking",
  "ownImg": "game-1751728359892.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379538"
  },
  "gameCode": "AG_PRAGMATIC_vs25asgard",
  "ownImg": "game-1751709907234.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379539"
  },
  "gameCode": "AG_PRAGMATIC_vs25vegas",
  "ownImg": "game-1751730533378.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437953a"
  },
  "gameCode": "AG_PRAGMATIC_vs25scarabqueen",
  "ownImg": "game-1751727256641.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437953b"
  },
  "gameCode": "AG_PRAGMATIC_vs20starlight",
  "ownImg": "game-1751729288393.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437953c"
  },
  "gameCode": "AG_PRAGMATIC_vs10bookoftut",
  "ownImg": "game-1751727129415.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437953d"
  },
  "gameCode": "AG_PRAGMATIC_vs9piggybank",
  "ownImg": "game-1751728398547.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437953f"
  },
  "gameCode": "AG_PRAGMATIC_vs1024lionsd",
  "ownImg": "game-1751706680879.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379540"
  },
  "gameCode": "AG_PRAGMATIC_vs25rio",
  "ownImg": "game-1751726381624.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379541"
  },
  "gameCode": "AG_PRAGMATIC_vs10nudgeit",
  "ownImg": "game-1751728823590.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379543"
  },
  "gameCode": "AG_PRAGMATIC_vs20santawonder",
  "ownImg": "game-1751728932142.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379545"
  },
  "gameCode": "AG_PRAGMATIC_vs25btygold",
  "ownImg": "game-1751732267106.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379547"
  },
  "gameCode": "AG_PRAGMATIC_vswaysbbb",
  "ownImg": "game-1751710596364.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379548"
  },
  "gameCode": "AG_PRAGMATIC_vs10bookfallen",
  "ownImg": "game-1751732288337.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379549"
  },
  "gameCode": "AG_PRAGMATIC_vs40bigjuan",
  "ownImg": "game-1751710722725.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437954a"
  },
  "gameCode": "AG_PRAGMATIC_vs20bermuda",
  "ownImg": "game-1751727238394.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437954b"
  },
  "gameCode": "AG_PRAGMATIC_vs10starpirate",
  "ownImg": "game-1751729219924.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437954c"
  },
  "gameCode": "AG_PRAGMATIC_vswayswest",
  "ownImg": "game-1751728143950.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437954d"
  },
  "gameCode": "AG_PRAGMATIC_vs20daydead",
  "ownImg": "game-1751722451767.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437954f"
  },
  "gameCode": "AG_PRAGMATIC_vs20wildboost",
  "ownImg": "game-1751731513678.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379550"
  },
  "gameCode": "AG_PRAGMATIC_vswayshammthor",
  "ownImg": "game-1751728601884.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379551"
  },
  "gameCode": "AG_PRAGMATIC_vs243lions",
  "ownImg": "game-1751706622023.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379552"
  },
  "gameCode": "AG_PRAGMATIC_vs5super7",
  "ownImg": "game-1751729497328.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379553"
  },
  "gameCode": "AG_PRAGMATIC_vs1masterjoker",
  "ownImg": "game-1751727862187.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379554"
  },
  "gameCode": "AG_PRAGMATIC_vs20kraken",
  "ownImg": "game-1751728787150.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379555"
  },
  "gameCode": "AG_PRAGMATIC_vs10firestrike",
  "ownImg": "game-1751724597624.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379556"
  },
  "gameCode": "AG_PRAGMATIC_vs243fortune",
  "ownImg": "game-1751732138884.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379557"
  },
  "gameCode": "AG_PRAGMATIC_vs20aladdinsorc",
  "ownImg": "game-1751709321149.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379558"
  },
  "gameCode": "AG_PRAGMATIC_vs243fortseren",
  "ownImg": "game-1751726241811.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379559"
  },
  "gameCode": "AG_PRAGMATIC_vs25chilli",
  "ownImg": "game-1751721675460.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437955a"
  },
  "gameCode": "AG_PRAGMATIC_vs8magicjourn",
  "ownImg": "game-1751727707052.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437955b"
  },
  "gameCode": "AG_PRAGMATIC_vs20leprexmas",
  "ownImg": "game-1751727446543.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437955d"
  },
  "gameCode": "AG_PRAGMATIC_vs243caishien",
  "ownImg": "game-1751732161435.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437955f"
  },
  "gameCode": "AG_PRAGMATIC_vs25gladiator",
  "ownImg": "game-1751731572287.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379561"
  },
  "gameCode": "AG_PRAGMATIC_vs25goldrush",
  "ownImg": "game-1751726035718.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379562"
  },
  "gameCode": "AG_PRAGMATIC_vs25dragonkingdom",
  "ownImg": "game-1751723090483.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379565"
  },
  "gameCode": "AG_PRAGMATIC_vs20hercpeg",
  "ownImg": "game-1751726557015.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379566"
  },
  "gameCode": "AG_PRAGMATIC_vs7fire88",
  "ownImg": "game-1751724101203.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379567"
  },
  "gameCode": "AG_PRAGMATIC_vs20honey",
  "ownImg": "game-1751726588653.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379568"
  },
  "gameCode": "AG_PRAGMATIC_vs25safari",
  "ownImg": "game-1751726657340.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437956a"
  },
  "gameCode": "AG_PRAGMATIC_vs20chicken",
  "ownImg": "game-1751729948166.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437956b"
  },
  "gameCode": "AG_PRAGMATIC_vs1fortunetree",
  "ownImg": "game-1751730295478.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437956c"
  },
  "gameCode": "AG_PRAGMATIC_vs20wildpix",
  "ownImg": "game-1751731614059.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437956d"
  },
  "gameCode": "AG_PRAGMATIC_vs15fairytale",
  "ownImg": "game-1751723963748.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437956e"
  },
  "gameCode": "AG_PRAGMATIC_vs20santa",
  "ownImg": "game-1751728913566.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437956f"
  },
  "gameCode": "AG_PRAGMATIC_vs10vampwolf",
  "ownImg": "game-1751730476063.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379570"
  },
  "gameCode": "AG_PRAGMATIC_vs50aladdin",
  "ownImg": "game-1751706461867.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379571"
  },
  "gameCode": "AG_PRAGMATIC_vs50hercules",
  "ownImg": "game-1751726532849.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379572"
  },
  "gameCode": "AG_PRAGMATIC_vs7776aztec",
  "ownImg": "game-1751709935675.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379573"
  },
  "gameCode": "AG_PRAGMATIC_vs5trdragons",
  "ownImg": "game-1751730326955.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379574"
  },
  "gameCode": "AG_PRAGMATIC_vs40madwheel",
  "ownImg": "game-1751730144267.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379575"
  },
  "gameCode": "AG_PRAGMATIC_vs25newyear",
  "ownImg": "game-1751727645753.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379577"
  },
  "gameCode": "AG_PRAGMATIC_vs50kingkong",
  "ownImg": "game-1751727915816.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379578"
  },
  "gameCode": "AG_PRAGMATIC_vs20godiva",
  "ownImg": "game-1751727420072.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379579"
  },
  "gameCode": "AG_PRAGMATIC_vs9madmonkey",
  "ownImg": "game-1751727989475.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437957b"
  },
  "gameCode": "AG_PRAGMATIC_vs9chen",
  "ownImg": "game-1751727837869.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437957d"
  },
  "gameCode": "AG_PRAGMATIC_vs25dwarves_new",
  "ownImg": "game-1751723172730.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437957e"
  },
  "gameCode": "AG_PRAGMATIC_vs25sea",
  "ownImg": "game-1751726127390.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437957f"
  },
  "gameCode": "AG_PRAGMATIC_vs20leprechaun",
  "ownImg": "game-1751727467739.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379580"
  },
  "gameCode": "AG_PRAGMATIC_vs7monkeys",
  "ownImg": "game-1751706946421.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379581"
  },
  "gameCode": "AG_PRAGMATIC_vs50chinesecharms",
  "ownImg": "game-1751727548749.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379582"
  },
  "gameCode": "AG_PRAGMATIC_vs18mashang",
  "ownImg": "game-1751730254710.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379583"
  },
  "gameCode": "AG_PRAGMATIC_vs5spjoker",
  "ownImg": "game-1751729516902.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379584"
  },
  "gameCode": "AG_PRAGMATIC_vs20egypttrs",
  "ownImg": "game-1751723211068.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379586"
  },
  "gameCode": "AG_PRAGMATIC_vs9hotroll",
  "ownImg": "game-1751726612490.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379588"
  },
  "gameCode": "AG_PRAGMATIC_vs3train",
  "ownImg": "game-1751726061270.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437958c"
  },
  "gameCode": "AG_PRAGMATIC_vs1600drago",
  "ownImg": "game-1751723031788.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437958d"
  },
  "gameCode": "AG_PRAGMATIC_vs1fufufu",
  "ownImg": "game-1751725612522.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437958e"
  },
  "gameCode": "AG_PRAGMATIC_vs40streetracer",
  "ownImg": "game-1751729398563.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379590"
  },
  "gameCode": "AG_PRAGMATIC_vs20gorilla",
  "ownImg": "game-1751727354947.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379592"
  },
  "gameCode": "AG_PRAGMATIC_vswayshive",
  "ownImg": "game-1751729198111.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379594"
  },
  "gameCode": "AG_PRAGMATIC_vs25walker",
  "ownImg": "game-1751731647329.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379595"
  },
  "gameCode": "AG_PRAGMATIC_vs20goldfever",
  "ownImg": "game-1751725892601.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379596"
  },
  "gameCode": "AG_PRAGMATIC_vs25bkofkngdm",
  "ownImg": "game-1751732319643.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379597"
  },
  "gameCode": "AG_PRAGMATIC_vs10goldfish",
  "ownImg": "game-1751724815342.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379598"
  },
  "gameCode": "AG_PRAGMATIC_vs1024dtiger",
  "ownImg": "game-1751729920500.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379599"
  },
  "gameCode": "AG_PRAGMATIC_vs20xmascarol",
  "ownImg": "game-1751721834106.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437959a"
  },
  "gameCode": "AG_PRAGMATIC_vs10mayangods",
  "ownImg": "game-1751727192347.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437959c"
  },
  "gameCode": "AG_PRAGMATIC_vs40voodoo",
  "ownImg": "game-1751731422993.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437959e"
  },
  "gameCode": "AG_PRAGMATIC_vs10wildtut",
  "ownImg": "game-1751728098260.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437959f"
  },
  "gameCode": "AG_PRAGMATIC_vs20ekingrr",
  "ownImg": "game-1751723347304.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a0"
  },
  "gameCode": "AG_PRAGMATIC_vs10eyestorm",
  "ownImg": "game-1751723516836.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a1"
  },
  "gameCode": "AG_PRAGMATIC_vs117649starz",
  "ownImg": "game-1751729349182.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a2"
  },
  "gameCode": "AG_PRAGMATIC_vs10amm",
  "ownImg": "game-1751729819071.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a4"
  },
  "gameCode": "AG_PRAGMATIC_vswayselements",
  "ownImg": "game-1751723294680.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a5"
  },
  "gameCode": "AG_PRAGMATIC_vswayschilheat",
  "ownImg": "game-1751721700008.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a6"
  },
  "gameCode": "AG_PRAGMATIC_vs10luckcharm",
  "ownImg": "game-1751727599191.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795a8"
  },
  "gameCode": "AG_PRAGMATIC_vs20phoenixf",
  "ownImg": "game-1751728381306.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795aa"
  },
  "gameCode": "AG_PRAGMATIC_vs20trsbox",
  "ownImg": "game-1751730275137.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ac"
  },
  "gameCode": "AG_PRAGMATIC_vswaysbankbonz",
  "ownImg": "game-1751732093288.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b0"
  },
  "gameCode": "AG_PRAGMATIC_vs20amuleteg",
  "ownImg": "game-1751725285024.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b1"
  },
  "gameCode": "AG_PRAGMATIC_vs10runes",
  "ownImg": "game-1751725870447.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b2"
  },
  "gameCode": "AG_PRAGMATIC_vs25goldparty",
  "ownImg": "game-1751726009906.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b3"
  },
  "gameCode": "AG_PRAGMATIC_vswaysxjuicy",
  "ownImg": "game-1751723462931.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b4"
  },
  "gameCode": "AG_PRAGMATIC_vs4096magician",
  "ownImg": "game-1751727786000.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b5"
  },
  "gameCode": "AG_PRAGMATIC_vs20smugcove",
  "ownImg": "game-1751729085435.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b6"
  },
  "gameCode": "AG_PRAGMATIC_vswayscryscav",
  "ownImg": "game-1751722267309.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b7"
  },
  "gameCode": "AG_PRAGMATIC_vs20superx",
  "ownImg": "game-1751729537815.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b8"
  },
  "gameCode": "AG_PRAGMATIC_vs20rockvegas",
  "ownImg": "game-1751728852953.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795b9"
  },
  "gameCode": "AG_PRAGMATIC_vs25copsrobbers",
  "ownImg": "game-1751732019748.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795bb"
  },
  "gameCode": "AG_PRAGMATIC_vs20ultim5",
  "ownImg": "game-1751730115320.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795bc"
  },
  "gameCode": "AG_PRAGMATIC_vs20bchprty",
  "ownImg": "game-1751731470795.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795be"
  },
  "gameCode": "AG_PRAGMATIC_vs50mightra",
  "ownImg": "game-1751727887268.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c0"
  },
  "gameCode": "AG_PRAGMATIC_vs20rainbowg",
  "ownImg": "game-1751728748309.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c1"
  },
  "gameCode": "AG_PRAGMATIC_vs10tictac",
  "ownImg": "game-1751730202940.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c3"
  },
  "gameCode": "AG_PRAGMATIC_vs243queenie",
  "ownImg": "game-1751728708226.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c5"
  },
  "gameCode": "AG_PRAGMATIC_vs10chkchase",
  "ownImg": "game-1751721565969.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c6"
  },
  "gameCode": "AG_PRAGMATIC_vswayswildwest",
  "ownImg": "game-1751731681422.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c8"
  },
  "gameCode": "AG_PRAGMATIC_vs20drtgold",
  "ownImg": "game-1751723138332.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795c9"
  },
  "gameCode": "AG_PRAGMATIC_vs10spiritadv",
  "ownImg": "game-1751729169624.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ca"
  },
  "gameCode": "AG_PRAGMATIC_vs10firestrike2",
  "ownImg": "game-1751724716360.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795cb"
  },
  "gameCode": "AG_PRAGMATIC_vs40cleoeye",
  "ownImg": "game-1751723490790.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795cc"
  },
  "gameCode": "AG_PRAGMATIC_vs20gobnudge",
  "ownImg": "game-1751725940928.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795cd"
  },
  "gameCode": "AG_PRAGMATIC_vs20stickysymbol",
  "ownImg": "game-1751729968662.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ce"
  },
  "gameCode": "AG_PRAGMATIC_vswayszombcarn",
  "ownImg": "game-1751731838096.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795cf"
  },
  "gameCode": "AG_PRAGMATIC_vs50northgard",
  "ownImg": "game-1751728171594.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795d0"
  },
  "gameCode": "AG_PRAGMATIC_vs20sugarrush",
  "ownImg": "game-1751729454361.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795d1"
  },
  "gameCode": "AG_PRAGMATIC_vs20cleocatra",
  "ownImg": "game-1751721940066.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795d2"
  },
  "gameCode": "AG_PRAGMATIC_vs5littlegem",
  "ownImg": "game-1751727488379.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795d3"
  },
  "gameCode": "AG_PRAGMATIC_vs10egrich",
  "ownImg": "game-1751728664045.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795d6"
  },
  "gameCode": "AG_PRAGMATIC_vs40cosmiccash",
  "ownImg": "game-1751721982843.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795d7"
  },
  "gameCode": "AG_PRAGMATIC_vs25bomb",
  "ownImg": "game-1751732871646.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795da"
  },
  "gameCode": "AG_PRAGMATIC_vs100sh",
  "ownImg": "game-1751728988375.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795db"
  },
  "gameCode": "AG_PRAGMATIC_vs20sh",
  "ownImg": "game-1751729017260.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795dc"
  },
  "gameCode": "AG_PRAGMATIC_vs40sh",
  "ownImg": "game-1751729026911.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795dd"
  },
  "gameCode": "AG_PRAGMATIC_vs5sh",
  "ownImg": "game-1751729034652.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795de"
  },
  "gameCode": "AG_PRAGMATIC_vswaysjkrdrop",
  "ownImg": "game-1751730354021.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e0"
  },
  "gameCode": "AG_PRAGMATIC_vs40hotburnx",
  "ownImg": "game-1751726696462.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e2"
  },
  "gameCode": "AG_PRAGMATIC_vs20octobeer",
  "ownImg": "game-1751728196353.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e3"
  },
  "gameCode": "AG_PRAGMATIC_vs10txbigbass",
  "ownImg": "game-1751710691809.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e4"
  },
  "gameCode": "AG_PRAGMATIC_vs100firehot",
  "ownImg": "game-1751724516305.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e5"
  },
  "gameCode": "AG_PRAGMATIC_vs20fh",
  "ownImg": "game-1751724540447.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e6"
  },
  "gameCode": "AG_PRAGMATIC_vs40firehot",
  "ownImg": "game-1751724565809.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795e8"
  },
  "gameCode": "AG_PRAGMATIC_vs20wolfie",
  "ownImg": "game-1751726217990.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ea"
  },
  "gameCode": "AG_PRAGMATIC_vs10mmm",
  "ownImg": "game-1751727728972.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ec"
  },
  "gameCode": "AG_PRAGMATIC_vs20trswild2",
  "ownImg": "game-1751732892936.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ee"
  },
  "gameCode": "AG_PRAGMATIC_vs10crownfire",
  "ownImg": "game-1751722237796.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ef"
  },
  "gameCode": "AG_PRAGMATIC_vs20muertos",
  "ownImg": "game-1751728048401.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f1"
  },
  "gameCode": "AG_PRAGMATIC_vs5strh",
  "ownImg": "game-1751729422653.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f2"
  },
  "gameCode": "AG_PRAGMATIC_vs10snakeeyes",
  "ownImg": "game-1751729109062.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f3"
  },
  "gameCode": "AG_PRAGMATIC_vswaysbook",
  "ownImg": "game-1751732351755.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f4"
  },
  "gameCode": "AG_PRAGMATIC_vs20mparty",
  "ownImg": "game-1751731591997.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f5"
  },
  "gameCode": "AG_PRAGMATIC_vs20swordofares",
  "ownImg": "game-1751729764192.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f7"
  },
  "gameCode": "AG_PRAGMATIC_vs12bbbxmas",
  "ownImg": "game-1751732962204.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795f9"
  },
  "gameCode": "AG_PRAGMATIC_vs20schristmas",
  "ownImg": "game-1751729276137.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795fb"
  },
  "gameCode": "AG_PRAGMATIC_vs20lcount",
  "ownImg": "game-1751725914809.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795fc"
  },
  "gameCode": "AG_PRAGMATIC_vs20sparta",
  "ownImg": "game-1751728971667.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243795ff"
  },
  "gameCode": "AG_PRAGMATIC_vswaysrabbits",
  "ownImg": "game-1751706783803.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379600"
  },
  "gameCode": "AG_PRAGMATIC_vswayspizza",
  "ownImg": "game-1751728518813.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379602"
  },
  "gameCode": "AG_PRAGMATIC_vs20dugems",
  "ownImg": "game-1751726630802.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379603"
  },
  "gameCode": "AG_PRAGMATIC_vs20clspwrndg",
  "ownImg": "game-1751729682575.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379604"
  },
  "gameCode": "AG_PRAGMATIC_vswaysfuryodin",
  "ownImg": "game-1751725690593.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379605"
  },
  "gameCode": "AG_PRAGMATIC_vs20sugarcoins",
  "ownImg": "game-1751730551225.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379607"
  },
  "gameCode": "AG_PRAGMATIC_vs20starlightx",
  "ownImg": "game-1751729303611.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379608"
  },
  "gameCode": "AG_PRAGMATIC_vswaysmoneyman",
  "ownImg": "game-1751730070557.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379609"
  },
  "gameCode": "AG_PRAGMATIC_vs40demonpots",
  "ownImg": "game-1751722476087.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437960a"
  },
  "gameCode": "AG_PRAGMATIC_vswaystut",
  "ownImg": "game-1751727164591.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437960b"
  },
  "gameCode": "AG_PRAGMATIC_vs10gdchalleng",
  "ownImg": "game-1751733306031.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437960d"
  },
  "gameCode": "AG_PRAGMATIC_vs20candyblitz",
  "ownImg": "game-1751732114373.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437960e"
  },
  "gameCode": "AG_PRAGMATIC_vswaysstrlght",
  "ownImg": "game-1751725350473.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437960f"
  },
  "gameCode": "AG_PRAGMATIC_vs40infwild",
  "ownImg": "game-1751726964800.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379610"
  },
  "gameCode": "AG_PRAGMATIC_vs20gravity",
  "ownImg": "game-1751726098791.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379611"
  },
  "gameCode": "AG_PRAGMATIC_vs40rainbowr",
  "ownImg": "game-1751728766252.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379612"
  },
  "gameCode": "AG_PRAGMATIC_vs20bnnzdice",
  "ownImg": "game-1751729624136.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379613"
  },
  "gameCode": "AG_PRAGMATIC_vs10bhallbnza",
  "ownImg": "game-1751710631124.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379614"
  },
  "gameCode": "AG_PRAGMATIC_vswaysraghex",
  "ownImg": "game-1751730409655.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379615"
  },
  "gameCode": "AG_PRAGMATIC_vs20maskgame",
  "ownImg": "game-1751732040949.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379618"
  },
  "gameCode": "AG_PRAGMATIC_vs20procount",
  "ownImg": "game-1751731790440.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379619"
  },
  "gameCode": "AG_PRAGMATIC_vs20forge",
  "ownImg": "game-1751725251692.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437961b"
  },
  "gameCode": "AG_PRAGMATIC_vswaysbbhas",
  "ownImg": "game-1751710665404.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437961c"
  },
  "gameCode": "AG_PRAGMATIC_vs20earthquake",
  "ownImg": "game-1751731965009.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437961f"
  },
  "gameCode": "AG_PRAGMATIC_vs20lvlup",
  "ownImg": "game-1751728618722.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379622"
  },
  "gameCode": "AG_PRAGMATIC_vs50dmdcascade",
  "ownImg": "game-1751722539476.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379623"
  },
  "gameCode": "AG_PRAGMATIC_vs20lobcrab",
  "ownImg": "game-1751727519521.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379624"
  },
  "gameCode": "AG_PRAGMATIC_vs20wildparty",
  "ownImg": "game-1751706389560.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379625"
  },
  "gameCode": "AG_PRAGMATIC_vs20doghousemh",
  "ownImg": "game-1751729896159.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379626"
  },
  "gameCode": "AG_PRAGMATIC_vs20splmystery",
  "ownImg": "game-1751729145821.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379627"
  },
  "gameCode": "AG_PRAGMATIC_vs20cashmachine",
  "ownImg": "game-1751732066707.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379628"
  },
  "gameCode": "AG_PRAGMATIC_vs50jucier",
  "ownImg": "game-1751729065320.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379629"
  },
  "gameCode": "AG_PRAGMATIC_vs243nudge4gold",
  "ownImg": "game-1751726507443.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437962b"
  },
  "gameCode": "AG_PRAGMATIC_vs10bbextreme",
  "ownImg": "game-1751710509348.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437962c"
  },
  "gameCode": "AG_PRAGMATIC_vs20hstgldngt",
  "ownImg": "game-1751726484888.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437962d"
  },
  "gameCode": "AG_PRAGMATIC_vs20beefed",
  "ownImg": "game-1751723985538.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437962e"
  },
  "gameCode": "AG_PRAGMATIC_vs20jewelparty",
  "ownImg": "game-1751727018341.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437962f"
  },
  "gameCode": "AG_PRAGMATIC_vs9outlaw",
  "ownImg": "game-1751728480210.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379634"
  },
  "gameCode": "AG_PRAGMATIC_vs20clustwild",
  "ownImg": "game-1751729374972.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379636"
  },
  "gameCode": "AG_PRAGMATIC_vs20excalibur",
  "ownImg": "game-1751723408224.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379637"
  },
  "gameCode": "AG_PRAGMATIC_vs20stickywild",
  "ownImg": "game-1751731492838.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379639"
  },
  "gameCode": "AG_PRAGMATIC_vs20mvwild",
  "ownImg": "game-1751726997334.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437963a"
  },
  "gameCode": "AG_PRAGMATIC_vs10kingofdth",
  "ownImg": "game-1751727384384.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437963b"
  },
  "gameCode": "AG_PRAGMATIC_vswaysultrcoin",
  "ownImg": "game-1751722011571.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437963c"
  },
  "gameCode": "AG_PRAGMATIC_vs10gizagods",
  "ownImg": "game-1751725968415.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437963d"
  },
  "gameCode": "AG_PRAGMATIC_vswaysrsm",
  "ownImg": "game-1751731550460.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379640"
  },
  "gameCode": "AG_PRAGMATIC_vs10bbhas",
  "ownImg": "game-1751710438653.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379642"
  },
  "gameCode": "AG_PRAGMATIC_vswaysredqueen",
  "ownImg": "game-1751730092785.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379644"
  },
  "gameCode": "AG_PRAGMATIC_vs20sknights",
  "ownImg": "game-1751730028186.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379645"
  },
  "gameCode": "AG_PRAGMATIC_vs20goldclust",
  "ownImg": "game-1751728725594.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379646"
  },
  "gameCode": "AG_PRAGMATIC_vswaysmorient",
  "ownImg": "game-1751728123042.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379647"
  },
  "gameCode": "AG_PRAGMATIC_vs10powerlines",
  "ownImg": "game-1751728340007.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379649"
  },
  "gameCode": "AG_PRAGMATIC_vs25archer",
  "ownImg": "game-1751724387351.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437964b"
  },
  "gameCode": "AG_PRAGMATIC_vs20mochimon",
  "ownImg": "game-1751727940345.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437964c"
  },
  "gameCode": "AG_PRAGMATIC_vs10fisheye",
  "ownImg": "game-1751724774466.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437964d"
  },
  "gameCode": "AG_PRAGMATIC_vs20superlanche",
  "ownImg": "game-1751728021718.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437964e"
  },
  "gameCode": "AG_PRAGMATIC_vswaysftropics",
  "ownImg": "game-1751725374814.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437964f"
  },
  "gameCode": "AG_PRAGMATIC_vswaysincwnd",
  "ownImg": "game-1751725990437.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379650"
  },
  "gameCode": "AG_PRAGMATIC_vs25spgldways",
  "ownImg": "game-1751728952352.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379651"
  },
  "gameCode": "AG_PRAGMATIC_vs20mammoth",
  "ownImg": "game-1751727810446.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379652"
  },
  "gameCode": "AG_PRAGMATIC_vswayswwhex",
  "ownImg": "game-1751731704116.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379657"
  },
  "gameCode": "AG_PRAGMATIC_vs10ddcbells",
  "ownImg": "game-1751722678076.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379658"
  },
  "gameCode": "AG_PRAGMATIC_vs20olympx",
  "ownImg": "game-1751725806918.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379659"
  },
  "gameCode": "AG_PRAGMATIC_vs20olympdice",
  "ownImg": "game-1751725837154.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437965b"
  },
  "gameCode": "AG_PRAGMATIC_vs15seoultrain",
  "ownImg": "game-1751730234712.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437965c"
  },
  "gameCode": "AG_PRAGMATIC_vs20gatotx",
  "ownImg": "game-1751725722244.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437965e"
  },
  "gameCode": "AG_PRAGMATIC_vs20sugarrushx",
  "ownImg": "game-1751729464814.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379661"
  },
  "gameCode": "AG_PRAGMATIC_vs5jjwild",
  "ownImg": "game-1751727308955.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379662"
  },
  "gameCode": "AG_PRAGMATIC_vswaysjapan",
  "ownImg": "game-1751729325977.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379663"
  },
  "gameCode": "AG_PRAGMATIC_vs20fruitswx",
  "ownImg": "game-1751729607017.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379664"
  },
  "gameCode": "AG_PRAGMATIC_vswaysbkingasc",
  "ownImg": "game-1751732234017.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379666"
  },
  "gameCode": "AG_PRAGMATIC_vs20midas2",
  "ownImg": "game-1751726264530.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379667"
  },
  "gameCode": "AG_PRAGMATIC_vs20clustcol",
  "ownImg": "game-1751729654288.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379686"
  },
  "gameCode": "AG_REELKINGDOM_vs5ultra",
  "ownImg": "game-1751730450144.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379688"
  },
  "gameCode": "AG_REELKINGDOM_vs10bbbonanza",
  "ownImg": "game-1751710541259.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437968b"
  },
  "gameCode": "AG_REELKINGDOM_vs12bbb",
  "ownImg": "game-1751732932222.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437968d"
  },
  "gameCode": "AG_REELKINGDOM_vs1024temuj",
  "ownImg": "game-1751729793729.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437968e"
  },
  "gameCode": "AG_REELKINGDOM_vs10bxmasbnza",
  "ownImg": "game-1751721779100.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379691"
  },
  "gameCode": "AG_REELKINGDOM_vs10starpirate",
  "ownImg": "game-1751729230979.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379693"
  },
  "gameCode": "AG_REELKINGDOM_vs25bkofkngdm",
  "ownImg": "game-1751732330087.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379694"
  },
  "gameCode": "AG_REELKINGDOM_vs20ekingrr",
  "ownImg": "game-1751723325511.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d24379696"
  },
  "gameCode": "AG_REELKINGDOM_vs10amm",
  "ownImg": "game-1751729833926.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437969a"
  },
  "gameCode": "AG_REELKINGDOM_vs10tictac",
  "ownImg": "game-1751730209459.jpg"
},
{
  "_id": {
    "$oid": "685fdffd2126835d2437969c"
  },
  "gameCode": "AG_REELKINGDOM_vs10spiritadv",
  "ownImg": "game-1751729177015.png"
},
{
  "_id": {
    "$oid": "685fdffd2126835d243796a6"
  },
  "gameCode": "AG_PLAYSON_buffalo_xmas",
  "ownImg": "game-1751710191229.png"
},
{
  "_id": {
    "$oid": "685fdffe2126835d243796db"
  },
  "gameCode": "AG_EVOPLAY_ChineseNewYear",
  "ownImg": "game-1751721751381.png"
},
{
  "_id": {
    "$oid": "685fdffe2126835d24379725"
  },
  "gameCode": "AG_TOPTREND_WildWildWitch",
  "ownImg": "game-1751731746878.jpg"
},
{
  "_id": {
    "$oid": "685fdffe2126835d2437973f"
  },
  "gameCode": "AG_DREAMTECH_circus",
  "ownImg": "game-1751722174565.jpg"
}]