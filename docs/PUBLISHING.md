# Оформление GitHub и публикация v0.1.0

Материалы подготовлены; этот файл сам по себе не означает, что релиз опубликован.

## Описание репозитория (About)

```text
Independent community plugins for Lampa. Keyboard Fix improves D-pad navigation on the built-in keyboard. Developed by PukhovDenis with ChatGPT.
```

Topics:

```text
lampa lampa-plugins android-tv keyboard keyboard-fix dpad javascript smart-tv
```

Владелец может указать их через шестерёнку в разделе About репозитория. Настройки GitHub Pages менять не требуется.

## Публикация релиза

1. Проверьте и объедините PR документации в main.
2. Откройте https://github.com/PukhovDenis/lampa-plugins/releases/new.
3. Проверьте, что тега v0.1.0 ещё нет. Создайте тег `v0.1.0` на проверенном коммите main с исходным плагином. Если тег уже существует, проверьте его содержимое перед использованием; не перемещайте его автоматически.
4. Название релиза: **Lampa Keyboard Fix v0.1.0**.
5. Скопируйте содержимое [описания релиза](releases/v0.1.0.md).
6. Загрузите исходный `lampa-keyboard-fix.js` из корня репозитория как отдельный asset, без переименования.
7. Сверьте размер 5 505 байт и SHA-256:

   ```text
   6ad0d1f2b667297dd70981e9ee0cd9110a8ad1ce83c087fa015fd2958acd199a
   ```

8. Опубликуйте обычный релиз (не prerelease). Скачайте прикреплённый JS и повторно сверьте SHA-256.

Исходный коммит плагина при подготовке документации: `f4f9fb994f3133d7d2a8cda9ae4f6fa75636c596`.
Git blob JS: `961482714307db0d39362fc03ff1f463870c6662`.

Не добавляйте лицензию без отдельного согласования с владельцем.
