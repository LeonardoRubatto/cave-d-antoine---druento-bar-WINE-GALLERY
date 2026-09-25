/* Cantina dei vini, La Cave d'Antoine — comportamento del sito.
   JavaScript classico, nessun framework, nessun modulo: funziona anche da
   file://. Tutto è miglioramento progressivo: senza JS il testo, le targhe,
   i link e i contatti restano tutti disponibili.
   Reveal del titolo e profondità allo scroll vengono dal sito generale
   (caveantoineDRUENTO/assets/js/main.js); lanterna e carta sono nuove.
   Provenienza: /CREDITS.md */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 768px)');

  /* ---------------------------------------------------------------------
   * Reveal dei titoli, evidenziatore, profondità allo scroll
   * (porting del sito generale, invariato nel comportamento).
   * ------------------------------------------------------------------- */
  function initMotion() {
    var revealed = new WeakSet();
    var dispose = function () {};

    function animate(element, frames, duration, delay) {
      if (!element.animate) return;
      element.animate(frames, { duration: duration, delay: delay || 0, easing: EASE, fill: 'backwards' });
    }

    function configure() {
      dispose();
      if (reduced.matches) return;

      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || revealed.has(entry.target)) return;
          revealed.add(entry.target);
          revealObserver.unobserve(entry.target);
          if (entry.target.hasAttribute('data-highlight')) {
            animate(entry.target, [{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }], 600, 300);
          } else {
            entry.target.querySelectorAll('.reveal-line-inner').forEach(function (line, index) {
              animate(line, [
                { opacity: 0, transform: 'translateY(24px)' },
                { opacity: 1, transform: 'translateY(0)' }
              ], 600, index * 60);
            });
          }
        });
      }, { rootMargin: '0px 0px -8% 0px' });

      document.querySelectorAll('[data-reveal], [data-highlight]').forEach(function (element) {
        if (!revealed.has(element)) revealObserver.observe(element);
      });

      var scenes = [];
      if (wide.matches) {
        document.querySelectorAll('[data-depth-scene]').forEach(function (scene) {
          scenes.push({
            scene: scene,
            layers: Array.prototype.slice.call(scene.querySelectorAll('[data-depth]')),
            zoom: scene.querySelector('[data-scroll-zoom]')
          });
        });
      }

      var active = new Set();
      var frame = 0;

      function update() {
        frame = 0;
        scenes.forEach(function (entry) {
          if (!active.has(entry.scene)) return;
          var rect = entry.scene.getBoundingClientRect();
          var progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - rect.top - rect.height / 2) / ((window.innerHeight + rect.height) / 2)));
          entry.layers.forEach(function (element) {
            var depth = Number(element.getAttribute('data-depth')) || 0;
            element.style.setProperty('--depth-y', (progress * depth).toFixed(2) + 'px');
          });
          if (entry.zoom) {
            entry.zoom.style.setProperty('--image-scale', String(1.06 - Math.max(0, Math.min(1, (progress + 1) / 2)) * 0.06));
          }
        });
      }

      function schedule() {
        if (!frame) frame = window.requestAnimationFrame(update);
      }

      var sceneObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) active.add(entry.target);
          else active.delete(entry.target);
        });
        schedule();
      }, { rootMargin: '80px' });
      scenes.forEach(function (entry) { sceneObserver.observe(entry.scene); });

      if (scenes.length) {
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        schedule();
      }

      dispose = function () {
        revealObserver.disconnect();
        sceneObserver.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        window.cancelAnimationFrame(frame);
        scenes.forEach(function (entry) {
          entry.layers.forEach(function (element) { element.style.removeProperty('--depth-y'); });
          if (entry.zoom) entry.zoom.style.removeProperty('--image-scale');
        });
      };
    }

    configure();
    reduced.addEventListener('change', configure);
    wide.addEventListener('change', configure);
  }

  /* ---------------------------------------------------------------------
   * La lanterna (hero). Implementazione originale.
   * Un alone caldo segue il puntatore (o il tocco) dentro la volta; le
   * bottiglie sulla mensola si accendono in base alla distanza dalla luce.
   * La foto di fondo rientra piano verso il puntatore (idea di "Parallax
   * Floating", Fancy Components di Daniel Petho, MIT, senza il suo ciclo continuo).
   * Tastiera: il focus su una bottiglia porta la luce su di essa, e
   * :focus-visible la accende del tutto. Senza puntatore la luce riposa
   * sulla mensola. Il ciclo di frame gira solo mentre la volta è
   * visibile e solo finché la luce non si è fermata.
   * Movimento ridotto: luce ferma e piena, targhe accese, nessuna deriva.
   * ------------------------------------------------------------------- */
  function initLantern() {
    var vault = document.querySelector('[data-lantern]');
    if (!vault) return;
    var all = Array.prototype.slice.call(vault.querySelectorAll('[data-lantern-target]'));
    var plates = all;
    var dispose = function () {};

    function configure() {
      dispose();
      var box = vault.getBoundingClientRect();
      var radius = 320;
      var pos = { x: 0, y: 0 };
      var target = { x: 0, y: 0 };
      var tilt = { x: 0, y: 0 };
      var tiltTarget = { x: 0, y: 0 };
      var frame = 0;
      var visible = true;
      var pointerInside = false;

      function measure() {
        // Su schermi stretti alcune bottiglie sono nascoste: la luce ignora quelle.
        plates = all.filter(function (el) { return el.offsetParent !== null; });
        box = vault.getBoundingClientRect();
        radius = Math.max(220, Math.min(400, box.width * 0.28));
        vault.style.setProperty('--lr', radius.toFixed(0) + 'px');
      }

      function restPoint() {
        if (!plates.length) return { x: box.width * 0.7, y: box.height * 0.4 };
        var sx = 0; var sy = 0;
        plates.forEach(function (plate) {
          var r = plate.getBoundingClientRect();
          sx += r.left + r.width / 2 - box.left;
          sy += r.top + r.height / 2 - box.top;
        });
        return { x: sx / plates.length, y: sy / plates.length };
      }

      function paint() {
        vault.style.setProperty('--lx', pos.x.toFixed(1) + 'px');
        vault.style.setProperty('--ly', pos.y.toFixed(1) + 'px');
        vault.style.setProperty('--mx', tilt.x.toFixed(3));
        vault.style.setProperty('--my', tilt.y.toFixed(3));
        var reach = radius * 1.2;
        plates.forEach(function (plate) {
          var r = plate.getBoundingClientRect();
          var dx = r.left + r.width / 2 - box.left - pos.x;
          var dy = r.top + r.height / 2 - box.top - pos.y;
          var lit = 1 - (Math.hypot(dx, dy) - reach * 0.45) / (reach * 0.75);
          plate.style.setProperty('--lit', Math.max(0, Math.min(1, lit)).toFixed(3));
        });
      }

      function tick() {
        frame = 0;
        pos.x += (target.x - pos.x) * 0.12;
        pos.y += (target.y - pos.y) * 0.12;
        tilt.x += (tiltTarget.x - tilt.x) * 0.06;
        tilt.y += (tiltTarget.y - tilt.y) * 0.06;
        paint();
        var moving = Math.abs(target.x - pos.x) > 0.3 || Math.abs(target.y - pos.y) > 0.3 ||
          Math.abs(tiltTarget.x - tilt.x) > 0.002 || Math.abs(tiltTarget.y - tilt.y) > 0.002;
        if (visible && moving) frame = window.requestAnimationFrame(tick);
      }

      function wake() {
        if (!frame && visible) frame = window.requestAnimationFrame(tick);
      }

      function aimAt(x, y) {
        target.x = x; target.y = y;
        if (wide.matches) {
          tiltTarget.x = Math.max(-1, Math.min(1, (x - box.width / 2) / (box.width / 2)));
          tiltTarget.y = Math.max(-1, Math.min(1, (y - box.height / 2) / (box.height / 2)));
        }
        wake();
      }

      function rest() {
        var p = restPoint();
        target.x = p.x; target.y = p.y;
        tiltTarget.x = 0; tiltTarget.y = 0;
        wake();
      }

      function onPointerMove(event) {
        if (event.pointerType === 'touch') return;
        pointerInside = true;
        box = vault.getBoundingClientRect();
        aimAt(event.clientX - box.left, event.clientY - box.top);
      }
      function onPointerDown(event) {
        if (event.pointerType !== 'touch') return;
        box = vault.getBoundingClientRect();
        aimAt(event.clientX - box.left, event.clientY - box.top);
      }
      function onPointerLeave() { pointerInside = false; rest(); }
      function onFocusIn(event) {
        var plate = event.target.closest && event.target.closest('[data-lantern-target]');
        if (!plate) return;
        box = vault.getBoundingClientRect();
        var r = plate.getBoundingClientRect();
        aimAt(r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top);
      }
      function onFocusOut() { if (!pointerInside) rest(); }
      function onResize() { measure(); rest(); }

      measure();
      var start = restPoint();
      pos.x = target.x = start.x;
      pos.y = target.y = start.y;

      if (reduced.matches) {
        paint();
        dispose = function () {};
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) wake();
      });
      observer.observe(vault);
      vault.addEventListener('pointermove', onPointerMove);
      vault.addEventListener('pointerdown', onPointerDown);
      vault.addEventListener('pointerleave', onPointerLeave);
      vault.addEventListener('focusin', onFocusIn);
      vault.addEventListener('focusout', onFocusOut);
      window.addEventListener('resize', onResize);
      paint();
      // Accensione: si parte al buio, la transizione CSS su --light fa il resto.
      vault.classList.add('is-unlit');
      void vault.offsetWidth;
      vault.classList.remove('is-unlit');

      dispose = function () {
        observer.disconnect();
        window.cancelAnimationFrame(frame);
        vault.removeEventListener('pointermove', onPointerMove);
        vault.removeEventListener('pointerdown', onPointerDown);
        vault.removeEventListener('pointerleave', onPointerLeave);
        vault.removeEventListener('focusin', onFocusIn);
        vault.removeEventListener('focusout', onFocusOut);
        window.removeEventListener('resize', onResize);
        ['--lx', '--ly', '--mx', '--my'].forEach(function (name) { vault.style.removeProperty(name); });
        all.forEach(function (plate) { plate.style.removeProperty('--lit'); });
      };
    }

    configure();
    reduced.addEventListener('change', configure);
    wide.addEventListener('change', configure);
  }

  /* ---------------------------------------------------------------------
   * Filtro della carta per tipologia. Implementazione originale: la
   * tecnica FLIP (misura, cambia il DOM, anima dalla vecchia posizione)
   * viene dal riferimento "Smooth Flexbox Filtering with Flip" (GreenSock,
   * CodePen, licenza non dichiarata: solo riferimento, nessun codice
   * copiato), qui con Web Animations API.
   * Controlli: radio nativi in un fieldset. Tastiera: Tab entra nel
   * gruppo, le frecce cambiano opzione, il filtro si applica al cambio;
   * il conteggio è annunciato da role="status". Uno scaffale che resta
   * vuoto si nasconde. Movimento ridotto: nessuna animazione.
   * ------------------------------------------------------------------- */
  function initFilters() {
    var form = document.querySelector('[data-filters]');
    if (!form) return;
    var shelves = Array.prototype.slice.call(document.querySelectorAll('[data-shelf]'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.bottle-item'));
    var status = form.querySelector('[data-filter-status]');
    var empty = document.querySelector('[data-filter-empty]');
    var reset = document.querySelector('[data-filter-reset]');

    function current() {
      var field = form.elements.namedItem('tipo');
      return field ? field.value : '';
    }
    function select(value) {
      var matched = false;
      form.querySelectorAll('input[name="tipo"]').forEach(function (input) {
        if (input.value === value) { input.checked = true; matched = true; }
      });
      if (!matched) form.querySelector('input[name="tipo"]').checked = true;
    }

    function apply(animate) {
      var tipo = current();
      var motion = animate && !reduced.matches && !!document.body.animate;
      var before = new Map();
      if (motion) {
        items.forEach(function (item) {
          if (item.offsetParent !== null) before.set(item, item.getBoundingClientRect());
        });
      }
      var shown = 0;
      items.forEach(function (item) {
        var match = !tipo || item.getAttribute('data-type') === tipo;
        item.hidden = !match;
        if (match) shown += 1;
      });
      shelves.forEach(function (shelf) {
        shelf.hidden = !shelf.querySelector('.bottle-item:not([hidden])');
      });
      status.textContent = shown === 1 ? '1 vino' : shown + ' vini';
      if (empty) empty.hidden = shown > 0;

      if (!motion) return;
      items.forEach(function (item) {
        if (item.hidden) return;
        var first = before.get(item);
        if (first) {
          var last = item.getBoundingClientRect();
          var dx = first.left - last.left;
          var dy = first.top - last.top;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            item.animate([
              { transform: 'translate(' + dx + 'px, ' + dy + 'px)' },
              { transform: 'translate(0, 0)' }
            ], { duration: 400, easing: EASE });
          }
        } else {
          item.animate([
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], { duration: 400, easing: EASE });
        }
      });
    }

    function syncUrl() {
      try {
        var params = new URLSearchParams(window.location.search);
        if (current()) params.set('tipo', current()); else params.delete('tipo');
        var query = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
      } catch (error) { /* file:// senza history: il filtro funziona lo stesso */ }
    }

    select(new URLSearchParams(window.location.search).get('tipo') || '');
    form.hidden = false;
    apply(false);
    form.addEventListener('change', function () { apply(true); syncUrl(); });
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    if (reset) {
      reset.addEventListener('click', function () {
        select('');
        apply(true);
        syncUrl();
        form.querySelector('input[name="tipo"]').focus();
      });
    }
  }

  function initYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = year; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initYear();
    initMotion();
    initFilters();
    initLantern();
  });
})();
