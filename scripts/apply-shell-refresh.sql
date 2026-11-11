-- MediPrice shell refresh, 2026-11-11. No catalog data changes.
-- Run in a single transaction; abort if an app page changed after validation.
DO $mp_refresh$
DECLARE
 item record;
 current_hash text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('index.html','d94a923c0d33236f00190e02e1a95b15'),
 ('katigoriopoiisi.html','690f4357c3f866feeddca40da67243c1'),
 ('plafond.html','2cc51cec0dbe61f74e49fd5705778861')
 ) AS assets(name,hash)
 LOOP
  SELECT md5(html) INTO current_hash FROM public.mp_app_assets WHERE name=item.name FOR UPDATE;
  IF current_hash IS DISTINCT FROM item.hash THEN
   RAISE EXCEPTION 'Asset changed: %. Reload and validate before applying.',item.name;
  END IF;
  UPDATE public.mp_app_assets SET html=replace(
   replace(html,'<html lang="el">','<html lang="el" data-mp-page="'||item.name||'">'),
   '</head>','<link rel="stylesheet" href="refresh.css?v=20261111-shell1">'||chr(10)||'<script defer src="refresh.js?v=20261111-shell1"></script>'||chr(10)||'</head>'
  ) WHERE name=item.name;
 END LOOP;
END $mp_refresh$;
