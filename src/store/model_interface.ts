export default interface ModelInterface {
    id: string,
    info: {
        batches_per_epoch: number
        current_batch_for_epoch: number
        progress: number
        avg_time: number
        time_left: number
        model_structure: {
            type: string
            activation: string
            shape: number[]
        }[]
        total_neurons: number
        duration: number
        start_time: number
        total_epochs: number
        eval_model: boolean
    },
    epochs: {
        [propName: string]: {
            batches: {
                loss: number,
                accuracy: number,
                time: number,
                id: number,
                epoch_id: number,
                global_id: number
            }[],
            id: number,
            accuracy: number,
            total_accuracy: number,
            loss: number,
            total_loss: number,
            actual_duration: number,
            calculated_duration: number,
            eval_loss: number
            eval_accuracy: number
        }
    },
    estimate: {
        loss_a: number,
        loss_b: number,
        acc_a: number,
        acc_b: number
    },
    graphs: {
        batch_loss: any,
        batch_acc: any,
        epoch_loss: any,
        epoch_acc: any,
        eval_loss: any,
        eval_acc: any
    }
}