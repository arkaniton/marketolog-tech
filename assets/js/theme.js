/* ==========================================================================
   Переключатель темы.

   По умолчанию сайт светлый. Выбор пользователя запоминается в localStorage
   и переживает перезагрузку.

   Тема применяется ДО отрисовки — маленьким скриптом прямо в <head> каждой
   страницы, иначе тёмная тема моргнёт белым на загрузке. Этот файл отвечает
   только за саму кнопку.
   ========================================================================== */

(function () {
  'use strict';

  var KEY = 'mt-theme';
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem(KEY, theme);
    } catch (error) {
      // Приватный режим — просто не запоминаем выбор
    }

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'
      );
    });
  }

  apply(current());

  document.querySelectorAll('.theme-toggle').forEach(function (button) {
    button.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark');
    });
  });

})();
