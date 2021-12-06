<script lang="ts">
  import type { Coordinate } from "../../shared/coordinate";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let size: number;
  export let offset: number;
  export let coord: Coordinate;
  export let rotation: number;

  $: y = (coord?.x ?? 0) * (offset ?? 1);
  $: x = (coord?.y ?? 0) * (offset ?? 1);
</script>

<div transition:fly={{ easing: quintOut, y: -size * 0.25, duration: 500 }}>
  <div
    width={size}
    height={size}
    style="position: absolute; margin: {x}px 0 0 {y}px; width: {size}px; height: {size}px; transform: rotate({rotation}deg);"
  >
    <slot />
  </div>
</div>
