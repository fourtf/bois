<script lang="ts">
  import { getCardImage } from "../common";

  export let size: number;
  export let cardId: string;
  export let style: string = "";
  export let rotation: number = 0;

  $: image = getCardImage(cardId);
  $: style_ = style + `; transform: rotate(${rotation}deg);`;
</script>

<img src={image} alt={cardId} width={size} height={size} style={style_} />
