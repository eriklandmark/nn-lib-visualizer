"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var visualizer_1 = __importDefault(require("../server/visualizer"));
var vis = new visualizer_1.default([
    "../nn-lib-test/models/model_test_0/backlog.json",
    "../nn-lib-test/models/model_test_1/backlog.json",
    "../nn-lib-test/models/model_test_2/backlog.json",
    "../nn-lib-test/models/model_test_3/backlog.json",
    "../nn-lib-test/models/model_test_4/backlog.json",
    "../nn-lib-test/models/model_test_5/backlog.json",
]);
vis.PORT = 3000;
vis.UPDATE_INTERVAL = 5000;
vis.run();
