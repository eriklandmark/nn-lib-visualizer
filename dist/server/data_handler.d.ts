import { PubSub } from "apollo-server";
import { BacklogData } from "nn-lib/dist/model";
export default class DataHandler {
    pubSub: PubSub;
    watchPaths: string[];
    models: {
        [propName: string]: BacklogData;
    };
    update_interval: number;
    constructor(pubSub: PubSub, paths: string[]);
    loadData(path?: null | string): void;
    startWatcher(): void;
    getModelInfo(modelId: string): {
        model_structure: any;
        total_neurons: number;
        duration: number;
        start_time: number;
        total_epochs: number;
        batches_per_epoch: number;
        eval_model: boolean;
    };
    getBatches(modelId: string): any[];
    getBatch(modelId: string, epoch_id: number, batch_id: number): any;
    private parseEpoch;
    getEpochs(modelId: string): any[];
    getEpoch(modelId: string, epoch_id: number): any;
    getModel(modelId: string): {
        id: number;
        info: {
            model_structure: any;
            total_neurons: number;
            duration: number;
            start_time: number;
            total_epochs: number;
            batches_per_epoch: number;
            eval_model: boolean;
        };
        epochs: any[];
    };
    getModels(): {
        id: number;
        info: {
            model_structure: any;
            total_neurons: number;
            duration: number;
            start_time: number;
            total_epochs: number;
            batches_per_epoch: number;
            eval_model: boolean;
        };
        epochs: any[];
    }[];
}
