# EDDY Pump — Pump & Dredge Configurator

Guided product configurator. Static site — no build step, no backend. Hosted on GitHub Pages.

## Live site

With GitHub Pages enabled (Settings → Pages → Deploy from branch → main → / root),
the site is live at `https://<username>.github.io/eddy-pump-configurator/`

A subdomain (e.g. configure.eddypump.com) can be pointed at it later via
Settings → Pages → Custom domain.

## Swapping in real photos

Create an `images/` folder in this repo and drop JPGs in using these exact filenames.
Each photo automatically replaces its blueprint placeholder — zero code changes.

| Filename        | Card                          |
|-----------------|-------------------------------|
| dredging.jpg    | Application: Dredging         |
| slurry.jpg      | Application: Slurry transfer / HD slurry pump result |
| sump.jpg        | Application: Sump & pit cleanout |
| sand.jpg        | Material: Sand & gravel       |
| sludge.jpg      | Material: Sludge & fines      |
| tailings.jpg    | Material: Mine tailings       |
| debris.jpg      | Material: Debris-laden        |
| flow.jpg        | Production / flow rate cards  |
| electric.jpg    | Power: Electric               |
| hydraulic.jpg   | Power: Hydraulic              |
| diesel.jpg      | Power: Diesel                 |
| excavator.jpg   | Deployment: Excavator attachment |
| cable.jpg       | Deployment: Cable-deployed    |
| remote.jpg      | Deployment: Remote-operated (Subdredge result) |
| stationary.jpg  | Deployment: Stationary install |

Photo specs: landscape, roughly 3:2 ratio (cropped to fit via object-fit),
consistent angle/lighting/background across the set. ~1200px wide is plenty.

## Wiring the lead form to HubSpot

The form currently simulates submission. To go live, edit `handleSubmit()` in
index.html — the comment block marks the spot. POST to:

`https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`

Include the configurator answers (application, material, production, power,
deployment, recommended family) as fields on a HubSpot form so the contact
record carries the full build sheet.

## Files

- `index.html` — the entire app (React via CDN, no build step)
- `images/` — drop product photos here (create the folder when photos are ready)
