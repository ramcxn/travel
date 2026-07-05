"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function toEwktPoint(lat: number, lon: number) {
  return `SRID=4326;POINT(${lon} ${lat})`;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}

type Paso = "camara" | "revisar" | "guardando";

export function PhotoEvidenceModal({
  ordenId,
  currentUserId,
  onClose,
  onFinalizado,
}: {
  ordenId: string;
  currentUserId: string;
  onClose: () => void;
  onFinalizado: () => void;
}) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [paso, setPaso] = useState<Paso>("camara");
  const [fotoDataUrl, setFotoDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function iniciarCamara() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!activo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError(
          "No se pudo activar la cámara. Revisa los permisos del navegador."
        );
      }
    }

    iniciarCamara();

    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capturarFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setFotoDataUrl(canvas.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPaso("revisar");
  }

  function reintentar() {
    setFotoDataUrl(null);
    setPaso("camara");
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() =>
        setError("No se pudo reactivar la cámara. Intenta de nuevo.")
      );
  }

  async function confirmarYGuardar() {
    if (!fotoDataUrl || !canvasRef.current) return;
    setError(null);
    setPaso("guardando");

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, "image/jpeg", 0.85)
      );
      if (!blob) throw new Error("No se pudo generar la imagen.");

      const path = `${ordenId}/evidencia-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("evidencias-servicio")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("ordenes_servicio")
        .update({
          estatus: "finalizado",
          checkout_time: new Date().toISOString(),
          checkout_gps: toEwktPoint(latitude, longitude),
          checkout_usuario_id: currentUserId,
          evidencia_foto_url: path,
        })
        .eq("id", ordenId);

      if (updateError) throw updateError;

      onFinalizado();
    } catch (err) {
      setError(
        err instanceof GeolocationPositionError
          ? "Activa el GPS/ubicación para poder finalizar el servicio."
          : "No se pudo guardar la evidencia. Intenta de nuevo."
      );
      setPaso("revisar");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-safe-t pb-3">
        <h2 className="text-base font-bold text-white">
          Evidencia de finalización
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={paso === "guardando"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-40"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {paso === "camara" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {(paso === "revisar" || paso === "guardando") && fotoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoDataUrl}
            alt="Evidencia capturada"
            className="h-full w-full object-cover"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <p className="mx-4 mb-2 rounded-xl bg-red-500/90 px-3 py-2 text-center text-sm font-medium text-white">
          {error}
        </p>
      )}

      <div className="space-y-3 px-4 pb-safe-b pt-3">
        {paso === "camara" && (
          <button
            type="button"
            onClick={capturarFoto}
            className="btn-primary-action bg-white text-slate-900 active:bg-slate-200"
          >
            📷 Tomar foto
          </button>
        )}

        {paso === "revisar" && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reintentar}
              className="flex h-touch-xl flex-1 items-center justify-center rounded-2xl bg-white/10 text-base font-bold text-white active:bg-white/20"
            >
              Repetir
            </button>
            <button
              type="button"
              onClick={confirmarYGuardar}
              className="btn-primary-action flex-[2] bg-action-stop active:bg-action-stop-hover"
            >
              Confirmar y finalizar
            </button>
          </div>
        )}

        {paso === "guardando" && (
          <div className="btn-primary-action bg-slate-700">
            Guardando evidencia y ubicación...
          </div>
        )}
      </div>
    </div>
  );
}
