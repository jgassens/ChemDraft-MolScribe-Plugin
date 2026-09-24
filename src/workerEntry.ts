import { runPluginWorker } from "@chemdraft/plugin-api";

import { molscribeOcsrWorkerRegistration } from "./workerRegistration";

runPluginWorker(molscribeOcsrWorkerRegistration);
