import Visualizer from "../server/visualizer";
const vis = new Visualizer([
    "../nn-lib-test/models/model_test_0/backlog.json",
    "../nn-lib-test/models/model_test_1/backlog.json",
    "../nn-lib-test/models/model_test_2/backlog.json",
    "../nn-lib-test/models/model_test_3/backlog.json",
    "../nn-lib-test/models/model_test_4/backlog.json",
    "../nn-lib-test/models/model_test_5/backlog.json",
])
vis.PORT = 3000
vis.UPDATE_INTERVAL = 5000
vis.run()