"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_server_express_1 = require("apollo-server-express");
var express_1 = __importDefault(require("express"));
var http_1 = require("http");
var subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
var graphql_1 = require("graphql");
var graphql_tools_1 = require("graphql-tools");
var data_handler_1 = __importDefault(require("./data_handler"));
var path_1 = __importDefault(require("path"));
var Visualizer = /** @class */ (function () {
    function Visualizer(path) {
        var _this = this;
        this.PORT = 3000;
        this.pubsub = new apollo_server_express_1.PubSub();
        this.data_handler = new data_handler_1.default(this.pubsub, path);
        var typeDefs = apollo_server_express_1.gql("\n              type LayerInfo {\n                type: String\n                activation: String\n                shape: [Int]\n              }\n              \n              type Model {\n                id: Int\n                info: Info\n                epochs: [Epoch]\n              }\n        \n              type Epoch {\n                id: Int\n                accuracy: Float\n                total_accuracy: Float\n                loss: Float\n                total_loss: Float\n                actual_duration: Float\n                calculated_duration: Float\n                batches: [Batch]\n                eval_loss: Float\n                eval_accuracy: Float\n              }\n              \n              type Batch {\n                id: Float\n                epoch_id: Float\n                accuracy: Float\n                loss: Float\n                time: Float\n                global_id: Float\n              }\n              \n              type Info {\n                model_structure: [LayerInfo]\n                total_neurons: Int\n                duration: Float\n                start_time: Float\n                total_epochs: Int\n                batches_per_epoch: Int\n                eval_model: Boolean\n              }\n              \n              type Query {\n                models: [Model]\n                model(id: Int): Model\n                epochs: [Epoch]\n                epoch(id: Int, model_id: Int): Epoch\n                batches: [Batch]\n                batch(id: Int, epoch_id: Int, model_id: Int): Batch\n              }\n              \n              type UpdateData {\n                id: Int\n                epoch: Epoch\n                info: Info\n              }\n              \n              type Subscription {\n                update: UpdateData\n              }\n            ");
        var schema = graphql_tools_1.makeExecutableSchema({
            typeDefs: typeDefs, resolvers: {
                Query: {
                    models: function () {
                        return _this.data_handler.getModels();
                    },
                    model: function (parent, args, context, info) {
                        return _this.data_handler.getModel(args.id);
                    },
                    batches: function (parent, args, context, info) {
                        return _this.data_handler.getBatches(args.model_id);
                    },
                    batch: function (parent, args, context, info) {
                        return _this.data_handler.getBatch(args.model_id, args.epoch_id, args.id);
                    },
                    epochs: function (parent, args, context, info) {
                        return _this.data_handler.getEpochs(args.model_id);
                    },
                    epoch: function (parent, args, context, info) {
                        return _this.data_handler.getEpoch(args.model_id, args.id);
                    }
                },
                Subscription: {
                    update: {
                        subscribe: function () { return _this.pubsub.asyncIterator("update"); },
                    },
                }
            }
        });
        this.wsServer = http_1.createServer(function (request, response) {
            response.writeHead(404);
            response.end();
        });
        var apolloServer = new apollo_server_express_1.ApolloServer({ schema: schema });
        var subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
            schema: schema,
            execute: graphql_1.execute,
            subscribe: graphql_1.subscribe,
        }, {
            server: this.wsServer,
            path: '/graphql',
        });
        var app = express_1.default();
        // @ts-ignore
        apolloServer.applyMiddleware({ app: app });
        app.use(express_1.default.static(path_1.default.join(__dirname, 'interface')));
        app.get("*", function (req, res) {
            res.sendFile(path_1.default.join(__dirname, 'interface/index.html'));
        });
        this.server = app;
    }
    Visualizer.prototype.run = function () {
        var _this = this;
        console.log("Starting server...");
        this.data_handler.startWatcher();
        this.wsServer.listen(this.PORT + 1, function () { return console.log("Websocket Server is now running on http://localhost:" + (_this.PORT + 1)); });
        this.server.listen({ port: this.PORT }, function () {
            console.log("Visualizer server ready at http://localhost:" + _this.PORT);
        });
    };
    return Visualizer;
}());
exports.default = Visualizer;
