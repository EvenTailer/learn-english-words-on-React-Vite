# Визуальная система — Learn English Words

Дополнение к `docs/design-system.md` (v1.0). Design-system описывает **что есть**;
этот документ описывает **как должно выглядеть** — с конкретными токенами, классами
и значениями, которые можно применить без догадок.

Код приложения этим документом не меняется. Все значения ниже — предложение.

Область применения: токены (`src/styles/tokens.css`), примитивы (`src/shared/ui`),
виджеты (`src/widgets`), страницы (`src/pages`).

---

## 0. Главный диагноз

Пользователь жалуется на «ужасный дизайн» и «непонятно, куда кликать». Это не
вкусовщина, а четыре разных класса дефектов, и каждый лечится отдельно:

| # | Дефект | Механизм | Раздел |
|---|---|---|---|
| D1 | Неясная иерархия: главное действие не выделяется | На экране 3 кнопки одного веса, залитой акцентом нет ни одной уникальной | 3 |
| D2 | Визуальный шум: дубли заголовков, действия «в воздухе» | Виджет повторяет заголовок вкладки; `justify-content: space-between` на контейнере с одним ребёнком | 4.6 |
| D3 | Плоская тёмная тема | canvas→surface-1 = **1.14:1**, граница карточки = **1.26:1** — карточка не отделена от фона | 1.3 |
| D4 | Скачущий ритм | 9 размеров шрифта без ролей, 4 брейкпоинта в модулях, 5 разных «максимальных ширин» | 1.2, 2, 4.2 |

Правило, из которого выводится всё остальное:

> **Один залитой акцентом элемент на экран. Один заголовок на уровень. Одна
> максимальная ширина на тип экрана.**

---

## 1. Аудит токенов (`src/styles/tokens.css`)

### 1.1 Что сломано

| Проблема | Где сейчас | Почему плохо |
|---|---|---|
| **Нет ролевых токенов типографики.** Модули берут `--fs-*` напрямую | `MyLists.module.css` `.title` = `--fs-24`, `.name` = `--fs-18`; `HomePage` `.sectionTitle` = `--fs-20`; `WordListsPage` `.title` = `--fs-32` | Заголовок карточки на одной странице 18px, на другой 20px. Заголовок секции 24 vs 20. Пользователь не может предсказать уровень |
| **Сырые размеры совпадают с ролями** | `--fs-40` = «учебное слово», но это же значение почти никто не отличает от `--fs-32` = «заголовок страницы» | Разница 8px между двумя смысловыми уровнями не читается |
| **Мобильный H1 скачет 24 → 32** | `WordListsPage`, `StoragePage`, `AddPage`, `HomePage`: `@media (max-width: 767px) { .title { font-size: var(--fs-24) } }` | Шаг 24→32 = +33%, на 320px это переполнение заголовка |
| **canvas→surface-1 = 1.14:1** | `--surface-canvas: #070c16`, `--surface-1: #121b2e` | Карточка не читается как приподнятая. Это и есть «плоский тёмный» |
| **`--border-subtle` на карточке = 1.26:1** | `rgba(148,163,184,.14)` поверх `#121b2e` | Рамка невидима. В тёмной теме граница — единственный носитель формы карточки |
| **`--shadow-1` = 0 1px 2px rgba(2,6,23,.4)** | `Card.module.css` | Тень темнее фона в тёмной теме = тень невидима. Подъём не читается |
| **`--opacity-disabled: 0.45` на кнопке с текстом** | `Button.module.css` `.button:disabled { opacity: var(--opacity-disabled) }` | `--accent-on-solid` #070c16 при 45% на `#818cf8` даёт **2.14:1**. Текст disabled-кнопки нечитаем. `design-system.md` при этом запрещает opacity на тексте — правило нарушено в примитиве |
| **`--text-3` на `--surface-4` = 4.17:1** | `#93a2ba` на `#2e3d5e` | Ниже AA 4.5:1. surface-4 = тосты и диалоги — там текст читают |
| **Один `--page-max` на все экраны** | `--page-max: 1120px`; при этом LearnCard = 560, LearnSetup = 720, AddPage заявлен 700, StoragePage в design-system = 1300 | Ширина зашита в модулях мимо токена. Документ и код противоречат друг другу |
| **Брейкпоинты не токенизированы** | В модулях: `480`, `560`, `767`, `900` (`design-system.md` обещает `--bp-sm/md/lg/xl` = 480/768/1024/1280) | 560 и 900 нигде не описаны. Два разных мобильных порога |
| **`--bottom-nav-height` не объявлен** | `var(--bottom-nav-height, 68px)` в `AppLayout`, `BottomNav`, `Toast`; в `tokens.css` его нет | Документ говорит 56px, код молча берёт 68px. Три места — три потенциальных рассинхрона |
| **Нет `--border-card`** | Граница карточки = `--border-subtle` (тот же токен, что у разделителей) | Нельзя поднять видимость рамки карточки, не подняв разделители |
| **Нет `--surface-inset`** | `--surface-2` одновременно «приподнятый блок» и «колодец поля ввода» | Поле ввода и вложенный блок неразличимы |
| **Двойное кольцо фокуса на полях** | `tokens.css`: `outline: 2px solid var(--focus-ring-color); outline-offset: 2px` + `:focus-visible` → `box-shadow: 0 0 0 3px var(--accent-soft)` | Визуальный шум, два концентрических кольца |
| **`.tabs` не существует** | `WordListsPage.jsx` → `className={styles.tabs}`, в `WordListsPage.module.css` класса `.tabs` **нет** (grep: 0 совпадений) | Ряд вкладок рендерится без контейнера: без gap, без выравнивания, без трека |
| **Скелетон 1200ms vs документ 1400ms** | `Skeleton.module.css` `animation: skeleton-shimmer 1200ms` | Расхождение с `design-system.md` |
| **Скелетон `--surface-2` на карточке `--surface-1`** | `Skeleton.module.css` | Заглушка сливается с фоном карточки — «дыра» вместо содержимого |

### 1.2 Что уже правильно — не трогать

- Разделение акцента на `--accent` / `--accent-solid` / `--accent-soft` / `--accent-border` / `--accent-strong`.
- Семантика `--success` / `--danger` / `--warning` + парные `-solid` / `-soft` / `-border` / `-on-solid`.
- Модель поверхностей 4 уровня + canvas + стекло. Нужно только перенастроить значения.
- Контраст `--accent-on-solid` на `--accent-solid` = 6.56:1 (AAA-уровень, AA с запасом).
- `--border-control: #64748b` = 3.61:1 на карточке — это рабочее значение для WCAG 1.4.11, оставить.
- Отказ от `backdrop-filter` на карточках (верное решение, GPU-экономия).
- Глобальный `prefers-reduced-motion` выключатель.
- `skip-link`, `.visually-hidden`, `color-scheme`.

### 1.3 Новые значения токенов

Заменить блок `:root` в `src/styles/tokens.css` на этот (комментарии — часть спецификации).

```css
:root {
  /* ==== 1. ТИПОГРАФИКА =================================================
     --fs-* — внутренние значения. В CSS-модулях использовать ТОЛЬКО
     --text-*. Прямое использование --fs-* запрещено (см. §2).
     ------------------------------------------------------------------ */
  --fs-12: 0.75rem;    /* 12 — микро-подпись, uppercase-бейдж */
  --fs-14: 0.875rem;   /* 14 — подпись поля, вторичный текст */
  --fs-16: 1rem;       /* 16 — базовый текст, кнопка, поле */
  --fs-18: 1.125rem;   /* 18 — лид, подзаголовок */
  --fs-20: 1.25rem;    /* 20 — заголовок карточки */
  --fs-24: 1.5rem;     /* 24 — заголовок секции */
  --fs-28: 1.75rem;    /* 28 — заголовок страницы на мобильном (НОВЫЙ) */
  --fs-32: 2rem;       /* 32 — заголовок страницы на десктопе */
  --fs-40: 2.5rem;     /* 40 — учебное слово, крупный дисплей */

  /* Роли. Единственное, что видно в модулях. */
  --text-display: var(--fs-40);  /* 404, один крупный акцент на экран */
  --text-h1:      var(--fs-32);  /* заголовок страницы */
  --text-h1-sm:   var(--fs-28);  /* заголовок страницы < 768px */
  --text-h2:      var(--fs-24);  /* заголовок секции */
  --text-h3:      var(--fs-20);  /* заголовок карточки */
  --text-lead:    var(--fs-18);  /* лид, подзаголовок, транскрипция */
  --text-body:    var(--fs-16);  /* текст, кнопка, поле ввода */
  --text-label:   var(--fs-14);  /* подпись поля, вторичный текст, мета */
  --text-caption: var(--fs-12);  /* микро-подпись, бейдж, лицензия */

  --lh-tight: 1.2;
  --lh-normal: 1.5;
  --lh-relaxed: 1.65;

  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;
  --fw-extrabold: 800;

  --ls-tight: -0.02em;
  --ls-normal: 0;
  --ls-wide: 0.02em;
  --ls-caps: 0.08em;

  /* ==== 2. ПОВЕРХНОСТИ ================================================
     Перенастроены: первый шаг canvas→1 сделан больше (1.14:1 → 1.16:1
     по люминансу, но с видимой рамкой 1.43:1), внутренние шаги ровные.
     Глубину даёт не люминанс, а рамка + внутренняя подсветка (§1.4).
     ------------------------------------------------------------------ */
  --surface-canvas: #0A0E18;   /* фон приложения */
  --surface-1: #161E30;        /* карточки, панели, шторки */
  --surface-2: #1E283D;        /* вложенные блоки, hover */
  --surface-3: #283450;        /* поповеры, меню, трек прогресса */
  --surface-4: #34425F;        /* тосты, диалоги */

  /* Колодец (поле ввода, «утопленная» зона) — отдельный уровень. */
  --surface-inset: #101828;

  --glass-bg: rgba(22, 30, 48, 0.78);
  --glass-border: rgba(148, 163, 184, 0.20);
  --glass-blur: blur(14px) saturate(140%);
  --glass-blur-strong: blur(24px) saturate(160%);
  --scrim: rgba(3, 6, 15, 0.68);

  /* ==== 3. ТЕКСТ ===================================================== */
  --text-1: #F1F5F9;   /* основной */
  --text-2: #B7C3D6;   /* вторичный */
  --text-3: #A3B0C4;   /* подписи/мета. Повышен с #93A2BA: на surface-4
                           было 4.17:1 (ниже AA), стало 4.92:1 */
  --text-inverse: #0A0E18;

  /* ==== 4. АКЦЕНТ ==================================================== */
  --accent: #A5B4FC;
  --accent-solid: #818CF8;
  --accent-on-solid: #0A0E18;
  --accent-soft: rgba(129, 140, 248, 0.16);
  --accent-border: rgba(129, 140, 248, 0.45);   /* было .38 — на surface-1
                                                    было 5.76:1, стало 6.31:1 */
  --accent-strong: #6366F1;

  /* ==== 5. СЕМАНТИКА ================================================= */
  --success: #34D399;
  --success-solid: #10B981;
  --success-on-solid: #0A0E18;
  --success-soft: rgba(16, 185, 129, 0.16);
  --success-border: rgba(52, 211, 153, 0.42);

  --danger: #FB7185;
  --danger-solid: #F43F5E;
  --danger-on-solid: #0A0E18;
  --danger-soft: rgba(244, 63, 94, 0.16);
  --danger-border: rgba(251, 113, 133, 0.42);

  --warning: #FBBF24;
  --warning-solid: #F59E0B;
  --warning-on-solid: #241700;
  --warning-soft: rgba(245, 158, 11, 0.16);
  --warning-border: rgba(251, 191, 36, 0.42);

  /* ==== 6. ГРАНИЦЫ ===================================================
     Четыре уровня. --border-card — рамка карточки (1.43:1 к surface-1,
     1.66:1 к canvas). --border-control — единственная граница,
     обязанная держать 3:1 (WCAG 1.4.11).
     ------------------------------------------------------------------ */
  --border-hairline: rgba(148, 163, 184, 0.10);  /* разделители, 1.18:1 */
  --border-subtle:  rgba(148, 163, 184, 0.20);  /* вложенные блоки, 1.43:1 */
  --border-card:    rgba(148, 163, 184, 0.20);  /* рамка карточки (1.43:1) */
  --border-default: rgba(148, 163, 184, 0.30);  /* вторая обводка, 1.75:1 */
  --border-strong:  rgba(148, 163, 184, 0.46);  /* hover, 2.43:1 */
  --border-control: #64748B;                    /* поля/кнопки-обводки, 3.50:1 */

  /* ==== 7. ТЕНИ ======================================================
     Тёмная тема: тень вниз + ВНУТРЕННЯЯ подсветка сверху.
     Именно inset даёт ощущение приподнятости при почти нулевой
     разнице люминансов.
     ------------------------------------------------------------------ */
  --shadow-1: 0 1px 2px rgba(2, 6, 23, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.055);
  --shadow-2: 0 10px 28px -12px rgba(2, 6, 23, 0.78),
              0 2px 6px -2px rgba(2, 6, 23, 0.50),
              inset 0 1px 0 rgba(255, 255, 255, 0.060);
  --shadow-3: 0 24px 48px -18px rgba(2, 6, 23, 0.85),
              inset 0 1px 0 rgba(255, 255, 255, 0.070);
  --shadow-accent: 0 8px 22px -8px rgba(129, 140, 248, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.14);

  /* ==== 8. РАДИУСЫ (без изменений) ================================= */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;

  /* ==== 9. ОТСТУПЫ =================================================== */
  --space-0: 0;  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px;
  --space-10: 40px; --space-12: 48px; --space-16: 64px; --space-20: 80px;

  /* Ритм: ровно три вертикальных шага. Модули используют только их. */
  --gap-tight: 8px;    /* label → input, иконка → текст */
  --gap-inline: 16px;  /* внутри группы: карточка, кнопки, поля */
  --gap-stack: 24px;   /* между блоками внутри экрана */
  --gap-section: 40px; /* между секциями страницы (НОВЫЙ) */

  /* Ширины: по одной на тип экрана. Модули не задают max-width руками. */
  --layout-read: 68ch;      /* длинный текст, описания */
  --layout-form: 720px;     /* формы (Добавить) */
  --layout-learn: 600px;    /* карточка тренировки */
  --layout-content: 1120px; /* Главная, Наборы */
  --layout-wide: 1320px;    /* таблица Хранилища */

  --page-gutter: 32px;      /* переопределяется в медиазапросах ниже */

  /* ==== 10. РАЗМЕРЫ И КОНТРОЛЫ ======================================= */
  --tap-min: 44px;
  --control-h-sm: 36px;
  --control-h-md: 48px;
  --control-h-lg: 56px;
  --icon-sm: 16px; --icon-md: 20px; --icon-lg: 24px; --icon-xl: 32px;

  --header-h: 64px;             /* шапка десктоп (НОВЫЙ) */
  --bottom-nav-height: 60px;   /* таб-бар мобильный (НОВЫЙ, был 68 в коде) */

  /* Медиа в карточке тренировки (НОВЫЙ) */
  --media-learn: 128px;
  --media-learn-sm: 96px;

  /* ==== 11. АНИМАЦИЯ ================================================= */
  --dur-fast: 120ms;
  --dur-base: 180ms;
  --dur-slow: 260ms;
  --dur-skeleton: 1400ms;      /* (НОВЫЙ) = 1400ms как в design-system.md */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 0);

  /* ==== 12. Z-INDEX ================================================== */
  --z-base: 0; --z-sticky: 10; --z-header: 20; --z-scrim: 40;
  --z-drawer: 50; --z-toast: 60; --z-tooltip: 70;

  /* ==== 13. СОСТОЯНИЯ ================================================ */
  /* Глобальный opacity на элементах с текстом ЗАПРЕЩЁН. Для disabled —
     отдельные токены. */
  --opacity-disabled: 0.45;   /* только для иконок без текста */
  --opacity-muted: 0.72;      /* только для декора */
  --veil-hover: rgba(255, 255, 255, 0.06);
  --veil-active: rgba(255, 255, 255, 0.10);

  --control-disabled-bg: var(--surface-2);
  --control-disabled-fg: var(--text-3);   /* 5.69:1 на surface-2 */
  --control-disabled-border: var(--border-hairline);

  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-color: #A5B4FC;

  color-scheme: dark;
}

/* Брейкпоинты как токены — в медиазапросах использовать var(--bp-*) */
@media (max-width: 1023px) {
  :root { --page-gutter: 24px; }
}
@media (max-width: 767px) {
  :root { --page-gutter: 16px; --header-h: 56px; }
}
@media (max-width: 479px) {
  :root { --page-gutter: 16px; }
}
```

### 1.4 Светлая тема — изменённые значения

Структура токенов совпадает 1:1. Меняются только значения:

```css
[data-theme='light'] {
  --surface-canvas: #F1F5F9;
  --surface-1: #FFFFFF;
  --surface-2: #F8FAFC;
  --surface-3: #EDF2F7;
  --surface-4: #E2E8F0;
  --surface-inset: #F1F5F9;

  --glass-bg: rgba(255, 255, 255, 0.82);
  --glass-border: rgba(15, 23, 42, 0.12);
  --scrim: rgba(15, 23, 42, 0.42);

  --text-1: #0F172A;
  --text-2: #475569;
  --text-3: #546479;         /* было #5A6B7F: на surface-4 было 4.43:1,
                                 стало 4.90:1 */
  --text-inverse: #FFFFFF;

  --accent: #4338CA;
  --accent-solid: #4F46E5;
  --accent-on-solid: #FFFFFF;
  --accent-soft: rgba(79, 70, 229, 0.12);   /* было .09 — было 1.14:1 */
  --accent-border: rgba(79, 70, 229, 0.45);  /* было .30 — было 2.09:1,
                                                 стало 2.83:1 */
  --accent-strong: #4338CA;

  --success: #047857;
  --success-solid: #047857;
  --success-on-solid: #FFFFFF;
  --success-soft: rgba(4, 120, 87, 0.10);
  --success-border: rgba(4, 120, 87, 0.32);

  --danger: #BE123C;
  --danger-solid: #E11D48;
  --danger-on-solid: #FFFFFF;
  --danger-soft: rgba(225, 29, 72, 0.10);
  --danger-border: rgba(190, 18, 60, 0.32);

  --warning: #92400E;
  --warning-solid: #B45309;
  --warning-on-solid: #FFFFFF;
  --warning-soft: rgba(180, 83, 9, 0.11);
  --warning-border: rgba(146, 64, 14, 0.32);

  --border-hairline: rgba(15, 23, 42, 0.08);
  --border-subtle:  rgba(15, 23, 42, 0.12);
  --border-card:    rgba(15, 23, 42, 0.12);
  --border-default: rgba(15, 23, 42, 0.18);
  --border-strong:  rgba(15, 23, 42, 0.32);
  --border-control: #64748B;

  /* В светлой теме подсветка сверху не нужна — тень обычная */
  --shadow-1: 0 1px 2px rgba(15, 23, 42, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.90);
  --shadow-2: 0 10px 28px -14px rgba(15, 23, 42, 0.20),
              0 2px 6px -2px rgba(15, 23, 42, 0.08);
  --shadow-3: 0 24px 48px -20px rgba(15, 23, 42, 0.26);
  --shadow-accent: 0 8px 22px -10px rgba(79, 70, 229, 0.38);

  --veil-hover: rgba(15, 23, 42, 0.04);
  --veil-active: rgba(15, 23, 42, 0.07);

  --control-disabled-bg: var(--surface-2);
  --control-disabled-fg: var(--text-3);
  --control-disabled-border: var(--border-hairline);

  --focus-ring-color: #4338CA;

  color-scheme: light;
}
```

### 1.5 Расчётные контрасты (WCAG 2.1, относительная яркость)

AA = 4.5:1 для текста < 24px, 3:1 для крупного ≥ 24px и для границ
интерактивных элементов (WCAG 1.4.11).

#### Тёмная тема (предлагаемые значения)

| Пара | Было | Стало | Оценка |
|---|---|---|---|
| `--text-1` на `--surface-canvas` | 17.86:1 | 16.66:1 | AAA |
| `--text-1` на `--surface-1` | 15.69:1 | 14.33:1 | AAA |
| `--text-1` на `--surface-4` | 9.85:1 | 8.47:1 | AAA |
| `--text-2` на `--surface-1` | 9.65:1 | 8.81:1 | AAA |
| `--text-3` на `--surface-2` | — | 5.35:1 | AA |
| `--text-3` на `--surface-3` | 4.99:1 | 5.28:1 | AA |
| `--text-3` на `--surface-4` | **4.17:1** ✗ | **4.92:1** ✓ | AA (было ниже) |
| `--accent` на `--surface-1` | 8.62:1 | 8.34:1 | AAA |
| `--accent-on-solid` на `--accent-solid` | 6.56:1 | 6.47:1 | AA |
| `--success` на `--success-soft` | — | 7.02:1 | AA |
| `--danger` на `--danger-soft` | — | 5.55:1 | AA |
| `--border-control` на `--surface-1` | 3.61:1 | 3.50:1 | 1.4.11 ✓ |
| `--border-card` на `--surface-1` | — | 1.43:1 | декоративная |
| `--border-card` на `--surface-canvas` | — | 1.66:1 | декоративная |
| disabled-текст `--text-3` на `--surface-2` | **2.14:1** ✗ | **5.35:1** ✓ | AA |

#### Светлая тема

| Пара | Было | Стало |
|---|---|---|
| `--text-1` на `--surface-canvas` | 16.30:1 | 16.30:1 |
| `--text-2` на `--surface-1` | 7.58:1 | 7.58:1 |
| `--text-3` на `--surface-4` | **4.43:1** ✗ | **4.90:1** ✓ |
| `--accent` на `--surface-1` | 7.90:1 | 7.90:1 |
| `--danger-solid` + белый текст | 4.70:1 | 4.70:1 |
| `--success-solid` + белый текст | 5.48:1 | 5.48:1 |

### 1.6 Что даёт «глубина» в тёмной теме

Три слоя, по отдельности почти невидимые, вместе читаются как приподнятость:

```css
/* Card.module.css */
.card {
  background: var(--surface-1);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1);      /* тень вниз + подсветка сверху */
  color: var(--text-1);
}
.elevated {
  box-shadow: var(--shadow-2);
}
```

Правило: **в тёмной теме тень вниз + подсветка сверху. Никогда только тень вниз.**

---

## 2. Типографика: роли вместо размеров

### 2.1 Таблица ролей

| Роль | Токен | Размер | Вес | Где |
|---|---|---|---|---|
| Крупный дисплей | `--text-display` | 40 | 700 | код 404 (1 на экран) |
| Заголовок страницы | `--text-h1` / `--text-h1-sm` | 32 / 28 | 700 | `HomePage`, `WordListsPage`, `StoragePage`, `AddPage` |
| Заголовок секции | `--text-h2` | 24 | 700 | «Поток слов», «Цель на сегодня» |
| Заголовок карточки | `--text-h3` | 20 | 600 | `WordListCard`, `MyLists` |
| Лид | `--text-lead` | 18 | 400 | подзаголовок страницы, транскрипция |
| Базовый текст | `--text-body` | 16 | 400 | текст, кнопка, поле, ячейка |
| Подпись | `--text-label` | 14 | 400/600 | подпись поля, мета, вторичный текст |
| Микро-подпись | `--text-caption` | 12 | 700, uppercase, `ls-caps` | бейдж, лицензия, «NEW» |

### 2.2 Правила

1. В CSS-модулях **нет** прямых `var(--fs-*)`. Только `var(--text-*)`.
2. На одном экране — **не более одного** заголовка `--text-h1`.
3. Уровень заголовка = уровень вложенности, а не настроение. Виджет не может
   ставить `--text-h1`, если страница уже поставила.
4. Мобильный H1 — `--text-h1-sm` (28px), не `--fs-24`. Шаг 28→32 = +14%,
   а не +33%.
5. Все числа, которые меняются в динамике (прогресс, счётчики, «3 / 12»),
   обязаны иметь `font-variant-numeric: tabular-nums`, иначе цифры прыгают.
6. Микро-текст 12px — только uppercase с `--ls-caps` либо `--text-3` при
   контрасте ≥ 4.5:1. Обычный 12px без разрядки — запрещён.

### 2.3 Механизм: один класс на роль

Чтобы убрать разнобой, ввести в `src/shared/ui/` примитивы текста либо
общие классы в `tokens.css`:

```css
/* tokens.css — базовые классы ролей */
.t-display { font-size: var(--text-display); font-weight: var(--fw-bold);
             line-height: var(--lh-tight); letter-spacing: var(--ls-tight);
             color: var(--text-1); margin: 0; }
.t-h1 { font-size: var(--text-h1); font-weight: var(--fw-bold);
        line-height: var(--lh-tight); letter-spacing: var(--ls-tight);
        color: var(--text-1); margin: 0; }
.t-h2 { font-size: var(--text-h2); font-weight: var(--fw-bold);
        line-height: var(--lh-tight); color: var(--text-1); margin: 0; }
.t-h3 { font-size: var(--text-h3); font-weight: var(--fw-semibold);
        line-height: var(--lh-tight); color: var(--text-1); margin: 0; }
.t-lead { font-size: var(--text-lead); font-weight: var(--fw-regular);
          line-height: var(--lh-normal); color: var(--text-2); margin: 0; }
.t-body { font-size: var(--text-body); font-weight: var(--fw-regular);
          line-height: var(--lh-normal); color: var(--text-1); margin: 0; }
.t-label { font-size: var(--text-label); font-weight: var(--fw-semibold);
           line-height: var(--lh-tight); letter-spacing: var(--ls-wide);
           color: var(--text-2); margin: 0; }
.t-caption { font-size: var(--text-caption); font-weight: var(--fw-bold);
             letter-spacing: var(--ls-caps); text-transform: uppercase;
             color: var(--text-3); margin: 0; }
```

Модули используют `composes: t-h1 from '../../styles/tokens.css'` либо
дублируют значения из `--text-*` (без `--fs-*`).

---

## 3. Главный экран тренировки (`LearnPage` + `LearnCard`)

### 3.1 Что сломано сейчас (с расчётом)

**Проблема 1 — картинка перебивает задание.**
`.media { width: 220px; height: 220px; }` — самый крупный элемент на карточке.
Вопрос (слово) — `--fs-40`, но картинка занимает 220×220 = 48 400 px², слово —
примерно 320×48 = 15 360 px². Глаз идёт на картинку, а не на задание.

**Проблема 2 — главное действие уходит за пределы экрана на мобильном.**
Высота стека на 320px при текущих значениях:

```
page padding-top            20
card padding (lg = 24)      24
.top (иконки 44)            44
gap                         16
.media (160 на ≤480)       160
gap                         16
.word (32px, lh 1.2)        38
.meta (кнопка звука 44)     44
gap                         16
.input + label              68
gap                         16
.actions (56+16+48+16+20)  156
────────────────────────────────
                            618 px
```

Виртуальный экран iPhone SE — 568px. **Кнопка «Проверить» ниже первого
экрана.** Это и есть «непонятно, куда кликать»: кнопка есть, но её не видно.

**Проблема 3 — «Показать ответ» и «Пропустить» наезжают друг на друга (320px).**
`.secondary { grid-template-columns: repeat(2, minmax(0, 1fr)); }` +
`.button { white-space: nowrap; }`. Считаем:

```
доступная ширина = 320 − 24 (gutter) × 2 − 24 (card padding) × 2 = 224
две колонки с gap 16 → 104 px на кнопку
«Показать ответ» = иконка 20 + gap 8 + текст ≈ 119 + padding 2×20 = 187 px
переполнение = 187 − 104 = 83 px
```

`minmax(0, 1fr)` разрешает трек сжаться до нуля, `nowrap` не даёт тексту
перенестись → содержимое выходит за трек и **визуально накладывается** на
соседнюю кнопку. Классическая ошибка: нулевой минимум в гриде + `nowrap`.

**Проблема 4 — «Проверить» теряется.**
`.actions` — это колонка: primary, потом 2 secondary, потом подсказка. Вторые
кнопки — `variant="secondary"` = заливка `--surface-2` + рамка `--border-control`.
Акцентная заливка `--accent-solid` на `--surface-2` в тёмной теме контрастнее
не сильно — глаз не различает «главное» и «второстепенное». Плюс `.hint`
в конце — визуальный хвост, который тянет внимание вниз.

**Проблема 5 — прогресс сессии оторван от карточки.**
`<ProgressBar>` рендерится в `LearnPage` над `<LearnCard>` и растянут на всю
ширину `.page` (1120px), а карточка — 560px. Полоса и карточка не связаны.

**Проблема 6 — весь ответ: карточка целиком перекрашивается.**
`.shell.correct { border-color: var(--success-border); background: var(--success-soft); }`
— зелёный фон на всей карточке, включая картинку и поле ввода. Это шум, а не
сигнал.

### 3.2 Иерархия внимания (целевая)

Правило: **размер, насыщенность и контраст убывают строго по этому списку.**

| Ранг | Элемент | Размер | Цвет/заливка | Высота |
|---|---|---|---|---|
| 1 | Учебное слово (вопрос) | `--text-h1` 40 / 32 | `--text-1`, вес 700 | ~48 |
| 2 | Поле ответа | 16 | `--surface-inset` + `--border-control` | 56 / 48 |
| 3 | **«Проверить»** | `--text-body` 16, 600 | **заливка `--accent-solid`**, `--shadow-accent` | 56 |
| 4 | Вердикт (после проверки) | `--text-body` 16 | `--success-soft` / `--danger-soft` | 48 |
| 5 | Прогресс сессии | 12 + 6px полоса | `--text-3` + `--accent-solid` | 24 |
| 6 | Транскрипция | 16 mono | `--text-3` | 24 |
| 7 | Кнопка звука | иконка 18–20 | ghost, `--text-2` | 44 |
| 8 | «Ответ» / «Пропустить» | 16, 600 | ghost, `--text-2` | 44 |
| 9 | Картинка слова | — | `--surface-2` + `--border-subtle` | 96–128 |
| 10 | Подсказка про Enter/Esc | `--text-label` 14 | `--text-3` | 20 |

Инвариант: **ровно одна залитая акцентом кнопка на весь экран** — «Проверить».

### 3.3 Размеры и порядок слоёв карточки

```css
/* LearnCard.module.css */
.shell {
  width: 100%;
  max-width: var(--layout-learn);      /* 600px, а не 560px литералом */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-inline);               /* 16px между слоями */
  padding: var(--space-6);              /* 24px */
}

/* Порядок слоёв — через order, разметка не меняется */
.top        { order: 1; }   /* назад / бейдж / сменить набор */
.progress   { order: 2; }   /* прогресс сессии */
.wordBlock  { order: 3; }   /* ВОПРОС — главный фокус */
.media      { order: 4; }   /* картинка — ниже вопроса, мелко */
.form       { order: 5; }
.verdict    { order: 6; }
.actions    { order: 7; }   /* действие — последнее, но прилипает снизу */
```

```css
/* Вопрос */
.word {
  margin: 0;
  font-size: var(--text-h1);            /* 40px */
  font-weight: var(--fw-bold);
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-tight);
  color: var(--text-1);
  text-align: center;
  overflow-wrap: anywhere;
  hyphens: auto;
}
@media (max-width: 767px) {
  .word { font-size: var(--text-h1-sm); }   /* 28px, а не 32 */
}

/* Транскрипция + звук */
.meta { display: flex; align-items: center; gap: var(--space-2); }
.phonetic {
  font-family: var(--font-mono);
  font-size: var(--text-lead);
  line-height: var(--lh-relaxed);
  color: var(--text-3);
}

/* Картинка — поддержка, не герой */
.media {
  width: var(--media-learn);            /* 128px, было 220px */
  height: var(--media-learn);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  box-shadow: var(--shadow-1);
}
@media (max-width: 767px) {
  .media { width: var(--media-learn-sm); height: var(--media-learn-sm); }  /* 96px */
}
```

### 3.4 Мобильная раскладка — действие прилипает к низу

```css
@media (max-width: 767px) {
  /* Поле ответа крупнее — попадание пальцем */
  .form :global(input) { height: var(--control-h-lg); }   /* 56px */

  /* Блок действий липнет к низу экрана */
  .actions {
    position: sticky;
    bottom: calc(var(--bottom-nav-height) + var(--space-2));
    z-index: var(--z-sticky);
    width: 100%;
    margin: 0 calc(var(--space-4) * -1) calc(var(--space-4) * -1);
    padding: var(--space-3) var(--space-4);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-top: 1px solid var(--glass-border);
  }
}
```

Это решает проблему «кнопка ниже первого экрана» без уменьшения картинки
до нуля: пользователь прокручивает — кнопка всегда под рукой.

### 3.5 Кнопки действий

```css
/* LearnCard.module.css */
.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gap-inline);
}

/* Главная кнопка — единственная залитая */
.primary {
  width: 100%;
  height: var(--control-h-lg);         /* 56px */
}

/* Две второстепенные — ghost, без заливки, они не спорят с primary */
.secondary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap-inline);
}

/* Ниже 420px — в одну колонку, иначе текст наезжает (см. §3.1 проблема 3) */
@media (max-width: 419px) {
  .secondary { grid-template-columns: minmax(0, 1fr); }
}
```

Дополнительно в `Button.module.css` — защита от переполнения в любом контексте:

```css
.button { min-width: 0; }
.content {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

И подписи: на `< 420px` допустимо сокращать «Показать ответ» → «Ответ»
(иконка `eye` уже несёт смысл). Сокращение — копирайт-решение, не CSS.

### 3.6 Правильный и неправильный ответ

Принцип: **результат — это отдельный блок под полем ответа, а не перекраска
всей карточки.**

```css
/* LearnCard.module.css */

/* Карточка НЕ перекрашивается — меняется только рамка */
.shell.correct { border-color: var(--success-border); }
.shell.wrong   { border-color: var(--danger-border); }

/* Блок вердикта */
.verdict {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 48px;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
  line-height: var(--lh-normal);
  color: var(--text-1);
}
.verdictCorrect {
  background: var(--success-soft);
  border: 1px solid var(--success-border);
}
.verdictWrong {
  background: var(--danger-soft);
  border: 1px solid var(--danger-border);
}
.verdictIcon { flex: none; display: inline-flex; }
.verdictCorrect .verdictIcon { color: var(--success); }
.verdictWrong   .verdictIcon { color: var(--danger); }
.verdictLabel { color: var(--text-2); }
.verdictAnswer { font-weight: var(--fw-semibold); color: var(--text-1); }
.verdictWrong .verdictAnswer { color: var(--success); }  /* верный ответ — всегда зелёный */

/* Поле ввода получает тонкий сигнал, без перекраски */
.shell.correct :global(input) {
  border-color: var(--success);
  box-shadow: 0 0 0 3px var(--success-soft);
}
.shell.wrong :global(input) {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-soft);
}
```

Тексты вердикта:

| Случай | Иконка | Текст |
|---|---|---|
| Верно | `check` (20) | «Верно» |
| Неверно | `circle-x` (20) | «Неверно. Правильный ответ: **X**» |
| Показали ответ | `eye` (20) | «Ответ: **X**» |
| Пропущено | `skip-forward` (20) | «Пропущено» |

Требования:
- Иконка **всегда** + текст. Цвет — не единственный носитель смысла.
- Контраст `--success` на `--success-soft` = 7.02:1, `--danger` на
  `--danger-soft` = 5.55:1 — оба AA.
- `aria-live="polite"` на `.verdict` — скринридер объявляет результат.
- Время жизни: текущий `RESULT_HIGHLIGHT_MS = 800` гасит `lastResult`, но
  ответ остаётся раскрытым. **Вердикт должен жить столько же, сколько
  раскрыт ответ** (до следующей карточки), иначе он исчезает, а ответ
  остаётся. Это логика, а не CSS — но фронтендеру нужно знать.

### 3.7 Прогресс сессии

Один прогресс-элемент на экран. Убрать `<ProgressBar>` из `LearnPage.jsx`,
перенести внутрь `LearnCard`.

```jsx
{/* LearnCard.jsx — требует прокинуть progress из LearnPage */}
<div className={styles.progress} aria-label="Прогресс сессии">
  <span className={styles.progressLabel}>Карточка {value + 1} из {total}</span>
  <span className={styles.progressValue}>{value} / {total}</span>
</div>
<ProgressBar value={value} max={total} tone="accent" />
```

```css
.progress {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
}
.progressLabel {
  font-size: var(--text-label);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
.progressValue {
  font-size: var(--text-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  font-variant-numeric: tabular-nums;   /* цифры не прыгают */
}
```

Трек полосы:

```css
/* ProgressBar.module.css */
.track {
  width: 100%;
  height: 6px;                 /* sm */
  overflow: hidden;
  background: var(--surface-3);
  border-radius: var(--radius-pill);
}
.fill {
  height: 100%;
  background: var(--accent-solid);
  border-radius: var(--radius-pill);
  transition: width 240ms var(--ease-out);
}
```

Дополнительно:
- Полоса живёт **внутри** ширины карточки (600px), а не на ширине страницы.
- На мобильном полоса остаётся на месте, но не sticky — она мелкая.
- Счётчик «Карточка N из M» — только текстом. Никаких колец и процентов.
- После последней карточки — `SessionSummary` (см. §3.8).

### 3.8 Схема слоёв (итог)

```
┌ .shell  max-width 600, surface-1, radius-lg, border-card, shadow-2 ──────┐
│ ┌ .top ────────────────────────────────────────────────────────────────┐ │
│ │ [← 44×44 ghost]        [ENGLISH badge]         [≡ 44×44 ghost]     │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ .progress ───────────────────────────────────────────────────────────┐ │
│ │ Карточка 3 из 12                                    3 / 12           │ │
│ │ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                        SUNFLOWER          ← 40/700, центр фокуса           │
│              /ˈsʌnˌflaʊə(r)/  (🔊)     ← 16 mono, --text-3                  │
│                                                                             │
│              ┌──────────┐                                                │
│              │ картинка │                ← 128px (96 на мобильном)          │
│              └──────────┘                                                │
│                                                                             │
│ ┌ .form ─────────────────────────────────────────────────────────────────┐ │
│ │ [ Введите перевод слова…                              🎤 ]  ← 56px     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ┌ .verdict (после проверки) ─────────────────────────────────────────────┐ │
│ │ ✓  Верно                                                               │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ┌ .actions ─────────────────────────────────────────────────────────────┐ │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ ✓  Проверить            ← ЕДИНСТВЕННАЯ заливка accent-solid, 56px │ │ │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ │ [ 👁 Ответ ]        [ ⏭ Пропустить ]   ← ghost, 44px                   │ │
│ │ Enter — проверить, Esc — выйти                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.9 Варианты ответа (`answerMode: choice`)

Кнопки вариантов — те же правила, но в сетке 2×2 и **без** `minmax(0, 1fr)` при
длинных текстах:

```css
.choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  width: 100%;
}
.choice {
  min-height: 56px;
  padding: var(--space-3);
  border: 1px solid var(--border-control);   /* 3:1 — граница обязана быть */
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--text-1);
  font-family: inherit;
  font-size: var(--text-body);
  font-weight: var(--fw-medium);
  text-align: center;
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-out),
              background-color var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
@media (max-width: 419px) {
  .choices { grid-template-columns: minmax(0, 1fr); }
}
```

Состояния выбора — §5.3.

---

## 4. Сетка экранов

### 4.1 Брейкпоинты (объявить в `tokens.css`)

```css
:root {
  --bp-sm: 480px;    /* мелкие контролы в ряд, 2 колонки */
  --bp-md: 768px;    /* нижняя навигация, таблица → карточки */
  --bp-lg: 1024px;   /* верхняя навигация, 2 колонки, боковые панели */
  --bp-xl: 1280px;   /* 4 колонки в сетках */
}
```

Использовать **только** эти. Инлайновые `560px` и `900px` в модулях убрать:
- `560px` → `--bp-sm` (480) — порог «1 колонка в сетке карточек»;
- `900px` → `--bp-lg` (1024) — порог «две колонки / боковая панель».

То есть: `@media (max-width: 560px)` → `@media (max-width: 479px)`,
`@media (max-width: 900px)` → `@media (max-width: 1023px)`.

### 4.2 Контейнеры

```css
.page {
  width: 100%;
  max-width: var(--layout-content);   /* 1120px по умолчанию */
  margin: 0 auto;
  padding: var(--space-8) var(--page-gutter);
}
```

Специальные контейнеры:

| Экран | Контейнер | Токен |
|---|---|---|
| Главная | 1120px | `--layout-content` |
| Учить (карточка) | 600px | `--layout-learn` |
| Учить (выбор набора) | 720px | `--layout-form` |
| Хранилище | 1320px | `--layout-wide` |
| Наборы | 1120px | `--layout-content` |
| Добавить | 1120px (форма 720 + панель 320) | `--layout-content` |
| Описания, лицензии | 68ch | `--layout-read` |

Горизонтальные поля: `--page-gutter` = 32px (≥1024) / 24px (768–1023) / 16px (<768).
Вертикальный ритм страницы: 32px отступ сверху, 40px (`--gap-section`) между
секциями.

### 4.3 Таблица раскладок

| Экран | 320–479 | 480–767 | 768–1023 | 1024–1439 | ≥1440 |
|---|---|---|---|---|---|
| **Главная** | 1 кол., поля 16, CTA во всю ширину | 1 кол., поля 16 | 1 кол., поля 24 | 2 кол.: цель 320px + поток 1fr | 2 кол., max 1120 |
| **Учить** | карточка 1 кол., поле 56px, кнопки 1 кол., actions sticky снизу | карточка 1 кол., кнопки 2 кол. | карточка max 600 центрирована, поле 48px | то же | то же |
| **Хранилище** | 1 кол. карточек | 1 кол. | 2 кол. карточек | 3–4 кол., max 1320 | 4 кол., max 1320 |
| **Наборы** | 1 кол. | 2 кол. (`minmax(160px, 1fr)`, gap 12) | 3 кол. | 4 кол., max 1120 | 4 кол., max 1120 |
| **Мои списки** | 1 кол. карточек | 1 кол. | 2 кол. (`minmax(320px, 1fr)`) | 2–3 кол. | 3 кол., max 1120 |
| **Добавить** | 1 кол., превью 100% сверху | 1 кол., превью inline 96px | 1 кол. + панель 320 справа | 1 кол. + панель 320 справа | то же |

### 4.4 Боковые панели

Правило: **боковая панель — только ≥1024px.** Ниже — она либо становится
строкой над контентом, либо прячется.

```css
/* AddPage.module.css */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: var(--gap-stack);
}
@media (max-width: 1023px) {
  .layout { grid-template-columns: minmax(0, 1fr); }
}

/* Панель липнет к верху и не уезжает при скролле */
.preview {
  position: sticky;
  top: calc(var(--header-h) + var(--space-4));
}
@media (max-width: 1023px) {
  .preview {
    position: static;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--gap-inline);
  }
}
```

Нижняя навигация (мобильная) — единственная «плавающая» полоса:

```css
/* BottomNav.module.css */
.bottom-nav {
  display: none;
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--z-header);
  height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border);
}
@media (max-width: 767px) { .bottom-nav { display: flex; } }
```

И содержимое страницы освобождает место:

```css
/* AppLayout.module.css */
.main { flex: 1; padding-bottom: var(--space-10); }
@media (max-width: 767px) {
  .main {
    padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-8));
  }
}
```

### 4.5 Сетки карточек — единый паттерн

```css
/* Наборы, Хранилище, Мои списки */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--gap-inline);
  align-items: start;
}
@media (max-width: 479px) {
  .grid { grid-template-columns: minmax(0, 1fr); }
}
```

Обязательно `minmax(0, 1fr)` внутри `auto-fill`, если колонки фиксированы —
иначе длинное слово распирает грид. И `align-items: start`, чтобы карточки
разной высоты не растягивались в «резину».

### 4.6 Разбор страницы «Наборы» — что именно сломано

Текущая структура:

```
WordListsPage
├─ .header   → h1 «Наборы слов» + подзаголовок + «В словаре сейчас: N слов»
├─ .tabs     → className={styles.tabs}  ← КЛАССА НЕТ В CSS (grep: 0 совпадений)
├─ tab === 'lists'
│   └─ MyLists
│       ├─ .header → h2 «Мои списки» + подзаголовок + [Новый список] справа
│       └─ .list   → flex-direction: column  ← одна карточка на всю ширину 1120px
└─ tab === 'sets' → .grid карточек наборов
```

Четыре дефекта:

1. **`.tabs` не определён.** Чипы (`Chip` = `inline-flex`) рендерятся как
   инлайн-элементы без контейнера: без `gap`, без трека, без вертикального
   выравнивания. Отсюда «кнопка висит справа».
2. **Дубль заголовка.** Вкладка «Мои списки» + `<h2>Мои списки</h2>` внутри
   `MyLists` — два одинаковых заголовка в 40px друг от друга.
3. **`.list` — колонка, а не сетка.** Карточка списка растягивается на 1120px,
   внутри — две строки текста слева и пустота справа. Это и есть «огромная
   пустая область».
4. **Кнопка «Новый список» висит справа** от `.header` с
   `justify-content: space-between` — потому что заголовок короткий, а
   `.header` растянут на всю ширину.

Исправление (страница владеет заголовком, виджет — нет):

```css
/* WordListsPage.module.css */

/* Вкладки — сегментированный контрол, а не два свободных чипа */
.tabs {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  margin-bottom: var(--gap-stack);
  background: var(--surface-2);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}
.tabs :global(.chip) {
  min-height: 40px;
  border: none;
  background: transparent;
  box-shadow: none;
}
.tabs :global(.chip.active) {
  background: var(--surface-1);
  border-color: var(--border-default);
  color: var(--text-1);
  font-weight: var(--fw-semibold);
  box-shadow: var(--shadow-1);
}
```

```css
/* MyLists.module.css */

/* Заголовок секции — НЕ h2 уровня страницы, а h3 */
.sectionHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--gap-inline);
  flex-wrap: wrap;
  margin-bottom: var(--gap-inline);
}
.sectionTitle {
  margin: 0;
  font-size: var(--text-h3);     /* 20/600 — не дубль заголовка вкладки */
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}
.sectionMeta {
  margin: 0;
  font-size: var(--text-label);
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

/* Сетка вместо колонки */
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--gap-inline);
  align-items: start;
}
@media (max-width: 767px) {
  .list { grid-template-columns: minmax(0, 1fr); }
}

/* Кнопка действия: на мобильном — во всю ширину ПОД заголовком,
   а не «висит справа» */
@media (max-width: 767px) {
  .sectionHead {
    flex-direction: column;
    align-items: stretch;
  }
  .sectionAction { width: 100%; }
}
```

Правило вёрстки: **`.header` с `justify-content: space-between` допустим
только если в правой колонке есть содержимое, выровненное по нижнему краю
(кнопка, счётчик, фильтр).** Для одиночной кнопки на пустом месте — сетка
`grid-template-columns: 1fr auto` с `align-items: end` или перенос на
отдельную строку.

---

## 5. Правила состояний

### 5.1 Сводная таблица

| Примитив | Default | Hover | Focus-visible | Active / pressed | Selected / active | Disabled | Loading |
|---|---|---|---|---|---|---|---|
| **Кнопка primary** | `bg --accent-solid`, `fg --accent-on-solid` | `box-shadow --shadow-accent`, `translateY(-1px)` | `outline 2px --focus-ring-color`, offset 2px | `scale(.98)` | — | `bg --control-disabled-bg`, `fg --control-disabled-fg`, `opacity 1` | `.spinner` 16px, `currentColor`, ширина не меняется |
| **Кнопка secondary** | `bg --surface-2`, `border 1px --border-control` | `bg --surface-3`, `border --border-strong` | то же | `scale(.98)` | — | `bg --surface-1`, `fg --text-3`, `border --border-hairline` | спиннер |
| **Кнопка ghost** | `transparent`, `fg --text-2` | `bg --veil-hover`, `fg --text-1` | то же | `bg --veil-active` | — | `fg --text-3`, `opacity 1` | — |
| **Кнопка danger** | `bg --danger-solid`, `fg --danger-on-solid` | `box-shadow --shadow-2` | то же | `scale(.98)` | — | как primary | — |
| **Иконка-кнопка** | ghost / secondary / danger / accent | `bg --veil-hover` (ghost), `bg --surface-3` (secondary) | то же | `scale(.96)` | — | `opacity --opacity-disabled` (иконка без текста — можно) | — |
| **Chip / вкладка** | `bg --surface-2`, `border --border-subtle`, `fg --text-2` | `bg --surface-3`, `fg --text-1` | то же | `bg --surface-3` | `bg --accent-soft`, `border --accent-border`, `fg --accent`, `fw-semibold`, `aria-selected="true"` | `opacity --opacity-disabled` | — |
| **Поле ввода** | `bg --surface-inset`, `border 1px --border-control`, `fg --text-1` | `border-color --border-strong` | `outline 2px --accent`, `outline-offset 0`, `border-color --accent` | — | `bg --surface-2`, `fg --text-1` | `bg --surface-1`, `fg --text-3`, `cursor not-allowed` | `bg --surface-2` |
| **Поле ввода — ошибка** | `border-color --danger` + `aria-invalid="true"` | — | кольцо `--danger` | — | — | — | — |
| **Карточка** | `bg --surface-1`, `border 1px --border-card`, `shadow-1` | `border --accent-border`, `shadow-2`, `translateY(-2px)` | `outline 2px --focus-ring-color`, offset 2px | `translateY(0)`, `shadow-1` | — | `opacity --opacity-muted` + `pointer-events: none` | скелетоны той же формы |
| **Карточка — ссылка** | + `cursor: pointer` | + `border --accent-border` | то же | — | — | — | — |
| **Строка таблицы** | `bg transparent` | `bg --veil-hover` | то же | `bg --veil-active` | `bg --accent-soft` | `fg --text-3` | скелетоны строк |
| **Вариант ответа** | `bg --surface-2`, `border --border-control` | `bg --surface-3`, `border --accent-border` | то же | `scale(.98)` | `bg --accent-soft`, `border --accent-border` | `opacity --opacity-disabled` | — |

### 5.2 Фокус — одно кольцо

```css
/* tokens.css */
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Поля: без второго кольца — только рамка + одно кольцо */
:where(input, textarea, select):focus-visible {
  border-color: var(--accent);
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: 0;
  box-shadow: none;        /* убрать 0 0 0 3px var(--accent-soft) */
}
```

Требования:
- Кольцо 2px, цвет `--focus-ring-color` = 8.34:1 на `--surface-1` — AA с запасом.
- `outline-offset: 2px` для кнопок (кольцо не режется фоном), `0` для полей
  (иначе кольцо уезжает за границу поля).
- Никогда `outline: none` без замены.
- Фокус не должен перекрываться: у `.card:focus-visible` кольцо рисуется
  поверх, `overflow: hidden` на карточке не использовать.

### 5.3 Disabled — без глобального opacity

```css
/* Button.module.css */
.button:disabled {
  opacity: 1;                      /* снимаем глобальный 0.45 */
  background: var(--control-disabled-bg);
  color: var(--control-disabled-fg);
  border-color: var(--control-disabled-border);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
```

Для `variant="primary"` disabled — та же база (никакого акцента).
`--text-3` на `--surface-2` = 5.35:1 — текст читаем.

`opacity` остаётся допустимым только там, где нет текста:
иконка-кнопка, чип, точка статуса, декоративная иконка.

### 5.4 Пустое состояние

Проблема сейчас: `EmptyState.module.css` — `padding: var(--space-10) var(--space-6)`
(80px сверху и снизу) + центрированная иконка 64px в круге `--surface-2`
(выглядит как «выключенный» элемент) + текст. На странице 1120px шириной это
пол-экрана пустоты.

```css
/* EmptyState.module.css */
.wrapper {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  max-width: 460px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);   /* 32px, не 80px */
  text-align: center;
}
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg);
  color: var(--accent);
}
.title {
  margin: 0;
  font-size: var(--text-h3);          /* 20/600 */
  font-weight: var(--fw-semibold);
  line-height: var(--lh-tight);
  color: var(--text-1);
}
.description {
  margin: 0;
  max-width: 40ch;
  font-size: var(--text-body);
  line-height: var(--lh-relaxed);
  color: var(--text-2);
}
.action { margin-top: var(--space-2); }
```

Правила:
- Пустое состояние — **не на весь экран**. Максимум 1/3 высоты первого экрана.
- Всегда: иконка 56px + заголовок 20/600 + описание 16 + **одна** кнопка
  действия. Никаких двух кнопок в пустом состоянии.
- Иконка в акцентной подложке (`--accent-soft`), а не в серой — пустое
  состояние это приглашение, а не отказ.
- Если на странице есть действие вне пустого состояния (например «Новый
  список» в шапке), кнопку в пустом состоянии не дублировать — вместо неё
  текст-подсказка.

### 5.5 Загрузка (скелетон)

Скелетон обязан повторять **форму** будущего содержимого, иначе после загрузки
контент прыгает.

```css
/* Skeleton.module.css */
.skeleton {
  position: relative;
  display: block;
  overflow: hidden;
  background: var(--surface-2);
  border-radius: var(--radius-xs);
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, var(--surface-4), transparent);
  animation: skeleton-shimmer var(--dur-skeleton) linear infinite;  /* 1400ms */
}
```

- Внутри карточки (`--surface-1`) скелетон ставится на `--surface-3`, иначе
  «дыра». Добавить вариант `.skeletonInCard { background: var(--surface-3); }`.
- Заглушка сетки — столько же карточек, сколько придёт, с теми же
  `minmax()`, что и у боевой сетки.
- Для списков — 6–8 строк, а не 3.
- Спиннер — только для действий (кнопка), не для контента.

### 5.6 Ошибка

```css
.error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--danger-soft);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  color: var(--danger);          /* 5.55:1 на danger-soft */
  font-size: var(--text-label);
}
```

- Иконка `circle-alert` + текст. Контраст `--danger` на `--danger-soft` = 5.55:1.
- `role="alert"` — обязательно.
- Если есть действие «Повторить» — кнопка `secondary` справа от текста,
  на мобильном во всю ширину под текстом.
- Ошибка загрузки **не** занимает весь экран — это баннер в потоке контента.

### 5.7 Активное/выбранное (не только цветом)

| Случай | Цвет | Форма/вес | ARIA |
|---|---|---|---|
| Активная вкладка | `--accent` | `fw-semibold`, трек `--surface-1` | `aria-selected="true"` |
| Выбранный вариант ответа | `--accent` | `border --accent-border`, `bg --accent-soft` | `aria-pressed` |
| Активная строка таблицы | `--accent` | левая полоса 3px `--accent-solid` | `aria-current` |
| Точка статуса слова | `--success`/`--accent`/`--text-3` | круг 8px + текстовая метка | текст рядом |

Ни одно состояние не передаётся **только** цветом.

---

## 6. Визуальные антипаттерны

Список «не делать». Каждый пункт — с уже существующим примером из проекта.

| # | Антипаттерн | Почему плохо | Как правильно | Где был |
|---|---|---|---|---|
| A1 | **Три кнопки одного виса на экране** | Глаз не выбирает, все равны | Максимум **одна** залитая акцентом. Остальные — secondary/ghost | `HomePage`: primary + 2 secondary в одном блоке |
| A2 | **Заголовок виджета дублирует заголовок вкладки** | Шум, два «центра» на экране | Уровень заголовка = уровень вложенности. Виджет не повторяет заголовок страницы | `MyLists`: вкладка «Мои списки» + `<h2>Мои списки</h2>` |
| A3 | **Действие «висит» в пустом пространстве** | `space-between` на пустом контейнере отодвигает кнопку в поле, где её не ищут | `grid-template-columns: 1fr auto` + `align-items: end`, или кнопка на отдельной строке | `MyLists`: «Новый список» справа от короткого заголовка |
| A4 | **`minmax(0, 1fr)` + `white-space: nowrap`** | Трек сжимается до 0, текст выходит за границу и **наезжает** на соседа | `minmax(min-content, 1fr)` для текстовых кнопок либо 1 колонка на узких экранах | `LearnCard .secondary` на 320px |
| A5 | **Иллюстрация 220px выше задания** | Вопрос теряется, тренировка превращается в галерею | Иллюстрация ≤128px (96 на мобильном) и **ниже** вопроса | `LearnCard .media` |
| A6 | **Главное действие ниже первого экрана** | Кнопка есть, её не видно → «куда кликать» | Sticky-блок действий + высота стека ≤568px | `LearnCard` на 320×568 |
| A7 | **Глобальный `opacity: 0.45` на кнопке с текстом** | Контраст падает до 2.14:1, текст нечитаем | Отдельные `--control-disabled-*` токены | `Button.module.css .button:disabled` |
| A8 | **Вся карточка перекрашивается в зелёный/розовый** | Шум: сигнал теряется среди заливки, теряется фокус на ответе | Менять 1px рамку + отдельный блок вердикта | `LearnCard .shell.correct` |
| A9 | **Три уровня заголовков подряд (32 → 24 → 20)** | Иерархия не читается | Не более одного `--text-h1`; ниже — максимум h2 → h3 | `WordListsPage`: h1 + `MyLists` h2 + `.name` 18px |
| A10 | **Пустое состояние с `padding: 80px`** | Пол-экрана ни о чём | `padding: 32px`, `max-width: 460px`, одна кнопка | `EmptyState.module.css` |
| A11 | **Hairline `rgba(...,0.14)` на тёмном фоне** | Граница = 1.26:1, невидима; карточка сливается с фоном | `--border-card` 0.20 + `inset` подсветка сверху | `Card.module.css` |
| A12 | **Тень темнее фона в тёмной теме** | Не читается как подъём | Тень вниз **+** внутренняя подсветка сверху | `--shadow-1` |
| A13 | **Разные максимальные ширины, зашитые в модули** (560 / 600 / 720 / 1120 / 1300) | Документ и код расходятся, ширина «прыгает» между страницами | Пять токенов `--layout-*` | `LearnCard` 560, `LearnSetup` 720, `AddPage` 700, design-system 1300 |
| A14 | **Брейкпоинты 480 / 560 / 767 / 900 в модулях** | 4 порога, два не описаны в дизайн-системе | 4 токена `--bp-*`, использовать только их | `WordListsPage`, `StoragePage`, `AddPage`, `HomePage` |
| A15 | **Два прогресс-элемента на одном экране** | Непонятно, какой из них главный | Один прогресс, внутри карточки | `LearnPage` (ProgressBar) + трек внутри `LearnCard` |
| A16 | **Прогресс на ширине страницы, карточка — на 560px** | Полоса и карточка не связаны, выглядит как чужой элемент | Полоса по ширине карточки | `LearnPage` |
| A17 | **`justify-content: space-between` на контейнере с одним ребёнком** | Ребёнок прижат к краю, середина пустая | `flex: 1` / `grid: 1fr auto` / перенос | общий паттерн |
| A18 | **Цвет как единственный носитель смысла** | Не читается при дальтонизме | Иконка + текст + цвет | `.dot` в `WordFlow` — правильно; в выпадающих списках — нет |
| A19 | **Основной текст ≤13px** | Нечитаемо, ниже порога восприятия | Минимум `--text-label` 14px; 12px только uppercase | `MyLists .meta` = 12px — на грани, поднять до 14 |
| A20 | **Двойное кольцо фокуса на полях** | Шум, два концентрических кольца | Одно кольцо + цвет рамки | `tokens.css` |
| A21 | **Пустой `.list` (flex-колонка) с широкими карточками** | Карточка 1120px с двумя словами = огромная пустота | Сетка `minmax(320px, 1fr)` | `MyLists .list` |
| A22 | **Скелетон темнее/сливается с карточкой** | Заглушка выглядит дырой | `--surface-3` внутри карточки | `Skeleton.module.css` |
| A23 | **Пять «главных» действий в навигации** | Непонятно, куда идти | 5 пунктов навигации = 5 равных, но **один** главный CTA на странице | `AppHeader` + `BottomNav` |
| A24 | **Микро-текст без разрядки** | «шЁлСлово» читается как каша | `text-transform: uppercase` + `--ls-caps` | `--fs-12` без трансформации |

---

## 7. Порядок внедрения

1. **Токены.** Обновить `src/styles/tokens.css` по §1.3–1.4. Добавить
   `--text-*`, `--layout-*`, `--bp-*`, `--border-card`, `--surface-inset`,
   `--bottom-nav-height`, `--media-learn`, `--dur-skeleton`.
2. **Базовые классы текста.** Добавить `.t-*` в `tokens.css` (§2.3).
3. **Примитивы.** `Button` (disabled без opacity, min-width: 0), `Card`
   (`--border-card`, `--shadow-1`), `EmptyState` (§5.4), `Skeleton` (§5.5),
   `ProgressBar` (трек `--surface-3`, 240ms), `Input` (одно кольцо фокуса).
4. **Экран тренировки.** `LearnCard` + `LearnPage` по §3.
5. **Сетка.** Заменить литеральные `max-width` на `--layout-*`, инлайновые
   брейкпоинты на `--bp-*` (§4).
6. **Страница «Наборы».** Класс `.tabs`, сетка `.list`, шапка секции (§4.6).
7. **Пустые состояния и загрузка** на всех страницах (§5.4–5.6).
8. **Проверка.** Таблица §7.1.

### 7.1 Чек-лист приёмки

- [ ] На любом экране ровно одна кнопка с заливкой `--accent-solid`.
- [ ] Заголовки на экране: один `--text-h1`, дальше только `--text-h2/--text-h3`.
- [ ] В `*.module.css` нет ни одного `var(--fs-*)` — только `var(--text-*)`.
- [ ] В `*.module.css` нет литеральных `max-width` ширин — только `var(--layout-*)`.
- [ ] Все медиазапросы используют `var(--bp-*)`; значений 480/560/767/900 не осталось.
- [ ] Карточка на тёмном фоне читается как приподнятая (рамка ≥1.4:1 к фону).
- [ ] Disabled-кнопка: текст ≥4.5:1, `opacity` не используется.
- [ ] Фокус — одно кольцо, 2px, ≥3:1 к соседнему цвету, видно с клавиатуры.
- [ ] 320px: кнопки не наезжают, главное действие видно без скролла
      (или прилипает к низу).
- [ ] 768px: нижняя навигация, одна колонка, поля 24px.
- [ ] 1440px: контент ≤ `--layout-content`, поля ≥32px, не растянут.
- [ ] Пустое состояние ≤1/3 первого экрана, одна кнопка.
- [ ] Скелетоны повторяют форму боевого контента, переход без прыжка.
- [ ] Все значения контраста из §1.5 пересчитаны и проходят AA.

---

## 8. Приложение: быстрые справочные значения

```
Горизонтальные поля      16 / 24 / 32      (<768 / 768–1023 / ≥1024)
Вертикальный ритм        8 / 16 / 24 / 40  (gap-tight / inline / stack / section)
Ширины                   600 learn · 720 form · 1120 content · 1320 wide
Карточка тренировки      макс 600, padding 24, внутренние gap 16
Картинка слова           128 десктоп / 96 мобильный
Поле ответа              56 мобильный / 48 десктоп
Кнопка «Проверить»       56, заливка accent-solid, единственная на экране
Кнопки второстепенные    44, ghost, текст --text-2
Прогресс                 трек 6px, --surface-3, заливка --accent-solid, 240ms
Тап-таргет               44×44 минимум, 8px между интерактивными
Нижняя навигация         60px + env(safe-area-inset-bottom)
```
