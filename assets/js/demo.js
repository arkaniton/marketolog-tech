(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var guestMode = params.get('guest') === '1';
  var demoFull = !guestMode;
  var salonName = params.get('salon') || 'Салон «Ирис»';
  var salonAddress = params.get('address') || 'Москва · Хамовники';
  var modal = document.getElementById('product-modal');
  var backdrop = document.querySelector('.modal-backdrop');
  var drawer = document.getElementById('task-drawer');
  var toastTimer;
  var lastModalTrigger;
  var lastDrawerTrigger;
  var demoStorageKey = 'marketologTechDemoStateV2';

  function loadDemoState() {
    if (!demoFull) return { completedTasks: [], manualTasks: [], notificationsRead: false };
    try {
      var saved = JSON.parse(window.localStorage.getItem(demoStorageKey));
      if (!saved || typeof saved !== 'object') return { completedTasks: [], manualTasks: [], notificationsRead: false };
      return {
        completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks.filter(function (item) { return typeof item === 'string'; }) : [],
        manualTasks: Array.isArray(saved.manualTasks) ? saved.manualTasks.filter(function (item) {
          return item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.due === 'string' && typeof item.owner === 'string';
        }) : [],
        notificationsRead: Boolean(saved.notificationsRead)
      };
    } catch (error) {
      return { completedTasks: [], manualTasks: [], notificationsRead: false };
    }
  }

  var demoState = loadDemoState();

  function saveDemoState() {
    if (!demoFull) return;
    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify(demoState));
    } catch (error) {
      /* The demo still works if browser storage is unavailable. */
    }
  }

  function resetDemoState() {
    try {
      window.localStorage.removeItem(demoStorageKey);
    } catch (error) {
      /* Reloading still restores the in-memory defaults. */
    }
    window.location.reload();
  }

  document.body.classList.add(guestMode ? 'guest-mode' : 'demo-full');
  var status = document.querySelector('[data-demo-status]');
  var demoCopy = document.querySelector('[data-demo-copy]');
  var sourceCount = document.querySelector('[data-source-count]');
  var evaSourceCount = document.querySelector('[data-eva-source-count]');
  var integrationCount = document.querySelector('[data-integration-count]');
  if (guestMode) {
    if (status) status.textContent = 'Ваш геоотчёт';
    if (demoCopy) demoCopy.textContent = '· открытые данные салона';
    if (sourceCount) sourceCount.textContent = '2 источника подключено';
    if (evaSourceCount) evaSourceCount.textContent = '2 источника';
    if (integrationCount) integrationCount.textContent = '2';
    var evaTitle = document.querySelector('[data-eva-title]');
    var evaSummary = document.querySelector('[data-eva-summary]');
    var evaSource = document.querySelector('[data-eva-source]');
    if (evaTitle) evaTitle.textContent = 'Почему отзывы в приоритете?';
    if (evaSummary) evaSummary.textContent = 'В геокарточках есть отзывы без ответа, а фотографии давно не обновлялись. Начните с ответа клиенту — он уже подготовлен для проверки.';
    if (evaSource) evaSource.textContent = 'Яндекс + 2ГИС';
    var guestCrmTask = document.querySelector('.agenda-task[data-task-focus="thursday"]');
    if (guestCrmTask) {
      guestCrmTask.setAttribute('data-task-route', 'integrations');
      guestCrmTask.removeAttribute('data-task-focus');
      guestCrmTask.querySelector('span > i').textContent = 'CRM · источник не подключён';
      guestCrmTask.querySelector('span > strong').textContent = 'Подключить данные о загрузке';
      guestCrmTask.querySelector('span > small').textContent = 'Появится после подключения YClients';
      guestCrmTask.querySelector('b').textContent = 'Подключить →';
    }
  } else {
    if (integrationCount) integrationCount.textContent = '4';
    document.querySelectorAll('.source-health button, .source-dot--yc, .source-dot--metric').forEach(function (node) {
      node.classList.add('is-live');
    });
    document.querySelectorAll('.integration-card').forEach(function (card) {
      var connectButton = card.querySelector('[data-connect="yclients"], [data-connect="metrica"]');
      if (!connectButton) return;
      card.classList.add('is-connected');
      var state = card.querySelector(':scope > b');
      if (state) state.innerHTML = '<i></i> Демо-подключение';
    });
    document.querySelectorAll('.source-locked[data-requires-source] > small').forEach(function (node) {
      node.textContent = 'Пример данных · обновлено в 07:19';
    });
  }

  document.querySelectorAll('[data-salon-name], [data-topbar-salon]').forEach(function (node) { node.textContent = salonName; });
  document.querySelectorAll('[data-salon-address]').forEach(function (node) { node.textContent = salonAddress; });

  var titles = {
    home: 'Сегодня', calendar: 'План', tasks: 'Задачи', clients: 'Клиенты',
    finance: 'Финансы', geo: 'Карты и отзывы', site: 'Сайт и конверсия', signals: 'Рынок',
    strategy: 'Стратегия', content: 'Контент-фабрика', growth: 'Аналитика',
    reports: 'Отчёт владельцу', integrations: 'Источники'
  };
  var notificationButton = document.querySelector('[data-notifications]');
  var notificationPopover = document.querySelector('[data-notification-popover]');
  var notificationBadge = document.querySelector('[data-notification-badge]');
  var notificationTitle = document.querySelector('[data-notification-title]');

  function applyNotificationState() {
    if (!notificationButton || !notificationPopover) return;
    notificationButton.classList.toggle('is-read', demoState.notificationsRead);
    notificationPopover.classList.toggle('is-read', demoState.notificationsRead);
    notificationButton.setAttribute('aria-label', demoState.notificationsRead ? 'Уведомления: новых нет' : 'Уведомления: 2 новых');
    if (notificationBadge) notificationBadge.hidden = demoState.notificationsRead;
    if (notificationTitle) notificationTitle.textContent = demoState.notificationsRead ? 'Просмотренные уведомления' : 'Что изменилось';
  }

  function markNotificationsRead() {
    if (demoState.notificationsRead) return;
    demoState.notificationsRead = true;
    saveDemoState();
    applyNotificationState();
  }

  function closeNotifications() {
    if (!notificationPopover || !notificationButton) return;
    notificationPopover.hidden = true;
    notificationButton.setAttribute('aria-expanded', 'false');
  }

  function showScreen(name) {
    if (guestMode && ['clients', 'finance', 'site', 'strategy', 'content', 'growth', 'reports'].indexOf(name) > -1) {
      openModal('connect', (name === 'site' || name === 'growth') ? 'metrica' : 'yclients');
      return;
    }
    document.querySelectorAll('[data-screen-panel]').forEach(function (panel) {
      var active = panel.getAttribute('data-screen-panel') === name;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    document.querySelectorAll('[data-screen]').forEach(function (button) {
      var active = button.getAttribute('data-screen') === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    var sectionName = document.querySelector('[data-section-name]');
    if (sectionName) sectionName.textContent = titles[name] || 'Рабочее пространство';
    closeNotifications();
    document.body.classList.remove('menu-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-screen]').forEach(function (button) {
    button.addEventListener('click', function () { showScreen(button.getAttribute('data-screen')); });
  });
  document.querySelectorAll('[data-go]').forEach(function (button) {
    button.addEventListener('click', function () { showScreen(button.getAttribute('data-go')); });
  });

  var mobileMenu = document.querySelector('[data-mobile-menu]');
  if (mobileMenu) mobileMenu.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
  if (notificationButton && notificationPopover) {
    notificationButton.addEventListener('click', function () {
      var opening = notificationPopover.hidden;
      notificationPopover.hidden = !opening;
      notificationButton.setAttribute('aria-expanded', String(opening));
      if (opening) markNotificationsRead();
    });
  }
  document.querySelectorAll('[data-close-notifications]').forEach(function (button) {
    button.addEventListener('click', closeNotifications);
  });

  document.querySelectorAll('[data-scope]').forEach(function (button) {
    button.addEventListener('click', function () {
      var network = button.getAttribute('data-scope') === 'network';
      document.querySelectorAll('[data-scope]').forEach(function (item) { item.classList.toggle('is-active', item === button); });
      document.querySelectorAll('[data-single]').forEach(function (node) {
        node.textContent = network ? node.getAttribute('data-network') : node.getAttribute('data-single');
      });
      document.querySelector('[data-salon-name]').textContent = network ? 'Сеть «Ирис»' : salonName;
      document.querySelector('[data-topbar-salon]').textContent = network ? '3 салона' : salonName;
      document.querySelector('[data-salon-address]').textContent = network ? 'Москва · все филиалы' : salonAddress;
      document.querySelectorAll('[data-network-only]').forEach(function (node) { node.hidden = !network; });
    });
  });

  function openModal(view, source) {
    if (!modal || !backdrop) return;
    lastModalTrigger = document.activeElement;
    modal.querySelectorAll('[data-modal-view]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-modal-view') !== view;
    });

    if (view === 'connect') {
      var data = {
        yclients: { mark: 'Y', title: 'Подключить YClients', copy: 'После OAuth-входа сервис получит записи и рассчитает возвраты, риски ухода и влияние на выручку.', features: ['Клиентские сегменты', 'Загрузка и пустые окна', 'Возвращённая выручка'] },
        metrica: { mark: 'М', title: 'Подключить Яндекс Метрику', copy: 'Сервис свяжет трафик сайта с обращениями, а Ева объяснит, где посетители не доходят до записи.', features: ['Источники трафика', 'Конверсии страниц', 'Эффективность рекламы'] },
        crm: { mark: '+', title: 'Подключить другую CRM', copy: 'Мы посмотрим на ваш процесс и предложим индивидуальную схему передачи данных.', features: ['Аудит структуры данных', 'Схема интеграции', 'Поддержка подключения'] }
      };
      var item = data[source] || data.yclients;
      document.getElementById('modal-source-mark').textContent = item.mark;
      document.getElementById('modal-title').textContent = item.title;
      document.getElementById('modal-copy').textContent = item.copy;
      document.getElementById('modal-features').innerHTML = item.features.map(function (feature) { return '<li>' + feature + '</li>'; }).join('');
    }

    var modalHeading = modal.querySelector('[data-modal-view="' + view + '"] h2');
    if (modalHeading) modal.setAttribute('aria-label', modalHeading.textContent);
    backdrop.hidden = false;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    var activePanel = modal.querySelector('[data-modal-view="' + view + '"]');
    var firstControl = activePanel && activePanel.querySelector('input, select, button');
    if (firstControl) firstControl.focus();
  }

  function closeModal() {
    if (!modal || !backdrop) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') lastModalTrigger.focus();
  }

  document.querySelectorAll('[data-connect]').forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      if (demoFull) {
        showToast('Источник подключён', 'В демо-салоне уже доступны примерные данные этого источника');
        return;
      }
      openModal('connect', button.getAttribute('data-connect'));
    });
  });
  document.querySelectorAll('[data-open-pricing]').forEach(function (button) {
    button.addEventListener('click', function () { openModal('pricing'); });
  });
  document.querySelectorAll('[data-open-account]').forEach(function (button) {
    button.addEventListener('click', function () { openModal('account'); });
  });
  document.querySelectorAll('[data-report-preview]').forEach(function (button) {
    button.addEventListener('click', function () { openModal('report'); });
  });
  document.querySelectorAll('[data-add-task]').forEach(function (button) {
    button.addEventListener('click', function () { openModal('task'); });
  });
  document.querySelectorAll('[data-reset-demo]').forEach(function (button) {
    button.addEventListener('click', function () { openModal('reset'); });
  });
  document.querySelectorAll('[data-confirm-reset]').forEach(function (button) {
    button.addEventListener('click', resetDemoState);
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (button) { button.addEventListener('click', closeModal); });

  var calendarWeeks = {
    '-1': [
      { day: 'Пн', date: '14', note: 'выполнено' }, { day: 'Вт', date: '15', note: 'выполнено' },
      { day: 'Ср', date: '16', note: '2 задачи' }, { day: 'Чт', date: '17', note: '1 задача' },
      { day: 'Пт', date: '18', note: 'выполнено' }, { day: 'Сб', date: '19', note: 'свободно' },
      { day: 'Вс', date: '20', note: 'отчёт' }
    ],
    '0': [
      { day: 'Пн', date: '21', note: 'выполнено', done: true }, { day: 'Вт', date: '22', note: 'выполнено', done: true },
      { day: 'Ср', date: '23', note: '3 задачи', today: true }, { day: 'Чт', date: '24', note: '1 задача' },
      { day: 'Пт', date: '25', note: '2 задачи' }, { day: 'Сб', date: '26', note: 'свободно' },
      { day: 'Вс', date: '27', note: 'отчёт' }
    ],
    '1': [
      { day: 'Пн', date: '28', note: '2 задачи' }, { day: 'Вт', date: '29', note: '1 задача' },
      { day: 'Ср', date: '30', note: 'свободно' }, { day: 'Чт', date: '31', note: '2 задачи' },
      { day: 'Пт', date: '1', note: 'отчёт' }, { day: 'Сб', date: '2', note: 'свободно' },
      { day: 'Вс', date: '3', note: 'свободно' }
    ]
  };
  var agendaData = {
    '0-21': { date: 'Понедельник, 21 июля', tasks: [] },
    '0-22': { date: 'Вторник, 22 июля', tasks: [] },
    '0-23': {
      date: 'Сегодня, 23 июля',
      tasks: [
        { time: '10:00', meta: 'Отзывы · ответ готов', title: 'Проверить 2 ответа клиентам', copy: 'Первый отзыв ждёт ответа 19 часов', route: 'geo', focus: 'review', kind: 'review', urgent: true },
        { time: '14:00', meta: guestMode ? 'CRM · источник не подключён' : 'Загрузка · решение владельца', title: guestMode ? 'Подключить данные о загрузке' : 'Согласовать «Тихий четверг»', copy: guestMode ? 'Появится после подключения YClients' : 'Сценарий и расчёт готовы', route: guestMode ? 'integrations' : 'clients', focus: guestMode ? '' : 'thursday', kind: 'thursday' },
        { time: '16:00', meta: 'Карточка · материалы выбраны', title: 'Добавить 6 свежих фотографий', copy: 'Не обновлялись 48 дней', route: 'geo', focus: 'photos', kind: 'photos' }
      ]
    },
    '0-24': { date: 'Четверг, 24 июля', tasks: [{ time: '14:00', meta: 'Загрузка · запуск', title: 'Проверить результаты «Тихого четверга»', copy: 'Сравнить записи и выручку', route: 'clients', focus: 'thursday', kind: 'thursday' }] },
    '0-25': { date: 'Пятница, 25 июля', tasks: [{ time: '11:00', meta: 'Клиенты · возврат', title: 'Проверить 24 клиента для возврата', copy: 'Список подготовлен по ритму визитов', route: 'clients', focus: 'thursday' }, { time: '17:00', meta: 'Итоги · команда', title: 'Закрыть недельный план', copy: 'Осталось 3 действия', route: 'tasks' }] },
    '0-26': { date: 'Суббота, 26 июля', tasks: [] },
    '0-27': { date: 'Воскресенье, 27 июля', tasks: [{ time: '18:00', meta: 'Собственник · отчёт', title: 'Проверить недельную сводку', copy: 'Деньги, клиенты и план на неделю', route: 'reports' }] },
    '1-28': { date: 'Понедельник, 28 июля', tasks: [{ time: '10:00', meta: 'План недели', title: 'Подтвердить три приоритета', copy: 'Ева подготовила порядок действий', route: 'tasks' }, { time: '13:00', meta: 'Карты', title: 'Проверить новые отзывы', copy: 'Черновики ответов готовы', route: 'geo', focus: 'review', kind: 'review' }] },
    '1-29': { date: 'Вторник, 29 июля', tasks: [{ time: '12:00', meta: 'Клиенты', title: 'Оценить первую волну возврата', copy: 'Появятся записи и выручка', route: 'clients' }] }
  };
  var calendarOffset = 0;
  var selectedCalendarDate = '23';

  function isTaskComplete(name) {
    return demoState.completedTasks.indexOf(name) > -1;
  }

  function renderAgenda(offset, date) {
    var agenda = agendaData[String(offset) + '-' + date] || { date: 'Выбранный день', tasks: [] };
    var dateNode = document.querySelector('[data-agenda-date]');
    var countNode = document.querySelector('[data-agenda-count]');
    var list = document.querySelector('[data-agenda-list]');
    if (!dateNode || !countNode || !list) return;
    dateNode.textContent = agenda.date;
    var openTaskCount = agenda.tasks.filter(function (task) { return !task.kind || !isTaskComplete(task.kind); }).length;
    countNode.textContent = agenda.tasks.length
      ? (openTaskCount ? openTaskCount + ' ' + taskWord(openTaskCount) + ' в работе' : 'Все задачи выполнены')
      : 'Задач нет';
    list.innerHTML = '';
    if (!agenda.tasks.length) {
      list.innerHTML = '<div class="agenda-empty">Все задачи на этот день выполнены. Можно добавить свою.</div>';
      return;
    }
    agenda.tasks.forEach(function (task) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'agenda-task' + (task.urgent ? ' is-urgent' : '') + (task.kind && isTaskComplete(task.kind) ? ' is-complete' : '');
      button.setAttribute('data-task-route', task.route);
      if (task.focus) button.setAttribute('data-task-focus', task.focus);
      if (task.kind) button.setAttribute('data-task-kind', task.kind);
      button.innerHTML = '<time>' + task.time + '</time><span><i>' + task.meta + '</i><strong>' + task.title + '</strong><small>' + task.copy + '</small></span><b>' + (task.kind && isTaskComplete(task.kind) ? 'Готово ✓' : 'Открыть →') + '</b>';
      list.appendChild(button);
    });
  }

  function renderCalendarWeek(offset) {
    var week = calendarWeeks[String(offset)];
    var buttons = document.querySelectorAll('[data-calendar-day]');
    if (!week || !buttons.length) return;
    buttons.forEach(function (button, index) {
      var day = week[index];
      button.setAttribute('data-calendar-day', day.date);
      button.classList.toggle('is-today', day.today || index === 0);
      button.querySelector('span').textContent = day.day;
      button.querySelector('strong').textContent = day.date;
      button.querySelector('small').textContent = day.note;
      button.querySelector('i').classList.toggle('is-done', Boolean(day.done));
    });
    selectedCalendarDate = week.find(function (day) { return day.today; }) ? '23' : week[0].date;
    renderAgenda(offset, selectedCalendarDate);
  }

  document.querySelectorAll('[data-calendar-day]').forEach(function (button) {
    button.addEventListener('click', function () {
      selectedCalendarDate = button.getAttribute('data-calendar-day');
      document.querySelectorAll('[data-calendar-day]').forEach(function (item) { item.classList.toggle('is-today', item === button); });
      renderAgenda(calendarOffset, selectedCalendarDate);
    });
  });
  document.querySelectorAll('[data-calendar-shift]').forEach(function (button) {
    button.addEventListener('click', function () {
      calendarOffset = Math.max(-1, Math.min(1, calendarOffset + Number(button.getAttribute('data-calendar-shift'))));
      renderCalendarWeek(calendarOffset);
    });
  });

  document.addEventListener('click', function (event) {
    var taskButton = event.target.closest('[data-task-route]');
    if (!taskButton) return;
    var route = taskButton.getAttribute('data-task-route');
    var focus = taskButton.getAttribute('data-task-focus');
    showScreen(route);
    window.setTimeout(function () {
      if (!focus) return;
      var activeScreen = document.querySelector('[data-screen-panel="' + route + '"]');
      var target = activeScreen && activeScreen.querySelector('[data-focus-target="' + focus + '"]');
      if (!target) return;
      target.classList.remove('is-focused');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(function () { target.classList.add('is-focused'); }, 250);
    }, 280);
  });

  var taskData = {
    review: {
      kicker: 'Отзывы · 2ГИС',
      title: 'Проверить ответ Ольге',
      actionLabel: 'Открыть 2ГИС для публикации',
      doneTitle: 'Ответ проверен',
      doneText: 'В рабочей версии следующим шагом откроется карточка 2ГИС',
      body: '<div class="drawer-review"><strong>«Стрижка хорошая, но мастера ждала 25 минут…»</strong><small>Ольга В. · ★★★☆☆ · вчера</small></div><p>Ева учла причину задержки и стиль ответов салона. Публикация произойдёт только после вашей проверки.</p><div class="drawer-draft"><span>Черновик ответа</span><p>Ольга, спасибо, что написали. Нам жаль, что вам пришлось ждать — мы уже скорректировали интервалы между записями…</p></div>'
    },
    thursday: {
      kicker: 'Паттерн · загрузка',
      title: 'Заполнить пустой четверг',
      actionLabel: 'Согласовать сценарий',
      doneTitle: 'Сценарий согласован',
      doneText: 'Решение сохранено и попадёт в план команды',
      body: '<div class="drawer-metric"><span>Сейчас</span><strong>38% загрузки</strong><small>против среднего 76%</small></div><p>Провал повторяется третью неделю. Среди клиентов есть 24 человека, которым уже пора вернуться.</p><div class="drawer-calculation"><article><span>Сценарий</span><strong>Уход в подарок без снижения цены</strong></article><article><span>Ожидание</span><strong>5–7 дополнительных записей</strong></article><article><span>Эффект</span><strong>около 42 000 ₽ в месяц</strong></article></div><small class="drawer-explain">Расчёт основан на среднем чеке, свободных окнах и истории возврата клиентов. Запуск требует решения владельца.</small>'
    },
    photos: {
      kicker: 'Карточка · Яндекс',
      title: 'Добавить свежие фотографии',
      actionLabel: 'Открыть Яндекс Карты',
      doneTitle: 'Материалы проверены',
      doneText: 'В рабочей версии следующим шагом откроется карточка Яндекс',
      body: '<div class="drawer-metric"><span>Последнее обновление</span><strong>48 дней назад</strong><small>рекомендация — каждые 2–3 недели</small></div><p>Ева выбрала шесть подходящих материалов: интерьер, рабочий процесс и три свежие работы мастеров.</p><div class="photo-placeholders"><i></i><i></i><i></i><i></i><i></i><i></i></div><small class="drawer-explain">После проверки вы перейдёте в карточку Яндекс, чтобы опубликовать материалы.</small>'
    }
  };

  function openDrawer(name) {
    var item = taskData[name];
    if (!drawer || !item) return;
    lastDrawerTrigger = document.activeElement;
    document.getElementById('drawer-kicker').textContent = item.kicker;
    document.getElementById('drawer-title').textContent = item.title;
    document.getElementById('drawer-body').innerHTML = item.body;
    var action = drawer.querySelector('[data-complete-task]');
    if (action) {
      action.disabled = isTaskComplete(name);
      action.textContent = isTaskComplete(name) ? 'Уже выполнено' : item.actionLabel;
    }
    drawer.setAttribute('data-active-task', name);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    var drawerClose = drawer.querySelector('[data-close-drawer]');
    if (drawerClose) drawerClose.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    if (lastDrawerTrigger && typeof lastDrawerTrigger.focus === 'function') lastDrawerTrigger.focus();
  }

  document.querySelectorAll('[data-open-task]').forEach(function (button) {
    button.addEventListener('click', function () { openDrawer(button.getAttribute('data-open-task')); });
  });
  document.querySelectorAll('[data-close-drawer]').forEach(function (button) { button.addEventListener('click', closeDrawer); });

  function showToast(title, text) {
    var toast = document.querySelector('.toast');
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.querySelector('strong').textContent = title;
    toast.querySelector('small').textContent = text;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3200);
  }

  function taskWord(number) {
    if (number % 10 === 1 && number % 100 !== 11) return 'задача';
    if ([2, 3, 4].indexOf(number % 10) > -1 && (number % 100 < 12 || number % 100 > 14)) return 'задачи';
    return 'задач';
  }

  function updateWeeklyProgress() {
    var total = 21 + demoState.manualTasks.length;
    var counted = {};
    var completedExtra = demoState.completedTasks.reduce(function (sum, taskName) {
      if (counted[taskName] || !taskData[taskName]) return sum;
      counted[taskName] = true;
      return sum + 1;
    }, 0);
    var completed = Math.min(total, 18 + completedExtra);
    var remaining = Math.max(0, total - completed);
    var percent = Math.round((completed / total) * 100);

    document.querySelectorAll('[data-week-progress-bar], [data-report-progress-bar]').forEach(function (node) {
      node.style.width = percent + '%';
    });
    document.querySelectorAll('[data-week-progress-label]').forEach(function (node) {
      node.textContent = completed + ' из ' + total;
    });
    document.querySelectorAll('[data-report-progress], [data-report-result-percent]').forEach(function (node) {
      node.textContent = percent + '%';
    });
    document.querySelectorAll('[data-report-progress-copy]').forEach(function (node) {
      node.textContent = completed + ' из ' + total + ' задач выполнено';
    });
    var resultTitle = document.querySelector('[data-report-result-title]');
    var resultCopy = document.querySelector('[data-report-result-copy]');
    if (resultTitle) resultTitle.textContent = 'Выполнено ' + completed + ' из ' + total + ' действий';
    if (resultCopy) resultCopy.textContent = remaining ? 'Осталось ' + remaining + ' ' + taskWord(remaining) + ' в текущем плане' : 'Недельный план закрыт без переноса задач';

    var homeTitle = document.querySelector('[data-home-priority-title]');
    var homeCopy = document.querySelector('[data-home-priority-copy]');
    var homeCount = document.querySelector('[data-home-count]');
    if (homeCount) {
      homeCount.textContent = remaining;
      homeCount.hidden = remaining === 0;
    }
    if (homeTitle) {
      if (remaining === 0) homeTitle.textContent = 'План на сегодня выполнен';
      else homeTitle.textContent = 'Состояние салона';
    }
    if (homeCopy) {
      if (!completedExtra && !demoState.manualTasks.length) {
        homeCopy.textContent = 'YClients показывает результат, карты — видимость, Метрика — интерес к сайту. Ева связывает их в понятный план действий.';
      } else {
        homeCopy.textContent = remaining
          ? 'Изменения синхронизированы: прогресс виден в задачах, календаре и отчёте.'
          : 'Все действия подтверждены. Ева обновила недельный прогресс и отчёт собственника.';
      }
    }

    var nextStep = document.querySelector('[data-report-preview-next]');
    var nextStepCopy = document.querySelector('[data-report-preview-next-copy]');
    if (nextStep && nextStepCopy) {
      if (!isTaskComplete('thursday')) {
        nextStep.textContent = 'Согласовать сценарий';
        nextStepCopy.textContent = 'Решение требуется от владельца';
      } else if (!isTaskComplete('review')) {
        nextStep.textContent = 'Проверить ответ клиенту';
        nextStepCopy.textContent = 'Черновик уже подготовлен Евой';
      } else if (!isTaskComplete('photos')) {
        nextStep.textContent = 'Обновить фотографии';
        nextStepCopy.textContent = 'Шесть материалов выбраны';
      } else if (remaining) {
        nextStep.textContent = 'Закрыть ручные задачи';
        nextStepCopy.textContent = 'Осталось ' + remaining + ' ' + taskWord(remaining);
      } else {
        nextStep.textContent = 'План выполнен';
        nextStepCopy.textContent = 'Новых решений от владельца не требуется';
      }
    }
  }

  function updateTaskCounts() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.task-table-row[data-task-status]'));
    var counts = { all: rows.length, today: 0, review: 0, done: 0 };
    rows.forEach(function (row) {
      row.getAttribute('data-task-status').split(' ').forEach(function (statusName) {
        if (Object.prototype.hasOwnProperty.call(counts, statusName)) counts[statusName] += 1;
      });
    });
    Object.keys(counts).forEach(function (name) {
      var node = document.querySelector('[data-task-count="' + name + '"]');
      if (node) node.textContent = counts[name];
    });
    var navBadge = document.querySelector('[data-screen="tasks"] > b');
    if (navBadge) navBadge.textContent = Math.max(0, counts.all - counts.done);
    var summary = document.querySelector('[data-task-summary]');
    if (summary) summary.textContent = counts.all + ' ' + taskWord(counts.all) + ' · ' + counts.review + (counts.review === 1 ? ' требует' : ' требуют') + ' решения';
    updateWeeklyProgress();
  }

  function applyTaskFilter(filter) {
    document.querySelectorAll('[data-task-filter]').forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-task-filter') === filter);
    });
    document.querySelectorAll('[data-task-status]').forEach(function (row) {
      row.hidden = filter !== 'all' && row.getAttribute('data-task-status').split(' ').indexOf(filter) === -1;
    });
  }

  var dueLabels = {
    today: 'Сегодня · до 18:00',
    tomorrow: 'Завтра · без времени',
    week: 'На этой неделе'
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character];
    });
  }

  function registerManualTask(task) {
    taskData[task.id] = {
      kicker: 'Ручная задача · ' + task.owner,
      title: task.title,
      actionLabel: 'Отметить выполненной',
      doneTitle: 'Задача выполнена',
      doneText: 'Прогресс обновлён во всём демо',
      body: '<div class="drawer-metric"><span>Срок</span><strong>' + escapeHtml(dueLabels[task.due] || dueLabels.week) + '</strong><small>Ответственный · ' + escapeHtml(task.owner) + '</small></div><p>Эту задачу добавили вручную. Она учитывается в общем плане и недельном отчёте.</p>'
    };
  }

  function renderManualTask(task, animate) {
    if (document.querySelector('[data-task-key="' + task.id + '"]')) return;
    registerManualTask(task);
    var row = document.createElement('div');
    row.className = 'task-table-row' + (animate ? ' is-new' : '');
    row.setAttribute('data-task-key', task.id);
    row.setAttribute('data-task-status', task.due === 'today' ? 'today' : 'week');

    var titleCell = document.createElement('div');
    var titleNode = document.createElement('strong');
    var metaNode = document.createElement('small');
    titleNode.textContent = task.title;
    metaNode.textContent = (dueLabels[task.due] || dueLabels.week) + ' · ' + task.owner;
    titleCell.appendChild(titleNode);
    titleCell.appendChild(metaNode);

    var sourceNode = document.createElement('span');
    sourceNode.textContent = 'Вручную';
    var impactNode = document.createElement('b');
    impactNode.textContent = 'План команды';
    var statusNode = document.createElement('i');
    statusNode.className = 'status';
    statusNode.textContent = task.due === 'today' ? 'Сегодня' : 'Запланировано';
    var openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.textContent = '→';
    openButton.setAttribute('aria-label', 'Открыть задачу «' + task.title + '»');
    openButton.addEventListener('click', function () { openDrawer(task.id); });

    row.appendChild(titleCell);
    row.appendChild(sourceNode);
    row.appendChild(impactNode);
    row.appendChild(statusNode);
    row.appendChild(openButton);
    document.querySelector('.task-table').appendChild(row);
  }

  function markTaskComplete(name, persist) {
    var row = document.querySelector('[data-task-key="' + name + '"]');
    if (row) {
      row.classList.add('is-complete');
      row.setAttribute('data-task-status', 'done');
      var statusNode = row.querySelector('.status');
      if (statusNode) {
        statusNode.className = 'status is-done';
        statusNode.textContent = 'Выполнено';
      }
      var rowButton = row.querySelector('button');
      if (rowButton) {
        rowButton.disabled = true;
        rowButton.textContent = '✓';
        rowButton.setAttribute('aria-label', 'Выполнено');
      }
    }
    document.querySelectorAll('.agenda-task[data-task-focus="' + name + '"]').forEach(function (agendaTask) {
      agendaTask.classList.add('is-complete');
      var agendaAction = agendaTask.querySelector('b');
      if (agendaAction) agendaAction.textContent = 'Готово ✓';
    });
    document.querySelectorAll('.event[data-open-task="' + name + '"]').forEach(function (eventCard) {
      eventCard.classList.add('is-done');
      var eventState = eventCard.querySelector('i');
      if (eventState) eventState.textContent = 'Выполнено';
    });
    if (demoState.completedTasks.indexOf(name) === -1) demoState.completedTasks.push(name);
    if (persist !== false) saveDemoState();
    renderAgenda(calendarOffset, selectedCalendarDate);
    updateTaskCounts();
    var activeFilter = document.querySelector('[data-task-filter].is-active');
    applyTaskFilter(activeFilter ? activeFilter.getAttribute('data-task-filter') : 'all');
  }

  document.querySelectorAll('[data-complete-task]').forEach(function (button) {
    button.addEventListener('click', function () {
      var taskName = drawer.getAttribute('data-active-task');
      var item = taskData[taskName];
      markTaskComplete(taskName);
      closeDrawer();
      showToast(item ? item.doneTitle : 'Действие подтверждено', item ? item.doneText : 'Результат сохранён в прототипе');
    });
  });
  document.querySelectorAll('[data-prototype-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.getAttribute('data-prototype-action');
      closeModal();
      if (action === 'pilot') {
        showToast('Заявка на пилот', 'В рабочей версии здесь откроется короткая форма контакта');
      } else if (action === 'oauth') {
        showToast('Безопасный вход', 'В рабочей версии откроется окно авторизации выбранного сервиса');
      } else {
        showToast('Подключение источника', 'Следующий шаг — защищённая авторизация без передачи пароля МаркетологТЕХ');
      }
    });
  });
  document.querySelectorAll('[data-placeholder]').forEach(function (button) {
    button.addEventListener('click', function () { showToast('Как это работает', button.getAttribute('data-placeholder')); });
  });
  document.querySelectorAll('[data-account-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      closeModal();
      showToast('Демо-форма заполнена', 'Мы не сохраняем введённые данные в этой версии');
    });
  });

  document.querySelectorAll('[data-task-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var titleInput = form.elements.title;
      var dueInput = form.elements.due;
      var ownerInput = form.elements.owner;
      var title = titleInput.value.trim();
      var owner = ownerInput.value;
      if (!title) {
        titleInput.focus();
        return;
      }

      var task = {
        id: 'manual-' + Date.now(),
        title: title,
        due: dueInput.value,
        owner: owner
      };
      demoState.manualTasks.push(task);
      saveDemoState();
      renderManualTask(task, true);

      form.reset();
      closeModal();
      showScreen('tasks');
      applyTaskFilter('all');
      updateTaskCounts();
      showToast('Задача добавлена', 'Она сохранена в общем плане и недельном отчёте');
    });
  });

  function getEvaAnswer(question) {
    var normalized = question.toLowerCase();
    if (guestMode && /(выруч|клиент|загруз|запис|деньг|crm|yclients)/.test(normalized)) {
      return 'Для этого вопроса нужны записи из CRM. Сейчас я вижу только Яндекс Карты и 2ГИС — подключите YClients или откройте демо-салон с примерными данными.';
    }
    if (/(отзыв|ответ|ольг|репутац)/.test(normalized)) {
      return 'Сначала проверьте ответ Ольге: отзыв уже влияет на впечатление новых клиентов, а черновик готов. После проверки я открою карточку 2ГИС для публикации.';
    }
    if (/(четверг|загруз|окн|запис)/.test(normalized)) {
      return 'Четверг ниже обычной загрузки третью неделю: 38% против среднего 76%. Сценарий рассчитан по свободным окнам, среднему чеку и ритму возврата 24 клиентов.';
    }
    if (/(деньг|денег|выруч|эффект|результ|руб)/.test(normalized)) {
      return 'За текущий месяц демо-салон связывает 27 повторных записей со 126 800 ₽ выручки. В отчёте можно отдельно проверить источник и период каждого результата.';
    }
    if (/(фото|карт|яндекс|2гис|гео)/.test(normalized)) {
      return 'Геокарточки заполнены на 72%. Самый быстрый следующий шаг — проверить шесть выбранных фотографий: последние обновлялись 48 дней назад.';
    }
    if (/(сегодня|сначала|приоритет|важн)/.test(normalized)) {
      return 'Порядок такой: ответить клиентам, согласовать сценарий четверга, затем обновить фотографии. Он учитывает срочность, влияние на клиента и готовность решения.';
    }
    return guestMode
      ? 'Сейчас я отвечаю по открытым данным Яндекс Карт и 2ГИС. Спросите про отзывы, рейтинг, фотографии или заполненность карточек.'
      : 'Я могу объяснить приоритет, источник и расчёт по отзывам, загрузке, клиентам, выручке или геокарточкам.';
  }

  function setEvaExpanded(panel, expanded, focusInput) {
    if (!panel) return;
    panel.classList.toggle('is-expanded', expanded);
    var expandable = panel.querySelector('[data-eva-expandable]');
    var input = panel.querySelector('[data-eva-form] input');
    var submit = panel.querySelector('[data-eva-form] button');
    if (expandable) expandable.setAttribute('aria-hidden', String(!expanded));
    panel.querySelectorAll('[data-eva-toggle]').forEach(function (toggle) {
      toggle.setAttribute('aria-expanded', String(expanded));
    });
    panel.querySelectorAll('[data-eva-toggle-label]').forEach(function (label) {
      label.textContent = expanded ? 'Свернуть Еву' : 'Спросить Еву';
    });
    panel.querySelectorAll('[data-eva-toggle-icon]').forEach(function (icon) {
      icon.textContent = expanded ? '−' : '↗';
    });
    if (input) input.tabIndex = expanded ? 0 : -1;
    if (submit) submit.disabled = !expanded;
    if (expanded && focusInput && input) {
      window.setTimeout(function () { input.focus(); }, 280);
    }
  }

  document.querySelectorAll('[data-eva-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var panel = button.closest('[data-eva-panel]');
      setEvaExpanded(panel, !panel.classList.contains('is-expanded'), true);
    });
  });

  document.querySelectorAll('[data-eva-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input');
      var question = input.value.trim();
      if (!question) {
        input.focus();
        return;
      }
      var response = document.querySelector('[data-eva-response]');
      if (response) {
        response.hidden = false;
        response.querySelector('p').textContent = getEvaAnswer(question);
      }
      input.value = '';
    });
  });

  document.querySelectorAll('[data-task-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.getAttribute('data-task-filter');
      applyTaskFilter(filter);
    });
  });

  document.querySelectorAll('.event[data-open-task]').forEach(function (eventCard) {
    eventCard.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openDrawer(eventCard.getAttribute('data-open-task'));
    });
  });

  document.addEventListener('click', function (event) {
    if (!notificationPopover || notificationPopover.hidden) return;
    if (event.target.closest('[data-notifications], [data-notification-popover]')) return;
    closeNotifications();
  });

  /*
   * Live dashboard bridge.
   *
   * The host application injects this object only after the user signs in:
   * window.MARKETOLOG_TECH_DASHBOARD_CONFIG = {
   *   apiBaseUrl: 'https://api.example.com',
   *   projectId: 123,
   *   getAccessToken: function () { return 'user-jwt'; }
   * };
   *
   * No token, API URL or project identifier is stored in this repository.
   */
  var dashboardRange = 'today';
  var dashboardRequestId = 0;

  var demoSummaries = {
    today: {
      salon: { id: 'demo-salon', name: salonName, address: salonAddress, timezone: 'Europe/Moscow' },
      period: { range: 'today', from: '2026-07-23', to: '2026-07-23' },
      updated_at: '2026-07-23T07:25:00+03:00',
      signal: {
        severity: 'attention',
        title: 'Вернуть 24 клиента',
        body: 'Срок их следующего визита уже наступил. Начните с подготовленного сегмента и проверьте результат после контакта.',
        primary_metric: { key: 'return_due', label: 'готовы к контакту', value: 24, unit: 'count', source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' },
        potential_revenue_rub: 84000,
        potential_revenue_formula: '24 клиента × средний чек 3 500 ₽',
        action: { label: 'Открыть сегмент', deep_link: '/salon/clients?segment=return_due' }
      },
      kpis: [
        { key: 'booked', label: 'Записи', value: 8, unit: 'count', source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' },
        { key: 'visits', label: 'Визиты', value: 18, unit: 'count', source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' },
        { key: 'free_slots', label: 'Свободные окна', value: 3, unit: 'count', source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' }
      ],
      today_actions: [
        { id: 'demo-return', title: 'Связаться с 24 клиентами', description: 'Срок следующего визита уже наступил.', priority: 'high', due: '2026-07-23', source: 'yclients', deep_link: '/salon/clients?segment=return_due', impact: { value: 84000, unit: 'rub' } },
        { id: 'demo-reviews', title: 'Проверить 2 ответа клиентам', description: 'Первый отзыв ждёт ответа 19 часов.', priority: 'high', due: '2026-07-23', source: 'geo', deep_link: '/salon/geo?focus=review' },
        { id: 'demo-slots', title: 'Согласовать «Тихий четверг»', description: 'Сценарий и расчёт готовы.', priority: 'normal', due: '2026-07-23', source: 'yclients', deep_link: '/salon/clients?focus=thursday' }
      ],
      sources: [
        { key: 'yclients', label: 'YClients', status: 'connected', updated_at: '2026-07-23T07:19:00+03:00', message: null },
        { key: 'geo', label: 'Карты', status: 'connected', updated_at: '2026-07-23T07:25:00+03:00', message: null },
        { key: 'metrica', label: 'Метрика', status: 'stale', updated_at: '2026-07-22T18:00:00+03:00', message: 'Обновление ожидается' }
      ]
    },
    '30d': {
      salon: { id: 'demo-salon', name: salonName, address: salonAddress, timezone: 'Europe/Moscow' },
      period: { range: '30d', from: '2026-06-24', to: '2026-07-23' },
      updated_at: '2026-07-23T07:25:00+03:00',
      signal: {
        severity: 'attention',
        title: 'Повторная запись ниже цели',
        body: 'За последние 30 дней вернулись 27 клиентов. До цели месяца не хватает четырёх процентных пунктов.',
        primary_metric: { key: 'rebooking_rate', label: 'повторная запись', value: 38, unit: 'percent', delta_percent: 5.4, source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' },
        potential_revenue_rub: 84000,
        potential_revenue_formula: 'оценка по клиентам с наступившим сроком визита',
        action: { label: 'Открыть клиентов', deep_link: '/salon/clients?segment=return_due' }
      },
      kpis: [
        { key: 'revenue', label: 'Выручка', value: 428600, unit: 'rub', delta_percent: 12.4, direction: 'up', source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' },
        { key: 'rebooking_rate', label: 'Повторная запись', value: 38, unit: 'percent', delta_percent: 5.4, direction: 'up', source: 'yclients', kind: 'fact', updated_at: '2026-07-23T07:19:00+03:00' },
        { key: 'unanswered_reviews', label: 'Отзывы без ответа', value: 6, unit: 'count', source: 'geo', kind: 'fact', updated_at: '2026-07-23T07:25:00+03:00' }
      ],
      today_actions: [],
      sources: [
        { key: 'yclients', label: 'YClients', status: 'connected', updated_at: '2026-07-23T07:19:00+03:00', message: null },
        { key: 'geo', label: 'Карты', status: 'connected', updated_at: '2026-07-23T07:25:00+03:00', message: null },
        { key: 'metrica', label: 'Метрика', status: 'stale', updated_at: '2026-07-22T18:00:00+03:00', message: 'Обновление ожидается' }
      ]
    }
  };

  function dashboardConfig() {
    if (guestMode) return null;
    var config = window.MARKETOLOG_TECH_DASHBOARD_CONFIG;
    if (!config || typeof config !== 'object') return null;
    var token = typeof config.getAccessToken === 'function' ? config.getAccessToken() : config.accessToken;
    var projectId = config.projectId || params.get('project_id');
    if (!config.apiBaseUrl || !projectId || !token) return null;
    return { apiBaseUrl: String(config.apiBaseUrl).replace(/\/$/, '').replace(/\/api\/v1$/, ''), projectId: projectId, token: token };
  }

  function formatDashboardNumber(value, unit) {
    if (value === null || typeof value === 'undefined') return '—';
    var number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    if (unit === 'rub') return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(number) + ' ₽';
    if (unit === 'percent') return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(number) + '%';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(number);
  }

  function sourceLabel(key) {
    var labels = { yclients: 'YClients', geo: 'Карты', metrica: 'Метрика', eva: 'Ева' };
    return labels[key] || key || 'Источник не указан';
  }

  function formatDashboardTime(value) {
    if (!value) return 'нет даты';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function dashboardPeriodLabel(period, range) {
    if (range === 'today' || period && period.range === 'today') return 'Сегодня';
    if (range === '30d' || period && period.range === '30d') return 'Последние 30 дней';
    if (period && period.from && period.to) return 'с ' + period.from + ' по ' + period.to;
    return 'Выбранный период';
  }

  function routeFromDeepLink(deepLink) {
    var link = String(deepLink || '').toLowerCase();
    if (link.indexOf('finance') > -1) return 'finance';
    if (link.indexOf('review') > -1 || link.indexOf('geo') > -1 || link.indexOf('map') > -1) return 'geo';
    if (link.indexOf('site') > -1 || link.indexOf('metrica') > -1) return 'site';
    if (link.indexOf('task') > -1) return 'tasks';
    return 'clients';
  }

  function setDashboardText(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setDashboardState(text, variant, loading) {
    var control = document.querySelector('.dashboard-range-control');
    var node = document.querySelector('[data-dashboard-state]');
    if (control) control.classList.toggle('is-loading', Boolean(loading));
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('is-live', variant === 'live');
    node.classList.toggle('is-error', variant === 'error');
  }

  function setDashboardRange(range, loading) {
    dashboardRange = range;
    document.querySelectorAll('[data-dashboard-range]').forEach(function (button) {
      var active = button.getAttribute('data-dashboard-range') === range;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      button.disabled = Boolean(loading);
    });
  }

  function renderDashboardKpis(summary, range) {
    var kpis = Array.isArray(summary.kpis) ? summary.kpis.slice(0, 3) : [];
    var cards = document.querySelectorAll('[data-summary-kpi-card]');
    setDashboardText('[data-summary-kpis-title]', range === 'today' ? 'Главные факты на сегодня' : 'Главные факты за 30 дней');
    setDashboardText('[data-summary-kpis-period]', 'Факты · ' + dashboardPeriodLabel(summary.period, range).toLowerCase());
    cards.forEach(function (card, index) {
      var metric = kpis[index];
      card.classList.toggle('is-empty', !metric);
      setTextIn(card, '[data-summary-kpi-label]', metric ? metric.label : 'Нет данных');
      setTextIn(card, '[data-summary-kpi-source]', metric ? sourceLabel(metric.source) : 'Источник');
      setTextIn(card, '[data-summary-kpi-value]', metric ? formatDashboardNumber(metric.value, metric.unit) : '—');
      setTextIn(card, '[data-summary-kpi-period-label]', metric ? ((metric.kind === 'estimate' ? 'оценка' : 'факт') + ' · ' + dashboardPeriodLabel(metric.period || summary.period, range).toLowerCase()) : 'подключите источник');
      setTextIn(card, '[data-summary-kpi-delta]', metric && metric.delta_percent !== null && typeof metric.delta_percent !== 'undefined' ? ((metric.delta_percent > 0 ? '+' : '') + new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(metric.delta_percent) + '% к предыдущему периоду') : '');
    });
  }

  function setTextIn(parent, selector, value) {
    var node = parent.querySelector(selector);
    if (node) node.textContent = value;
  }

  function renderDashboardSources(sources) {
    var foot = document.querySelector('[data-summary-sources]');
    if (!foot || !Array.isArray(sources)) return;
    foot.innerHTML = '';
    sources.slice(0, 3).forEach(function (source) {
      var row = document.createElement('span');
      var dot = document.createElement('i');
      dot.className = 'source-dot' + (source.status === 'connected' ? ' is-live' : '');
      row.appendChild(dot);
      row.appendChild(document.createTextNode(' ' + source.label + ' · ' + (source.status === 'connected' ? 'обновлён ' + formatDashboardTime(source.updated_at) : (source.message || source.status))));
      foot.appendChild(row);
    });
    if (sourceCount) sourceCount.textContent = sources.filter(function (source) { return source.status === 'connected'; }).length + ' источника подключено';
  }

  function renderDashboardActions(actions, period) {
    var list = document.querySelector('[data-summary-actions]');
    var dateNode = document.querySelector('[data-agenda-date]');
    var countNode = document.querySelector('[data-agenda-count]');
    if (!list || !Array.isArray(actions)) return;
    list.innerHTML = '';
    if (dateNode) dateNode.textContent = 'Сегодня';
    if (countNode) countNode.textContent = actions.length ? actions.length + ' ' + taskWord(actions.length) + ' в работе' : 'Задач на сегодня нет';
    if (!actions.length) {
      var empty = document.createElement('div');
      empty.className = 'agenda-empty';
      empty.textContent = 'На сегодня новых действий нет.';
      list.appendChild(empty);
      return;
    }
    actions.slice(0, 3).forEach(function (action) {
      var button = document.createElement('button');
      var meta = document.createElement('i');
      var content = document.createElement('span');
      var title = document.createElement('strong');
      var description = document.createElement('small');
      var time = document.createElement('time');
      var open = document.createElement('b');
      button.type = 'button';
      button.className = 'agenda-task' + (action.priority === 'high' || action.priority === 'critical' ? ' is-urgent' : '');
      button.setAttribute('data-task-route', routeFromDeepLink(action.deep_link));
      time.textContent = period && action.due === period.to ? 'Сегодня' : (action.due || 'План');
      meta.textContent = sourceLabel(action.source) + ' · ' + (action.priority === 'high' ? 'высокий приоритет' : 'действие');
      title.textContent = action.title || 'Открыть задачу';
      description.textContent = action.description || (action.impact ? 'Эффект: ' + formatDashboardNumber(action.impact.value, action.impact.unit) : 'Подробности доступны в задаче');
      open.textContent = 'Открыть →';
      content.appendChild(meta);
      content.appendChild(title);
      content.appendChild(description);
      button.appendChild(time);
      button.appendChild(content);
      button.appendChild(open);
      list.appendChild(button);
    });
  }

  function renderDashboardSummary(summary, range, isLive) {
    if (!summary || typeof summary !== 'object') return;
    var signal = summary.signal || {};
    var primary = signal.primary_metric || {};
    var updatedAt = summary.updated_at || primary.updated_at;
    var potential = signal.potential_revenue_rub;
    var action = signal.action || {};
    if (summary.salon) {
      document.querySelectorAll('[data-salon-name], [data-topbar-salon]').forEach(function (node) { node.textContent = summary.salon.name || salonName; });
      if (summary.salon.address) document.querySelectorAll('[data-salon-address]').forEach(function (node) { node.textContent = summary.salon.address; });
    }
    if (isLive) {
      if (status) status.textContent = 'Данные салона';
      if (demoCopy) demoCopy.textContent = '· подключённый кабинет';
    }
    setDashboardText('[data-summary-updated]', dashboardPeriodLabel(summary.period, range) + ' · обновлено в ' + formatDashboardTime(updatedAt));
    setDashboardText('[data-summary-signal-kicker]', dashboardPeriodLabel(summary.period, range) + ' · главный сигнал');
    setDashboardText('[data-summary-signal-title]', signal.title || 'Главный сигнал пока не сформирован');
    setDashboardText('[data-summary-signal-body]', signal.body || 'Подключите источник, чтобы увидеть приоритет на этот период.');
    setDashboardText('[data-summary-primary-value]', formatDashboardNumber(primary.value, primary.unit));
    setDashboardText('[data-summary-primary-label]', primary.label || 'ключевой показатель');
    setDashboardText('[data-summary-potential-value]', potential === null || typeof potential === 'undefined' ? '—' : 'до ' + formatDashboardNumber(potential, 'rub'));
    setDashboardText('[data-summary-potential-formula]', signal.potential_revenue_formula || (potential ? 'оценка по данным салона' : 'оценка появится при наличии данных'));
    setDashboardText('[data-summary-source-time]', formatDashboardTime(primary.updated_at || updatedAt));
    setDashboardText('[data-summary-source-label]', sourceLabel(primary.source) + ' · ' + (primary.kind === 'estimate' ? 'оценка' : 'факт'));
    var actionButton = document.querySelector('[data-summary-signal-action]');
    if (actionButton) {
      actionButton.textContent = (action.label || 'Открыть подробности') + ' →';
      actionButton.setAttribute('data-go', routeFromDeepLink(action.deep_link));
    }
    renderDashboardKpis(summary, range);
    renderDashboardSources(summary.sources || []);
    if (range === 'today' || Array.isArray(summary.today_actions) && summary.today_actions.length) renderDashboardActions(summary.today_actions || [], summary.period);
    var hasStaleSource = Array.isArray(summary.sources) && summary.sources.some(function (source) { return source.status === 'stale'; });
    setDashboardState(isLive ? (hasStaleSource ? 'Есть устаревшие данные' : 'Живые данные') : 'Демо-данные', hasStaleSource ? 'error' : (isLive ? 'live' : 'demo'), false);
  }

  function loadDashboardSummary(range, refresh) {
    var config = dashboardConfig();
    var requestId = ++dashboardRequestId;
    setDashboardRange(range, true);
    setDashboardState(config ? 'Обновляем данные…' : 'Демо-данные', 'demo', true);
    if (!config) {
      window.setTimeout(function () {
        if (requestId !== dashboardRequestId) return;
        renderDashboardSummary(demoSummaries[range], range, false);
        setDashboardRange(range, false);
      }, 120);
      return;
    }
    var requestUrl = config.apiBaseUrl + '/api/v1/dashboard/summary?project_id=' + encodeURIComponent(config.projectId) + '&range=' + encodeURIComponent(range) + (refresh ? '&refresh=true' : '');
    fetch(requestUrl, {
      headers: {
        Authorization: 'Bearer ' + config.token,
        'X-Client-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
      }
    }).then(function (response) {
      if (!response.ok) throw new Error('API returned ' + response.status);
      return response.json();
    }).then(function (summary) {
      if (requestId !== dashboardRequestId) return;
      renderDashboardSummary(summary, range, true);
      setDashboardRange(range, false);
    }).catch(function () {
      if (requestId !== dashboardRequestId) return;
      setDashboardRange(range, false);
      setDashboardState('Не удалось обновить', 'error', false);
      showToast('Данные не обновлены', 'Проверьте подключение источников и попробуйте ещё раз');
    });
  }

  document.querySelectorAll('[data-dashboard-range]').forEach(function (button) {
    button.addEventListener('click', function () { loadDashboardSummary(button.getAttribute('data-dashboard-range'), false); });
  });
  var dashboardRefresh = document.querySelector('[data-dashboard-refresh]');
  if (dashboardRefresh) dashboardRefresh.addEventListener('click', function () { loadDashboardSummary(dashboardRange, true); });

  demoState.manualTasks.forEach(function (task) { renderManualTask(task, false); });
  demoState.completedTasks.slice().forEach(function (taskName) {
    if (taskData[taskName]) markTaskComplete(taskName, false);
  });
  applyNotificationState();
  updateTaskCounts();
  loadDashboardSummary('today', false);
  var initialScreen = params.get('screen');
  if (initialScreen && Object.prototype.hasOwnProperty.call(titles, initialScreen)) showScreen(initialScreen);
  var initialTask = params.get('task');
  if (initialTask && Object.prototype.hasOwnProperty.call(taskData, initialTask)) openDrawer(initialTask);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeNotifications();
    closeModal();
    closeDrawer();
  });
})();
