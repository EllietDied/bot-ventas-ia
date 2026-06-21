-- ============================================================
-- IA InkaShop · Siembra del catálogo (Supabase)
-- Paso 5: rellena la tabla "productos" con el catálogo de ejemplo.
--
-- IMPORTANTE: antes de correr esto, REGISTRA en la app una cuenta
-- con rol "vendedor" (así existe el perfil dueño de los productos).
-- Este script asigna TODOS los productos a la PRIMERA cuenta de
-- vendedor registrada.
--
-- Cómo usar: Supabase → SQL Editor → pega todo → Run.
-- Es seguro re-ejecutarlo solo si antes vacías la tabla (ver el final).
-- ============================================================

with v as (
  select id, (nombre || ' ' || apellido) as nombre_completo
  from public.perfiles
  where rol = 'vendedor'
  order by creado_en asc
  limit 1
)
insert into public.productos
  (nombre, marca, descripcion, categoria, precio, stock, estado, imagen, id_vendedor, vendedor_nombre)
select x.nombre, x.marca, x.descripcion, x.categoria, x.precio, x.stock,
       'disponible', x.imagen, v.id, v.nombre_completo
from v, (values
  ('Mouse Gamer RGB','Logitech','Mouse óptico con luces RGB y 6 botones programables.','Periféricos',89.90,25,'🖱️'),
  ('Teclado Mecánico','Redragon','Teclado mecánico de switches azules retroiluminado.','Periféricos',199.00,18,'⌨️'),
  ('Procesador Intel Core i7','Intel','Procesador de 12 núcleos para alto rendimiento.','Componentes',1250.00,10,'🧠'),
  ('Memoria RAM DDR5','Kingston','Módulo de 16GB DDR5 a 5600MHz.','Componentes',320.00,30,'🧩'),
  ('Tarjeta Gráfica RTX 4070','Asus','GPU para juegos y diseño en alta resolución.','Componentes',2890.00,6,'🎮'),
  ('Monitor 27 144Hz','Samsung','Monitor Full HD de 27 pulgadas a 144Hz.','Monitores',749.00,12,'🖥️'),
  ('Audífonos Gamer','HyperX','Audífonos con micrófono y sonido envolvente 7.1.','Periféricos',149.00,20,'🎧'),
  ('SSD 1TB NVMe','Western Digital','Unidad de estado sólido ultrarrápida.','Almacenamiento',410.00,22,'💾'),
  ('Fuente de Poder 750W','Corsair','Fuente certificada 80 Plus Bronze.','Componentes',350.00,14,'🔌'),
  ('Silla Gamer','Cougar','Silla ergonómica reclinable con soporte lumbar.','Mobiliario',690.00,8,'🪑'),
  ('Webcam Full HD','Logitech','Cámara web 1080p con micrófono integrado.','Periféricos',130.00,16,'📷'),
  ('Placa Madre B650','MSI','Motherboard compatible con DDR5 y PCIe 4.0.','Componentes',780.00,9,'🔧'),
  ('Laptop HP 15','HP','Laptop para estudio y oficina, 8GB RAM y SSD de 256GB.','Laptops',2200.00,7,'💻'),
  ('Laptop Gamer Lenovo','Lenovo','Laptop gamer con tarjeta dedicada y pantalla de 144Hz.','Laptops',3990.00,4,'💻'),
  ('Laptop Económica Asus','Asus','Laptop básica para tareas diarias y navegación.','Laptops',1450.00,9,'💻')
) as x(nombre, marca, descripcion, categoria, precio, stock, imagen);

-- Si necesitas volver a sembrar desde cero, primero vacía la tabla:
--   delete from public.productos;
-- y luego vuelve a correr el INSERT de arriba.
