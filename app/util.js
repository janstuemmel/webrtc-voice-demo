export const getSoundVolume = (stream, callback) => {

  const audioCtx = new AudioContext
  const analyser = audioCtx.createAnalyser()
  const mic = audioCtx.createMediaStreamSource(stream)
  const node = audioCtx.createScriptProcessor(2048, 1, 1)

  // analyser args
  analyser.smoothingTimeConstant = 0.8
  analyser.fftSize = 1024

  mic.connect(analyser)
  analyser.connect(node)
  node.connect(audioCtx.destination)

  node.onaudioprocess = () => {

    let array = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(array)

    let values = 0

    for (let i=0; i<array.length; i++) {
      values += array[i]
    }

    const avg = values / array.length

    callback(avg)
  }
} 
