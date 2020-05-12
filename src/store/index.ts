import Vue from 'vue'
import Vuex from 'vuex'
import gql from "../lib/gql_lib"
import ModelInterface from "@/store/model_interface";

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        models: {} as {[propName: string]: ModelInterface}
    },
    mutations: {
        updateModel(state, model) {
            Vue.set(state.models[model.id], "info", Object.assign(state.models[model.id].info, model.info))
            if (state.models[model.id].epochs[model.epoch.id]) {
                const data =  Object.assign(state.models[model.id].epochs[model.epoch.id], model.epoch)
                Vue.set(state.models[model.id].epochs, model.epoch.id, data)
            } else {
                Vue.set(state.models[model.id].epochs, model.epoch.id, model.epoch)
            }
        },

        updateGraph(state, data) {
            Vue.set(state.models[data.modelId].graphs, data.item, data.data)
        }
    },
    actions: {
        async fetchData(store) {
            let result = await gql(
                `query {
                    models {
                        id
                        epochs {
                            id, accuracy, loss, batches {id, accuracy, loss, global_id, time}, eval_loss, eval_accuracy
                        }
                        
                        info {
                            duration, start_time, total_neurons, batches_per_epoch, total_epochs, eval_model
                        }
                    }
                }`
            )

            store.state.models = result.data.data.models.reduce((acc: any, model: any) => {
                const mod = model
                mod.epochs = mod.epochs.reduce((e_acc: any, epoch: any) => {
                    e_acc[epoch["id"]] = epoch
                    return e_acc
                }, {})
                mod["graphs"] = {}
                acc[model["id"]] = mod;

                return acc
            }, {})

            Object.keys(store.state.models).forEach((model) => {
                store.dispatch("updateModelInfo", model)
            })
        },
        updateModelInfo(store, modelId: string) {
            const last_epoch = Object.keys(store.state.models[modelId].epochs)[Object.keys(store.state.models[modelId].epochs).length - 1]
            Vue.set(store.state.models[modelId].info, "current_batch_for_epoch", store.state.models[modelId].epochs[last_epoch].batches.length)

            const total_batches_done = ((Object.keys(store.state.models[modelId].epochs).length - 1)
                * store.state.models[modelId].info.batches_per_epoch) + store.state.models[modelId].info.current_batch_for_epoch

            Vue.set(store.state.models[modelId].info, "avg_time", Object.keys(store.state.models[modelId].epochs).reduce((acc: any, epoch) => {
                store.state.models[modelId].epochs[epoch].batches.forEach((batch: any) => {
                    acc += batch.time
                })
                return acc
            }, 0) / total_batches_done)

            Vue.set(store.state.models[modelId].info, "progress", (total_batches_done / (store.state.models[modelId].info.batches_per_epoch * store.state.models[modelId].info.total_epochs))*100)

            const batches_left = (store.state.models[modelId].info.batches_per_epoch * store.state.models[modelId].info.total_epochs) - total_batches_done
            Vue.set(store.state.models[modelId].info, "time_left", batches_left * store.state.models[modelId].info.avg_time)

            Vue.set(store.state.models[modelId].graphs, "epoch_acc", Object.keys(store.state.models[modelId].epochs).reduce((acc, epoch) => {
                acc.y.push(store.state.models[modelId].epochs[epoch].accuracy)
                acc.x.push(store.state.models[modelId].epochs[epoch].id)
                return acc
            }, {x: [0], y:[0], name: "model_" + modelId}))

            Vue.set(store.state.models[modelId].graphs, "epoch_loss", Object.keys(store.state.models[modelId].epochs).reduce((acc, epoch) => {
                acc.y.push(store.state.models[modelId].epochs[epoch].loss)
                acc.x.push(store.state.models[modelId].epochs[epoch].id)
                return acc
            }, {x: [] as number[], y:[] as number[], name: "model_" + modelId}))

            Vue.set(store.state.models[modelId].graphs, "eval_acc", Object.keys(store.state.models[modelId].epochs)
                    .slice(0, Object.keys(store.state.models[modelId].epochs).length - 1).reduce((acc, epoch) => {
                        acc.y.push(store.state.models[modelId].epochs[epoch].eval_accuracy)
                        acc.x.push(store.state.models[modelId].epochs[epoch].id)
                        return acc
                    }, {x: [0], y:[0], name: "model_" + modelId}))

            Vue.set(store.state.models[modelId].graphs, "eval_loss", Object.keys(store.state.models[modelId].epochs)
                .slice(0, Object.keys(store.state.models[modelId].epochs).length - 1).reduce((acc, epoch) => {
                    acc.y.push(store.state.models[modelId].epochs[epoch].eval_loss)
                    acc.x.push(store.state.models[modelId].epochs[epoch].id)
                    return acc
                }, {x: [] as number[], y:[] as number[], name: "model_" + modelId}))

            Vue.set(store.state.models[modelId].graphs,"batch_acc", Object.keys(store.state.models[modelId].epochs).reduce((acc: any, epoch) => {
                    store.state.models[modelId].epochs[epoch].batches.forEach((batch: any) => {
                        acc.y.push(batch.accuracy)
                        acc.x.push(batch.global_id)
                    })
                    return acc
                }, {x: [0], y:[0], name: "model_" + modelId}))

            Vue.set(store.state.models[modelId].graphs, "batch_loss", Object.keys(store.state.models[modelId].epochs).reduce((acc: any, epoch) => {
                store.state.models[modelId].epochs[epoch].batches.forEach((batch: any) => {
                    acc.y.push(batch.loss)
                    acc.x.push(batch.global_id)
                })
                return acc
            }, {x: [], y:[], name: "model_" + modelId}))
        }
    },
    modules: {}
})
