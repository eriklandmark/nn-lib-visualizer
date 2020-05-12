<template lang="pug">
    .center(style="margin-top: 30px")
        .row()
            v-card(width="100%" style="margin: 16px")
                v-card-title
                    span Model
                    v-spacer

                    v-dialog(v-model='settingsDialog' width='300')
                        template(v-slot:activator='{ on }')
                            v-btn(icon style="margin-left: 8px" v-on="on" )
                                v-icon mdi-dots-vertical
                        v-card
                            v-card-title.headline.grey.lighten-2(primary-title) Settings
                            v-card-text
                                v-card-subtitle Chart size:
                                v-btn-toggle(v-model='toggle_size')
                                    v-btn(small) S
                                    v-btn(small) M
                                    v-btn(small) L
                                v-switch(v-model="showEstimate" label="Show estimate graphs:")
                            v-divider
                            v-card-actions
                                v-spacer
                                v-btn(color='primary' text='' @click='settingsDialog = false') Close

                v-card-text(v-if="hasData")
                    v-tabs(v-model="tab" centered)
                        v-tab Info
                        v-tab Structure
                    v-tabs-items(v-model="tab")
                        v-tab-item
                            v-data-table(:headers="headers" :items="table_data" hide-default-footer item-key="name" show-expand)
                                template(v-slot:expanded-item="{ headers, item }" )
                                    td(:colspan="headers.length")
                                        div(style="margin: 16px 0")
                                            v-progress-linear(:value="$store.state.models[item.name].info.current_batch_for_epoch / $store.state.models[item.name].info.batches_per_epoch * 100" height="25" rounded style="margin-bottom:16px")
                                                template(v-slot="{ value }")
                                                    span(style="color:white") Batch: {{ $store.state.models[item.name].info.current_batch_for_epoch}} / {{$store.state.models[item.name].info.batches_per_epoch }}
                                            v-progress-linear(:value="Object.keys($store.state.models[item.name].epochs).length / $store.state.models[item.name].info.total_epochs * 100" height="25" rounded)
                                                template(v-slot="{ value }")
                                                    span(style="color:white") Epoch: {{ Object.keys($store.state.models[item.name].epochs).length}} / {{$store.state.models[item.name].info.total_epochs }} ({{$store.state.models[item.name].info.progress.toPrecision(4)}} %)

                        v-tab-item
                            v-card(flat)
                                v-card-title Structure
                                v-card-text

        .row
            new-line-graph(g_title="Epoch Avg - Accuracy" :size="this.toggle_size" :chart-data="epoch_acc_data" :show-estimate="showEstimate" )
            new-line-graph(g_title="Epoch Avg - Loss" :size="this.toggle_size" :chart-data="epoch_loss_data" :show-estimate="showEstimate" :estimate="loss_estimate")
        .row(v-if="hasEvalData")
            new-line-graph(g_title="Eval - Accuracy" :size="this.toggle_size" :chart-data="eval_acc_data" :show-estimate="showEstimate" )
            new-line-graph(g_title="Eval - Loss" :size="this.toggle_size" :chart-data="eval_loss_data" :show-estimate="showEstimate")
        .row
            new-line-graph(g_title="Batch - Accuracy" :size="this.toggle_size" :chart-data="batch_acc_data" :show-estimate="showEstimate")
            new-line-graph(g_title="Batch - Loss" :size="this.toggle_size" :chart-data="batch_loss_data" :show-estimate="showEstimate" :estimate="loss_estimate")

</template>

<script lang="ts">
    import {Vue, Component} from 'vue-property-decorator'
    import NewLineGraph from "@/components/NewLineGraph.vue"

    @Component({components: {NewLineGraph}})
    export default class Home extends Vue {
        toggle_size: number = 1
        tab: number = 0
        settingsDialog: boolean = false
        showEstimate: boolean = false

        headers = [
            {text: "Model", value: "name"},
            {text: 'AVG Time (Batch)', value: 'batch_avg_time',},
            {text: 'AVG Time (Epoch)', value: 'epoch_avg_time'},
            {text: 'Start Time', value: 'start_time'},
            {text: 'Duration', value: 'duration'},
            {text: 'Time Left', value: 'time_left'},
            {text: 'Total Time', value: 'total_time'},
            //{ text: 'Progress', value: 'progress' },
        ]

        get table_data() {
            return Object.keys(this.$store.state.models).map((model: string) => {
                return {
                    name: model,
                    batch_avg_time: this.$store.state.models[model].info.avg_time.toPrecision(4),
                    epoch_avg_time: (this.$store.state.models[model].info.avg_time * this.$store.state.models[model].info.batches_per_epoch).toPrecision(4),
                    start_time: `${new Date(this.$store.state.models[model].info.start_time).toDateString()} ${this.formatTime(new Date(this.$store.state.models[model].info.start_time))}`,
                    duration: `${this.formatDuration(this.$store.state.models[model].info.duration)}`,
                    time_left: `${this.formatDuration(this.$store.state.models[model].info.time_left)}`,
                    total_time: `${this.formatDuration(this.$store.state.models[model].info.avg_time * this.$store.state.models[model].info.batches_per_epoch * this.$store.state.models[model].info.total_epochs)}`
                }
            })
        }

        loss_estimate = {
            calcFunc: (x: number, a: number, b: number) => Math.exp(b * x + a),
            aFunc: (x: number) => 1,
            bFunc: (x: number) => x,
            yFunc: (y: number) => Math.log(y)
        }

        acc_estimate = {
            calcFunc: (x: number, a: number, b: number) => a * x + b,
            aFunc: (x: number) => 1,
            bFunc: (x: number) => x,
            yFunc: (y: number) => Math.log(y + 10 ** 10)
        }

        formatTime(date: Date) {
            return (date.getHours() < 10 ? "0" + date.getHours() : date.getHours())
                + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
                + ":" + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds())
        }

        formatDuration(time: number) {
            const days = Math.floor(time / (3600 * 24))
            const hours = Math.floor((time - (days * 3600 * 24)) / 3600)
            const minutes = Math.floor((time - (days * 3600 * 24) - (hours * 3600)) / 60)
            const seconds = (time - (days * 3600 * 24) - (hours * 3600) - (minutes * 60))
            return days + "d " + (hours < 10 ? "0" + hours : hours) + "h " +
                (minutes < 10 ? "0" + minutes : minutes) + "m " +
                (seconds < 10 ? "0" + seconds.toPrecision(5) : seconds.toPrecision(5)) + "s"
        }

        get hasEvalData() {
            for (let model of Object.keys(this.$store.state.models)) {
                if (this.$store.state.models[model].info.eval_model)
                    return true
            }
            return false
        }

        get hasData() {
            return Object.keys(this.$store.state.models).length > 0
        }

        get epoch_acc_data() {
            return Object.keys(this.$store.state.models).map((model: string) =>
                this.$store.state.models[model].graphs.epoch_acc)
        }

        get epoch_loss_data() {
            return Object.keys(this.$store.state.models).map((model: string) =>
                this.$store.state.models[model].graphs.epoch_loss)
        }

        get eval_acc_data() {
            return Object.keys(this.$store.state.models).map((model: string) =>
                this.$store.state.models[model].graphs.eval_acc)
        }

        get eval_loss_data() {
            return Object.keys(this.$store.state.models).map((model: string) =>
                this.$store.state.models[model].graphs.eval_loss)
        }

        get batch_acc_data() {
            return Object.keys(this.$store.state.models).map((model: string) =>
                this.$store.state.models[model].graphs.batch_acc)
        }

        get batch_loss_data() {
            return Object.keys(this.$store.state.models).map((model: string) =>
                this.$store.state.models[model].graphs.batch_loss)
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

    .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 1096px;
    }
</style>