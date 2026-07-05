"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OrdenServicioConDetalle } from "@/lib/types";
import { PhotoEvidenceModal } from "./PhotoEvidenceModal";

/** Convierte lat/lon a EWKT que Postgres/PostGIS interpreta como geography(point,4326) */
function toEwktPoint(lat: number, lon: number) {
  return `SRID=4326;POINT(${lon} ${lat})`;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Este dispositivo no soporta geolocalización."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}

export function ServiceActionButton({
  orden,
  currentUserId,
}: {
  orden: OrdenServicioConDetalle;
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [estatus, setEstatus] = useState(orden.estatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  async function handleIniciarServicio() {
    setError(null);
    setLoading(true);

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const { error: updateError } = await supabase
        .from("ordenes_servicio")
        .update({
          estatus: "en_progreso",
          checkin_time: new Date().toISOString(),
          checkin_gps: toEwktPoint(latitude, longitude),
          checkin_usuario_id: currentUserId,
        })
        .eq("id", orden.id);

      if (updateError) throw updateError;

      setEstatus("en_progreso");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof GeolocationPositionError
          ? "Activa el GPS/ubicación del celular e intenta de nuevo."
          : "No se pudo iniciar el servicio. Revisa tu conexión e intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleServicioFinalizado() {
    setEstatus("finalizado");
    setModalAbierto(false);
    router.refresh();
  }

  if (estatus === "finalizado") {
    return (
      <div className="flex h-touch-xl w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 text-base font-bold text-emerald-700">
        ✅ Servicio finalizado
      </div>
    );
  }

  if (estatus === "cancelado") {
    return (
      <div className="flex h-touch-xl w-full items-center justify-center rounded-2xl bg-red-50 text-base font-bold text-red-600">
        Servicio cancelado
      </div>
    );
  }

  if (estatus !== "en_espera" && estatus !== "en_progreso") {
    // cotizado / confirmado / pagado: aún no le corresponde al operador operar
    return (
      <div className="flex h-touch-xl w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
        Este servicio aún no está listo para iniciar
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {estatus === "en_espera" && (
        <button
          type="button"
          onClick={handleIniciarServicio}
          disabled={loading}
          className="btn-primary-action bg-action-start active:bg-action-start-hover disabled:bg-emerald-300"
        >
          {loading ? (
            <>
              <Spinner /> Obteniendo ubicación...
            </>
          ) : (
            <>▶ Iniciar Servicio</>
          )}
        </button>
      )}

      {estatus === "en_progreso" && (
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="btn-primary-action bg-action-stop active:bg-action-stop-hover"
        >
          ■ Finalizar Servicio
        </button>
      )}

      {modalAbierto && (
        <PhotoEvidenceModal
          ordenId={orden.id}
          currentUserId={currentUserId}
          onClose={() => setModalAbierto(false)}
          onFinalizado={handleServicioFinalizado}
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
