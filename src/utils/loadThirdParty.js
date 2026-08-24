// Meta Pixel + Google tag (gtag.js) carregados só depois do primeiro paint.
// No PageSpeed mobile de /comunidade eles apareciam como render-blocking e
// como "JS não usado" na árvore crítica (Facebook 67KiB + Google 65KiB).
// Adiar pra depois do load não perde eventos: os stubs abaixo criam a
// fila (window.fbq / window.gtag) na hora e disparam o "PageView"/"config"
// inicial assim que o script de verdade termina de carregar.

const FB_PIXEL_ID = "3103393009870274";
const GA_MEASUREMENT_ID = "G-KXLP5PR9P0";
const ATRASO_MAXIMO_MS = 3500;

function carregarMetaPixel() {
  if (window.fbq) return;
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", FB_PIXEL_ID);
  window.fbq("track", "PageView");
}

function carregarGoogleTag() {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

// Chamado uma vez em main.jsx depois do render inicial. requestIdleCallback
// espera o thread principal ficar livre (bom pro LCP/TBT), com teto de
// 3500ms pra não atrasar demais em página que nunca fica ociosa; navegadores
// sem requestIdleCallback (Safari) caem direto no setTimeout de 3500ms.
export function agendarScriptsTerceiros() {
  if (typeof window === "undefined") return;

  const disparar = () => {
    carregarMetaPixel();
    carregarGoogleTag();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(disparar, { timeout: ATRASO_MAXIMO_MS });
  } else {
    setTimeout(disparar, ATRASO_MAXIMO_MS);
  }
}
