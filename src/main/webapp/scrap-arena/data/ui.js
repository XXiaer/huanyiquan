/* ============================================================================
 * Scrap Arena · UI 数据（菜单 / 舞台 / 角色档案）
 * ---------------------------------------------------------------------------
 * 这是 UI 层的**唯一数据源**。引擎（game/index.html）只读不改这里。
 *
 * 用途
 *   stages      舞台列表：缩略图、四层视差、难度、文案
 *   characters  角色卡片：立绘、四维属性、招式表、文案
 *   menus       界面文案：主菜单项、各界面标题与提示
 *
 * 数据契约（engineering-lead 按本文件实现）
 *   - 本文件只写 window.UI = {...}，不引用任何外部变量。
 *     校验：node -e "const fs=require('fs');const w={};new Function('window',fs.readFileSync('game/data/ui.js','utf8'))(w);console.log(w.UI.stages.length,w.UI.characters.length)"
 *   - stages[] 与 characters[] 的字段名固定，不要改。
 *   - 招式名、输入、类型必须与 game/data/moves.js + game/data/characters.js 一致。
 *     招式表见 docs/07-UI流程与角色说明.md 第五节「招式对照表」。
 *
 * 【路径约定 · 与美术线对齐】
 *   舞台：assets/stages/<stageId>/{thumb,sky,far,mid,near,floor}.png
 *   立绘：assets/ui/portrait_<charId>.png
 *   stageId 只允许：foundry / coldstore
 *   charId  允许：horizon / isolde / nameless / sylvi / ikaria
 * ==========================================================================*/

window.UI = {

  /* ==========================================================================
   * 舞台
   * difficulty：1~5（1 最低，5 最高）
   * desc：场景说明，一句，≤ 24 字
   * parallax：各层视差系数（越大越靠近摄像机）
   * ==========================================================================*/
  stages: [
    {
      id: 'foundry',
      name: '赤线铸造厂',
      en: 'REDLINE FOUNDRY',
      mode: 'flat',
      bottom: 540,
      difficulty: 3,
      scene: '夜班',
      desc: '炉火没熄，夜班还在往下压。',
      thumb: 'assets/stages/foundry/arcade-preview.webp',
      layers: { sky: 'assets/stages/foundry/arcade-bg.webp', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.05, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 }
    },
    {
      id: 'coldstore',
      name: '极夜货运站',
      en: 'POLAR FREIGHT',
      mode: 'flat',
      bottom: 540,
      difficulty: 4,
      scene: '冷链',
      desc: '冷链没断，霜气贴着地面走。',
      thumb: 'assets/stages/coldstore/arcade-preview.webp',
      layers: { sky: 'assets/stages/coldstore/arcade-bg.webp', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.05, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 }
    },

    /* ------------------------------------------------------------------------
     * KOF'99 素材集（11 套）
     * ------------------------------------------------------------------------
     * 来源：Sega Genesis - The King of Fighters '99 (Bootleg) - Backgrounds。
     * 原图集 540×3020 竖排拼贴，每张 512×256，由 tools/build_kof_stages.py
     * 切分 → 2× 整数放大 → 水平镜像拼接 → 底部延伸，输出 2048×608。
     *
     * mode: 'flat'  —— 单图舞台：整张背景铺满，不再叠程序化街面。
     * bottom        —— 背景图底边在屏幕上的 y（脚本按地面线算好，让图里的
     *                  地面正好落在 GROUND_Y = 460）。
     * 单图没有分层，纵深只能靠 sky 的视差系数（0.55：背景跟着镜头动但比角色慢）。
     * ---------------------------------------------------------------------- */
    { id: 'garden', name: '临水庭园', en: 'WATERSIDE GARDEN', mode: 'flat', bottom: 540,
      difficulty: 2, scene: '晴昼', desc: '水面映着回廊，风一过就碎。',
      thumb: 'assets/stages/kof/garden/thumb.png',
      layers: { sky: 'assets/stages/kof/garden/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'shrine', name: '朱红神苑', en: 'VERMILION SHRINE', mode: 'flat', bottom: 540,
      difficulty: 3, scene: '祭日', desc: '千本鸟居排到山脚，铃声没停。',
      thumb: 'assets/stages/kof/shrine/thumb.png',
      layers: { sky: 'assets/stages/kof/shrine/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'desert', name: '赤沙荒野', en: 'RED WASTELAND', mode: 'flat', bottom: 540,
      difficulty: 2, scene: '正午', desc: '没有一处遮挡，影子缩在脚底。',
      thumb: 'assets/stages/kof/desert/thumb.png',
      layers: { sky: 'assets/stages/kof/desert/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'pier', name: '潮见栈桥', en: 'TIDELINE PIER', mode: 'flat', bottom: 540,
      difficulty: 3, scene: '涨潮', desc: '木板在脚下响，潮水顶到桩子。',
      thumb: 'assets/stages/kof/pier/thumb.png',
      layers: { sky: 'assets/stages/kof/pier/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'snowpeak', name: '雪岭关所', en: 'SNOWPASS', mode: 'flat', bottom: 540,
      difficulty: 4, scene: '落雪', desc: '雪压着山脊，呼吸都是白的。',
      thumb: 'assets/stages/kof/snowpeak/thumb.png',
      layers: { sky: 'assets/stages/kof/snowpeak/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'gate', name: '镇海城门', en: 'SEAGATE FORTRESS', mode: 'flat', bottom: 540,
      difficulty: 3, scene: '晴午', desc: '城门开着，砖缝里长着草。',
      thumb: 'assets/stages/kof/gate/thumb.png',
      layers: { sky: 'assets/stages/kof/gate/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'market', name: '长街灯火', en: 'MARKET STREET', mode: 'flat', bottom: 540,
      difficulty: 3, scene: '黄昏', desc: '招牌一盏盏亮，没人收摊。',
      thumb: 'assets/stages/kof/market/thumb.png',
      layers: { sky: 'assets/stages/kof/market/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'station', name: '北线道口', en: 'NORTH CROSSING', mode: 'flat', bottom: 540,
      difficulty: 4, scene: '末班', desc: '栏杆放下，远处的车灯还没到。',
      thumb: 'assets/stages/kof/station/thumb.png',
      layers: { sky: 'assets/stages/kof/station/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'colosseum', name: '日冕斗技场', en: 'SOLAR COLOSSEUM', mode: 'flat', bottom: 540,
      difficulty: 5, scene: '正午', desc: '石阶一圈圈往上，喊声压得很低。',
      thumb: 'assets/stages/kof/colosseum/thumb.png',
      layers: { sky: 'assets/stages/kof/colosseum/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'arena', name: '夜穹石庭', en: 'NIGHT STONE ARENA', mode: 'flat', bottom: 540,
      difficulty: 5, scene: '深夜', desc: '石墙圈住一片天，云在头顶走。',
      thumb: 'assets/stages/kof/arena/thumb.png',
      layers: { sky: 'assets/stages/kof/arena/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } },

    { id: 'palace', name: '金阶大殿', en: 'GILDED HALL', mode: 'flat', bottom: 540,
      difficulty: 4, scene: '夜宴', desc: '金漆还没干，红毯一直铺到门口。',
      thumb: 'assets/stages/kof/palace/thumb.png',
      layers: { sky: 'assets/stages/kof/palace/bg.png', far: '', mid: '', near: '', floor: '' },
      parallax: { sky: 0.16, far: 0.16, mid: 0.34, near: 0.58, floor: 1.0 } }
  ],

  /* ==========================================================================
   * 角色
   * stats：四维属性，0~100
   *   power      威力 —— 伤害权重（普通技最高伤害 50% / 特殊技平均伤害 30% / 大招伤害 20%）
   *   speed      速度 —— 前进速度 45% / 滞空帧数 30% / 冲刺速度 25%
   *   range      射程 —— 轻攻击远边 60% + 最远常规招式远边 40%（运行像素）
   *   technique  技巧 —— 变化度 20% + 手段数 20% + 出招效率 40% + 招式容量 20%
   *   推导过程与逐项算式见 docs/07-UI流程与角色说明.md 第六节。
   * skills：招式表。type ∈ 普通技 / 特殊技 / 必杀技 / 大招
   *   —— horizon 取自 game/data/characters.js + game/data/moves.js，逐条对齐。
   *   —— isolde 尚无招式表，skills 为空数组（引擎安全），目标套件见 skillsPlanned。
   *
   * 【UI 扩展字段 · 引擎会忽略，引擎只读 skills】
   *   status             'ready' | 'placeholder'。placeholder 的角色在选人页不可被确认选中
   *                      （灰掉 + statusLabel 标签 + Enter 无效），光标可停留查看资料。
   *   statusLabel        占位角色在角色列表里挂的标签文案
   *   skillsEmptyLabel   招式表为空时技能面板顶部的提示文案
   *   skillsPreviewTitle skillsPlanned 预览区的标题（预览行半透明 + 虚线框，标「预览」）
   *   skillsNote         给后续维护者看的说明，不上屏
   *   skillsPlanned      目标招式表预览。**不是数据源**，招式表落地后整段删掉
   *
   * 【文案占位符】引擎做替换，缺替换就显示原样
   *   {names}  本轮 status === 'ready' 的角色名，逗号分隔
   *   {name}   单个角色名
   *   {n}      回合数
   * ==========================================================================*/  characters: [
    {
      id: 'horizon',
      name: 'HORIZON',
      cn: '潮汐澜影·赫莱森',
      blurb: '以潮汐为刃的水术格斗家。招式全是水浪，起手慢、范围大、收招长。',
      stats: { power: 64, speed: 59, range: 49, technique: 79 },
      status: 'ready',
      skills: [
        { name: '轻踢',       input: '轻',          type: '普通技', desc: '出手最快的贴身水刃，用来起手和接连段。' },
        { name: '涌拳',       input: '重',          type: '普通技', desc: '蓄力一拍的水压重击，命中直接把人打倒在地。' },
        { name: '蹲击',       input: '蹲 + 轻',    type: '普通技', desc: '贴地的低位水刃，能捅穿站着的防御。' },
        { name: '崩潮',       input: '蹲 + 重',    type: '普通技', desc: '蹲姿重击，低位且击倒，压制起身。' },
        { name: '空中浪',     input: '空中 + 轻',  type: '普通技', desc: '落下来的水浪，是上段，蹲着躲不掉。' },
        { name: '空中崩',     input: '空中 + 重',  type: '普通技', desc: '空中的重击，上段且击倒，跳过去会被砸。' },
        { name: '潮汐斩',     input: '↓↘→ + 轻',   type: '特殊技', desc: '踏着浪头前冲的水刃，贴身起手最常用。' },
        { name: '聚潮珠',     input: '↓↘→ + 重',   type: '特殊技', desc: '身前凝出的水球，中距离牵制，逼对手动。' },
        { name: '升潮柱',     input: '→↓↘ + 重',   type: '特殊技', desc: '拔地而起的水柱，出招全程无敌，专治对空。气 ≥ 50 时由深渊潮汐接管。' },
        { name: '浪奔',       input: '→→ + 重',    type: '特殊技', desc: '贴地冲刺，位移最远，追人和逃跑都用它。' },
        { name: '长浪',       input: '↓↙← + 轻',   type: '特殊技', desc: '横扫过来的大浪，范围最大，起手慢但躲不开。' },
        { name: '深渊潮汐',   input: '→↓↘ + 重（50 气）', type: '必杀技', desc: '卷起的整场大浪，五十气发动，双方定格一瞬。' },
        { name: '终潮',       input: '↓↙← + 重（100 气）', type: '大招', desc: '满气终招，终幕降下时全屏白闪。' }
,
        { name: '潮返', input: '→↓↘ + 轻（25 气）', type: '特殊技', desc: 'EX 对空返击，出招带无敌。' },
        { name: '浪跃', input: '→→ + 轻（25 气）', type: '特殊技', desc: 'EX 突进，追人/确反。气 ≥ 25 时由这一招接管（免费突进让位）。' },
        { name: '潮怒', input: '↓↙← + 重（50 气）', type: '必杀技', desc: '五十气 EX 终结，命中击倒。' }
      ],
      portrait: 'assets/ui/portrait_horizon.png',
      theme: '#E8752A'
    },

    {
      id: 'isolde',
      name: 'ISOLDE',
      cn: '极凝冰花·伊索尔德',
      blurb: '以寒霜控场的冰系格斗家。出手快、收招短，擅长用冰柱与寒潮逼对手先动。',
      stats: { power: 50, speed: 50, range: 50, technique: 85 },
      status: 'ready',
      skills: [
        { name: '冰爪', input: '轻', type: '普通技', desc: '最快的起手，贴身试探与接连段。' },
        { name: '霜牙', input: '重', type: '普通技', desc: '蓄力重击，命中直接把人打倒。' },
        { name: '冰刺', input: '蹲 + 轻', type: '普通技', desc: '贴地低段，能捅穿站着的防御。' },
        { name: '碎霜', input: '蹲 + 重', type: '普通技', desc: '蹲姿重击，低位击倒。' },
        { name: '空刃', input: '空中 + 轻', type: '普通技', desc: '落下的空中轻击，上段。' },
        { name: '坠霜', input: '空中 + 重', type: '普通技', desc: '空中重击，上段且击倒。' },
        { name: '霜爆', input: '↓↘→ + 轻', type: '特殊技', desc: '短距离突进，抢先手。' },
        { name: '冰锥', input: '↓↘→ + 重', type: '特殊技', desc: '中距离冰锥，逼对手动。' },
        { name: '升冰柱', input: '→↓↘ + 重', type: '特殊技', desc: '对空反击，出招带无敌。' },
        { name: '冰冲步', input: '→→ + 重', type: '特殊技', desc: '贴地冰面冲刺，位移最远。' },
        { name: '寒潮', input: '↓↙← + 轻', type: '特殊技', desc: '铺开的寒气，范围最大。' },
        { name: '极寒领域', input: '→↓↘ + 重（50 气）', type: '必杀技', desc: '五十气发动，双方定格一瞬。' },
        { name: '绝对零度', input: '↓↙← + 重（100 气）', type: '大招', desc: '满气终招，全屏白闪。' },
        { name: '冰镜', input: '→↓↘ + 轻（25 气）', type: '特殊技', desc: 'EX 对空返击，出招带无敌。' },
        { name: '霜闪', input: '→→ + 轻（25 气）', type: '特殊技', desc: 'EX 突进，追人/确反。气 ≥ 25 时由这一招接管（免费突进让位）。' },
        { name: '零界', input: '↓↙← + 重（50 气）', type: '必杀技', desc: '五十气 EX 终结，命中击倒。' }
      ],
      portrait: 'assets/ui/portrait_isolde.png',
      theme: '#4FA8FF'
    },
    {
      id: 'nameless',
      name: 'NAMELESS',
      cn: '无铭之刃·纳姆雷斯',
      blurb: '没有名字的白发刺客。出刀轻、位移快，靠短促连段逼对手先动。',
      stats: { power: 58, speed: 66, range: 62, technique: 74 },
      status: 'ready',
      skills: [
        { name: '影踢', input: '轻', type: '普通技', desc: '最快的起手，贴身试探与接连段。' },
        { name: '血拳', input: '重', type: '普通技', desc: '蓄力重击，命中直接把人打倒。' },
        { name: '赤刺', input: '蹲 + 轻', type: '普通技', desc: '贴地低段，能捅穿站着的防御。' },
        { name: '绯崩', input: '蹲 + 重', type: '普通技', desc: '蹲姿重击，低位击倒，压制起身。' },
        { name: '空刃', input: '空中 + 轻', type: '普通技', desc: '落下的空中轻击，上段，蹲着躲不掉。' },
        { name: '坠影', input: '空中 + 重', type: '普通技', desc: '空中重击，上段且击倒。' },
        { name: '影刃', input: '↓↘→ + 轻', type: '特殊技', desc: '短距离突进，抢先手。' },
        { name: '虚空波', input: '↓↘→ + 重', type: '特殊技', desc: '中距离牵制，逼对手动。' },
        { name: '升影', input: '→↓↘ + 重', type: '特殊技', desc: '对空反击，出招带无敌。' },
        { name: '影袭', input: '→→ + 重', type: '特殊技', desc: '最远位移，追人和逃跑都用它。' },
        { name: '断空', input: '↓↙← + 轻', type: '特殊技', desc: '范围最大，起手慢但躲不开。' },
        { name: '冥河斩', input: '→↓↘ + 重（50 气）', type: '必杀技', desc: '五十气发动，双方定格一瞬。' },
        { name: '终焉', input: '↓↙← + 重（100 气）', type: '大招', desc: '满气终招，全屏白闪。' }
,
        { name: '影返', input: '→↓↘ + 轻（25 气）', type: '特殊技', desc: 'EX 对空返击，出招带无敌。' },
        { name: '影跃', input: '→→ + 轻（25 气）', type: '特殊技', desc: 'EX 突进，追人/确反。气 ≥ 25 时由这一招接管（免费突进让位）。' },
        { name: '影怒', input: '↓↙← + 重（50 气）', type: '必杀技', desc: '五十气 EX 终结，命中击倒。' }
      ],
      portrait: 'assets/ui/portrait_nameless.png',
      theme: '#C9D6F2'
    },

    {
      id: 'sylvi',
      name: 'SYLVI',
      cn: '绯带剑姬·席尔维',
      blurb: '以绯红飘带为刃的剑姬。中距离牵制强，收招干净，适合打反击。',
      stats: { power: 54, speed: 64, range: 60, technique: 72 },
      status: 'ready',
      skills: [
        { name: '绯踢', input: '轻', type: '普通技', desc: '最快的起手，贴身试探与接连段。' },
        { name: '血拳', input: '重', type: '普通技', desc: '蓄力重击，命中直接把人打倒。' },
        { name: '赤刺', input: '蹲 + 轻', type: '普通技', desc: '贴地低段，能捅穿站着的防御。' },
        { name: '绯崩', input: '蹲 + 重', type: '普通技', desc: '蹲姿重击，低位击倒，压制起身。' },
        { name: '空绯', input: '空中 + 轻', type: '普通技', desc: '落下的空中轻击，上段，蹲着躲不掉。' },
        { name: '坠绯', input: '空中 + 重', type: '普通技', desc: '空中重击，上段且击倒。' },
        { name: '绯斩', input: '↓↘→ + 轻', type: '特殊技', desc: '短距离突进，抢先手。' },
        { name: '血滴', input: '↓↘→ + 重', type: '特殊技', desc: '中距离牵制，逼对手动。' },
        { name: '升绯', input: '→↓↘ + 重', type: '特殊技', desc: '对空反击，出招带无敌。' },
        { name: '绯步', input: '→→ + 重', type: '特殊技', desc: '最远位移，追人和逃跑都用它。' },
        { name: '血潮', input: '↓↙← + 轻', type: '特殊技', desc: '范围最大，起手慢但躲不开。' },
        { name: '绯红领域', input: '→↓↘ + 重（50 气）', type: '必杀技', desc: '五十气发动，双方定格一瞬。' },
        { name: '终绯', input: '↓↙← + 重（100 气）', type: '大招', desc: '满气终招，全屏白闪。' }
,
        { name: '绯返', input: '→↓↘ + 轻（25 气）', type: '特殊技', desc: 'EX 对空返击，出招带无敌。' },
        { name: '绯跃', input: '→→ + 轻（25 气）', type: '特殊技', desc: 'EX 突进，追人/确反。气 ≥ 25 时由这一招接管（免费突进让位）。' },
        { name: '绯怒', input: '↓↙← + 重（50 气）', type: '必杀技', desc: '五十气 EX 终结，命中击倒。' }
      ],
      portrait: 'assets/ui/portrait_sylvi.png',
      theme: '#E0526B'
    },

    {
      id: 'ikaria',
      name: 'IKARIA',
      cn: '苍翼猎手·伊卡莉亚',
      blurb: '借风起势的空中猎手。移动与跳跃最快，靠空战和突进撕开防线。',
      stats: { power: 50, speed: 72, range: 55, technique: 76 },
      status: 'ready',
      skills: [
        { name: '风踢', input: '轻', type: '普通技', desc: '最快的起手，贴身试探与接连段。' },
        { name: '苍拳', input: '重', type: '普通技', desc: '蓄力重击，命中直接把人打倒。' },
        { name: '风刺', input: '蹲 + 轻', type: '普通技', desc: '贴地低段，能捅穿站着的防御。' },
        { name: '苍崩', input: '蹲 + 重', type: '普通技', desc: '蹲姿重击，低位击倒，压制起身。' },
        { name: '空风', input: '空中 + 轻', type: '普通技', desc: '落下的空中轻击，上段，蹲着躲不掉。' },
        { name: '坠风', input: '空中 + 重', type: '普通技', desc: '空中重击，上段且击倒。' },
        { name: '苍爪', input: '↓↘→ + 轻', type: '特殊技', desc: '短距离突进，抢先手。' },
        { name: '风弹', input: '↓↘→ + 重', type: '特殊技', desc: '中距离牵制，逼对手动。' },
        { name: '升风', input: '→↓↘ + 重', type: '特殊技', desc: '对空反击，出招带无敌。' },
        { name: '疾风', input: '→→ + 重', type: '特殊技', desc: '最远位移，追人和逃跑都用它。' },
        { name: '风墙', input: '↓↙← + 轻', type: '特殊技', desc: '范围最大，起手慢但躲不开。' },
        { name: '苍空', input: '→↓↘ + 重（50 气）', type: '必杀技', desc: '五十气发动，双方定格一瞬。' },
        { name: '终风', input: '↓↙← + 重（100 气）', type: '大招', desc: '满气终招，全屏白闪。' }
,
        { name: '风返', input: '→↓↘ + 轻（25 气）', type: '特殊技', desc: 'EX 对空返击，出招带无敌。' },
        { name: '风跃', input: '→→ + 轻（25 气）', type: '特殊技', desc: 'EX 突进，追人/确反。气 ≥ 25 时由这一招接管（免费突进让位）。' },
        { name: '风怒', input: '↓↙← + 重（50 气）', type: '必杀技', desc: '五十气 EX 终结，命中击倒。' }
      ],
      portrait: 'assets/ui/portrait_ikaria.png',
      theme: '#9B6BFF'
    }
  ],

  /* ==========================================================================
   * 界面文案
   * ==========================================================================*/
  menus: {
    title: 'Scrap Arena',
    subtitle: '夜厂区 · 同屏双人对战',

    /* 主菜单项。id 供引擎做状态跳转，label/hint 是最终稿。 */
    items: [
      { id: 'battle',     label: '对战开始', en: 'VS BATTLE',  hint: '选人 → 选图 → 开打' },
      { id: 'characters', label: '角色选择', en: 'FIGHTERS',  hint: '看招式表与四维' },
      { id: 'stages',     label: '地图选择', en: 'STAGES',     hint: '两张夜场，一张暖一张冷' },
      { id: 'controls',   label: '操作说明', en: 'CONTROLS',   hint: '键位、方向指令与出招表' },
      { id: 'audio',      label: '音效设置', en: 'AUDIO',      hint: '总音量与打击音开关' }
    ],

    /* 各界面的标题与底部提示。 */
    screens: {
      menu: {
        title: 'Scrap Arena',
        foot: '↑↓ 选择 · Enter 确认 · Esc 返回'
      },
      select: {
        title: '角色选择',
        titleEn: 'SELECT YOUR FIGHTER',
        // ↑↓ 换玩家（P1/P2 指示条）· ←→ 换角色 —— 与 shell/ui.js 的 stepSelect 实现一致
        foot: '←→ 换角色 · ↑↓ 换玩家 · Enter 确认 · Esc 返回',
        // {names} = 本轮 status === 'ready' 的角色名（逗号分隔）。引擎做替换。
        // 本轮只有一个可实装角色（horizon），所以 rosterNote 只会渲染出她一个名字 ——
        // 明确写出来，别让玩家以为选人页是坏了。
        rosterNote: '本轮可对战角色：{names}',
        rosterNoteEn: 'PLAYABLE THIS ROUND: {names}',
        mirrorHint: '双方可选同一角色',
        // 四维关键词说明。**两处用同一份文案**：
        //   1. 每条属性条标签的 title（悬停看完整解释，兜底）
        //   2. 角色名下面那一行合并说明（玩家平时真正看得见的那份）
        // 格式统一为「维度名 = 这条数字到底量的是什么」——
        // 合并成一行时只取 "=" 右边那半（维度名由旁边的属性条自带），
        // 拆开规则在 shell/ui.js 的 statSummary() 里，两边共用同一份文案。
        //
        // 措辞说明：这四句描述的是**这一轴量的是什么**，不是"这个角色有多强"——
        // 同一份文案要同时用在五个角色身上，所以不能写成对某个角色的评价。
        //
        // 技巧这一条：关键词里**不要写"控场"**。
        // 公式里确实有"远程控场"那 20 分（手段分），但它对两个角色**完全一样**
        // （都是 100 手段分），解释不了 79 与 85 的差别。净差 6.32 分的分解是：
        //   效率分 0.40×(75.0−57.7) = +6.92   ← 差距的 109%
        //   变化分 0.20×(97.0−100.0) = −0.60
        //   手段分 / 容量分对两人都是 0 贡献
        // 也就是说这一轴真正量的是"招式多不多、收招快不快"；写成"控场"，
        // 就是在教玩家一个错误的读法（以为高分 = 那一类控制力强）。
        statNotes: {
          power:     '威力 = 重击有多疼',
          speed:     '速度 = 出手与移动有多快',
          range:     '射程 = 能打到多远的地方',
          technique: '技巧 = 招式多不多、收招快不快'
        },
        // 在占位角色上按 Enter 时的提示（光标可以停上去看资料，但不能选中）
        // {name} 统一用**中文名**（c.cn）—— 中文句子里夹英文代号读着别扭。
        placeholderToast: '{name}的招式表还没做完，暂时不能上场'
      },
      stage: {
        title: '地图选择',
        titleEn: 'SELECT STAGE',
        foot: '←→ 切换地图 · Enter 确认 · Esc 返回',
        // 两人选了同一个角色时，顶部显示这一行。{name} = 那个角色名（中文名 c.cn）。
        // 用冒号分隔，不要用空格 —— 中文与中文之间加空格不合排版习惯。
        mirrorNote: '双方都选了同一个角色：{name}'
      },
      controls: {
        title: '操作说明',
        titleEn: 'CONTROLS',
        foot: 'Esc 返回'
      },
      audio: {
        title: '音效设置',
        titleEn: 'AUDIO',
        foot: '←→ 调整 · Enter 确认 · Esc 返回'
      },
      battle: {
        ready: '准备',
        go: '开战',
        round: '第 {n} 回合',
        timeOver: '时间到',
        draw: '平局'
      },
      result: {
        title: '结算',
        win: '{name} 胜',
        lose: '{name} 负',
        draw: '平局，再打一场',
        foot: 'R 再来一场 · Esc 返回主菜单'
      }
    },

    /* 结算页的逐项文案。 */
    result: {
      scoreLabel: '比分',
      timeLabel: '用时',
      comboLabel: '最高连击',
      rematch: '再来一场',
      backToMenu: '返回主菜单'
    },

    /* 难度描述词库，1~5 各一句，≤ 24 字。地图扩到五张时直接取用。 */
    difficultyCopy: [
      { level: 1, label: '试炼', desc: '老手两步就热身的空场。' },
      { level: 2, label: '入门', desc: '空旷开阔，适合练连段。' },
      { level: 3, label: '标准', desc: '难度居中，中规中矩的一场。' },
      { level: 4, label: '高难', desc: '空间逼仄，容错压得很低。' },
      { level: 5, label: '极难', desc: '炉温与霜气都不留情面。' }
    ]
  }
};
