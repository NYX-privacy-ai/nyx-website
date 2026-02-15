/**
 * NYX AI — Main Script
 * Scroll-triggered reveal animations and smooth interactions
 */

(function () {
  'use strict';

  // ── Scroll-triggered reveals ────────────────────────

  // Add .reveal class to all section elements that should animate in
  const revealTargets = document.querySelectorAll(
    '.section-eyebrow, .section-heading, .section-body, ' +
    '.capability-card, .arch-item, .providers-row, ' +
    '.cta-heading, .cta-body, .cta-buttons, .philosophy-divider'
  );

  revealTargets.forEach(function (el) {
    el.classList.add('reveal');
  });

  // Stagger capability cards and arch items
  document.querySelectorAll('.capability-card').forEach(function (card, i) {
    card.style.transitionDelay = (i * 0.08) + 's';
  });

  document.querySelectorAll('.arch-item').forEach(function (item, i) {
    item.style.transitionDelay = (i * 0.06) + 's';
  });

  // Intersection Observer for reveal
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show everything
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ── Parallax on hero (subtle) ───────────────────────

  var heroContent = document.querySelector('.hero-content');
  var scrollIndicator = document.querySelector('.scroll-indicator');
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.pageYOffset;
        var vh = window.innerHeight;

        if (scrollY < vh) {
          var progress = scrollY / vh;
          // Subtle upward drift on hero content
          if (heroContent) {
            heroContent.style.transform = 'translateY(' + (-5 - progress * 15) + '%)';
            heroContent.style.opacity = 1 - progress * 1.2;
          }
          // Fade scroll indicator
          if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(0, 1 - progress * 3);
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  });

  // ── Smooth anchor scrolling ─────────────────────────

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    // Skip download buttons — they have their own onclick handler
    if (anchor.classList.contains('download-dmg')) return;
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();

// ── Direct .dmg download (outside IIFE so onclick can call it) ──

function downloadNyx(e) {
  e.preventDefault();
  var btn = e.currentTarget;
  var originalText = btn.textContent.trim();
  btn.textContent = 'Fetching latest…';
  btn.style.pointerEvents = 'none';

  // Detect architecture: Apple Silicon (arm64) vs Intel (x86_64)
  var isArm = false;
  try {
    // navigator.userAgentData.architecture is available in some browsers
    if (navigator.userAgentData && navigator.userAgentData.architecture) {
      isArm = navigator.userAgentData.architecture === 'arm';
    } else if (navigator.platform === 'MacIntel') {
      // On Apple Silicon running Rosetta, platform still says MacIntel
      // but we can detect via GL renderer or WebGL
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl');
      if (gl) {
        var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          isArm = /apple\s*(m\d|gpu)/i.test(renderer);
        }
      }
    }
  } catch (err) {
    // Default to aarch64 — most modern Macs are Apple Silicon
    isArm = true;
  }

  var arch = isArm ? 'aarch64' : 'x64';

  fetch('https://api.github.com/repos/NYX-privacy-ai/nyx/releases/latest')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var dmg = null;
      var assets = data.assets || [];
      for (var i = 0; i < assets.length; i++) {
        if (assets[i].name.indexOf(arch) !== -1 && assets[i].name.endsWith('.dmg')) {
          dmg = assets[i].browser_download_url;
          break;
        }
      }
      if (dmg) {
        window.location.href = dmg;
      } else {
        // Fallback: open releases page
        window.open('https://github.com/NYX-privacy-ai/nyx/releases/latest', '_blank');
      }
    })
    .catch(function () {
      // API failed — fallback to releases page
      window.open('https://github.com/NYX-privacy-ai/nyx/releases/latest', '_blank');
    })
    .finally(function () {
      btn.textContent = originalText;
      btn.style.pointerEvents = '';
    });
}
