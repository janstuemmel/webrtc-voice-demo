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
  import { volume, users, threshold } from './stores'

</script>

<div class="app">
  <div class="panel">
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
      <input type="range" min="0" max="100" class="slider" bind:value="{$threshold}" />
    </p>    
    <p>
      <progress class="progress" class:green="{$volume >= $threshold}" value="{$volume}" max="100"></progress>
    </p>
  </div>
</div>