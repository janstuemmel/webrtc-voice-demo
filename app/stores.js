import { writable } from 'svelte/store'

export const users = writable([])

export const mediaDeviceInit = writable(null)

export const volume = writable(0)

export const threshold = writable(10)