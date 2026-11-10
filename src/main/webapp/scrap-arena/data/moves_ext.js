/* ============================================================================
 * Scrap Arena · 扩展招式（每角色 +5）
 * ---------------------------------------------------------------------------
 * 本轮新增的五档，都是"低门槛按键"：不搓大圈，方向双击或半圆就能出。
 *
 *   sweep    ↓↓ + 轻     下段扫堂 —— 扫倒，蹲防挡不住
 *   launcher ↓↓ + 重     挑空 —— 起手无敌，把人打浮空接空连
 *   rush     →→ + 轻     突进连打
 *   barrage  半圆前 + 重  组合技（五段）
 *   bolt     双半圆后 + 重 远程弹
 *
 * 【帧数据怎么来的】
 * 不重新编 plan。每招都从**已有的同动作招式**复制整份帧数据，
 * 只覆盖判定与手感字段。
 * 原因：plan 是"这个动作的每张精灵图各占几个逻辑帧"，长度必须严格等于
 * 素材动作条的帧数。手写一个新 plan 只要差一位，动画就会错位甚至越界。
 * 复制模板 = 天然对齐。
 *
 * 【判定框】
 * HITBOXES 同样从模板复制，再按招式性质平移/缩放：
 * 扫堂压低、挑空抬高、远雷推远。这是判定框坐标唯一的合法改法。
 * ==========================================================================*/
(function () {
  'use strict';
  if (!window.MOVES || !window.CHARACTERS) return;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* 五档的公共性质。dmgMul 是相对模板伤害的系数（倍率，不是绝对值） */
  var TIERS = {
    sweep: {
      kind: 'special', btn: 'light', motion: 'dd', meter: 0,
      type: '特殊技', input: '↓↓ + 轻', dmgMul: 0.92, knockdown: 32,
      /* 扫堂的判定框：**不再从 cheavy 克隆**（这里直接写死扫堂自己的框）。
         【2026-10 判定框重标定】
         蹲重（cheavy）的判定框刚按"看得见的攻击部位"重新标定，w 变大了；
         扫堂以前是照抄蹲重的 w（x−6、w 照抄），一标定就会跟着变长 ——
         扫堂是"贴地一记，短、狠、蹲防挡不住"，必须保持原来那么短
         （比蹲重还短一截），否则"重的招更远"这条梯度又反了。
         现在的值 = 标定前的原值（远边 122/130/130/124/116，峰值 130 单位
         ≈ 88px 可命中），和重标定之前**完全一致**。
         框本身也比蹲重矮得多（y=34 h=40，只够到小腿），这是"扫堂"的语义。 */
      boxes: [
        { f: 9,  x: 56, y: 34, w: 66, h: 40 },
        { f: 10, x: 58, y: 34, w: 72, h: 40 },
        { f: 11, x: 58, y: 34, w: 72, h: 40 },
        { f: 12, x: 56, y: 34, w: 68, h: 40 },
        { f: 13, x: 52, y: 34, w: 64, h: 40 }
      ]
    },
    launcher: {
      kind: 'special', btn: 'heavy', motion: 'dd', meter: 0,
      type: '特殊技', input: '↓↓ + 重', dmgMul: 0.86, knockdown: 0,
      invincible: true,
      hb: function (f) { return { f: f.f, x: f.x, y: f.y + 46, w: f.w, h: f.h + 20 }; }
    },
    rush: {
      kind: 'special', btn: 'light', motion: 'dash', meter: 0,
      type: '特殊技', input: '→→ + 轻', dmgMul: 0.74, lunge: 3.8,
      /* 免费突进（0 气）。
         【不是 bug】气 ≥ 25 时同一套 →→+轻 出的是 sp_dash_light（EX 突进，25 气），
         不是这一招 —— 那是"基础 / EX 两档"的设计：
           气 < 25  → 免费突进（rush，气 0）
           气 ≥ 25  → EX 突进（sp_dash_light，吃 25 气）
         两招指令完全一样、判定框也一样，区别只在气与伤害倍率。
         trySpecial 里同精度（span / end 相同）时按 meter 降序取贵的，
         所以气够时自然是 EX 那一档接手。 */
      hb: function (f) { return f; }
    },
    barrage: {
      kind: 'super', btn: 'heavy', motion: 'hcf', meter: 50,
      type: '必杀技', input: '←↙↓↘→ + 重', dmgMul: 0.90,
      hb: function (f) { return f; }
    },
    bolt: {
      kind: 'special', btn: 'heavy', motion: 'ccb', meter: 25,
      type: '特殊技', input: '↓↙←↓↙← + 重', dmgMul: 1.10,
      /* 远雷：判定框整体推到身前 150px 之外，形成"隔着半个屏幕打"的远程手段。
         引擎没有投射物对象，用远端长判定框是同一件事的另一种实现 ——
         对手看到的是"远处炸开"，玩法上就是远程牵制。 */
      hb: function (f) { return { f: f.f, x: 150 + f.x, y: f.y, w: f.w + 40, h: f.h + 16 }; }
    }
  };

  /* 模板来源：每一档借哪一招的帧数据 */
  var SRC = {
    sweep: 'cheavy',
    launcher: 'sp_rise',
    rush: 'sp_dash_light',
    barrage: 'super_tide',
    bolt: 'sp_orb'
  };

  /* 每个角色的招式命名。招式必须是这个角色自己的说法，
     五个角色共用"扫腿/上勾"这种通用名，选角界面会读不出角色差异。 */
  var NAMES = {
    horizon: {
      sweep: ['潮扫', '低扫潮头，扫倒对手'],
      launcher: ['潮涌挑', '涌起水柱把对手挑空'],
      rush: ['浪叠', '叠浪突进，连撞三下'],
      barrage: ['川流', '半圆起手，五段川流'],
      bolt: ['潮弹', '远处炸开的水弹']
    },
    isolde: {
      sweep: ['斩足', '贴地一刀，砍在脚踝上'],
      launcher: ['挑刀', '自下往上撩，把刀锋送上去'],
      rush: ['疾影斩', '一步跨过去连斩'],
      barrage: ['三连斩', '半圆起手，三段接满'],
      bolt: ['飞斩', '把刀气送出去']
    },
    nameless: {
      sweep: ['截足', '剑尖压到地面截断退路'],
      launcher: ['上挑', '自下而上的剑挑'],
      rush: ['连刺', '贴身连刺，收不住'],
      barrage: ['剑舞', '半圆起手，五段剑舞'],
      bolt: ['剑气', '隔空劈出的剑气']
    },
    sylvi: {
      sweep: ['藤扫', '藤蔓贴地扫过去'],
      launcher: ['枝挑', '树枝从地下挑起'],
      rush: ['冲撞', '整棵树撞过去'],
      barrage: ['连环斧', '半圆起手，斧子连劈'],
      bolt: ['种子弹', '抛出的种子在半空炸开']
    },
    ikaria: {
      sweep: ['骨扫', '白骨贴地扫过'],
      launcher: ['骨挑', '骨刺从地里冒出来'],
      rush: ['骨冲', '骨架整副冲过来'],
      barrage: ['骨潮', '半圆起手，骨潮五段'],
      bolt: ['灵弹', '远处聚起的魂火']
    }
  };

  var order = ['sweep', 'launcher', 'rush', 'barrage', 'bolt'];
  var added = 0;

  for (var cid in NAMES) {
    var prof = window.CHARACTERS[cid];
    if (!prof || !prof.moves) continue;
    var mov = window.MOVES[cid];
    var boxes = window.HITBOXES && window.HITBOXES[cid];

    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      var T = TIERS[id];
      var src = SRC[id];
      if (!mov || !mov[src]) continue;
      if (mov[id]) continue;                    // 幂等：重复载入不叠加

      var m = clone(mov[src]);
      m.dmg = Math.round(mov[src].dmg * T.dmgMul);
      m.sfx = id === 'sweep' ? 'hitLight' : (id === 'bolt' ? 'superFlash' : 'hitHeavy');
      if (T.knockdown !== undefined) m.knockdown = T.knockdown;
      if (T.lunge !== undefined) m.lunge = T.lunge;
      if (T.invincible) m.superFreeze = Math.max(m.superFreeze || 0, 3);
      mov[id] = m;

      if (boxes) {
        /* 两类来源：
           · T.boxes  —— 这一档自带判定框（sweep）：**不克隆**模板招式。
             原因见 TIERS.sweep 的注释：扫堂必须比蹲重短，克隆蹲重会跟着变长。
           · 否则      —— 从模板招式复制（launcher/rush/barrage/bolt 走这条）。 */
        if (T.boxes) {
          boxes[id] = T.boxes.map(function (b) {
            return { f: b.f, x: b.x, y: b.y, w: b.w, h: b.h };
          });
        } else if (boxes[src]) {
          boxes[id] = boxes[src].map(T.hb);
        }
      }

      var nm = NAMES[cid][id];
      prof.moves.push({
        id: id, kind: T.kind, btn: T.btn, motion: T.motion, meter: T.meter,
        state: 'attack_special', name: nm[0],
        invincible: !!T.invincible
      });

      /* 选角界面的招式表（UI.characters[].skills）同步追加，
         否则数据里能打、界面上看不见，玩家永远不知道有新招。 */
      var ui = window.UI && window.UI.characters;
      if (ui) {
        for (var j = 0; j < ui.length; j++) {
          if (ui[j].id !== cid || !ui[j].skills) continue;
          ui[j].skills.push({
            name: nm[0], type: T.type, input: T.input, desc: nm[1]
          });
          break;
        }
      }
      added++;
    }
  }

  if (window.console && added) {
    console.log('[moves_ext] 扩展招式 ' + added + ' 条');
  }
})();
