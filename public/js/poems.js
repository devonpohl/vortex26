(function () {
  var listEl = document.getElementById('poems-list');
  var form = document.getElementById('poem-form');
  var myVotes = [];  // poem IDs this user has voted on

  function getVoterName() {
    return (localStorage.getItem('poem_voter') || '').trim();
  }

  function setVoterName(name) {
    localStorage.setItem('poem_voter', name.trim());
  }

  // Pre-fill author from stored voter name
  var authorInput = document.getElementById('poem-author');
  var stored = getVoterName();
  if (stored) {
    authorInput.value = stored;
  }

  async function loadPoems() {
    try {
      var resp = await fetch('/api/poems');
      if (!resp.ok) throw new Error('Failed to load');
      var poems = await resp.json();

      // Load user's votes
      var voter = getVoterName();
      if (voter) {
        var vResp = await fetch('/api/poems/votes/' + encodeURIComponent(voter));
        if (vResp.ok) {
          myVotes = await vResp.json();
        }
      }

      render(poems);
    } catch (err) {
      listEl.innerHTML = '<div class="empty-state">Error loading poems</div>';
    }
  }

  function render(poems) {
    if (!poems.length) {
      listEl.innerHTML = '<div class="empty-state">No poems yet. Be the first to write one!</div>';
      return;
    }

    listEl.innerHTML = '';
    poems.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'poem-card';

      var hasVoted = myVotes.indexOf(p.id) !== -1;

      var lines = [p.line_p, p.line_o, p.line_h, p.line_l];
      var linesHtml = lines.map(function (line) {
        var first = line.charAt(0);
        var rest = line.slice(1);
        return '<span class="line"><span class="first-letter">' + escHtml(first) + '</span>' + escHtml(rest) + '</span>';
      }).join('');

      card.innerHTML =
        '<div class="poem-lines">' + linesHtml + '</div>' +
        '<div class="poem-footer">' +
          '<span class="poem-author">' + escHtml(p.author) + '</span>' +
          '<div class="poem-vote-area">' +
            '<button class="vote-btn' + (hasVoted ? ' voted' : '') + '" data-id="' + p.id + '"' +
              (hasVoted ? ' disabled' : '') + '>' +
              (hasVoted ? '\u{1F44D}' : '\u{1F44D}') +
              ' <span class="vote-count">' + p.votes + '</span>' +
            '</button>' +
            '<button class="poem-delete" data-id="' + p.id + '" title="Delete">\u2715</button>' +
          '</div>' +
        '</div>';

      listEl.appendChild(card);
    });

    // Vote handlers
    listEl.querySelectorAll('.vote-btn:not(.voted)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        vote(id);
      });
    });

    // Delete handlers
    listEl.querySelectorAll('.poem-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (confirm('Delete this poem?')) {
          deletePoem(id);
        }
      });
    });
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function vote(poemId) {
    var voter = getVoterName();
    if (!voter) {
      voter = prompt('Enter your name to vote:');
      if (!voter || !voter.trim()) return;
      setVoterName(voter);
    }

    try {
      var resp = await fetch('/api/poems/' + poemId + '/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter: voter.trim() })
      });

      if (resp.status === 409) {
        alert('You already voted for this poem');
      } else if (!resp.ok) {
        var err = await resp.json();
        alert(err.error || 'Error voting');
      }

      loadPoems();
    } catch (err) {
      alert('Error voting');
    }
  }

  async function deletePoem(id) {
    try {
      var resp = await fetch('/api/poems/' + id, { method: 'DELETE' });
      if (!resp.ok && resp.status !== 204) {
        alert('Error deleting poem');
      }
      loadPoems();
    } catch (err) {
      alert('Error deleting poem');
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var author = document.getElementById('poem-author').value.trim();
    var lineP = document.getElementById('line-p').value.trim();
    var lineO = document.getElementById('line-o').value.trim();
    var lineH = document.getElementById('line-h').value.trim();
    var lineL = document.getElementById('line-l').value.trim();

    if (!author) { alert('Please enter your name'); return; }

    var checks = [
      { letter: 'P', val: lineP },
      { letter: 'O', val: lineO },
      { letter: 'H', val: lineH },
      { letter: 'L', val: lineL }
    ];

    for (var i = 0; i < checks.length; i++) {
      if (!checks[i].val) {
        alert('Please fill in all four lines');
        return;
      }
      if (checks[i].val[0].toUpperCase() !== checks[i].letter) {
        alert('Line ' + checks[i].letter + ' must start with the letter ' + checks[i].letter);
        return;
      }
    }

    // Save author name for voting later
    setVoterName(author);

    try {
      var resp = await fetch('/api/poems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author,
          line_p: lineP,
          line_o: lineO,
          line_h: lineH,
          line_l: lineL
        })
      });

      if (!resp.ok) {
        var err = await resp.json();
        alert(err.error || 'Error submitting poem');
        return;
      }

      // Clear lines but keep author
      document.getElementById('line-p').value = '';
      document.getElementById('line-o').value = '';
      document.getElementById('line-h').value = '';
      document.getElementById('line-l').value = '';

      loadPoems();
    } catch (err) {
      alert('Error submitting poem');
    }
  });

  loadPoems();
})();
