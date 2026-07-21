/* ==========================================================================
   Лендинг: появление секций, состояние шапки, валидация и отправка формы
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Появление секций при скролле
     ------------------------------------------------------------------ */

  var revealables = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    revealables.forEach(function (el) { observer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     Шапка: подсвечиваем границу после прокрутки
     ------------------------------------------------------------------ */

  var topbar = document.querySelector('.topbar');

  if (topbar) {
    var syncTopbar = function () {
      topbar.classList.toggle('is-stuck', window.scrollY > 12);
    };
    syncTopbar();
    window.addEventListener('scroll', syncTopbar, { passive: true });
  }

  /* ------------------------------------------------------------------
     Переходы по секциям

     Прокручиваем сами и не даём браузеру записать хеш в адрес: иначе
     после клика по «Проверить салон» URL превращался в …/#form, и при
     следующем открытии этой ссылки страница сразу уезжала к форме.
     ------------------------------------------------------------------ */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;

      var target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ------------------------------------------------------------------
     Валидация
     ------------------------------------------------------------------ */

  // @nick, nick, t.me/nick, https://t.me/nick
  var TELEGRAM_RE = /^(?:(?:https?:\/\/)?t\.me\/)?@?[a-zA-Z0-9_]{3,32}$/;

  function setError(input, message) {
    var slot = document.querySelector('[data-err-for="' + input.id + '"]');
    if (slot) slot.textContent = message || '';
    input.classList.toggle('is-bad', Boolean(message));
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function validateSalon(input) {
    var value = input.value.trim();
    if (value.length < 2) {
      setError(input, 'Укажите название салона или ссылку на карточку');
      return false;
    }
    setError(input, '');
    return true;
  }

  function validateTelegram(input) {
    var value = input.value.trim();
    if (!value) {
      setError(input, 'Без Telegram нам некуда прислать разбор');
      return false;
    }
    if (!TELEGRAM_RE.test(value)) {
      setError(input, 'Похоже на опечатку. Формат: @nickname');
      return false;
    }
    setError(input, '');
    return true;
  }

  /* ------------------------------------------------------------------
     Отправка

     ЗАГЛУШКА: заявка пишется в консоль. Чтобы подключить реальный приём,
     замените тело submitLead() — например, на fetch к вашей serverless-
     функции, которая уже кладёт сообщение в Telegram:

       return fetch('/api/lead', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(lead)
       }).then(function (r) {
         if (!r.ok) throw new Error('Ошибка отправки');
       });

     Токен бота на фронтенде держать нельзя — он виден всем, кто откроет
     исходники страницы. Нужна прослойка на сервере.
     ------------------------------------------------------------------ */

  function submitLead(lead) {
    console.log('[Заявка]', lead);
    return Promise.resolve();
  }

  function showDone(form, doneId) {
    var done = document.getElementById(doneId);
    if (!done) return;
    done.hidden = false;
    // Убираем форму из-под фокуса, чтобы табом не проваливаться в скрытое
    form.querySelectorAll('input, button').forEach(function (el) {
      el.tabIndex = -1;
    });
    done.setAttribute('role', 'status');
  }

  function wireForm(formId, doneId, collect) {
    var form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var result = collect(form);
      if (!result) return;

      var button = form.querySelector('button[type="submit"]');
      var original = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Отправляем…';
      }

      submitLead(result)
        .then(function () { showDone(form, doneId); })
        .catch(function (error) {
          console.error(error);
          if (button) {
            button.disabled = false;
            button.textContent = original;
          }
          window.alert('Не удалось отправить заявку. Попробуйте ещё раз.');
        });
    });

    // Снимаем ошибку, как только человек начал исправлять
    form.querySelectorAll('.input').forEach(function (input) {
      input.addEventListener('input', function () {
        if (input.classList.contains('is-bad')) setError(input, '');
      });
    });
  }

  // Полная форма (Блок 6)
  wireForm('lead-form', 'form-done', function (form) {
    var salon = form.querySelector('#f-salon');
    var telegram = form.querySelector('#f-tg');

    var salonOk = validateSalon(salon);
    var telegramOk = validateTelegram(telegram);

    if (!salonOk || !telegramOk) {
      (salonOk ? telegram : salon).focus();
      return null;
    }

    return {
      salon: salon.value.trim(),
      telegram: telegram.value.trim(),
      crm: form.querySelector('input[name="crm"]:checked').value,
      points: form.querySelector('input[name="points"]:checked').value,
      source: 'landing:form',
      sentAt: new Date().toISOString()
    };
  });

  // Упрощённая форма (Блок 9)
  wireForm('lead-form-short', 'form-done-short', function (form) {
    var telegram = form.querySelector('#f-tg-short');

    if (!validateTelegram(telegram)) {
      telegram.focus();
      return null;
    }

    return {
      telegram: telegram.value.trim(),
      source: 'landing:final-cta',
      sentAt: new Date().toISOString()
    };
  });

})();
