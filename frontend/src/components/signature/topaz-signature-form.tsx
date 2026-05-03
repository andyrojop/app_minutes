"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { registerSignatureAction } from "@/app/(protected)/actions";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getTopazComPortName,
  getTopazComPortNumber,
  resolveTopazSigWebScriptUrlForBrowser,
} from "@/lib/env";
import { cn } from "@/lib/utils";

/** Superficie que SigWeb espera (nombre/id habituales en ejemplos Topaz). */
const SIGWEB_CANVAS_ID = "cnv";

type SigWebWindow = Window &
  Partial<{
    OpenTablet: (v: number) => void;
    CloseTablet: () => void;
    SetTabletState: (state: number, ctxOrTimer: unknown, tv?: number) => ReturnType<typeof setInterval> | null;
    ClearTablet: () => void;
    GetSigImageB64: (callback: (b64: string) => void) => void;
    GetSigString: () => string;
    SetTabletComPort: (port: number) => void;
    SetTabletComPortByName: (name: string) => void;
    SigWebInstalled: () => boolean;
  }>;

type Props = {
  minuteId: string;
  fieldClass: string;
};

/**
 * Firma con tablet Topaz vía SigWeb (servicio local).
 * `SigWebTablet.js` en `public/sigweb/` y `NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL`.
 * Puerto: `NEXT_PUBLIC_TOPAZ_COM_PORT` (número, p. ej. 9) o `NEXT_PUBLIC_TOPAZ_COM_NAME` (p. ej. COM3).
 */
export function TopazSignatureForm({ minuteId, fieldClass }: Props) {
  const [svg, setSvg] = useState("");
  const [sigwebHint, setSigwebHint] = useState<string | null>(null);
  const scriptLoaded = useRef(false);
  const tabletTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scriptUrl = process.env.NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL?.trim();

  const stopTabletRefresh = useCallback(() => {
    const w = window as SigWebWindow;
    if (tabletTimerRef.current != null && typeof w.SetTabletState === "function") {
      w.SetTabletState(0, tabletTimerRef.current, 0);
    }
    tabletTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopTabletRefresh();
    };
  }, [stopTabletRefresh]);

  useEffect(() => {
    if (!scriptUrl || scriptLoaded.current) return;
    const existing = document.querySelector(`script[data-topaz-sigweb="1"]`);
    if (existing) {
      scriptLoaded.current = true;
      return;
    }
    const s = document.createElement("script");
    s.src = resolveTopazSigWebScriptUrlForBrowser(scriptUrl);
    s.async = true;
    s.dataset.topazSigweb = "1";
    s.onload = () => {
      scriptLoaded.current = true;
      const w = window as SigWebWindow;
      try {
        const byName = getTopazComPortName();
        if (byName && typeof w.SetTabletComPortByName === "function") {
          w.SetTabletComPortByName(byName);
        } else if (typeof w.SetTabletComPort === "function") {
          w.SetTabletComPort(getTopazComPortNumber());
        }
      } catch {
        /* COM se puede fijar solo desde el driver */
      }
    };
    s.onerror = () =>
      setSigwebHint(
        "No se pudo cargar SigWebTablet.js. Comprueba NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL y que el archivo exista en public/.",
      );
    document.body.appendChild(s);
  }, [scriptUrl]);

  const captureFromPad = useCallback(() => {
    const w = window as SigWebWindow;
    if (typeof w.OpenTablet === "function") {
      try {
        w.OpenTablet(1);
      } catch {
        /* ignore */
      }
    }
    if (typeof w.GetSigImageB64 === "function") {
      w.GetSigImageB64((b64: string) => {
        if (b64 && b64.length > 10) {
          setSvg(
            `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200"><image href="data:image/png;base64,${b64}" width="500" height="200" preserveAspectRatio="xMidYMid meet"/></svg>`,
          );
          setSigwebHint(null);
          return;
        }
        if (typeof w.GetSigString === "function") {
          try {
            const raw = w.GetSigString();
            if (raw && raw.includes("<")) {
              setSvg(raw);
              setSigwebHint(null);
              return;
            }
          } catch {
            /* ignore */
          }
        }
        setSigwebHint(
          "No se obtuvo trazo. Activa la tablet, firma en el pad y vuelve a capturar; comprueba que SigWeb esté en ejecución y el COM correcto.",
        );
      });
      return;
    }
    if (typeof w.GetSigString === "function") {
      try {
        const raw = w.GetSigString();
        if (raw && raw.includes("<")) {
          setSvg(raw);
          setSigwebHint(null);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setSigwebHint(
      "SigWeb no está listo. Carga el script, instala el servicio Topaz y usa «Activar pad de firma» con el canvas visible.",
    );
  }, []);

  const startTablet = useCallback(() => {
    const w = window as SigWebWindow;
    const canvas = document.getElementById(SIGWEB_CANVAS_ID) as HTMLCanvasElement | null;
    if (!canvas) {
      setSigwebHint("No se encontró el canvas de firma. Recarga la página.");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSigwebHint("El navegador no permite contexto 2D en el canvas.");
      return;
    }
    if (typeof w.SetTabletState !== "function") {
      setSigwebHint(
        "SigWeb no está cargado. Verifica NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL=/sigweb/SigWebTablet.js y que SigWeb esté instalado.",
      );
      return;
    }
    stopTabletRefresh();
    if (typeof w.OpenTablet === "function") {
      try {
        w.OpenTablet(1);
      } catch {
        /* SigWeb puede no exponer OpenTablet en todas las versiones */
      }
    }
    const tmr = w.SetTabletState(1, ctx, 50);
    if (tmr) tabletTimerRef.current = tmr;
    setSigwebHint("Pad activado: firma en el dispositivo y pulsa «Capturar trazo».");
  }, [stopTabletRefresh]);

  const clearTabletOnly = useCallback(() => {
    const w = window as SigWebWindow;
    if (typeof w.ClearTablet === "function") {
      try {
        w.ClearTablet();
      } catch {
        /* ignore */
      }
    }
    setSvg("");
  }, []);

  /** Cierra el refresco del pad, limpia el trazo en hardware y deja listo el siguiente firmante. */
  const archivePad = useCallback(() => {
    stopTabletRefresh();
    const w = window as SigWebWindow;
    if (typeof w.ClearTablet === "function") {
      try {
        w.ClearTablet();
      } catch {
        /* ignore */
      }
    }
    setSvg("");
    setSigwebHint("Pad archivado: listo para la siguiente firma en el dispositivo.");
  }, [stopTabletRefresh]);

  const comHint = getTopazComPortName() ?? `COM${getTopazComPortNumber()}`;

  return (
    <form action={registerSignatureAction} className="space-y-3">
      <input type="hidden" name="minute_id" value={minuteId} />

      <details className="group border-border bg-muted/30 rounded-lg border text-xs">
        <summary className="text-foreground cursor-pointer list-none px-3 py-2 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            Configuración del pad (Topaz / SigWeb)
            <span className="text-muted-foreground font-normal group-open:hidden">— mostrar</span>
          </span>
        </summary>
        <div className="text-muted-foreground space-y-2 border-t px-3 py-2">
          <p>
            Puerto: <strong className="text-foreground">{comHint}</strong> (
            <code className="bg-background rounded px-1">NEXT_PUBLIC_TOPAZ_COM_NAME</code> o{" "}
            <code className="bg-background rounded px-1">NEXT_PUBLIC_TOPAZ_COM_PORT</code>).
          </p>
          <p>
            Script en <code className="bg-background rounded px-1">public/sigweb/SigWebTablet.js</code> y variable{" "}
            <code className="bg-background rounded px-1">NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL</code>.
          </p>
          <p className="text-foreground/90">Flujo: activar pad → firmar en el dispositivo → capturar trazo → confirmar.</p>
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))} onClick={startTablet}>
          Activar pad de firma
        </button>
        <button type="button" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))} onClick={clearTabletOnly}>
          Limpiar borrador
        </button>
        <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }))} onClick={captureFromPad}>
          Capturar trazo
        </button>
        <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }))} onClick={archivePad}>
          Archivar pad
        </button>
      </div>

      {scriptUrl ? (
        <div className="border-muted-foreground/30 overflow-hidden rounded-lg border bg-white">
          <canvas id={SIGWEB_CANVAS_ID} width="500" height="200" className="block max-w-full" />
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Define NEXT_PUBLIC_TOPAZ_SIGWEB_SCRIPT_URL para mostrar el lienzo conectado a SigWeb.
        </p>
      )}

      {sigwebHint ? <p className="text-muted-foreground text-xs">{sigwebHint}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="signature_svg">SVG enviado al servidor</Label>
        <textarea
          id="signature_svg"
          name="signature_svg"
          rows={4}
          value={svg}
          onChange={(e) => setSvg(e.target.value)}
          placeholder="Captura desde el pad o pega un &lt;svg&gt;…"
          className={fieldClass}
        />
      </div>

      <button type="submit" className={cn(buttonVariants())}>
        Confirmar firma
      </button>
    </form>
  );
}
