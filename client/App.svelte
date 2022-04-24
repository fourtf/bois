<script lang="ts">
  import {
    ClientMessage,
    Game,
    ServerMessage,
    wsUrl,
    Coordinate,
    hasGameStarted,
  } from "../shared/shared";
  import BoiComponent from "./map/Boi.svelte";
  import CardComponent from "./map/Card.svelte";
  import CellComponent from "./map/Cell.svelte";
  import {
    cellOffset,
    cellSize,
    makeReconnectingWebSocket,
    playerIdStore,
    titleOfState,
  } from "./common";
  import { fade } from "svelte/transition";

  let game: Game | null = null;
  let playerId: string | null = null;
  let mapOffset: Coordinate = { x: 0, y: 0 };

  playerIdStore.subscribe((newPlayerId) => {
    playerId = newPlayerId;
  });

  let getWs = makeReconnectingWebSocket({
    url: wsUrl,
    protocols: "game-protocol",
    onopen: () => {
      if (playerId) {
        sendMessage({ type: "try-rejoin-game", id: playerId });
      }

      console.log("Connected to server");
    },
    onmessage: (event) => {
      console.log("Received message: ", event.data);
      let data: ServerMessage = JSON.parse(event.data);

      if (data.type === "game-updated") {
        game = data.game;
        console.log("Game received");
      } else if (data.type === "client-updated") {
        if (data.playerId) {
          playerIdStore.set(data.playerId);
        }
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
    if (/[rR]/.test(event.key)) {
      sendMessage({ type: "rotate-card" });
    }
  }

  let isMovingMap = false;

  function handleMouseDown(event: MouseEvent) {
    if (event.target === document.body && event.buttons & 1) {
      isMovingMap = true;
    }
  }

  function handleMouseUp(event: MouseEvent) {
    if (!(event.buttons & 1)) {
      isMovingMap = false;
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (isMovingMap) {
      mapOffset = {
        x: mapOffset.x + event.movementX,
        y: mapOffset.y + event.movementY,
      };
    }
  }
</script>

<svelte:head>
  <title>Bois</title>
</svelte:head>

<svelte:window
  on:keydown={handleKeydown}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:mousemove={handleMouseMove}
/>

{#if game}
  <!-- GAME INFO -->
  <div class="game-info">
    <div>
      <span>{titleOfState[game.state.type]}</span>

      <div style="display: flex">
        <div style="margin-right: 16px">
          <button
            disabled={game.state.type !== "game-ended"}
            on:click={() => sendMessage({ type: "new-game" })}
          >
            New Game
          </button>

          <button
            disabled={game.state.type !== "not-started"}
            on:click={() => sendMessage({ type: "start-game" })}
          >
            Start Game
          </button>

          <button
            disabled={hasGameStarted(game.state)}
            on:click={() => sendMessage({ type: "join-game" })}
          >
            Join Game
          </button>

          <button
            disabled={hasGameStarted(game.state)}
            on:click={() => sendMessage({ type: "leave-game" })}
          >
            Leave Game
          </button>

          <br />

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
          <button
            disabled={game.state.type !== "place-boi"}
            on:click={() => sendMessage({ type: "skip-placing-boi" })}
          >
            Skip Placing Boi
          </button>

          Drag the left mouse to move map.
          {#if game.cardCount !== undefined}
            <span>
              Cards left: {game.cardCount}
            </span>
          {/if}
        </div>

        <CardComponent
          cardId={game.state.type === "play-card"
            ? game.state.cardId
            : undefined}
          size={cellSize}
          rotation={game.state.type === "play-card"
            ? game.state.cardRotation
            : 0}
        />
      </div>

      <div>
        Players:
        {#each game.players as player}
          <div class="player">
            {player.name} ({player.score} points) (bois left: {player.boisLeft}) {#if !player.isConnected}(Disconnected){/if}
          </div>
        {/each}
      </div>

      <div>
        Spectators: {game.spectatorCount}
      </div>
    </div>
  </div>

  <!-- MAP -->
  <div
    style="position: absolute; margin-top: calc(50vh + {mapOffset.y}px); margin-left: calc(50vw + {mapOffset.x}px)"
  >
    <!-- CARDS -->
    {#each game.cells as cell}
      <CellComponent
        coord={cell.coord}
        size={cellSize}
        offset={cellOffset}
        rotation={cell.rotation ?? 0}
      >
        <CardComponent
          cardId={cell.cardId}
          size={cellSize}
          style="position: absolute"
        />

        <!-- BOI -->
        {#if cell.claimPos}
          <BoiComponent
            claimPos={cell.claimPos}
            style="position: absolute"
            rotation={-(cell.rotation ?? 0)}
          />
        {/if}
      </CellComponent>
    {/each}

    <!-- PLACEABLE POSITIONS -->
    {#if game.state.type === "play-card"}
      {#key game.state.coords}
        {#each game.state.coords as coord}
          <div
            transition:fade={{ duration: 100 }}
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
      {/key}
    {/if}

    <!-- BOI CARD BORDER -->
    {#if game.state.type === "place-boi"}
      <CellComponent
        coord={game.state.coord}
        size={cellSize}
        offset={cellOffset}
        rotation={game.state.rotation}
      >
        <!-- BOIS -->
        {#each game.state.claimPositions as claimPos}
          <BoiComponent
            {claimPos}
            rotation={-game.state.rotation}
            on:click={() =>
              sendMessage({
                type: "place-boi",
                claimPos,
              })}
          />
        {/each}
      </CellComponent>
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
    margin: 0 16px;
    width: calc(100% - 32px);
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
