(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('[data-header]');
  var flow = document.getElementById('audit-flow');
  var flowDialog = flow ? flow.querySelector('.audit-flow-dialog') : null;
  var flowSteps = flow ? Array.prototype.slice.call(flow.querySelectorAll('[data-flow-step]')) : [];
  var flowProgress = flow ? Array.prototype.slice.call(flow.querySelectorAll('.flow-progress i')) : [];
  var currentStep = 1;
  var lastFocused = null;
  var scanTimers = [];

  var TELEGRAM_RE = /^(?:(?:https?:\/\/)?t\.me\/)?@?[a-zA-Z0-9_]{3,32}$/;

  function isValidPhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  function setHeaderState() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 12);
  }

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  /* Появление секций. Без JS контент остаётся доступен при reduced motion. */
  var revealItems = document.querySelectorAll('.reveal-item');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* Переключение демонстрации для администратора и собственника. */
  var productTabs = document.querySelectorAll('[data-product-tab]');
  productTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-product-tab');

      productTabs.forEach(function (item) {
        var active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });

      document.querySelectorAll('[data-product-copy]').forEach(function (copy) {
        var active = copy.getAttribute('data-product-copy') === name;
        copy.hidden = !active;
        copy.classList.toggle('is-active', active);
      });

      document.querySelectorAll('[data-product-panel]').forEach(function (panel) {
        var active = panel.getAttribute('data-product-panel') === name;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    });
  });

  function setFieldError(input, message) {
    var slot = document.querySelector('[data-error-for="' + input.id + '"]');
    if (slot) slot.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateSalon(input) {
    var value = input.value.trim();
    if (value.length < 2) {
      setFieldError(input, 'Введите название салона');
      input.focus();
      return false;
    }
    setFieldError(input, '');
    return true;
  }

  function normalizeSalonName(value) {
    var clean = value.trim();
    if (!clean) return 'Салон «Ирис»';
    if (/салон|студия|клиника/i.test(clean)) return clean;
    return 'Салон «' + clean.replace(/[«»"]/g, '') + '»';
  }

  function updateSalonName(name) {
    document.querySelectorAll('[data-flow-salon], [data-result-salon]').forEach(function (slot) {
      slot.textContent = name;
    });

    var contactSalon = document.getElementById('flow-contact-salon');
    if (contactSalon) contactSalon.value = name;
  }

  function clearScanTimers() {
    scanTimers.forEach(function (timer) { window.clearTimeout(timer); });
    scanTimers = [];
  }

  function animateScan() {
    clearScanTimers();
    var items = flow ? flow.querySelectorAll('.scan-list li') : [];
    if (items.length < 4) return;

    items.forEach(function (item, index) {
      item.classList.toggle('is-done', index < 2);
      item.classList.toggle('is-active', index === 2);
      var icon = item.querySelector('i');
      if (icon) icon.textContent = index < 2 ? '✓' : '';
    });

    scanTimers.push(window.setTimeout(function () {
      items[2].classList.remove('is-active');
      items[2].classList.add('is-done');
      items[2].querySelector('i').textContent = '✓';
      items[3].classList.add('is-active');
    }, 900));

    scanTimers.push(window.setTimeout(function () {
      items[3].classList.remove('is-active');
      items[3].classList.add('is-done');
      items[3].querySelector('i').textContent = '✓';
    }, 1800));
  }

  function focusFirstInStep(step) {
    window.setTimeout(function () {
      var activeStep = flow && flow.querySelector('[data-flow-step="' + step + '"]');
      if (!activeStep) return;
      var target = activeStep.querySelector('input:not([type="radio"]), button:not([data-flow-close])');
      if (target) target.focus({ preventScroll: true });
    }, 70);
  }

  function showStep(step) {
    currentStep = Math.max(1, Math.min(step, flowSteps.length));

    flowSteps.forEach(function (item) {
      var active = Number(item.getAttribute('data-flow-step')) === currentStep;
      item.hidden = !active;
      item.classList.toggle('is-active', active);
    });

    flowProgress.forEach(function (bar, index) {
      bar.classList.toggle('is-filled', index < currentStep);
    });

    if (flowDialog) flowDialog.scrollTop = 0;
    if (currentStep === 3) animateScan();
    focusFirstInStep(currentStep);
  }

  function openFlow(salonName) {
    if (!flow) return;
    lastFocused = document.activeElement;
    updateSalonName(normalizeSalonName(salonName));
    showStep(1);
    flow.classList.add('is-open');
    flow.setAttribute('aria-hidden', 'false');
    body.classList.add('flow-open');
  }

  function closeFlow() {
    if (!flow) return;
    clearScanTimers();
    flow.classList.remove('is-open');
    flow.setAttribute('aria-hidden', 'true');
    body.classList.remove('flow-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function wireAuditForm(formId, inputId) {
    var form = document.getElementById(formId);
    var input = document.getElementById(inputId);
    if (!form || !input) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validateSalon(input)) return;
      openFlow(input.value);
    });

    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') setFieldError(input, '');
    });
  }

  wireAuditForm('hero-audit-form', 'salon-search');
  wireAuditForm('bottom-audit-form', 'bottom-salon');

  if (flow) {
    flow.addEventListener('click', function (event) {
      var closeTarget = event.target.closest('[data-flow-close]');
      if (closeTarget) {
        closeFlow();
        return;
      }

      var nextTarget = event.target.closest('[data-flow-next]');
      if (nextTarget) showStep(currentStep + 1);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (!flow || !flow.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeFlow();
      return;
    }

    if (event.key !== 'Tab' || !flowDialog) return;
    var focusable = Array.prototype.slice.call(flowDialog.querySelectorAll('button:not([disabled]):not([hidden]), input:not([disabled]):not([type="hidden"]), a[href]'))
      .filter(function (item) { return item.offsetParent !== null; });
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function selectedValue(name, fallback) {
    var selected = document.querySelector('input[name="' + name + '"]:checked');
    return selected ? selected.value : fallback;
  }

  function setRecommendedTariff() {
    var crm = selectedValue('flow-crm', 'yclients');
    var branches = selectedValue('flow-branches', '1');
    var recommendedPlan = 'crm';

    if (branches === '5+') {
      recommendedPlan = 'network';
    } else if (crm === 'none') {
      recommendedPlan = 'geo';
    }

    document.querySelectorAll('[data-result-plan]').forEach(function (card) {
      var recommended = card.getAttribute('data-result-plan') === recommendedPlan;
      var badge = card.querySelector('.result-match');
      card.classList.toggle('is-recommended', recommended);
      card.classList.remove('is-selected');
      if (badge) badge.hidden = !recommended;
    });

    document.querySelectorAll('[data-flow-final-button]').forEach(function (button) {
      button.textContent = 'Выбрать';
    });
    var note = document.getElementById('prototype-note');
    if (note) note.hidden = true;
  }

  var contactForm = document.getElementById('flow-contact-form');
  if (contactForm) {
    var messengerInput = document.getElementById('flow-messenger');
    var contactInput = document.getElementById('flow-contact');
    var contactLabel = document.getElementById('flow-contact-label');
    var deliveryNote = document.getElementById('flow-delivery-note');
    var messengerOptions = contactForm.querySelectorAll('[data-messenger-option]');

    function selectMessenger(name) {
      messengerInput.value = name;
      messengerOptions.forEach(function (option) {
        var active = option.getAttribute('data-messenger-option') === name;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-pressed', String(active));
      });

      contactInput.value = '';
      setFieldError(contactInput, '');

      if (name === 'max') {
        contactLabel.textContent = 'Номер телефона в MAX';
        contactInput.placeholder = '+7 999 123-45-67';
        contactInput.setAttribute('autocomplete', 'tel');
        contactInput.setAttribute('inputmode', 'tel');
        deliveryNote.textContent = 'Полный отчёт и описания показателей придут в MAX после подключения бота.';
      } else {
        contactLabel.textContent = 'Ваш Telegram';
        contactInput.placeholder = '@nickname';
        contactInput.setAttribute('autocomplete', 'username');
        contactInput.setAttribute('inputmode', 'text');
        deliveryNote.textContent = 'Полный отчёт и описания показателей придут в Telegram после подключения бота.';
      }
    }

    messengerOptions.forEach(function (option) {
      option.addEventListener('click', function () {
        selectMessenger(option.getAttribute('data-messenger-option'));
        contactInput.focus();
      });
    });

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var salon = document.getElementById('flow-contact-salon');
      var messenger = messengerInput.value;
      var contactValue = contactInput.value.trim();

      if (messenger === 'telegram' && !TELEGRAM_RE.test(contactValue)) {
        setFieldError(contactInput, 'Проверьте Telegram. Например: @nickname');
        contactInput.focus();
        return;
      }

      if (messenger === 'max' && !isValidPhone(contactValue)) {
        setFieldError(contactInput, 'Введите номер, на который зарегистрирован MAX');
        contactInput.focus();
        return;
      }

      setFieldError(contactInput, '');
      updateSalonName(normalizeSalonName(salon.value));
      setRecommendedTariff();

      /*
       * Точка интеграции для программиста:
       * здесь contact + messenger + CRM + количество филиалов отправляются
       * в API, которое запускает реальный аудит и выбранного бота.
       */
      showStep(4);
    });

    contactInput.addEventListener('input', function () {
      if (contactInput.getAttribute('aria-invalid') === 'true') setFieldError(contactInput, '');
    });
  }

  var finalButtons = document.querySelectorAll('[data-flow-final-button]');
  var prototypeNote = document.getElementById('prototype-note');
  if (finalButtons.length && prototypeNote) {
    finalButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelectorAll('[data-result-plan]').forEach(function (card) {
          card.classList.toggle('is-selected', card === button.closest('[data-result-plan]'));
        });
        finalButtons.forEach(function (item) {
          item.textContent = item === button ? 'Выбрано' : 'Выбрать';
        });
        prototypeNote.hidden = false;
      });
    });
  }
})();
