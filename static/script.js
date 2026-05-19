let timeline = {
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    end: new Date(),
};
let database = {};
let syncInProgress = false;

const tableBody = document.getElementById('database'),
    timelineBar = document.getElementById('timeline'),
    updateForm = document.getElementById('update');

document.getElementById('timePeriod').innerHTML =
    `<span>${timeline.start.toDateString()}</span>
    <span>${timeline.end.toDateString()}</span>`;

function sendToServer() {
    // Send the entire database to the server
    fetch('./api/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(database),
    }).then(response => {
        if (response.ok) {
            alert('Database updated successfully!');
            location.reload();
        } else {
            alert('Failed to update database. Please try again.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the database. Please try again.');
    });
}

(async () => {
    // Download database
    let data = await fetch('./database.json');
    database = await data.json();

    // Populate table
    for (const id in database) {
        const entry = database[id];
        const item = document.createElement('li'),
            info = document.createElement('div'),
            activity = document.createElement('div'),
            list = document.createElement('div');
        let activities = '';

        info.classList.add('info');
        info.classList.add(entry.status == 'Finished' ? 'ok' : 'no');
        info.innerHTML = `
            <span class="short">${entry.length}</span><span class="long">${entry.category}</span>
            <span class="short">${entry.format}</span><span class="long">${entry.name}</span>`;

        // Activity bar, activity list, and timeline
        activity.classList.add('activity');
        list.classList.add('list');
        let latestActivity = '';
        for (const key in entry.activity) {
            const itemProgress = document.createElement('span');
            let progressPercent = (new Date(key) - timeline.start) / (timeline.end - timeline.start);
            progressPercent = Math.max(progressPercent, 0);
            itemProgress.style.width = `${progressPercent * 100}%`;

            // Prepend activity so that the latest does not get to the front
            activity.prepend(itemProgress);
            latestActivity = key;
            activities = `<code>${key}</code>: ${entry.activity[key]}<br>${activities}`;

            // fill the timeline
            timelineBar.appendChild(itemProgress.cloneNode());
        }
        if (latestActivity)
            activity.innerHTML += `<p><i>${entry.activity[latestActivity]}</i><code>${latestActivity}</code></p>`;
        if (entry.shelf) activity.classList.add(entry.shelf);
        if (activities) {
            activity.addEventListener('click', function() {
                list.style.display = list.style.display === 'block' ? 'none' : 'block';
            });
            list.innerHTML = `${activities}`;
        }

        // Event to log activity
        info.addEventListener('click', function() {
            updateForm.style.display = 'block';
            updateForm.querySelector('label').innerHTML = `Update "${entry.name}"`;
            updateForm.setAttribute('media', id);
            document.getElementById('shelf').value = entry.shelf;
            // We don't scroll into view here because we sometimes need to copy
            // the name of the media (click to select)
            // document.getElementById('activity').scrollIntoView();
        });

        item.appendChild(info);
        item.appendChild(activity);
        item.appendChild(list);
        tableBody.appendChild(item);
    }

    // Run to apply filters
    filterDatabase();
})();

(async () => {
    // Add form for submission
    let ping = await fetch('./api/ping');
    if (!ping.ok) return;
    document.getElementById('serverOnly').style.display = 'flex';
})();

// Filter
document.getElementById('filter-work').addEventListener('input', filterDatabase);
document.getElementById('filter-medium').addEventListener('input', filterDatabase);
document.getElementById('filter-shelf').addEventListener('change', filterDatabase);
function filterDatabase() {
    const workFilter = document.getElementById('filter-work').value.toLowerCase();
    const mediumFilter = document.getElementById('filter-medium').value.toLowerCase();
    const shelfFilter = document.getElementById('filter-shelf').checked;

    let count = 0;

    tableBody.querySelectorAll('#database > li').forEach(item => {
        let matchedMedium = false, matchedWork = false, matchedShelf = false;
        item.querySelectorAll('.info > span.short').forEach(span => {
            const text = span.textContent.toLowerCase();
            if (text.includes(mediumFilter)) matchedMedium = true;
        });
        item.querySelectorAll('.info > span.long').forEach(span => {
            const text = span.textContent.toLowerCase();
            if (text.includes(workFilter)) matchedWork = true;
        });
        if (shelfFilter) {
            if (item.querySelector('.activity').classList.contains('Active'))
                matchedShelf = true;
        } else matchedShelf = true;

        if (matchedMedium && matchedWork && matchedShelf) {
            item.style.display = 'flex';
            count++;
        } else
            item.style.display = 'none';
    });

    document.getElementById('filter-count').textContent = `${count} entries found.`;
};

// Form for communicating with the server
document.getElementById('add').addEventListener('submit', function(e) {
    e.preventDefault();

    // Add an entry to the database variable
    const newEntry = {
        format: document.getElementById('format').value,
        length: document.getElementById('length').value,
        category: document.getElementById('category').value,
        name: document.getElementById('name').value.trim(),
        status: document.getElementById('status').value,
        activity: {},
        shelf: "",
    };
    database.push(newEntry);

    sendToServer();
});

document.getElementById('name').addEventListener('input', function() {
    const warning = document.getElementById('warning');
    // Find matching entries in the database
    const matches = database.filter(entry => entry.name.toLowerCase().includes(this.value.toLowerCase()));
    if (matches.length > 5) {
        warning.textContent = `Warning: ${matches.length} similar entries found in the database.`;
    } else if (matches.length > 0) {
        warning.innerHTML = `Possible matches: `;
        for (const match of matches) {
            warning.innerHTML += `<br>- ${match.name} (${match.format}, ${match.category})`;
        }
    } else {
        warning.textContent = 'No matches found in the database.';
    }
});

document.getElementById('update').addEventListener('submit', function(e) {
    e.preventDefault();

    // Log datetime and activity to the database
    const mediaId = this.getAttribute('media');
    const activity = document.getElementById('activity').value;
    database[mediaId].shelf = document.getElementById('shelf').value;

    if (activity)
        database[mediaId].activity[new Date().toISOString().split('T')[0]] =
            activity;

    sendToServer();
});

document.getElementById('sync').addEventListener('click', function(e) {
    e.preventDefault();

    const warning = document.getElementById('sync-warning');

    if (!syncInProgress) {
        syncInProgress = true;
        warning.textContent = 'Click again to start synchronization.';
        return
    }

    warning.textContent += '\nSync request in progress...';

    fetch('./api/sync').then(response => {
        if (response.ok) {
            warning.textContent = 'Sync request ok!';
        } else {
            throw new Error('Failed to synchronize database. Please try again.');
        }
        return response.text();
    }).then(text => {
        warning.innerText += `\n\n${text}`;
    }).catch(error => {
        warning.textContent += `\nError: ${error.message}`;
    });
});