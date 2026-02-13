/**
 * NYX AI — Water Animation Shader
 *
 * Uses the hero photograph as a texture. Applies realistic water
 * displacement ONLY to the ocean portion (below the horizon).
 * The sky remains perfectly sharp and untouched.
 */

(function () {
  'use strict';

  var canvas = document.getElementById('water-canvas');
  var heroImg = document.getElementById('hero-img');
  if (!canvas || !heroImg) return;

  var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
        || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });

  if (!gl) {
    // No WebGL: just show the static image
    canvas.style.display = 'none';
    return;
  }

  // ── Vertex shader ───────────────────────────────────
  var VERT = [
    'attribute vec2 a_pos;',
    'attribute vec2 a_uv;',
    'varying vec2 v_uv;',
    'void main() {',
    '  v_uv = a_uv;',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  // ── Fragment shader: photo + water displacement ─────
  var FRAG = [
    'precision highp float;',
    'varying vec2 v_uv;',
    'uniform sampler2D u_tex;',
    'uniform float u_time;',
    'uniform vec2 u_res;',
    '',
    '// Where the horizon sits in the image (0=top, 1=bottom)',
    '// The original image has horizon at roughly 47% from top',
    'const float HORIZON = 0.47;',
    'const float TRANSITION = 0.03;  // soft blend zone',
    '',
    '// ── Noise for wave detail ─────────────────────',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash(i), hash(i + vec2(1,0)), f.x),',
    '    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),',
    '    f.y);',
    '}',
    '',
    'void main() {',
    '  vec2 uv = v_uv;',
    '  float t = u_time;',
    '  float aspect = u_res.x / u_res.y;',
    '',
    '  // How far below the horizon (0 at horizon, 1 at bottom)',
    '  float waterDepth = smoothstep(HORIZON - TRANSITION, HORIZON + TRANSITION, uv.y);',
    '',
    '  if (waterDepth > 0.001) {',
    '    // Scale displacement with depth — more movement further from horizon',
    '    float d = waterDepth * waterDepth;',
    '    float px = uv.x * aspect;',
    '',
    '    // ── Layer 1: Big slow ocean swells ────────',
    '    float dx1 = sin(px * 4.0 + t * 0.4) * 0.0035',
    '             + sin(px * 2.5 - t * 0.3 + uv.y * 3.0) * 0.002;',
    '    float dy1 = sin(px * 3.0 + t * 0.35 + 1.0) * 0.002',
    '             + sin(px * 1.8 - t * 0.25 + uv.y * 2.0) * 0.0015;',
    '',
    '    // ── Layer 2: Medium crossing waves ───────',
    '    float dx2 = sin(px * 8.0 + t * 0.6 + uv.y * 5.0) * 0.002',
    '             + sin(px * 6.0 - t * 0.5 + 2.0) * 0.0012;',
    '    float dy2 = sin(px * 7.0 + t * 0.5 + uv.y * 4.0) * 0.0012;',
    '',
    '    // ── Layer 3: Fine surface ripples (noise-based) ──',
    '    vec2 np = vec2(px * 15.0, uv.y * 12.0);',
    '    float n1 = noise(np + vec2(t * 0.3, t * 0.1));',
    '    float n2 = noise(np * 1.7 + vec2(-t * 0.25, t * 0.15) + 50.0);',
    '    float dx3 = (n1 - 0.5) * 0.0018 + (n2 - 0.5) * 0.0008;',
    '    float dy3 = (noise(np.yx + vec2(t * 0.2, -t * 0.12)) - 0.5) * 0.001;',
    '',
    '    // Combine and scale by depth',
    '    float totalDx = (dx1 + dx2 + dx3) * d;',
    '    float totalDy = (dy1 + dy2 + dy3) * d * 0.6;',
    '',
    '    uv.x += totalDx;',
    '    uv.y += totalDy;',
    '',
    '    // Keep in bounds',
    '    uv = clamp(uv, 0.0, 1.0);',
    '  }',
    '',
    '  vec4 col = texture2D(u_tex, uv);',
    '',
    '  // Subtle brightness shimmer on water surface (caustic hint)',
    '  if (waterDepth > 0.01) {',
    '    float px = uv.x * aspect;',
    '    float shimmer = sin(px * 12.0 + t * 0.7) * sin(uv.y * 8.0 - t * 0.4);',
    '    shimmer = shimmer * 0.02 * waterDepth;',
    '    col.rgb += shimmer;',
    '  }',
    '',
    '  gl_FragColor = col;',
    '}'
  ].join('\n');

  // ── Compile & link ──────────────────────────────────

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Link error:', gl.getProgramInfoLog(prog));
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  // ── Fullscreen quad ─────────────────────────────────
  //  pos (x,y)  uv (s,t)
  var verts = new Float32Array([
    -1, -1,  0, 1,   // bottom-left  → uv(0,1) = image bottom
     1, -1,  1, 1,   // bottom-right → uv(1,1) = image bottom
    -1,  1,  0, 0,   // top-left     → uv(0,0) = image top
     1,  1,  1, 0,   // top-right    → uv(1,0) = image top
  ]);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  var aPos = gl.getAttribLocation(prog, 'a_pos');
  var aUV  = gl.getAttribLocation(prog, 'a_uv');
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aUV);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.vertexAttribPointer(aUV,  2, gl.FLOAT, false, 16, 8);

  var uTex  = gl.getUniformLocation(prog, 'u_tex');
  var uTime = gl.getUniformLocation(prog, 'u_time');
  var uRes  = gl.getUniformLocation(prog, 'u_res');

  // ── Texture from hero image ─────────────────────────

  var texture = gl.createTexture();

  function uploadTexture() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heroImg);
  }

  // ── Resize ──────────────────────────────────────────

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    var pw = w * dpr | 0;
    var ph = h * dpr | 0;
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      gl.viewport(0, 0, pw, ph);
    }
  }

  // ── Render loop ─────────────────────────────────────

  var running = true;
  var start = performance.now();

  function frame() {
    if (!running) return;
    resize();

    var t = (performance.now() - start) * 0.001;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1i(uTex, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }

  // ── Init ────────────────────────────────────────────

  function init() {
    resize();
    uploadTexture();
    // Hide the static image — canvas now renders it with animation
    heroImg.style.opacity = '0';
    frame();
  }

  if (heroImg.complete && heroImg.naturalWidth > 0) {
    init();
  } else {
    heroImg.addEventListener('load', init);
  }

  // Handle resize (re-upload texture at new dimensions)
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      uploadTexture();
    }, 200);
  });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      start = performance.now();
      frame();
    }
  });

})();
