(function () {
  'use strict';

  var navButtons = Array.prototype.slice.call(document.querySelectorAll('[data-screen]'));
  var screens = Array.prototype.slice.call(document.querySelectorAll('[data-screen-panel]'));
  var sidebar = document.querySelector('.sidebar');
  var taskCount = 3;
  var activeTask = null;
  var toastTimer = null;

  function openScreen(name) {
    navButtons.forEach(function (button) {
      var active = button.getAttribute('data-screen') === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });

    screens.forEach(function (screen) {
      var active = screen.getAttribute('data-screen-panel') === name;
      screen.hidden = !active;
      screen.classList.toggle('is-active', active);
    });

    if (sidebar) sidebar.classList.remove('is-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      openScreen(button.getAttribute('data-screen'));
    });
  });

  var sideNav = document.querySelector('.side-nav');
  if (sideNav) {
    sideNav.addEventListener('keydown', function (event) {
      var step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      var current = navButtons.indexOf(document.activeElement);
      if (current < 0) current = 0;
      var next = navButtons[(current + step + navButtons.length) % navButtons.length];
      next.focus();
    });
  }

  document.querySelectorAll('[data-go-screen]').forEach(function (button) {
    button.addEventListener('click', function () {
      openScreen(button.getAttribute('data-go-screen'));
    });
  });

  var mobileMenu = document.querySelector('[data-mobile-menu]');
  if (mobileMenu && sidebar) {
    mobileMenu.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
    });
  }

  var scopeButtons = document.querySelectorAll('[data-scope]');
  function setScope(scope) {
    var network = scope === 'network';
    document.body.classList.toggle('is-network', network);

    scopeButtons.forEach(function (button) {
      var active = button.getAttribute('data-scope') === scope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-single-value]').forEach(function (item) {
      item.textContent = item.getAttribute(network ? 'data-network-value' : 'data-single-value');
    });

    document.querySelectorAll('[data-network-only]').forEach(function (item) {
      item.hidden = !network;
    });

    var scopeName = document.querySelector('[data-scope-name]');
    var scopeCaption = document.querySelector('[data-scope-caption]');
    var topbarName = document.querySelector('[data-topbar-name]');
    if (scopeName) scopeName.textContent = network ? 'Сеть «Ирис»' : 'Салон «Ирис»';
    if (scopeCaption) scopeCaption.textContent = network ? '3 филиала · Москва' : 'Москва · Хамовники';
    if (topbarName) topbarName.textContent = network ? 'Сеть «Ирис» · 3 филиала' : 'Салон «Ирис»';
  }

  scopeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setScope(button.getAttribute('data-scope'));
    });
  });

  var drawerData = {
    review: {
      kicker: 'Отзывы · 2ГИС',
      title: 'Ответить Ольге В.',
      action: 'Проверить и открыть 2ГИС',
      body: '<p>Система заметила негативный сигнал, оценила риск и подготовила ответ. Финальная публикация остаётся за человеком.</p><div class="drawer-flow"><article><span>Почему задача важна</span><strong>Отзыв влияет на решение новых клиентов</strong><p>Карточку просматривают около 430 человек в неделю. Ответ в первые сутки снижает влияние негативного опыта.</p></article><article><span>Что подготовлено</span><strong>Персональный ответ без шаблонных фраз</strong><p>Текст признаёт проблему, показывает принятое решение и не обещает автоматическую компенсацию.</p></article><article><span>Что произойдёт дальше</span><strong>Откроется карточка отзыва в 2ГИС</strong><p>Вы проверите текст, вставите его и подтвердите публикацию на стороне карт.</p></article></div><div class="drawer-note">МаркетологТЕХ не публикует ответы на картах без вашего действия.</div>'
    },
    thursday: {
      kicker: 'Паттерн загрузки',
      title: 'Заполнить пустой четверг',
      action: 'Согласовать план',
      body: '<p>Три недели подряд загрузка после 15:00 значительно ниже обычной. Это уже устойчивый паттерн, а не случайность.</p><div class="drawer-flow"><article><span>Сигнал</span><strong>38% загрузки против среднего 76%</strong><p>Свободные окна повторяются у двух мастеров и совпадают с группой клиентов, которым пора вернуться.</p></article><article><span>Предложение</span><strong>Уход в подарок без снижения основной цены</strong><p>Механика рассчитана на 24 клиента и не обесценивает основные услуги салона.</p></article><article><span>Прогноз</span><strong>5–7 дополнительных записей</strong><p>Ожидаемый вклад — около 42 000 ₽ в месяц при повторении механики дважды.</p></article></div><div class="drawer-note">Это масштабное ценовое решение, поэтому запуск требует подтверждения владельца.</div>'
    },
    return: {
      kicker: 'Клиенты · возврат',
      title: 'Вернуть 14 клиентов',
      action: 'Проверить и запустить',
      body: '<p>Клиенты нарушили привычный ритм посещений: раньше возвращались каждые 5–7 недель, сейчас отсутствуют больше 60 дней.</p><div class="drawer-flow"><article><span>Сегмент</span><strong>14 клиентов с подтверждённой историей</strong><p>Суммарно потратили 186 400 ₽. Клиенты без согласия на коммуникацию исключены автоматически.</p></article><article><span>Что подготовлено</span><strong>Персональные сообщения по последней услуге</strong><p>Каждый текст можно проверить и изменить перед запуском.</p></article><article><span>Ожидаемый результат</span><strong>Вернутся 4–6 клиентов</strong><p>Прогнозируемая выручка в течение 30 дней — около 32 000 ₽.</p></article></div><div class="drawer-note">Контакт с клиентами начинается только после проверки списка и сообщений человеком.</div>'
    }
  };

  var drawer = document.getElementById('task-drawer');
  var drawerBackdrop = document.querySelector('.drawer-backdrop');
  var drawerKicker = document.getElementById('drawer-kicker');
  var drawerTitle = document.getElementById('drawer-title');
  var drawerContent = document.getElementById('drawer-content');
  var drawerComplete = document.querySelector('[data-drawer-complete]');

  function openDrawer(name) {
    var data = drawerData[name];
    if (!drawer || !data) return;
    activeTask = name;
    drawerKicker.textContent = data.kicker;
    drawerTitle.textContent = data.title;
    drawerContent.innerHTML = data.body;
    drawerComplete.textContent = data.action;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    drawer.querySelector('[data-close-drawer]').focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawerBackdrop.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-task]').forEach(function (button) {
    button.addEventListener('click', function () {
      openDrawer(button.getAttribute('data-open-task'));
    });
  });

  document.querySelectorAll('[data-close-drawer]').forEach(function (button) {
    button.addEventListener('click', closeDrawer);
  });

  function showToast(title, message) {
    var toast = document.querySelector('.toast');
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.querySelector('strong').textContent = title;
    toast.querySelector('small').textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3200);
  }

  function updateTaskCount() {
    document.querySelectorAll('[data-task-counter]').forEach(function (slot) {
      slot.textContent = String(taskCount);
    });
  }

  function completeTask(name) {
    var card = name ? document.querySelector('[data-task-card="' + name + '"]') : null;
    if (card && !card.classList.contains('is-completed')) {
      card.classList.add('is-completed');
      taskCount = Math.max(0, taskCount - 1);
      updateTaskCount();
    }
    closeDrawer();
    showToast('Задача выполнена', 'Результат появится в следующем отчёте');
  }

  document.querySelectorAll('[data-complete-task]').forEach(function (button) {
    button.addEventListener('click', function () {
      var card = button.closest('[data-task-card]');
      completeTask(card ? card.getAttribute('data-task-card') : null);
    });
  });

  if (drawerComplete) {
    drawerComplete.addEventListener('click', function () { completeTask(activeTask); });
  }

  document.querySelectorAll('[data-snooze]').forEach(function (button) {
    button.addEventListener('click', function () {
      showToast('Напомним завтра', 'Задача останется в общей ленте');
    });
  });

  document.querySelectorAll('.filter-row button').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.filter-row button').forEach(function (item) { item.classList.remove('is-active'); });
      button.classList.add('is-active');
    });
  });

  document.querySelectorAll('.period-switch button').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.period-switch button').forEach(function (item) { item.classList.remove('is-active'); });
      button.classList.add('is-active');
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer && drawer.classList.contains('is-open')) closeDrawer();
  });
})();
