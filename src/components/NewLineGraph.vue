<template lang="pug">
    v-card(style="margin: 16px")
        .center(style="margin:8px")
            Plotly(:data="plot_data" :layout="layout" :display-mode-bar="size === 2" :watchShallow="true")

</template>

<script lang="ts">
    import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
    import { Plotly } from 'vue-plotly'
    import Vector from "nn-lib/dist/vector";
    import Matrix from "nn-lib/dist/matrix";

    @Component({components: {Plotly}})
    export default class NewLineGraph extends Vue {
        @Prop() g_title!: string
        @Prop({default: 1}) size!: number
        @Prop({default: []}) chartData!: any[]
        @Prop() estimate!: {calcFunc: Function, aFunc: Function, bFunc: Function, yFunc: Function}
        @Prop({default: false}) showEstimate!: boolean

        estimateData = {x: [], y:[], type: "scatter"}

        get plot_data() {
            return this.showEstimate? this.chartData.push(this.estimateData): this.chartData
        }

        @Watch('chartData')
        chartDataUpdate(val: any, oldVal: any) {
            if (this.estimate && this.showEstimate) {
                const x = new Vector(val.x)
                const y = new Vector(val.y)

                let A = new Matrix()
                A.createEmptyArray(x.size(), 2)
                A.matrix.forEach((val: Float32Array, index) => {
                    A.set(index,0, this.estimate.aFunc(x.get(index)))
                    A.set(index,1, this.estimate.bFunc(x.get(index)))
                })

                let b = new Vector(y.size())
                b.iterate((v: number, i: number) => {b.set(i, this.estimate.yFunc(y.get(i)))})

                const VL: Matrix = <Matrix> A.transpose().mm(A)
                const HL: Vector = <Vector> A.transpose().mm(b)

                let xV = VL.inv()!.mm(HL)

                this.estimateData.x = val.x
                this.estimateData.y = val.x.map((x: number) => {return this.estimate.calcFunc(x, xV.get(0), xV.get(1))})
            }
        }

        get_size(s: number) {
            switch (s) {
                case 0: return 300
                case 1: return 500
                case 2: return 1048
                default: return 500
            }
        }

        get layout() {
            return {
                title: {
                    text: this.g_title,
                    x: 0
                },
                autosize: true,
                margin: {
                    l: 30, r: 20, t: 30, b: 30
                },
                width: this.get_size(this.size),
                height: 300
            }
        }
    }
</script>

<style lang="scss">
    .center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>