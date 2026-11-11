/* Keep the existing phone experience reachable from the main MediPrice link. */
(function () {
  'use strict';
  var phone = matchMedia('(max-width:900px)').matches &&
    (navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches);
  if (!phone || /\/mediprice\/mobile(?:\/|$)/.test(location.pathname)) return;
  var page = location.pathname.split('/').pop();
  if (!page || page === 'index.html') page = '';
  if (page && ['plafond.html', 'katigoriopoiisi.html'].indexOf(page) === -1) return;
  location.replace('/mediprice/mobile/' + page + location.search + location.hash);
})();
