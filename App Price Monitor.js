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
const G = importModule("Env");

var app_monitor = {
  1563121109: {
    p: "$4.99",
  },
  1635315427: {
    p: "¥25.00",
  },
};

let apps = [
  "1563121109|us", //破碎的像素地牢
  "1635315427", //暖雪
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
    $.msg("请检查脚本内填入的App监控信息是否完整");
  }
}

const isDark = Device.isUsingDarkAppearance();
const bgColor = new LinearGradient();
bgColor.colors = isDark
  ? [new Color("#151515"), new Color("#1c1c1e")]
  : [new Color("#ffffff"), new Color("#f0f0f0")];

// bgColor.colors = isDark ? [new Color("#000000")] : [new Color("#ffffff")];

bgColor.locations = [0.0, 1.0];

!(async () => {
  await format_apps(apps);
  log(app_infos);
  let widget = createWidget(app_infos);
  Script.setWidget(widget);
  Script.complete();
})().catch((err) => {
  G.msg("运行出现错误\n" + err);
});

function createWidget(app_infos) {
  const w = new ListWidget();
  // w.backgroundGradient = bgColor;

  addTitleTextToListWidget("App Price Monitor", w);
  w.addSpacer(5);

  //打折排到最前
  app_infos.sort((a, b) => {
    return b.is_sale === a.is_sale ? 0 : b.is_sale ? 1 : -1;
  });

  for (var i = 0; i < app_infos.length; i++) {
    addTextToListWidget(app_infos[i], w);
  }

  w.addSpacer();
  w.presentMedium();
  return w;
}

function addTextToListWidget(app_info, listWidget) {
  let text = app_info.content;
  const stack = listWidget.addStack();
  stack.setPadding(3, 15, 3, 15);
  let item = stack.addText(text);
  if (app_info.is_sale) {
    // item.textColor = Color.green();
    item.textColor = new Color("006400");
    item.font = Font.boldSystemFont(11);
  } else {
    // item.textColor = isDark ? Color.white() : Color.black();
    item.textColor = new Color("505050");
    item.font = Font.systemFont(11);
  }
}

function addTitleTextToListWidget(text, listWidget) {
  const titleStack = listWidget.addStack();
  titleStack.size = new Size(330, 15);
  let item = titleStack.addText(text);
  // item.textColor = isDark ? Color.white() : Color.black();
  item.textColor = new Color("505050");
  try {
    item.applyHeadlineTextStyling();
  } catch (e) {
    item.font = Font.boldSystemFont(10);
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
                infos[x.trackId] = {
                  n: x.trackName,
                  p: x.formattedPrice,
                };

                var is_sale = false;
                if (app_monitor.hasOwnProperty(x.trackId)) {
                  if (
                    JSON.stringify(app_monitor[x.trackId]) !==
                    JSON.stringify(infos[x.trackId])
                  ) {
                    if (x.formattedPrice !== app_monitor[x.trackId].p) {
                      is_sale = true;
                      app_infos.push({
                        content: `${x.trackName} | ${x.formattedPrice}(${
                          app_monitor[x.trackId].p
                        })`,
                        is_sale: true,
                      });
                    }
                  }
                }
                if (!is_sale) {
                  app_infos.push({
                    content: `${x.trackName} | ${x.formattedPrice}`,
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

function flag(x) {
  return "";
}

//From Peng-YM's OpenAPI.js
function ENV() {
  const e = "undefined" != typeof $task,
    t = "undefined" != typeof $loon,
    s = "undefined" != typeof $httpClient && !this.isLoon,
    o = "function" == typeof require && "undefined" != typeof $jsbox;
  return {
    isQX: e,
    isLoon: t,
    isSurge: s,
    isNode: "function" == typeof require && !o,
    isJSBox: o,
    isRequest: "undefined" != typeof $request,
    isScriptable: "undefined" != typeof importModule,
  };
}
function HTTP(e, t = {}) {
  const { isQX: s, isLoon: o, isSurge: i, isScriptable: n, isNode: r } = ENV();
  const u = {};
  return (
    ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(
      (h) =>
        (u[h.toLowerCase()] = (u) =>
          (function (u, h) {
            (h = "string" == typeof h ? { url: h } : h).url = e
              ? e + h.url
              : h.url;
            const c = (h = { ...t, ...h }).timeout,
              l = {
                onRequest: () => {},
                onResponse: (e) => e,
                onTimeout: () => {},
                ...h.events,
              };
            let d, a;
            if ((l.onRequest(u, h), s)) d = $task.fetch({ method: u, ...h });
            else if (o || i || r)
              d = new Promise((e, t) => {
                (r ? require("request") : $httpClient)[u.toLowerCase()](
                  h,
                  (s, o, i) => {
                    s
                      ? t(s)
                      : e({
                          statusCode: o.status || o.statusCode,
                          headers: o.headers,
                          body: i,
                        });
                  }
                );
              });
            else if (n) {
              const e = new Request(h.url);
              (e.method = u),
                (e.headers = h.headers),
                (e.body = h.body),
                (d = new Promise((t, s) => {
                  e.loadString()
                    .then((s) => {
                      t({
                        statusCode: e.response.statusCode,
                        headers: e.response.headers,
                        body: s,
                      });
                    })
                    .catch((e) => s(e));
                }));
            }
            const f = c
              ? new Promise((e, t) => {
                  a = setTimeout(
                    () => (
                      l.onTimeout(),
                      t(`${u} URL: ${h.url} exceeds the timeout ${c} ms`)
                    ),
                    c
                  );
                })
              : null;
            return (
              f ? Promise.race([f, d]).then((e) => (clearTimeout(a), e)) : d
            ).then((e) => l.onResponse(e));
          })(h, u))
    ),
    u
  );
}
