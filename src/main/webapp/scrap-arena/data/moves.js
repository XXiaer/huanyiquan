/* ============================================================================
 * Scrap Arena · 招式帧数据（按角色）
 * ---------------------------------------------------------------------------
 * 沿用引擎原有的两张表（CONFIG.MOVE / HITBOXES）的字段含义，只是按角色分了桶：
 *
 *   MOVES[cid][moveId]    帧数据
 *     startup   启动帧数（出招到判定生效前）
 *     active    判定生效帧数
 *     recovery  收招帧数
 *     startup + active + recovery 必须等于 plan 之和，也等于动画总帧数
 *     dmg       伤害（会乘以连击递减系数）
 *     hitstun   命中硬直 / blockstun 防御硬直
 *     push      击退距离 / pushFrames 击退持续帧
 *     hitstop   命中顿帧 / blockstop 防御顿帧
 *     knockdown 被击倒帧数（0 = 不击倒）
 *     isLow     下段（能打蹲）/ isOverhead 上段（跳不过去）
 *     action    该招式用的 MUGEN 动作编号（美术侧引用）
 *     plan      每个精灵图占几个逻辑帧，长度必须等于该动作的精灵帧数
 *     hit       判定生效的逻辑帧区间（1 基，闭区间）
 *
 *   HITBOXES[cid][moveId]  每个判定帧一个框
 *     f  逻辑帧号（1 基）
 *     x  近端距角色锚点的前向距离（向前 = 角色朝向）
 *     y  框底距地面的高度（向上为正）
 *     w  宽（沿前向）/ h 高
 *     坐标以"世界身高 300"为基准，运行时按角色身高等比缩放
 * ==========================================================================*/
window.MOVES = {

  /* ================= 潮汐澜影·赫莱森 ================= */
  horizon: {
    /* —— 普通攻击 —— */
    light: {
      startup: 4, active: 3, recovery: 11, total: 18,
      dmg: 40, hitstun: 12, blockstun: 8, push: 3, pushFrames: 4,
      hitstop: 4, blockstop: 3, knockdown: 0, isLow: false, isOverhead: false,
      action: 230, plan: [2, 1, 4, 3, 3, 5], hit: [5, 7],
      sfx: 'hitLight'
    },
    heavy: {
      startup: 10, active: 6, recovery: 5, total: 21,
      dmg: 90, hitstun: 18, blockstun: 12, push: 5, pushFrames: 6,
      hitstop: 8, blockstop: 3, knockdown: 40, isLow: false, isOverhead: false,
      action: 200, plan: [2, 2, 1, 2, 2, 2, 6, 2, 2], hit: [11, 16],
      sfx: 'hitHeavy'
    },
    clight: {
      startup: 4, active: 3, recovery: 6, total: 13,
      dmg: 35, hitstun: 12, blockstun: 8, push: 3, pushFrames: 4,
      hitstop: 4, blockstop: 3, knockdown: 0, isLow: true, isOverhead: false,
      action: 400, plan: [2, 2, 5, 2, 2], hit: [5, 7],
      sfx: 'hitLight'
    },
    cheavy: {
      startup: 8, active: 5, recovery: 7, total: 20,
      dmg: 70, hitstun: 16, blockstun: 11, push: 4, pushFrames: 5,
      hitstop: 6, blockstop: 3, knockdown: 26, isLow: true, isOverhead: false,
      action: 430, plan: [3, 2, 4, 4, 3, 2, 2], hit: [9, 13],
      sfx: 'hitHeavy'
    },
    jlight: {
      startup: 4, active: 4, recovery: 5, total: 13,
      dmg: 40, hitstun: 12, blockstun: 8, push: 3, pushFrames: 4,
      hitstop: 4, blockstop: 3, knockdown: 0, isLow: false, isOverhead: true,
      action: 600, plan: [2, 2, 4, 5], hit: [5, 8],
      sfx: 'hitLight'
    },
    jheavy: {
      startup: 15, active: 8, recovery: 4, total: 27,
      dmg: 90, hitstun: 18, blockstun: 12, push: 5, pushFrames: 6,
      hitstop: 8, blockstop: 3, knockdown: 34, isLow: false, isOverhead: true,
      action: 610, plan: [3, 2, 10, 4, 4, 4], hit: [16, 23],
      sfx: 'hitHeavy'
    },

    /* —— 特殊技 —— */
    // 潮汐斩：QCF+轻。突进中段，起手 8 帧，出手范围比普通技长
    sp_slash: {
      startup: 8, active: 8, recovery: 5, total: 21,
      dmg: 55, hitstun: 14, blockstun: 9, push: 5, pushFrames: 5,
      hitstop: 5, blockstop: 3, knockdown: 0, isLow: false, isOverhead: false,
      action: 310, plan: [2, 5, 5, 5, 2, 2], hit: [9, 16],
      sfx: 'water', lunge: 3.2
    },
    // 聚潮珠：QCF+重。远程水球，判定在身前
    sp_orb: {
      startup: 6, active: 6, recovery: 9, total: 21,
      dmg: 60, hitstun: 15, blockstun: 10, push: 4, pushFrames: 5,
      hitstop: 5, blockstop: 3, knockdown: 0, isLow: false, isOverhead: false,
      action: 290, plan: [1, 1, 1, 1, 1, 1, 5, 4, 2, 2, 2], hit: [7, 12],
      sfx: 'water'
    },
    // 升潮柱：DP+重。上升水柱，出招全程无敌，对空专用
    sp_rise: {
      startup: 7, active: 15, recovery: 11, total: 33,
      dmg: 80, hitstun: 20, blockstun: 12, push: 4, pushFrames: 6,
      hitstop: 8, blockstop: 4, knockdown: 30, isLow: false, isOverhead: false,
      action: 21200, plan: [1, 1, 1, 1, 1, 1, 1, 10, 5, 5, 2, 2, 2], hit: [8, 22],
      sfx: 'water', invincible: true, rise: -13.5
    },
    // 浪奔：→→+重。地面冲刺，位移大
    sp_dash: {
      startup: 6, active: 14, recovery: 6, total: 26,
      dmg: 70, hitstun: 18, blockstun: 11, push: 6, pushFrames: 6,
      hitstop: 7, blockstop: 3, knockdown: 24, isLow: false, isOverhead: false,
      action: 249, plan: [2, 2, 2, 2, 2, 2, 2, 4, 4, 2, 2], hit: [7, 20],
      sfx: 'water', lunge: 9.6
    },
    // 长浪：HCF+轻。大浪突进，范围最大
    sp_wave: {
      startup: 10, active: 18, recovery: 9, total: 37,
      dmg: 90, hitstun: 20, blockstun: 13, push: 7, pushFrames: 7,
      hitstop: 9, blockstop: 4, knockdown: 36, isLow: false, isOverhead: false,
      action: 240, plan: [1, 2, 2, 3, 8, 1, 1, 1, 8, 2, 4, 4], hit: [11, 28],
      sfx: 'water', lunge: 4.5
    },

    /* —— 必杀技 —— */
    // 深渊潮汐：HCF+重，50 气。整场大浪
    super_tide: {
      startup: 8, active: 18, recovery: 6, total: 32,
      dmg: 140, hitstun: 24, blockstun: 16, push: 8, pushFrames: 8,
      hitstop: 12, blockstop: 5, knockdown: 46, isLow: false, isOverhead: false,
      action: 21300, plan: [1, 1, 1, 1, 1, 1, 4, 3, 2, 2, 1, 2, 1, 4, 3, 4], hit: [9, 26],
      sfx: 'ko', superFreeze: 40, lunge: 2.0
    },

    /* —— 大招 —— */
    // 终潮：HCF+重，满 100 气。末帧 50 tick 的长 hold 在这里压到 12，
    // 否则大招收招会有将近一秒的空窗
    final_tide: {
      startup: 8, active: 16, recovery: 12, total: 36,
      dmg: 200, hitstun: 28, blockstun: 18, push: 9, pushFrames: 9,
      hitstop: 14, blockstop: 6, knockdown: 60, isLow: false, isOverhead: false,
      action: 25300, plan: [5, 3, 12, 6, 10], hit: [9, 24],
      sfx: 'superFlash', superFreeze: 60, screenFlash: true
    }
  }
};

/* ============================================================================
 * 判定框：与 MOVES 一一对应
 * ==========================================================================*/
window.HITBOXES = {

  horizon: {
    /* ------------------------------------------------------------------
     * 【2026-10 · 判定框按"看得见的攻击部位"标定】
     *
     * 以前判定框是"数据表 + 引擎自动拉伸"，两种错法同时存在：
     *   · light 是高踢腿，脚尖在 146px，判定却只到 88px —— 玩家看到脚踢到
     *     对手身上却没打中（"够不着"）。
     *   · heavy 是直拳，拳头只到 68px，判定却伸到 110px —— 拳头没到却判定
     *     命中（"打空气"）。
     * 现在判定框由数据表说了算（数据表是**下限**），所以数据表必须自己写对：
     * 远边要落在伸出去的手/脚上。
     *
     * 口径：远边(单位) = ceil(攻击部位外沿(世界px) / 1.05 / hitboxScale)
     *   引擎 visualHitboxEntry 会把数据远边当下限，最多往上多给 5%，
     *   所以按这个公式定，实得判定正好压在攻击部位上（误差 < 1px）。
     *   攻击部位外沿 = hit 窗口内逐帧的**亮像素**最右端（近黑的斗篷/长发
     *   不算攻击部位 —— 那是布料，不是拳头）。
     *
     * 【只改 w，不动 x】近端一律不动，只把远边推出去。
     * ------------------------------------------------------------------ */
    light: [
      /* 高踢腿。脚尖 146px（素材帧 3 的最右亮像素）。
         远边 205 = ceil(146 / 1.05 / 0.68) → 实得判定 146.4px */
      { f: 5, x: 70, y: 150, w: 135, h: 90 },
      { f: 6, x: 72, y: 150, w: 133, h: 90 },
      { f: 7, x: 70, y: 150, w: 135, h: 90 }
    ],
    heavy: [
      /* 直拳。判定窗口(st 10~16) 显示的是素材帧 6/7，拳头只到 68px
         （96px 那个是**起手帧**，不在判定窗口里）。
         远边 94 = ceil(68 / 1.05 / 0.7034) → 实得判定 69.4px。
         原来远边 156（实得 110px）比拳头长 42px —— 拳头没到却打中。 */
      { f: 11, x: 74, y: 140, w: 20, h: 126 },
      { f: 12, x: 78, y: 140, w: 16, h: 130 },
      { f: 13, x: 78, y: 140, w: 16, h: 130 },
      { f: 14, x: 78, y: 140, w: 16, h: 130 },
      { f: 15, x: 76, y: 140, w: 18, h: 126 },
      { f: 16, x: 72, y: 140, w: 22, h: 120 }
    ],
    clight: [
      /* 蹲轻。手 116px。远边 163 = ceil(116 / 1.05 / 0.68) → 实得 116.4px */
      { f: 5, x: 66, y: 60, w: 97, h: 70 },
      { f: 6, x: 68, y: 60, w: 95, h: 70 },
      { f: 7, x: 66, y: 60, w: 97, h: 70 }
    ],
    cheavy: [
      /* 蹲重。攻击部位 120px。远边 169 = ceil(120 / 1.05 / 0.68) → 实得 120.7px。
         （注意：蹲重不吃 heavyReach 加成 —— 引擎只对 moveId==='heavy' 乘它。） */
      { f: 9,  x: 62, y: 50, w: 107, h: 86 },
      { f: 10, x: 64, y: 50, w: 105, h: 90 },
      { f: 11, x: 64, y: 50, w: 105, h: 90 },
      { f: 12, x: 62, y: 50, w: 107, h: 86 },
      { f: 13, x: 58, y: 50, w: 111, h: 80 }
    ],
    jlight: [
      /* 跳轻。脚 82px。远边 115 = ceil(82 / 1.05 / 0.68) → 实得 82.1px */
      { f: 5, x: 56, y: 110, w: 59, h: 88 },
      { f: 6, x: 58, y: 110, w: 57, h: 88 },
      { f: 7, x: 58, y: 110, w: 57, h: 88 },
      { f: 8, x: 56, y: 110, w: 59, h: 88 }
    ],
    jheavy: [
      /* 跳重。攻击部位 54px。
         【唯一一条"素材的攻击部位比点身下限还短"的招】
         跳重的攻击是**往下砸**，攻击部位在身前偏下 —— 横向只到 54px，
         而对手被推挤到贴脸时（最小推挤间距 94px − 对手 hurtbox 最近边 31px）
         判定必须够到 61px 才打得到人。够不到的后果不是"少打一点"，
         而是**这一招永远打不中、命中音永远不响**（tests/browser/test_audio.js
         的 C2b 守的就是这条）。
         所以这里取两者里更大的那个：远边 91 单位（实得 61.9px），
         比攻击部位多 7.9px —— 用"多打几像素空气"换"这一招能用"。
         （原来远边 126，比攻击部位多 31px 空气，那才是浪费。） */
      { f: 16, x: 54, y: 60, w: 37, h: 136 },
      { f: 17, x: 56, y: 60, w: 35, h: 140 },
      { f: 18, x: 56, y: 60, w: 35, h: 140 },
      { f: 19, x: 56, y: 60, w: 35, h: 140 },
      { f: 20, x: 54, y: 60, w: 37, h: 136 },
      { f: 21, x: 52, y: 60, w: 39, h: 128 },
      { f: 22, x: 50, y: 60, w: 41, h: 120 },
      { f: 23, x: 48, y: 60, w: 43, h: 112 }
    ],
    sp_slash: [
      { f: 9,  x: 60, y: 120, w: 74, h: 106 },
      { f: 10, x: 64, y: 120, w: 78, h: 110 },
      { f: 11, x: 64, y: 120, w: 78, h: 110 },
      { f: 12, x: 64, y: 120, w: 78, h: 110 },
      { f: 13, x: 62, y: 120, w: 76, h: 108 },
      { f: 14, x: 60, y: 120, w: 74, h: 106 },
      { f: 15, x: 58, y: 120, w: 70, h: 100 },
      { f: 16, x: 56, y: 120, w: 66, h: 96 }
    ],
    sp_orb: [
      { f: 7,  x: 40, y: 130, w: 48, h: 58 },
      { f: 8,  x: 42, y: 130, w: 52, h: 58 },
      { f: 9,  x: 42, y: 130, w: 52, h: 58 },
      { f: 10, x: 42, y: 130, w: 52, h: 58 },
      { f: 11, x: 40, y: 130, w: 48, h: 58 },
      { f: 12, x: 38, y: 130, w: 44, h: 58 }
    ],
    sp_rise: [
      { f: 8,  x: 38, y: 0,  w: 84, h: 300 },
      { f: 9,  x: 38, y: 0,  w: 88, h: 300 },
      { f: 10, x: 38, y: 0,  w: 90, h: 300 },
      { f: 11, x: 38, y: 0,  w: 90, h: 300 },
      { f: 12, x: 38, y: 0,  w: 90, h: 300 },
      { f: 13, x: 38, y: 0,  w: 90, h: 300 },
      { f: 14, x: 36, y: 0,  w: 88, h: 300 },
      { f: 15, x: 36, y: 0,  w: 86, h: 300 },
      { f: 16, x: 34, y: 0,  w: 84, h: 290 },
      { f: 17, x: 32, y: 0,  w: 80, h: 270 },
      { f: 18, x: 30, y: 0,  w: 76, h: 250 },
      { f: 19, x: 28, y: 0,  w: 72, h: 230 },
      { f: 20, x: 26, y: 0,  w: 68, h: 210 },
      { f: 21, x: 24, y: 0,  w: 64, h: 190 },
      { f: 22, x: 22, y: 0,  w: 60, h: 170 }
    ],
    sp_dash: [
      { f: 7,  x: 58, y: 100, w: 80, h: 116 },
      { f: 8,  x: 60, y: 100, w: 84, h: 120 },
      { f: 9,  x: 60, y: 100, w: 84, h: 120 },
      { f: 10, x: 60, y: 100, w: 84, h: 120 },
      { f: 11, x: 60, y: 100, w: 84, h: 120 },
      { f: 12, x: 60, y: 100, w: 84, h: 120 },
      { f: 13, x: 58, y: 100, w: 82, h: 118 },
      { f: 14, x: 58, y: 100, w: 82, h: 118 },
      { f: 15, x: 58, y: 100, w: 82, h: 118 },
      { f: 16, x: 56, y: 100, w: 78, h: 114 },
      { f: 17, x: 54, y: 100, w: 74, h: 110 },
      { f: 18, x: 52, y: 100, w: 70, h: 106 },
      { f: 19, x: 50, y: 100, w: 66, h: 100 },
      { f: 20, x: 48, y: 100, w: 62, h: 96 }
    ],
    sp_wave: [
      { f: 11, x: 66, y: 90,  w: 92,  h: 136 },
      { f: 12, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 13, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 14, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 15, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 16, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 17, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 18, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 19, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 20, x: 68, y: 90,  w: 96,  h: 140 },
      { f: 21, x: 66, y: 90,  w: 94,  h: 138 },
      { f: 22, x: 66, y: 90,  w: 94,  h: 138 },
      { f: 23, x: 66, y: 90,  w: 94,  h: 138 },
      { f: 24, x: 64, y: 90,  w: 92,  h: 134 },
      { f: 25, x: 64, y: 90,  w: 92,  h: 134 },
      { f: 26, x: 62, y: 90,  w: 90,  h: 130 },
      { f: 27, x: 60, y: 90,  w: 86,  h: 124 },
      { f: 28, x: 58, y: 90,  w: 82,  h: 118 }
    ],
    super_tide: [
      { f: 9,  x: 56, y: 40, w: 104, h: 210 },
      { f: 10, x: 58, y: 40, w: 108, h: 214 },
      { f: 11, x: 58, y: 40, w: 110, h: 216 },
      { f: 12, x: 58, y: 40, w: 110, h: 216 },
      { f: 13, x: 58, y: 40, w: 110, h: 216 },
      { f: 14, x: 58, y: 40, w: 110, h: 216 },
      { f: 15, x: 58, y: 40, w: 110, h: 216 },
      { f: 16, x: 58, y: 40, w: 110, h: 216 },
      { f: 17, x: 56, y: 40, w: 108, h: 214 },
      { f: 18, x: 56, y: 40, w: 108, h: 214 },
      { f: 19, x: 56, y: 40, w: 108, h: 214 },
      { f: 20, x: 56, y: 40, w: 108, h: 214 },
      { f: 21, x: 54, y: 40, w: 104, h: 208 },
      { f: 22, x: 54, y: 40, w: 104, h: 208 },
      { f: 23, x: 52, y: 40, w: 100, h: 204 },
      { f: 24, x: 52, y: 40, w: 100, h: 204 },
      { f: 25, x: 50, y: 40, w: 96,  h: 196 },
      { f: 26, x: 48, y: 40, w: 92,  h: 188 }
    ],
    final_tide: [
      { f: 9,  x: 48, y: 0, w: 124, h: 300 },
      { f: 10, x: 50, y: 0, w: 128, h: 300 },
      { f: 11, x: 50, y: 0, w: 130, h: 300 },
      { f: 12, x: 50, y: 0, w: 130, h: 300 },
      { f: 13, x: 50, y: 0, w: 130, h: 300 },
      { f: 14, x: 50, y: 0, w: 130, h: 300 },
      { f: 15, x: 50, y: 0, w: 130, h: 300 },
      { f: 16, x: 50, y: 0, w: 130, h: 300 },
      { f: 17, x: 48, y: 0, w: 126, h: 290 },
      { f: 18, x: 48, y: 0, w: 126, h: 290 },
      { f: 19, x: 48, y: 0, w: 126, h: 290 },
      { f: 20, x: 46, y: 0, w: 122, h: 280 },
      { f: 21, x: 46, y: 0, w: 122, h: 280 },
      { f: 22, x: 44, y: 0, w: 118, h: 270 },
      { f: 23, x: 42, y: 0, w: 114, h: 260 },
      { f: 24, x: 40, y: 0, w: 110, h: 250 }
    ]
  }
};

/* ============================================================================
 * 第三批角色：从素材库接入的 Nameless / Sylvi / Ikaria
 * ---------------------------------------------------------------------------
 * 他们共用赫莱森的动作节奏（startup/active/recovery、伤害、判定框形状），
 * 但每个角色映射到自己的 MUGEN 动作号；plan 按各自动作的帧数重新分布。
 * 这样不会因为某个角色的动作帧比赫莱森少而构建失败。
 * ==========================================================================*/
/* ROSTER-EXTRA-BEGIN */
(function () {
  function planFor(n, total) {
    if (n <= 0) return [];
    if (n >= total) return new Array(total).fill(1);
    const out = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.max(1, Math.floor((total - acc) / (n - i)));
      out.push(v);
      acc += v;
    }
    // 最后一项吸收余数，保证 plan 总和 == 招式总帧数
    out[out.length - 1] += total - acc;
    return out;
  }

  function add(cid, actions, counts) {
    const src = window.MOVES.horizon;
    const baseHb = window.HITBOXES.horizon;
    const out = {};
    Object.keys(src).forEach(function (id) {
      const mv = Object.assign({}, src[id]);
      mv.action = actions[id];
      const total = mv.startup + mv.active + mv.recovery;
      mv.plan = planFor(counts[id] || 0, total);
      out[id] = mv;
    });
    window.MOVES[cid] = out;
    window.HITBOXES[cid] = JSON.parse(JSON.stringify(baseHb));
  }

  add('nameless', {
    light: 230, heavy: 200, clight: 400, cheavy: 430,
    jlight: 600, jheavy: 610,
    sp_slash: 1000, sp_orb: 1100, sp_rise: 1200, sp_dash: 1001, sp_wave: 1050,
    super_tide: 2000, final_tide: 3000
  }, {
    light: 6, heavy: 5, clight: 5, cheavy: 5, jlight: 5, jheavy: 13,
    sp_slash: 17, sp_orb: 20, sp_rise: 8, sp_dash: 16, sp_wave: 23,
    super_tide: 28, final_tide: 28
  });

  add('sylvi', {
    light: 230, heavy: 200, clight: 400, cheavy: 430,
    jlight: 600, jheavy: 610,
    sp_slash: 1000, sp_orb: 1100, sp_rise: 1200, sp_dash: 1250, sp_wave: 1050,
    super_tide: 2000, final_tide: 3000
  }, {
    light: 5, heavy: 5, clight: 5, cheavy: 6, jlight: 18, jheavy: 19,
    sp_slash: 19, sp_orb: 10, sp_rise: 24, sp_dash: 11, sp_wave: 13,
    super_tide: 32, final_tide: 8
  });

  add('ikaria', {
    light: 230, heavy: 200, clight: 230, cheavy: 200,
    jlight: 600, jheavy: 610,
    sp_slash: 1000, sp_orb: 1100, sp_rise: 1200, sp_dash: 1001, sp_wave: 1050,
    super_tide: 2000, final_tide: 3000
  }, {
    light: 4, heavy: 5, clight: 4, cheavy: 5, jlight: 3, jheavy: 16,
    sp_slash: 21, sp_orb: 10, sp_rise: 25, sp_dash: 8, sp_wave: 11,
    super_tide: 31, final_tide: 41
  });
})();
/* ROSTER-EXTRA-END */

/* ============================================================================
 * EX 技能 / Isolde 招式桶
 * ---------------------------------------------------------------------------
 * 每个角色追加 3 个技能：EX 对空、EX 突进、50 气 EX 终结。
 * Isolde 从占位转为完整 13 招 + 3 EX。
 * ==========================================================================*/
/* EX-SKILLS-BEGIN */
(function () {
  function planFor(n, total) {
    if (n <= 0) return [];
    if (n >= total) return new Array(total).fill(1);
    const out = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.max(1, Math.floor((total - acc) / (n - i)));
      out.push(v);
      acc += v;
    }
    out[out.length - 1] += total - acc;
    return out;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function addMove(cid, id, baseId, action, count) {
    if (!window.MOVES[cid]) window.MOVES[cid] = {};
    if (!window.HITBOXES[cid]) window.HITBOXES[cid] = {};
    const mv = Object.assign({}, window.MOVES[cid][baseId] || window.MOVES.horizon[baseId]);
    mv.action = action;
    mv.plan = planFor(count, mv.startup + mv.active + mv.recovery);
    window.MOVES[cid][id] = mv;
    window.HITBOXES[cid][id] = clone(window.HITBOXES.horizon[baseId] || []);
  }

  // Isolde：标准 13 招
  if (!window.MOVES.isolde) {
    const actions = {
      light: 230, heavy: 200, clight: 400, cheavy: 430,
      jlight: 600, jheavy: 610,
      sp_slash: 1000, sp_orb: 1100, sp_rise: 1200, sp_dash: 1250, sp_wave: 1050,
      super_tide: 2000, final_tide: 3000
    };
    const counts = {
      light: 12, heavy: 6, clight: 5, cheavy: 7, jlight: 5, jheavy: 6,
      sp_slash: 10, sp_orb: 11, sp_rise: 14, sp_dash: 9, sp_wave: 7,
      super_tide: 11, final_tide: 11
    };
    const out = {};
    Object.keys(window.MOVES.horizon).forEach(function (id) {
      const mv = Object.assign({}, window.MOVES.horizon[id]);
      mv.action = actions[id];
      mv.plan = planFor(counts[id] || 0, mv.startup + mv.active + mv.recovery);
      out[id] = mv;
    });
    window.MOVES.isolde = out;
    window.HITBOXES.isolde = clone(window.HITBOXES.horizon);
  }

  const ex = {
    sp_dp_light:  { base: 'sp_rise',  action: { horizon: 3100, isolde: 3100, nameless: 3100, sylvi: 3100, ikaria: 3100 },
                    count:  { horizon: 8, isolde: 11, nameless: 18, sylvi: 13, ikaria: 24 } },
    sp_dash_light:{ base: 'sp_dash',  action: { horizon: 1001, isolde: 1250, nameless: 1001, sylvi: 1250, ikaria: 1001 },
                    count:  { horizon: 8, isolde: 9, nameless: 16, sylvi: 11, ikaria: 8 } },
    sp_qcb_heavy: { base: 'sp_wave',  action: { horizon: 1002, isolde: 1255, nameless: 1002, sylvi: 1055, ikaria: 1055 },
                    count:  { horizon: 10, isolde: 19, nameless: 17, sylvi: 16, ikaria: 17 } }
  };
  ['horizon', 'isolde', 'nameless', 'sylvi', 'ikaria'].forEach(function (cid) {
    Object.keys(ex).forEach(function (id) {
      const e = ex[id];
      addMove(cid, id, e.base, e.action[cid], e.count[cid]);
    });
  });
})();
/* EX-SKILLS-END */


/* ============================================================================
 * NEAR-REACH-BEGIN · 近身肢体招判定框（逐角色显式值）
 * ---------------------------------------------------------------------------
 * 【为什么每个角色一套数】
 * 五个角色的体型、斗篷、发长、手臂长短都不一样，同一个数值必然有角色
 * 打空气、另一个够不着。所以这里是**逐角色显式写死**的判定框，
 * 不是从别处算出来的。
 *
 * 【口径（同 horizon 主表）】
 *   远边(单位) = ceil(攻击部位外沿(世界px) / 1.05 / hitboxScale)
 *     · 攻击部位外沿 = hit 窗口内逐帧的**亮像素**最右端
 *       （alpha>=40 且 rgb 和>=60 —— 近黑的斗篷/长发/裙摆不算攻击部位，
 *        那是布料，不是伸出去的手/脚）
 *     · hitboxScale = def.h/300，moveId==='heavy' 时再乘 heavyReach/145
 *   引擎 visualHitboxEntry 把数据远边当**下限**，最多往上多给 5%，
 *   所以按上式取，实得判定正好压在攻击部位上。
 *   近端 x 一律沿用主表（不动）。
 *
 * 【各角色的攻击部位外沿（世界像素）】
 *   isolde  light 132 / heavy 144 / clight 116 / cheavy 116 / jlight 82 / jheavy 56
 *   nameless light 156 / heavy 100 / clight 102 / cheavy 152 / jlight 110 / jheavy 112
 *   sylvi   light 102 / heavy 102 / clight  84 / cheavy 126 / jlight  82 / jheavy  52
 *   ikaria  light 202 / heavy 128 / clight 206 / cheavy 128 / jlight 102 / jheavy 124
 *
 * 【两处为了让引擎自带的 cell 口径护栏也变绿而做的微调（都在 ±2px 内）】
 *   sylvi/light  129 → 131（+1.6px）：129 会让护栏差 0.96px
 *   horizon/heavy 93 → 94（+1.5px）：93 会让护栏差 0.31px
 * ==========================================================================*/
(function () {
  'use strict';

  /* ---- isolde：剑姬，近端一样，手臂更长 ---- */
  window.HITBOXES.isolde.light = [
    { f: 5, x: 70, y: 150, w: 115, h: 90 },
    { f: 6, x: 72, y: 150, w: 113, h: 90 },
    { f: 7, x: 70, y: 150, w: 115, h: 90 }
  ];
  window.HITBOXES.isolde.heavy = [
    { f: 11, x: 74, y: 140, w: 128, h: 126 },
    { f: 12, x: 78, y: 140, w: 124, h: 130 },
    { f: 13, x: 78, y: 140, w: 124, h: 130 },
    { f: 14, x: 78, y: 140, w: 124, h: 130 },
    { f: 15, x: 76, y: 140, w: 126, h: 126 },
    { f: 16, x: 72, y: 140, w: 130, h: 120 }
  ];
  window.HITBOXES.isolde.clight = [
    { f: 5, x: 66, y: 60, w: 97, h: 70 },
    { f: 6, x: 68, y: 60, w: 95, h: 70 },
    { f: 7, x: 66, y: 60, w: 97, h: 70 }
  ];
  window.HITBOXES.isolde.cheavy = [
    { f: 9,  x: 62, y: 50, w: 101, h: 86 },
    { f: 10, x: 64, y: 50, w: 99, h: 90 },
    { f: 11, x: 64, y: 50, w: 99, h: 90 },
    { f: 12, x: 62, y: 50, w: 101, h: 86 },
    { f: 13, x: 58, y: 50, w: 105, h: 80 }
  ];
  window.HITBOXES.isolde.jlight = [
    { f: 5, x: 56, y: 110, w: 59, h: 88 },
    { f: 6, x: 58, y: 110, w: 57, h: 88 },
    { f: 7, x: 58, y: 110, w: 57, h: 88 },
    { f: 8, x: 56, y: 110, w: 59, h: 88 }
  ];
  window.HITBOXES.isolde.jheavy = [
    { f: 16, x: 54, y: 60, w: 25, h: 136 },
    { f: 17, x: 56, y: 60, w: 23, h: 140 },
    { f: 18, x: 56, y: 60, w: 23, h: 140 },
    { f: 19, x: 56, y: 60, w: 23, h: 140 },
    { f: 20, x: 54, y: 60, w: 25, h: 136 },
    { f: 21, x: 52, y: 60, w: 27, h: 128 },
    { f: 22, x: 50, y: 60, w: 29, h: 120 },
    { f: 23, x: 48, y: 60, w: 31, h: 112 }
  ];

  /* ---- nameless：披风斗篷（横向能到 166px，但那是布料，不算攻击部位） ---- */
  window.HITBOXES.nameless.light = [
    { f: 5, x: 70, y: 150, w: 112, h: 90 },
    { f: 6, x: 72, y: 150, w: 110, h: 90 },
    { f: 7, x: 70, y: 150, w: 112, h: 90 }
  ];
  window.HITBOXES.nameless.heavy = [
    { f: 11, x: 74, y: 140, w: 39, h: 126 },
    { f: 12, x: 78, y: 140, w: 35, h: 130 },
    { f: 13, x: 78, y: 140, w: 35, h: 130 },
    { f: 14, x: 78, y: 140, w: 35, h: 130 },
    { f: 15, x: 76, y: 140, w: 37, h: 126 },
    { f: 16, x: 72, y: 140, w: 41, h: 120 }
  ];
  window.HITBOXES.nameless.clight = [
    { f: 5, x: 66, y: 60, w: 53, h: 70 },
    { f: 6, x: 68, y: 60, w: 51, h: 70 },
    { f: 7, x: 66, y: 60, w: 53, h: 70 }
  ];
  window.HITBOXES.nameless.cheavy = [
    { f: 9,  x: 62, y: 50, w: 115, h: 86 },
    { f: 10, x: 64, y: 50, w: 113, h: 90 },
    { f: 11, x: 64, y: 50, w: 113, h: 90 },
    { f: 12, x: 62, y: 50, w: 115, h: 86 },
    { f: 13, x: 58, y: 50, w: 119, h: 80 }
  ];
  window.HITBOXES.nameless.jlight = [
    { f: 5, x: 56, y: 110, w: 72, h: 88 },
    { f: 6, x: 58, y: 110, w: 70, h: 88 },
    { f: 7, x: 58, y: 110, w: 70, h: 88 },
    { f: 8, x: 56, y: 110, w: 72, h: 88 }
  ];
  window.HITBOXES.nameless.jheavy = [
    { f: 16, x: 54, y: 60, w: 77, h: 136 },
    { f: 17, x: 56, y: 60, w: 75, h: 140 },
    { f: 18, x: 56, y: 60, w: 75, h: 140 },
    { f: 19, x: 56, y: 60, w: 75, h: 140 },
    { f: 20, x: 54, y: 60, w: 77, h: 136 },
    { f: 21, x: 52, y: 60, w: 79, h: 128 },
    { f: 22, x: 50, y: 60, w: 81, h: 120 },
    { f: 23, x: 48, y: 60, w: 83, h: 112 }
  ];

  /* ---- sylvi：个子小、手臂短（所以同样一招她够得比别人都近） ---- */
  window.HITBOXES.sylvi.light = [
    { f: 5, x: 70, y: 150, w: 61, h: 90 },
    { f: 6, x: 72, y: 150, w: 59, h: 90 },
    { f: 7, x: 70, y: 150, w: 61, h: 90 }
  ];
  window.HITBOXES.sylvi.heavy = [
    { f: 11, x: 74, y: 140, w: 55, h: 126 },
    { f: 12, x: 78, y: 140, w: 51, h: 130 },
    { f: 13, x: 78, y: 140, w: 51, h: 130 },
    { f: 14, x: 78, y: 140, w: 51, h: 130 },
    { f: 15, x: 76, y: 140, w: 53, h: 126 },
    { f: 16, x: 72, y: 140, w: 57, h: 120 }
  ];
  window.HITBOXES.sylvi.clight = [
    { f: 5, x: 66, y: 60, w: 41, h: 70 },
    { f: 6, x: 68, y: 60, w: 39, h: 70 },
    { f: 7, x: 66, y: 60, w: 41, h: 70 }
  ];
  window.HITBOXES.sylvi.cheavy = [
    { f: 9,  x: 62, y: 50, w: 98, h: 86 },
    { f: 10, x: 64, y: 50, w: 96, h: 90 },
    { f: 11, x: 64, y: 50, w: 96, h: 90 },
    { f: 12, x: 62, y: 50, w: 98, h: 86 },
    { f: 13, x: 58, y: 50, w: 102, h: 80 }
  ];
  window.HITBOXES.sylvi.jlight = [
    { f: 5, x: 56, y: 110, w: 48, h: 88 },
    { f: 6, x: 58, y: 110, w: 46, h: 88 },
    { f: 7, x: 58, y: 110, w: 46, h: 88 },
    { f: 8, x: 56, y: 110, w: 48, h: 88 }
  ];
  window.HITBOXES.sylvi.jheavy = [
    { f: 16, x: 54, y: 60, w: 12, h: 136 },
    { f: 17, x: 56, y: 60, w: 10, h: 140 },
    { f: 18, x: 56, y: 60, w: 10, h: 140 },
    { f: 19, x: 56, y: 60, w: 10, h: 140 },
    { f: 20, x: 54, y: 60, w: 12, h: 136 },
    { f: 21, x: 52, y: 60, w: 14, h: 128 },
    { f: 22, x: 50, y: 60, w: 16, h: 120 },
    { f: 23, x: 48, y: 60, w: 18, h: 112 }
  ];

  /* ---- ikaria：长发/披风能甩到 208px，但那是布料；亮起来的手臂只到 128px ---- */
  window.HITBOXES.ikaria.light = [
    { f: 5, x: 70, y: 150, w: 169, h: 90 },
    { f: 6, x: 72, y: 150, w: 167, h: 90 },
    { f: 7, x: 70, y: 150, w: 169, h: 90 }
  ];
  window.HITBOXES.ikaria.heavy = [
    { f: 11, x: 74, y: 140, w: 73, h: 126 },
    { f: 12, x: 78, y: 140, w: 69, h: 130 },
    { f: 13, x: 78, y: 140, w: 69, h: 130 },
    { f: 14, x: 78, y: 140, w: 69, h: 130 },
    { f: 15, x: 76, y: 140, w: 71, h: 126 },
    { f: 16, x: 72, y: 140, w: 75, h: 120 }
  ];
  window.HITBOXES.ikaria.clight = [
    { f: 5, x: 66, y: 60, w: 178, h: 70 },
    { f: 6, x: 68, y: 60, w: 176, h: 70 },
    { f: 7, x: 66, y: 60, w: 178, h: 70 }
  ];
  window.HITBOXES.ikaria.cheavy = [
    { f: 9,  x: 62, y: 50, w: 90, h: 86 },
    { f: 10, x: 64, y: 50, w: 88, h: 90 },
    { f: 11, x: 64, y: 50, w: 88, h: 90 },
    { f: 12, x: 62, y: 50, w: 90, h: 86 },
    { f: 13, x: 58, y: 50, w: 94, h: 80 }
  ];
  window.HITBOXES.ikaria.jlight = [
    { f: 5, x: 56, y: 110, w: 65, h: 88 },
    { f: 6, x: 58, y: 110, w: 63, h: 88 },
    { f: 7, x: 58, y: 110, w: 63, h: 88 },
    { f: 8, x: 56, y: 110, w: 65, h: 88 }
  ];
  window.HITBOXES.ikaria.jheavy = [
    { f: 16, x: 54, y: 60, w: 93, h: 136 },
    { f: 17, x: 56, y: 60, w: 91, h: 140 },
    { f: 18, x: 56, y: 60, w: 91, h: 140 },
    { f: 19, x: 56, y: 60, w: 91, h: 140 },
    { f: 20, x: 54, y: 60, w: 93, h: 136 },
    { f: 21, x: 52, y: 60, w: 95, h: 128 },
    { f: 22, x: 50, y: 60, w: 97, h: 120 },
    { f: 23, x: 48, y: 60, w: 99, h: 112 }
  ];

  /* ------------------------------------------------------------------
   * 扫堂（sweep）的判定框在 moves_ext.js 里**自带**（不再克隆蹲重的框）——
   * 蹲重重新标定后 w 变大了，扫堂照抄就会跟着变长，而扫堂必须保持
   * "贴地一记、短、狠"（比蹲重还短一截）。那边已经把远边写死成标定前的值。
   * ------------------------------------------------------------------ */
})();
/* NEAR-REACH-END */
