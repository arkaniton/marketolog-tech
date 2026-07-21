/* ==========================================================================
   Анимации.

   Три правила, которым подчинено всё ниже:

   1. Анимируем только transform и opacity (плюс stroke-dashoffset у кольца).
      На страницах несколько десятков панелей с backdrop-filter — каждый
      движущийся за стеклом элемент заставляет его пересчитывать размытие.

   2. Всё запускается при попадании в кадр и играет один раз. Исключение —
      лента в hero: она крутится по кругу, но встаёт на паузу, когда уходит
      из виду или вкладка неактивна.

   3. При prefers-reduced-motion не запускается ничего: разметка и так
      содержит финальное состояние.

   Экраны дашборда скрыты атрибутом hidden. Наблюдатель это переживает
   нормально: пока экран скрыт, элемент нулевого размера и не считается
   видимым, а после показа событие приходит само.
   ========================================================================== */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Что анимируем и насколько элемент должен войти в кадр
  var TARGETS = [
    ['.ring',   0.5],    // кольцо цели: дуга дорисовывается
    ['.bar',    0.5],    // прогресс-бары
    ['.chart',  0.3],    // столбчатые диаграммы
    ['.funnel', 0.25],   // воронка возврата, построчно
    ['.works',  0.25],   // «что сработало»
    ['.nodes',  0.35],   // связанные ноды: линия и карточки
    ['.steps',  0.2]     // три шага на лендинге
  ];

  var done = new WeakSet();   // чтобы ничего не проигралось дважды

  /* ------------------------------------------------------------------
     Запуск при появлении в кадре
     ------------------------------------------------------------------ */

  function whenVisible(el, callback, threshold) {
    if (done.has(el)) return;

    if (!('IntersectionObserver' in window)) { callback(el); return; }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || done.has(entry.target)) return;
        observer.unobserve(entry.target);
        callback(entry.target);
      });
    }, { threshold: threshold });

    observer.observe(el);
  }

  function mark(el) {
    done.add(el);
    el.classList.add('is-in');
  }

  /* ------------------------------------------------------------------
     Числа: набегают от нуля

     Формат сохраняем как в разметке — «182 400», «4,6», «68».
     Разделитель разрядов и десятичную запятую восстанавливаем на каждом
     шаге, иначе на счётчике мелькала бы точка.
     ------------------------------------------------------------------ */

  function readNumber(text) {
    var clean = text.replace(/[\s  ]/g, '').replace(',', '.');
    var value = parseFloat(clean);
    if (isNaN(value)) return null;
    var dot = clean.indexOf('.');
    return {
      value: value,
      decimals: dot === -1 ? 0 : clean.length - dot - 1,
      grouped: /[\s  ]/.test(text)
    };
  }

  function writeNumber(value, spec) {
    var parts = value.toFixed(spec.decimals).split('.');
    if (spec.grouped) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    return parts.join(',');
  }

  function countUp(node, spec) {
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / 900, 1);
      node.nodeValue = writeNumber(spec.value * (1 - Math.pow(1 - p, 3)), spec);
      if (p < 1) requestAnimationFrame(frame);
      else node.nodeValue = writeNumber(spec.value, spec);
    }

    requestAnimationFrame(frame);
  }

  function setupCounters(root) {
    root.querySelectorAll('.metric, .ring__label b').forEach(function (el) {
      if (done.has(el)) return;

      // Число лежит в первом текстовом узле; единица (₽, %, /20) — отдельным
      // элементом рядом, её не трогаем
      var node = el.firstChild;
      if (!node || node.nodeType !== 3) return;

      var spec = readNumber(node.nodeValue);
      if (!spec) return;

      whenVisible(el, function (target) {
        done.add(target);
        countUp(node, spec);
      }, 0.6);
    });
  }

  /* ------------------------------------------------------------------
     Навешивание наблюдения на кусок страницы
     ------------------------------------------------------------------ */

  function observeIn(root) {
    TARGETS.forEach(function (pair) {
      root.querySelectorAll(pair[0]).forEach(function (el) {
        whenVisible(el, mark, pair[1]);
      });
    });
    setupCounters(root);
  }

  /* ------------------------------------------------------------------
     Лента действий в hero: смена карточек с печатью текста
     ------------------------------------------------------------------ */

  var HERO_CARDS = [
    {
      kind: 'Возврат клиента',
      title: 'Вернуть Марину К.',
      why: 'Не была 3 месяца, обычно раз в 3 недели. Источник — 2ГИС.',
      text: 'Марина, здравствуйте! Это Анна из «Ириса». Давно вас не видели — ' +
            'ваш мастер Лена держит окно в субботу, и на окрашивание сделаем −15%. Записать?',
      cta: 'Отправить'
    },
    {
      kind: 'Ответ на отзыв',
      title: 'Ответить Ольге В. · 2ГИС',
      why: 'Три звезды, висит без ответа 19 часов. Жалоба на ожидание.',
      text: 'Ольга, спасибо, что написали, и извините за ожидание. Разобрались: ' +
            'в тот день у мастера наложились записи, мы поправили расписание.',
      cta: 'Опубликовать'
    },
    {
      kind: 'Пост в Telegram',
      title: 'Канал молчит 9 дней',
      why: 'На этой неделе 14 свободных окон в четверг и пятницу.',
      text: 'Лето забирает у волос больше, чем кажется. На этой неделе у нас ' +
            'освободились окна в четверг и пятницу — приходите на уход.',
      cta: 'Опубликовать'
    }
  ];

  function setupHeroFeed() {
    var card = document.getElementById('hero-task');
    if (!card) return;

    var slots = {};
    ['kind', 'title', 'why', 'text', 'cta'].forEach(function (name) {
      slots[name] = card.querySelector('[data-slot="' + name + '"]');
    });
    if (!slots.text) return;

    var cursor = document.createElement('span');
    cursor.className = 'type-cursor';
    cursor.setAttribute('aria-hidden', 'true');

    // Экранному диктору незачем слышать посимвольный набор
    slots.text.setAttribute('aria-live', 'off');

    var index = 0;
    var timer = null;
    var typing = null;
    var running = false;
    var onScreen = false;

    function stop() {
      clearTimeout(timer);
      clearTimeout(typing);
      timer = typing = null;
      running = false;
    }

    function fill(data) {
      slots.kind.textContent = data.kind;
      slots.title.textContent = data.title;
      slots.why.textContent = data.why;
      slots.text.textContent = data.text;
      if (slots.cta) slots.cta.textContent = data.cta;
    }

    /* Высота карточки фиксируется по самому высокому из трёх состояний.

       Без этого страница дёргалась: текст печатается с нуля, у карточек
       разной длины обоснование и сообщение, и карточка то росла, то
       сжималась на пару десятков пикселей. Браузер компенсировал это
       прокруткой (scroll anchoring), и страница мелко ползала под
       курсором. Меряем вживую, потому что высота зависит от ширины
       колонки и от того, какие шрифты успели загрузиться. */
    function lockHeight() {
      var current = HERO_CARDS[index];
      var tallest = 0;

      card.style.minHeight = '';
      HERO_CARDS.forEach(function (data) {
        fill(data);
        tallest = Math.max(tallest, card.offsetHeight);
      });

      card.style.minHeight = tallest + 'px';
      fill(current);
    }

    function type(full, whenDone) {
      var i = 0;
      slots.text.textContent = '';
      slots.text.appendChild(cursor);

      (function step() {
        if (!running) return;
        i += 1;
        slots.text.textContent = full.slice(0, i);
        slots.text.appendChild(cursor);
        if (i < full.length) typing = setTimeout(step, 18);
        else whenDone();
      })();
    }

    function show(next) {
      var data = HERO_CARDS[next];
      fill(data);
      card.classList.remove('is-swapping');

      type(data.text, function () {
        timer = setTimeout(function () {
          card.classList.add('is-swapping');          // короткое затемнение
          timer = setTimeout(function () {
            index = (index + 1) % HERO_CARDS.length;
            show(index);
          }, 320);
        }, 2600);
      });
    }

    function sync() {
      var should = onScreen && !document.hidden;
      if (should && !running) { running = true; show(index); }
      else if (!should && running) { stop(); }
    }

    lockHeight();

    // Шрифты приезжают асинхронно и меняют высоту текста — перемеряем
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(lockHeight);
    }

    // Ширина колонки изменилась — прежняя высота больше не годится
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var wasRunning = running;
        stop();
        lockHeight();
        if (wasRunning) { running = true; show(index); }
      }, 200);
    });

    // Крутим только пока карточка в кадре и вкладка активна
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.4 }).observe(card);

    document.addEventListener('visibilitychange', sync);
  }

  /* ------------------------------------------------------------------
     Запуск
     ------------------------------------------------------------------ */

  document.documentElement.classList.add('motion-on');

  observeIn(document);
  setupHeroFeed();

})();
