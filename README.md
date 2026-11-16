# Lampa Plugins

**Плагины PukhovDenis для Lampa · Plugins by PukhovDenis for Lampa**

[![Keyboard Fix v0.1.0](https://img.shields.io/badge/Keyboard_Fix-v0.1.0-blue)](CHANGELOG.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)](lampa-keyboard-fix.js)
[![Manual tests 8/8](https://img.shields.io/badge/manual_tests-8%2F8_passed-brightgreen)](#testing)
[![GitHub Issues](https://img.shields.io/github/issues/PukhovDenis/lampa-plugins)](https://github.com/PukhovDenis/lampa-plugins/issues)

[Русский](#ru) · [English](#en) · [Changelog](CHANGELOG.md)

<a id="ru"></a>

## Русский

Коллекция собственных плагинов для Lampa. Сейчас доступен **Lampa Keyboard Fix v0.1.0**.

### Каталог

| Плагин | Назначение | Файл |
| --- | --- | --- |
| Lampa Keyboard Fix | Исправление вертикальной навигации встроенной клавиатуры с пульта | [lampa-keyboard-fix.js](lampa-keyboard-fix.js) |

### Что исправляет Keyboard Fix

- При нажатии ↑ или ↓ выбирает ближайшую по горизонтали клавишу в соседнем ряду.
- Устраняет пропуск рядов и преждевременный уход фокуса в историю поиска.
- При нажатии ↑ в истории поиска возвращает фокус на нижний ряд клавиатуры, ближе к горизонтальной позиции элемента истории.
- Работает с русской и английской раскладками, цифрами и специальными символами в проверенной конфигурации.

### Принцип работы

Предположительная причина ошибки — геометрический выбор следующего элемента алгоритмом SpatialNavigator. Плагин оборачивает `window.Navigator.navigate`: для ↑/↓ при активной встроенной клавиатуре находит соседний ряд и сравнивает горизонтальные координаты центров доступных клавиш. На границах клавиатуры выход обрабатывает штатный контроллер Lampa. Для возврата из истории поиска дополнительно оборачивается действие ↑ её контроллера.

Плагин работает локально с интерфейсом: не требует модификации APK, не выполняет собственных сетевых запросов, не записывает данные в хранилище и не переназначает кнопки пульта. Сам JS-файл загружается Lampa по адресу установки. Внешние бейджи в этом README не являются частью плагина.

### Установка

1. Откройте настройки Lampa → раздел «Расширения» (названия пунктов могут отличаться).
2. Выберите добавление плагина по URL и вставьте адрес:

   ```text
   https://pukhovdenis.github.io/lampa-plugins/lampa-keyboard-fix.js
   ```

3. Подтвердите добавление, включите расширение, если требуется, и полностью перезапустите Lampa.
4. Откройте поиск со встроенной клавиатурой и проверьте переходы ↑/↓ с пульта.

### Удаление или отключение

В разделе расширений Lampa отключите или удалите запись с указанным URL, затем полностью перезапустите приложение. Перезапуск необходим, чтобы восстановить исходные обработчики навигации.

### Проверенная конфигурация

| Компонент | Значение |
| --- | --- |
| Приставка | KICKPI KP1 |
| ОС | Android TV 14 |
| Сборка | UKG3.251130.001.9314 |
| Прошивка | v14.7.9314 |
| Lampa | 3.4.7 |
| Android APK | 1.13.6-586 |
| Клавиатура | Встроенная |
| Управление | Пульт, D-pad |

<a id="testing"></a>

### Результаты ручного тестирования

Результаты предоставлены автором после проверки на реальной приставке в конфигурации выше. При оформлении документации эти аппаратные тесты повторно не выполнялись.

| № | Проверка | Результат |
| --- | --- | --- |
| 1 | Е ↓ — второй ряд не пропускается | ✅ Пройдено |
| 2 | Т ↑ — нет перескока на Г | ✅ Пройдено |
| 3 | Ь ↑ — нет перескока на Ш | ✅ Пройдено |
| 4 | Р ↓ — нет перескока в историю поиска | ✅ Пройдено |
| 5 | О ↓ — нет перескока в историю поиска | ✅ Пройдено |
| 6 | История поиска ↑ — переход на нижний ряд букв | ✅ Пройдено |
| 7 | Английская раскладка | ✅ Пройдено |
| 8 | Цифры и специальные символы | ✅ Пройдено |

**Совместимость с другими устройствами и версиями Lampa/APK пока не проверена.** Плагин зависит от внутренней структуры интерфейса Lampa; её изменение может потребовать адаптации.

### Обратная связь

Сообщить об ошибке или предложить улучшение можно через [GitHub Issues](https://github.com/PukhovDenis/lampa-plugins/issues/new/choose). Укажите плагин и версию, модель устройства, версии ОС/Lampa/APK, раскладку, шаги воспроизведения и ожидаемое поведение. Для новых плагинов также можно создать предложение.

### Авторство и статус проекта

**Developed by PukhovDenis with ChatGPT.**

Независимая разработка сообщества, официально не связанная с разработчиками Lampa. Лицензия в репозитории пока не указана.

---

<a id="en"></a>

## English

A collection of original plugins for Lampa. Currently available: **Lampa Keyboard Fix v0.1.0**.

### Plugin catalog

| Plugin | Purpose | File |
| --- | --- | --- |
| Lampa Keyboard Fix | Fix vertical navigation on the built-in keyboard using a remote | [lampa-keyboard-fix.js](lampa-keyboard-fix.js) |

### Features

- Pressing ↑ or ↓ selects the horizontally nearest key in the adjacent row.
- Prevents skipped rows and premature focus jumps to search history.
- Pressing ↑ in search history returns focus to the bottom keyboard row, near the history item's horizontal position.
- Russian, English, numbers and special characters passed manual tests on the configuration below.

### How it works

The suspected cause is SpatialNavigator's geometric selection of the next element. The plugin wraps `window.Navigator.navigate`: for ↑/↓ while the built-in keyboard is active, it finds the adjacent row and compares the horizontal centers of available keys. Lampa's normal controller handles leaving the keyboard at its boundaries. The search history controller's ↑ action is also wrapped to restore focus to the bottom row.

The plugin operates locally on the UI. It requires no APK modification, makes no network requests of its own, writes no storage data and does not remap remote buttons. Lampa downloads the JS file from the installation URL. External README badges are not part of the plugin.

### Installation

1. Open Lampa settings → Extensions (menu names may vary).
2. Choose the option to add a plugin by URL and enter:

   ```text
   https://pukhovdenis.github.io/lampa-plugins/lampa-keyboard-fix.js
   ```

3. Confirm, enable the extension if needed, and fully restart Lampa.
4. Open search with the built-in keyboard and test ↑/↓ using the remote.

### Removal or disabling

Disable or remove the entry with this URL in Lampa's extensions settings, then fully restart the app. Restarting restores the original navigation handlers.

### Verified configuration

| Component | Value |
| --- | --- |
| Device | KICKPI KP1 |
| OS | Android TV 14 |
| Build | UKG3.251130.001.9314 |
| Firmware | v14.7.9314 |
| Lampa | 3.4.7 |
| Android APK | 1.13.6-586 |
| Keyboard | Built-in |
| Input | Remote, D-pad |

### Manual test results

Reported by the author after testing on the physical device above. These hardware tests were not rerun during documentation work.

| # | Test | Result |
| --- | --- | --- |
| 1 | Е ↓ — does not skip the second row | ✅ Passed |
| 2 | Т ↑ — does not jump to Г | ✅ Passed |
| 3 | Ь ↑ — does not jump to Ш | ✅ Passed |
| 4 | Р ↓ — does not jump to search history | ✅ Passed |
| 5 | О ↓ — does not jump to search history | ✅ Passed |
| 6 | Search history ↑ — returns to the bottom letter row | ✅ Passed |
| 7 | English layout | ✅ Passed |
| 8 | Numbers and special characters | ✅ Passed |

**Other devices and Lampa/APK versions have not been verified.** The plugin depends on Lampa's internal UI structure; future changes may require adaptation.

### Feedback

Use [GitHub Issues](https://github.com/PukhovDenis/lampa-plugins/issues/new/choose) to report bugs or suggest features, including new plugins. Include the plugin/version, device model, OS/Lampa/APK versions, layout, reproduction steps and expected behavior.

### Credits and project status

**Developed by PukhovDenis with ChatGPT.**

An independent community project, not officially affiliated with the developers of Lampa. No license has been specified in this repository.
