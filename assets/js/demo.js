/* ==========================================================================
   Демо-дашборд: переключение экранов и фильтров.

   Макет read-only. Кнопки действий («Отправить», «Опубликовать», «Запустить»)
   намеренно ничего не делают — это витрина, а не рабочий продукт.
   ========================================================================== */

(function () {
  'use strict';

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [data-tab]'));
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));

  /* ------------------------------------------------------------------
     Переключение экранов
     ------------------------------------------------------------------ */

  function openTab(name) {
    var target = document.getElementById('s-' + name);
    if (!target) return;

    tabs.forEach(function (tab) {
      var isCurrent = tab.dataset.tab === name;
      tab.classList.toggle('pill--active', isCurrent);
      tab.setAttribute('aria-selected', String(isCurrent));
    });

    screens.forEach(function (screen) {
      var isCurrent = screen === target;
      screen.hidden = !isCurrent;
      screen.classList.toggle('is-active', isCurrent);
    });

    // Демо всегда открывается с «Сегодня», но при переключении
    // возвращаем взгляд к началу экрана
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { openTab(tab.dataset.tab); });
  });

  // Стрелками влево/вправо между вкладками — как ожидается от роли tablist
  document.querySelector('.tabs').addEventListener('keydown', function (event) {
    var step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;

    event.preventDefault();
    var current = tabs.findIndex(function (t) {
      return t.classList.contains('pill--active');
    });
    var next = tabs[(current + step + tabs.length) % tabs.length];
    openTab(next.dataset.tab);
    next.focus();
  });

  // Кнопки-переходы внутри экранов (например, «Перейти к действиям»)
  document.querySelectorAll('[data-goto]').forEach(function (button) {
    button.addEventListener('click', function () { openTab(button.dataset.goto); });
  });

  /* ------------------------------------------------------------------
     Фильтры ленты — единственная «живая» механика в макете
     ------------------------------------------------------------------ */

  document.querySelectorAll('.filters').forEach(function (group) {
    var buttons = Array.prototype.slice.call(
      group.querySelectorAll('.pill:not(.pill--icon):not(.pill--right)')
    );

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('pill--active'); });
        button.classList.add('pill--active');

        var filter = button.dataset.filter;
        if (!filter) return;

        var feed = group.parentElement.querySelector('.feed');
        if (!feed) return;

        feed.querySelectorAll('[data-type]').forEach(function (card) {
          card.hidden = filter !== 'all' && card.dataset.type !== filter;
        });
      });
    });
  });

})();
