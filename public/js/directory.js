(function () {
  var listEl = document.getElementById('directory-list');
  var addForm = document.getElementById('add-form');

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function stripPhone(raw) {
    return raw.replace(/\D/g, '');
  }

  function formatPhone(digits) {
    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 10);
  }

  function validateFields(name, email, phone) {
    if (!name.trim()) {
      alert('Name is required');
      return false;
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      alert('Please enter a valid email address');
      return false;
    }
    if (phone.trim()) {
      var digits = stripPhone(phone);
      if (digits.length !== 10) {
        alert('Phone number must be 10 digits');
        return false;
      }
    }
    return true;
  }

  async function loadDirectory() {
    try {
      var resp = await fetch('/api/directory');
      if (!resp.ok) throw new Error('Failed to load');
      var entries = await resp.json();
      render(entries);
    } catch (err) {
      listEl.innerHTML = '<li class="empty-state">Error loading directory</li>';
    }
  }

  function render(entries) {
    if (entries.length === 0) {
      listEl.innerHTML = '<li class="empty-state">No one yet — add yourself!</li>';
      return;
    }

    listEl.innerHTML = '';
    entries.forEach(function (entry) {
      var li = document.createElement('li');
      li.className = 'directory-entry';
      li.dataset.id = entry.id;

      var nameDiv = document.createElement('div');
      nameDiv.className = 'entry-name';
      nameDiv.textContent = entry.name;
      li.appendChild(nameDiv);

      var emailDiv = document.createElement('div');
      emailDiv.className = 'entry-email';
      if (entry.email) {
        var emailLink = document.createElement('a');
        emailLink.href = 'mailto:' + entry.email;
        emailLink.textContent = entry.email;
        emailDiv.appendChild(emailLink);
      }
      li.appendChild(emailDiv);

      var phoneDiv = document.createElement('div');
      phoneDiv.className = 'entry-phone';
      if (entry.phone) {
        var phoneLink = document.createElement('a');
        phoneLink.href = 'tel:' + entry.phone;
        phoneLink.textContent = entry.phone;
        phoneDiv.appendChild(phoneLink);
      }
      li.appendChild(phoneDiv);

      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'entry-actions';

      var editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', function () {
        startEdit(li, entry);
      });
      actionsDiv.appendChild(editBtn);

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Remove';
      deleteBtn.addEventListener('click', function () {
        removeEntry(entry.id);
      });
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(actionsDiv);
      listEl.appendChild(li);
    });
  }

  function startEdit(li, entry) {
    li.innerHTML = '';
    li.classList.add('editing');

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = entry.name;
    nameInput.placeholder = 'Name';
    li.appendChild(nameInput);

    var emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.value = entry.email || '';
    emailInput.placeholder = 'Email';
    li.appendChild(emailInput);

    var phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.value = entry.phone || '';
    phoneInput.placeholder = 'Phone';
    li.appendChild(phoneInput);

    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'entry-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'edit-btn';
    saveBtn.textContent = '💾';
    saveBtn.title = 'Save';
    saveBtn.addEventListener('click', function () {
      saveEdit(entry.id, nameInput.value, emailInput.value, phoneInput.value);
    });
    actionsDiv.appendChild(saveBtn);

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'delete-btn';
    cancelBtn.textContent = '✕';
    cancelBtn.title = 'Cancel';
    cancelBtn.addEventListener('click', function () {
      loadDirectory();
    });
    actionsDiv.appendChild(cancelBtn);

    li.appendChild(actionsDiv);
    nameInput.focus();

    // Save on Enter
    [nameInput, emailInput, phoneInput].forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          saveEdit(entry.id, nameInput.value, emailInput.value, phoneInput.value);
        }
      });
    });
  }

  async function saveEdit(id, name, email, phone) {
    if (!validateFields(name, email, phone)) return;

    try {
      var resp = await fetch('/api/directory/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, phone: phone })
      });
      if (!resp.ok) throw new Error('Failed to update');
      loadDirectory();
    } catch (err) {
      alert('Error updating entry');
    }
  }

  async function removeEntry(id) {
    if (!confirm('Remove this person from the directory?')) return;

    try {
      var resp = await fetch('/api/directory/' + id, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete');
      loadDirectory();
    } catch (err) {
      alert('Error removing entry');
    }
  }

  // Add form
  addForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var name = document.getElementById('add-name').value.trim();
    var email = document.getElementById('add-email').value.trim();
    var phone = document.getElementById('add-phone').value.trim();

    if (!validateFields(name, email, phone)) return;

    try {
      var resp = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, phone: phone })
      });
      if (!resp.ok) throw new Error('Failed to add');
      addForm.reset();
      loadDirectory();
    } catch (err) {
      alert('Error adding entry');
    }
  });

  loadDirectory();
})();
