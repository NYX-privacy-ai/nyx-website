/**
 * NYX AI — Main Script
 * Scroll-triggered reveal animations and smooth interactions
 */

(function () {
  'use strict';

  // ── Hero video playback recovery ──────────────────────
  // Ensures the background video plays smoothly. Handles stalls,
  // buffering failures, and autoplay restrictions.

  var heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    // Attempt play (catches autoplay-blocked browsers)
    var playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        // Autoplay blocked — try again after user interaction
        document.addEventListener('click', function resumeVideo() {
          heroVideo.play();
          document.removeEventListener('click', resumeVideo);
        }, { once: true });
      });
    }

    // Detect stalls: if video freezes for 3s while it should be playing,
    // nudge it forward to resume playback
    var lastTime = -1;
    var stallCount = 0;
    var stallChecker = setInterval(function () {
      if (heroVideo.paused || heroVideo.ended) return;

      if (heroVideo.currentTime === lastTime && lastTime > 0) {
        stallCount++;
        if (stallCount >= 2) {
          // Stalled for ~3s — nudge playback
          heroVideo.currentTime += 0.1;
          heroVideo.play();
          stallCount = 0;
        }
      } else {
        stallCount = 0;
      }
      lastTime = heroVideo.currentTime;
    }, 1500);

    // Handle network/decode errors — try lower resolution fallback
    heroVideo.addEventListener('error', function () {
      if (heroVideo.src.indexOf('540') === -1) {
        // 720p failed — try 540p as fallback
        heroVideo.src = 'https://videos.pexels.com/video-files/3830517/3830517-sd_960_540_30fps.mp4';
        heroVideo.load();
        heroVideo.play();
      }
    });

    // Clean up when user scrolls past the hero (save GPU)
    var videoObserver = null;
    if ('IntersectionObserver' in window) {
      videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (heroVideo.paused) heroVideo.play();
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.05 });
      videoObserver.observe(heroVideo);
    }
  }

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

// ── Download (outside IIFE so onclick can call it) ──

function downloadNyx(e) {
  e.preventDefault();

  // GitHub releases/latest/download redirects to the newest tag automatically.
  // Using this URL avoids hitting the GitHub API (which has a 60 req/hour
  // unauthenticated limit) and starts the download immediately.
  // We only ship Apple Silicon (aarch64) for now — add x64 DMG URL here
  // when an Intel build is available.
  window.location.href = 'https://github.com/NYX-privacy-ai/nyx/releases/latest/download/Nyx_aarch64.dmg';
}
