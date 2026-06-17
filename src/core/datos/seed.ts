import { Producto } from '../modelos/Producto'
import { Usuario } from '../modelos/Usuario'

// Productos tecnológicos de ejemplo (catálogo inicial).
// Todos pertenecen al vendedor demo (idVendedor: 'U-002').
export const PRODUCTOS_INICIALES: Producto[] = [
  { id: 1, nombre: 'Mouse Gamer RGB', marca: 'Logitech', descripcion: 'Mouse óptico con luces RGB y 6 botones programables.', categoria: 'Periféricos', precio: 89.9, stock: 25, estado: 'disponible', imagen: '🖱️', idVendedor: 'U-002' },
  { id: 2, nombre: 'Teclado Mecánico', marca: 'Redragon', descripcion: 'Teclado mecánico de switches azules retroiluminado.', categoria: 'Periféricos', precio: 199.0, stock: 18, estado: 'disponible', imagen: '⌨️', idVendedor: 'U-002' },
  { id: 3, nombre: 'Procesador Intel Core i7', marca: 'Intel', descripcion: 'Procesador de 12 núcleos para alto rendimiento.', categoria: 'Componentes', precio: 1250.0, stock: 10, estado: 'disponible', imagen: '🧠', idVendedor: 'U-002' },
  { id: 4, nombre: 'Memoria RAM DDR5', marca: 'Kingston', descripcion: 'Módulo de 16GB DDR5 a 5600MHz.', categoria: 'Componentes', precio: 320.0, stock: 30, estado: 'disponible', imagen: '🧩', idVendedor: 'U-002' },
  { id: 5, nombre: 'Tarjeta Gráfica RTX 4070', marca: 'Asus', descripcion: 'GPU para juegos y diseño en alta resolución.', categoria: 'Componentes', precio: 2890.0, stock: 6, estado: 'disponible', imagen: '🎮', idVendedor: 'U-002' },
  { id: 6, nombre: 'Monitor 27 144Hz', marca: 'Samsung', descripcion: 'Monitor Full HD de 27 pulgadas a 144Hz.', categoria: 'Monitores', precio: 749.0, stock: 12, estado: 'disponible', imagen: '🖥️', idVendedor: 'U-002' },
  { id: 7, nombre: 'Audífonos Gamer', marca: 'HyperX', descripcion: 'Audífonos con micrófono y sonido envolvente 7.1.', categoria: 'Periféricos', precio: 149.0, stock: 20, estado: 'disponible', imagen: '🎧', idVendedor: 'U-002' },
  { id: 8, nombre: 'SSD 1TB NVMe', marca: 'Western Digital', descripcion: 'Unidad de estado sólido ultrarrápida.', categoria: 'Almacenamiento', precio: 410.0, stock: 22, estado: 'disponible', imagen: '💾', idVendedor: 'U-002' },
  { id: 9, nombre: 'Fuente de Poder 750W', marca: 'Corsair', descripcion: 'Fuente certificada 80 Plus Bronze.', categoria: 'Componentes', precio: 350.0, stock: 14, estado: 'disponible', imagen: '🔌', idVendedor: 'U-002' },
  { id: 10, nombre: 'Silla Gamer', marca: 'Cougar', descripcion: 'Silla ergonómica reclinable con soporte lumbar.', categoria: 'Mobiliario', precio: 690.0, stock: 8, estado: 'disponible', imagen: '🪑', idVendedor: 'U-002' },
  { id: 11, nombre: 'Webcam Full HD', marca: 'Logitech', descripcion: 'Cámara web 1080p con micrófono integrado.', categoria: 'Periféricos', precio: 130.0, stock: 16, estado: 'disponible', imagen: '📷', idVendedor: 'U-002' },
  { id: 12, nombre: 'Placa Madre B650', marca: 'MSI', descripcion: 'Motherboard compatible con DDR5 y PCIe 4.0.', categoria: 'Componentes', precio: 780.0, stock: 9, estado: 'disponible', imagen: '🔧', idVendedor: 'U-002' },
  { id: 13, nombre: 'Laptop HP 15', marca: 'HP', descripcion: 'Laptop para estudio y oficina, 8GB RAM y SSD de 256GB.', categoria: 'Laptops', precio: 2200.0, stock: 7, estado: 'disponible', imagen: '💻', idVendedor: 'U-002' },
  { id: 14, nombre: 'Laptop Gamer Lenovo', marca: 'Lenovo', descripcion: 'Laptop gamer con tarjeta dedicada y pantalla de 144Hz.', categoria: 'Laptops', precio: 3990.0, stock: 4, estado: 'disponible', imagen: '💻', idVendedor: 'U-002' },
  { id: 15, nombre: 'Laptop Económica Asus', marca: 'Asus', descripcion: 'Laptop básica para tareas diarias y navegación.', categoria: 'Laptops', precio: 1450.0, stock: 9, estado: 'disponible', imagen: '💻', idVendedor: 'U-002' },
]

// Usuarios de ejemplo para iniciar sesión rápidamente en la demo.
// (Contraseña de ambos: 123456)
export const USUARIOS_INICIALES: Usuario[] = [
  {
    idPersona: 'P-001', nombre: 'Beryher', apellido: 'Agip', telefono: '999111222', dni: '70011223',
    idUsuario: 'U-001', correo: 'comprador@demo.com', contrasena: '123456',
    direccion: 'Av. Siempre Viva 123', distrito: 'Chiclayo', departamento: 'Lambayeque',
    rol: 'comprador', estado: 'activo',
  },
  {
    idPersona: 'P-002', nombre: 'Fabricio', apellido: 'Salazar', telefono: '988777666', dni: '70998877',
    idUsuario: 'U-002', correo: 'vendedor@demo.com', contrasena: '123456',
    direccion: 'Calle Comercio 456', distrito: 'Pimentel', departamento: 'Lambayeque',
    rol: 'vendedor', estado: 'activo',
  },
]
