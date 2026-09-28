<script>
    import aruaco from "../../../assets/aruaco.jpg";
    import LittleMenu from "./LittleMenu.svelte";
    import { createEventDispatcher } from "svelte";
    import ButtonCircular from "../../../lib/ButtonCircular.svelte";
    import * as Fx from "../../../globals/Fx";

    const dispatch = createEventDispatcher();

    export let pregunta;
    export let active = false
    export let index;
    export let selectedPregunta = null;

    const __handleClick = (e) => {
        dispatch("GO", {index, id:`pregunta-${pregunta.PRE_NUMERO}`});
    };

    const __handleDragStart = (event, pregunta) => {
        dispatch("dragStart", { event, pregunta });
        event.dataTransfer.setData(
            "text/plain",
            JSON.stringify({ source: "pregunta", data: pregunta })
        );
    };

    const __handleRemove = () => {
        dispatch("remove", pregunta)
    }
</script>

<main id={`pregunta-${pregunta.PRE_NUMERO}`}>
    <div
        class="card square-effect"
        on:click|stopPropagation={__handleClick}
        draggable="true"
        on:dragstart={(event) => __handleDragStart(event, pregunta)}
        on:dragend={() => dispatch("dragend",{})}
        class:active={active}
    >
        {#if pregunta}
            <div
                class="number"
                style="color:{Fx.COLOR(pregunta.PRE_NUMERO + 1)}"
                class:bgDetalle={pregunta.PRE_TABLA === "DETALLE" ? true : false}
            >
                <span>{pregunta.PRE_NUMERO}</span>
            </div>
            <div class="descripcion" style="color:{selectedPregunta == index ? Fx.COLOR(pregunta.PRE_NUMERO + 1) == undefined ? "#4dd0e1" : Fx.COLOR(pregunta.PRE_NUMERO + 1) : "#fff"}" class:text-shadow={selectedPregunta == index ? true : false}>{pregunta.PRE_TEXTO}</div>
            {#if active}
                <ButtonCircular
                    fontSize={"0.4em"}
                    bgcolor={"#00000000"}
                    on:click={__handleRemove}
                    materialIcon={"close"}
                    size={"30px"}
                    color={"#e7e7e7"}
                    title={"Remover"}
                />
            {/if}
        {/if}
    </div>
    <div class="active-bar" style="background-color:{selectedPregunta == index ? Fx.COLOR(pregunta.PRE_NUMERO + 1) == undefined ? "#fff" : Fx.COLOR(pregunta.PRE_NUMERO + 1) : "transparent"}"></div>
</main>

<style>
    main {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .card {
        font-family: "Kdam Thmor Pro";
        margin: 10px;
        border-radius: 16px;
        display: flex;
        flex-direction: row;
        margin: 5px;
        align-items: center;
        position: relative;
        color: var(--color);
        cursor: pointer;
        transition: all ease 350ms;
        width: 100%;
        padding-inline-end: 5px;
    }

    .active {
        background-color: #a8dbe430;
    }

    .card:hover {
        /* transform: scale(1.07); */
    }

    .number {
        height: 40px;
        width: 40px;
        border-radius: 50%;
        background-color: #00000011;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 0.8em;
    }

    .descripcion {
        font-size: 0.7em;
        display: flex;
        padding: 10px;
        text-align: start;
        flex: 1;
        align-items: center;
        color: #fff;
    }

    .square-effect::after {
        background-color: #f1c40f22;
        border-radius: 50px;
    }

    .bgDetalle {
        background-color: #ffffff22;
    }

    .active-bar {
        height: 4px;
        width: 30px;
        padding-inline: 20px;
        border-radius: 5px;
        background-color: transparent;
    }

    .text-shadow {
        text-shadow: 3px 6px 20px #000, 1px -3px 20px #000;
    }
</style>
