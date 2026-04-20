# Media tracker
This is a media tracker to track my watch / read / play progress.

There are two ways to "access" the app:

## Through Github Page
Here, the webpage will function as a fancy JSON viewer.

## By running the server
Start the server with `node index.js`. The webpage will attempt to ping the URL `./api/ping`.

If the response is possitive, the webpage will allow you to edit the database it have. Here, you can add entries or log activities. After you click "submit," the webpage will edit the database it has, then send the entire JSON back to the server. The server will then rewrite the version it has.

In addition to the API, the server will also serve the `index.html` file, static files, and the `database.json`.

With this set up, the GitHub Page's version will be fully static, while you can put a local server at home (or use Tailscale) to update the database. By pressing the "sync database" button, you effectively run git commands to push the local changes to GitHub.