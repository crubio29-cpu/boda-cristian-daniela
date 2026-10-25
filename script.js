'use strict';

/* =========================================================
   CONFIGURACIÓN
   Miércoles 23 de diciembre de 2026, 10:00 a. m. (hora de Colombia, UTC-5).
   Con el desfase -05:00 la cuenta es correcta para cualquier invitado,
   sin importar su zona horaria.
   ========================================================= */
const FECHA_BODA = '2026-12-23T10:00:00-05:00';

/* Fases de la tarjeta (hora de Colombia, UTC-5):
   antes          -> hasta el fin del plazo para confirmar
   rsvp-cerrado   -> después del 1 de diciembre y hasta la boda
   dia            -> desde la hora de la boda hasta la medianoche
   despues        -> desde el 24 de diciembre
   Para probar cada fase, agrega al enlace:  ?fase=antes | rsvp-cerrado | dia | despues */
const RSVP_CIERRE = '2026-12-02T00:00:00-05:00';
const FIN_DIA = '2026-12-24T00:00:00-05:00';

/* ===== Cuenta regresiva ===== */
(function iniciarCuentaRegresiva() {
  const el = {
    dias: document.getElementById('dias'),
    horas: document.getElementById('horas'),
    minutos: document.getElementById('minutos'),
    segundos: document.getElementById('segundos'),
    contador: document.getElementById('contador'),
    fin: document.getElementById('contador-fin'),
  };

  const objetivo = new Date(FECHA_BODA).getTime();
  if (Number.isNaN(objetivo)) {
    console.warn('Cuenta regresiva: revisa el formato de FECHA_BODA en script.js.');
    return;
  }

  const MS = { segundo: 1000, minuto: 60000, hora: 3600000, dia: 86400000 };
  const dos = (n) => String(n).padStart(2, '0');
  let intervalo;

  function actualizar() {
    const restante = objetivo - Date.now();

    if (restante <= 0) {
      clearInterval(intervalo);
      aplicarFase();
      return;
    }

    el.dias.textContent = Math.floor(restante / MS.dia);
    el.horas.textContent = dos(Math.floor((restante % MS.dia) / MS.hora));
    el.minutos.textContent = dos(Math.floor((restante % MS.hora) / MS.minuto));
    el.segundos.textContent = dos(Math.floor((restante % MS.minuto) / MS.segundo));
  }

  actualizar();
  intervalo = setInterval(actualizar, 1000);
})();

/* ===== Copiar llaves Bre-B (cada botón copia su data-copiar) ===== */
(function iniciarCopiado() {
  const botones = document.querySelectorAll('.btn-copiar');
  const aviso = document.getElementById('aviso-copiado');
  if (!botones.length) return;

  let temporizador;

  // Respaldo para contextos sin navigator.clipboard (p. ej. abrir el archivo directo desde el disco)
  function copiarRespaldo(texto) {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, texto.length);
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }

  async function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
    return copiarRespaldo(texto);
  }

  function restaurar() {
    botones.forEach((b) => {
      b.classList.remove('copiado');
      b.querySelector('.btn-texto').textContent = b.dataset.original;
    });
    aviso.textContent = '';
  }

  function mostrar(boton, ok) {
    clearTimeout(temporizador);
    restaurar();
    if (ok) {
      boton.classList.add('copiado');
      boton.querySelector('.btn-texto').textContent = '¡Copiado!';
      aviso.textContent = 'Llave copiada al portapapeles.';
    } else {
      aviso.textContent = 'No se pudo copiar. Mantén presionada la llave para copiarla.';
    }
    temporizador = setTimeout(restaurar, 2500);
  }

  botones.forEach((boton) => {
    boton.addEventListener('click', async () => {
      try {
        mostrar(boton, await copiar(boton.dataset.copiar));
      } catch (err) {
        console.error('Error al copiar:', err);
        mostrar(boton, false);
      }
    });
  });
})();

/* ===== Foto del arco: busca img/novios con varias extensiones ===== */
(function cargarFoto() {
  const arco = document.getElementById('arco');
  if (!arco) return;

  const candidatas = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'].map((ext) => `img/novios.${ext}`);

  (function probar(i) {
    if (i >= candidatas.length) {
      console.warn('Foto no encontrada: guarda la imagen como img/novios.jpg (o .jpeg, .png, .webp).');
      return;
    }
    const img = new Image();
    img.onload = () => arco.style.setProperty('--foto', `url("${candidatas[i]}")`);
    img.onerror = () => probar(i + 1);
    img.src = candidatas[i];
  })(0);
})();

/* ===== Invitación personalizada por familia =====
   Enlace de ejemplo:  tusitio/?familia=Familia+Rubio+Ramirez&max=4
   - "familia": nombre EXACTO de la opción en el formulario (con tildes y mayúsculas).
   - "max": tope de personas, solo para mostrarlo en la tarjeta (el formulario lo hace cumplir).
   Sin parámetros, la tarjeta es general y el botón abre el formulario normal. */
(function personalizarFamilia() {
  const FORM_BASE = 'https://docs.google.com/forms/d/e/1FAIpQLSfXcjU_LtfSiUPpQT5XkKz1VHEXfG15GgBuxqt1-U_3YwBC2Q/viewform';
  // Código del campo "familia" del formulario (sale en un enlace prellenado: ...&entry.XXXXXXXXX=Familia+...).
  // Es propio de cada formulario: si cambias de formulario, hay que actualizarlo.
  const ENTRY_FAMILIA = 'entry.697646418';

  const params = new URLSearchParams(window.location.search);
  const familia = (params.get('familia') || '').trim().slice(0, 80);
  if (!familia) return;

  const max = Number.parseInt(params.get('max'), 10);
  const cupo = Number.isInteger(max) && max >= 1 && max <= 30
    ? 'hasta ' + max + (max === 1 ? ' persona' : ' personas')
    : '';

  // El botón de confirmación abre el formulario con la familia ya seleccionada
  const boton = document.getElementById('btn-rsvp');
  if (boton && ENTRY_FAMILIA) {
    const url = new URL(FORM_BASE);
    url.searchParams.set('usp', 'pp_url');
    url.searchParams.set(ENTRY_FAMILIA, familia);
    boton.href = url.toString();
  }

  // textContent (no innerHTML): el nombre viene del enlace y nunca se interpreta como HTML
  const mostrar = (id, texto) => {
    const el = document.getElementById(id);
    if (!el || !texto) return;
    el.textContent = texto;
    el.hidden = false;
  };

  mostrar('portada-para', 'Invitación para ' + familia);
  mostrar('hero-familia', 'Invitación para ' + familia + (cupo ? ' · ' + cupo : ''));
  mostrar('rsvp-cupo', cupo ? 'Tu invitación incluye ' + cupo + ', contando adultos y niños.' : '');
})();

/* ===== Pantalla de entrada =====
   El toque en "Abrir invitación" es la acción del usuario que los navegadores
   exigen para reproducir audio: ese mismo toque inicia la música (ver más abajo). */
(function iniciarPortada() {
  const portada = document.getElementById('portada');
  const boton = document.getElementById('btn-abrir');
  if (!portada || !boton) return;

  const raiz = document.documentElement;
  raiz.classList.add('portada-activa');

  boton.addEventListener('click', () => {
    portada.classList.add('abierta');
    raiz.classList.remove('portada-activa');
    window.scrollTo(0, 0);
    setTimeout(() => { portada.hidden = true; }, 1000);
  });
})();

/* ===== Música de fondo sutil =====
   Los navegadores no permiten reproducir audio sin una acción del usuario,
   así que empieza con el primer toque en la página. El botón flotante
   permite silenciarla o reactivarla. Archivo: audio/musica.mp3 */
(function iniciarMusica() {
  const audio = document.getElementById('musica');
  const boton = document.getElementById('btn-musica');
  if (!audio || !boton) return;

  const VOLUMEN = 0.25;          // En iPhone el volumen no se controla por código: usa un archivo ya suave
  let quiereMusica = true;       // pasa a false si el invitado la silencia
  let iniciada = false;
  let fade;

  audio.volume = VOLUMEN;

  function pintarBoton() {
    const sonando = !audio.paused;
    boton.classList.toggle('sonando', sonando);
    boton.setAttribute('aria-pressed', String(sonando));
    boton.setAttribute('aria-label', sonando ? 'Silenciar música de fondo' : 'Activar música de fondo');
  }

  function entradaSuave() {
    clearInterval(fade);
    audio.volume = 0;
    fade = setInterval(() => {
      const siguiente = Math.min(audio.volume + 0.025, VOLUMEN);
      audio.volume = siguiente;
      if (siguiente >= VOLUMEN) clearInterval(fade);
    }, 120);
  }

  async function reproducir() {
    try {
      await audio.play();
      iniciada = true;
      entradaSuave();
      return true;
    } catch (err) {
      return false;   // el navegador la bloqueó: se reintenta en el siguiente toque
    }
  }

  function primerToque() {
    if (!quiereMusica || iniciada) return;
    reproducir().then((ok) => {
      if (ok) ['click', 'touchend', 'keydown'].forEach((ev) => document.removeEventListener(ev, primerToque));
    });
  }
  ['click', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, primerToque, { passive: true }));

  boton.addEventListener('click', () => {
    if (audio.paused) {
      quiereMusica = true;
      reproducir();
    } else {
      quiereMusica = false;
      audio.pause();
    }
  });

  // Pausa al cambiar de pestaña o bloquear la pantalla; reanuda si no estaba silenciada
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (quiereMusica && iniciada) audio.play().catch(() => {});
  });

  audio.addEventListener('play', pintarBoton);
  audio.addEventListener('pause', pintarBoton);

  // Si el archivo no existe, se oculta el botón
  audio.addEventListener('error', () => {
    boton.hidden = true;
    console.warn('Música no encontrada: guarda la canción como audio/musica.mp3.');
  });
})();

/* ===== Probador de colores del código de vestimenta ===== */
(function iniciarProbador() {
  const seccion = document.getElementById('vestimenta');
  const paleta = document.getElementById('paleta');
  const etiqueta = document.getElementById('color-actual');
  if (!seccion || !paleta) return;

  paleta.addEventListener('click', (e) => {
    const muestra = e.target.closest('.muestra');
    if (!muestra) return;

    paleta.querySelectorAll('.muestra').forEach((m) => m.setAttribute('aria-pressed', 'false'));
    muestra.setAttribute('aria-pressed', 'true');
    seccion.style.setProperty('--prenda', muestra.dataset.color);
    etiqueta.textContent = muestra.dataset.nombre;
  });
})();

/* ===== La tarjeta cambia con el tiempo ===== */
function calcularFase() {
  const forzada = new URLSearchParams(window.location.search).get('fase');
  if (['antes', 'rsvp-cerrado', 'dia', 'despues'].includes(forzada)) return forzada;

  const ahora = Date.now();
  if (ahora >= new Date(FIN_DIA).getTime()) return 'despues';
  if (ahora >= new Date(FECHA_BODA).getTime()) return 'dia';
  if (ahora >= new Date(RSVP_CIERRE).getTime()) return 'rsvp-cerrado';
  return 'antes';
}

function aplicarFase() {
  const fase = calcularFase();
  document.documentElement.dataset.fase = fase;

  const porId = (id) => document.getElementById(id);
  const texto = (id, t) => { const e = porId(id); if (e) e.textContent = t; };
  const ocultar = (id, valor) => { const e = porId(id); if (e) e.hidden = valor; };

  // Confirmación de asistencia: se cierra después de la fecha límite
  const cerrado = fase !== 'antes';
  ocultar('rsvp-abierto', cerrado);
  ocultar('rsvp-cerrado', !cerrado);

  // El día de la boda y después, la cuenta regresiva se reemplaza por un mensaje
  const evento = fase === 'dia' || fase === 'despues';
  ocultar('contador', evento);
  ocultar('contador-fin', !evento);

  if (fase === 'dia') {
    texto('t-cuenta', 'Hoy es el gran día');
    texto('contador-fin', 'Te esperamos a las 10:00 a. m. en la Casa de Nohora Ramirez. ¡Nos hace muchísima ilusión verte!');
    texto('portada-texto', 'Hoy celebramos la boda de');
  }

  if (fase === 'despues') {
    texto('t-cuenta', 'Gracias');
    texto('contador-fin', 'Gracias por acompañarnos y hacer de este día algo inolvidable. Los llevamos en el corazón.');
    texto('hero-invita', 'Gracias por ser parte de nuestra boda');
    texto('portada-texto', 'Gracias por acompañarnos en la boda de');
    texto('btn-abrir', 'Entrar');
    ['ubicacion', 'vestimenta', 'rsvp'].forEach((id) => ocultar(id, true));
  }
}

aplicarFase();
