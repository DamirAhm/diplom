Исследователь (researchers)
Описание: Основная сущность, представляющая исследователя в системе. Содержит информацию о личных данных, научных профилях и метриках.
Таблица 2 - researchers

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| name_id | Имя исследователя | INTEGER | FK -> localized_strings |
| last_name_id | Фамилия исследователя | INTEGER | FK -> localized_strings |
| position_id | Должность | INTEGER | FK -> localized_strings |
| photo | Фотография | TEXT | |
| bio_id | Биография | INTEGER | FK -> localized_strings, nullable |
| research_gate | Профиль ResearchGate | TEXT | nullable |
| google_scholar | Профиль Google Scholar | TEXT | nullable |
| scopus | Профиль Scopus | TEXT | nullable |
| publons | Профиль Publons | TEXT | nullable |
| orcid | Профиль ORCID | TEXT | nullable |
| total_citations | Общее количество цитирований | INTEGER | default 0 |
| h_index | Индекс Хирша | INTEGER | default 0 |
| recent_citations | Недавние цитирования | INTEGER | default 0 |
| recent_h_index | Недавний индекс Хирша | INTEGER | default 0 |

Публикация (publications)
Описание: Научные публикации исследователей. Может иметь как внутренних (из системы), так и внешних авторов.
Таблица 3 - publications

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| title_id | Название публикации | INTEGER | FK -> localized_strings |
| journal | Название журнала | TEXT | |
| published_at | Дата публикации | TEXT | |
| citations_count | Количество цитирований | INTEGER | default 0 |
| link | Ссылка на публикацию | TEXT | |
| visible | Видимость публикации | BOOLEAN | default 0 |

Проект (projects)
Описание: Исследовательские проекты, которые могут включать публикации, видео и изображения.
Таблица 4 - projects

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| title_id | Название проекта | INTEGER | FK -> localized_strings |
| description_id | Описание проекта | INTEGER | FK -> localized_strings, nullable |
| github_link | Ссылка на GitHub | TEXT | nullable |

Дисциплина (disciplines)
Описание: Научные дисциплины, к которым относятся исследователи.
Таблица 5 - disciplines

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| title_id | Название дисциплины | INTEGER | FK -> localized_strings |
| description_id | Описание дисциплины | INTEGER | FK -> localized_strings |
| image | Изображение дисциплины | TEXT | |

Учебный материал (training_materials)
Описание: Учебные материалы, доступные в системе.
Таблица 6 - training_materials

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| title_id | Название материала | INTEGER | FK -> localized_strings |
| description_id | Описание материала | INTEGER | FK -> localized_strings |
| url | Ссылка на материал | TEXT | |
| image | Изображение материала | TEXT | |

Партнер (partners)
Описание: Организации-партнеры (университеты и предприятия).
Таблица 7 - partners

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| name | Название партнера | TEXT | |
| logo | Логотип партнера | TEXT | |
| url | Ссылка на сайт партнера | TEXT | |
| type | Тип партнера | TEXT | CHECK(type IN ('university', 'enterprise')) |

Локализованная строка (localized_strings)
Описание: Вспомогательная таблица для хранения 
текстов на разных языках.
Таблица 8 - localized_strings

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| en | Текст на английском | TEXT | |
| ru | Текст на русском | TEXT | |

Связующие таблицы:

Таблица 9 - researcher_publications

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| researcher_id | ID исследователя | INTEGER | PK, FK -> researchers |
| publication_id | ID публикации | INTEGER | PK, FK -> publications |

Таблица 10 - publication_authors

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| publication_id | ID публикации | INTEGER | PK, FK -> publications |
| researcher_id | ID исследователя | INTEGER | PK, FK -> researchers |

Таблица 11 - publication_external_authors

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| publication_id | ID публикации | INTEGER | FK -> publications |
| name_id | Имя внешнего автора | INTEGER | FK -> localized_strings |

Таблица 12 - project_publications

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| title_id | Название публикации | INTEGER | FK -> localized_strings |
| link | Ссылка на публикацию | TEXT | |
| project_id | ID проекта | INTEGER | FK -> projects, nullable |

Таблица 13 - project_videos

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| title_id | Название видео | INTEGER | FK -> localized_strings |
| embed_url | URL для встраивания | TEXT | |
| project_id | ID проекта | INTEGER | FK -> projects, nullable |

Таблица 14 - project_images

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| id | Уникальный идентификатор | INTEGER | PK |
| project_id | ID проекта | INTEGER | FK -> projects |
| url | URL изображения | TEXT | |
| image_order | Порядок изображения | INTEGER | |

Таблица 15 - discipline_researchers

| Поле | Описание | Тип | Особенности |
|------|-----------|-----|-------------|
| discipline_id | ID дисциплины | INTEGER | PK, FK -> disciplines |
| researcher_id | ID исследователя | INTEGER | PK, FK -> researchers |