document.addEventListener('DOMContentLoaded', () => {
  const projectPath = window.location.pathname;
  const projectName = projectPath.split('/')[1]; // Récupère 'apitest' de '/apitest/'
  const apiBaseUrl = `/api/issues/${projectName}`;

  const projectTitleElem = document.getElementById('projectTitle');
  if (projectTitleElem) {
    projectTitleElem.textContent = `Suivi des tickets pour : ${projectName}`;
  }
  document.querySelectorAll('.project-name-display').forEach(el => el.textContent = projectName);


  const newIssueForm = document.getElementById('newIssue');
  const updateIssueForm = document.getElementById('updateIssue');
  const deleteIssueForm = document.getElementById('deleteIssue');
  const issueDisplay = document.getElementById('issueDisplay');

  const fetchAndDisplayIssues = async (filters = {}) => {
    let url = apiBaseUrl;
    const queryParams = new URLSearchParams(filters).toString();
    if (queryParams) {
        url += `?${queryParams}`;
    }

    try {
      const res = await fetch(url);
      const issues = await res.json();
      issueDisplay.innerHTML = ''; // Clear previous issues
      if (issues.length === 0) {
        issueDisplay.innerHTML = '<p>Aucun ticket trouvé pour ce projet/filtre.</p>';
        return;
      }
      issues.forEach(issue => {
        const issueDiv = document.createElement('div');
        issueDiv.classList.add('issue');
        issueDiv.innerHTML = `
          <h4>${issue.issue_title}</h4>
          <p>${issue.issue_text}</p>
          <p><strong>Statut:</strong> <span class="${issue.open ? 'status-open' : 'status-closed'}">${issue.open ? 'Ouvert' : 'Fermé'}</span> ${issue.status_text ? `(${issue.status_text})` : ''}</p>
          <p><small>Créé par: ${issue.created_by} | Assigné à: ${issue.assigned_to || 'Personne'}</small></p>
          <p><small>Créé le: ${new Date(issue.created_on).toLocaleString()} | Mis à jour le: ${new Date(issue.updated_on).toLocaleString()}</small></p>
          <p class="id">ID: ${issue._id}</p>
          <button class="close-btn" data-id="${issue._id}">Fermer Ticket</button>
          <button class="delete-btn" data-id="${issue._id}" style="background-color: orange; margin-left:5px;">Supprimer Ticket (UI)</button>

        `;
        issueDisplay.appendChild(issueDiv);
      });
    } catch (err) {
      console.error('Error fetching issues:', err);
      issueDisplay.innerHTML = '<p>Erreur lors du chargement des tickets.</p>';
    }
  };

  // Initial load
  fetchAndDisplayIssues();

  // --- Form Submissions ---
  if (newIssueForm) {
    newIssueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(newIssueForm);
      const data = Object.fromEntries(formData.entries());
      
      try {
        const res = await fetch(apiBaseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(JSON.stringify(result));
        if (!result.error) {
          newIssueForm.reset();
          fetchAndDisplayIssues();
        }
      } catch (err) {
        alert('Error submitting new issue: ' + err);
      }
    });
  }

  if (updateIssueForm) {
    updateIssueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(updateIssueForm);
      const data = Object.fromEntries(formData.entries());
      
      // Handle checkbox for 'open' status
      if (!formData.has('open')) { // If checkbox is not checked, it won't be in formData
        data.open = true; // Explicitly set to true if not closing
      } else {
        data.open = false; // If 'open' field exists and its value is 'false' (from checkbox value)
      }

      const body = {};
      for(const key in data) {
        if(data[key] || key === 'open') { // include 'open' even if false, or other fields if they have value
            body[key] = data[key];
        }
      }
      if (Object.keys(body).length <= 1 && body._id) { // only _id present
          alert("Aucun champ à mettre à jour n'a été envoyé (en dehors de _id)");
          return;
      }


      try {
        const res = await fetch(apiBaseUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const result = await res.json();
        alert(JSON.stringify(result));
        if (result.result === 'successfully updated') {
          updateIssueForm.reset();
          fetchAndDisplayIssues();
        }
      } catch (err) {
        alert('Error updating issue: ' + err);
      }
    });
  }
  
  if (deleteIssueForm) {
    deleteIssueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(deleteIssueForm);
      const data = Object.fromEntries(formData.entries());

      if (!data._id) {
        alert("L'ID du ticket est requis pour la suppression.");
        return;
      }

      try {
        const res = await fetch(apiBaseUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: data._id })
        });
        const result = await res.json();
        alert(JSON.stringify(result));
        if (result.result === 'successfully deleted') {
          deleteIssueForm.reset();
          fetchAndDisplayIssues();
        }
      } catch (err) {
        alert('Error deleting issue: ' + err);
      }
    });
  }

  // Event delegation for close and delete buttons on displayed issues
  issueDisplay.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;

    if (target.classList.contains('close-btn')) {
        if (!id) return;
        try {
            const res = await fetch(apiBaseUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: id, open: false })
            });
            const result = await res.json();
            alert(`Close issue ${id}: ${JSON.stringify(result)}`);
            if (result.result === 'successfully updated') {
                fetchAndDisplayIssues();
            }
        } catch (err) {
            alert('Error closing issue: ' + err);
        }
    } else if (target.classList.contains('delete-btn')) {
        if (!id) return;
        if (confirm(`Êtes-vous sûr de vouloir supprimer le ticket ${id} ?`)) {
            try {
                const res = await fetch(apiBaseUrl, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: id })
                });
                const result = await res.json();
                alert(`Delete issue ${id}: ${JSON.stringify(result)}`);
                 if (result.result === 'successfully deleted') {
                    fetchAndDisplayIssues();
                }
            } catch (err) {
                alert('Error deleting issue via UI button: ' + err);
            }
        }
    }
  });

});