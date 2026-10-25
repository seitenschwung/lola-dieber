// Menü, Einblenden, Atemlinie und Kopieren. Ohne JS bleibt alles sichtbar und bedienbar.
(function () {
  var root = document.documentElement;

  document.addEventListener('DOMContentLoaded', function () {
    // Mobiles Menü
    var knopf = document.querySelector('.menue-knopf');
    var nav = document.getElementById('hauptnav');
    var mobil = window.matchMedia('(max-width: 899px)');
    function setzeMenue(offen) {
      if (!knopf || !nav) return;
      knopf.setAttribute('aria-expanded', String(offen));
      nav.hidden = mobil.matches && !offen;
    }
    if (knopf && nav) {
      setzeMenue(false);
      knopf.addEventListener('click', function () {
        setzeMenue(knopf.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a') && mobil.matches) setzeMenue(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && knopf.getAttribute('aria-expanded') === 'true') {
          setzeMenue(false);
          knopf.focus();
        }
      });
      mobil.addEventListener('change', function () { setzeMenue(false); });
    }

    // Linie unter der Kopfzeile erst nach dem Scrollen
    var kopf = document.querySelector('.kopf');
    var oben = document.createElement('div');
    oben.setAttribute('aria-hidden', 'true');
    document.body.prepend(oben);

    // Kopieren der E-Mail-Adresse
    document.querySelectorAll('[data-kopieren]').forEach(function (b) {
      var text = b.textContent;
      b.addEventListener('click', function () {
        var wert = b.getAttribute('data-kopieren');
        var fertig = function () {
          b.textContent = 'Kopiert';
          setTimeout(function () { b.textContent = text; }, 2000);
        };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(wert).then(fertig, function () { b.textContent = wert; });
        } else {
          b.textContent = wert;
        }
      });
    });

    if (!('IntersectionObserver' in window)) return;

    if (kopf) {
      new IntersectionObserver(function (e) {
        kopf.classList.toggle('gescrollt', !e[0].isIntersecting);
      }).observe(oben);
    }

    root.classList.add('js');
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('atemlinie') ? 'sichtbar' : 'da');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.auf, .atemlinie').forEach(function (el) { io.observe(el); });
  });
})();
