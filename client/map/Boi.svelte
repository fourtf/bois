<script lang="ts" context="module">
    const boiPositions: { [key in SpotPosition]: Point } = {
        left: {
            x: 0,
            y: cellSize / 2 - boiSize / 2,
        },
        right: {
            x: cellSize - boiSize,
            y: cellSize / 2 - boiSize / 2,
        },
        top: {
            x: cellSize / 2 - boiSize / 2,
            y: 0,
        },
        bottom: {
            x: cellSize / 2 - boiSize / 2,
            y: cellSize - boiSize,
        },
        center: {
            x: cellSize / 2 - boiSize / 2,
            y: cellSize / 2 - boiSize / 2,
        },
    };
</script>

<script lang="ts">
    import type { Point, SpotPosition, SpotType } from "../../shared/shared";
    import { boiSize, cellSize } from "../common";

    export let spot: SpotPosition;
    export let connector: SpotType = "lawn";
    export let style: string = "";
</script>

<img
    src="/images/boi.png"
    alt="boi"
    style="position: absolute; margin: {boiPositions[spot]
        .y}px 0 0 {boiPositions[spot]
        .x}px; width: {boiSize}px; height: {boiSize}px; outline-color: {connector ===
    'lawn'
        ? 'green'
        : 'red'}; {style}"
    on:click
/>
