// Tipos alineados con supabase/migrations/20260704120000_initial_travel_saas_schema.sql
// Nota: son tipos "hechos a mano" simplificados. Para producción se
// recomienda generar los tipos oficiales con:
//   supabase gen types typescript --project-id <ref> > lib/database.types.ts

export type UsuarioRol = "admin" | "cobranza" | "operador";
export type ProveedorTipo = "yate" | "van" | "guia_externo" | "hotel";
export type OrdenEstatus =
  | "cotizado"
  | "confirmado"
  | "pagado"
  | "en_espera"
  | "en_progreso"
  | "finalizado"
  | "cancelado";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: UsuarioRol;
  activo: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string;
  email: string | null;
  created_at: string;
}

export interface ProveedorUnidad {
  id: string;
  nombre: string;
  tipo: ProveedorTipo;
  contacto: string | null;
  created_at: string;
}

export interface ContratoTarifa {
  id: string;
  proveedor_id: string;
  nombre_convenio: string;
  costo_neto: number;
  vigencia_inicio: string;
  vigencia_fin: string;
  documento_url: string | null;
  created_at: string;
  proveedor?: ProveedorUnidad;
}

export interface ExperienciaCatalogo {
  id: string;
  nombre_tour: string;
  descripcion: string | null;
  ubicacion_maps_url: string;
  duracion_estimada: string;
  created_at: string;
}

export interface OrdenServicio {
  id: string;
  cliente_id: string;
  experiencia_id: string | null;
  operador_id: string | null;
  unidad_id: string | null;
  estatus: OrdenEstatus;

  fecha_servicio: string;
  hora_servicio: string;
  servicio_inicio_at: string;

  numero_pasajeros?: number | null;

  checkin_time: string | null;
  checkin_gps: string | null;
  checkin_usuario_id: string | null;

  checkout_time: string | null;
  checkout_gps: string | null;
  checkout_usuario_id: string | null;
  evidencia_foto_url: string | null;

  es_servicio_aeropuerto: boolean;
  numero_vuelo: string | null;
  vuelo_origen: string | null;
  vuelo_destino: string | null;
  vuelo_fecha: string | null;
  aerolinea: string | null;
  terminal: string | null;
  hora_estimada_vuelo: string | null;
  estatus_vuelo: string | null;
  serpapi_last_sync_at: string | null;

  whatsapp_1hr_enviado: boolean;
  whatsapp_1hr_enviado_at: string | null;

  created_at: string;
  updated_at: string;
}

/** Orden de servicio con relaciones resueltas (usado en agenda + detalle) */
export interface OrdenServicioConDetalle extends OrdenServicio {
  cliente: Cliente;
  experiencia: ExperienciaCatalogo | null;
}

export interface ControlCobranza {
  id: string;
  orden_servicio_id: string;
  total_servicio: number;
  monto_anticipo: number;
  saldo_pendiente: number;
  fecha_limite_pago: string;
  created_at: string;
  updated_at: string;
}

/** Fila del panel de cobranza, ya aplanada para la tabla */
export interface CobranzaConCliente extends ControlCobranza {
  orden_servicio: {
    id: string;
    fecha_servicio: string;
    cliente: Cliente;
  };
}

// Placeholder mínimo para tipar los clientes de @supabase/ssr.
// Sustituir por el tipo `Database` generado por Supabase cuando esté disponible.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
