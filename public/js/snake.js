(function () {
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best-score');
  var startBtn = document.getElementById('start-btn');
  var restartBtn = document.getElementById('restart-btn');
  var submitBtn = document.getElementById('submit-btn');
  var gameOverEl = document.getElementById('game-over');
  var finalScoreEl = document.getElementById('final-score');
  var initialsInput = document.getElementById('initials-input');
  var leaderboardEl = document.getElementById('leaderboard');

  var GRID = 20;
  var COLS = canvas.width / GRID;
  var ROWS = canvas.height / GRID;
  var TICK_MS = 160;

  var snake, direction, nextDirection, food, score, bestScore, gameLoop, running;

  bestScore = 0;

  function init() {
    snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = '0';
    gameOverEl.classList.remove('show');
    placeFood();
    draw();
  }

  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
    } while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
  }

  function start() {
    if (running) return;
    running = true;
    startBtn.textContent = 'Playing...';
    startBtn.disabled = true;
    gameLoop = setInterval(tick, TICK_MS);
  }

  function stop() {
    running = false;
    clearInterval(gameLoop);
    startBtn.textContent = 'Start Game';
    startBtn.disabled = false;
  }

  function tick() {
    direction = nextDirection;

    var head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }

    // Self collision
    if (snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
      return gameOver();
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    stop();
    finalScoreEl.textContent = score;
    gameOverEl.classList.add('show');

    if (score > bestScore) {
      bestScore = score;
      bestEl.textContent = bestScore;
    }

    // Show submit form only if score > 0
    var submitDiv = document.getElementById('submit-score');
    submitDiv.style.display = score > 0 ? 'flex' : 'none';
    initialsInput.value = '';
    initialsInput.focus();
  }

  function draw() {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID, 0);
      ctx.lineTo(i * GRID, canvas.height);
      ctx.stroke();
    }
    for (var j = 0; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * GRID);
      ctx.lineTo(canvas.width, j * GRID);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * GRID + GRID / 2,
      food.y * GRID + GRID / 2,
      GRID / 2 - 2,
      0, Math.PI * 2
    );
    ctx.fill();

    // Snake
    snake.forEach(function (seg, i) {
      if (i === 0) {
        ctx.fillStyle = '#22c55e';
      } else {
        ctx.fillStyle = '#16a34a';
      }
      ctx.fillRect(
        seg.x * GRID + 1,
        seg.y * GRID + 1,
        GRID - 2,
        GRID - 2
      );

      // Round corners on head
      if (i === 0) {
        ctx.fillStyle = '#22c55e';
        roundRect(
          seg.x * GRID + 1,
          seg.y * GRID + 1,
          GRID - 2,
          GRID - 2,
          4
        );
      }
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  // Keyboard controls
  document.addEventListener('keydown', function (e) {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
        if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
        if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
        if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        e.preventDefault();
        break;
      case ' ':
        if (!running) {
          init();
          start();
        }
        e.preventDefault();
        break;
    }
  });

  // D-pad controls (mobile + desktop responsive preview)
  function handleDpad(btn) {
    var dir = btn.getAttribute('data-dir');
    if (dir === 'up' && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    if (dir === 'down' && direction.y !== -1) nextDirection = { x: 0, y: 1 };
    if (dir === 'left' && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    if (dir === 'right' && direction.x !== -1) nextDirection = { x: 1, y: 0 };
    if (!running) { init(); start(); }
  }

  document.querySelectorAll('.dpad-btn').forEach(function (btn) {
    btn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      handleDpad(btn);
    });
    btn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      handleDpad(btn);
    });
  });

  // Swipe controls
  var touchStartX = 0;
  var touchStartY = 0;
  canvas.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    if (!running) { init(); start(); }
  }, { passive: true });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return; // tap, not swipe
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && direction.x !== -1) nextDirection = { x: 1, y: 0 };
      else if (dx < 0 && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    } else {
      if (dy > 0 && direction.y !== -1) nextDirection = { x: 0, y: 1 };
      else if (dy < 0 && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    }
  });

  // Buttons
  startBtn.addEventListener('click', function () {
    init();
    start();
  });

  restartBtn.addEventListener('click', function () {
    init();
    start();
  });

  // Submit score
  submitBtn.addEventListener('click', submitScore);
  initialsInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitScore();
  });

  async function submitScore() {
    var initials = initialsInput.value.trim().toUpperCase();
    if (!initials || initials.length === 0 || initials.length > 3) {
      alert('Enter 1-3 initials');
      return;
    }

    try {
      var resp = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initials: initials, score: score })
      });
      if (!resp.ok) throw new Error('Failed to submit');
      document.getElementById('submit-score').style.display = 'none';
      loadLeaderboard();
    } catch (err) {
      alert('Error submitting score');
    }
  }

  // Leaderboard
  async function loadLeaderboard() {
    try {
      var resp = await fetch('/api/scores');
      if (!resp.ok) return;
      var scores = await resp.json();

      if (scores.length === 0) {
        leaderboardEl.innerHTML = '<li class="lb-empty">No scores yet</li>';
        return;
      }

      leaderboardEl.innerHTML = scores.map(function (s, i) {
        return '<li>' +
          '<span class="lb-rank">' + (i + 1) + '.</span>' +
          '<span class="lb-initials">' + s.initials + '</span>' +
          '<span class="lb-score">' + s.score + '</span>' +
          '</li>';
      }).join('');

      // Update best score display
      if (scores.length > 0 && scores[0].score > bestScore) {
        bestScore = scores[0].score;
        bestEl.textContent = bestScore;
      }
    } catch (err) {
      // silent fail
    }
  }

  // Init
  init();
  loadLeaderboard();
})();
