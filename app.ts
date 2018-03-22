import {Logger,RESTCommunicationListener,RestMessage} from "chat-core";
import {ChatManager} from "./lib/chat-manager";
import {Request} from "restify";
import {ChatSessionManager} from "./lib/chat-session-manager";

Logger.initLogging();

let logger = new Logger("ChatService.Main");
logger.info("Started");

// Going to initalize the service
let restServer = new RESTCommunicationListener(8083,"/rest/chatmanager");
let sessionManager = new ChatSessionManager();
let chatManager= new ChatManager(sessionManager);
restServer.onRequest = (message: RestMessage,req: Request) => chatManager.handle(message,req);
restServer.start()
    .then(() => {
        logger.info("Started listening");
    })

