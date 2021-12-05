<script lang="ts">
  import type { Coordinate } from "../../shared/coordinate";

  export let size: number;
  export let offset: number;
  export let coord: Coordinate;
  export let rotation: number;

  $: y = (coord?.x ?? 0) * (offset ?? 1);
  $: x = (coord?.y ?? 0) * (offset ?? 1);
</script>

<div
  width={size}
  height={size}
  style="position: absolute; margin: {x}px 0 0 {y}px; width: {size}px; height: {size}px; transform: rotate({rotation}deg);"
>
  <slot />
</div>
