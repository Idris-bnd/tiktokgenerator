# TikTok Generator - Pensées Positives

Générateur de visuels TikTok pour promouvoir une application de pensées positives.

## Format des visuels

1. **Image 1** : Paysage + phrase
2. **Image 2** : Fond d'écran avec widget (pensée positive)
3. **Image 3** : Zoom sur la pensée + phrase

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev
```

## Ajouter tes images

1. **Photos** (paysages) → `public/assets/photos/`
2. **Fonds d'écran** → `public/assets/lockscreen/`

Les images `.jpg`, `.jpeg`, `.png` et `.webp` sont détectées automatiquement. Aucune config à modifier.

3. Personnalise les phrases dans `src/data/phrases.js` :
   - `PHRASES_IMAGE_1` : phrases pour l'image paysage
   - `PHRASES_IMAGE_3` : phrases pour l'image zoom
   - `PENSEES_POSITIVES` : les 5 pensées (à alimenter)
