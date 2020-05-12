import {PubSub} from "apollo-server"
import fs from "fs"
import {BacklogData} from "../model";

export default class DataHandler {

    pubSub: PubSub
    watchPaths: string[]
    models: {[propName: string]: BacklogData}

    constructor(pubSub: PubSub, paths: string[]) {
        this.pubSub = pubSub
        this.watchPaths = paths
        this.loadData()
    }

    loadData() {
        this.models = this.watchPaths.reduce((acc: {[propName: string]: BacklogData}, path: string, index: number) => {
            acc[index.toString()] = JSON.parse(fs.readFileSync(path, {encoding: "utf-8"}))
            return acc
        }, {})
    }

    startWatcher() {
        this.watchPaths.forEach((path) => {
            if(!fs.existsSync(path)) {
                throw "Backlog file doesn't exists... Aborting!"
            }
            fs.watchFile(path, {}, (stats) => {
                console.log("Backlog updated.")
                this.loadData()
                const model_id = this.watchPaths.indexOf(path).toString()
                const latest_epoch = Object.keys(this.models[model_id].epochs)[Object.keys(this.models[model_id].epochs).length - 1]
                const data = this.getEpoch(model_id, parseInt(latest_epoch.substr(latest_epoch.lastIndexOf("_") + 1)))
                this.pubSub.publish("update", {update: {id: model_id, epoch: data, info: this.getModelInfo(model_id)}})
            })
        })

        console.log("Started backlog watchers!")
    }

    getModelInfo(modelId: string) {
        return {
            model_structure: this.models[modelId].model_structure,
            total_neurons: this.models[modelId].total_neurons,
            duration: this.models[modelId].calculated_duration,
            start_time: this.models[modelId].train_start_time,
            total_epochs: this.models[modelId].total_epochs,
            batches_per_epoch: this.models[modelId].batches_per_epoch,
            eval_model: this.models[modelId].eval_model
        }
    }

    getBatches(modelId: string) {
        return Object.keys(this.models[modelId].epochs).reduce((acc, epoch) => {
            acc.push(...this.models[modelId].epochs[epoch].batches.map((batch, index) => {
                batch["id"] = index
                batch["epoch_id"] = parseInt(epoch.substr(epoch.lastIndexOf("_") + 1));
                batch["global_id"] = batch["epoch_id"] - 1 == 0? index :
                    (batch["epoch_id"] - 1) * this.models[modelId].epochs["epoch_" + (batch["epoch_id"] - 1)].batches.length + index
                return batch
            }))
            return acc
        }, [])
    }

    getBatch(modelId: string, epoch_id: number, batch_id: number) {
        return this.getBatches(modelId).filter((batch) => batch.id == batch_id && batch.epoch_id == epoch_id)[0]
    }

    private parseEpoch(modelId: string, epoch: string) {
        const epoch_id = parseInt(epoch.substr(epoch.lastIndexOf("_") + 1))
        const data = Object.create(this.models[modelId].epochs[epoch])
        data.batches = data.batches.map((batch, index) => {
            batch["id"] = index
            batch["epoch_id"] = epoch_id;
            batch["global_id"] = epoch_id - 1 == 0? index :
                (epoch_id - 1) * this.models[modelId].epochs["epoch_" + (epoch_id - 1)].batches.length + index
            return batch
        })
        data["accuracy"] = this.models[modelId].epochs[epoch].total_accuracy / this.models[modelId].epochs[epoch].batches.length
        data["loss"] = this.models[modelId].epochs[epoch].total_loss / this.models[modelId].epochs[epoch].batches.length
        data["id"] = epoch_id
        return data
    }

    getEpochs(modelId) {
        return Object.keys(this.models[modelId].epochs).map((epoch) => {
            return this.parseEpoch(modelId, epoch)
        })
    }

    getEpoch(modelId, epoch_id: number) {
        return this.parseEpoch(modelId,"epoch_" + epoch_id)
    }

    getModel(modelId: string) {
        return {
            id: parseInt(modelId),
            info: this.getModelInfo(modelId),
            epochs: this.getEpochs(modelId)
        }
    }

    getModels() {
        return Object.keys(this.models).map((model) => this.getModel(model))
    }
}