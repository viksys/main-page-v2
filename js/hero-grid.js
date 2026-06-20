/* Hero tactical grid + radar sweep */
(function () {
  var canvas = document.getElementById('heroGrid');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H;
  var CELL = 60;
  var PRIMARY = 'rgba(234,130,29,';
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, W, H);

    /* Static grid lines */
    ctx.strokeStyle = PRIMARY + '0.25)';
    ctx.lineWidth = 0.5;

    for (var x = 0; x < W; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    for (var y = 0; y < H; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    /* Intersection dots */
    ctx.fillStyle = PRIMARY + '0.35)';
    for (var xi = 0; xi <= W; xi += CELL) {
      for (var yi = 0; yi <= H; yi += CELL) {
        ctx.beginPath();
        ctx.arc(xi, yi, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* No sweep — static grid only */
  }

  function animate(ts) {
    drawGrid();
    /* Static grid — only redraw on resize */
    /* requestAnimationFrame removed — draw once */
  }

  window.addEventListener('resize', function() { resize(); drawGrid(); });
  resize();
  drawGrid();
})();