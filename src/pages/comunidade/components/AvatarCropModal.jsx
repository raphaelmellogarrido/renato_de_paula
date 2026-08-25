import { useEffect, useMemo, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";

// Tamanho fixo do viewport quadrado (px na tela) e do PNG exportado — o
// backend (upload-avatar.php) reamostra pra 200x200/WebP de qualquer forma,
// então 500 aqui só garante nitidez suficiente pra esse resize sem mandar
// um arquivo desnecessariamente grande.
const VIEWPORT = 260;
const SAIDA = 500;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

function clamp(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

// Trava o offset pra a imagem nunca "descolar" das bordas do viewport
// (sempre cobrindo o quadrado inteiro, nunca mostrando fundo vazio).
function clampOffset(off, tamanhoExibido, viewport) {
  const min = Math.min(0, viewport - tamanhoExibido);
  const max = Math.max(0, viewport - tamanhoExibido);
  return clamp(off, min, max);
}

/**
 * Modal de recorte quadrado da foto de perfil (Configuracoes.jsx). Mesmo
 * espírito sem-lib-externa/sem-portal do ImageLightbox.jsx (position:fixed
 * já escapa de qualquer card que renderize isto) — arrastar pra reposicionar
 * + slider de zoom, sem nenhuma dependência nova.
 *
 * Props:
 *   file       File selecionado no <input type="file"> — nunca null quando
 *              o modal está montado (o pai só monta isto depois de validar
 *              tipo/tamanho do arquivo).
 *   onCancel   () => void — fecha sem salvar (X, ESC, clique fora, botão Cancelar)
 *   onConfirm  (blob: Blob) => void — PNG SAIDAxSAIDA já recortado quadrado,
 *              pronto pra virar FormData e ir pro upload-avatar.php
 */
function AvatarCropModal({ file, onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const arrastoRef = useRef(null); // { x, y, offset } enquanto arrasta — não precisa re-render

  const [natural, setNatural] = useState(null); // { w, h }
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);

  // Derivado de `file` (sempre a mesma URL enquanto o arquivo não mudar),
  // não é estado — só a revogação no fim da vida do objeto precisa de
  // efeito, e um efeito que só limpa (sem setState) não é cascata de render.
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onCancel]);

  // baseScale: menor escala que já cobre o viewport inteiro (mesmo cálculo
  // de object-fit: cover) — zoom do slider multiplica em cima dela.
  const baseScale = useMemo(() => {
    if (!natural) return 1;
    return VIEWPORT / Math.min(natural.w, natural.h);
  }, [natural]);
  const scale = baseScale * zoom;

  function aoCarregarImagem() {
    const w = imgRef.current.naturalWidth;
    const h = imgRef.current.naturalHeight;
    const base = VIEWPORT / Math.min(w, h);
    setNatural({ w, h });
    // Centraliza no eixo mais longo (o outro já cobre o viewport exatamente).
    setOffset({
      x: clampOffset((VIEWPORT - w * base) / 2, w * base, VIEWPORT),
      y: clampOffset((VIEWPORT - h * base) / 2, h * base, VIEWPORT),
    });
  }

  function aoMudarZoom(e) {
    const novoZoom = Number(e.target.value);
    if (!natural) {
      setZoom(novoZoom);
      return;
    }
    const novaScale = baseScale * novoZoom;
    // Mantém o mesmo ponto central do viewport ao dar zoom, em vez de puxar
    // a imagem pro canto (0,0) a cada mudança de slider.
    const centroSrcX = (VIEWPORT / 2 - offset.x) / scale;
    const centroSrcY = (VIEWPORT / 2 - offset.y) / scale;
    const novoOffsetX = clampOffset(VIEWPORT / 2 - centroSrcX * novaScale, natural.w * novaScale, VIEWPORT);
    const novoOffsetY = clampOffset(VIEWPORT / 2 - centroSrcY * novaScale, natural.h * novaScale, VIEWPORT);
    setZoom(novoZoom);
    setOffset({ x: novoOffsetX, y: novoOffsetY });
  }

  function aoIniciarArrasto(e) {
    if (!natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastoRef.current = { x: e.clientX, y: e.clientY, offset: { ...offset } };
    setArrastando(true);
  }

  function aoArrastar(e) {
    if (!arrastoRef.current || !natural) return;
    const dx = e.clientX - arrastoRef.current.x;
    const dy = e.clientY - arrastoRef.current.y;
    setOffset({
      x: clampOffset(arrastoRef.current.offset.x + dx, natural.w * scale, VIEWPORT),
      y: clampOffset(arrastoRef.current.offset.y + dy, natural.h * scale, VIEWPORT),
    });
  }

  function aoSoltarArrasto() {
    arrastoRef.current = null;
    setArrastando(false);
  }

  function aoConfirmar() {
    if (!natural || !imgRef.current) return;
    // Mapeia o quadrado visível no viewport de volta pra coordenadas da
    // imagem original: um ponto p do viewport corresponde a (p-offset)/scale
    // na imagem-fonte, então o recorte é a região inversa disso.
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sTamanho = VIEWPORT / scale;

    const canvas = document.createElement("canvas");
    canvas.width = SAIDA;
    canvas.height = SAIDA;
    const ctx = canvas.getContext("2d");
    // Fundo branco antes de desenhar: PNG com transparência não devia virar
    // preto se algum navegador/etapa futura achatar o canal alpha.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SAIDA, SAIDA);
    ctx.drawImage(imgRef.current, sx, sy, sTamanho, sTamanho, 0, 0, SAIDA, SAIDA);
    // PNG (não JPEG): evita uma 2ª compressão com perda antes mesmo de
    // chegar no backend, que já vai reamostrar pra 200x200/WebP.
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, "image/png");
  }

  return (
    <div className="cm-avatar-crop-overlay" onClick={onCancel}>
      <div className="cm-avatar-crop-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cm-avatar-crop-fechar" aria-label="Cancelar" onClick={onCancel}>
          <X size={18} />
        </button>

        <h3 className="cm-avatar-crop-titulo">Ajustar foto</h3>

        <div
          className="cm-avatar-crop-viewport"
          style={{ width: VIEWPORT, height: VIEWPORT, cursor: arrastando ? "grabbing" : "grab" }}
          onPointerDown={aoIniciarArrasto}
          onPointerMove={aoArrastar}
          onPointerUp={aoSoltarArrasto}
          onPointerCancel={aoSoltarArrasto}
        >
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              draggable={false}
              onLoad={aoCarregarImagem}
              style={{
                width: natural ? natural.w * scale : "auto",
                height: natural ? natural.h * scale : "auto",
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          <div className="cm-avatar-crop-mascara" aria-hidden="true" />
        </div>

        <div className="cm-avatar-crop-zoom">
          <ZoomIn size={16} />
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.05}
            value={zoom}
            onChange={aoMudarZoom}
            disabled={!natural}
            aria-label="Zoom da foto"
          />
        </div>

        <div className="cm-avatar-crop-acoes">
          <button type="button" className="cm-config-btn-secundario" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="cm-config-btn is-ready" onClick={aoConfirmar} disabled={!natural}>
            Salvar foto
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropModal;
