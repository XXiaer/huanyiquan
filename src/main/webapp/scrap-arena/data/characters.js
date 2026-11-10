/* ============================================================================
 * Scrap Arena · 角色档案
 * ---------------------------------------------------------------------------
 * 这是"角色"这一层的唯一数据源。后续角色只要加一个同构的条目即可接入，
 * 引擎代码不需要再改。
 *
 * 结构说明
 *   id        内部 id，同时也是精灵集目录名（assets/<set>/）
 *   set       精灵集名（当前与 id 相同，留出来是为了同一角色换美术时不用改代码）
 *   def       角色尺寸。h 是"世界身高"，命中框与受击框都按它缩放
 *             （比例 = h / 300，写在 MOVE/HITBOXES 里）
 *   traits    移动与防御特性，逐条覆盖引擎默认值
 *   slots     引擎的通用动作槽 → 该角色对应的 MUGEN 动作编号
 *             引擎只认槽名（idle / walk_fwd / heavy ...），不认具体编号，
 *             这样同一个槽在不同角色上可以是完全不同的动画
 *   moves     招式清单：id、类型、按键、方向指令、气槽消耗、落地状态名
 *   routes    连招路线（给 UI 与 AI 用），[招式id, 方向]
 * ==========================================================================*/
window.CHARACTERS = {

  /* ================= 角色一：潮汐澜影·赫莱森 ================= */
  horizon: {
    id: 'horizon',
    name: 'HORIZON',
    cn: '潮汐澜影·赫莱森',
    set: 'horizon',
    blurb: '以潮汐为刃的水术格斗家。招式全是水浪，起手慢、范围大、收招长。',

    def: {
      h: 204,            // 世界身高（判定与受击框按 h/300 缩放）
      pushW: 94,         // 推挤框宽度
      crouchH: 126,      // 蹲姿高度
      heavyReach: 150    // 重攻击臂展系数
    },

    traits: {
      /* 走位乘数：基准在 CONFIG.PHYS.walkFwd / walkBack（4.3 / 3.5）。
         1.08 → 前进 4.64 / 后退 3.78。
         【为什么是乘数不是绝对值】绝对值的写法（walkFwd: 3.7）会让引擎侧的
         基准值彻底失效（`tr.walkFwd || CONFIG.PHYS.walkFwd` 短路），
         调平衡时改 CONFIG 完全没反应 —— 这条坑踩了很久。
         跳跃与重力已经**不再有角色差异**，统一听 CONFIG.PHYS。 */
      walkTier: 1.08,        // 走位乘数 —— 水系身形偏快
      walkBackTier: 0.90,    // 后退更慢：重脚色的性格（0.90 → 3.40）
      dashSpeed: 9.6,      // 冲刺速度（→→ 特殊技的位移）
      airGuard: true,      // 可以空中防御（MUGEN 有 GUARDSTART(Air)）
      guardDamageScale: 0.8, // 防御时的受伤倍率——水之壁
      guardPushback: 3.2,  // 防御时的后退量
      // 攒气速度倍率。原本是 1.15，现在压回 1.0 —— 理由见 docs/07 第 10.4.2 节：
      // 气槽收入 = 打出伤害 × 0.60 × 本倍率 + 挨打伤害 × 0.32。倍率乘在伤害上，
      // 而本角色的伤害本来就比 isolde 高（威力 64 vs 50），1.15 等于在"打得重"之上
      // 再叠一层看不见的优势。压回 1.0 后，同样的伤害交换量下两人的气槽收入完全相同，
      // 气槽差异只剩"谁打得更疼"，而这一条玩家从威力轴就能读出来。
      meterGain: 1.0
    },

    // 槽位 = 引擎的通用动作 → 该角色的 MUGEN 动作编号。
    // 只有非攻击类动作走槽位；攻击类直接用招式 id 当槽位名。
    slots: {
      idle: 0, walk_fwd: 20, walk_back: 21, crouch: 11,
      jump_rise: 41, jump_fall: 43, block: 120, block_crouch: 121, hit: 170, taunt: 950,
      knockdown: 5040, ko: 5050
    },

    // 槽位的每张精灵图占几个逻辑帧。不写就用 .air 里的原始时长。
    // 这里只覆盖几个"循环太长"的动作：
    //   idle 原本最后一帧停 20 tick，循环会一顿一顿的
    //   crouch 原本一轮 118 tick，蹲着不动时晃得很慢
    slotPlans: {
      idle:       [5, 5, 5, 5, 5, 5, 5, 5],
      crouch:     [3, 3, 3, 3, 3, 13],
      hit:        [5, 3, 4, 4, 4, 8, 4, 7],
      knockdown:  [3, 3, 3, 3, 2, 2],
      ko:         [10, 8, 12],
      block:      [2, 3]
    },

    // 精灵放大倍率（整数，像素才不糊）。素材里角色高约 102px，×3 ≈ 306。
    spriteScale: 2,

    moves: [
      // —— 普通攻击 ——
      // name 是招式的**唯一命名来源**：UI 的技能表、docs 的对照表都从这里读。
      // 之前这六条只在 docs/06-动作系统.md 的表格里有名字，等于有两个来源，容易漂。
      { id: 'light',   kind: 'normal', btn: 'light', state: 'attack_light',   name: '轻踢' },
      { id: 'heavy',   kind: 'normal', btn: 'heavy', state: 'attack_heavy',   name: '涌拳' },
      { id: 'clight',  kind: 'normal', btn: 'light', state: 'attack_crouch', crouch: true, name: '蹲击' },
      { id: 'cheavy',  kind: 'normal', btn: 'heavy', state: 'attack_crouch', crouch: true, name: '崩潮' },
      { id: 'jlight',  kind: 'normal', btn: 'light', state: 'attack_air',    name: '空中浪' },
      { id: 'jheavy',  kind: 'normal', btn: 'heavy', state: 'attack_air',    name: '空中崩' },

      // —— 特殊技 ——
      { id: 'sp_slash', kind: 'special', btn: 'light', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '潮汐斩' },
      { id: 'sp_orb',   kind: 'special', btn: 'heavy', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '聚潮珠' },
      { id: 'sp_rise',  kind: 'special', btn: 'heavy', motion: 'dp',  meter: 0,
        state: 'attack_special', name: '升潮柱', invincible: true },
      { id: 'sp_dash',  kind: 'special', btn: 'heavy', motion: 'dash', meter: 0,
        state: 'attack_special', name: '浪奔' },
      { id: 'sp_wave',  kind: 'special', btn: 'light', motion: 'qcb', meter: 0,
        state: 'attack_special', name: '长浪' },

      // —— 必杀技（需气）——
      { id: 'super_tide', kind: 'super', btn: 'heavy', motion: 'dp', meter: 50,
        state: 'attack_special', name: '深渊潮汐' },

      // —— 大招（满气）——
      { id: 'final_tide', kind: 'final', btn: 'heavy', motion: 'qcb', meter: 100,
        state: 'attack_special', name: '终潮' },
      { id: 'sp_dp_light', kind: 'special', btn: 'light', motion: 'dp', meter: 25,
        state: 'attack_special', name: '潮返' },
      { id: 'sp_dash_light', kind: 'special', btn: 'light', motion: 'dash', meter: 25,
        state: 'attack_special', name: '浪跃' },
      { id: 'sp_qcb_heavy', kind: 'special', btn: 'heavy', motion: 'qcb', meter: 50,
        state: 'attack_special', name: '潮怒' }
    ],

    routes: [
      { name: '轻连',   seq: ['light', 'light', 'heavy'] },
      { name: '蹲连',   seq: ['clight', 'clight', 'cheavy'] },
      { name: '起手',   seq: ['sp_slash', 'sp_orb'] },
      { name: '对空',   seq: ['sp_rise'] },
      { name: '突进',   seq: ['sp_dash', 'heavy'] },
      { name: '必杀',   seq: ['light', 'sp_slash', 'super_tide'] }
    ]
  },

  /* ================= 角色二：极凝冰花·伊索尔德（占位，待补全）=================
     结构与 horizon 完全一致即可接入；slots 与 moves 补齐后即可上机。 */
  isolde: {
    id: 'isolde',
    name: 'ISOLDE',
    cn: '极凝冰花·伊索尔德',
    set: 'isolde',
    blurb: '（待补全）',
    def: { h: 204, pushW: 82, crouchH: 126, heavyReach: 145 },
    traits: {
      walkTier: 0.95,        // 走位乘数（基准 4.3 / 3.5 → 4.09 / 3.33）
      walkBackTier: 1.05,    // 后退略快：轻灵角色（3.49）
      dashSpeed: 8.8, airGuard: false,
      guardDamageScale: 0.9, guardPushback: 2.4, meterGain: 1.0
    },
    slots: { idle: 0, walk_fwd: 20, walk_back: 21, crouch: 11,
             jump_rise: 41, jump_fall: 43, block: 120, block_crouch: 121, hit: 170, taunt: 950,
             knockdown: 5040, ko: 5050 },
    slotPlans: { ko: [10, 8, 12] },
    moves: [
      { id: 'light',   kind: 'normal', btn: 'light', state: 'attack_light',        name: '冰爪' },
      { id: 'heavy',   kind: 'normal', btn: 'heavy', state: 'attack_heavy',        name: '霜牙' },
      { id: 'clight',  kind: 'normal', btn: 'light', state: 'attack_crouch', crouch: true, name: '冰刺' },
      { id: 'cheavy',  kind: 'normal', btn: 'heavy', state: 'attack_crouch', crouch: true, name: '碎霜' },
      { id: 'jlight',  kind: 'normal', btn: 'light', state: 'attack_air',          name: '空刃' },
      { id: 'jheavy',  kind: 'normal', btn: 'heavy', state: 'attack_air',          name: '坠霜' },
      { id: 'sp_slash', kind: 'special', btn: 'light', motion: 'qcf', meter: 0, state: 'attack_special', name: '霜爆' },
      { id: 'sp_orb',   kind: 'special', btn: 'heavy', motion: 'qcf', meter: 0, state: 'attack_special', name: '冰锥' },
      { id: 'sp_rise',  kind: 'special', btn: 'heavy', motion: 'dp', meter: 0, state: 'attack_special', name: '升冰柱', invincible: true },
      { id: 'sp_dash',  kind: 'special', btn: 'heavy', motion: 'dash', meter: 0, state: 'attack_special', name: '冰冲步' },
      { id: 'sp_wave',  kind: 'special', btn: 'light', motion: 'qcb', meter: 0, state: 'attack_special', name: '寒潮' },
      { id: 'super_tide', kind: 'super', btn: 'heavy', motion: 'dp', meter: 50, state: 'attack_special', name: '极寒领域' },
      { id: 'final_tide', kind: 'final', btn: 'heavy', motion: 'qcb', meter: 100, state: 'attack_special', name: '绝对零度' },
      { id: 'sp_dp_light', kind: 'special', btn: 'light', motion: 'dp', meter: 25,
        state: 'attack_special', name: '冰镜' },
      { id: 'sp_dash_light', kind: 'special', btn: 'light', motion: 'dash', meter: 25,
        state: 'attack_special', name: '霜闪' },
      { id: 'sp_qcb_heavy', kind: 'special', btn: 'heavy', motion: 'qcb', meter: 50,
        state: 'attack_special', name: '零界' },

    ],
    routes: [
      { name: '冰连', seq: ['light', 'light', 'heavy'] },
      { name: '反击', seq: ['sp_slash', 'heavy'] },
      { name: '必杀', seq: ['light', 'sp_slash', 'super_tide'] }
    ]
  },

  /* ================= 角色三：无铭之刃·纳姆雷斯 ================= */
  nameless: {
    id: 'nameless',
    name: 'NAMELESS',
    cn: '无铭之刃·纳姆雷斯',
    set: 'nameless',
    blurb: '没有名字的白发刺客。出刀轻、位移快，靠短促连段逼对手先动。',
    def: { h: 246, pushW: 96, crouchH: 138, heavyReach: 150 },
    stats: { power: 58, speed: 66, range: 62, technique: 74 },
    traits: {
      walkTier: 1.14,        // 走位乘数（基准 → 4.90 / 3.99）
      walkBackTier: 1.00,    // 前后一致
      dashSpeed: 10.2, airGuard: true,
      guardDamageScale: 0.85, guardPushback: 3.0, meterGain: 1.0
    },
    slots: { idle: 0, walk_fwd: 20, walk_back: 21, crouch: 11,
             jump_rise: 41, jump_fall: 43, block: 120, block_crouch: 121, hit: 170, taunt: 950,
             knockdown: 5040, ko: 5050 },
    slotPlans: { ko: [10, 8, 12] },
    spriteScale: 2,
    moves: [
      { id: 'light',   kind: 'normal', btn: 'light', state: 'attack_light',        name: '影踢' },
      { id: 'heavy',   kind: 'normal', btn: 'heavy', state: 'attack_heavy',        name: '血拳' },
      { id: 'clight',  kind: 'normal', btn: 'light', state: 'attack_crouch', crouch: true, name: '赤刺' },
      { id: 'cheavy',  kind: 'normal', btn: 'heavy', state: 'attack_crouch', crouch: true, name: '绯崩' },
      { id: 'jlight',  kind: 'normal', btn: 'light', state: 'attack_air',          name: '空刃' },
      { id: 'jheavy',  kind: 'normal', btn: 'heavy', state: 'attack_air',          name: '坠影' },
      { id: 'sp_slash', kind: 'special', btn: 'light', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '影刃' },
      { id: 'sp_orb',   kind: 'special', btn: 'heavy', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '虚空波' },
      { id: 'sp_rise',  kind: 'special', btn: 'heavy', motion: 'dp', meter: 0,
        state: 'attack_special', name: '升影', invincible: true },
      { id: 'sp_dash',  kind: 'special', btn: 'heavy', motion: 'dash', meter: 0,
        state: 'attack_special', name: '影袭' },
      { id: 'sp_wave',  kind: 'special', btn: 'light', motion: 'qcb', meter: 0,
        state: 'attack_special', name: '断空' },
      { id: 'super_tide', kind: 'super', btn: 'heavy', motion: 'dp', meter: 50,
        state: 'attack_special', name: '冥河斩' },
      { id: 'final_tide', kind: 'final', btn: 'heavy', motion: 'qcb', meter: 100,
        state: 'attack_special', name: '终焉' },
      { id: 'sp_dp_light', kind: 'special', btn: 'light', motion: 'dp', meter: 25,
        state: 'attack_special', name: '影返' },
      { id: 'sp_dash_light', kind: 'special', btn: 'light', motion: 'dash', meter: 25,
        state: 'attack_special', name: '影跃' },
      { id: 'sp_qcb_heavy', kind: 'special', btn: 'heavy', motion: 'qcb', meter: 50,
        state: 'attack_special', name: '影怒' }
    ],
    routes: [
      { name: '影连', seq: ['light', 'light', 'heavy'] },
      { name: '突进', seq: ['sp_dash', 'heavy'] },
      { name: '必杀', seq: ['light', 'sp_slash', 'super_tide'] }
    ]
  },

  /* ================= 角色四：绯带剑姬·席尔维 ================= */
  sylvi: {
    id: 'sylvi',
    name: 'SYLVI',
    cn: '绯带剑姬·席尔维',
    set: 'sylvi',
    blurb: '以绯红飘带为刃的剑姬。中距离牵制强，收招干净，适合打反击。',
    def: { h: 226, pushW: 86, crouchH: 160, heavyReach: 145 },
    stats: { power: 54, speed: 64, range: 60, technique: 72 },
    traits: {
      walkTier: 1.00,        // 走位乘数（基准 → 4.30 / 3.50）
      walkBackTier: 1.00,    // 前后一致
      dashSpeed: 9.0, airGuard: true,
      guardDamageScale: 0.9, guardPushback: 2.6, meterGain: 1.0
    },
    slots: { idle: 0, walk_fwd: 20, walk_back: 21, crouch: 11,
             jump_rise: 41, jump_fall: 43, block: 120, block_crouch: 121, hit: 170, taunt: 950,
             knockdown: 5040, ko: 5050 },
    slotPlans: { ko: [10, 8, 12] },
    spriteScale: 2,
    moves: [
      { id: 'light',   kind: 'normal', btn: 'light', state: 'attack_light',        name: '绯踢' },
      { id: 'heavy',   kind: 'normal', btn: 'heavy', state: 'attack_heavy',        name: '血拳' },
      { id: 'clight',  kind: 'normal', btn: 'light', state: 'attack_crouch', crouch: true, name: '赤刺' },
      { id: 'cheavy',  kind: 'normal', btn: 'heavy', state: 'attack_crouch', crouch: true, name: '绯崩' },
      { id: 'jlight',  kind: 'normal', btn: 'light', state: 'attack_air',          name: '空绯' },
      { id: 'jheavy',  kind: 'normal', btn: 'heavy', state: 'attack_air',          name: '坠绯' },
      { id: 'sp_slash', kind: 'special', btn: 'light', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '绯斩' },
      { id: 'sp_orb',   kind: 'special', btn: 'heavy', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '血滴' },
      { id: 'sp_rise',  kind: 'special', btn: 'heavy', motion: 'dp', meter: 0,
        state: 'attack_special', name: '升绯', invincible: true },
      { id: 'sp_dash',  kind: 'special', btn: 'heavy', motion: 'dash', meter: 0,
        state: 'attack_special', name: '绯步' },
      { id: 'sp_wave',  kind: 'special', btn: 'light', motion: 'qcb', meter: 0,
        state: 'attack_special', name: '血潮' },
      { id: 'super_tide', kind: 'super', btn: 'heavy', motion: 'dp', meter: 50,
        state: 'attack_special', name: '绯红领域' },
      { id: 'final_tide', kind: 'final', btn: 'heavy', motion: 'qcb', meter: 100,
        state: 'attack_special', name: '终绯' },
      { id: 'sp_dp_light', kind: 'special', btn: 'light', motion: 'dp', meter: 25,
        state: 'attack_special', name: '绯返' },
      { id: 'sp_dash_light', kind: 'special', btn: 'light', motion: 'dash', meter: 25,
        state: 'attack_special', name: '绯跃' },
      { id: 'sp_qcb_heavy', kind: 'special', btn: 'heavy', motion: 'qcb', meter: 50,
        state: 'attack_special', name: '绯怒' }
    ],
    routes: [
      { name: '绯连', seq: ['light', 'light', 'heavy'] },
      { name: '反击', seq: ['sp_slash', 'heavy'] },
      { name: '必杀', seq: ['light', 'sp_slash', 'super_tide'] }
    ]
  },

  /* ================= 角色五：苍翼猎手·伊卡莉亚 ================= */
  ikaria: {
    id: 'ikaria',
    name: 'IKARIA',
    cn: '苍翼猎手·伊卡莉亚',
    set: 'ikaria',
    blurb: '借风起势的空中猎手。移动与跳跃最快，靠空战和突进撕开防线。',
    def: { h: 242, pushW: 92, crouchH: 242, heavyReach: 150 },
    stats: { power: 50, speed: 72, range: 55, technique: 76 },
    traits: {
      walkTier: 1.16,        // 走位乘数（基准 → 4.99 / 4.06）
      walkBackTier: 1.00,    // 前后一致
      dashSpeed: 10.8, airGuard: true,
      guardDamageScale: 0.95, guardPushback: 2.2, meterGain: 1.0
    },
    slots: { idle: 0, walk_fwd: 20, walk_back: 21, crouch: 11,
             jump_rise: 41, jump_fall: 43, block: 120, block_crouch: 121, hit: 170, taunt: 950,
             knockdown: 5040, ko: 5050 },
    slotPlans: { ko: [10, 8, 12] },
    spriteScale: 2,
    moves: [
      { id: 'light',   kind: 'normal', btn: 'light', state: 'attack_light',        name: '风踢' },
      { id: 'heavy',   kind: 'normal', btn: 'heavy', state: 'attack_heavy',        name: '苍拳' },
      { id: 'clight',  kind: 'normal', btn: 'light', state: 'attack_crouch', crouch: true, name: '风刺' },
      { id: 'cheavy',  kind: 'normal', btn: 'heavy', state: 'attack_crouch', crouch: true, name: '苍崩' },
      { id: 'jlight',  kind: 'normal', btn: 'light', state: 'attack_air',          name: '空风' },
      { id: 'jheavy',  kind: 'normal', btn: 'heavy', state: 'attack_air',          name: '坠风' },
      { id: 'sp_slash', kind: 'special', btn: 'light', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '苍爪' },
      { id: 'sp_orb',   kind: 'special', btn: 'heavy', motion: 'qcf', meter: 0,
        state: 'attack_special', name: '风弹' },
      { id: 'sp_rise',  kind: 'special', btn: 'heavy', motion: 'dp', meter: 0,
        state: 'attack_special', name: '升风', invincible: true },
      { id: 'sp_dash',  kind: 'special', btn: 'heavy', motion: 'dash', meter: 0,
        state: 'attack_special', name: '疾风' },
      { id: 'sp_wave',  kind: 'special', btn: 'light', motion: 'qcb', meter: 0,
        state: 'attack_special', name: '风墙' },
      { id: 'super_tide', kind: 'super', btn: 'heavy', motion: 'dp', meter: 50,
        state: 'attack_special', name: '苍空' },
      { id: 'final_tide', kind: 'final', btn: 'heavy', motion: 'qcb', meter: 100,
        state: 'attack_special', name: '终风' },
      { id: 'sp_dp_light', kind: 'special', btn: 'light', motion: 'dp', meter: 25,
        state: 'attack_special', name: '风返' },
      { id: 'sp_dash_light', kind: 'special', btn: 'light', motion: 'dash', meter: 25,
        state: 'attack_special', name: '风跃' },
      { id: 'sp_qcb_heavy', kind: 'special', btn: 'heavy', motion: 'qcb', meter: 50,
        state: 'attack_special', name: '风怒' }
    ],
    routes: [
      { name: '风连', seq: ['light', 'light', 'heavy'] },
      { name: '空战', seq: ['jlight', 'jheavy'] },
      { name: '必杀', seq: ['light', 'sp_slash', 'super_tide'] }
    ]
  }
};
