/**
 * Genera automáticamente el formulario de confirmación (RSVP) de la boda,
 * con un tope de personas por familia. Solo usa el servicio de Formularios.
 *
 * CÓMO USARLO
 * 1. Entra a https://script.google.com y pulsa "Nuevo proyecto".
 * 2. Borra el código que aparece y pega todo este archivo.
 * 3. Edita la lista FAMILIAS (abajo) con tus familias y su tope de personas.
 * 4. Pulsa "Ejecutar" (función crearFormulario) y acepta los permisos.
 * 5. Abre "Registro de ejecución" y copia los enlaces (general y por familia).
 */

// ===================== EDITA ESTA LISTA =====================
const FAMILIAS = [
  { nombre: 'Familia Ejemplo Uno', max: 4 },
  { nombre: 'Familia Ejemplo Dos', max: 2 },
  { nombre: 'Familia Ejemplo Tres', max: 6 },
  // Agrega una línea por familia: { nombre: 'Familia Apellido', max: 3 },
];

const TITULO = 'Confirmación de asistencia · Cristian & Daniela';
const DESCRIPCION =
  'Boda de Cristian y Daniela · Miércoles 23 de diciembre de 2026, 10:00 a. m.\n' +
  'Elige tu familia y confirma cuántas personas asistirán. ¡Gracias por acompañarnos!';
const MENSAJE_FINAL =
  '¡Gracias por confirmar! Nos hace muy felices contar contigo en nuestro día.';
// ============================================================

function crearFormulario() {
  if (!FAMILIAS.length) throw new Error('La lista FAMILIAS está vacía.');

  const form = FormApp.create(TITULO)
    .setDescription(DESCRIPCION)
    .setConfirmationMessage(MENSAJE_FINAL)
    .setShowLinkToRespondAgain(false);

  // Página 1: selector de familia (las opciones se asignan al final)
  const selector = form
    .addListItem()
    .setTitle('¿A qué familia perteneces?')
    .setRequired(true);

  // Una página por familia, con su propio tope de personas
  const paginas = FAMILIAS.map((familia) => {
    const salto = form
      .addPageBreakItem()
      .setTitle(familia.nombre)
      .setHelpText('Esta invitación incluye hasta ' + familia.max + ' persona(s), contando adultos y niños.');

    const opciones = ['0 - No podremos asistir'];
    for (let i = 1; i <= familia.max; i++) opciones.push(String(i));

    form
      .addMultipleChoiceItem()
      .setTitle('¿Cuántas personas asistirán?')
      .setHelpText('Máximo ' + familia.max + '. Incluye adultos y niños.')
      .setChoiceValues(opciones)
      .setRequired(true);

    form
      .addParagraphTextItem()
      .setTitle('Nombres completos de las personas que asistirán')
      .setHelpText('Escribe un nombre por línea. Si no podrán asistir, deja este campo vacío.');

    return salto;
  });

  // Última página común a todas las familias
  const final = form.addPageBreakItem().setTitle('Últimos detalles');

  form
    .addTextItem()
    .setTitle('Nombre de quien responde')
    .setRequired(true);

  form
    .addTextItem()
    .setTitle('WhatsApp de contacto')
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle('Alergias o restricciones alimentarias (opcional)')
    .setHelpText('Indica a qué persona corresponde.');

  form
    .addParagraphTextItem()
    .setTitle('Un mensaje para los novios (opcional)');

  // Navegación: al terminar la página de cada familia, saltar a "Últimos detalles".
  // (setGoToPage actúa tras la página que PRECEDE a ese salto de página.)
  // La última familia ya pasa a "Últimos detalles" de forma natural.
  paginas.forEach((pagina, i) => {
    if (i > 0) pagina.setGoToPage(final);
  });

  // Opciones del selector: cada familia lleva a su propia página
  selector.setChoices(
    FAMILIAS.map((familia, i) => selector.createChoice(familia.nombre, paginas[i]))
  );

  // Un enlace prellenado por familia (ya trae la familia seleccionada)
  Logger.log('ENLACES POR FAMILIA (envía a cada una el suyo):');
  FAMILIAS.forEach((familia) => {
    const url = form
      .createResponse()
      .withItemResponse(selector.createResponse(familia.nombre))
      .toPrefilledUrl();
    Logger.log(familia.nombre + ' (máx. ' + familia.max + '): ' + url);
  });

  Logger.log('--------------------------------------------');
  Logger.log('Enlace general para la tarjeta: ' + form.getPublishedUrl());
  Logger.log('Editar el formulario: ' + form.getEditUrl());
  Logger.log('Para ver las respuestas en una hoja: abre el formulario > Respuestas > Vincular con Hojas de cálculo.');
}
