# Mountain City Wayfinder — Web App

The digital component for the Chongqing Wayfinder AP CSP project.

## What this is

A single-page web app that lets a user pick two Chongqing landmarks and get an elevation-aware walking route. The route accounts for stairs, elevators, skybridges, monorails, ropeways, and ferries — not just horizontal distance.

This is the app the QR code on the physical card points to.

## Files

```
wayfinder-app/
├─ index.html    Layout, styles, page structure
├─ data.js       Landmarks dataset + graph edges (the "data" CT practice)
├─ router.js     Dijkstra's algorithm with effort-weighted cost (the "algorithms" CT practice)
├─ app.js        Event handlers, rendering (the "interaction" CT practice)
└─ README.md     This file
```

No build step, no dependencies, no frameworks. Pure HTML/CSS/JavaScript. Loads from any static file host.

## How to host on GitHub Pages

1. Create a new public GitHub repository. Suggested name: `chongqing-wayfinder` or `mountain-city-wayfinder`.
2. Upload the four files (`index.html`, `data.js`, `router.js`, `app.js`) to the root of the repository.
3. In the repository, go to **Settings → Pages**.
4. Under **Source**, select **Deploy from a branch**.
5. Choose `main` branch and `/ (root)` folder. Click **Save**.
6. Wait 1–2 minutes for the site to deploy. GitHub will show the URL — usually something like:
   ```
   https://YOUR-USERNAME.github.io/chongqing-wayfinder/
   ```
7. Open that URL in a browser to confirm everything works.
8. **Regenerate the QR code on the printed card** to point to this URL. Any online QR generator works (qr-code-generator.com is fine). Save the new QR as PNG and ask Claude to swap it into the print-ready PDF, OR print a small sticker with the new QR and attach it over the placeholder QR.

## How to test locally before uploading

The app uses no server-side code, so you can just double-click `index.html` and it'll open in your browser. Some browsers restrict loading other JS files from `file://` URLs — if that happens, run a tiny local server instead:

```bash
# In the wayfinder-app directory:
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

## How to explain this app in your live demo

For the rubric's **Computational Thinking** category (worth a lot of points), open the **About** tab in the app and walk your teacher through the four practices, then open `router.js` in a text editor and show:

1. **`buildGraph(EDGES)`** — turns the raw data into an adjacency list (abstraction in action).
2. **`edgeCost(edge)`** — the cost function that weights vertical effort. This is the line that makes the algorithm Chongqing-aware:
   ```js
   const vertical = (edge.floors || 0) * (VERTICAL_COST[edge.type] || 50);
   ```
3. **`dijkstra(adj, source, target)`** — the actual algorithm. Walk through the loop: pull the unvisited node with the smallest distance, relax its neighbours, repeat.
4. **`app.js`** — show how the UI calls `findRoute()` on button click and renders the result. That's the event-driven interaction.

For the rubric's **Integration with Physical**, scan the QR code on the card while the app is open on your laptop — it should launch this exact app on your phone.

## Try these routes for the demo

- **Jiefangbei → Hongyadong** (the sample route from the card; 4 steps, includes elevator + skybridge + stairs)
- **Liziba → Hongyadong** (shows the monorail in action)
- **Eling → Chaotianmen** (uses the ropeway)
- **Ciqikou → Eling** (longest route, uses ferry + ropeway)

## Notes / known limits

- The dataset has 6 landmarks and ~13 edges. This is intentional: a small, curated graph that is reliable to demo is better than a city-wide map full of wrong directions.
- The reverse-direction text uses a simple word-flip heuristic (north↔south, up↔down). It's not perfect on every sentence. If the directions read oddly in one direction, the route is still correct.
- All times and distances are estimates from real Chongqing geography but are not precise — they're indicative.

## License

Built for AP Computer Science Principles, 2026. Made freely available.
