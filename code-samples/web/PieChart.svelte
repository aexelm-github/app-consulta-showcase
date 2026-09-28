<script>
    import { onMount } from "svelte";
    import HexColor from "../globals/HexColors"
    
    import {
        Chart,
        ArcElement,
        LineElement,
        BarElement,
        PointElement,
        BarController,
        BubbleController,
        DoughnutController,
        LineController,
        PieController,
        PolarAreaController,
        RadarController,
        ScatterController,
        CategoryScale,
        LinearScale,
        LogarithmicScale,
        RadialLinearScale,
        TimeScale,
        TimeSeriesScale,
        Decimation,
        Filler,
        Legend,
        Title,
        Tooltip,
        SubTitle,
    } from "chart.js";

    Chart.register(
        ArcElement,
        LineElement,
        BarElement,
        PointElement,
        BarController,
        BubbleController,
        DoughnutController,
        LineController,
        PieController,
        PolarAreaController,
        RadarController,
        ScatterController,
        CategoryScale,
        LinearScale,
        LogarithmicScale,
        RadialLinearScale,
        TimeScale,
        TimeSeriesScale,
        Decimation,
        Filler,
        Legend,
        Title,
        Tooltip,
        SubTitle
    );
    import ChartDataLabels from 'chartjs-plugin-datalabels';
    
    let Canvas = null
    let chart
    export let tabla 
    let data = []
    let labels = []
    export let title = "Gráfico"
    export let titleData = ""
    export let workareaId = null // ID del workarea para usar su paleta específica

    let ColorR = []

    onMount(async () => {
        // if (Canvas) {
        //     renderChart()
        // }
        
    });
    $:console.log("EXL",tabla)

    $: if (tabla && Canvas) {
        data = []
        labels = []
        ColorR = []
        tabla.rows.forEach( (e, index) => {
            var label = "", sep = "", cantidad, porcentaje
            // Si existe G_ETIQUETA, usarla directamente
            if (e.G_ETIQUETA) {
                label = e.G_ETIQUETA
            } else {
                // Recorre el arreglo para construir el label
                Object.keys(e).forEach( (k, idx) => {
                    console.log(k.slice(0,2), k.slice(0,2).indexOf("G_|D_"))
                    if (("G_|D_|USUARIO").indexOf(k.slice(0,2)) > -1) {
                       label += `${sep}${e[k]}`
                       sep = " - "
                    }
                })
            }
            cantidad = e.CANTIDAD
            porcentaje = e.PORCENTAJE
            // // Asigna a los arreglos data y labels para poder armar la grafica
            // console.log(label)
            data.push(cantidad)
            // Formato: "(x%) {label}"
            labels.push(`(${porcentaje.toFixed(1)}%) ${label}`)
            ColorR.push(HexColor(index, workareaId).hex + "ee")
        });
        if (chart) {
            chart.destroy();
        }
        renderChart()
    }

    const DoughnutTotal = {
        id: 'DoughnutTotal',
        beforeDraw: function(chart, a, b) {
            var width = chart.width,
            height = chart.height,
            ctx = chart.ctx;

            ctx.restore();
            var fontSize = (height*0.08).toFixed(2);
            ctx.font = fontSize + "px sans-serif";
            ctx.textBaseline = "middle";

            var text = chart.data.datasets[0].data.reduce((partialSum, a) => partialSum + a, 0),
            textX = Math.round((width - ctx.measureText(text).width) / 2),
            textY = (height / 2) +  chart.legend.height + chart.titleBlock.height;
            textY =  (height / 2) + (fontSize / 2) + 15

            ctx.fillStyle = "#00000055"
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    }

    const DoughnutLabeslLines = {
        id : "DoughnutLabelsLines",
        afterDraw(chart, args, options){
            const {ctx, chartArea: {top, bottom, left, right, width, height}}  = chart
            // console.log(chart.data.datasets)
            chart.data.datasets.forEach((dataset, i) => {
                let total =  chart.data.datasets[i].data.reduce((partialSum, a) => partialSum + a, 0)
                chart.getDatasetMeta(i).data.forEach((datapoint,index) => {
                    // console.log((chart.data.datasets[i].data[index]/total*100))
                    if ((chart.data.datasets[i].data[index]/total*100) >= 1) {
                        const  { x,y } = datapoint.tooltipPosition()
                        // ctx.fillStyle = dataset.borderColor[index]
                        // ctx.fill()
                        // ctx.fillRect(x,y, 2,2)

                        // drwa Line
                        const halfWidth = width / 2
                        const halfHeight = height / 2

                        const xLine = x >= halfWidth ? x + 30 : x - 30
                        const yLine = y >= halfHeight ? y + 30 : y - 30
                        const extraLine = x >= halfWidth ? 30 : -30
                        
                        // begin path
                        ctx.beginPath()
                        ctx.moveTo(x, y)
                        ctx.lineTo(xLine , yLine)
                        ctx.lineTo(xLine + extraLine, yLine)
                        ctx.strokeStyle = dataset.borderColor[index]
                        ctx.stroke()

                        // Text 
                        const textWidth = ctx.measureText(chart.data.labels[index]).width + 10
                        //console.log(textWidth, chart.data.labels[index])
                        ctx.font = '12px Arial'

                        // control the position
                        const textXPosition = x >= halfWidth ? 'left' : 'right'
                        const plusPx = x >= halfWidth ? 10 : -10
                        ctx.textAlign = textXPosition
                        ctx.textBaseline = 'middle'
                        ctx.fillStyle = dataset.borderColor[index]
                        ctx.fillText(chart.data.labels[index], xLine + extraLine + plusPx, yLine)
                    }
                })
            })
        }
    }

    const renderChart = () => {
        var ctx = Canvas.getContext("2d");
        chart = new Chart(ctx, {
            type: "doughnut",
            data : {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: ColorR,
                    borderColor: ColorR,
                    hoverOffset: 0,
                    cutout: '63%'
                }]
            },
            plugins: [ChartDataLabels, DoughnutTotal, DoughnutLabeslLines],
            options: { 
                layout: {
                    padding: 20
                },
                maintainAspectRatio: false ,
                plugins: {
                    datalabels: {
                      color:"#ffffff"  
                    },
                    title: {
                        display: true,
                        text: title,
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    },
                    legend: {
                        display: false,
                        labels: {
                            color: '#34495e'
                        },
                        position: 'bottom',
                        titleData
                    }
                }
            }
        });
    }
</script>

<div class="chart-container">
    <canvas bind:this={Canvas} style="padding: 20px;" />
</div>

<style>
    .chart-container {
        position: relative;
        margin: auto;
        height: 100%;
        width: 100%;
    }
</style>