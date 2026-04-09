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
  telefono_padre?: string;
  telefono_madre?: string;
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

export interface Socio {
  id: string;
  created_at: string;
  numero_socio: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  dni: string;
  fecha_nacimiento: string;
  direccion_calle: string;
  direccion_numero: string;
  direccion_piso?: string;
  direccion_puerta?: string;
  direccion_codigo_postal: string;
  direccion_ciudad: string;
  direccion_provincia: string;
  direccion_pais: string;
  email: string;
  telefono: string;
  telefono_tutor?: string;
}
