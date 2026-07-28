(function () {
  'use strict';

  var header = document.querySelector('[data-header]');
  var flow = document.getElementById('audit-flow');
  var selectedSalon = 'Салон «Ирис»';
  var selectedAddress = 'Москва, ул. Остоженка, 25';
  var scanTimers = [];

  function updateHeader() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 10);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  var revealItems = document.querySelectorAll('.reveal-item');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  function setError(input, message) {
    var slot = document.querySelector('[data-error-for="' + input.id + '"]');
    if (slot) slot.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function wireFinder(formId, inputId, suggestionId) {
    var form = document.getElementById(formId);
    var input = document.getElementById(inputId);
    var suggestions = document.getElementById(suggestionId);
    if (!form || !input || !suggestions) return;

    function showSuggestions() {
      suggestions.hidden = input.value.trim().length < 2;
      setError(input, '');
    }

    input.addEventListener('input', showSuggestions);
    input.addEventListener('focus', showSuggestions);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (input.value.trim().length < 2) {
        setError(input, 'Укажите город, улицу и номер дома');
        input.focus();
        return;
      }
      suggestions.hidden = false;
      suggestions.querySelector('button').focus();
    });

    suggestions.querySelectorAll('[data-salon]').forEach(function (option) {
      option.addEventListener('click', function () {
        selectedSalon = option.getAttribute('data-salon');
        selectedAddress = option.getAttribute('data-address');
        input.value = selectedAddress;
        suggestions.hidden = true;
        openFlow();
      });
    });
  }

  wireFinder('hero-audit-form', 'salon-address', 'hero-suggestions');
  wireFinder('bottom-audit-form', 'bottom-address', 'bottom-suggestions');

  function clearScanTimers() {
    scanTimers.forEach(function (timer) { window.clearTimeout(timer); });
    scanTimers = [];
  }

  function startScan() {
    clearScanTimers();
    var steps = Array.prototype.slice.call(document.querySelectorAll('.scan-steps li'));
    var teaser = document.querySelector('[data-audit-teaser]');
    var submit = document.querySelector('[data-audit-submit]');
    var scanState = document.querySelector('[data-scan-state]');
    if (teaser) teaser.hidden = true;
    if (submit) submit.disabled = true;
    if (scanState) scanState.textContent = 'Результаты появятся через несколько секунд.';
    steps.forEach(function (step, index) {
      step.classList.toggle('is-done', index === 0);
      step.classList.toggle('is-active', index === 1);
      var icon = step.querySelector('i');
      if (icon) icon.textContent = index === 0 ? '✓' : '';
    });
    [1, 2, 3].forEach(function (stepIndex, order) {
      scanTimers.push(window.setTimeout(function () {
        steps.forEach(function (step, index) {
          step.classList.toggle('is-done', index <= stepIndex);
          step.classList.toggle('is-active', index === stepIndex + 1);
          var icon = step.querySelector('i');
          if (icon) icon.textContent = index <= stepIndex ? '✓' : '';
        });
        if (stepIndex === 3) {
          if (teaser) teaser.hidden = false;
          if (submit) submit.disabled = false;
          if (scanState) scanState.textContent = 'Готово: карточки проверены.';
        }
      }, 650 + order * 650));
    });
  }

  function openFlow() {
    if (!flow) return;
    document.querySelectorAll('[data-selected-salon]').forEach(function (node) { node.textContent = selectedSalon; });
    document.querySelectorAll('[data-selected-address]').forEach(function (node) { node.textContent = selectedAddress; });
    var logo = document.querySelector('[data-selected-logo]');
    if (logo) logo.textContent = selectedSalon.replace(/[^А-ЯA-Z]/g, '').slice(0, 1) || 'М';
    showFlowStage('collect');
    flow.classList.add('is-open');
    flow.setAttribute('aria-hidden', 'false');
    document.body.classList.add('flow-open');
    startScan();
  }

  function closeFlow() {
    if (!flow) return;
    clearScanTimers();
    flow.classList.remove('is-open');
    flow.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('flow-open');
  }

  function showFlowStage(name) {
    document.querySelectorAll('[data-flow-stage]').forEach(function (stage) {
      stage.hidden = stage.getAttribute('data-flow-stage') !== name;
      stage.classList.toggle('is-active', stage.getAttribute('data-flow-stage') === name);
    });
    document.querySelectorAll('.flow-progress i').forEach(function (bar, index) {
      bar.classList.toggle('is-active', name === 'ready' || index === 0);
    });
    if (flow) flow.querySelector('.audit-flow-panel').scrollTop = 0;
  }

  document.querySelectorAll('[data-flow-close]').forEach(function (button) {
    button.addEventListener('click', closeFlow);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && flow && flow.classList.contains('is-open')) closeFlow();
  });

  var channelInput = document.getElementById('flow-channel');
  var contactInput = document.getElementById('flow-contact');
  var contactLabel = document.getElementById('flow-contact-label');
  var callTime = document.getElementById('call-time');
  var channelButtons = document.querySelectorAll('[data-channel]');

  function selectChannel(channel) {
    if (!channelInput || !contactInput || !contactLabel) return;
    channelInput.value = channel;
    channelButtons.forEach(function (button) {
      var active = button.getAttribute('data-channel') === channel;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    contactInput.value = '';
    contactInput.setAttribute('autocomplete', channel === 'telegram' ? 'username' : 'tel');
    contactInput.setAttribute('inputmode', channel === 'telegram' ? 'text' : 'tel');
    if (channel === 'telegram') {
      contactLabel.textContent = 'Telegram';
      contactInput.placeholder = '@nickname';
    } else if (channel === 'max') {
      contactLabel.textContent = 'Номер телефона в MAX';
      contactInput.placeholder = '+7 999 123-45-67';
    } else {
      contactLabel.textContent = 'Номер телефона';
      contactInput.placeholder = '+7 999 123-45-67';
    }
    if (callTime) callTime.hidden = channel !== 'phone';
  }

  channelButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      selectChannel(button.getAttribute('data-channel'));
      contactInput.focus();
    });
  });

  function validPhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  var contactForm = document.getElementById('flow-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameInput = document.getElementById('flow-name');
      var consent = document.getElementById('flow-consent');
      var error = document.getElementById('flow-error');
      var channel = channelInput.value;
      var contact = contactInput.value.trim();
      error.textContent = '';

      if (nameInput.value.trim().length < 2) {
        error.textContent = 'Укажите имя для отчёта';
        nameInput.focus();
        return;
      }
      if (channel === 'telegram' && !/^@?[a-zA-Z0-9_]{3,32}$/.test(contact)) {
        error.textContent = 'Укажите имя в Telegram, например @nickname';
        contactInput.focus();
        return;
      }
      if (channel !== 'telegram' && !validPhone(contact)) {
        error.textContent = 'Проверьте номер телефона и попробуйте снова';
        contactInput.focus();
        return;
      }
      if (!consent.checked) {
        error.textContent = 'Подтвердите согласие на обработку данных';
        consent.focus();
        return;
      }

      var dashboardLink = document.getElementById('open-dashboard');
      if (dashboardLink) {
        dashboardLink.href = 'demo.html?guest=1&salon=' + encodeURIComponent(selectedSalon) + '&address=' + encodeURIComponent(selectedAddress);
      }
      showFlowStage('ready');
    });
  }

  var tourTabs = document.querySelectorAll('[data-tour-tab]');
  tourTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-tour-tab');
      tourTabs.forEach(function (button) {
        button.classList.toggle('is-active', button === tab);
      });
      document.querySelectorAll('[data-tour-panel]').forEach(function (panel) {
        var active = panel.getAttribute('data-tour-panel') === name;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    });
  });

  document.querySelectorAll('[data-demo-link]').forEach(function (button) {
    button.addEventListener('click', function () {
      window.location.href = button.getAttribute('data-demo-link');
    });
  });

  function makeExclusiveAccordion(selector) {
    var items = Array.prototype.slice.call(document.querySelectorAll(selector));
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  makeExclusiveAccordion('.today-tasks details');
  makeExclusiveAccordion('.capability-accordion details');

})();
