<script lang="ts">
  import type { ClaimPos } from "../../shared/shared";
  import { boiSize, cellSize } from "../common";

  export let claimPos: ClaimPos;
  export let style: string = "";

  $: x = Math.floor(claimPos.position[0] * cellSize - boiSize / 2);
  $: y = Math.floor(claimPos.position[1] * cellSize - boiSize / 2);
</script>

<img
  src="/images/boi.png"
  alt="boi"
  style="position: absolute; margin: {y}px 0 0 {x}px; width: {boiSize}px; height: {boiSize}px; outline-color: {claimPos.type ===
  'lawn'
    ? 'green'
    : 'red'}; {style}"
  on:click
/>
