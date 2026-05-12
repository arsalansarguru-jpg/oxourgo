'use client'

/**
 * Uploads to the private `kyc` bucket using the Storage REST API so we can report upload progress.
 * Requires a valid user access token (not the anon key alone).
 */
export function uploadKycObjectWithProgress(input: {
  projectUrl: string
  anonKey: string
  accessToken: string
  objectPath: string
  file: File
  onProgress: (ratio: number) => void
}): Promise<void> {
  const base = input.projectUrl.replace(/\/+$/, '')
  const encodedPath = input.objectPath.split('/').map((p) => encodeURIComponent(p)).join('/')
  const url = `${base}/storage/v1/object/${encodeURIComponent('kyc')}/${encodedPath}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${input.accessToken}`)
    xhr.setRequestHeader('apikey', input.anonKey)
    xhr.setRequestHeader('Cache-Control', '3600')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('Content-Type', input.file.type || 'application/octet-stream')

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        input.onProgress(Math.min(1, ev.loaded / ev.total))
      } else {
        input.onProgress(0)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress(1)
        resolve()
      } else {
        let message = `Upload failed (${xhr.status})`
        try {
          const body = JSON.parse(xhr.responseText) as { message?: string; error?: string }
          message = body.message ?? body.error ?? message
        } catch {
          if (xhr.responseText) message = xhr.responseText.slice(0, 200)
        }
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.onabort = () => reject(new Error('Upload cancelled.'))

    xhr.send(input.file)
  })
}
