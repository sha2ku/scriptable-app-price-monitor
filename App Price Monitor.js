// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: tag;
/*
 * Author: evilbutcher 修改自t.me/QuanXApp群友分享
 * Github: https://github.com/evilbutcher
 * 本脚本使用了@Gideon_Senku的Env，Peng-YM的OpenAPI！感谢！
 * 感谢@MuTu88帮忙测试！
 */
const $http = HTTP();

const app_monitor = {
  1563121109: {
    //监控价格，当真实价格与该价格不相等时进行折扣展示
    p: "$4.99",
    //别名展示
    n: "破碎的像素地牢",
  },
  1635315427: {
    p: "¥25.00",
  },
  6502453075: {
    p: "$9.99",
    n: "小丑牌",
  },
  1032708262: {
    p: "$2.99",
    n: "坠落深井",
  },
  6482989598: {
    p: "¥30.00",
  },
  1368013995: {
    p: "$4.99",
    n: "骰子地下城"
  }
};

let apps = [
  "1563121109|us", //破碎的像素地牢
  //   "1635315427", //暖雪
  "6502453075|us", //小丑牌
  "1368013995|us", //骰子地下城
  //   "1032708262|us", //坠落深井
  //   "6482989598", //侠客风云传前传
]; //app跟踪id
let reg = "cn"; //默认区域：美国us 中国cn 香港hk
let app_infos = [];
try {
  const con = importModule("Config");
  apps = con.apps();
  reg = con.reg();
  if (apps == [] || reg == "") {
    throw new Error(err);
  }
} catch (err) {
  if (apps == "" || reg == "") {
    log("请检查脚本内填入的App监控信息是否完整");
  }
}

!(async () => {
  await format_apps(apps);
  log(app_infos);
  let widget = createWidget(app_infos);
  Script.setWidget(widget);
  Script.complete();
})().catch((err) => {
  log("运行出现错误\n" + err);
});

function createWidget(app_infos) {
  const w = new ListWidget();

  const dateFormatter = new DateFormatter()
  dateFormatter.dateFormat = "HH:mm"
  const lastUpdateTime = `更新时间: ${dateFormatter.string(new Date())}`;

  addTitleTextToListWidget(lastUpdateTime, w);
  w.addSpacer(5);

  //打折排到最前
  app_infos.sort((a, b) => {
    if (a.is_sale === b.is_sale) {
      // 当 is_sale 相同时，按 content 字典序排序
      return a.content.localeCompare(b.content);
    }
    // is_sale 为 true 的排在前面
    return b.is_sale - a.is_sale;
  });

  for (const element of app_infos) {
    addTextToListWidget(element, w);
  }

  w.addSpacer();
  w.presentMedium();
  return w;
}

function addTextToListWidget(app_info, listWidget) {
  let text = app_info.content;
  const stack = listWidget.addStack();
  stack.setPadding(2, 15, 2, 15);

  let item = stack.addText(text);
  if (app_info.is_sale) {
    item.textColor = new Color("006400");
    item.font = Font.boldSystemFont(12);
  } else {
    item.font = Font.systemFont(12);
  }
}

function addTitleTextToListWidget(text, listWidget) {
  const titleStack = listWidget.addStack();
  titleStack.size = new Size(330, 15);
  let item = titleStack.addText(text);
  try {
    item.applyHeadlineTextStyling();
  } catch (e) {
    item.font = Font.systemFont(11);
  }
  item.textOpacity = 0.7;
}

async function format_apps(x) {
  let apps_f = {};
  x.forEach((n) => {
    if (/^[a-zA-Z0-9:/|\-_\s]{1,}$/.test(n)) {
      n = n.replace(/[/|\-_\s]/g, ":");
      let n_n = n.split(":");
      if (n_n.length === 1) {
        if (apps_f.hasOwnProperty(reg)) {
          apps_f[reg].push(n_n);
        } else {
          apps_f[reg] = [];
          apps_f[reg].push(n_n[0]);
        }
      } else if (n_n.length === 2) {
        if (apps_f.hasOwnProperty(n_n[1])) {
          apps_f[n_n[1]].push(n_n[0]);
        } else {
          apps_f[n_n[1]] = [];
          apps_f[n_n[1]].push(n_n[0]);
        }
      } else {
        app_infos.push({ content: `ID格式错误:【${n}】` });
      }
    } else {
      app_infos.push({ content: `ID格式错误:【${n}】` });
    }
  });
  if (Object.keys(apps_f).length > 0) {
    await post_data(apps_f);
  }
}

async function post_data(d) {
  try {
    let infos = {};
    await Promise.all(
      Object.keys(d).map(async (k) => {
        let config = {
          url: "https://itunes.apple.com/lookup?id=" + d[k] + "&country=" + k,
        };
        await $http
          .get(config)
          .then((response) => {
            let results = JSON.parse(response.body).results;
            if (Array.isArray(results) && results.length > 0) {
              results.forEach((x) => {
                let is_sale = false;
                let app_monitor_data = app_monitor[x.trackId];
                if (!app_monitor_data) {
                  app_monitor_data = {};
                }

                let app_name = app_monitor_data.n;
                if (!app_name) {
                  app_name = x.trackName;
                }
                let app_price = x.formattedPrice;

                infos[x.trackId] = {
                  n: app_name,
                  p: app_price,
                };
                if (app_monitor.hasOwnProperty(x.trackId)) {
                  if (
                    JSON.stringify(app_monitor[x.trackId]) !==
                    JSON.stringify(infos[x.trackId])
                  ) {
                    if (app_price !== app_monitor[x.trackId].p) {
                      is_sale = true;
                      app_infos.push({
                        content: `${app_name} | ${app_price}(${app_monitor[x.trackId].p
                          })`,
                        is_sale: true,
                      });
                    }
                  }
                }
                if (!is_sale) {
                  app_infos.push({
                    content: `${app_name} | ${app_price}`,
                    is_sale: false,
                  });
                }
              });
            }
            return Promise.resolve();
          })
          .catch((e) => {
            console.log(e);
          });
      })
    );
    return app_infos;
  } catch (e) {
    console.log(e);
  }
}

//From Peng-YM's OpenAPI.js
function ENV() { const e = "undefined" != typeof $task, t = "undefined" != typeof $loon, s = "undefined" != typeof $httpClient && !this.isLoon, o = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: e, isLoon: t, isSurge: s, isNode: "function" == typeof require && !o, isJSBox: o, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule, } } function HTTP(e, t = {}) { const { isQX: s, isLoon: o, isSurge: i, isScriptable: n, isNode: r } = ENV(); const u = {}; return (["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach((h) => (u[h.toLowerCase()] = (u) => (function (u, h) { (h = "string" == typeof h ? { url: h } : h).url = e ? e + h.url : h.url; const c = (h = { ...t, ...h }).timeout, l = { onRequest: () => { }, onResponse: (e) => e, onTimeout: () => { }, ...h.events, }; let d, a; if ((l.onRequest(u, h), s)) d = $task.fetch({ method: u, ...h }); else if (o || i || r) d = new Promise((e, t) => { (r ? require("request") : $httpClient)[u.toLowerCase()](h, (s, o, i) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: i, }) }) }); else if (n) { const e = new Request(h.url); (e.method = u), (e.headers = h.headers), (e.body = h.body), (d = new Promise((t, s) => { e.loadString().then((s) => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s, }) }).catch((e) => s(e)) })) } const f = c ? new Promise((e, t) => { a = setTimeout(() => (l.onTimeout(), t(`${u}URL:${h.url}exceeds the timeout ${c}ms`)), c) }) : null; return (f ? Promise.race([f, d]).then((e) => (clearTimeout(a), e)) : d).then((e) => l.onResponse(e)) })(h, u))), u) }