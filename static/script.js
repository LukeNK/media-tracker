let timeline = {
    start: new Date('2026-01-01'),
    end: new Date(),
};
let database = {};

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
            alert('Entry added successfully!');
            location.reload();
        } else {
            alert('Failed to add entry. Please try again.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the entry. Please try again.');
    });
}

(async () => {
    // Download database
    let data = await fetch('./database.json');
    database = await data.json();
    console.log(database);

    // Populate table
    for (const id in database) {
        const entry = database[id];
        const item = document.createElement('li'),
            info = document.createElement('div'),
            activity = document.createElement('div');

        info.classList.add('info');
        info.innerHTML = `
            <span class="short">${entry.length}</span><span class="long">${entry.category}</span>
            <span class="short">${entry.status}</span><span class="long">${entry.name}</span>`;

        activity.classList.add('activity');
        let latestActivity = '';
        for (const key in entry.activity) {
            const itemProgress = document.createElement('span');
            let progressPercent = (new Date(key) - timeline.start) / (timeline.end - timeline.start);
            progressPercent = Math.max(progressPercent, 0);
            itemProgress.style.width = `${progressPercent * 100}%`;

            // Prepend activity so that the latest does not get to the front
            activity.prepend(itemProgress);
            latestActivity = key;

            // fill the timeline
            timelineBar.appendChild(itemProgress.cloneNode());
        }
        if (latestActivity)
            activity.innerHTML += `<p>${entry.activity[latestActivity]} (${latestActivity})</p>`;

        // Event to log activity
        info.addEventListener('click', function() {
            updateForm.style.display = 'block';
            updateForm.querySelector('label').innerHTML = `Update "${entry.name}"`;
            updateForm.setAttribute('media', id);
        });

        item.appendChild(info);
        item.appendChild(activity);
        tableBody.appendChild(item);
    }
})();

(async () => {
    // Add form for submission
    let ping = await fetch('./api/ping');
    if (!ping.ok) return;
    document.getElementById('serverOnly').style.display = 'flex';
})();

document.getElementById('add').addEventListener('submit', function(e) {
    e.preventDefault();

    // Add an entry to the database variable
    const newEntry = {
        format: document.getElementById('format').value,
        length: document.getElementById('length').value,
        category: document.getElementById('category').value,
        name: document.getElementById('name').value,
        status: document.getElementById('status').value,
        shelf: document.getElementById('shelf').value,
        activity: {
            [new Date().toISOString().split('T')[0]]: 'Added to database',
        },
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
        warning.innerHTML = `Possible matches: `
        for (const match of matches) {
            warning.innerHTML += `<br>- ${match.name} (${match.format}, ${match.category})`;
        }
    } else {
        warning.textContent = '';
    }
});

document.getElementById('update').addEventListener('submit', function(e) {
    e.preventDefault();

    // Log datetime and activity to the database
    const mediaId = this.getAttribute('media');
    const activity = document.getElementById('activity').value;
    if (!activity) return;
    database[mediaId].activity[new Date().toISOString().split('T')[0]] = activity;

    sendToServer();
});