import {ApolloServer, gql, PubSub} from "apollo-server-express";
import express from "express"
import {createServer} from 'http';
import {SubscriptionServer} from 'subscriptions-transport-ws';
import {execute, subscribe} from 'graphql';
import {makeExecutableSchema} from "graphql-tools";
import DataHandler from "./data_handler";
import Path from "path"

export default class Visualizer {
    PORT = 3000

    pubsub = new PubSub();
    data_handler: DataHandler
    server: any
    wsServer: any

    constructor(path: string[]) {
        this.data_handler = new DataHandler(this.pubsub, path)
        const typeDefs = gql(`
              type LayerInfo {
                type: String
                activation: String
                shape: [Int]
              }
              
              type Model {
                id: Int
                info: Info
                epochs: [Epoch]
              }
        
              type Epoch {
                id: Int
                accuracy: Float
                total_accuracy: Float
                loss: Float
                total_loss: Float
                actual_duration: Float
                calculated_duration: Float
                batches: [Batch]
                eval_loss: Float
                eval_accuracy: Float
              }
              
              type Batch {
                id: Float
                epoch_id: Float
                accuracy: Float
                loss: Float
                time: Float
                global_id: Float
              }
              
              type Info {
                model_structure: [LayerInfo]
                total_neurons: Int
                duration: Float
                start_time: Float
                total_epochs: Int
                batches_per_epoch: Int
                eval_model: Boolean
              }
              
              type Query {
                models: [Model]
                model(id: Int): Model
                epochs: [Epoch]
                epoch(id: Int, model_id: Int): Epoch
                batches: [Batch]
                batch(id: Int, epoch_id: Int, model_id: Int): Batch
              }
              
              type UpdateData {
                id: Int
                epoch: Epoch
                info: Info
              }
              
              type Subscription {
                update: UpdateData
              }
            `)

        const schema = makeExecutableSchema({
            typeDefs, resolvers: {
                Query: {
                    models: () => {
                        return this.data_handler.getModels()
                    },
                    model: (parent: any, args: any, context: any, info: any) => {
                        return this.data_handler.getModel(args.id)
                    },
                    batches: (parent: any, args: any, context: any, info: any) => {
                        return this.data_handler.getBatches(args.model_id)
                    },
                    batch: (parent: any, args: any, context: any, info: any) => {
                        return this.data_handler.getBatch(args.model_id, args.epoch_id, args.id);
                    },
                    epochs: (parent: any, args: any, context: any, info: any) => {
                        return this.data_handler.getEpochs(args.model_id)
                    },
                    epoch: (parent: any, args: any, context: any, info: any) => {
                        return this.data_handler.getEpoch(args.model_id, args.id);
                    }
                },
                Subscription: {
                    update: {
                        subscribe: () => this.pubsub.asyncIterator("update"),
                    },
                }
            }
        })
        this.wsServer = createServer((request, response) => {
            response.writeHead(404)
            response.end()
        });

        const apolloServer = new ApolloServer({schema})

        const subscriptionServer = SubscriptionServer.create(
            {
                schema,
                execute,
                subscribe,
            },
            {
                server: this.wsServer,
                path: '/graphql',
            },
        );

        const app = express();
        // @ts-ignore
        apolloServer.applyMiddleware({app});
        app.use(express.static(Path.join(__dirname, 'interface')))
        app.get("*", (req, res) => {
            res.sendFile(Path.join(__dirname, 'interface/index.html'))
        })
        this.server = app
    }

    run() {
        console.log("Starting server...")

        this.data_handler.startWatcher()

        this.wsServer.listen(this.PORT + 1, () => console.log(
            `Websocket Server is now running on http://localhost:${this.PORT + 1}`
        ));

        this.server.listen({port: this.PORT}, () => {
            console.log(`Visualizer server ready at http://localhost:${this.PORT}`);
        });
    }
}
