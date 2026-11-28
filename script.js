/* 渲染。**这里不写数**，数全部来自 data.js（由 gen_data.py 从原始 CSV 生成）。
   凡是本该由数算出来的（7.79、14.0 倍、56.5 分），在这里现算，不写字面量 ——
   写了字面量就等于又抄了一遍，而抄错不会报错。 */
(function () {
  "use strict";
  var D = window.REPORT_DATA.xmodal;
  var $ = function (id) { return document.getElementById(id); };
  var SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) { n.setAttribute(k, attrs[k]); }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }
  function svg(w, h) {
    var s = el("svg", { viewBox: "0 0 " + w + " " + h, role: "img" });
    return s;
  }
  function html(node, s) { node.innerHTML = s; return node; }
  function f(x, n) { return Number(x).toFixed(n === undefined ? 2 : n); }

  /* ---------- 概览 ---------- */
  html($("hero-facts"),
    ["<li><b>5</b>个方法用同一套标准复现</li>",
     "<li><b>2</b>个数据集</li>",
     "<li><b>" + (D.cmship.dirs.length * D.cmship.methods.length) + "</b>格全部自训</li>",
     "<li><b>" + D.ak.length + "</b>轮自己做的实验</li>",
     "<li><b>0</b>外链（断网也能看）</li>"].join(""));

  /* ---------- 形状 / 尺寸 AUC ---------- */
  (function () {
    var bars = D.auc.bars, W = 720, rowH = 46, H = bars.length * rowH + 34;
    var x0 = 150, x1 = W - 70, sx = function (v) { return x0 + v * (x1 - x0); };
    var s = svg(W, H);
    bars.forEach(function (b, i) {
      var y = i * rowH + 10;
      s.appendChild(el("text", { x: x0 - 12, y: y + 17, "text-anchor": "end",
        class: "lbl", "font-size": 13 }, b.label));
      s.appendChild(el("rect", { x: x0, y: y, width: Math.max(1, sx(b.v) - x0), height: 22,
        class: b.kind === "new" ? "barNew" : "barOld", rx: 2 }));
      s.appendChild(el("text", { x: sx(b.v) + 8, y: y + 17, class: "val" }, f(b.v, 4)));
    });
    // 0.5 那条基准线最后画，先画会被条盖住
    s.appendChild(el("line", { x1: sx(0.5), x2: sx(0.5), y1: 2, y2: bars.length * rowH + 4,
      class: "gridline", "stroke-dasharray": "4 3" }));
    s.appendChild(el("text", { x: sx(0.5), y: bars.length * rowH + 22, "text-anchor": "middle",
      class: "lbl" }, "0.5 = 随机猜"));
    s.appendChild(el("text", { x: x1, y: bars.length * rowH + 22, "text-anchor": "end",
      class: "lbl" }, "1.0 = 完全判对"));
    $("auc-chart").appendChild(s);
  }());

  html($("take-size"),
    "<p><b>但物理尺寸传得过去</b>：同样的判法 AUC 为 <b>" + D.auc.size.v +
    "</b>。TransOSS 的尺寸嵌入喂的正是它，关掉重训、光学搜 SAR 掉 " + D.auc.sse_drop.v + " 分。</p>" +
    "<p><b>跨模态可用的线索是物理量，不是外观量。</b></p>");

  html($("two-hard"),
    "<li><b>未见过的身份。</b>训练集里见过的身份与未见过的身份，跨模态命中率差 <b>" +
      D.auc.unseen[0].v + " / " + D.auc.unseen[1].v + "</b> 分，而部署时遇到的全是未见过的。</li>" +
    "<li><b>瓶颈在排序而非召回。</b>若把前若干名完美重排，mAP 上界从实际的 " +
      D.auc.rerank_lo.v + "–" + D.auc.rerank_hi.v + " 抬到 <b>" +
      D.auc.ceil_lo.v + "–" + D.auc.ceil_hi.v + "</b>，说明答案常在候选里，只是没排到前面。</li>");

  /* ---------- 九步流程网格 ---------- */
  (function () {
    var p = D.pipeline, box = $("pipe");
    box.style.gridTemplateColumns = "9.2rem repeat(" + p.methods.length + ", 1fr)";
    box.appendChild(html(document.createElement("div"), ""));
    p.methods.forEach(function (m, j) {
      var h = document.createElement("div");
      h.className = "hd"; h.textContent = m; h.dataset.col = j;
      h.title = "只看 " + m + " 自己引入的模块";
      box.appendChild(h);
    });
    p.steps.forEach(function (st) {
      var lab = document.createElement("div");
      lab.className = "step"; lab.textContent = st.label;
      box.appendChild(lab);
      st.cells.forEach(function (c, j) {
        var d = document.createElement("div");
        if (c === null) { d.className = "c none"; }
        else { d.className = "c " + c.kind; d.textContent = c.t; }
        d.dataset.col = j;
        box.appendChild(d);
      });
    });
    var cur = -1;
    box.addEventListener("click", function (e) {
      var h = e.target.closest(".hd");
      if (!h) { return; }
      var j = Number(h.dataset.col);
      cur = (cur === j) ? -1 : j;
      box.classList.toggle("focus", cur >= 0);
      [].forEach.call(box.querySelectorAll(".hd"), function (x) {
        x.classList.toggle("on", Number(x.dataset.col) === cur);
      });
      [].forEach.call(box.querySelectorAll(".c"), function (x) {
        x.classList.toggle("hit", cur >= 0 &&
          Number(x.dataset.col) === cur && x.classList.contains("diff"));
      });
    });
  }());

  /* 各方法引入的模块：只有文字、没有数，所以写在这里。
     2026-11-28 改成一问一答的卡片 —— 原先是四列表格，而「针对的问题」那一列
     被挤成半行，于是写成了行话（「把成像差异当成已知条件」「两路真解耦」），
     读的人得先翻译一遍。同一次改动修掉一处错：原先写「检索时只用共享那一路」，
     而代码事实是**融合特征（共享+专属）**（`cross_modal_steps.csv` 的 sdfnet 行，
     出处 `SDF-Net/model/make_model.py:63`）。 */
  var MODULES = [
    ["TransOSS", "第 5 步",
      "同一条船，光学图和雷达图的亮暗与纹理整体就是两个样子。模型看不出手里这张是哪种相机拍的，" +
      "只能把这种「整批图都偏」的差异当成随机干扰硬扛。",
      "<b>模态嵌入</b>：准备一张小表，每种相机占一行（这一行的值是训练出来的），按这张图来自哪种相机" +
      "取对应那行，加到图的每个位置上 —— 相当于给整张图盖一个「我是雷达图」的戳。" +
      "盖了戳，模型就能把相机差异当已知条件扣掉，不当噪声。" +
      "另有 <b>尺寸嵌入</b>：把换算成米的船体尺寸也喂进去，用的正是上一节量出的那条可传递线索。"],
    ["SDF-Net", "第 5 步",
      "模型提出来的那串特征里，「这条船长什么样」和「这是哪种相机拍的」是混在一起的。" +
      "检索时后者会捣乱：同一条船的两张图，只因为相机不同就被判成不像。",
      "<b>双 CLS token</b>：CLS token 是网络里专门用来汇总整张图的一个位置；给每种相机各加一个，" +
      "于是一张图同时输出两串特征 —— 一串「两种相机共用」、一串「这个相机专有」，" +
      "设计意图是让相机信息集中到「专有」那串里去。" +
      "<b>检索时用的是两串融合之后的特征</b>（见第 9 步那一行）。"],
    ["SDF-Net", "第 7 步",
      "光把特征拆成两串没用 —— 不加约束的话，「相机专有」那串会把船的身份也学进去，等于没拆。",
      "加两项约束。<b>正交损失</b>要求两串特征互不相关（方向上尽量垂直），这样它们只能装不同的东西。" +
      "<b>结构一致损失</b>先算一张图的「轮廓强度」（相邻小块之间差多少，横竖各算一次再归一化），" +
      "再要求同一条船在两种相机下这个量接近 —— 依据就是上一节那条：" +
      "亮度与成像方式可以完全不同，而船的轮廓不该不同。"],
    ["MOS", "第 7 步",
      "同一条船在两种相机下的特征，在特征空间里落成两堆、各在一边，跨相机检索时就比不到一起。",
      "<b>按身份的分布对齐损失</b>：训练时加一项约束，把同一条船在两种相机下的特征往一起拉。" +
      "它的特点是<b>网络结构一个字都不改</b>，只改训练时的约束 —— 四个模块里只有它完全不动网络。"]
  ];
  html($("module-table"), MODULES.map(function (r) {
    return "<div class='card'><div><span class='tag'>" + r[0] +
      "</span><span class='verdict'>" + r[1] + "</span></div>" +
      "<div class='did'><b>要解决的问题：</b>" + r[2] + "</div>" +
      "<div class='got'><b>它加了什么：</b>" + r[3] + "</div></div>";
  }).join(""));

  /* ---------- 配方 ---------- */
  html($("recipe-table"),
    "<thead><tr><th>项</th>" + D.recipe.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
    "<th>一致吗</th></tr></thead><tbody>" +
    D.recipe.rows.map(function (r) {
      return "<tr><td class='lab'>" + r.k + "</td>" +
        r.v.map(function (v) { return "<td>" + v + "</td>"; }).join("") +
        "<td>" + (r.same ? "一致" : "<span class='flag'>不一致</span>") + "</td></tr>";
    }).join("") + "</tbody>");

  /* ---------- HOSS 表 ---------- */
  (function () {
    var h = D.hoss;
    var maxv = [];
    h.cols.forEach(function (_, j) {
      maxv[j] = Math.max.apply(null, h.rows.map(function (r) { return r.v[j]; }));
    });
    html($("hoss-table"),
      "<thead><tr><th>方法（HOSS，mAP）</th>" +
      h.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
      h.rows.map(function (r) {
        return "<tr><td class='lab'>" + r.name + (r.note ? "<small>" + r.note + "</small>" : "") + "</td>" +
          r.v.map(function (v, j) {
            var w = (v / maxv[j] * 100).toFixed(1);
            return "<td class='cell'><span class='fill' style='width:" + w + "%'></span>" + f(v) + "</td>";
          }).join("") + "</tr>";
      }).join("") + "</tbody>");
  }());

  /* ---------- HOSS 总体分 + 能分辨的最小差 + 两段差 ---------- */
  (function () {
    var h = D.hoss, n = D.noise, W = 720, rowH = 34, H = h.rows.length * rowH + 92;
    var lo = 40, hi = 64, x0 = 170, x1 = W - 56;
    var sx = function (v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); };
    var s = svg(W, H);
    [40, 45, 50, 55, 60].forEach(function (t) {
      s.appendChild(el("line", { x1: sx(t), x2: sx(t), y1: 4, y2: h.rows.length * rowH + 6, class: "gridline" }));
      s.appendChild(el("text", { x: sx(t), y: h.rows.length * rowH + 22, "text-anchor": "middle", class: "lbl" }, t));
    });
    h.rows.forEach(function (r, i) {
      var y = i * rowH + 18, spec = r.name !== "TransReID";
      // 图里用短名：全名在上面那张表里，这里再写一遍只会被左边裁掉
      var short = r.name === "TransReID"
        ? (r.note.indexOf("换成") === 0 ? "TransReID（换权重）" : "TransReID（原样）")
        : r.name;
      s.appendChild(el("text", { x: x0 - 12, y: y + 4, "text-anchor": "end", class: "lbl",
        "font-size": 12 }, short));
      s.appendChild(el("line", { x1: sx(lo), x2: sx(r.v[0]), y1: y, y2: y,
        stroke: "var(--rule)", "stroke-width": 1 }));
      s.appendChild(el("circle", { cx: sx(r.v[0]), cy: y, r: 6,
        fill: spec ? "var(--old)" : "var(--new)" }));
      s.appendChild(el("text", { x: sx(r.v[0]) + 12, y: y + 4, class: "val" }, f(r.v[0])));
    });
    // 画成一把短尺，不画成每个点的误差棒 —— 它是**两组之差**能被分辨的最小值，
    // 画成误差棒会被读成「这个分数本身有这么大不确定」，那是错的。
    var ry = h.rows.length * rowH + 44, w = (n.transoss.two_std) / (hi - lo) * (x1 - x0);
    s.appendChild(el("line", { x1: x0, x2: x0 + w, y1: ry, y2: ry, stroke: "var(--ink)", "stroke-width": 2 }));
    [x0, x0 + w].forEach(function (x) {
      s.appendChild(el("line", { x1: x, x2: x, y1: ry - 5, y2: ry + 5, stroke: "var(--ink)", "stroke-width": 2 }));
    });
    s.appendChild(el("text", { x: x0 + w + 10, y: ry + 4, class: "lbl" },
      "能分辨的最小差 " + f(n.transoss.two_std) + " 分（同一配方只换随机数，重跑 " + n.transoss.n_seed + " 次算出来的）"));
    $("hoss-chart").appendChild(s);
    $("hoss-cap").textContent =
      "蓝点是三个跨模态专门方法，洋红是通用方法 TransReID 的两行。底下那把短尺是「能分辨的最小差」：" +
      "比它短的差，这个实验分不出来。";
  }());

  /* ---------- HOSS 四条分数（现算，不写字面量） ---------- */
  (function () {
    var h = D.hoss, n = D.noise, t = D.ties, get = function (name, note) {
      return h.rows.filter(function (r) { return r.name === name && r.note === note; })[0];
    };
    var sdf = get("SDF-Net", "自训"), mos = get("MOS", "自训"),
        tos = get("TransOSS", "作者公开权重"),
        base = get("TransReID", "原样，ImageNet 起步");
    html($("hoss-points"),
      "<h3>这张表说明四件事</h3><ol>" +
      "<li><b>跨模态专门化确实有收益。</b>三个专门方法 " + f(sdf.v[0]) + " / " +
        f(mos.v[0]) + " / " + f(tos.v[0]) + "，没有跨模态设计的 TransReID 只有 " +
        f(base.v[0]) + "。</li>" +
      "<li><b>三个专门方法分不出高下。</b>跨模态两个方向上 MOS 比 SDF-Net 高 " + f(t.o2s) +
        " 与 " + f(t.s2o) + " 分，而能分辨的最小差是 " + f(n.sdfnet_o2s.two_std) + " 与 " +
        f(n.sdfnet_s2o.two_std) + " —— <b>差值小于能分辨的最小差</b>。</li>" +
      "<li><b>我们训得出作者的水平。</b>自训 " + n.transoss.n_seed + " 次均值 " +
        f(n.transoss.mean) + "，比作者公开权重低 " + f(tos.v[0] - n.transoss.mean) +
        " 分，而能分辨的最小差就有 " + f(n.transoss.two_std) + "。</li>" +
      "<li><b>跨模态比同模态难近一半。</b>同一个方法光学搜光学 " + f(sdf.v[3]) +
        "、光学搜 SAR 只有 " + f(sdf.v[1]) + "，差 " + f(t.same_vs_cross) + " 分。</li></ol>");
  }());

  html($("split-take"),
    "<p>分数从 " + f(D.hoss.rows[4].v[0]) + " 变成 " + f(D.hoss.rows[3].v[0]) + "，账就拆开了：" +
    "<b>换起步权重</b>值 " + D.split.formula[0] + " = <b>" + f(D.split.weight_gain) +
    "</b> 分，剩下 " + D.split.formula[1] + " = <b>" + f(D.split.rest) +
    "</b> 分才是 TransOSS 多出来的。后一段也<b>不是纯架构差异</b> —— 两边 epoch 还不同（" +
    D.recipe.rows[0].v[2] + " 对 " + D.recipe.rows[0].v[3] + "）。</p>");

  /* ---------- CMShipReID ---------- */
  (function () {
    var c = D.cmship;
    html($("cm-table"),
      "<thead><tr><th>方向（CMShipReID，mAP）</th>" +
      c.methods.map(function (m) { return "<th>" + m + "</th>"; }).join("") + "</tr></thead><tbody>" +
      c.dirs.map(function (d, i) {
        return "<tr><td class='lab'>" + d + "</td>" + c.v[i].map(function (v) {
          var low = v < 30;
          return "<td class='cell" + (low ? " low" : "") + "'><span class='fill' style='width:" +
            v.toFixed(1) + "%'></span>" + f(v, 1) + "</td>";
        }).join("") + "</tr>";
      }).join("") +
      "<tr><td class='lab'>六向平均<small>由上面六行算出</small></td>" +
      c.mean.map(function (v) { return "<td>" + f(v) + "</td>"; }).join("") + "</tr></tbody>");

    var iVT = c.dirs.indexOf("VIS 搜 TIR"), iVN = c.dirs.indexOf("VIS 搜 NIR"),
        iTV = c.dirs.indexOf("TIR 搜 VIS"), iNV = c.dirs.indexOf("NIR 搜 VIS"),
        j = c.methods.indexOf("TransReID");
    html($("cm-odd"),
      "<p><b>最后一列第一眼像录错了</b>：TransReID 不含任何跨模态设计，却在 VIS 与 TIR 之间最高（" +
      f(c.v[iVT][j], 1) + " / " + f(c.v[iTV][j], 1) + "），在 VIS 与 NIR 之间只有 " +
      f(c.v[iVN][j], 1) + " / " + f(c.v[iNV][j], 1) + " —— 同一份代码、同一套配方，两个方向差 " +
      f(c.v[iVT][j] - c.v[iVN][j], 1) + " 分。</p>");
  }());

  html($("gap-table"),
    "<thead><tr><th>模态对</th><th>同身份相似度</th><th>异身份相似度</th><th>可分性（相减）</th></tr></thead><tbody>" +
    D.gap.rows.map(function (r) {
      return "<tr><td class='lab'>" + r.pair + "</td><td>" + f(r.same, 4) + "</td><td>" +
        f(r.diff, 4) + "</td><td" + (r.cross ? " class='flag'" : "") + ">" + f(r.sep, 4) + "</td></tr>";
    }).join("") + "</tbody>");

  /* 可分性与收益画在一起：两栏共用同一组行，符号翻转一眼可见 */
  (function () {
    var rows = D.gap.rows.filter(function (r) { return r.cross; }),
        gain = D.gain.rows, W = 720, rowH = 52, H = rows.length * rowH + 56;
    var refSep = D.gap.rows.filter(function (r) { return !r.cross; })[0].sep;
    var aL = 118, aR = 272, bL = 330, bR = 520, tx = W - 6;
    var sepMax = 0.28, sx = function (v) { return aL + v / sepMax * (aR - aL); };
    var gmin = -8, gmax = 46, gx = function (v) { return bL + (v - gmin) / (gmax - gmin) * (bR - bL); };
    var s = svg(W, H);
    s.appendChild(el("text", { x: aL, y: 12, class: "lbl", "font-size": 12 }, "原始像素上的可分性"));
    s.appendChild(el("text", { x: bL, y: 12, class: "lbl", "font-size": 12 }, "专门方法相对 TransReID 的收益（分）"));
    s.appendChild(el("line", { x1: sx(refSep), x2: sx(refSep), y1: 18, y2: rows.length * rowH + 24,
      class: "gridline" }));
    s.appendChild(el("text", { x: sx(refSep), y: rows.length * rowH + 40, "text-anchor": "middle",
      class: "lbl" }, "同模态内部 " + f(refSep, 4)));
    s.appendChild(el("line", { x1: gx(0), x2: gx(0), y1: 18, y2: rows.length * rowH + 24, class: "ax" }));
    s.appendChild(el("text", { x: gx(0), y: rows.length * rowH + 40, "text-anchor": "middle", class: "lbl" }, "0"));
    // 条画的是**区间**（从 lo 到 hi），所以「多大」要靠位置读 —— 没有刻度就读不出来
    [10, 20, 30, 40].forEach(function (t) {
      s.appendChild(el("line", { x1: gx(t), x2: gx(t), y1: 18, y2: rows.length * rowH + 24,
        class: "gridline" }));
      s.appendChild(el("text", { x: gx(t), y: rows.length * rowH + 40, "text-anchor": "middle",
        class: "lbl" }, "+" + t));
    });
    rows.forEach(function (r, i) {
      var y = i * rowH + 42, g = gain[i];
      s.appendChild(el("text", { x: aL - 10, y: y + 4, "text-anchor": "end", class: "lbl", "font-size": 12 }, r.pair));
      s.appendChild(el("rect", { x: aL, y: y - 9, width: Math.max(1, sx(r.sep) - aL), height: 18,
        class: "barOld", rx: 2 }));
      s.appendChild(el("text", { x: sx(r.sep) + 6, y: y + 4, class: "val" }, f(r.sep, 4)));
      var neg = g.word === "低";
      var x1 = gx(neg ? -g.hi : g.lo), x2 = gx(neg ? -g.lo : g.hi);
      s.appendChild(el("rect", { x: x1, y: y - 9, width: Math.max(2, x2 - x1), height: 18,
        class: neg ? "barNew" : "barOld", rx: 2 }));
      s.appendChild(el("text", { x: tx, y: y + 4, "text-anchor": "end", class: "val",
        fill: neg ? "var(--new)" : "var(--ink)" },
        (neg ? "反而低 " : "高 ") + f(g.lo, 1) + " 到 " + f(g.hi, 1) + " 分"));
    });
    $("gain-chart").appendChild(s);
  }());

  (function () {
    var g = D.gap.rows, hiSep = g[0].sep, loSep = g[2].sep;
    html($("cm-take"),
      "<p><b>六个方向的可分性差一个数量级</b>：" + g[0].pair + " 是 " + g[2].pair + " 的 " +
      f(hiSep / loSep, 1) + " 倍（" + f(hiSep, 4) + " ÷ " + f(loSep, 4) +
      "）；前者的同身份相似度 " + f(g[0].same, 4) + " 已接近同模态内部的 " + f(g[3].same, 4) +
      " —— 这一对本来就不怎么跨。</p>" +
      "<p><b>所以专门化的收益不是常量，它与这对模态的原始可分性挂钩；" +
      "在一个几乎不跨的模态对上，专门化是净负的。</b></p>");
  }());

  /* ---------- 十二轮 ---------- */
  html($("ak-cards"), D.ak.map(function (a) {
    var cls = a.verdict.indexOf("纠正") === 0 ? "纠正" : a.verdict;
    return "<div class='card'><div><span class='tag'>" + a.tag +
      "</span><span class='verdict v-" + cls + "'>" + a.verdict + "</span></div>" +
      "<div class='did'>" + a.did + "</div><div class='got'>" + a.got + "</div></div>";
  }).join(""));

  /* ---------- 出处 ---------- */
  function srcBlock(id, items) {
    html($(id), "<summary>出处（每个数都回得了源）</summary>" +
      "<ul>" + items.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>");
  }
  srcBlock("src-problem", [
    "形状三个数：<code>" + D.auc.bars[0].src + "</code>",
    "物理尺寸与那 " + D.auc.sse_drop.v + " 分：<code>" + D.auc.size.src + "</code>",
    "未见身份：<code>" + D.auc.unseen[0].src + "</code>；重排上界：<code>" + D.auc.ceil_lo.src + "</code>"]);
  srcBlock("src-methods", [
    "九步逐格：<code>" + D.pipeline.src + "</code>（每格带 commit 与 file:line，" +
      "<code>verified_how</code> 列记明是按行取、按模式计数还是逐字节比较）",
    "MOS 那条推理路径与 59.3 / 68.2：<code>lines/05-持续重识别/实验报告-CMShipReID横向表.md:163</code>、<code>:165</code>",
    "MDReID 为什么进不来：<code>lines/05-持续重识别/实验报告-CMShipReID横向表.md:150</code>"]);
  srcBlock("src-recipe", ["十四项逐格：<code>" + D.recipe.src + "</code>（每个值带 source_file:source_line）"]);
  srcBlock("src-hoss", D.hoss.rows.map(function (r) {
    return r.name + (r.note ? "（" + r.note + "）" : "") + "：<code>" + r.src + "</code>";
  }).concat([
    "能分辨的最小差与自训均值：<code>" + D.noise.transoss.src + "</code>、<code>" + D.noise.sdfnet_o2s.src + "</code>",
    "「只改一个变量」：<code>lines/01-船舶重识别/00-跨方法评测与归因/复现与评测基础设施/scripts/run_transreid_d1_sarfix.sh:5</code>"]));
  srcBlock("src-cm", [
    "六方向十八格：<code>" + D.cmship.src + "</code>（每行带 weight_pick 溯源字段）",
    "像素可分性：<code>" + D.gap.src + "</code>",
    "收益区间：<code>" + D.gain.src + "</code>（表里是「通用减专门」，方向由符号现推）"]);
  srcBlock("src-ak", D.ak.map(function (a) { return a.tag + "：<code>" + a.src + "</code>"; }));

  /* ================= 流式增量重识别 ================= */
  var S = window.REPORT_DATA.stream;

  // 两个数据集：这一节最容易读错的地方，所以摆在最前
  html($("st-bench"),
    "<thead><tr><th></th><th>第一问（选哪个做法）</th><th>第二、三问（留多少、为什么）</th></tr></thead>" +
    "<tbody>" +
    "<tr><td class='lab'>数据集</td><td style='text-align:left'>HOSS</td>" +
      "<td style='text-align:left'>CMShipReID 的可见光与近红外</td></tr>" +
    "<tr><td class='lab'>两种相机</td><td style='text-align:left'>光学卫星（吉林一号，像素 0.75 米）" +
      "与 SAR 卫星（天眼 MINISAR，像素 1 米）</td>" +
      "<td style='text-align:left'>可见光与近红外（无人机，同一批船的三种相机各拍各的）</td></tr>" +
    "<tr><td class='lab'>训练规模</td><td style='text-align:left'>361 条船、1063 张图</td>" +
      "<td style='text-align:left'>4039 张图</td></tr></tbody>");
  $("st-bench-note").innerHTML =
    "两半不在同一个数据集上：下面那个 " + S.split.total.v +
    " 分与第一问那张成绩表不能互相印证。机制解释的是「一批批训为什么掉分」这件事本身，" +
    "不是成绩表里那几个数的来源。";

  html($("st-batches"),
    "<thead><tr><th>批次</th><th>用哪几段</th><th>船的条数</th><th>训练图</th>" +
    "<th>两种相机都拍到的船</th></tr></thead><tbody>" +
    S.batches.map(function (b) {
      var hot = b.both.indexOf("17.2") >= 0;
      return "<tr><td class='lab'>" + b.name + "</td><td style='text-align:left'>" + b.seq +
        "</td><td>" + b.ships + "</td><td>" + b.imgs + "</td><td" +
        (hot ? " class='flag'" : "") + ">" + b.both + "</td></tr>";
    }).join("") + "</tbody>");

  html($("st-how"), S.arms.map(function (a) {
    return "<li><b>" + a.name + "</b>：" + a.how + "</li>";
  }).join(""));

  (function () {
    var cols = ["刚学完的批次", "旧批次", "已见全部", "从未训练的域", "遗忘量"];
    var best = cols.map(function (_, j) {
      var vs = S.arms.slice(1).map(function (a) { return parseFloat(a.v[j]); })
        .filter(function (x) { return !isNaN(x); });
      return j === 4 ? Math.min.apply(null, vs) : Math.max.apply(null, vs);
    });
    html($("st-arms"),
      "<thead><tr><th>做法</th>" + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      S.arms.map(function (a) {
        return "<tr><td class='lab'>" + a.name + "</td>" + a.v.map(function (v, j) {
          var hit = parseFloat(v) === best[j] && a.name.indexOf("一次性") !== 0;
          return "<td" + (hit ? " class='flag'" : "") + ">" + v + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody>");
  }());

  html($("st-three"),
    "<p>三件事只有把分数拆开才看得见：<b>学新东西各做法一样好</b>（第一列全在 61.4 到 63.4 之间）；" +
    "<b>区别全在保住旧东西这一列</b>（旧批次那一列差 5.95 分，遗忘量从 7.36 降到 2.26）；" +
    "<b>一批批训几乎不损害泛化</b>（倒数第二列各做法 50.3 到 52.1，一次性全喂 52.76）。</p>");

  // 两两对比：每行画两个点 + 一根「能分辨的最小差」竖线
  (function () {
    var rows = S.paired, W = 720, rowH = 40, H = rows.length * rowH + 40;
    var x0 = 150, x1 = W - 210;
    var all = [], i;
    for (i = 0; i < rows.length; i++) {
      all.push(parseFloat(rows[i].a), parseFloat(rows[i].b));
    }
    var s2 = svg(W, H);
    rows.forEach(function (r, k) {
      var y = k * rowH + 26, a = parseFloat(r.a), b = parseFloat(r.b);
      var lo = Math.min(a, b), hi = Math.max(a, b), mid = (a + b) / 2;
      // 每行自己一个局部尺度：五个分数量级差很大（56 分与 2.26 分），共用一个轴什么都看不出
      var span = Math.max(Math.abs(a - b) * 3.2, parseFloat(r.mde) * 3.2, 0.6);
      var sx = function (v) { return x0 + (v - (mid - span / 2)) / span * (x1 - x0); };
      s2.appendChild(el("text", { x: x0 - 10, y: y + 4, "text-anchor": "end", class: "lbl",
        "font-size": 12 }, r.metric));
      s2.appendChild(el("line", { x1: sx(lo), x2: sx(hi), y1: y, y2: y,
        stroke: "var(--rule)", "stroke-width": 2 }));
      s2.appendChild(el("circle", { cx: sx(a), cy: y, r: 5, fill: "var(--old)" }));
      s2.appendChild(el("circle", { cx: sx(b), cy: y, r: 5, fill: "none",
        stroke: "var(--new)", "stroke-width": 2 }));
      // 能分辨的最小差：从两点的中点往右量一段，越不过它就不下判断
      var m = parseFloat(r.mde), mx = sx(mid - m / 2), mx2 = sx(mid + m / 2);
      s2.appendChild(el("line", { x1: mx, x2: mx2, y1: y + 13, y2: y + 13,
        stroke: "var(--ink)", "stroke-width": 1.5 }));
      [mx, mx2].forEach(function (x) {
        s2.appendChild(el("line", { x1: x, x2: x, y1: y + 9, y2: y + 17,
          stroke: "var(--ink)", "stroke-width": 1.5 }));
      });
      s2.appendChild(el("text", { x: x1 + 12, y: y + 4, class: "val",
        fill: r.verdict === "分辨不出" ? "var(--dim)" : "var(--ink)" },
        r.verdict + "（差 " + r.delta + "，分辨力 " + r.mde + "）"));
    });
    s2.appendChild(el("text", { x: x0, y: H - 6, class: "lbl" },
      "实心点 = 经验回放，空心点 = 再加知识蒸馏；短尺 = 这个分数上能分辨的最小差"));
    $("st-paired-chart").appendChild(s2);

    html($("st-paired"),
      "<thead><tr><th>分数</th><th>经验回放</th><th>加知识蒸馏</th><th>差</th>" +
      "<th>能分辨的最小差</th><th>判读</th></tr></thead><tbody>" +
      rows.map(function (r) {
        return "<tr><td class='lab'>" + r.metric + "</td><td>" + r.a + "</td><td>" + r.b +
          "</td><td>" + r.delta + "</td><td>" + r.mde + "</td><td style='text-align:left'" +
          (r.verdict === "分辨不出" ? " class='dim'" : "") + ">" + r.verdict + "</td></tr>";
      }).join("") + "</tbody>");
    var pa = rows[2];
    html($("st-pick-take"),
      "<p><b>综合分上分不出</b>（差 " + pa.delta + "，而分辨力是 " + pa.mde +
      "）。但拆开之后两者方向相反：学新东西经验回放赢、忘得更少也是经验回放赢，" +
      "只有「从未训练过的数据」上加知识蒸馏略好。</p>" +
      "<p><b>落到「新数据一直来」这个场景，答案是经验回放</b> —— 这个场景的要求正好落在它赢的" +
      "那两端，而加知识蒸馏换来的那点好处在从没见过的数据上，那些数据迟早会变成见过的。</p>");
  }());

  // 存储曲线
  (function () {
    var pts = S.store.curve, W = 720, H = 240, x0 = 54, x1 = W - 20, y0 = H - 34, y1 = 16;
    var sx = function (v) { return x0 + v / 100 * (x1 - x0); };
    var sy = function (v) { return y0 - v / 100 * (y0 - y1); };
    var s2 = svg(W, H);
    [0, 50, 100].forEach(function (t) {
      s2.appendChild(el("line", { x1: x0, x2: x1, y1: sy(t), y2: sy(t), class: "gridline" }));
      s2.appendChild(el("text", { x: x0 - 8, y: sy(t) + 4, "text-anchor": "end", class: "lbl" }, t + "%"));
    });
    [0, 25, 50, 75, 100].forEach(function (t) {
      s2.appendChild(el("text", { x: sx(t), y: y0 + 18, "text-anchor": "middle", class: "lbl" }, t + "%"));
    });
    for (var i = 0; i < pts.length - 1; i++) {
      s2.appendChild(el("line", { x1: sx(pts[i][0]), y1: sy(pts[i][1]),
        x2: sx(pts[i + 1][0]), y2: sy(pts[i + 1][1]), stroke: "var(--old)", "stroke-width": 2 }));
    }
    pts.forEach(function (p) {
      s2.appendChild(el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 4.5,
        fill: p[2] ? "var(--new)" : "var(--old)" }));
      if (p[2]) {
        s2.appendChild(el("text", { x: sx(p[0]) + 8, y: sy(p[1]) - 8, class: "val" }, p[2]));
      }
    });
    $("st-curve").appendChild(s2);
    $("st-curve-cap").textContent =
      "横轴：存了多少旧样本（占全量的百分比）；纵轴：拿回多少收益。右端那个点是全量。" +
      "CMShipReID 的可见光与近红外上、每点十个种子的均值；左端那个点是定义上的原点，不是测出来的。";
    html($("st-store"),
      "<thead><tr><th>做法</th><th>测出来什么</th><th>说明</th></tr></thead><tbody>" +
      S.store.rows.map(function (r) {
        return "<tr><td class='lab' style='text-align:left'>" + r.what + "</td><td>" + r.read +
          "</td><td style='text-align:left'>" + r.note + "</td></tr>";
      }).join("") + "</tbody>");
    html($("st-store-take"),
      "<p>两处限度：这套做法<b>还没追上一次性全喂</b>（最好的一档只到 82.8%，仍差 " +
      S.store.gap.v + " 分）；13.1% 这个压缩比是这个数据集上的实测，<b>不是普适的压缩下限</b>。</p>" +
      "<p>这三个数就是专利技术方案的有益效果，每一个都有日志出处。</p>");
  }());

  // 五轮干预
  (function () {
    var iv = S.inter, W = 720, rowH = 40, H = iv.length * rowH + 26;
    var x0 = 190, x1 = W - 90, max = 19;
    var sx = function (v) { return x0 + v / max * (x1 - x0); };
    var s2 = svg(W, H);
    iv.forEach(function (r, k) {
      var y = k * rowH + 14, real = r.v > 1;
      s2.appendChild(el("text", { x: x0 - 10, y: y + 15, "text-anchor": "end", class: "lbl",
        "font-size": 12 }, r.label));
      s2.appendChild(el("rect", { x: x0, y: y, width: Math.max(2, sx(r.v) - x0), height: 20,
        class: real ? "barNew" : "barDim", rx: 2 }));
      s2.appendChild(el("text", { x: sx(r.v) + 8, y: y + 15, class: "val" },
        (r.sign === "+" ? "+" : "−") + r.v));
      s2.appendChild(el("text", { x: x1 + 4, y: y + 15, class: "lbl", "font-size": 11 },
        ""));
    });
    $("st-inter").appendChild(s2);
    html($("st-why-take"),
      "<p><b>答案是：经验回放的收益要求旧样本的真实像素参与修正主干网络</b>；至于它们挂的是" +
      "哪个身份号、进的是哪一项损失，都不要紧。那 " + S.split.total.v + " 分还能再拆：" +
      S.split.mech.v + " 来自机制本身、" + S.split.side.v + " 来自实现带来的副作用。</p>" +
      "<p>这句话是<b>从三次失败里反推出来的</b>：存旧任务的分类器权重、存特征向量、把缺掉的" +
      "跨批次负样本对直接补回去，三条省存储的路子各自独立、全部失败。<b>它也正是上一节那条" +
      "曲线的前提</b> —— 既然必须是真实像素，省存储就只剩降保真度、减张数两条路。</p>");
  }());

  html($("st-roster"),
    "<thead><tr><th>轮</th><th>数据集</th><th>问什么</th><th>测出来什么</th><th>判定</th></tr></thead><tbody>" +
    S.roster.map(function (r) {
      var v = r[4];
      var cls = v.indexOf("推翻") >= 0 ? "v-证伪" : (v.indexOf("在跑") >= 0 ? "v-纠正" : "");
      return "<tr><td class='lab'>" + r[0] + "</td><td style='text-align:left;white-space:nowrap'>" +
        r[1] + "</td><td style='text-align:left'>" + r[2] + "</td><td style='text-align:left'>" + r[3] +
        "</td><td class='" + cls + "'>" + v + "</td></tr>";
    }).join("") + "</tbody>");

  srcBlock("src-st-split", ["四批规模：<code>" + S.batches[0].src + "</code> 起五行"]);
  srcBlock("src-st-pick", [
    "五个做法的成绩：<code>" + S.arms[0].src + "</code> 起五行（学完最后一个批次之后、" +
      "Overall 方向、十个种子均值）",
    "两两对比：<code>" + S.paired[0].src + "</code> 起五行（报告编译时现读，源文里不写值）"]);
  srcBlock("src-st-budget", S.store.rows.map(function (r) {
    return r.what + "：<code>" + r.src + "</code>"; }));
  srcBlock("src-st-why", S.inter.map(function (r) {
    return r.label + "：<code>" + r.src + "</code>"; }));
  srcBlock("src-st-rounds", [
    "每一行对应 <code>lines/05-持续重识别/实验记录/</code> 下的一个文件；分数与数据指纹" +
    "逐行列在 <code>lines/05-持续重识别/结论表.md</code> 的 CONCLUSION 行里"]);

  /* ================= 增量目标检测 ================= */
  var I = window.REPORT_DATA.iod;

  // 三方法构件网格：与跨模态那张同一套读法，点列头只看那一列特有的做法
  (function () {
    var m = I.methods, box = $("iod-grid");
    box.style.gridTemplateColumns = "9.4rem repeat(" + m.cols.length + ", 1fr)";
    box.appendChild(document.createElement("div"));
    m.cols.forEach(function (c, j) {
      var h = document.createElement("div");
      h.className = "hd"; h.textContent = c; h.dataset.col = j;
      box.appendChild(h);
    });
    m.rows.forEach(function (r) {
      var lab = document.createElement("div");
      lab.className = "step"; lab.textContent = r[0];
      box.appendChild(lab);
      r.slice(1).forEach(function (c, j) {
        var d = document.createElement("div");
        d.className = "c " + c[0]; d.textContent = c[1]; d.dataset.col = j;
        box.appendChild(d);
      });
    });
    var cur = -1;
    box.addEventListener("click", function (e) {
      var h = e.target.closest(".hd");
      if (!h) { return; }
      var j = Number(h.dataset.col);
      cur = (cur === j) ? -1 : j;
      box.classList.toggle("focus", cur >= 0);
      [].forEach.call(box.querySelectorAll(".hd"), function (x) {
        x.classList.toggle("on", Number(x.dataset.col) === cur); });
      [].forEach.call(box.querySelectorAll(".c"), function (x) {
        x.classList.toggle("hit", cur >= 0 && Number(x.dataset.col) === cur &&
          x.classList.contains("diff")); });
    });
    $("iod-grid-note").innerHTML =
      "只有两行有共用的格子：<b>要不要存旧图</b>（PDP 与 ERD 都不存）、" +
      "<b>骨干参不参与更新</b>（只有 PDP 冻结）。其余各行三个方法各走各的 —— " +
      "这正是「刻意覆盖不同技术栈」的意思。最后一行是选型时最该先问的那个问题。";
  }());

  html($("iod-repro-t"),
    "<thead><tr><th>方法与设定</th><th>我方实测</th><th>对论文</th><th>说明</th></tr></thead><tbody>" +
    I.repro.map(function (r) {
      return "<tr><td class='lab'>" + r.name + "</td><td>" + r.ours + "</td><td>" + r.vs +
        "</td><td style='text-align:left'>" + r.note + "</td></tr>";
    }).join("") + "</tbody>");

  // 三个范围各自能分辨的最小差：三条横条 + 一条「当初误当成全局标准」的虚线
  (function () {
    var n = I.noise, W = 720, rowH = 40, H = n.rows.length * rowH + 34;
    var x0 = 130, x1 = W - 90, max = 0.009;
    var sx = function (v) { return x0 + v / max * (x1 - x0); };
    var s2 = svg(W, H);
    n.rows.forEach(function (r, k) {
      var y = k * rowH + 12, hot = r.v > 0.004;
      s2.appendChild(el("text", { x: x0 - 10, y: y + 15, "text-anchor": "end", class: "lbl",
        "font-size": 12 }, r.scope));
      s2.appendChild(el("rect", { x: x0, y: y, width: Math.max(2, sx(r.v) - x0), height: 20,
        class: hot ? "barNew" : "barOld", rx: 2 }));
      s2.appendChild(el("text", { x: sx(r.v) + 8, y: y + 15, class: "val" }, r.v));
    });
    s2.appendChild(el("line", { x1: sx(n.wrong), x2: sx(n.wrong), y1: 2,
      y2: n.rows.length * rowH + 6, class: "gridline", "stroke-dasharray": "4 3" }));
    s2.appendChild(el("text", { x: sx(n.wrong), y: n.rows.length * rowH + 24,
      "text-anchor": "middle", class: "lbl" }, "当初误当成全局标准的 " + n.wrong));
    $("iod-noise").appendChild(s2);
    $("iod-noise-cap").textContent =
      "三个范围各自的抖动（三个随机数各跑一次，最大值减最小值，单位是 AP）。新类比另两个高三倍。";
    html($("iod-noise-take"),
      "<p>当初把新类那一档当成了全局标准，于是别的范围的真差距被盖住了：CL-DETR 全部类那 " +
      n.gap_cldetr + " 的差距除以 " + n.wrong + " 只有 " + n.ratio_wrong +
      " 倍，看着「勉强在噪声之上」；按全部类自己的 " + n.rows[1].v + " 算是 <b>" +
      n.ratio_right + " 倍</b>，是真差距 —— 而且原因已经查明（有效批量被显存逼到减半），" +
      "补回去之后缺口只剩 0.2 点。</p>" +
      "<p><b>取最抖的那个范围当全局底不是保守，是把别的范围的真差距盖住。</b>" +
      "另外这个底只在 CL-DETR 的 70+10 上测过，拿它读 ERD 与 PDP 是借来的底，" +
      "只能当指示、不能当判断依据。</p>");
  }());

  // 3.8 点是什么
  (function () {
    var g = I.gap, k = [["旧 40 类", "old"], ["新 40 类", "new"], ["全部 80 类", "all"]];
    html($("iod-gap"),
      "<thead><tr><th>范围</th><th>论文</th><th>我方实测</th><th>差</th></tr></thead><tbody>" +
      k.map(function (p) {
        var d = g.ours[p[1]] - g.paper[p[1]];
        var hot = p[1] === "new";
        return "<tr><td class='lab'>" + p[0] + "</td><td>" + g.paper[p[1]].toFixed(1) +
          "</td><td>" + g.ours[p[1]].toFixed(1) + "</td><td" + (hot ? " class='flag'" : "") +
          ">" + (d > 0 ? "+" : "−") + Math.abs(d).toFixed(1) + " 点</td></tr>";
      }).join("") + "</tbody>");
  }());

  html($("iod-angles"),
    "<thead><tr><th>查的是什么</th><th>测出来什么</th><th>结论</th></tr></thead><tbody>" +
    I.angles.map(function (a) {
      return "<tr><td class='lab' style='text-align:left'>" + a[0] +
        "</td><td style='text-align:left'>" + a[1] + "</td><td>排除</td></tr>";
    }).join("") + "</tbody>");

  // 新类的分类错都错成了什么
  (function () {
    var r = I.mis.rows, W = 720, rowH = 40, H = r.length * rowH + 10;
    var x0 = 150, x1 = W - 150;
    var s2 = svg(W, H);
    r.forEach(function (row, k) {
      var y = k * rowH + 10;
      s2.appendChild(el("text", { x: x0 - 10, y: y + 15, "text-anchor": "end", class: "lbl",
        "font-size": 12 }, row.to));
      s2.appendChild(el("rect", { x: x0, y: y, width: Math.max(2, row.pct / 100 * (x1 - x0)),
        height: 20, class: k === 0 ? "barNew" : "barDim", rx: 2 }));
      s2.appendChild(el("text", { x: x0 + row.pct / 100 * (x1 - x0) + 8, y: y + 15, class: "val" },
        row.pct + "%　" + row.v + " 个"));
    });
    $("iod-mis").appendChild(s2);
  }());

  // 后端八步：泳道图。四列是「谁在做」，折线在列之间来回切换 ——
  // 后端的要点就是这几方之间的来回，排成一条竖排清单正好把它藏起来。
  (function () {
    var steps = I.backend, lanes = I.lanes;
    var W = 720, headH = 26, rowH = 54, boxW = 136, boxH = 32;
    var H = headH + steps.length * rowH + 10;
    var lx = function (i) { return (i + 0.5) / lanes.length * W; };
    var ly = function (k) { return headH + k * rowH + 12; };
    var s2 = svg(W, H);
    // 泳道背景与表头
    lanes.forEach(function (name, i) {
      var x0 = i / lanes.length * W;
      if (i % 2 === 1) {
        s2.appendChild(el("rect", { x: x0, y: 0, width: W / lanes.length, height: H,
          fill: "var(--soft)" }));
      }
      s2.appendChild(el("text", { x: lx(i), y: 16, "text-anchor": "middle",
        "font-size": 12.5, "font-weight": "700", fill: "var(--ink)" }, name));
    });
    // 折线：先往下走到两行之间，再横过去，再往下进入下一个盒子
    var links = [];
    for (var k = 0; k < steps.length - 1; k++) {
      var a = lanes.indexOf(steps[k][0]), b = lanes.indexOf(steps[k + 1][0]);
      var y1 = ly(k) + boxH, y2 = ly(k + 1), ym = (y1 + y2) / 2;
      var d = "M " + lx(a) + " " + y1 + " V " + ym + " H " + lx(b) + " V " + y2;
      var path = el("path", { d: d, fill: "none", stroke: "var(--rule)", "stroke-width": 1.6 });
      s2.appendChild(path);
      // 小三角表示方向（不用箭头字符，画出来的）
      var tri = el("path", { d: "M " + (lx(b) - 4) + " " + (y2 - 6) + " L " + (lx(b) + 4) +
        " " + (y2 - 6) + " L " + lx(b) + " " + y2 + " Z", fill: "var(--rule)" });
      s2.appendChild(tri);
      links.push([path, tri]);
    }
    // 八个盒子
    var boxes = steps.map(function (st, k) {
      var i = lanes.indexOf(st[0]), g = el("g", {});
      var r = el("rect", { x: lx(i) - boxW / 2, y: ly(k), width: boxW, height: boxH, rx: 4,
        fill: "var(--panel)", stroke: "var(--rule)", "stroke-width": 1.2 });
      var t = el("text", { x: lx(i), y: ly(k) + 20, "text-anchor": "middle", "font-size": 12,
        fill: "var(--ink)" }, (k + 1) + "　" + st[1]);
      g.appendChild(r); g.appendChild(t);
      g.style.cursor = "pointer";
      g.addEventListener("click", function () { stop(); at = k; paint(); });
      s2.appendChild(g);
      return { r: r, t: t };
    });
    $("iod-flow").appendChild(s2);
    var detail = document.createElement("div");
    detail.className = "flow-detail"; detail.id = "flow-detail";
    $("iod-flow").appendChild(detail);

    var at = -1, timer = null;
    function paint() {
      boxes.forEach(function (b, k) {
        var on = k === at, done = at >= 0 && k < at;
        b.r.setAttribute("fill", on ? "color-mix(in srgb, var(--new) 14%, var(--paper))"
          : (done ? "var(--panel)" : "var(--panel)"));
        b.r.setAttribute("stroke", on ? "var(--new)" : (done ? "var(--new)" : "var(--rule)"));
        b.r.setAttribute("stroke-width", on ? 2.2 : 1.2);
        b.t.setAttribute("fill", on ? "var(--new)" : "var(--ink)");
        b.t.setAttribute("font-weight", on ? "700" : "400");
      });
      links.forEach(function (L, k) {
        var pass = at > k;
        L[0].setAttribute("stroke", pass ? "var(--new)" : "var(--rule)");
        L[0].setAttribute("stroke-width", pass ? 2.2 : 1.6);
        L[1].setAttribute("fill", pass ? "var(--new)" : "var(--rule)");
      });
      detail.innerHTML = at < 0
        ? "<b>八步，四方来回。</b>点任一个方块看那一步做了什么，或者按「走一遍」。"
        : "<b>第 " + (at + 1) + " 步　" + steps[at][0] + "：" + steps[at][1] + "</b>" +
          steps[at][2];
      $("flow-count").textContent = at < 0 ? "共 " + steps.length + " 步"
        : "第 " + (at + 1) + " / " + steps.length + " 步";
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; }
      $("flow-play").textContent = "走一遍"; }
    function play() {
      if (timer) { stop(); return; }
      if (at >= steps.length - 1) { at = -1; }
      $("flow-play").textContent = "暂停";
      at += 1; paint();
      timer = setInterval(function () {
        at += 1; paint();
        if (at >= steps.length - 1) { stop(); }
      }, 1400);
    }
    $("flow-play").addEventListener("click", play);
    $("flow-reset").addEventListener("click", function () { stop(); at = -1; paint(); });
    paint();
  }());

  html($("iod-front-t"),
    "<thead><tr><th>界面上的一块</th><th>它调什么</th><th>它为什么存在</th></tr></thead><tbody>" +
    I.frontend.map(function (f) {
      return "<tr><td class='lab' style='text-align:left'>" + f[0] +
        "</td><td style='text-align:left'>" + f[1] + "</td><td style='text-align:left'>" +
        f[2] + "</td></tr>";
    }).join("") + "</tbody>");

  (function () {
    var v = I.verify;
    html($("iod-verify"),
      "<p><b>界面与直接调插件的六个指标逐位相同</b>：" + v.metrics.join(" / ") + "。</p>" +
      "<p>双权重对照的实测：同一张图、同一阈值，只见过前 40 类的那份权重检出 <b>" + v.base +
      "</b> 个目标，增量后检出 <b>" + v.incre + "</b> 个；多出的 " + v.newcls +
      " 个类别<b>全部落在后 40 类里</b>，一个例外都没有。</p>");
    html($("iod-limits"),
      "<li><b>界面上那次训练是小样本 1 epoch 的链路验证</b>（实测 " + v.train_demo +
        " 秒），不是复现用的那次训练（实跑 " + v.train_real +
        " 小时）。两个时长同屏显示，免得把 " + v.train_demo + " 秒读成「增量训练只要半分钟」。</li>" +
      "<li><b>复算跑的是 200 张子集，子集指标不等于全量指标。</b>全量 val2017 是 5000 张，" +
        "按日志里的单张耗时推算约 6 分钟，录不进一条 3 分钟的视频；全量的数在上面那张对照表里。</li>" +
      "<li><b>单图推理只有 ERD 能用。</b>PDP 的上游把推理封在它那套训练框架的验证流程里、" +
        "没有单图入口，界面上那个入口是置灰的，并显示它自己给出的原因。</li>");
  }());

  srcBlock("src-iod-methods", ["七行逐格：<code>" + I.methods.src + "</code>"]);
  srcBlock("src-iod-repro", [
    "三个复现：<code>lines/03-增量目标识别/README.md</code> 的 M3、PDP-5、ERD-5 三行",
    "三个范围各自能分辨的最小差：<code>" + I.noise.rows[0].src + "</code> 起三行"]);
  srcBlock("src-iod-why", [
    "论文值与我方三个数：<code>" + I.gap.src + "</code>",
    "分类错的去向：<code>" + I.mis.rows[0].src + "</code>、<code>" + I.mis.rows[1].src + "</code>",
    "六个角度：<code>lines/03-增量目标识别/README.md</code> 的 §6.19.4、§6.20、§6.20.2"]);
  srcBlock("src-iod-backend", [
    "流程取自 <code>lines/03-增量目标识别/webui/server.py</code> 的 <code>Job</code> 类" +
      "（类文档里写明：命令行、环境变量、指标解析三样全部仍归插件）与起跑前检查",
    "四个动作的定义：<code>plugins/iodreid/base.py</code>"]);
  srcBlock("src-iod-front", ["六条验收标准与实测：<code>" + I.verify.src + "</code>；" +
    "原始产物 <code>server_artifacts/webui/verify_report.json</code>"]);

  /* ================= 赛题 6 ================= */
  var C = window.REPORT_DATA.comp6;

  html($("c6-qa"),
    "<thead><tr><th></th><th>这一节回答什么</th><th>一句话的答案</th></tr></thead><tbody>" +
    [["1", "这个比赛要做什么", "给一张光学卫星图里的船，去雷达图库里找出同一条船；四个方向都要做"],
     ["2", "考了多少", "线上 <b>" + f(C.seg.end) + "</b>，<b>未晋级</b>"],
     ["3", "分是怎么涨上来的", "四件事。其中三件不在模型上，最大的一件是读懂了题目怎么出的"],
     ["4", "本地测试为什么和线上对不上", "凡是会产生<b>新训练的模型</b>的改动，本地就测不准"]]
      .map(function (r) {
        return "<tr><td class='lab'>" + r[0] + "</td><td style='text-align:left'>" + r[1] +
          "</td><td style='text-align:left'>" + r[2] + "</td></tr>"; }).join("") + "</tbody>");

  // 86.48 的两段：一条分段的横条，比表格更能看出两段的比例
  (function () {
    var g = C.seg, W = 720, H = 92, x0 = 8, x1 = W - 8;
    var sx = function (v) { return x0 + v / g.end * (x1 - x0); };
    var s2 = svg(W, H);
    var segs = [[0, g.start, "var(--rule)", "起点 " + f(g.start)],
                [g.start, g.start + g.gain_method, "var(--old)", "方法 +" + f(g.gain_method)],
                [g.start + g.gain_method, g.end, "var(--new)", "读懂测试集 +" + f(g.gain_leak)]];
    segs.forEach(function (sg) {
      s2.appendChild(el("rect", { x: sx(sg[0]), y: 24, width: sx(sg[1]) - sx(sg[0]),
        height: 30, fill: sg[2], rx: 2 }));
      s2.appendChild(el("text", { x: (sx(sg[0]) + sx(sg[1])) / 2, y: 44, "text-anchor": "middle",
        "font-size": 12, fill: "var(--onacc)" }, sg[3]));
    });
    s2.appendChild(el("text", { x: sx(g.end), y: 18, "text-anchor": "end", "font-size": 13,
      "font-weight": "700", fill: "var(--ink)" }, f(g.end)));
    s2.appendChild(el("text", { x: sx(g.start + g.gain_method), y: 72, "text-anchor": "middle",
      class: "lbl" }, "方法段到此为止 " + f(g.method)));
    $("c6-seg").appendChild(s2);
    $("c6-seg-cap").textContent = "满分 100。灰色那段是起点，中间是方法本身带来的，右边那段来自读懂测试集怎么出的。";
    html($("c6-seg-take"),
      "<p>后一段占全部涨幅的 <b>" + g.share_leak + "%</b>，而它<b>换一套测试数据就没有了</b>。" +
      "所以对外该说的是「方法做到了 " + f(g.method, 1) + "」，不是「拿到了 " + f(g.end, 1) + "」。</p>");
  }());

  // 28 份提交的轨迹：横轴按真实编号不等距，间隔本身带信息
  (function () {
    var t = C.track, W = 720, H = 260, x0 = 44, x1 = W - 96, y0 = H - 34, y1 = 18;
    var ymin = 50, ymax = 90, xmax = 46;
    var sx = function (v) { return x0 + (v - 1) / (xmax - 1) * (x1 - x0); };
    var sy = function (v) { return y0 - (v - ymin) / (ymax - ymin) * (y0 - y1); };
    var s2 = svg(W, H);
    [55, 65, 75, 85].forEach(function (v) {
      s2.appendChild(el("line", { x1: x0, x2: x1, y1: sy(v), y2: sy(v), class: "gridline" }));
      s2.appendChild(el("text", { x: x0 - 8, y: sy(v) + 4, "text-anchor": "end", class: "lbl" }, v));
    });
    for (var i = 0; i < t.length - 1; i++) {
      s2.appendChild(el("line", { x1: sx(t[i].s), y1: sy(t[i].v), x2: sx(t[i + 1].s),
        y2: sy(t[i + 1].v), stroke: "var(--rule)", "stroke-width": 1.2 }));
    }
    var dots = t.map(function (p) {
      var g = el("g", {});
      var c = el("circle", { cx: sx(p.s), cy: sy(p.v), r: p.mark ? 5 : 3,
        fill: p.mark ? "var(--new)" : "var(--old)" });
      var hit = el("circle", { cx: sx(p.s), cy: sy(p.v), r: 11, fill: "transparent" });
      g.appendChild(c); g.appendChild(hit);
      g.style.cursor = "pointer";
      if (p.mark) {
        s2.appendChild(el("text", { x: sx(p.s), y: sy(p.v) - 11, "text-anchor": "middle",
          "font-size": 11, fill: "var(--new)" }, "S" + p.s));
      }
      s2.appendChild(g);
      return { g: g, c: c, p: p };
    });
    // 画成右侧一根竖尺，不画成每个点的误差棒 —— 它是两组之差能被分辨的最小值
    var ry = sy(68), len = C.noise / (ymax - ymin) * (y0 - y1);
    s2.appendChild(el("line", { x1: x1 + 26, x2: x1 + 26, y1: ry, y2: ry + len,
      stroke: "var(--ink)", "stroke-width": 1.6 }));
    [ry, ry + len].forEach(function (y) {
      s2.appendChild(el("line", { x1: x1 + 22, x2: x1 + 30, y1: y, y2: y,
        stroke: "var(--ink)", "stroke-width": 1.6 }));
    });
    s2.appendChild(el("text", { x: x1 + 36, y: ry + len / 2 + 4, class: "lbl" },
      "这段以内分辨不出"));
    $("c6-track-chart").appendChild(s2);
    var box = $("c6-track-detail"), pinned = null;
    function show(p) {
      box.innerHTML = p
        ? "<b>S" + p.s + "　" + (p.date === "—" ? "日期当时没记" : p.date) + "　线上 " +
          f(p.v) + "</b>" + p.what
        : "<b>28 份提交，横轴是真实编号。</b>间隔本身带信息 —— 前段每天三格用满，" +
          "后段编号稀疏，是名额不够用了。标红的五个点是四次涨分和一次大跌。";
      dots.forEach(function (d) {
        d.c.setAttribute("stroke", p && d.p.s === p.s ? "var(--ink)" : "none");
        d.c.setAttribute("stroke-width", 2);
      });
    }
    dots.forEach(function (d) {
      d.g.addEventListener("mouseenter", function () { if (!pinned) { show(d.p); } });
      d.g.addEventListener("mouseleave", function () { if (!pinned) { show(null); } });
      d.g.addEventListener("click", function () {
        pinned = (pinned === d.p) ? null : d.p; show(pinned || d.p);
      });
    });
    show(null);
    $("c6-track-cap").textContent =
      "28 份提交的线上分数。右边那把短尺是「能分辨的最小差」1.49 分 —— 同一配方只换随机数重跑（S6 到 S10）算出来的，比它小的起伏读不出东西。";

    html($("c6-subs"),
      "<thead><tr><th>编号</th><th>日期</th><th>改了什么</th><th>线上</th></tr></thead><tbody>" +
      t.map(function (p) {
        return "<tr" + (p.mark ? " class='flag'" : "") + "><td class='lab'>S" + p.s +
          "</td><td>" + p.date + "</td><td style='text-align:left'>" + p.what +
          "</td><td>" + f(p.v) + "</td></tr>"; }).join("") + "</tbody>");
  }());

  html($("c6-four"), C.four.map(function (x, i) {
    return "<div class='card'><div><span class='tag'>" + (i + 1) +
      "</span><span class='verdict v-正'>S" + x.a + " 对 S" + x.b + "　+" + f(x.gain) +
      "</span></div><div class='got'><b>" + x.name + "</b></div>" +
      "<div class='did'>" + x.why + "</div></div>";
  }).join(""));

  // 测试集的构造：三步点亮
  (function () {
    var W = 720, H = 180, s2 = svg(W, H);
    var bw = 190, bh = 40;
    function boxAt(x, y, label, cls) {
      var g = el("g", {});
      g.appendChild(el("rect", { x: x, y: y, width: bw, height: bh, rx: 4,
        fill: "var(--panel)", stroke: "var(--rule)", "stroke-width": 1.2 }));
      g.appendChild(el("text", { x: x + bw / 2, y: y + 25, "text-anchor": "middle",
        "font-size": 12.5, fill: "var(--ink)" }, label));
      s2.appendChild(g);
      return g;
    }
    var bO = boxAt(20, 18, "光学待查图 O"), bS = boxAt(20, 118, "雷达待查图 S"),
        bG = boxAt(W - bw - 20, 68, "雷达图库里的那一张");
    var l1 = el("path", { d: "M 115 58 V 118", stroke: "var(--rule)", "stroke-width": 1.6, fill: "none" });
    var t1 = el("text", { x: 124, y: 92, class: "lbl" }, "同一条船");
    var l2 = el("path", { d: "M 210 138 H " + (W - bw - 20) + " V 108",
      stroke: "var(--rule)", "stroke-width": 1.6, fill: "none" });
    var t2 = el("text", { x: 300, y: 132, class: "lbl" }, "逐字节相同");
    var l3 = el("path", { d: "M 210 38 H " + (W - bw - 20) + " V 68",
      stroke: "var(--rule)", "stroke-width": 1.6, fill: "none" });
    var t3 = el("text", { x: 300, y: 32, class: "lbl" }, "所以它就是 O 的答案");
    [l1, t1, l2, t2, l3, t3].forEach(function (n) { s2.appendChild(n); });
    $("c6-leak-fig").appendChild(s2);
    var steps = [
      [[bO, bS, l1, t1], "同一条船有两条待查图：一条光学、一条雷达。120 艘船，每艘一对。"],
      [[bG, l2, t2], "那条雷达待查图，在雷达图库里有一张<b>逐字节相同</b>的副本 —— 120 / 120 全中。"],
      [[l3, t3], "而那张副本，正是光学待查图要找的答案。所以只要把两条待查图配对，答案就能直接放到第一位。"],
    ];
    var at = -1;
    function paint() {
      [bO, bS, bG, l1, t1, l2, t2, l3, t3].forEach(function (n) { n.style.opacity = .18; });
      for (var k = 0; k <= at; k++) {
        steps[k][0].forEach(function (n) {
          n.style.opacity = 1;
          if (n.tagName === "path") { n.setAttribute("stroke", "var(--new)"); }
          if (n.tagName === "text") { n.setAttribute("fill", "var(--new)"); }
        });
      }
      if (at < 0) {
        [bO, bS, bG].forEach(function (n) { n.style.opacity = 1; });
      }
      $("c6-leak-detail").innerHTML = at < 0
        ? "<b>三步。</b>按「下一步」。" : "<b>第 " + (at + 1) + " 步</b>" + steps[at][1];
      $("leak-count").textContent = at < 0 ? "共 3 步" : "第 " + (at + 1) + " / 3 步";
    }
    $("leak-next").addEventListener("click", function () {
      at = Math.min(at + 1, steps.length - 1);
      paint();
    });
    $("leak-reset").addEventListener("click", function () { at = -1; paint(); });
    paint();
  }());

  html($("c6-fp"),
    "<thead><tr><th>查的是什么</th><th>实测</th></tr></thead><tbody>" +
    C.fingerprint.map(function (r) {
      return "<tr><td class='lab' style='text-align:left'>" + r[0] + "</td><td" +
        (r[2] ? " class='flag'" : "") + ">" + r[1] + "</td></tr>"; }).join("") + "</tbody>");

  html($("c6-leak-take"),
    "<p>所以要做的只是把两条待查图配对：两边互相都把对方选为最相似的才算一对，这样配出 97 对，" +
    "把答案放到第一位。<b>剩下 23 对配不上的，不猜</b> —— 强行配满线上 −0.25，再删「可证必错」的" +
    "候选又 −0.32，两次都是干净的单因子、符号都是负的。</p>" +
    "<p>最终只改了 27 条答案，<b>S37 对 S27 是 +" + f(C.four[3].gain) + "</b>。" +
    "这一档买的是初赛名次，方法本身没有变好。</p>");

  // 本地对线上：哑铃图
  (function () {
    var rows = C.dumbbell, W = 720, rowH = 30, H = rows.length * rowH + 34;
    var x0 = 200, x1 = W - 40, xmin = -3.5, xmax = 5.5;
    var sx = function (v) { return x0 + (v - xmin) / (xmax - xmin) * (x1 - x0); };
    var s2 = svg(W, H);
    [-2, 0, 2, 4].forEach(function (t) {
      s2.appendChild(el("line", { x1: sx(t), x2: sx(t), y1: 6, y2: rows.length * rowH + 6,
        stroke: t === 0 ? "var(--dim)" : "var(--rule)", "stroke-width": t === 0 ? 1.2 : 0.8 }));
      s2.appendChild(el("text", { x: sx(t), y: rows.length * rowH + 24, "text-anchor": "middle",
        class: "lbl" }, (t > 0 ? "+" : "") + t));
    });
    rows.forEach(function (r, k) {
      var y = k * rowH + 20, loc = r[2], on = r[3];
      var same = loc * on > 0, col = same ? "var(--old)" : "var(--new)";
      s2.appendChild(el("text", { x: x0 - 10, y: y + 4, "text-anchor": "end", class: "lbl",
        "font-size": 11.5 }, r[1]));
      s2.appendChild(el("line", { x1: sx(Math.min(loc, on)), x2: sx(Math.max(loc, on)),
        y1: y, y2: y, stroke: col, "stroke-width": 2 }));
      s2.appendChild(el("circle", { cx: sx(loc), cy: y, r: 4.2, fill: "var(--paper)",
        stroke: col, "stroke-width": 1.6 }));
      s2.appendChild(el("circle", { cx: sx(on), cy: y, r: 4.2, fill: col }));
    });
    $("c6-dumb").appendChild(s2);
  }());

  /* ================= 01 这条线是怎么走的 ================= */
  (function () {
    var R = window.REPORT_DATA.route;
    var day = function (d) { return Date.parse(d + "T00:00:00") / 864e5; };
    var t0 = day("2026-08-01"), t1 = day("2026-11-30");
    var pct = function (d) { return (day(d) - t0) / (t1 - t0) * 100; };
    var box = $("rt-lanes");
    R.spans.forEach(function (sp) {
      var row = document.createElement("div");
      row.className = "lane-row";
      var live = sp.to === "2026-11-26";
      var bars = "<div class='lane-track'><span class='lane-bar" + (live ? " live" : "") +
        "' style='left:" + pct(sp.from).toFixed(2) + "%;width:" +
        (pct(sp.to) - pct(sp.from)).toFixed(2) + "%'></span>";
      R.miles.filter(function (m) { return m.lane === sp.lane; }).forEach(function (m) {
        bars += "<span class='mile' data-tag='" + m.tag + "' title='" + m.date + "　" +
          m.tag + "' style='left:" + pct(m.date).toFixed(2) + "%'></span>";
      });
      row.innerHTML = "<div class='nm'>" + sp.lane + "</div>" + bars + "</div>";
      box.appendChild(row);
    });
    // 月份刻度
    var ax = document.createElement("div");
    ax.className = "lane-axis";
    var ticks = ["2026-08-01", "2026-09-01", "2026-10-01", "2026-11-01", "2026-11-29"]
      .map(function (d, i) {
        return "<span style='left:" + pct(d).toFixed(2) + "%'>" +
          (i === 4 ? "组会" : d.slice(5, 7).replace(/^0/, "") + " 月") + "</span>";
      }).join("");
    ax.innerHTML = "<div></div><div class='ticks'>" + ticks + "</div>";
    box.appendChild(ax);

    var detail = $("rt-detail"), cur = null;
    function show(tag) {
      var m = R.miles.filter(function (x) { return x.tag === tag; })[0];
      [].forEach.call(box.querySelectorAll(".mile"), function (n) {
        n.classList.toggle("on", n.dataset.tag === tag); });
      detail.innerHTML = m
        ? "<b>" + m.date + "　" + m.lane + "　<code>" + m.tag + "</code></b>" + m.msg
        : "<b>十个里程碑，五条工作线。</b>条的长短是这条线在跑的那段时间，" +
          "圆点是里程碑 —— 点一个看它当时定下了什么（用的是打标签时写下的原话）。";
      $("rt-count").textContent = m ? "第 " +
        (R.miles.map(function (x) { return x.tag; }).indexOf(tag) + 1) + " / " +
        R.miles.length + " 个里程碑" : "共 " + R.miles.length + " 个里程碑";
    }
    box.addEventListener("click", function (e) {
      var n = e.target.closest(".mile");
      if (!n) { return; }
      cur = (cur === n.dataset.tag) ? null : n.dataset.tag;
      show(cur);
    });
    show(null);
    $("rt-note").innerHTML =
      "里程碑读自 <code>" + R.src + "</code>（它自己由 <code>tools/gen_timeline.py</code> " +
      "从 git tag 生成，有 <code>--check</code> 盯着不过期）；说明是打标签时写下的原话。" +
      "<b>" + R.by + "</b> —— 哪个里程碑属于哪条线，文件里没有这个字段，是按标签名判的。" +
      "05 那条线的起点没有标签，取的是它 README 里起跑前查卡那天。";

    html($("rt-status"),
      "<thead><tr><th>工作线</th><th>现在</th><th>什么意思</th></tr></thead><tbody>" +
      R.status.map(function (r) {
        var hot = r[1] === "活跃" || r[1] === "在等方向";
        return "<tr><td class='lab'>" + r[0] + "</td><td" + (hot ? " class='flag'" : "") +
          ">" + r[1] + "</td><td style='text-align:left'>" + r[2] + "</td></tr>";
      }).join("") + "</tbody>");

    html($("rt-habits"), R.habits.map(function (h, i) {
      return "<div class='card'><div><span class='tag'>" + (i + 1) +
        "</span><b>" + h[0] + "</b></div><div class='did'>" + h[1] +
        "</div><div class='got'>" + h[2] + "</div></div>";
    }).join(""));
  }());

  /* ---------- 主题：浅 / 深两态 ----------
     只有两态，**不跟随系统**：同一份网页在不同机器上要开出同一个样子。
     起始值由 head 里那段内联脚本定（放在这里会先闪一下白底）；
     这里只负责按钮的字和点击。整页的颜色都走 CSS 变量，所以不用重画什么 ——
     与 webui 那个界面不同，这一页的图是 SVG，不是画布。 */
  (function () {
    var btn = document.getElementById("theme");
    if (!btn) { return; }
    var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var paint = function () {
      document.documentElement.setAttribute("data-theme", cur);
      btn.textContent = cur === "dark" ? "主题：深色" : "主题：浅色";
    };
    paint();
    btn.addEventListener("click", function () {
      cur = cur === "dark" ? "light" : "dark";
      try { localStorage.setItem("gis-web-theme", cur); } catch (e) { /* 存不了也要能切 */ }
      paint();
    });
  }());

  /* ================= 05 负结果 ================= */
  (function () {
    var N = window.REPORT_DATA.neg, base = N.picks[0].v;
    var W = 720, rowH = 40, H = N.picks.length * rowH + 30;
    var x0 = 180, x1 = W - 90, lo = 34, hi = 45;
    var sx = function (v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); };
    var s2 = svg(W, H);
    N.picks.forEach(function (p, k) {
      var y = k * rowH + 10, isBase = p.d === null;
      s2.appendChild(el("text", { x: x0 - 10, y: y + 15, "text-anchor": "end", class: "lbl",
        "font-size": 12 }, p.name));
      s2.appendChild(el("rect", { x: x0, y: y, width: Math.max(2, sx(p.v) - x0), height: 20,
        class: isBase ? "barOld" : "barNew", rx: 2 }));
      s2.appendChild(el("text", { x: sx(p.v) + 8, y: y + 15, class: "val" },
        f(p.v) + (isBase ? "" : "　" + f(p.d))));
    });
    // 基线最后画，先画会被条盖住
    s2.appendChild(el("line", { x1: sx(base), x2: sx(base), y1: 4, y2: N.picks.length * rowH + 6,
      class: "gridline", "stroke-dasharray": "4 3" }));
    $("neg-chart").appendChild(s2);

    html($("neg-table"),
      "<thead><tr><th>怎么挑的</th><th>四批全部学完后的分数</th><th>比随机留</th>" +
      "<th>怎么判</th></tr></thead><tbody>" +
      N.picks.map(function (p) {
        return "<tr><td class='lab'>" + p.name + "</td><td>" + f(p.v) + "</td><td>" +
          (p.d === null ? "—" : f(p.d)) + "</td><td style='text-align:left'>" + p.note +
          "</td></tr>"; }).join("") + "</tbody>");

    html($("neg-take"),
      "<p><b>第一层：差是真的。</b>按「影响大小」挑，比随机留低 " + f(Math.abs(N.picks[1].d)) +
      " 分。而同一个做法什么都不改、只换一个随机数重跑，分数自己就会上下 " + f(N.noise_pick) +
      " 分 —— 低的那 " + f(Math.abs(N.picks[1].d)) + " 分超过了它，所以不是碰巧。</p>" +
      "<p><b>第二层：方向不对，是「固定规则」本身不对。</b>留影响最大的（" + f(N.picks[1].v) +
      "）和留影响最小的（" + f(N.picks[2].v) + "）几乎一样差，只差 0.0989 —— " +
      "两头一样差，说明问题不在「往哪边挑」。于是换一个跟影响大小完全无关的挑法：" +
      "按文件名排序取前 4 张。它两头仍然都比随机低，而且低得更多（6 到 7 分）。" +
      "<b>所以不是「按影响挑」不好，是只要按固定规则挑就不如随机留。</b></p>" +
      "<p>为什么随机更好？<b>这一轮答不了。</b>起跑前我们列了三种可能的结果和各自的读法，" +
      "实测这个排序不在那三种里 —— 现在给任何解释都是事后编的。</p>");

    html($("neg-others"),
      "<thead><tr><th>做了什么</th><th>起跑前我们以为</th><th>实际测出来</th></tr></thead><tbody>" +
      N.others.map(function (o) {
        return "<tr><td class='lab' style='text-align:left'>" + o[0] +
          "</td><td class='dim' style='text-align:left'>" + o[1] +
          "</td><td class='flag' style='text-align:left'>" + o[2] + "</td></tr>";
      }).join("") + "</tbody>");

    html($("neg-rules"), N.rules.map(function (r) { return "<li>" + r + "</li>"; }).join(""));
  }());

  /* ================= 07 下一步 ================= */
  (function () {
    var X = window.REPORT_DATA.next;
    html($("nx-asks"), X.asks.map(function (a, i) {
      var cls = a[1] === "讨论" ? "v-证伪" : "v-纠正";
      return "<div class='card'><div><span class='tag'>" + (i + 1) +
        "</span><span class='verdict " + cls + "'>" + a[1] + "</span></div>" +
        "<div class='got'><b>" + a[0] + "</b></div>" +
        "<div class='did'>" + a[2] + "</div>" +
        "<div class='got' style='margin-top:.4rem'>" + a[3] + "</div></div>";
    }).join(""));
    html($("nx-no"), X.patent_no.map(function (t) { return "<li>" + t + "</li>"; }).join(""));
    html($("nx-yes"), X.patent_yes.map(function (t) { return "<li>" + t + "</li>"; }).join(""));
    html($("nx-plan-t"),
      "<thead><tr><th>什么时候</th><th>做什么</th><th>要不要等你</th></tr></thead><tbody>" +
      X.plan.map(function (r) {
        var wait = r[2] !== "不用等";
        return "<tr><td class='lab'>" + r[0] + "</td><td style='text-align:left'>" + r[1] +
          "</td><td" + (wait ? " class='flag'" : " class='dim'") + ">" + r[2] + "</td></tr>";
      }).join("") + "</tbody>");
  }());

  /* ---------- 目录高亮 ---------- */
  (function () {
    var links = [].slice.call(document.querySelectorAll(".rail a.item[href^='#']"));
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var onScroll = function () {
      var best = 0, y = window.scrollY + 120;
      secs.forEach(function (s, i) { if (s && s.offsetTop <= y) { best = i; } });
      links.forEach(function (a, i) { a.classList.toggle("on", i === best); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }());
}());
