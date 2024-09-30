// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: tag;
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
let notifys = [];
try {
  const con = importModule("Config");
  apps = con.apps();
  reg = con.reg();
  if (apps == [] || reg == "") {
    log("配置文件内签到信息不完整");
    throw new Error(err);
  }
  log("将使用配置文件内App监控信息");
} catch (err) {
  log("将使用脚本内App监控信息");
  if (apps == "" || reg == "") {
    $.msg("请检查脚本内填入的App监控信息是否完整");
  }
}

const isDark = Device.isUsingDarkAppearance();
const bgColor = new LinearGradient();
bgColor.colors = isDark
  ? [new Color("#151515"), new Color("#1c1c1e")]
  : [new Color("#E0E0E0"), new Color("#ffffff")];
bgColor.locations = [0.0, 1.0];

!(async () => {
  await format_apps(apps);
  log(notifys);
  let widget = createWidget(notifys);
  Script.setWidget(widget);
  Script.complete();
})().catch((err) => {
  G.msg("App价格版本监控 运行出现错误❌\n" + err);
});

function createWidget(notifys) {
  const w = new ListWidget();
  w.backgroundGradient = bgColor;

  addTitleTextToListWidget("App Price Monitor", w);
  w.addSpacer(5);

  for (var i = 0; i < notifys.length; i++) {
    addTextToListWidget(notifys[i], w);
    w.addSpacer(5);
  }

  w.addSpacer();
  w.presentMedium();
  return w;
}

function addTextToListWidget(text, listWidget) {
  let item = listWidget.addText("    " + text);
  item.textColor = isDark ? Color.white() : Color.black();
  item.font = new Font("SF Mono", 11);
}

function addTitleTextToListWidget(text, listWidget) {
  const titleStack = listWidget.addStack();
  titleStack.size = new Size(330, 15);
  let item = titleStack.addText(text);
  item.textColor = isDark ? Color.white() : Color.black();
  try {
    item.applyHeadlineTextStyling();
  } catch (e) {
    item.font = new Font("SF Mono", 10);
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
        notifys.push(`ID格式错误:【${n}】`);
      }
    } else {
      notifys.push(`ID格式错误:【${n}】`);
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
                if (app_monitor.hasOwnProperty(x.trackId)) {
                  if (
                    JSON.stringify(app_monitor[x.trackId]) !==
                    JSON.stringify(infos[x.trackId])
                  ) {
                    if (x.formattedPrice !== app_monitor[x.trackId].p) {
                      notifys.push(
                        `🈹${x.trackName} | ${x.formattedPrice}(${
                          app_monitor[x.trackId].p
                        })`
                      );
                    } else {
                      notifys.push(`${x.trackName} | ${x.formattedPrice}`);
                    }
                  }
                } else {
                  notifys.push(`${x.trackName} | ${x.formattedPrice}`);
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
    return notifys;
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
