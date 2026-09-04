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

// ---------------------------------------------------------------------
// Tracking de progresso de vídeo: evento custom pro Meta Pixel + fetch pro
// back-end (log de IP em /api/video-log.php, já que a Meta não devolve IP).
//
// Marcos de 5 em 5% (+ 1% cravado logo no play) — granularidade fina o
// bastante pra enxergar em que % exato a galera desiste (bounce nos
// primeiros segundos vs. abandono no meio do vídeo). Isso é até 21
// chamadas por pessoa/vídeo, mas o back-end (video-log.php) faz UPSERT:
// vira 1 linha só no arquivo, sempre atualizada com o maior % visto — o
// log não cresce por causa da granularidade maior (ver comentário lá).
//
// O site troca de tela via React Router sem dar reload de página, e alguns
// vídeos (mito-2, mito-3) só entram no DOM depois que o anterior termina —
// ou seja, um único document.querySelectorAll('video') no load não é
// suficiente. Por isso: escaneia o que já existe e usa um MutationObserver
// pra pegar vídeo que aparece depois.
// ---------------------------------------------------------------------
const MARCOS_PROGRESSO_VIDEO = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const THROTTLE_LOG_MS = 1000; // no máx. 1 request/s por vídeo, mesmo se um seek cruzar vários marcos de uma vez
const videosComListener = new WeakSet(); // evita registrar timeupdate 2x no mesmo elemento
const tracked = {}; // tracked['mito-1'] = { 1: false, 5: false, ..., 100: false }
const ultimoLogEm = {}; // ultimoLogEm['mito-1'] = timestamp do último POST enviado (throttle)

function criarFlagsDeVideo() {
  const flags = {};
  MARCOS_PROGRESSO_VIDEO.forEach((marco) => {
    flags[marco] = false;
  });
  return flags;
}

function registrarProgressoVideo(videoId, marco) {
  const pathname = window.location.pathname;

  console.log(`[VIDEO TRACK] ${videoId} - ${marco}%`);

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", "VideoProgress", {
      video_name: videoId,
      progress: marco,
      page: pathname,
    });
  }

  // whatsapp/country vêm do lead capturado na gate "Desbloqueio Consciente"
  // (/mitos, entre Mito 1 e Mito 2) — vazios até lá, presentes em todo log
  // depois que o lead preenche o WhatsApp.
  const whatsapp = localStorage.getItem("lead_whatsapp") || "";
  const country = localStorage.getItem("lead_country") || "";
  const corpo = JSON.stringify({ video: videoId, pct: marco, page: pathname, whatsapp, country });

  // sendBeacon: o navegador garante o envio mesmo se a aba fechar ou a rota
  // trocar logo em seguida (ao contrário de fetch, não depende do JS
  // continuar vivo). POST /api/video-log.php (extensão explícita — GET
  // /api/video-log sem ".php" dependia do Apache resolver sozinho via
  // MultiViews e parou de gravar em produção sem mudança nenhuma de
  // código). Fallback pra fetch+keepalive só em navegador sem sendBeacon.
  const enviado =
    typeof navigator.sendBeacon === "function" &&
    navigator.sendBeacon("/api/video-log.php", new Blob([corpo], { type: "application/json" }));

  if (!enviado) {
    fetch("/api/video-log.php", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: corpo,
    }).catch(() => {});
  }
}

// Handler leve de propósito: só aritmética e leitura de flag, nada de DOM
// query aqui dentro — timeupdate dispara várias vezes por segundo. Throttle
// de 1s: se um seek cruzar vários marcos de uma vez, esse tick não loga
// nada — os marcos ainda não logados ficam pendentes e saem no próximo
// timeupdate, já fora da janela de throttle.
function aoAtualizarTempoVideo(video) {
  const videoId = video.id;
  if (!videoId || !video.duration) return;
  if (Date.now() - (ultimoLogEm[videoId] || 0) < THROTTLE_LOG_MS) return;

  const percentualAtual = (video.currentTime / video.duration) * 100;
  const flags = tracked[videoId];

  for (const marco of MARCOS_PROGRESSO_VIDEO) {
    if (!flags[marco] && percentualAtual >= marco) {
      flags[marco] = true;
      ultimoLogEm[videoId] = Date.now();
      registrarProgressoVideo(videoId, marco);
    }
  }
}

function observarVideo(video) {
  if (videosComListener.has(video)) return;
  if (!video.id) {
    console.warn("[VIDEO TRACK] <video> sem id foi ignorado — adicione um id único pra ele ser trackeado.", video);
    return;
  }

  videosComListener.add(video);
  if (!tracked[video.id]) tracked[video.id] = criarFlagsDeVideo();

  video.addEventListener("timeupdate", () => aoAtualizarTempoVideo(video), { passive: true });

  // Primeiro play: loga o marco de 1% na hora, sem esperar o timeupdate —
  // pega quem dá play e sai/pausa antes do primeiro tick (bounce real, o
  // motivo de baixar o marco inicial de 25% pra 1%). Dispara de novo em
  // cada play (retomar depois de pausa também é "play"), mas a flag[1] só
  // deixa passar uma vez.
  video.addEventListener(
    "play",
    () => {
      const flags = tracked[video.id];
      if (flags[1]) return;
      flags[1] = true;
      ultimoLogEm[video.id] = Date.now();
      registrarProgressoVideo(video.id, 1);
    },
    { passive: true }
  );
}

// Chamado uma vez em main.jsx. Ao contrário do Pixel/GA, não adia pra
// idle/timeout — precisa estar escutando desde já pro vídeo com autoPlay
// (hero de /meditacao) não perder o começo do progresso.
export function iniciarTrackingDeVideo() {
  if (typeof window === "undefined") return;

  document.querySelectorAll("video").forEach(observarVideo);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return; // só elementos
        if (node.tagName === "VIDEO") observarVideo(node);
        node.querySelectorAll?.("video").forEach(observarVideo);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
