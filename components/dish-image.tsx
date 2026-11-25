"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { remoteUrl } from "@/lib/site"

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""
  const size = 0x8000
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size))
  }
  return btoa(binary)
}

async function nativeImage(file: string): Promise<string | null> {
  const path = `images/${file}`
  try {
    await Filesystem.stat({ path, directory: Directory.Data })
    const uri = await Filesystem.getUri({ path, directory: Directory.Data })
    return Capacitor.convertFileSrc(uri.uri)
  } catch {
    // Not cached yet.
  }
  try {
    const response = await fetch(remoteUrl(`/images/recipes/${file}`))
    if (!response.ok) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    await Filesystem.mkdir({ path: "images", directory: Directory.Data, recursive: true }).catch(() => undefined)
    await Filesystem.writeFile({ path, directory: Directory.Data, data: bytesToBase64(bytes) })
    const uri = await Filesystem.getUri({ path, directory: Directory.Data })
    return Capacitor.convertFileSrc(uri.uri)
  } catch {
    return null
  }
}

export function DishImage({
  file,
  alt,
  className,
  priority = false,
}: {
  file: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const local = `/images/recipes/${file}`
  const [src, setSrc] = useState(local)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancel = false
    nativeImage(file).then((cached) => {
      if (!cancel && cached) setSrc(cached)
    })
    return () => {
      cancel = true
    }
  }, [file])

  if (src.startsWith("http") || src.startsWith("capacitor") || src.startsWith("https://localhost")) {
    // Native file and remote URLs are already sized WebPs. next/image cannot load capacitor://.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />
  }

  return <Image src={local} alt={alt} width={1200} height={900} priority={priority} className={className} />
}
