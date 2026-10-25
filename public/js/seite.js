// Menü, Einblenden, Auftakt, magnetische Knöpfe und Kopieren.
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

    // Sekundenzähler im Atemkreis, synchron zur CSS-Animation (16 s: 8 ein, 8 aus)
    var zahl = document.querySelector('.atem-zahl');
    var form = document.querySelector('.atemkreis-form');
    var atemAnim = form && form.getAnimations ? form.getAnimations()[0] : null;
    if (zahl && atemAnim && !ruhig) {
      zahl.hidden = false;
      var letzte = -1;
      var zaehlen = function () {
        var t = Number(atemAnim.currentTime) || 0;
        var sek = Math.floor((t % 16000) / 1000) % 8 + 1;
        if (sek !== letzte) { zahl.textContent = sek; letzte = sek; }
      };
      zaehlen();
      setInterval(zaehlen, 200);
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
