<script lang="ts">
  let blob: HTMLElement;

  function handleMouseMove(event: MouseEvent) {
    const {clientX, clientY} = event;

    blob.animate({
      left: `${clientX}px`,
      top: `${clientY}px`
    }, {duration: 3000, fill: "forwards"});
  }
</script>

<svelte:body on:mousemove={handleMouseMove}/>
<div bind:this={blob} class="glow-spot invisible md:visible"></div>

<style>
  .glow-spot {
    height: 10vmax;
    aspect-ratio: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    border-radius: 50%;
    background: linear-gradient(to right,
    aquamarine, mediumpurple);
    animation: rotate 20s infinite;
    filter: blur(500px);
    opacity: 0.3;
  }

  @keyframes rotate {
    from {
      rotate: 0deg;
    }

    to {
      rotate: 360deg;
    }
  }
</style>
