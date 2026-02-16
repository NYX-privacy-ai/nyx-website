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

// ── Install guide modal + download (outside IIFE so onclick can call them) ──

function downloadNyx(e) {
  e.preventDefault();
  // Show the install guide modal instead of downloading directly
  var modal = document.getElementById('install-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Trigger animation on next frame
    requestAnimationFrame(function () {
      modal.classList.add('active');
    });
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
}

function closeInstallModal() {
  var modal = document.getElementById('install-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(function () {
      modal.style.display = 'none';
    }, 300);
    document.body.style.overflow = '';
  }
}

function proceedDownload() {
  // Close the modal
  closeInstallModal();

  // Detect architecture: Apple Silicon (arm64) vs Intel (x86_64)
  var isArm = false;
  try {
    if (navigator.userAgentData && navigator.userAgentData.architecture) {
      isArm = navigator.userAgentData.architecture === 'arm';
    } else if (navigator.platform === 'MacIntel') {
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
        window.open('https://github.com/NYX-privacy-ai/nyx/releases/latest', '_blank');
      }
    })
    .catch(function () {
      window.open('https://github.com/NYX-privacy-ai/nyx/releases/latest', '_blank');
    });
}

// Close modal on overlay click (not the card itself)
document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'install-modal') {
    closeInstallModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeInstallModal();
  }
});
