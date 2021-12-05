<script lang="ts">
  import type { Coordinate } from "../../shared/coordinate";

  export let size: number;
  export let offset: number;
  export let coord: Coordinate;

  $: mx = (coord?.x ?? 0) * (offset ?? 1);
  $: my = (coord?.y ?? 0) * (offset ?? 1);
</script>

<div
  width={size}
  height={size}
  style="position: absolute; margin: {my}px 0 0 {mx}px; width: {size}px; height: {size}px"
>
  <slot />
</div>
