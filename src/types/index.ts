export type Posicion =
  | "Portero"
  | "Defensa Central"
  | "Lateral Derecho"
  | "Lateral Izquierdo"
  | "Mediocentro"
  | "Mediapunta"
  | "Extremo Derecho"
  | "Extremo Izquierdo"
  | "Delantero Centro";

export type Categoria = "Prebenjamín" | "Benjamín" | "Alevín" | "Infantil" | "Cadete" | "Juvenil" | "Senior" | "Veteranos";

export type EstadoJugador = "Activo" | "Baja";

export type EstadoPedido = "Pendiente" | "Preparado" | "Entregado";

export interface FichaJugador {
  id: string;
  created_at: string;
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  peso: number;
  altura: number;
  posicion: Posicion;
  categoria: Categoria;
  observaciones_entrenador: string;
  estado: EstadoJugador;
  foto_url?: string;
}

export interface ClienteDatos {
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
}

export interface ArticuloPedido {
  id: string;
  nombre: string;
  talla: string;
  cantidad: number;
  precio: number;
}

export interface PedidoRopa {
  id: string;
  created_at: string;
  cliente_datos: ClienteDatos;
  articulos_pedido: ArticuloPedido[];
  estado_pedido: EstadoPedido;
  total_estimado: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  tallas: string[];
  categoria: string;
}
