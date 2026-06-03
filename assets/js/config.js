/* ============================================================
   SNEAKER INTERACTION — конфигурация Supabase
   ------------------------------------------------------------
   Project Settings → API keys:
     • SUPABASE_URL        — Project URL (только базовый адрес,
                             без /rest/v1).
     • SUPABASE_ANON_KEY   — Publishable key (sb_publishable_…).
                             Это публичный клиентский ключ.

   НЕ вставляйте сюда Secret key (sb_secret_…) — он серверный
   и даёт полный доступ в обход прав. В коде фронтенда ему не место.

   Publishable-ключ безопасно держать в коде — доступ к данным
   ограничивают политики RLS на стороне базы (см. README и
   supabase-setup.sql).

   Пока SUPABASE_ANON_KEY — плейсхолдер, сайт работает локально
   (каталог из data.js + localStorage), без облака и без входа.
   ============================================================ */
window.SI_CONFIG = {
  SUPABASE_URL: "https://otwfusrhxbqzcizurebm.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_i5UfXODpIPRiE68Q44c3XQ_Vhc3qqIo",
};
