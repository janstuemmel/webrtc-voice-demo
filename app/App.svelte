<style>
  .app {
    max-width: 600px;
    margin: 0 auto;
  }

  ul {
    list-style: inside;
    padding: 0;
  }

  .slider {
    background: red;
    appearance: none;
    height: 25px;
    width: 100%;
    outline: none
  }

  .progress {
    width: 100%;
  }

  .progress::-moz-progress-bar {
    background: grey;
  }

  .progress.green::-moz-progress-bar {
    background: green;
  }

</style>

<script>
  import { users } from './stores'
  import { onMount } from 'svelte'
  import VoiceChat from './VoiceChat'

  let audioEl
  let vc
  let inputVolume = 0
  let threshold = 10

  const remoteStream = new MediaStream
  
  onMount(() => {
    
    // add stream to audio element
    audioEl.srcObject = remoteStream

    // initialize voice chat
    vc = new VoiceChat(remoteStream)
  })

  function connect() {

    // connect voice chat
    if (vc) vc.connect()

    // get input volume
    vc.on('input:volume', vol => inputVolume = vol )
  }

  $: if (inputVolume > threshold) vc.setInputEnabled(inputVolume > threshold)

</script>

<div class="app">
  <audio bind:this="{audioEl}" autoplay></audio>
  <div class="panel">
    <p>
      <button on:click="{connect}">Connect</button>
    </p>
    <h4>Userlist</h4>  
    <ul>
      {#each $users as uid}
        <li>{uid}</li>
      {/each}
    </ul>
  </div>
  <div class="panel">
    <h4>Settings</h4>
    <p>
      <input type="range" min="0" max="100" class="slider" bind:value="{threshold}" />
    </p>    
    <p>
      <progress class="progress" class:green="{inputVolume >= threshold}" value="{inputVolume}" max="100"></progress>
    </p>
  </div>
</div>