<script lang="ts">
    import { getCardImage } from "../common";

    export let size: number;
    export let cardId: string;
    export let style: string = "";

    $: image = getCardImage(cardId);
</script>

<img src={image} alt={cardId} width={size} height={size} {style} />
