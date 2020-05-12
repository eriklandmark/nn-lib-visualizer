<template lang="pug">
    v-app(dark=true)
        v-card(color="grey lighten-4" flat tile)
            v-toolbar(dense)
                v-toolbar-title nn-lib visualizer
                v-spacer
        router-view
</template>

<script lang="ts">
    import { Vue, Component } from 'vue-property-decorator'
    import gql from "graphql-tag";

    @Component
    export default class App extends Vue {

        created() {
            this.$store.dispatch("fetchData")
        }

        mounted() {
            //@ts-ignore
            this.$apollo.addSmartSubscription('tagAdded', {
                query: gql`subscription epochs {
                    update {
                        id
                        epoch {
                            id, accuracy, loss, batches {
                                id, accuracy, loss, global_id, time
                            }, eval_loss, eval_accuracy
                        },
                        info {
                            duration
                        }
                    }
                  }`,
                result(data: any) {
                    this.$store.commit("updateModel", data.data.update)
                    this.$store.dispatch("updateModelInfo", data.data.update.id)
                },
            })
        }
    }
</script>

<style lang="scss">
    html {
        overflow-y: auto !important;
    }
</style>
