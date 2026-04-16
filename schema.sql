-- ============================================================
-- ESQUEMA BASE DE DATOS - COTIZADOR ELÉCTRICO
-- Ejecutar en: Neon Console > SQL Editor
-- ============================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de categorías de materiales
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de materiales/productos
CREATE TABLE IF NOT EXISTS materiales (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER REFERENCES categorias(id),
  unidad VARCHAR(20) DEFAULT 'unidad',
  precio_costo DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
  margen_ganancia DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN precio_costo > 0 
    THEN ROUND(((precio_venta - precio_costo) / precio_costo * 100)::numeric, 2) 
    ELSE 0 END
  ) STORED,
  stock INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  empresa VARCHAR(150),
  email VARCHAR(150),
  telefono VARCHAR(20),
  direccion TEXT,
  ruc_cedula VARCHAR(20),
  notas TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) UNIQUE NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  titulo VARCHAR(200),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','aprobada','rechazada','facturada')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  descuento_pct DECIMAL(5,2) DEFAULT 0,
  descuento_valor DECIMAL(10,2) DEFAULT 0,
  iva_pct DECIMAL(5,2) DEFAULT 15,
  iva_valor DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  validez_dias INTEGER DEFAULT 30,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de ítems de cotización
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id SERIAL PRIMARY KEY,
  cotizacion_id INTEGER REFERENCES cotizaciones(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materiales(id),
  descripcion VARCHAR(300),
  cantidad DECIMAL(10,2) NOT NULL DEFAULT 1,
  unidad VARCHAR(20) DEFAULT 'unidad',
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento_pct DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (
    ROUND((cantidad * precio_unitario * (1 - descuento_pct/100))::numeric, 2)
  ) STORED
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Categorías de materiales eléctricos
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Canalización', 'Tubería, canaletas y accesorios para canalización eléctrica'),
  ('Conductores', 'Cables y conductores eléctricos'),
  ('Iluminación', 'Lámparas, luminarias y accesorios de iluminación'),
  ('Mano de Obra', 'Servicios de instalación y mano de obra'),
  ('Medición', 'Medidores y equipos de medición eléctrica'),
  ('Protecciones', 'Breakers, fusibles y elementos de protección'),
  ('Tableros', 'Tableros eléctricos y gabinetes'),
  ('Tomacorrientes', 'Tomacorrientes, enchufes, interruptores y accesorios'),
  ('Conectores', 'Terminales, empalmes, conectores y accesorios de unión'),
  ('Puesta a Tierra', 'Varillas, abrazaderas, conectores y accesorios de tierra física'),
  ('Automatización', 'Contactores, relés, temporizadores y control eléctrico'),
  ('Bandejas y Soportería', 'Bandejas portacables, soportes, riel DIN y fijaciones'),
  ('Herramientas y Consumibles', 'Cinta aislante, bridas y consumibles de instalación'),
  ('Sensores y Control', 'Fotoceldas, sensores y dispositivos de control'),
  ('Energía de Respaldo', 'UPS, baterías e inversores'),
  ('Solar', 'Paneles, inversores y accesorios fotovoltaicos');
ON CONFLICT DO NOTHING;

-- CONDUCTORES
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('CAB-THHN-14-NEG', 'Cable THHN #14 AWG negro', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.45, 0.70),
  ('CAB-THHN-14-BLA', 'Cable THHN #14 AWG blanco', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.45, 0.70),
  ('CAB-THHN-14-ROJ', 'Cable THHN #14 AWG rojo', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.45, 0.70),
  ('CAB-THHN-12-NEG', 'Cable THHN #12 AWG negro', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.65, 0.95),
  ('CAB-THHN-12-BLA', 'Cable THHN #12 AWG blanco', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.65, 0.95),
  ('CAB-THHN-12-VER', 'Cable THHN #12 AWG verde', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.65, 0.95),
  ('CAB-THHN-10-NEG', 'Cable THHN #10 AWG negro', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.85, 1.20),
  ('CAB-THHN-10-BLA', 'Cable THHN #10 AWG blanco', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.85, 1.20),
  ('CAB-THHN-10-ROJ', 'Cable THHN #10 AWG rojo', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.85, 1.20),
  ('CAB-THHN-8-NEG', 'Cable THHN #8 AWG negro', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 2.50, 3.50),
  ('CAB-THHN-6-NEG', 'Cable THHN #6 AWG negro', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 3.50, 4.80),
  ('CAB-THHN-4-NEG', 'Cable THHN #4 AWG negro', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 5.00, 6.70),
  ('CAB-DUP-12', 'Cable dúplex #12 AWG', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 1.20, 1.75),
  ('CAB-DUP-14', 'Cable dúplex #14 AWG', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.95, 1.40),
  ('CAB-TRIP-12', 'Cable triplex #12 AWG', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 1.80, 2.60),
  ('CAB-TRIP-14', 'Cable triplex #14 AWG', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 1.40, 2.00),
  ('CORD-TSJ-2X14', 'Cordón flexible TSJ 2x14', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 0.90, 1.50),
  ('CORD-TSJ-3X14', 'Cordón flexible TSJ 3x14', (SELECT id FROM categorias WHERE nombre = 'Conductores'), 'metro', 1.20, 1.90);
ON CONFLICT DO NOTHING;
-- CANALIZACION
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('TUB-EMT-1/2', 'Tubería EMT 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 3m', 4.50, 6.50),
  ('TUB-EMT-3/4', 'Tubería EMT 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 3m', 5.50, 8.00),
  ('TUB-EMT-1', 'Tubería EMT 1 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 3m', 8.00, 12.00),
  ('TUB-PVC-1/2', 'Tubería PVC 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 3m', 2.80, 4.20),
  ('TUB-PVC-3/4', 'Tubería PVC 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 3m', 3.50, 5.20),
  ('TUB-PVC-1', 'Tubería PVC 1 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 3m', 4.80, 7.00),
  ('CAN-20X12', 'Canaleta 20x12 mm', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 2m', 2.20, 3.80),
  ('CAN-40X25', 'Canaleta 40x25 mm', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 2m', 4.50, 7.00),
  ('CAN-60X40', 'Canaleta 60x40 mm', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 2m', 8.50, 12.50),
  ('CAN-100X50', 'Canaleta 100x50 mm', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'tramo 2m', 14.00, 20.00),
  ('CODO-EMT-1/2', 'Codo EMT 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.80, 1.20),
  ('CODO-EMT-3/4', 'Codo EMT 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 1.00, 1.50),
  ('CODO-PVC-1/2', 'Codo PVC 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.40, 0.70),
  ('CODO-PVC-3/4', 'Codo PVC 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.50, 0.85),
  ('CONEC-EMT-1/2', 'Conector EMT 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.35, 0.70),
  ('CONEC-EMT-3/4', 'Conector EMT 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.45, 0.85),
  ('UNION-EMT-1/2', 'Unión EMT 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.35, 0.70),
  ('UNION-EMT-3/4', 'Unión EMT 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.45, 0.85),
  ('ADAP-PVC-1/2', 'Adaptador PVC 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.25, 0.50),
  ('ADAP-PVC-3/4', 'Adaptador PVC 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Canalización'), 'unidad', 0.30, 0.60);
ON CONFLICT DO NOTHING;
-- PROTECCIONES
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('BRK-1P15', 'Breaker 1 polo 15A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 7.50, 12.00),
  ('BRK-1P20', 'Breaker 1 polo 20A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 8.00, 13.00),
  ('BRK-1P30', 'Breaker 1 polo 30A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 9.00, 15.00),
  ('BRK-2P20', 'Breaker 2 polos 20A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 12.00, 19.00),
  ('BRK-2P30', 'Breaker 2 polos 30A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 14.00, 22.00),
  ('BRK-2P40', 'Breaker 2 polos 40A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 18.00, 28.00),
  ('BRK-2P60', 'Breaker 2 polos 60A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 22.00, 35.00),
  ('BRK-3P30', 'Breaker 3 polos 30A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 28.00, 42.00),
  ('BRK-3P50', 'Breaker 3 polos 50A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 34.00, 52.00),
  ('BRK-3P60', 'Breaker 3 polos 60A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 38.00, 58.00),
  ('DIF-2P25', 'Interruptor diferencial 2 polos 25A 30mA', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 35.00, 55.00),
  ('DIF-2P40', 'Interruptor diferencial 2 polos 40A 30mA', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 38.00, 60.00),
  ('DIF-4P25', 'Interruptor diferencial 4 polos 25A 30mA', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 65.00, 95.00),
  ('FUS-10A', 'Fusible 10A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 0.80, 1.80),
  ('FUS-20A', 'Fusible 20A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 0.90, 2.00),
  ('FUS-NH00-63', 'Fusible NH00 63A', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 8.00, 14.00),
  ('PORT-FUS', 'Portafusible modular', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 4.50, 8.00),
  ('SUP-TENS-1P', 'Supresor de sobretensión 1 polo', (SELECT id FROM categorias WHERE nombre = 'Protecciones'), 'unidad', 18.00, 28.00);
ON CONFLICT DO NOTHING;
-- TABLEROS
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('TAB-4C', 'Tablero 4 circuitos', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 25.00, 40.00),
  ('TAB-8C', 'Tablero 8 circuitos', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 38.00, 60.00),
  ('TAB-12C', 'Tablero 12 circuitos', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 45.00, 75.00),
  ('TAB-16C', 'Tablero 16 circuitos', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 58.00, 92.00),
  ('TAB-24C', 'Tablero 24 circuitos', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 85.00, 130.00),
  ('GAB-30X40', 'Gabinete metálico 30x40 cm', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 42.00, 68.00),
  ('GAB-40X50', 'Gabinete metálico 40x50 cm', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 58.00, 88.00),
  ('GAB-50X60', 'Gabinete metálico 50x60 cm', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 75.00, 115.00),
  ('BARRA-NEU-12', 'Barra de neutro 12 posiciones', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 8.50, 14.00),
  ('BARRA-TIE-12', 'Barra de tierra 12 posiciones', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 9.00, 15.00),
  ('RIEL-DIN-50', 'Riel DIN 50 cm', (SELECT id FROM categorias WHERE nombre = 'Tableros'), 'unidad', 2.00, 4.00);
ON CONFLICT DO NOTHING;
-- TOMACORRIENTES E INTERRUPTORES
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('TOM-DOBLE-15', 'Tomacorriente doble 15A', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 3.50, 6.00),
  ('TOM-DOBLE-GND', 'Tomacorriente doble con tierra 15A', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 4.50, 7.50),
  ('TOM-220V-20', 'Tomacorriente 220V 20A', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 6.00, 10.00),
  ('TOM-USB', 'Tomacorriente doble con USB', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 12.00, 20.00),
  ('INT-SIMPLE', 'Interruptor simple', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 2.00, 5.00),
  ('INT-DOBLE', 'Interruptor doble', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 3.50, 7.00),
  ('INT-TRIPLE', 'Interruptor triple', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 5.00, 9.00),
  ('CONM-ESC', 'Conmutador de escalera', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 3.80, 7.50),
  ('PLACA-SIMPLE', 'Placa simple decorativa', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 0.80, 1.50),
  ('PLACA-DOBLE', 'Placa doble decorativa', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 1.20, 2.20),
  ('PLACA-TRIPLE', 'Placa triple decorativa', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 1.80, 3.00),
  ('CAJA-RECT-MET', 'Caja rectangular metálica', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 0.70, 1.30),
  ('CAJA-RECT-PVC', 'Caja PVC rectangular', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 0.40, 0.80),
  ('CAJA-OCT-MET', 'Caja octogonal metálica', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 0.90, 1.60),
  ('CAJA-CHALUPA', 'Caja tipo chalupa', (SELECT id FROM categorias WHERE nombre = 'Tomacorrientes'), 'unidad', 0.55, 1.00);
ON CONFLICT DO NOTHING;
-- ILUMINACION
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('BOMB-LED-9W', 'Bombillo LED 9W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 1.20, 2.20),
  ('BOMB-LED-12W', 'Bombillo LED 12W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 1.50, 2.80),
  ('BOMB-LED-15W', 'Bombillo LED 15W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 1.90, 3.40),
  ('PANEL-LED-18W', 'Panel LED empotrable 18W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 6.50, 10.50),
  ('PANEL-LED-24W', 'Panel LED empotrable 24W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 8.00, 12.80),
  ('REF-LED-30W', 'Reflector LED 30W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 6.50, 10.50),
  ('REF-LED-50W', 'Reflector LED 50W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 9.50, 15.00),
  ('REF-LED-100W', 'Reflector LED 100W', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 16.00, 24.00),
  ('TUB-LED-18W', 'Tubo LED T8 18W 120 cm', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 2.80, 4.80),
  ('PORT-E27', 'Portalámpara E27', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 0.70, 1.40),
  ('LAMP-EMERG', 'Lámpara de emergencia LED', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 12.00, 20.00),
  ('FAROL-EXT', 'Farol exterior para muro', (SELECT id FROM categorias WHERE nombre = 'Iluminación'), 'unidad', 8.00, 14.00);
ON CONFLICT DO NOTHING;
-- CONECTORES
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('CONEC-RAP-2', 'Conector rápido 2 vías', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.12, 0.30),
  ('CONEC-RAP-3', 'Conector rápido 3 vías', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.15, 0.35),
  ('TERM-OJO-6', 'Terminal de ojo para cable #6', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.30, 0.65),
  ('TERM-OJO-10', 'Terminal de ojo para cable #10', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.20, 0.50),
  ('TERM-PIN-12', 'Terminal tipo pin para cable #12', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.08, 0.20),
  ('EMP-CAB-12', 'Empalme para cable #12', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.10, 0.25),
  ('REGLETA-12', 'Regleta de conexión 12 polos', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'unidad', 0.80, 1.80),
  ('CONEC-MC4', 'Conector MC4 macho-hembra', (SELECT id FROM categorias WHERE nombre = 'Conectores'), 'par', 1.50, 3.20);
ON CONFLICT DO NOTHING;
-- PUESTA A TIERRA
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('VAR-TIER-5/8', 'Varilla copperweld 5/8 x 2.4m', (SELECT id FROM categorias WHERE nombre = 'Puesta a Tierra'), 'unidad', 12.00, 20.00),
  ('ABR-TIER-5/8', 'Abrazadera para varilla de tierra 5/8', (SELECT id FROM categorias WHERE nombre = 'Puesta a Tierra'), 'unidad', 1.20, 2.50),
  ('CONEC-TIER', 'Conector para cable a tierra', (SELECT id FROM categorias WHERE nombre = 'Puesta a Tierra'), 'unidad', 1.00, 2.10),
  ('CAJA-INSPEC-TIER', 'Caja de inspección para puesta a tierra', (SELECT id FROM categorias WHERE nombre = 'Puesta a Tierra'), 'unidad', 8.00, 14.00),
  ('GEL-TIER', 'Gel mejorador de tierra', (SELECT id FROM categorias WHERE nombre = 'Puesta a Tierra'), 'bolsa', 6.00, 11.00),
  ('CAB-DESNUDO-4', 'Cable desnudo #4 AWG para tierra', (SELECT id FROM categorias WHERE nombre = 'Puesta a Tierra'), 'metro', 2.80, 4.50);
ON CONFLICT DO NOTHING;
-- AUTOMATIZACION
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('CONT-9A-220', 'Contactor 9A bobina 220V', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 14.00, 24.00),
  ('CONT-18A-220', 'Contactor 18A bobina 220V', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 22.00, 36.00),
  ('RELT-9-12A', 'Relé térmico 9-12A', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 12.00, 21.00),
  ('TEMP-DIN', 'Temporizador para riel DIN', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 18.00, 30.00),
  ('PULS-VERDE', 'Pulsador verde NA', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 2.20, 4.50),
  ('PULS-ROJO', 'Pulsador rojo NC', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 2.20, 4.50),
  ('SEL-3POS', 'Selector 3 posiciones', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 4.50, 8.00),
  ('LUZ-PIL-ROJA', 'Luz piloto roja 220V', (SELECT id FROM categorias WHERE nombre = 'Automatización'), 'unidad', 1.80, 3.50);
ON CONFLICT DO NOTHING;
-- MEDICION
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('MED-MONO', 'Medidor monofásico digital', (SELECT id FROM categorias WHERE nombre = 'Medición'), 'unidad', 35.00, 55.00),
  ('MED-TRI', 'Medidor trifásico digital', (SELECT id FROM categorias WHERE nombre = 'Medición'), 'unidad', 85.00, 130.00),
  ('TC-100A', 'Transformador de corriente 100/5A', (SELECT id FROM categorias WHERE nombre = 'Medición'), 'unidad', 18.00, 28.00),
  ('TC-200A', 'Transformador de corriente 200/5A', (SELECT id FROM categorias WHERE nombre = 'Medición'), 'unidad', 22.00, 34.00),
  ('VOL-DIG', 'Voltímetro digital de panel', (SELECT id FROM categorias WHERE nombre = 'Medición'), 'unidad', 8.00, 14.00),
  ('AMP-DIG', 'Amperímetro digital de panel', (SELECT id FROM categorias WHERE nombre = 'Medición'), 'unidad', 8.50, 14.50);
ON CONFLICT DO NOTHING;
-- BANDEJAS Y SOPORTERIA
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('BAN-PERF-100', 'Bandeja portacables perforada 100 mm', (SELECT id FROM categorias WHERE nombre = 'Bandejas y Soportería'), 'tramo 3m', 18.00, 28.00),
  ('BAN-PERF-200', 'Bandeja portacables perforada 200 mm', (SELECT id FROM categorias WHERE nombre = 'Bandejas y Soportería'), 'tramo 3m', 28.00, 42.00),
  ('SOP-L', 'Soporte tipo L para bandeja', (SELECT id FROM categorias WHERE nombre = 'Bandejas y Soportería'), 'unidad', 2.00, 4.00),
  ('ABR-OMEGA-1/2', 'Abrazadera omega 1/2 pulgada', (SELECT id FROM categorias WHERE nombre = 'Bandejas y Soportería'), 'unidad', 0.18, 0.45),
  ('ABR-OMEGA-3/4', 'Abrazadera omega 3/4 pulgada', (SELECT id FROM categorias WHERE nombre = 'Bandejas y Soportería'), 'unidad', 0.22, 0.50),
  ('VAR-ROSC-3/8', 'Varilla roscada 3/8', (SELECT id FROM categorias WHERE nombre = 'Bandejas y Soportería'), 'metro', 1.50, 2.80);
ON CONFLICT DO NOTHING;
-- HERRAMIENTAS Y CONSUMIBLES
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('CINT-AISL-NEG', 'Cinta aislante negra', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'unidad', 0.45, 1.00),
  ('CINT-AISL-ROJ', 'Cinta aislante roja', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'unidad', 0.45, 1.00),
  ('CINT-AISL-VER', 'Cinta aislante verde', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'unidad', 0.45, 1.00),
  ('BRIDA-200', 'Brida plástica 200 mm', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'paquete', 1.20, 2.50),
  ('BRIDA-300', 'Brida plástica 300 mm', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'paquete', 1.80, 3.50),
  ('TUB-TERM-NEG', 'Tubo termocontraíble negro', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'metro', 0.35, 0.80),
  ('TUB-TERM-ROJ', 'Tubo termocontraíble rojo', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'metro', 0.35, 0.80),
  ('SILICONA-ELEC', 'Silicona sellante para uso eléctrico', (SELECT id FROM categorias WHERE nombre = 'Herramientas y Consumibles'), 'unidad', 2.50, 4.80);
ON CONFLICT DO NOTHING;
-- SENSORES Y CONTROL
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('FOTOCEL-10A', 'Fotocelda 10A 120-240V', (SELECT id FROM categorias WHERE nombre = 'Sensores y Control'), 'unidad', 4.50, 8.50),
  ('SENS-MOV-360', 'Sensor de movimiento 360 grados', (SELECT id FROM categorias WHERE nombre = 'Sensores y Control'), 'unidad', 6.50, 11.00),
  ('DIMMER-600W', 'Dimmer 600W', (SELECT id FROM categorias WHERE nombre = 'Sensores y Control'), 'unidad', 5.00, 9.00),
  ('TIMBRE-MOD', 'Timbre modular', (SELECT id FROM categorias WHERE nombre = 'Sensores y Control'), 'unidad', 7.00, 12.00);
ON CONFLICT DO NOTHING;
-- ENERGIA DE RESPALDO
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('UPS-650VA', 'UPS 650VA', (SELECT id FROM categorias WHERE nombre = 'Energía de Respaldo'), 'unidad', 38.00, 58.00),
  ('UPS-1200VA', 'UPS 1200VA', (SELECT id FROM categorias WHERE nombre = 'Energía de Respaldo'), 'unidad', 72.00, 105.00),
  ('BAT-12V7AH', 'Batería sellada 12V 7Ah', (SELECT id FROM categorias WHERE nombre = 'Energía de Respaldo'), 'unidad', 14.00, 22.00),
  ('INV-1000W', 'Inversor 1000W', (SELECT id FROM categorias WHERE nombre = 'Energía de Respaldo'), 'unidad', 85.00, 125.00);
ON CONFLICT DO NOTHING;
-- SOLAR
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('PAN-SOL-550W', 'Panel solar 550W', (SELECT id FROM categorias WHERE nombre = 'Solar'), 'unidad', 110.00, 150.00),
  ('INV-SOL-3KW', 'Inversor solar 3kW', (SELECT id FROM categorias WHERE nombre = 'Solar'), 'unidad', 420.00, 560.00),
  ('BREAK-DC-2P', 'Breaker DC 2 polos', (SELECT id FROM categorias WHERE nombre = 'Solar'), 'unidad', 12.00, 22.00),
  ('FUS-DC-15A', 'Fusible DC 15A', (SELECT id FROM categorias WHERE nombre = 'Solar'), 'unidad', 2.50, 5.00),
  ('ESTR-PANEL', 'Estructura de montaje para panel solar', (SELECT id FROM categorias WHERE nombre = 'Solar'), 'juego', 28.00, 45.00);
ON CONFLICT DO NOTHING;
-- MANO DE OBRA
INSERT INTO materiales (codigo, nombre, categoria_id, unidad, precio_costo, precio_venta) VALUES
  ('MO-INST-TOMA', 'Instalación de tomacorriente', (SELECT id FROM categorias WHERE nombre = 'Mano de Obra'), 'punto', 5.00, 12.00),
  ('MO-INST-INT', 'Instalación de interruptor', (SELECT id FROM categorias WHERE nombre = 'Mano de Obra'), 'punto', 4.00, 10.00),
  ('MO-INST-LAMP', 'Instalación de lámpara', (SELECT id FROM categorias WHERE nombre = 'Mano de Obra'), 'punto', 6.00, 15.00),
  ('MO-INST-TABL', 'Instalación de tablero eléctrico', (SELECT id FROM categorias WHERE nombre = 'Mano de Obra'), 'unidad', 35.00, 80.00),
  ('MO-CABLEADO', 'Tendido de cableado eléctrico', (SELECT id FROM categorias WHERE nombre = 'Mano de Obra'), 'metro', 0.40, 1.00),
  ('MO-MANT', 'Mantenimiento preventivo eléctrico', (SELECT id FROM categorias WHERE nombre = 'Mano de Obra'), 'servicio', 25.00, 60.00);
ON CONFLICT DO NOTHING;

-- Usuario admin por defecto (contraseña: Admin1234)
-- NOTA: El hash real se genera por la API, este es solo referencial
-- Cámbialo desde la app después del primer inicio de sesión

-- ============================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON materiales(categoria_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario ON cotizaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_items_cotizacion ON cotizacion_items(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON clientes(usuario_id);