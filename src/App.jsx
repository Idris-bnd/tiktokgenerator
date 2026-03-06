import { useState, useEffect } from 'react'
import { PHRASES_IMAGE_1, PHRASES_IMAGE_3, PENSEES_POSITIVES } from './data/phrases'
import { PHOTOS, LOCKSCREENS } from './config/images'
import {
  generateImageWithText,
  generateLockscreenWithThought,
  generateZoomWithPhrase,
} from './utils/imageGenerator'
import { downloadToFolder } from './utils/download'
import './App.css'

const PASSWORD_B64 = 'anVzdGV1bnRpa3Rvaw=='

function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const encoded = btoa(password)
    if (encoded === PASSWORD_B64) {
      sessionStorage.setItem('tiktok-auth', '1')
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <div className="login-form">
      <h1>TikTok Generator</h1>
      <p className="login-subtitle">Entrez le mot de passe pour accéder</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
          placeholder="Mot de passe"
          autoFocus
        />
        <button type="submit">Accéder</button>
      </form>
      {error && <p className="login-error">Mot de passe incorrect</p>}
    </div>
  )
}

function getRandomIndex(arr) {
  return Math.floor(Math.random() * arr.length)
}

function getText(item, lang) {
  if (typeof item === 'string') return item
  return lang === 'en' ? (item.en || item.text) : (item.text || item.en)
}

function getImageUrl(folder, filename) {
  return `/assets/${folder}/${filename}`
}

function ImageCarousel({ title, images, folder }) {
  return (
    <div className="encart">
      <h3 className="encart-title">{title}</h3>
      <div className="encart-scroll">
        {images.length === 0 ? (
          <p className="encart-empty">
            Aucune image. Ajoute des fichiers dans <code>public/assets/{folder}/</code>
          </p>
        ) : (
          images.map((filename) => (
            <div key={filename} className="encart-item">
              <img
                src={getImageUrl(folder, filename)}
                alt={filename}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MainApp() {
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [preview, setPreview] = useState(null)

  const handleGenerate = async () => {
    if (PHOTOS.length === 0 || LOCKSCREENS.length === 0) {
      alert('Ajoute des images dans les dossiers assets/photos et assets/lockscreen')
      return
    }

    setGenerating(true)
    setPreview(null)

    const maxRetries = 5
    let lastError = null
    let success = false

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const photoFilename = PHOTOS[getRandomIndex(PHOTOS)]
        const lockscreenFilename = LOCKSCREENS[getRandomIndex(LOCKSCREENS)]
        const photoUrl = getImageUrl('photos', photoFilename)
        const lockscreenUrl = getImageUrl('lockscreen', lockscreenFilename)

        const idx1 = getRandomIndex(PHRASES_IMAGE_1)
        const idx3 = getRandomIndex(PHRASES_IMAGE_3)
        const idxP = getRandomIndex(PENSEES_POSITIVES)

        const phrase1Fr = getText(PHRASES_IMAGE_1[idx1], 'fr')
        const phrase1En = getText(PHRASES_IMAGE_1[idx1], 'en')
        const phrase3Fr = getText(PHRASES_IMAGE_3[idx3], 'fr')
        const phrase3En = getText(PHRASES_IMAGE_3[idx3], 'en')
        const penseeFr = getText(PENSEES_POSITIVES[idxP], 'fr')
        const penseeEn = getText(PENSEES_POSITIVES[idxP], 'en')

        const textXOptions = [400, 300]
        const textYOptions = [250, 500, 700]
        const textPos = { textX: textXOptions[getRandomIndex(textXOptions)], textY: textYOptions[getRandomIndex(textYOptions)] }

        const [image1Fr, image2Fr, image1En, image2En] = await Promise.all([
          generateImageWithText(photoUrl, phrase1Fr, textPos),
          generateLockscreenWithThought(lockscreenUrl, penseeFr),
          generateImageWithText(photoUrl, phrase1En, textPos),
          generateLockscreenWithThought(lockscreenUrl, penseeEn),
        ])

        const image3Fr = await generateZoomWithPhrase(image2Fr, phrase3Fr)
        const image3En = await generateZoomWithPhrase(image2En, phrase3En)

        setPreview({
          fr: { image1: image1Fr, image2: image2Fr, image3: image3Fr },
          en: { image1: image1En, image2: image2En, image3: image3En },
        })
        success = true
        break
      } catch (err) {
        lastError = err
      }
    }

    if (!success) {
      console.error(lastError)
      alert('Erreur lors de la génération. Redémarre le serveur (npm run dev) si tu as ajouté/supprimé des images.')
    }
    setGenerating(false)
  }

  useEffect(() => {
    if (PHOTOS.length > 0 && LOCKSCREENS.length > 0) {
      handleGenerate()
    }
  }, [])

  const handleDownload = async () => {
    if (!preview) return
    setDownloading(true)
    try {
      const success = await downloadToFolder(preview)
      if (success) alert('Téléchargement terminé !')
    } catch (err) {
      console.error(err)
      alert('Erreur lors du téléchargement.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>TikTok Generator</h1>
        <p className="subtitle">Pensées positives — Crée tes vidéos en un clic</p>
      </header>

      {preview && (
        <div className="preview-wrapper">
          <section className="preview-section preview-fr">
            <h3 className="preview-section-title">Preview FR</h3>
            <div className="preview-scroll">
              <div className="preview-item">
                <span className="preview-label">Image 1</span>
                <img src={preview.fr.image1} alt="Image 1 FR" />
              </div>
              <div className="preview-item">
                <span className="preview-label">Image 2</span>
                <img src={preview.fr.image2} alt="Image 2 FR" />
              </div>
              <div className="preview-item">
                <span className="preview-label">Image 3</span>
                <img src={preview.fr.image3} alt="Image 3 FR" />
              </div>
            </div>
          </section>
          <section className="preview-section preview-en">
            <h3 className="preview-section-title">Preview EN</h3>
            <div className="preview-scroll">
              <div className="preview-item">
                <span className="preview-label">Image 1</span>
                <img src={preview.en.image1} alt="Image 1 EN" />
              </div>
              <div className="preview-item">
                <span className="preview-label">Image 2</span>
                <img src={preview.en.image2} alt="Image 2 EN" />
              </div>
              <div className="preview-item">
                <span className="preview-label">Image 3</span>
                <img src={preview.en.image3} alt="Image 3 EN" />
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="app-buttons">
        <button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Génération...' : 'Générer un TikTok'}
        </button>
        {preview && (
          <button
            className="btn-download"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Téléchargement...' : 'Télécharger'}
          </button>
        )}
      </div>
    </div>
  )
}

function App() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('tiktok-auth') === '1')

  if (!auth) {
    return <LoginForm onSuccess={() => setAuth(true)} />
  }

  return <MainApp />
}

export default App
