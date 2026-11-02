-- Généré par scripts/generate-seed.mjs depuis lib/seed/catalog.json — ne pas éditer à la main.
-- Catalogue de départ : modules publiés, chapitres sans vidéo (à renseigner dans le back-office).
begin;
insert into public.organizations (name, kind, city)
select 'CCAS de Trappes', 'CCAS', 'Trappes'
where not exists (select 1 from public.organizations where name = 'CCAS de Trappes');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('decouvrir-yoovi', 'Découvrir Yoovi', 'Comprendre ce qu''est Yoovi, comment il fonctionne et ce qu''il apporte aux élèves.', 'Comprendre ce qu''est Yoovi, son fonctionnement et sa proposition de valeur.', 'compass', 'violet', 0, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, position, status)
select id, 'Présentation générale de Yoovi', 0, 'published' from public.modules where slug = 'decouvrir-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'decouvrir-yoovi' and l.title = 'Présentation générale de Yoovi');
insert into public.lessons (module_id, title, position, status)
select id, 'La mission et le fonctionnement de Yoovi', 1, 'published' from public.modules where slug = 'decouvrir-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'decouvrir-yoovi' and l.title = 'La mission et le fonctionnement de Yoovi');
insert into public.lessons (module_id, title, position, status)
select id, 'À qui s''adresse Yoovi ?', 2, 'published' from public.modules where slug = 'decouvrir-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'decouvrir-yoovi' and l.title = 'À qui s''adresse Yoovi ?');
insert into public.lessons (module_id, title, position, status)
select id, 'Comment Yoovi accompagne les élèves', 3, 'published' from public.modules where slug = 'decouvrir-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'decouvrir-yoovi' and l.title = 'Comment Yoovi accompagne les élèves');
insert into public.lessons (module_id, title, position, status)
select id, 'Les principales fonctionnalités de la plateforme', 4, 'published' from public.modules where slug = 'decouvrir-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'decouvrir-yoovi' and l.title = 'Les principales fonctionnalités de la plateforme');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('prendre-en-main-la-plateforme', 'Prendre en main la plateforme', 'Apprendre à utiliser concrètement Yoovi, de la création du compte au suivi de la progression.', 'Apprendre à utiliser concrètement Yoovi.', 'mouse-pointer-click', 'bleu', 1, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, position, status)
select id, 'Présentation de l''interface', 0, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Présentation de l''interface');
insert into public.lessons (module_id, title, position, status)
select id, 'Création et gestion d''un compte', 1, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Création et gestion d''un compte');
insert into public.lessons (module_id, title, position, status)
select id, 'Navigation dans les différentes salles', 2, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Navigation dans les différentes salles');
insert into public.lessons (module_id, title, position, status)
select id, 'Utilisation des salles par matière', 3, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Utilisation des salles par matière');
insert into public.lessons (module_id, title, position, status)
select id, 'Comprendre les parcours de révision', 4, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Comprendre les parcours de révision');
insert into public.lessons (module_id, title, position, status)
select id, 'Utiliser les quiz et les flashcards', 5, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Utiliser les quiz et les flashcards');
insert into public.lessons (module_id, title, position, status)
select id, 'Générer et consulter des cartes mentales', 6, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Générer et consulter des cartes mentales');
insert into public.lessons (module_id, title, position, status)
select id, 'Suivre sa progression', 7, 'published' from public.modules where slug = 'prendre-en-main-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'prendre-en-main-la-plateforme' and l.title = 'Suivre sa progression');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('accompagner-les-utilisateurs', 'Accompagner les utilisateurs', 'Savoir présenter Yoovi à un élève et l''accompagner vers une utilisation pédagogique.', 'Comprendre comment accompagner les élèves dans l''utilisation de Yoovi.', 'hand-heart', 'rose', 2, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, position, status)
select id, 'Comment présenter Yoovi à un élève ?', 0, 'published' from public.modules where slug = 'accompagner-les-utilisateurs'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'accompagner-les-utilisateurs' and l.title = 'Comment présenter Yoovi à un élève ?');
insert into public.lessons (module_id, title, position, status)
select id, 'Comment expliquer le fonctionnement de l''IA ?', 1, 'published' from public.modules where slug = 'accompagner-les-utilisateurs'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'accompagner-les-utilisateurs' and l.title = 'Comment expliquer le fonctionnement de l''IA ?');
insert into public.lessons (module_id, title, position, status)
select id, 'Comment encourager une utilisation pédagogique ?', 2, 'published' from public.modules where slug = 'accompagner-les-utilisateurs'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'accompagner-les-utilisateurs' and l.title = 'Comment encourager une utilisation pédagogique ?');
insert into public.lessons (module_id, title, position, status)
select id, 'Les bonnes pratiques d''accompagnement', 3, 'published' from public.modules where slug = 'accompagner-les-utilisateurs'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'accompagner-les-utilisateurs' and l.title = 'Les bonnes pratiques d''accompagnement');
insert into public.lessons (module_id, title, position, status)
select id, 'Les réponses aux questions fréquentes', 4, 'published' from public.modules where slug = 'accompagner-les-utilisateurs'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'accompagner-les-utilisateurs' and l.title = 'Les réponses aux questions fréquentes');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('ressources-et-bonnes-pratiques', 'Ressources et bonnes pratiques', 'Guides d''utilisation, tutoriels complémentaires, documents PDF et ressources pédagogiques.', 'Centraliser les ressources utiles aux partenaires.', 'library', 'jaune', 3, 'published')
on conflict (slug) do nothing;
commit;
