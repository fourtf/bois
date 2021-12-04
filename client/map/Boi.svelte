<script lang="ts">
    import type { ClaimPos } from "../../shared/shared";
    import { boiSize, cellSize } from "../common";

    export let claimPosition: ClaimPos;
    export let style: string = "";

    $: let x = Math.floor(claimPosition.position[0] * cellSize);
    $: let y = Math.floor(claimPosition.position[1] * cellSize);
</script>

<img
    src="/images/boi.png"
    alt="boi"
    style="position: absolute; margin: {y}px 0 0 {x}px; width: {boiSize}px; height: {boiSize}px; outline-color: {claimPosition.type ===
    'lawn'
        ? 'green'
        : 'red'}; {style}"
    on:click
/>
