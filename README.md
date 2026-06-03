# Sneaker Interaction

Сайт-витрина магазина оригинальных кроссовок, одежды и аксессуаров (Nike SB, Air Jordan,
KITH, Supreme и др.). Без корзины и онлайн-оплаты — заказ оформляется через Telegram.
Каталог редактируется через встроенную админ-панель прямо в браузере.

Статический сайт: чистые HTML, CSS и JavaScript, без сборки и зависимостей.

## Страницы

| Файл                 | Назначение                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `index.html`         | Главная: hero, дропы, категории, лукбук, шаги заказа                 |
| `catalog.html`       | Каталог с фильтрами (категория, бренд, размер, наличие) и поиском    |
| `product.html`       | Карточка товара (`product.html?id=...`): галерея, размеры, заказ     |
| `admin.html`         | Админ-панель: добавление/редактирование товаров, экспорт/импорт JSON |
| `catalog-print.html` | Версия каталога для печати / сохранения в PDF                       |
| `404.html`           | Страница «не найдено»                                                |

## Структура

```
.
├── index.html · catalog.html · product.html · admin.html · catalog-print.html · 404.html
├── robots.txt · sitemap.xml
└── assets/
    ├── css/      base.css (дизайн-система) + по странице: home/catalog/product/admin/print/notfound
    ├── js/       data.js (товары) · store.js (хранилище) · common.js (общее поведение)
    │             + по странице: home/catalog/product/admin/print/notfound
    ├── fonts/    Benzin (фирменный шрифт)
    └── img/      products/ · editorial/ · логотипы · favicon · og-cover
```

Дизайн-система (цвета, типографика, навигация, подвал, карточки, поиск, мобильное меню)
живёт в `assets/css/base.css` и `assets/js/common.js`. Каждая страница подключает базу плюс
свой небольшой файл стилей и логики.

## Каталог товаров

Источник данных — `assets/js/data.js` (массив `window.SI_PRODUCTS`). Это «заводская» версия
каталога. При редактировании через `admin.html` изменения сохраняются в `localStorage` браузера
и сразу видны на витрине **на этом устройстве**.

Чтобы изменения увидели все посетители опубликованного сайта:

1. Откройте `admin.html`, отредактируйте товары.
2. Нажмите **Экспорт** — скачается `sneaker-interaction-catalog.json`.
3. Перенесите содержимое JSON в `assets/js/data.js` (в массив `SI_PRODUCTS`) и закоммитьте.

> Так как сайт статический, общего серверного каталога нет — «источник правды» это `data.js`
> в репозитории. Админка удобна для подготовки данных и быстрых правок локально.

## Локальный запуск

Любой статический сервер, например:

```bash
python3 -m http.server 8000
# затем откройте http://localhost:8000
```

(Открывать через `file://` не стоит — относительные пути и шрифты работают корректнее по HTTP.)

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub и запушьте этот проект (см. ниже).
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   ветка `main`, папка `/ (root)`.
3. Через минуту сайт будет доступен по адресу `https://<логин>.github.io/<репозиторий>/`.
4. Подставьте этот адрес вместо `REPLACE-WITH-YOUR-DOMAIN` в `robots.txt` и `sitemap.xml`.

Сайт также без изменений разворачивается на Netlify или Vercel (без шага сборки).

## Что заменить на своё

- Telegram, e-mail и Instagram — заданы в `assets/js/common.js` (`TG`) и в подвалах страниц
  (плейсхолдеры `t.me/sneaker_interaction`, `hello@sneaker-in.ru`).
- Домен в `robots.txt` и `sitemap.xml`.

## Стиль кода

Форматирование — [Prettier](https://prettier.io) (`.prettierrc.json`):

```bash
npx prettier --write "**/*.{html,css,js}"
```
