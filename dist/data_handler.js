"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var DataHandler = /** @class */ (function () {
    function DataHandler(pubSub, paths) {
        this.models = {};
        this.pubSub = pubSub;
        this.watchPaths = paths;
        this.loadData();
    }
    DataHandler.prototype.loadData = function () {
        this.models = this.watchPaths.reduce(function (acc, path, index) {
            acc[index.toString()] = JSON.parse(fs_1.default.readFileSync(path, { encoding: "utf-8" }));
            return acc;
        }, {});
    };
    DataHandler.prototype.startWatcher = function () {
        var _this = this;
        this.watchPaths.forEach(function (path) {
            if (!fs_1.default.existsSync(path)) {
                throw "Backlog file doesn't exists... Aborting!";
            }
            fs_1.default.watchFile(path, {}, function (stats) {
                console.log("Backlog updated.");
                _this.loadData();
                var model_id = _this.watchPaths.indexOf(path).toString();
                var latest_epoch = Object.keys(_this.models[model_id].epochs)[Object.keys(_this.models[model_id].epochs).length - 1];
                var data = _this.getEpoch(model_id, parseInt(latest_epoch.substr(latest_epoch.lastIndexOf("_") + 1)));
                _this.pubSub.publish("update", { update: { id: model_id, epoch: data, info: _this.getModelInfo(model_id) } });
            });
        });
        console.log("Started backlog watchers!");
    };
    DataHandler.prototype.getModelInfo = function (modelId) {
        return {
            model_structure: this.models[modelId].model_structure,
            total_neurons: this.models[modelId].total_neurons,
            duration: this.models[modelId].calculated_duration,
            start_time: this.models[modelId].train_start_time,
            total_epochs: this.models[modelId].total_epochs,
            batches_per_epoch: this.models[modelId].batches_per_epoch,
            eval_model: this.models[modelId].eval_model
        };
    };
    DataHandler.prototype.getBatches = function (modelId) {
        var _this = this;
        return Object.keys(this.models[modelId].epochs).reduce(function (acc, epoch) {
            acc.push.apply(acc, __spread(_this.models[modelId].epochs[epoch].batches.map(function (batch, index) {
                batch["id"] = index;
                batch["epoch_id"] = parseInt(epoch.substr(epoch.lastIndexOf("_") + 1));
                batch["global_id"] = batch["epoch_id"] - 1 == 0 ? index :
                    (batch["epoch_id"] - 1) * _this.models[modelId].epochs["epoch_" + (batch["epoch_id"] - 1)].batches.length + index;
                return batch;
            })));
            return acc;
        }, []);
    };
    DataHandler.prototype.getBatch = function (modelId, epoch_id, batch_id) {
        return this.getBatches(modelId).filter(function (batch) { return batch.id == batch_id && batch.epoch_id == epoch_id; })[0];
    };
    DataHandler.prototype.parseEpoch = function (modelId, epoch) {
        var _this = this;
        var epoch_id = parseInt(epoch.substr(epoch.lastIndexOf("_") + 1));
        var data = Object.create(this.models[modelId].epochs[epoch]);
        data.batches = data.batches.map(function (batch, index) {
            batch["id"] = index;
            batch["epoch_id"] = epoch_id;
            batch["global_id"] = epoch_id - 1 == 0 ? index :
                (epoch_id - 1) * _this.models[modelId].epochs["epoch_" + (epoch_id - 1)].batches.length + index;
            return batch;
        });
        data["accuracy"] = this.models[modelId].epochs[epoch].total_accuracy / this.models[modelId].epochs[epoch].batches.length;
        data["loss"] = this.models[modelId].epochs[epoch].total_loss / this.models[modelId].epochs[epoch].batches.length;
        data["id"] = epoch_id;
        return data;
    };
    DataHandler.prototype.getEpochs = function (modelId) {
        var _this = this;
        return Object.keys(this.models[modelId].epochs).map(function (epoch) {
            return _this.parseEpoch(modelId, epoch);
        });
    };
    DataHandler.prototype.getEpoch = function (modelId, epoch_id) {
        return this.parseEpoch(modelId, "epoch_" + epoch_id);
    };
    DataHandler.prototype.getModel = function (modelId) {
        return {
            id: parseInt(modelId),
            info: this.getModelInfo(modelId),
            epochs: this.getEpochs(modelId)
        };
    };
    DataHandler.prototype.getModels = function () {
        var _this = this;
        return Object.keys(this.models).map(function (model) { return _this.getModel(model); });
    };
    return DataHandler;
}());
exports.default = DataHandler;
