// Datos territoriales de Perú (UBIGEO oficial del INEI).
// reviewedAt: 2026-06-19
//
// Cobertura: los 25 departamentos (completo) y, con sus provincias y distritos,
// las zonas más usadas del proyecto: Lambayeque (región de la USS), Lima y Callao.
// Para las provincias/distritos no incluidos, el formulario usa texto controlado
// (no se inventan nombres ni códigos). Para ampliar, basta con agregar filas aquí.

export interface Ubigeo {
  code: string // código UBIGEO (texto, conserva ceros)
  name: string
  parentCode?: string // código del nivel superior
}

// ----- Departamentos (los 25) -----
export const PE_DEPARTAMENTOS: Ubigeo[] = [
  { code: '01', name: 'Amazonas' },
  { code: '02', name: 'Áncash' },
  { code: '03', name: 'Apurímac' },
  { code: '04', name: 'Arequipa' },
  { code: '05', name: 'Ayacucho' },
  { code: '06', name: 'Cajamarca' },
  { code: '07', name: 'Callao' },
  { code: '08', name: 'Cusco' },
  { code: '09', name: 'Huancavelica' },
  { code: '10', name: 'Huánuco' },
  { code: '11', name: 'Ica' },
  { code: '12', name: 'Junín' },
  { code: '13', name: 'La Libertad' },
  { code: '14', name: 'Lambayeque' },
  { code: '15', name: 'Lima' },
  { code: '16', name: 'Loreto' },
  { code: '17', name: 'Madre de Dios' },
  { code: '18', name: 'Moquegua' },
  { code: '19', name: 'Pasco' },
  { code: '20', name: 'Piura' },
  { code: '21', name: 'Puno' },
  { code: '22', name: 'San Martín' },
  { code: '23', name: 'Tacna' },
  { code: '24', name: 'Tumbes' },
  { code: '25', name: 'Ucayali' },
]

// ----- Provincias (de los departamentos con datos integrados) -----
export const PE_PROVINCIAS: Ubigeo[] = [
  // Callao (07)
  { code: '0701', name: 'Callao', parentCode: '07' },
  // Lambayeque (14)
  { code: '1401', name: 'Chiclayo', parentCode: '14' },
  { code: '1402', name: 'Ferreñafe', parentCode: '14' },
  { code: '1403', name: 'Lambayeque', parentCode: '14' },
  // Lima (15)
  { code: '1501', name: 'Lima', parentCode: '15' },
  { code: '1502', name: 'Barranca', parentCode: '15' },
  { code: '1503', name: 'Cajatambo', parentCode: '15' },
  { code: '1504', name: 'Canta', parentCode: '15' },
  { code: '1505', name: 'Cañete', parentCode: '15' },
  { code: '1506', name: 'Huaral', parentCode: '15' },
  { code: '1507', name: 'Huarochirí', parentCode: '15' },
  { code: '1508', name: 'Huaura', parentCode: '15' },
  { code: '1509', name: 'Oyón', parentCode: '15' },
  { code: '1510', name: 'Yauyos', parentCode: '15' },
]

// ----- Distritos (de las provincias con datos integrados) -----
export const PE_DISTRITOS: Ubigeo[] = [
  // Callao (0701)
  { code: '070101', name: 'Callao', parentCode: '0701' },
  { code: '070102', name: 'Bellavista', parentCode: '0701' },
  { code: '070103', name: 'Carmen de la Legua Reynoso', parentCode: '0701' },
  { code: '070104', name: 'La Perla', parentCode: '0701' },
  { code: '070105', name: 'La Punta', parentCode: '0701' },
  { code: '070106', name: 'Ventanilla', parentCode: '0701' },
  { code: '070107', name: 'Mi Perú', parentCode: '0701' },

  // Chiclayo (1401)
  { code: '140101', name: 'Chiclayo', parentCode: '1401' },
  { code: '140102', name: 'Chongoyape', parentCode: '1401' },
  { code: '140103', name: 'Eten', parentCode: '1401' },
  { code: '140104', name: 'Eten Puerto', parentCode: '1401' },
  { code: '140105', name: 'José Leonardo Ortiz', parentCode: '1401' },
  { code: '140106', name: 'La Victoria', parentCode: '1401' },
  { code: '140107', name: 'Lagunas', parentCode: '1401' },
  { code: '140108', name: 'Monsefú', parentCode: '1401' },
  { code: '140109', name: 'Nueva Arica', parentCode: '1401' },
  { code: '140110', name: 'Oyotún', parentCode: '1401' },
  { code: '140111', name: 'Picsi', parentCode: '1401' },
  { code: '140112', name: 'Pimentel', parentCode: '1401' },
  { code: '140113', name: 'Reque', parentCode: '1401' },
  { code: '140114', name: 'Santa Rosa', parentCode: '1401' },
  { code: '140115', name: 'Saña', parentCode: '1401' },
  { code: '140116', name: 'Cayaltí', parentCode: '1401' },
  { code: '140117', name: 'Patapo', parentCode: '1401' },
  { code: '140118', name: 'Pomalca', parentCode: '1401' },
  { code: '140119', name: 'Pucalá', parentCode: '1401' },
  { code: '140120', name: 'Tumán', parentCode: '1401' },

  // Ferreñafe (1402)
  { code: '140201', name: 'Ferreñafe', parentCode: '1402' },
  { code: '140202', name: 'Cañaris', parentCode: '1402' },
  { code: '140203', name: 'Incahuasi', parentCode: '1402' },
  { code: '140204', name: 'Manuel Antonio Mesones Muro', parentCode: '1402' },
  { code: '140205', name: 'Pítipo', parentCode: '1402' },
  { code: '140206', name: 'Pueblo Nuevo', parentCode: '1402' },

  // Lambayeque (1403)
  { code: '140301', name: 'Lambayeque', parentCode: '1403' },
  { code: '140302', name: 'Chóchope', parentCode: '1403' },
  { code: '140303', name: 'Íllimo', parentCode: '1403' },
  { code: '140304', name: 'Jayanca', parentCode: '1403' },
  { code: '140305', name: 'Mochumí', parentCode: '1403' },
  { code: '140306', name: 'Mórrope', parentCode: '1403' },
  { code: '140307', name: 'Motupe', parentCode: '1403' },
  { code: '140308', name: 'Olmos', parentCode: '1403' },
  { code: '140309', name: 'Pacora', parentCode: '1403' },
  { code: '140310', name: 'Salas', parentCode: '1403' },
  { code: '140311', name: 'San José', parentCode: '1403' },
  { code: '140312', name: 'Túcume', parentCode: '1403' },

  // Lima (1501)
  { code: '150101', name: 'Lima', parentCode: '1501' },
  { code: '150102', name: 'Ancón', parentCode: '1501' },
  { code: '150103', name: 'Ate', parentCode: '1501' },
  { code: '150104', name: 'Barranco', parentCode: '1501' },
  { code: '150105', name: 'Breña', parentCode: '1501' },
  { code: '150106', name: 'Carabayllo', parentCode: '1501' },
  { code: '150107', name: 'Chaclacayo', parentCode: '1501' },
  { code: '150108', name: 'Chorrillos', parentCode: '1501' },
  { code: '150109', name: 'Cieneguilla', parentCode: '1501' },
  { code: '150110', name: 'Comas', parentCode: '1501' },
  { code: '150111', name: 'El Agustino', parentCode: '1501' },
  { code: '150112', name: 'Independencia', parentCode: '1501' },
  { code: '150113', name: 'Jesús María', parentCode: '1501' },
  { code: '150114', name: 'La Molina', parentCode: '1501' },
  { code: '150115', name: 'La Victoria', parentCode: '1501' },
  { code: '150116', name: 'Lince', parentCode: '1501' },
  { code: '150117', name: 'Los Olivos', parentCode: '1501' },
  { code: '150118', name: 'Lurigancho', parentCode: '1501' },
  { code: '150119', name: 'Lurín', parentCode: '1501' },
  { code: '150120', name: 'Magdalena del Mar', parentCode: '1501' },
  { code: '150121', name: 'Pueblo Libre', parentCode: '1501' },
  { code: '150122', name: 'Miraflores', parentCode: '1501' },
  { code: '150123', name: 'Pachacámac', parentCode: '1501' },
  { code: '150124', name: 'Pucusana', parentCode: '1501' },
  { code: '150125', name: 'Puente Piedra', parentCode: '1501' },
  { code: '150126', name: 'Punta Hermosa', parentCode: '1501' },
  { code: '150127', name: 'Punta Negra', parentCode: '1501' },
  { code: '150128', name: 'Rímac', parentCode: '1501' },
  { code: '150129', name: 'San Bartolo', parentCode: '1501' },
  { code: '150130', name: 'San Borja', parentCode: '1501' },
  { code: '150131', name: 'San Isidro', parentCode: '1501' },
  { code: '150132', name: 'San Juan de Lurigancho', parentCode: '1501' },
  { code: '150133', name: 'San Juan de Miraflores', parentCode: '1501' },
  { code: '150134', name: 'San Luis', parentCode: '1501' },
  { code: '150135', name: 'San Martín de Porres', parentCode: '1501' },
  { code: '150136', name: 'San Miguel', parentCode: '1501' },
  { code: '150137', name: 'Santa Anita', parentCode: '1501' },
  { code: '150138', name: 'Santa María del Mar', parentCode: '1501' },
  { code: '150139', name: 'Santa Rosa', parentCode: '1501' },
  { code: '150140', name: 'Santiago de Surco', parentCode: '1501' },
  { code: '150141', name: 'Surquillo', parentCode: '1501' },
  { code: '150142', name: 'Villa El Salvador', parentCode: '1501' },
  { code: '150143', name: 'Villa María del Triunfo', parentCode: '1501' },
]
