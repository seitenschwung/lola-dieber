// Menü, Einblenden, Auftakt, roter Faden, magnetische Knöpfe und Kopieren.
// Ohne JS bleibt alles sichtbar und bedienbar. Kein Scroll-Listener: Sichtbarkeit über IntersectionObserver,
// Scroll-Effekte laufen in CSS (animation-timeline).
(function () {
  var root = document.documentElement;
  var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var feinerZeiger = window.matchMedia('(pointer: fine)').matches;

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

    // Linie unter der Kopfzeile erst nach dem Scrollen
    var kopf = document.querySelector('.kopf');
    if (kopf) {
      var oben = document.createElement('div');
      oben.setAttribute('aria-hidden', 'true');
      document.body.prepend(oben);
      new IntersectionObserver(function (e) {
        kopf.classList.toggle('gescrollt', !e[0].isIntersecting);
      }).observe(oben);
    }

    // Überschrift im Hero in Wörter zerlegen, damit sie nacheinander aufsteigen
    var titel = document.querySelector('.hero h1');
    if (titel && !ruhig) {
      var n = 0;
      Array.prototype.slice.call(titel.childNodes).forEach(function (knoten) {
        if (knoten.nodeType === 3) {
          var teile = knoten.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          teile.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span');
            s.className = 'wort';
            s.textContent = t;
            s.style.setProperty('--verz', (0.25 + n++ * 0.07) + 's');
            frag.appendChild(s);
          });
          titel.replaceChild(frag, knoten);
        } else if (knoten.nodeType === 1) {
          knoten.classList.add('wort');
          knoten.style.setProperty('--verz', (0.25 + n++ * 0.07) + 's');
        }
      });
    }

    // Roter Faden: hängt vom linken Ende der Atemlinie durch alle Sektionen bis zum Kontakt
    var startLinie = document.querySelector('main > .atemlinie');
    var kontakt = document.getElementById('kontakt');
    var hero = document.querySelector('.hero');
    if (startLinie && kontakt && hero && 'ResizeObserver' in window) {
      var NS = 'http://www.w3.org/2000/svg';
      var fadenSvg = document.createElementNS(NS, 'svg');
      fadenSvg.setAttribute('class', 'faden-svg');
      fadenSvg.setAttribute('aria-hidden', 'true');
      fadenSvg.setAttribute('focusable', 'false');
      var fadenPfad = document.createElementNS(NS, 'path');
      fadenPfad.setAttribute('class', 'faden-pfad');
      fadenPfad.setAttribute('pathLength', '1');
      fadenSvg.appendChild(fadenPfad);
      document.body.appendChild(fadenSvg);
      var marken = ['#angebote', '#begleitung', '.band.lehm', '#lehre', '#yoga', '#wissen', '#ueber-mich'];
      var fadenZeichnen = function () {
        var sy = window.scrollY;
        var oben = function (el) { return el.getBoundingClientRect().top + sy; };
        var r = startLinie.getBoundingClientRect();
        var y0 = r.top + sy + r.height * 0.5;
        var x = Math.max(8, Math.round(hero.getBoundingClientRect().left * 0.5));
        var k = x < 30 ? 0.45 : 1;
        var ende = oben(kontakt) - 20;
        var d = 'M 0 ' + y0 + ' C ' + (x * 0.6) + ' ' + y0 + ', ' + x + ' ' + (y0 + 16) + ', ' + x + ' ' + (y0 + 60);
        var y = y0 + 60;
        var seite = 1;
        marken.forEach(function (sel) {
          var el = document.querySelector(sel);
          if (!el) return;
          var L = oben(el) + (sel === '.band.lehm' ? 0 : 40);
          if (L < y + 80 || L > ende - 80) return;
          var amp = 10 * k * seite;
          seite = -seite;
          d += ' C ' + (x + amp) + ' ' + (y + (L - y) / 3) + ', ' + (x - amp) + ' ' + (y + 2 * (L - y) / 3) + ', ' + x + ' ' + (L - 30 * k);
          d += ' C ' + x + ' ' + (L - 6 * k) + ', ' + (x + 30 * k) + ' ' + (L + 8 * k) + ', ' + (x + 22 * k) + ' ' + (L - 14 * k);
          d += ' C ' + (x + 14 * k) + ' ' + (L - 30 * k) + ', ' + (x - 16 * k) + ' ' + (L - 4 * k) + ', ' + x + ' ' + (L + 22 * k);
          y = L + 22 * k;
        });
        d += ' C ' + (x + 8 * k) + ' ' + (y + (ende - y) / 3) + ', ' + (x - 8 * k) + ' ' + (y + 2 * (ende - y) / 3) + ', ' + x + ' ' + ende;
        // Am Ende ein kleiner Knoten: der Faden ist gefunden
        d += ' C ' + x + ' ' + (ende + 14 * k) + ', ' + (x + 18 * k) + ' ' + (ende + 20 * k) + ', ' + (x + 16 * k) + ' ' + (ende + 4 * k);
        d += ' C ' + (x + 14 * k) + ' ' + (ende - 10 * k) + ', ' + (x - 6 * k) + ' ' + (ende - 4 * k) + ', ' + x + ' ' + (ende + 10 * k);
        d += ' C ' + (x + 4 * k) + ' ' + (ende + 22 * k) + ', ' + (x + 10 * k) + ' ' + (ende + 30 * k) + ', ' + (x + 6 * k) + ' ' + (ende + 38 * k);
        var w = document.documentElement.clientWidth;
        var h = Math.round(ende + 60);
        fadenSvg.setAttribute('width', w);
        fadenSvg.setAttribute('height', h);
        fadenSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        fadenPfad.setAttribute('d', d);
        // Beim Laden ist der Faden schon bis etwa zum unteren Bildrand gezogen
        var start = (window.innerHeight * 0.85 - y0) / Math.max(1, ende - y0);
        fadenSvg.style.setProperty('--faden-start', Math.min(0.5, Math.max(0.02, start)).toFixed(3));
      };
      var fadenBild = 0;
      fadenZeichnen();
      new ResizeObserver(function () {
        cancelAnimationFrame(fadenBild);
        fadenBild = requestAnimationFrame(fadenZeichnen);
      }).observe(document.body);
    }

    root.classList.add('js');
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('atemlinie') ? 'sichtbar' : 'da');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.auf, .stapel, .atemlinie').forEach(function (el) { io.observe(el); });

    if (ruhig || !feinerZeiger) return;

    // Magnetische Knöpfe: folgen dem Zeiger ein Stück, nur über translate
    document.querySelectorAll('.knopf, .nav-kontakt, .download').forEach(function (el) {
      var bild = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        cancelAnimationFrame(bild);
        bild = requestAnimationFrame(function () { el.style.translate = x + 'px ' + y + 'px'; });
      });
      el.addEventListener('pointerleave', function () {
        cancelAnimationFrame(bild);
        el.style.translate = '';
      });
    });

    // Flyer kippen leicht in Richtung des Zeigers
    document.querySelectorAll('.flyer-bild').forEach(function (el) {
      var bild = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
        cancelAnimationFrame(bild);
        bild = requestAnimationFrame(function () {
          el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-6px)';
        });
      });
      el.addEventListener('pointerleave', function () {
        cancelAnimationFrame(bild);
        el.style.transform = '';
      });
    });
  });
})();
