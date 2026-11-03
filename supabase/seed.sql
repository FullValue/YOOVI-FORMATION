-- Généré par scripts/generate-seed.mjs depuis lib/seed/catalog.json — ne pas éditer à la main.
-- Catalogue de départ : modules publiés, chapitres avec leurs vidéos (public/videos).
begin;
insert into public.organizations (name, kind, city)
select 'Yoovi', 'Autre', null
where not exists (select 1 from public.organizations where name = 'Yoovi');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('tour-de-la-plateforme', 'Le tour de la plateforme', 'Suivre le parcours d''un élève, de sa première connexion jusqu''à la salle virtuelle.', 'Connaître les espaces de Yoovi et savoir s''y repérer.', 'compass', 'violet', 0, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Le questionnaire d''arrivée', 'file', '/videos/m1-1.mp4', 75, 0, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'Le questionnaire d''arrivée');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Le tableau de bord', 'file', '/videos/m1-2.mp4', 34, 1, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'Le tableau de bord');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Les salles d''étude', 'file', '/videos/m1-3.mp4', 16, 2, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'Les salles d''étude');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Notes & cartes mentales', 'file', '/videos/m1-4.mp4', 29, 3, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'Notes & cartes mentales');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'L''historique d''activité', 'file', '/videos/m1-5.mp4', 21, 4, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'L''historique d''activité');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Le suivi des notes', 'file', '/videos/m1-6.mp4', 29, 5, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'Le suivi des notes');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Le compte & l''espace parent', 'file', '/videos/m1-7.mp4', 18, 6, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'Le compte & l''espace parent');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'La salle virtuelle', 'file', '/videos/m1-8.mp4', 90, 7, 'published' from public.modules where slug = 'tour-de-la-plateforme'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'tour-de-la-plateforme' and l.title = 'La salle virtuelle');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('une-salle-en-action', 'Une salle en action', 'Voir une salle de maths fonctionner : question, explication adaptée, exercices et correction de copie.', 'Savoir utiliser une salle d''étude du début à la fin.', 'monitor-play', 'bleu', 1, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Entrer dans la salle de maths', 'file', '/videos/m2-1.mp4', 36, 0, 'published' from public.modules where slug = 'une-salle-en-action'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'une-salle-en-action' and l.title = 'Entrer dans la salle de maths');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Poser sa question', 'file', '/videos/m2-2.mp4', 16, 1, 'published' from public.modules where slug = 'une-salle-en-action'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'une-salle-en-action' and l.title = 'Poser sa question');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Une explication adaptée', 'file', '/videos/m2-3.mp4', 30, 2, 'published' from public.modules where slug = 'une-salle-en-action'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'une-salle-en-action' and l.title = 'Une explication adaptée');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'S''entraîner avec des exercices', 'file', '/videos/m2-4.mp4', 25, 3, 'published' from public.modules where slug = 'une-salle-en-action'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'une-salle-en-action' and l.title = 'S''entraîner avec des exercices');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Se faire aider sur un exercice', 'file', '/videos/m2-5.mp4', 26, 4, 'published' from public.modules where slug = 'une-salle-en-action'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'une-salle-en-action' and l.title = 'Se faire aider sur un exercice');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Faire corriger sa copie', 'file', '/videos/m2-6.mp4', 31, 5, 'published' from public.modules where slug = 'une-salle-en-action'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'une-salle-en-action' and l.title = 'Faire corriger sa copie');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('espace-parent', 'L''espace parent', 'Découvrir ce que les parents voient : tableau de bord, détail par matière et assistant parent.', 'Accompagner les familles dans le suivi de leur enfant.', 'users', 'rose', 2, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Accéder à l''espace parent', 'file', '/videos/m3-1.mp4', 32, 0, 'published' from public.modules where slug = 'espace-parent'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'espace-parent' and l.title = 'Accéder à l''espace parent');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Le tableau de bord parent', 'file', '/videos/m3-2.mp4', 22, 1, 'published' from public.modules where slug = 'espace-parent'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'espace-parent' and l.title = 'Le tableau de bord parent');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Le détail par matière', 'file', '/videos/m3-3.mp4', 38, 2, 'published' from public.modules where slug = 'espace-parent'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'espace-parent' and l.title = 'Le détail par matière');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'L''assistant parent', 'file', '/videos/m3-4.mp4', 56, 3, 'published' from public.modules where slug = 'espace-parent'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'espace-parent' and l.title = 'L''assistant parent');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('reviser-avec-yoovi', 'Réviser avec Yoovi', 'Comprendre une notion, se tester, revoir ses erreurs, puis mémoriser avec flashcards, notes et cartes mentales.', 'Maîtriser les outils de révision de Yoovi.', 'graduation-cap', 'jaune', 3, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Comprendre une notion', 'file', '/videos/m4-1.mp4', 49, 0, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Comprendre une notion');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Se tester avec un quiz', 'file', '/videos/m4-2.mp4', 25, 1, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Se tester avec un quiz');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Lire ses résultats', 'file', '/videos/m4-3.mp4', 12, 2, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Lire ses résultats');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Revoir ses erreurs', 'file', '/videos/m4-4.mp4', 31, 3, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Revoir ses erreurs');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Réflexion avancée & schémas', 'file', '/videos/m4-5.mp4', 48, 4, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Réflexion avancée & schémas');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'L''exercice rapide', 'file', '/videos/m4-6.mp4', 45, 5, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'L''exercice rapide');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Mémoriser avec les flashcards', 'file', '/videos/m4-7.mp4', 58, 6, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Mémoriser avec les flashcards');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Notes & cartes mentales', 'file', '/videos/m4-8.mp4', 48, 7, 'published' from public.modules where slug = 'reviser-avec-yoovi'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'reviser-avec-yoovi' and l.title = 'Notes & cartes mentales');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('salle-guidee', 'La salle guidée', 'Une session pas à pas : six étapes pour maîtriser une notion, avec des panneaux d''aide.', 'Savoir lancer et suivre une session guidée.', 'puzzle', 'violet', 4, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Lancer une session guidée', 'file', '/videos/m5-1.mp4', 37, 0, 'published' from public.modules where slug = 'salle-guidee'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'salle-guidee' and l.title = 'Lancer une session guidée');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Six étapes pour maîtriser', 'file', '/videos/m5-2.mp4', 56, 1, 'published' from public.modules where slug = 'salle-guidee'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'salle-guidee' and l.title = 'Six étapes pour maîtriser');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Les panneaux d''aide', 'file', '/videos/m5-3.mp4', 40, 2, 'published' from public.modules where slug = 'salle-guidee'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'salle-guidee' and l.title = 'Les panneaux d''aide');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('parcours-de-revision', 'Le parcours de révision', 'Un programme de séances planifiées qui mène l''élève jusqu''au contrôle blanc.', 'Comprendre et suivre un parcours de révision.', 'target', 'bleu', 5, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Suivre son parcours', 'file', '/videos/m6-1.mp4', 48, 0, 'published' from public.modules where slug = 'parcours-de-revision'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'parcours-de-revision' and l.title = 'Suivre son parcours');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Une séance du parcours', 'file', '/videos/m6-2.mp4', 33, 1, 'published' from public.modules where slug = 'parcours-de-revision'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'parcours-de-revision' and l.title = 'Une séance du parcours');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Jusqu''au contrôle blanc', 'file', '/videos/m6-3.mp4', 27, 2, 'published' from public.modules where slug = 'parcours-de-revision'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'parcours-de-revision' and l.title = 'Jusqu''au contrôle blanc');

insert into public.modules (slug, title, summary, objective, icon, color, position, status)
values ('partage-d-ecran', 'Le partage d''écran', 'Yoovi voit l''écran de l''élève et l''aide en direct, logiciel après logiciel.', 'Savoir utiliser le partage d''écran avec Yoovi.', 'lightbulb', 'rose', 6, 'published')
on conflict (slug) do nothing;
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Lancer le partage', 'file', '/videos/m7-1.mp4', 33, 0, 'published' from public.modules where slug = 'partage-d-ecran'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'partage-d-ecran' and l.title = 'Lancer le partage');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Yoovi voit votre écran', 'file', '/videos/m7-2.mp4', 19, 1, 'published' from public.modules where slug = 'partage-d-ecran'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'partage-d-ecran' and l.title = 'Yoovi voit votre écran');
insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, 'Un cas concret : l''informatique', 'file', '/videos/m7-3.mp4', 33, 2, 'published' from public.modules where slug = 'partage-d-ecran'
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = 'partage-d-ecran' and l.title = 'Un cas concret : l''informatique');
commit;
