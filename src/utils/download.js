function dataURLtoBlob(dataURL) {
  const [header, base64] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.matchMedia('(pointer: coarse)').matches
}

function downloadToGallery(preview) {
  const files = [
    { name: 'fr-1.png', data: preview.fr.image1 },
    { name: 'fr-2.png', data: preview.fr.image2 },
    { name: 'fr-3.png', data: preview.fr.image3 },
    { name: 'en-1.png', data: preview.en.image1 },
    { name: 'en-2.png', data: preview.en.image2 },
    { name: 'en-3.png', data: preview.en.image3 },
  ]

  files.forEach(({ name, data }, i) => {
    setTimeout(() => {
      const blob = dataURLtoBlob(data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    }, i * 300)
  })
  return true
}

/**
 * Partage système (menu Partage) : uniquement les 3 images d'une langue.
 * Sur mobile, choisis TikTok dans la liste pour tenter un carrouel / import multi-images.
 * @param {'fr'|'en'} locale
 * @param {{ text?: string }} [options] — légende proposée à certaines apps (optionnel)
 * @returns {{ ok: true } | { ok: false, reason: string } | { ok: false, aborted: true }}
 */
export async function shareThreeImages(preview, locale, options = {}) {
  if (!navigator.share) {
    return { ok: false, reason: 'no-share-api' }
  }

  const bundle = locale === 'en' ? preview.en : preview.fr
  const prefix = locale === 'en' ? 'en' : 'fr'
  const shareFiles = [
    new File([dataURLtoBlob(bundle.image1)], `${prefix}-1.png`, { type: 'image/png' }),
    new File([dataURLtoBlob(bundle.image2)], `${prefix}-2.png`, { type: 'image/png' }),
    new File([dataURLtoBlob(bundle.image3)], `${prefix}-3.png`, { type: 'image/png' }),
  ]

  const payload = {
    files: shareFiles,
    title: `TikTok ${locale.toUpperCase()}`,
  }
  if (options.text) payload.text = options.text

  if (navigator.canShare && !navigator.canShare(payload)) {
    return { ok: false, reason: 'cannot-share-files' }
  }

  try {
    await navigator.share(payload)
    return { ok: true }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, aborted: true }
    return { ok: false, reason: err.message || 'share-error' }
  }
}

export async function downloadToFolder(preview) {
  if (isMobile()) {
    try {
      if (navigator.share) {
        const files = [
          { name: 'fr-1.png', data: preview.fr.image1 },
          { name: 'fr-2.png', data: preview.fr.image2 },
          { name: 'fr-3.png', data: preview.fr.image3 },
          { name: 'en-1.png', data: preview.en.image1 },
          { name: 'en-2.png', data: preview.en.image2 },
          { name: 'en-3.png', data: preview.en.image3 },
        ]
        const shareFiles = files.map(({ name, data }) => new File([dataURLtoBlob(data)], name, { type: 'image/png' }))
        await navigator.share({ files: shareFiles, title: 'TikTok Generator' })
        return true
      }
    } catch (err) {
      if (err.name === 'AbortError') return false
    }
    downloadToGallery(preview)
    return true
  }

  if (!('showDirectoryPicker' in window)) {
    downloadToGallery(preview)
    return true
  }

  try {
    const dirHandle = await window.showDirectoryPicker()
    const files = [
      { name: 'fr-1.png', data: preview.fr.image1 },
      { name: 'fr-2.png', data: preview.fr.image2 },
      { name: 'fr-3.png', data: preview.fr.image3 },
      { name: 'en-1.png', data: preview.en.image1 },
      { name: 'en-2.png', data: preview.en.image2 },
      { name: 'en-3.png', data: preview.en.image3 },
    ]

    for (const { name, data } of files) {
      const blob = dataURLtoBlob(data)
      const fileHandle = await dirHandle.getFileHandle(name, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
    }
    return true
  } catch (err) {
    if (err.name === 'AbortError') return false
    throw err
  }
}
