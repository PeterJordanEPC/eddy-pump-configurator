# EDDY Pump — Pump & Dredge Configurator

Guided product configurator. Static site — no build step, no backend. Hosted on GitHub Pages.

## Live site

https://peterjordanepc.github.io/eddy-pump-configurator/

A subdomain (e.g. configure.eddypump.com) can be pointed at it later via
Settings → Pages → Custom domain.

## Flow

- Track 1 — Dredging: material → cu yd/hr production → power → deployment (6 options)
- Track 2 — Process Pump: material → GPM range → (discharge head if 50–200 GPM) → power → configuration
- GPM ranges map directly to pump size class: 1, 2, 3, 4, 6, 8, 10, 12, 16-in (5-in never recommended)
- 50–200 GPM with head over 120 ft recommends the HH2000 High-Head Pump
- Material step includes an "Other" option with free-text entry

## Swapping in real photos

Create an `images/` folder in this repo and drop JPGs in using these exact filenames.
Each photo automatically replaces its blueprint placeholder — zero code changes.

| Filename        | Card                          |
|-----------------|-------------------------------|
| dredging.jpg    | Application: Dredging         |
| slurry.jpg      | Application: Process Pump / HH2000 result |
| sand.jpg        | Material: Sand & gravel       |
| sludge.jpg      | Material: Sludge & fines      |
| tailings.jpg    | Material: Mine tailings       |
| debris.jpg      | Material: Debris-laden        |
| other.jpg       | Material: Other               |
| flow.jpg        | GPM / production / head cards |
| electric.jpg    | Power: Electric               |
| hydraulic.jpg   | Power: Hydraulic              |
| diesel.jpg      | Power: Diesel                 |
| excavator.jpg   | Deployment: Excavator Attachment |
| cable.jpg       | Deployment: Cable Deployed    |
| remote.jpg      | Deployment: Remote Operated Dredge |
| sled.jpg        | Deployment: Dredge Sled       |
| diver.jpg       | Deployment: Diver Operated Dredge |
| auger.jpg       | Deployment: Mini Auger ModDredge |
| flooded.jpg     | Configuration: Flooded Suction Pump |
| submersible.jpg | Configuration: Submersible Pump |
| selfpriming.jpg | Configuration: Self-Priming Pump |

Photo specs: landscape, roughly 3:2 ratio (cropped to fit via object-fit),
consistent angle/lighting/background across the set. ~1200px wide is plenty.

## Wiring the lead form to HubSpot

The form currently simulates submission. To go live, edit `handleSubmit()` in
index.html — the comment block marks the spot. POST to:

`https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`

Portal ID: 21618805. Include the configurator answers (application, material,
material_other, production/flow, head, power, deployment, recommended family)
as fields on a HubSpot form so the contact record carries the full build sheet.
