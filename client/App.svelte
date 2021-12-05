<script lang="ts">
  import {
    ClientMessage,
    Game,
    ServerMessage,
    wsUrl,
    Coordinate,
  } from "../shared/shared";
  import BoiComponent from "./map/Boi.svelte";
  import CardComponent from "./map/Card.svelte";
  import CellComponent from "./map/Cell.svelte";
  import {
    cellOffset,
    cellSize,
    makeReconnectingWebSocket,
    titleOfState,
  } from "./common";

  let game: Game | null = null;
  let mapOffset: Coordinate = { x: 300, y: 200 };

  let getWs = makeReconnectingWebSocket({
    url: wsUrl,
    protocols: "game-protocol",
    onopen: () => {
      console.log("Connected to server");
    },
    onmessage: (event) => {
      console.log("Received message: ", event.data);
      let data: ServerMessage = JSON.parse(event.data);

      if (data.type === "game-updated") {
        game = data.game;
        console.log("Game received");
      }
    },
    onclose: () => {
      console.log("Disconnected from server");
    },
  });

  function sendMessage(message: ClientMessage) {
    console.log("Sending message: ", message);
    getWs().send(JSON.stringify(message));
  }

  function handleKeydown(event: KeyboardEvent) {
    const offset = 150;
    if (event.key === "ArrowLeft" || event.key === "a") {
      mapOffset = { x: mapOffset.x + offset, y: mapOffset.y };
    } else if (event.key === "ArrowRight" || event.key === "d") {
      mapOffset = { x: mapOffset.x - offset, y: mapOffset.y };
    } else if (event.key === "ArrowUp" || event.key === "w") {
      mapOffset = { x: mapOffset.x, y: mapOffset.y + offset };
    } else if (event.key === "ArrowDown" || event.key === "s") {
      mapOffset = { x: mapOffset.x, y: mapOffset.y - offset };
    }
  }
</script>

<svelte:head>
  <title>Bois</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

{#if game}
  <!-- GAME INFO -->
  <div class="game-info">
    <div>
      <span>{titleOfState[game.state.type]}</span>

      <div>
        <button
          disabled={game.state.type !== "not-started"}
          on:click={() => sendMessage({ type: "start-game" })}
        >
          Start Game
        </button>

        <button
          disabled={game.state.type !== "game-ended"}
          on:click={() => sendMessage({ type: "new-game" })}
        >
          New Game
        </button>

        <button
          disabled={game.state.type !== "draw-card"}
          on:click={() => sendMessage({ type: "draw-card" })}
        >
          Draw Card
        </button>
        <button
          disabled={game.state.type !== "play-card"}
          on:click={() => sendMessage({ type: "rotate-card" })}
        >
          Rotate Card
        </button>
        {#if game.state.type === "play-card"}
          <span>
            Current Card:
            <CardComponent
              cardId={game.state.cardId}
              size={cellSize}
              rotation={game.state.cardRotation}
            />
          </span>
        {/if}
        <button
          disabled={game.state.type !== "place-boi"}
          on:click={() => sendMessage({ type: "skip-placing-boi" })}
        >
          Skip Placing Boi
        </button>

        WASD to move map.
        {#if game.cardCount !== undefined}
          <span>
            Cards left: {game.cardCount}
          </span>
        {/if}
      </div>

      Players:
      {#each game.players as player}
        <div class="player">
          {player.name} ({player.score} points)
        </div>
      {/each}
    </div>
  </div>

  <!-- MAP -->
  <div
    style="position: absolute; margin: {mapOffset.y}px 0 0 {mapOffset.x}px; transition: margin 0.1s"
  >
    <!-- CARDS -->
    {#each game.cells as cell}
      <CellComponent coord={cell.coord} size={cellSize} offset={cellOffset}>
        <CardComponent
          cardId={cell.cardId}
          size={cellSize}
          style="position: absolute"
        />

        <!-- BOI -->
        {#if cell.boiSpot}
          <BoiComponent
            claimPosition={{ position: cell.boiSpot, type: "lawn" }}
            style="position: absolute"
          />
        {/if}
      </CellComponent>
    {/each}

    <!-- PLACEABLE POSITIONS -->
    {#if game.state.type === "play-card"}
      {#each game.state.coords as coord}
        <div
          class="placeable"
          style="margin: {coord.y * cellOffset}px 0 0 {coord.x *
            cellOffset}px; width: {cellSize}px; height: {cellSize}px"
          on:click={() =>
            sendMessage({
              type: "play-card",
              coord,
            })}
        />
      {/each}
    {/if}

    <!-- BOI CARD BORDER -->
    {#if game.state.type === "place-boi"}
      <div
        style="position: absolute; margin: {game.state.coord.y *
          cellOffset}px 0 0 {game.state.coord.x *
          cellOffset}px; width: {cellSize}px; height: {cellSize}px"
      >
        <!-- BOIS -->
        {#each game.state.claimPositions as claimPosition}
          <BoiComponent
            {claimPosition}
            on:click={() =>
              sendMessage({
                type: "place-boi",
                claimPosition,
              })}
          />
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <h1>loading</h1>
{/if}

<style>
  .placeable {
    position: absolute;
    outline: 2px solid blue;
    box-sizing: border-box;
  }

  .game-info {
    position: absolute;
    z-index: 100;
    top: 16px;
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .game-info > div {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
    padding: 16px;
  }
</style>
