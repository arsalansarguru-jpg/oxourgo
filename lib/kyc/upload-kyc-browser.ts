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
        let detail: unknown = null
        try {
          detail = JSON.parse(xhr.responseText) as { message?: string; error?: string }
        } catch {
          detail = xhr.responseText ? xhr.responseText.slice(0, 500) : null
        }
        console.error('[uploadKycObjectWithProgress] failed', xhr.status, detail)
        reject(new Error('UPLOAD_FAILED'))
      }
    }

    xhr.onerror = () => {
      console.error('[uploadKycObjectWithProgress] network error')
      reject(new Error('UPLOAD_FAILED'))
    }
    xhr.onabort = () => reject(new Error('Upload cancelled.'))

    xhr.send(input.file)
  })
}
