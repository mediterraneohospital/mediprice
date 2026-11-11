/* Shared presentation controls. Existing content and event handlers stay in place. */
(function () {
  'use strict';
  function init() {
    var header = document.querySelector('#app > header');
    if (!header || header.querySelector('.mp-navigation')) return;
    var page = document.documentElement.getAttribute('data-mp-page');
    var existingBrand = header.querySelector('.logo');
    if (!existingBrand) {
      var brand = document.createElement('a');
      brand.className = 'mp-brand';
      brand.href = 'index.html';
      brand.setAttribute('aria-label', 'MediPrice — Τιμοκατάλογος');
      brand.appendChild(document.createTextNode('Medi'));
      var suffix = document.createElement('span');
      suffix.textContent = 'Price';
      brand.appendChild(suffix);
      header.insertBefore(brand, header.firstChild);
      existingBrand = brand;
    }
    header.querySelectorAll('.back, #plafondLink, #katLink').forEach(function (link) {
      link.classList.add('mp-legacy-nav');
    });
    var nav = document.createElement('nav');
    nav.className = 'mp-navigation';
    nav.setAttribute('aria-label', 'Κύρια πλοήγηση MediPrice');
    [
      ['index.html', 'Τιμοκατάλογος', 'ti-list-details'],
      ['plafond.html', 'Πλαφόν', 'ti-file-invoice'],
      ['katigoriopoiisi.html', 'Κατηγοριοποίηση', 'ti-category']
    ].forEach(function (item) {
      var a = document.createElement('a');
      a.href = item[0];
      if (page === item[0]) a.setAttribute('aria-current', 'page');
      var icon = document.createElement('i');
      icon.className = 'ti ' + item[2];
      icon.setAttribute('aria-hidden', 'true');
      a.appendChild(icon);
      a.appendChild(document.createTextNode(item[1]));
      nav.appendChild(a);
    });
    existingBrand.insertAdjacentElement('afterend', nav);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
