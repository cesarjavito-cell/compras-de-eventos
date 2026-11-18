import {
  validatePresupuesto,
  checkPresupuestoImmutability,
  DEFAULT_PORCENTAJE_COMERCIAL,
  SETTING_KEY_DEFAULT_MARKUP,
  validatePorcentajeComercial
} from '../lib/presupuestoModel.js';

// Restored backup data from user
const initialData = {
  Producto: [
    { id: "local_1787833315099_9pqw", updated_date: "2026-08-27T12:21:55.099Z", nombre: "Queso Barra", categoria: "Fiambres", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753271298_85dv", updated_date: "2026-08-26T14:07:51.298Z", nombre: "Pimienta Negra", categoria: "Condimentos", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753255346_t6q5", updated_date: "2026-08-26T14:07:35.346Z", nombre: "Ají Molido Dulce", categoria: "Condimentos", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753230118_quws", updated_date: "2026-08-26T14:07:10.118Z", nombre: "Comino", categoria: "Condimentos", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753200503_4fxb", updated_date: "2026-08-26T14:06:40.503Z", nombre: "Sal Entrefina", categoria: "Condimentos", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753176410_vqx0", updated_date: "2026-08-26T14:06:16.410Z", nombre: "Provenzal", categoria: "Condimentos", unidad: "paquete", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753137886_h5dz", updated_date: "2026-08-26T14:05:37.887Z", nombre: "Papas Fritas Congeladas", categoria: "Fiambres", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753114158_grk5", updated_date: "2026-08-26T14:05:14.158Z", nombre: "Pan de Hamburguesa", categoria: "Panadería", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753097022_dev0", updated_date: "2026-08-26T14:04:57.022Z", nombre: "Hamburguesa Paty", categoria: "Fiambres", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753038538_41iy", updated_date: "2026-08-26T14:03:58.538Z", nombre: "Aceite Cocina", categoria: "Supermercado", unidad: "lt", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753014242_2e1t", updated_date: "2026-08-26T14:03:34.242Z", nombre: "Ketchup", categoria: "Supermercado", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787753003806_lfa6", updated_date: "2026-08-26T14:03:23.806Z", nombre: "Mostaza", categoria: "Supermercado", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752992694_bl5r", updated_date: "2026-08-26T14:03:12.694Z", nombre: "Mayonesa", categoria: "Supermercado", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752978078_s9gp", updated_date: "2026-08-26T14:02:58.078Z", nombre: "Ajos", categoria: "Verduras", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752967646_p5nr", updated_date: "2026-08-26T14:02:47.646Z", nombre: "Costilla Ternera", categoria: "Carnes", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752953946_8tu0", updated_date: "2026-08-26T14:02:33.946Z", nombre: "Vacio Ternera", categoria: "Carnes", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752936338_w7jm", updated_date: "2026-08-26T14:02:16.338Z", nombre: "Cerdo", categoria: "Carnes", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752923658_jj0i", updated_date: "2026-08-26T14:02:03.658Z", nombre: "Papas", categoria: "Verduras", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752912710_jsnx", updated_date: "2026-08-26T14:01:52.710Z", nombre: "Tomates", categoria: "Verduras", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752894250_n29y", updated_date: "2026-08-26T14:01:34.250Z", nombre: "Mandioca", categoria: "Verduras", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752881970_s4ss", updated_date: "2026-08-26T14:01:21.970Z", nombre: "Lechugas", categoria: "Verduras", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752869174_n4ht", updated_date: "2026-08-26T14:01:09.174Z", nombre: "Rúculas", categoria: "Verduras", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752850142_t3om", updated_date: "2026-08-26T14:00:50.142Z", nombre: "Patamuslo c/hueso", categoria: "Carnes", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752831994_c77d", updated_date: "2026-08-26T14:00:31.994Z", nombre: "Chorizo", categoria: "Carnes", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752818370_1f1z", updated_date: "2026-08-26T14:00:18.370Z", nombre: "Morcilla", categoria: "Carnes", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752803050_43g8", updated_date: "2026-08-26T14:00:03.050Z", nombre: "Morrón", categoria: "Verduras", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752792386_na7p", updated_date: "2026-08-26T13:59:52.386Z", nombre: "Patamuslo Deshuesado c/Piel", categoria: "Carnes", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752771870_e4dm", updated_date: "2026-08-26T13:59:31.870Z", nombre: "Cebolla", categoria: "Verduras", unidad: "kg", precio_actual: 2000, proveedor: "", notas: "" },
    { id: "local_1787752756278_jj5v", updated_date: "2026-08-26T13:59:16.278Z", nombre: "Panceta Ahumada", categoria: "Fiambres", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752741074_28r1", updated_date: "2026-08-26T13:59:01.074Z", nombre: "Pan de Mesa", categoria: "Panadería", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752728646_p4c8", updated_date: "2026-08-26T13:58:48.646Z", nombre: "Grisines y Chinitas", categoria: "Panadería", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752711778_y6te", updated_date: "2026-08-26T13:58:31.778Z", nombre: "Queso Roquefort", categoria: "Fiambres", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752698090_iv57", updated_date: "2026-08-26T13:58:18.090Z", nombre: "Queso Moozarella", categoria: "Fiambres", unidad: "kg", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752669422_fy7m", updated_date: "2026-08-26T13:57:49.422Z", nombre: "Manteca", categoria: "Supermercado", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752653274_p3hv", updated_date: "2026-08-26T13:57:33.274Z", nombre: "Tapas Copetín", categoria: "Supermercado", unidad: "unidad", precio_actual: 2000, proveedor: "", notas: "" },
    { id: "local_1787752634918_23c7", updated_date: "2026-08-26T13:57:14.918Z", nombre: "Molida Vacuna", categoria: "Carnes", unidad: "kg", precio_actual: 0, proveedor: "Hiper del Pollo", notas: "" },
    { id: "local_1787752613613_ntlx", updated_date: "2026-08-26T13:56:53.613Z", nombre: "Molida de Pollo", categoria: "Carnes", unidad: "kg", precio_actual: 0, proveedor: "Hiper Pollo", notas: "" },
    { id: "local_1787752577158_tqba", updated_date: "2026-08-26T13:56:17.158Z", nombre: "Pernil de Cerdo ", categoria: "Carnes", unidad: "kg", precio_actual: 6500, proveedor: "Casa del Cerdo", notas: "" },
    { id: "local_1787752545358_9jax", updated_date: "2026-08-26T13:55:45.358Z", nombre: "Jamon Cocido", categoria: "Fiambres", unidad: "kg", precio_actual: 17500, proveedor: "", notas: "" },
    { id: "local_1787752524094_g7kq", updated_date: "2026-08-26T13:55:24.094Z", nombre: "Huevos x 30 Unid", categoria: "Verduras", unidad: "unidad", precio_actual: 6000, proveedor: "", notas: "" },
    { id: "local_1787752505374_9zwe", updated_date: "2026-08-26T13:55:05.374Z", nombre: "Acelga Mazo", categoria: "Verduras", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752491026_4yef", updated_date: "2026-08-26T13:54:51.026Z", nombre: "Perejil Mazo", categoria: "Verduras", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752476146_cpq6", updated_date: "2026-08-26T13:54:36.146Z", nombre: "Cebollita Verdeo", categoria: "Verduras", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752443822_xjap", updated_date: "2026-08-26T13:54:03.822Z", nombre: "Fernet x 750 cm3", categoria: "Bebidas Barra Tragos", unidad: "unidad", precio_actual: 17500, proveedor: "", notas: "" },
    { id: "local_1787752421554_to1i", updated_date: "2026-08-26T13:53:41.554Z", nombre: "Frutas en Lata Varias", categoria: "Supermercado", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752398066_u6iw", updated_date: "2026-08-26T13:53:18.066Z", nombre: "Sorbetes Paq", categoria: "Supermercado", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787752364482_q7p8", updated_date: "2026-08-26T13:52:44.482Z", nombre: "Cerveza x 473 cm3 x 24 Latas", categoria: "Bebidas Generales", unidad: "unidad", precio_actual: 46000, proveedor: "", notas: "" },
    { id: "local_1787752251481_bi87", updated_date: "2026-08-26T13:50:51.481Z", nombre: "Vino Blanco Dulce", categoria: "Bebidas Generales", unidad: "unidad", precio_actual: 4800, proveedor: "", notas: "" },
    { id: "local_1787752228182_nxwb", updated_date: "2026-08-26T13:50:28.182Z", nombre: "Gaseosas x 1,75 Lts", categoria: "Bebidas Generales", unidad: "unidad", precio_actual: 3400, proveedor: "", notas: "" },
    { id: "local_1787752166470_yux6", updated_date: "2026-08-26T13:49:26.470Z", nombre: "Agua Mineral x 1.5 lt", categoria: "Bebidas Generales", unidad: "unidad", precio_actual: 1200, proveedor: "", notas: "" },
    { id: "local_1787752132317_ypvh", updated_date: "2026-08-26T13:48:52.317Z", nombre: "Pancitos Pernil", categoria: "Panadería", unidad: "unidad", precio_actual: 224, proveedor: "", notas: "" },
    { id: "local_1787751874004_d6aa", updated_date: "2026-08-26T13:44:34.004Z", nombre: "Pan de Miga", categoria: "Supermercado", unidad: "unidad", precio_actual: 18000, proveedor: "", notas: "" },
    { id: "local_1787751847766_qsg2", updated_date: "2026-08-26T13:44:07.766Z", nombre: "Queso Crema", categoria: "Supermercado", unidad: "unidad", precio_actual: 4800, proveedor: "", notas: "" },
    { id: "local_1787751829333_wo7d", updated_date: "2026-08-26T13:43:49.333Z", nombre: "Pizza Moozzarella Prelistas", categoria: "Otros", unidad: "unidad", precio_actual: 5200, proveedor: "", notas: "" },
    { id: "local_1787751779774_7kao", updated_date: "2026-08-26T13:42:59.774Z", nombre: "Carbon x 5 Kg", categoria: "Otros", unidad: "unidad", precio_actual: 1800, proveedor: "", notas: "" },
    { id: "local_1787751747637_ktwf", updated_date: "2026-08-26T13:42:27.638Z", nombre: "Gin Bot", categoria: "Bebidas Barra Tragos", unidad: "unidad", precio_actual: 7000, proveedor: "", notas: "" },
    { id: "local_1787751720977_iyhg", updated_date: "2026-08-26T13:42:36.231Z", nombre: "Vodka Bot.", categoria: "Bebidas Barra Tragos", unidad: "unidad", precio_actual: 6500, proveedor: "", notas: "" },
    { id: "local_1787751705541_q6cp", updated_date: "2026-08-26T13:41:45.541Z", nombre: "Gancia x 1250 ml", categoria: "Bebidas Generales", unidad: "unidad", precio_actual: 0, proveedor: "", notas: "" },
    { id: "local_1787751645134_v0zj", updated_date: "2026-08-26T13:41:03.405Z", nombre: "Agua Tónica", categoria: "Bebidas Barra Tragos", unidad: "unidad", precio_actual: 3500, proveedor: "", notas: "" },
    { id: "local_1787751609442_5c9n", updated_date: "2026-08-26T13:40:56.981Z", nombre: "Vino Tinto", categoria: "Bebidas Generales", unidad: "unidad", precio_actual: 6500, proveedor: "", notas: "" },
    { id: "local_1787751570169_dzq9", updated_date: "2026-08-26T13:39:30.169Z", nombre: "Azucar Rubio", categoria: "Supermercado", unidad: "unidad", precio_actual: 1100, proveedor: "", notas: "" },
    { id: "local_1787750863093_jdzy", updated_date: "2026-08-26T13:27:43.093Z", nombre: "Tapa Empanadas Horno", categoria: "Supermercado", unidad: "unidad", precio_actual: 2000, proveedor: "", notas: "" },
    { id: "local_1787749924877_o0q5", updated_date: "2026-08-26T13:12:04.877Z", nombre: "Tapa Empanadas Freir", categoria: "Supermercado", unidad: "unidad", precio_actual: 2000, proveedor: "", notas: "" }
  ],
  Categoria: [
    { id: "c1", nombre: "Carnes", orden: 0 },
    { id: "c2", nombre: "Aves", orden: 1 },
    { id: "c3", nombre: "Pescados", orden: 2 },
    { id: "c4", nombre: "Verduras", orden: 3 },
    { id: "c5", nombre: "Frutas", orden: 4 },
    { id: "c6", nombre: "Bebidas Barra Tragos", orden: 5, updated_date: "2026-08-26T13:41:15.565Z" },
    { id: "c7", nombre: "Panadería", orden: 6 },
    { id: "c8", nombre: "Lácteos", orden: 7 },
    { id: "c9", nombre: "Condimentos", orden: 8 },
    { id: "c10", nombre: "Almacen", orden: 9 },
    { id: "c11", nombre: "Limpieza", orden: 10 },
    { id: "c12", nombre: "Bebidas Generales", orden: 11 },
    { id: "c13", nombre: "Fiambres", orden: 12 },
    { id: "c14", nombre: "Supermercado", orden: 13 },
    { id: "c15", nombre: "Otros", orden: 14 }
  ],
  Menu: [
    {
      id: "local_1787834056790_252t",
      updated_date: "2026-08-27T12:34:16.790Z",
      nombre: "Finger Food",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787749924877_o0q5", producto_nombre: "Tapa Empanadas Freir", cantidad_por_persona: 0.15, unidad: "unidad" },
        { producto_id: "local_1787751874004_d6aa", producto_nombre: "Pan de Miga", cantidad_por_persona: 0.13, unidad: "unidad" },
        { producto_id: "local_1787752634918_23c7", producto_nombre: "Molida Vacuna", cantidad_por_persona: 0.04, unidad: "kg" },
        { producto_id: "local_1787752577158_tqba", producto_nombre: "Pernil de Cerdo ", cantidad_por_persona: 0.1, unidad: "kg" },
        { producto_id: "local_1787752545358_9jax", producto_nombre: "Jamon Cocido", cantidad_por_persona: 0.03, unidad: "kg" },
        { producto_id: "local_1787752132317_ypvh", producto_nombre: "Pancitos Pernil", cantidad_por_persona: 3, unidad: "unidad" },
        { producto_id: "local_1787752524094_g7kq", producto_nombre: "Huevos x 30 Unid", cantidad_por_persona: 0.03, unidad: "unidad" },
        { producto_id: "local_1787752803050_43g8", producto_nombre: "Morrón", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787752491026_4yef", producto_nombre: "Perejil Mazo", cantidad_por_persona: 0.06, unidad: "unidad" },
        { producto_id: "local_1787752476146_cpq6", producto_nombre: "Cebollita Verdeo", cantidad_por_persona: 0.08, unidad: "unidad" },
        { producto_id: "local_1787752912710_jsnx", producto_nombre: "Tomates", cantidad_por_persona: 0.05, unidad: "kg" },
        { producto_id: "local_1787752771870_e4dm", producto_nombre: "Cebolla", cantidad_por_persona: 0.04, unidad: "kg" },
        { producto_id: "local_1787752613613_ntlx", producto_nombre: "Molida de Pollo", cantidad_por_persona: 0.02, unidad: "kg" },
        { producto_id: "local_1787833315099_9pqw", producto_nombre: "Queso Barra", cantidad_por_persona: 0.038, unidad: "kg" },
        { producto_id: "local_1787751847766_qsg2", producto_nombre: "Queso Crema", cantidad_por_persona: 0.05, unidad: "unidad" },
        { producto_id: "local_1787752653274_p3hv", producto_nombre: "Tapas Copetín", cantidad_por_persona: 0.063, unidad: "unidad" },
        { producto_id: "local_1787752505374_9zwe", producto_nombre: "Acelga Mazo", cantidad_por_persona: 0.03, unidad: "unidad" },
        { producto_id: "local_1787751829333_wo7d", producto_nombre: "Pizza Moozzarella Prelistas", cantidad_por_persona: 0.1, unidad: "unidad" },
        { producto_id: "local_1787750863093_jdzy", producto_nombre: "Tapa Empanadas Horno", cantidad_por_persona: 0.08, unidad: "unidad" },
        { producto_id: "local_1787753200503_4fxb", producto_nombre: "Sal Entrefina", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787753230118_quws", producto_nombre: "Comino", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787752992694_bl5r", producto_nombre: "Mayonesa", cantidad_por_persona: 0.02, unidad: "kg" },
        { producto_id: "local_1787753038538_41iy", producto_nombre: "Aceite Cocina", cantidad_por_persona: 0.01, unidad: "lt" }
      ]
    },
    {
      id: "local_1787833298042_ht9k",
      updated_date: "2026-08-27T12:26:12.710Z",
      nombre: "Entraditas Finger",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787751874004_d6aa", producto_nombre: "Pan de Miga", cantidad_por_persona: 0.013, unidad: "unidad" },
        { producto_id: "local_1787752634918_23c7", producto_nombre: "Molida Vacuna", cantidad_por_persona: 0.025, unidad: "kg" },
        { producto_id: "local_1787752613613_ntlx", producto_nombre: "Molida de Pollo", cantidad_por_persona: 0.013, unidad: "kg" },
        { producto_id: "local_1787752545358_9jax", producto_nombre: "Jamon Cocido", cantidad_por_persona: 0.03, unidad: "kg" },
        { producto_id: "local_1787752524094_g7kq", producto_nombre: "Huevos x 30 Unid", cantidad_por_persona: 0.02, unidad: "unidad" },
        { producto_id: "local_1787752505374_9zwe", producto_nombre: "Acelga Mazo", cantidad_por_persona: 0.02, unidad: "unidad" },
        { producto_id: "local_1787752491026_4yef", producto_nombre: "Perejil Mazo", cantidad_por_persona: 0.03, unidad: "unidad" },
        { producto_id: "local_1787752476146_cpq6", producto_nombre: "Cebollita Verdeo", cantidad_por_persona: 0.05, unidad: "unidad" },
        { producto_id: "local_1787752771870_e4dm", producto_nombre: "Cebolla", cantidad_por_persona: 0.03, unidad: "kg" },
        { producto_id: "local_1787750863093_jdzy", producto_nombre: "Tapa Empanadas Horno", cantidad_por_persona: 0.04, unidad: "unidad" },
        { producto_id: "local_1787749924877_o0q5", producto_nombre: "Tapa Empanadas Freir", cantidad_por_persona: 0.11, unidad: "unidad" },
        { producto_id: "local_1787752653274_p3hv", producto_nombre: "Tapas Copetín", cantidad_por_persona: 0.04, unidad: "unidad" },
        { producto_id: "local_1787751847766_qsg2", producto_nombre: "Queso Crema", cantidad_por_persona: 0.04, unidad: "unidad" },
        { producto_id: "local_1787752803050_43g8", producto_nombre: "Morrón", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787833315099_9pqw", producto_nombre: "Queso Barra", cantidad_por_persona: 0.035, unidad: "kg" },
        { producto_id: "local_1787752992694_bl5r", producto_nombre: "Mayonesa", cantidad_por_persona: 0.05, unidad: "kg" },
        { producto_id: "local_1787753200503_4fxb", producto_nombre: "Sal Entrefina", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787753176410_vqx0", producto_nombre: "Provenzal", cantidad_por_persona: 0.01, unidad: "paquete" },
        { producto_id: "local_1787753230118_quws", producto_nombre: "Comino", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787753038538_41iy", producto_nombre: "Aceite Cocina", cantidad_por_persona: 0.01, unidad: "lt" }
      ]
    },
    {
      id: "local_1787783128737_x92n",
      updated_date: "2026-08-26T22:25:28.737Z",
      nombre: "Burguer Free c/ Papas Fritas ",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787753097022_dev0", producto_nombre: "Hamburguesa Paty", cantidad_por_persona: 1.5, unidad: "unidad" },
        { producto_id: "local_1787753114158_grk5", producto_nombre: "Pan de Hamburguesa", cantidad_por_persona: 1.5, unidad: "unidad" },
        { producto_id: "local_1787752881970_s4ss", producto_nombre: "Lechugas", cantidad_por_persona: 0.075, unidad: "unidad" },
        { producto_id: "local_1787752912710_jsnx", producto_nombre: "Tomates", cantidad_por_persona: 0.31, unidad: "kg" },
        { producto_id: "local_1787752992694_bl5r", producto_nombre: "Mayonesa", cantidad_por_persona: 0.02, unidad: "kg" },
        { producto_id: "local_1787753003806_lfa6", producto_nombre: "Mostaza", cantidad_por_persona: 0.01, unidad: "kg" },
        { producto_id: "local_1787753014242_2e1t", producto_nombre: "Ketchup", cantidad_por_persona: 0.015, unidad: "kg" },
        { producto_id: "local_1787753137886_h5dz", producto_nombre: "Papas Fritas Congeladas", cantidad_por_persona: 0.18, unidad: "kg" },
        { producto_id: "local_1787752711778_y6te", producto_nombre: "Queso Roquefort", cantidad_por_persona: 0.006, unidad: "kg" },
        { producto_id: "local_1787752669422_fy7m", producto_nombre: "Manteca", cantidad_por_persona: 0.004, unidad: "unidad" },
        { producto_id: "local_1787752728646_p4c8", producto_nombre: "Grisines y Chinitas", cantidad_por_persona: 0.05, unidad: "kg" },
        { producto_id: "local_1787751847766_qsg2", producto_nombre: "Queso Crema", cantidad_por_persona: 0.052, unidad: "unidad" }
      ]
    },
    {
      id: "local_1787781930245_krw5",
      updated_date: "2026-08-26T22:05:30.245Z",
      nombre: "Ensaladas",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787752923658_jj0i", producto_nombre: "Papas", cantidad_por_persona: 0.1, unidad: "kg" },
        { producto_id: "local_1787752912710_jsnx", producto_nombre: "Tomates", cantidad_por_persona: 0.06, unidad: "kg" },
        { producto_id: "local_1787752881970_s4ss", producto_nombre: "Lechugas", cantidad_por_persona: 0.1, unidad: "unidad" },
        { producto_id: "local_1787752869174_n4ht", producto_nombre: "Rúculas", cantidad_por_persona: 0.145, unidad: "unidad" },
        { producto_id: "local_1787752894250_n29y", producto_nombre: "Mandioca", cantidad_por_persona: 0.045, unidad: "kg" }
      ]
    },
    {
      id: "local_1787781733440_tjrb",
      updated_date: "2026-08-26T22:02:13.440Z",
      nombre: "Galeto Deshuesado Relleno",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787752792386_na7p", producto_nombre: "Patamuslo Deshuesado c/Piel", cantidad_por_persona: 1.05, unidad: "unidad" },
        { producto_id: "local_1787752756278_jj5v", producto_nombre: "Panceta Ahumada", cantidad_por_persona: 0.02, unidad: "kg" },
        { producto_id: "local_1787752912710_jsnx", producto_nombre: "Tomates", cantidad_por_persona: 0.05, unidad: "kg" },
        { producto_id: "local_1787752771870_e4dm", producto_nombre: "Cebolla", cantidad_por_persona: 0.03, unidad: "kg" },
        { producto_id: "local_1787752803050_43g8", producto_nombre: "Morrón", cantidad_por_persona: 0.04, unidad: "kg" },
        { producto_id: "local_1787752741074_28r1", producto_nombre: "Pan de Mesa", cantidad_por_persona: 0.031, unidad: "kg" },
        { producto_id: "local_1787752711778_y6te", producto_nombre: "Queso Roquefort", cantidad_por_persona: 0.006, unidad: "kg" },
        { producto_id: "local_1787752669422_fy7m", producto_nombre: "Manteca", cantidad_por_persona: 0.004, unidad: "unidad" },
        { producto_id: "local_1787752728646_p4c8", producto_nombre: "Grisines y Chinitas", cantidad_por_persona: 0.05, unidad: "kg" },
        { producto_id: "local_1787751779774_7kao", producto_nombre: "Carbon x 5 Kg", cantidad_por_persona: 0.1, unidad: "unidad" },
        { producto_id: "local_1787751847766_qsg2", producto_nombre: "Queso Crema", cantidad_por_persona: 0.052, unidad: "unidad" }
      ]
    },
    {
      id: "local_1787781368866_zxid",
      updated_date: "2026-08-26T22:03:37.786Z",
      nombre: "Asado Completo",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787752967646_p5nr", producto_nombre: "Costilla Ternera", cantidad_por_persona: 0.19, unidad: "kg" },
        { producto_id: "local_1787752953946_8tu0", producto_nombre: "Vacio Ternera", cantidad_por_persona: 0.1, unidad: "kg" },
        { producto_id: "local_1787752936338_w7jm", producto_nombre: "Cerdo", cantidad_por_persona: 0.11, unidad: "kg" },
        { producto_id: "local_1787752850142_t3om", producto_nombre: "Patamuslo c/hueso", cantidad_por_persona: 0.5, unidad: "unidad" },
        { producto_id: "local_1787752831994_c77d", producto_nombre: "Chorizo", cantidad_por_persona: 0.66, unidad: "unidad" },
        { producto_id: "local_1787752818370_1f1z", producto_nombre: "Morcilla", cantidad_por_persona: 0.33, unidad: "unidad" },
        { producto_id: "local_1787751779774_7kao", producto_nombre: "Carbon x 5 Kg", cantidad_por_persona: 0.1, unidad: "unidad" },
        { producto_id: "local_1787752741074_28r1", producto_nombre: "Pan de Mesa", cantidad_por_persona: 0.03, unidad: "kg" },
        { producto_id: "local_1787753200503_4fxb", producto_nombre: "Sal Entrefina", cantidad_por_persona: 0.001, unidad: "kg" },
        { producto_id: "local_1787752711778_y6te", producto_nombre: "Queso Roquefort", cantidad_por_persona: 0.006, unidad: "kg" },
        { producto_id: "local_1787752669422_fy7m", producto_nombre: "Manteca", cantidad_por_persona: 0.004, unidad: "unidad" },
        { producto_id: "local_1787752728646_p4c8", producto_nombre: "Grisines y Chinitas", cantidad_por_persona: 0.05, unidad: "kg" },
        { producto_id: "local_1787751847766_qsg2", producto_nombre: "Queso Crema", cantidad_por_persona: 0.052, unidad: "unidad" }
      ]
    },
    {
      id: "local_1787755088469_k6x7",
      updated_date: "2026-08-26T14:38:08.469Z",
      nombre: "BARRA DE TRAGOS",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787752443822_xjap", producto_nombre: "Fernet x 750 cm3", cantidad_por_persona: 0.029, unidad: "unidad" },
        { producto_id: "local_1787751705541_q6cp", producto_nombre: "Gancia x 1250 ml", cantidad_por_persona: 0.021, unidad: "unidad" },
        { producto_id: "local_1787751720977_iyhg", producto_nombre: "Vodka Bot.", cantidad_por_persona: 0.063, unidad: "unidad" },
        { producto_id: "local_1787751747637_ktwf", producto_nombre: "Gin Bot", cantidad_por_persona: 0.015, unidad: "unidad" },
        { producto_id: "local_1787752421554_to1i", producto_nombre: "Frutas en Lata Varias", cantidad_por_persona: 0.125, unidad: "unidad" },
        { producto_id: "local_1787751570169_dzq9", producto_nombre: "Azucar Rubio", cantidad_por_persona: 0.029, unidad: "unidad" },
        { producto_id: "local_1787752398066_u6iw", producto_nombre: "Sorbetes Paq", cantidad_por_persona: 5, unidad: "unidad" },
        { producto_id: "local_1787751645134_v0zj", producto_nombre: "Agua Tónica", cantidad_por_persona: 0.142, unidad: "unidad" }
      ]
    },
    {
      id: "local_1787753449149_wdxm",
      updated_date: "2026-08-26T14:10:49.149Z",
      nombre: "BEBIDAS GENERALES",
      descripcion: "",
      tipo: "Principal",
      items: [
        { producto_id: "local_1787752364482_q7p8", producto_nombre: "Cerveza x 473 cm3 x 24 Latas", cantidad_por_persona: 0.081, unidad: "unidad" },
        { producto_id: "local_1787751609442_5c9n", producto_nombre: "Vino Tinto", cantidad_por_persona: 0.2, unidad: "unidad" },
        { producto_id: "local_1787752251481_bi87", producto_nombre: "Vino Blanco Dulce", cantidad_por_persona: 0.04, unidad: "unidad" },
        { producto_id: "local_1787752228182_nxwb", producto_nombre: "Gaseosas x 1,75 Lts", cantidad_por_persona: 0.8, unidad: "unidad" },
        { producto_id: "local_1787752166470_yux6", producto_nombre: "Agua Mineral x 1.5 lt", cantidad_por_persona: 0.15, unidad: "unidad" }
      ]
    }
  ],
  Evento: [
    {
      id: "local_1787753494911_k9ox",
      updated_date: "2026-08-26T21:50:43.631Z",
      nombre: "CASAMIENTO EJEMPLO",
      cliente: "",
      fecha: "",
      cantidad_comensales: 100,
      menus_ids: [
        "local_1787753449149_wdxm",
        "local_1787755088469_k6x7"
      ],
      estado: "borrador",
      notas: ""
    }
  ]
};

const getLocalEntityData = (entityName) => {
  if (typeof window === 'undefined') return initialData[entityName] || [];
  const key = `catering_local_${entityName}`;
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // FASE 3.0.2: Si la clave existe en localStorage y es un array válido,
        // se respeta íntegramente (incluso si es una colección intencionalmente vacía []).
        return parsed;
      }
    } catch {
      // fallback seguro si el JSON almacenado estaba corrupto
    }
  }
  // Solo si la clave NO existe en absoluto en el almacenamiento (navegador virgen) se inicializa con los datos semilla.
  const init = initialData[entityName] || [];
  try {
    localStorage.setItem(key, JSON.stringify(init));
  } catch { /* ignore */ }
  return init;
};

const setLocalEntityData = (entityName, data) => {
  if (typeof window === 'undefined') return;
  const key = `catering_local_${entityName}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
};

const notifyCloudSync = () => {
  // FASE 3.0.2: Desactivado.
  // Las mutaciones se resguardan de forma atómica y segura en localStorage sin llamadas inseguras a APIs públicas.
};

const createLocalEntityHandler = (entityName) => ({
  list: async () => {
    return getLocalEntityData(entityName);
  },
  get: async (id) => {
    const list = getLocalEntityData(entityName);
    return list.find(x => x.id === id) || null;
  },
  create: async (item) => {
    const list = getLocalEntityData(entityName);
    const prefix = entityName === 'Presupuesto' ? 'presup' : 'local';
    const id = item.id || `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id,
      updated_date: now,
      fecha_creacion: item.fecha_creacion || now
    };
    if (entityName === 'Presupuesto') {
      validatePresupuesto(newItem, { throwOnError: true });
    }
    list.unshift(newItem);
    setLocalEntityData(entityName, list);
    notifyCloudSync();
    return newItem;
  },
  update: async (id, patch) => {
    const list = getLocalEntityData(entityName);
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      const current = list[idx];
      if (entityName === 'Presupuesto') {
        checkPresupuestoImmutability(current, patch);
      }
      const updatedItem = {
        ...current,
        ...patch,
        updated_date: new Date().toISOString()
      };
      if (entityName === 'Presupuesto') {
        validatePresupuesto(updatedItem, { throwOnError: true });
      }
      list[idx] = updatedItem;
      setLocalEntityData(entityName, list);
      notifyCloudSync();
      return list[idx];
    }
    return null;
  },
  delete: async (id) => {
    let list = getLocalEntityData(entityName);
    list = list.filter(x => x.id !== id);
    setLocalEntityData(entityName, list);
    notifyCloudSync();
    return true;
  },
  updateMany: async (filter, updateOp) => {
    const list = getLocalEntityData(entityName);
    const patch = updateOp?.$set || {};
    let changed = false;
    list.forEach((item, idx) => {
      let match = true;
      for (const k in filter) {
        if (item[k] !== filter[k]) { match = false; break; }
      }
      if (match) {
        if (entityName === 'Presupuesto') {
          checkPresupuestoImmutability(item, patch);
        }
        const updated = {
          ...item,
          ...patch,
          updated_date: new Date().toISOString()
        };
        if (entityName === 'Presupuesto') {
          validatePresupuesto(updated, { throwOnError: true });
        }
        list[idx] = updated;
        changed = true;
      }
    });
    if (changed) {
      setLocalEntityData(entityName, list);
      notifyCloudSync();
    }
    return true;
  }
});


// FASE 3.0.2: Se eliminan las escrituras incondicionales de initialData y el sondeo periódico a api.restful-api.dev.
// La inicialización segura de colecciones se gestiona bajo demanda en getLocalEntityData exclusivamente cuando
// una clave no existe en absoluto en el almacenamiento (navegador nuevo), respetando colecciones vacías o modificadas.

export const base44 = {
  functions: {
    invoke: async () => ({ success: true })
  },
  entities: {
    Producto: createLocalEntityHandler('Producto'),
    Menu: createLocalEntityHandler('Menu'),
    Evento: createLocalEntityHandler('Evento'),
    Categoria: createLocalEntityHandler('Categoria'),
    Presupuesto: createLocalEntityHandler('Presupuesto'),
  },
  clearAllData: () => {
    setLocalEntityData('Producto', []);
    setLocalEntityData('Categoria', initialData.Categoria);
    setLocalEntityData('Menu', []);
    setLocalEntityData('Evento', []);
    setLocalEntityData('Presupuesto', []);
    notifyCloudSync();
  },
  resetFactoryData: () => {
    setLocalEntityData('Producto', initialData.Producto);
    setLocalEntityData('Categoria', initialData.Categoria);
    setLocalEntityData('Menu', initialData.Menu);
    setLocalEntityData('Evento', initialData.Evento);
    setLocalEntityData('Presupuesto', []);
    notifyCloudSync();
  },
  exportAllData: () => {
    const ajustes_cantidades = {};
    const productos_en_deposito = {};

    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('catering_calc_qty_')) {
          const eventId = key.replace('catering_calc_qty_', '');
          try {
            const parsed = JSON.parse(localStorage.getItem(key));
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              ajustes_cantidades[eventId] = parsed;
            }
          } catch {}
        } else if (key.startsWith('catering_calc_check_')) {
          const eventId = key.replace('catering_calc_check_', '');
          try {
            const parsed = JSON.parse(localStorage.getItem(key));
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              productos_en_deposito[eventId] = parsed;
            }
          } catch {}
        }
      }
    }

    let porcentaje_comercial_default = DEFAULT_PORCENTAJE_COMERCIAL;
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedMarkup = localStorage.getItem(SETTING_KEY_DEFAULT_MARKUP);
      if (storedMarkup !== null && storedMarkup !== '') {
        const parsed = Number(storedMarkup);
        if (Number.isFinite(parsed) && !Number.isNaN(parsed) && parsed >= 0) {
          porcentaje_comercial_default = parsed;
        }
      }
    }

    return {
      version: '2.2',
      app: 'compras-de-eventos',
      configuracion: {
        porcentaje_comercial_default
      },
      productos: getLocalEntityData('Producto'),
      categorias: getLocalEntityData('Categoria'),
      menus: getLocalEntityData('Menu'),
      eventos: getLocalEntityData('Evento'),
      presupuestos: getLocalEntityData('Presupuesto'),
      ajustes_cantidades,
      productos_en_deposito,
      export_date: new Date().toISOString()
    };
  },
  importAllData: (data, options = {}) => {
    if (!data || typeof data !== 'object') {
      throw new Error('El archivo no contiene un objeto JSON válido');
    }

    if (data.app && data.app !== 'compras-de-eventos') {
      throw new Error('El archivo corresponde a otra aplicación y no es compatible con Compras de Eventos');
    }

    const allowEmptyPresupuestos = options?.allowEmptyPresupuestos === true;
    const warnings = [];

    // Validación estricta previa para evitar sobrescrituras parciales ante archivos corruptos
    if (data.productos !== undefined && !Array.isArray(data.productos)) {
      throw new Error('El formato de "productos" no es válido (debe ser una lista)');
    }
    if (data.categorias !== undefined && !Array.isArray(data.categorias)) {
      throw new Error('El formato de "categorias" no es válido (debe ser una lista)');
    }
    if (data.menus !== undefined && !Array.isArray(data.menus)) {
      throw new Error('El formato de "menus" no es válido (debe ser una lista)');
    }
    if (data.eventos !== undefined && !Array.isArray(data.eventos)) {
      throw new Error('El formato de "eventos" no es válido (debe ser una lista)');
    }
    if (data.presupuestos !== undefined && !Array.isArray(data.presupuestos)) {
      throw new Error('El formato de "presupuestos" no es válido (debe ser una lista)');
    }
    if (data.configuracion !== undefined) {
      if (!data.configuracion || typeof data.configuracion !== 'object' || Array.isArray(data.configuracion)) {
        throw new Error('El formato de "configuracion" no es válido (debe ser un objeto)');
      }
      if (data.configuracion.porcentaje_comercial_default !== undefined) {
        try {
          validatePorcentajeComercial(data.configuracion.porcentaje_comercial_default);
        } catch (err) {
          throw new Error(`Configuración comercial inválida: ${err.message}`);
        }
      }
    }
    if (!data.productos && !data.categorias && !data.menus && !data.eventos && !data.presupuestos && !data.configuracion) {
      throw new Error('El archivo no contiene datos compatibles de Compras de Eventos');
    }

    // Validación profunda de cada presupuesto si vienen en el archivo
    if (Array.isArray(data.presupuestos)) {
      data.presupuestos.forEach((p, idx) => {
        try {
          validatePresupuesto(p, { throwOnError: true });
        } catch (err) {
          throw new Error(`Presupuesto inválido en índice [${idx}]: ${err.message}`);
        }
      });
    }

    // Planificación de escrituras para ejecución controlada
    const plannedWrites = [];

    // 1. Entidades base
    if (Array.isArray(data.productos)) plannedWrites.push(['catering_local_Producto', JSON.stringify(data.productos)]);
    if (Array.isArray(data.categorias)) plannedWrites.push(['catering_local_Categoria', JSON.stringify(data.categorias)]);
    if (Array.isArray(data.menus)) plannedWrites.push(['catering_local_Menu', JSON.stringify(data.menus)]);
    if (Array.isArray(data.eventos)) plannedWrites.push(['catering_local_Evento', JSON.stringify(data.eventos)]);

    // 2. Presupuestos (Manejo de Escenarios A, B y C)
    if (Array.isArray(data.presupuestos)) {
      const currentPresupuestos = getLocalEntityData('Presupuesto');
      if (data.presupuestos.length > 0) {
        plannedWrites.push(['catering_local_Presupuesto', JSON.stringify(data.presupuestos)]);
      } else {
        // Colección vacía []
        if (currentPresupuestos.length > 0) {
          if (allowEmptyPresupuestos) {
            // Escenario C: Reemplazo explícito por colección vacía
            plannedWrites.push(['catering_local_Presupuesto', JSON.stringify([])]);
          } else {
            // Escenario B: Conservar por defecto y registrar advertencia
            warnings.push('El archivo de respaldo contiene una lista de presupuestos vacía. Se conservaron los presupuestos locales existentes para evitar pérdidas accidentales.');
            console.warn('Compras de Eventos [importAllData]: Respaldo con lista de presupuestos vacía. Se conservaron los presupuestos locales existentes.');
          }
        } else {
          plannedWrites.push(['catering_local_Presupuesto', JSON.stringify([])]);
        }
      }
    }
    // Escenario A: data.presupuestos === undefined -> no se planifica escritura, conservando locales.

    // 3. Ajustes de cálculo de compras
    if (data.ajustes_cantidades && typeof data.ajustes_cantidades === 'object') {
      for (const [eventId, qtyMap] of Object.entries(data.ajustes_cantidades)) {
        if (eventId && qtyMap && typeof qtyMap === 'object') {
          plannedWrites.push([`catering_calc_qty_${eventId}`, JSON.stringify(qtyMap)]);
        }
      }
    }

    // 4. Estados de depósito de compras
    if (data.productos_en_deposito && typeof data.productos_en_deposito === 'object') {
      for (const [eventId, checkMap] of Object.entries(data.productos_en_deposito)) {
        if (eventId && checkMap && typeof checkMap === 'object') {
          plannedWrites.push([`catering_calc_check_${eventId}`, JSON.stringify(checkMap)]);
        }
      }
    }

    // 5. Configuración comercial
    if (data.configuracion && data.configuracion.porcentaje_comercial_default !== undefined) {
      const validMarkup = validatePorcentajeComercial(data.configuracion.porcentaje_comercial_default);
      plannedWrites.push([SETTING_KEY_DEFAULT_MARKUP, String(validMarkup)]);
    }


    // Ejecución transaccional con Snapshot-and-Rollback en localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const rollbackSnapshot = new Map();
      for (const [key] of plannedWrites) {
        rollbackSnapshot.set(key, localStorage.getItem(key));
      }

      try {
        for (const [key, val] of plannedWrites) {
          localStorage.setItem(key, val);
        }
      } catch (writeErr) {
        // Rollback ante errores de escritura (ej. QuotaExceededError)
        for (const [key, prevVal] of rollbackSnapshot.entries()) {
          try {
            if (prevVal === null) {
              localStorage.removeItem(key);
            } else {
              localStorage.setItem(key, prevVal);
            }
          } catch (revertErr) {
            console.error('Compras de Eventos [importAllData]: Falló la reversión de clave durante rollback:', key, revertErr);
          }
        }
        throw new Error(`Error al escribir datos en el almacenamiento local: ${writeErr.message}. Se realizó un rollback seguro restableciendo los datos originales.`);
      }
    }

    notifyCloudSync();
    return { success: true, warnings };
  }
};
