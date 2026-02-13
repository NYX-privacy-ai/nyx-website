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
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
