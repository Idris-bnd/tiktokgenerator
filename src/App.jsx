import { useState, useEffect } from 'react'
import { PHRASES_IMAGE_1, PHRASES_IMAGE_3, PENSEES_POSITIVES, DESCRIPTIONS_TIKTOK } from './data/phrases'
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
  return `${import.meta.env.BASE_URL}assets/${folder}/${filename}`
}

function getTextPos() {
  const textXOptions = [400, 300]
  const textYOptions = [250, 500, 700]
  return { textX: textXOptions[getRandomIndex(textXOptions)], textY: textYOptions[getRandomIndex(textYOptions)] }
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
  const [genState, setGenState] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  const handleCopyDesc = async (text, lang) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(lang)
      setTimeout(() => setCopiedField(null), 1500)
    } catch {
      alert('Copie échouée')
    }
  }

  async function buildPreviewFromState(state) {
    const photoUrl = getImageUrl('photos', state.photoFilename)
    const lockscreenUrl = getImageUrl('lockscreen', state.lockscreenFilename)
    const phrase1Fr = getText(PHRASES_IMAGE_1[state.idx1], 'fr')
    const phrase1En = getText(PHRASES_IMAGE_1[state.idx1], 'en')
    const phrase3Fr = getText(PHRASES_IMAGE_3[state.idx3], 'fr')
    const phrase3En = getText(PHRASES_IMAGE_3[state.idx3], 'en')
    const penseeFr = getText(PENSEES_POSITIVES[state.idxP], 'fr')
    const penseeEn = getText(PENSEES_POSITIVES[state.idxP], 'en')
    const textPos = state.textPos

    const [image1Fr, image2Fr, image1En, image2En] = await Promise.all([
      generateImageWithText(photoUrl, phrase1Fr, textPos),
      generateLockscreenWithThought(lockscreenUrl, penseeFr),
      generateImageWithText(photoUrl, phrase1En, textPos),
      generateLockscreenWithThought(lockscreenUrl, penseeEn),
    ])
    const image3Fr = await generateZoomWithPhrase(image2Fr, phrase3Fr)
    const image3En = await generateZoomWithPhrase(image2En, phrase3En)
    return {
      fr: { image1: image1Fr, image2: image2Fr, image3: image3Fr },
      en: { image1: image1En, image2: image2En, image3: image3En },
    }
  }

  const runPartialUpdate = async (updateState) => {
    if (!genState || !preview) return
    const newState = { ...genState, ...updateState }
    setGenState(newState)
    const result = await buildPreviewFromState(newState)
    setPreview(result)
  }

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
        const idx1 = getRandomIndex(PHRASES_IMAGE_1)
        const idx3 = getRandomIndex(PHRASES_IMAGE_3)
        const idxP = getRandomIndex(PENSEES_POSITIVES)
        const idxDesc = getRandomIndex(DESCRIPTIONS_TIKTOK)
        const textPos = getTextPos()

        const state = { photoFilename, lockscreenFilename, idx1, idx3, idxP, idxDesc, textPos }
        setGenState(state)
        const result = await buildPreviewFromState(state)
        setPreview(result)
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

  const handleChangeImage1 = async () => {
    if (!genState) return
    setGenerating(true)
    try {
      await runPartialUpdate({ photoFilename: PHOTOS[getRandomIndex(PHOTOS)] })
    } finally {
      setGenerating(false)
    }
  }

  const handleChangeImages2And3 = async () => {
    if (!genState) return
    setGenerating(true)
    try {
      await runPartialUpdate({ lockscreenFilename: LOCKSCREENS[getRandomIndex(LOCKSCREENS)] })
    } finally {
      setGenerating(false)
    }
  }

  const handleChangeText1 = async () => {
    if (!genState) return
    setGenerating(true)
    try {
      await runPartialUpdate({ idx1: getRandomIndex(PHRASES_IMAGE_1) })
    } finally {
      setGenerating(false)
    }
  }

  const handleChangePensee23 = async () => {
    if (!genState) return
    setGenerating(true)
    try {
      await runPartialUpdate({ idxP: getRandomIndex(PENSEES_POSITIVES) })
    } finally {
      setGenerating(false)
    }
  }

  const handleChangeText3 = async () => {
    if (!genState) return
    setGenerating(true)
    try {
      await runPartialUpdate({ idx3: getRandomIndex(PHRASES_IMAGE_3) })
    } finally {
      setGenerating(false)
    }
  }

  const handleChangeTextPos1 = async () => {
    if (!genState) return
    setGenerating(true)
    try {
      await runPartialUpdate({ textPos: getTextPos() })
    } finally {
      setGenerating(false)
    }
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

      {preview && genState?.idxDesc != null && DESCRIPTIONS_TIKTOK[genState.idxDesc] && (
        <div className="desc-tiktok">
          <h4 className="desc-title">Description TikTok</h4>
          <div className="desc-fields">
            <div className="desc-field-wrapper">
              <label className="desc-label">
                FR {copiedField === 'fr' && <span className="desc-copied">Copié !</span>}
              </label>
              <input
                type="text"
                className="desc-input"
                value={getText(DESCRIPTIONS_TIKTOK[genState.idxDesc], 'fr')}
                readOnly
                onClick={(e) => handleCopyDesc(e.target.value, 'fr')}
              />
            </div>
            <div className="desc-field-wrapper">
              <label className="desc-label">
                EN {copiedField === 'en' && <span className="desc-copied">Copié !</span>}
              </label>
              <input
                type="text"
                className="desc-input"
                value={getText(DESCRIPTIONS_TIKTOK[genState.idxDesc], 'en')}
                readOnly
                onClick={(e) => handleCopyDesc(e.target.value, 'en')}
              />
            </div>
          </div>
          <p className="desc-hint">Clique pour copier dans le presse-papier</p>
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

      {preview && (
        <div className="modifier-buttons">
          <h4 className="modifier-title">Modifier</h4>
          <div className="modifier-grid">
            <button
              className="btn-modifier"
              onClick={handleChangeImage1}
              disabled={generating}
            >
              Image 1
            </button>
            <button
              className="btn-modifier"
              onClick={handleChangeImages2And3}
              disabled={generating}
            >
              Images 2 & 3
            </button>
            <button
              className="btn-modifier"
              onClick={handleChangeText1}
              disabled={generating}
            >
              Texte 1
            </button>
            <button
              className="btn-modifier"
              onClick={handleChangePensee23}
              disabled={generating}
            >
              Pensée 2 & 3
            </button>
            <button
              className="btn-modifier"
              onClick={handleChangeText3}
              disabled={generating}
            >
              Texte 3
            </button>
            <button
              className="btn-modifier"
              onClick={handleChangeTextPos1}
              disabled={generating}
            >
              Emplacement texte 1
            </button>
          </div>
        </div>
      )}
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
