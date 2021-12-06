<script lang="ts">
  import { getCardImage, getImage } from "../common";

  export let size: number;
  export let cardId: string | undefined = undefined;
  export let style: string = "";
  export let rotation: number = 0;

  $: image = cardId ? getCardImage(cardId) : getImage("card-bg.png");
  $: style_ =
    style +
    `; transition: transform 0.2s ease-in-out; transform: rotate(${rotation}deg);`;
</script>

<img src={image} alt={cardId} width={size} height={size} style={style_} />
