import {Logger,RestMessage,RestResponse, StringDictionary,NumericDictionary} from "chat-core";
import * as Q from "q";
import {Request} from "restify";
import { SessionManager } from "./session-manager";
import {GroupDetails} from "./group";

export class ChatManager{
    private _logger: Logger;
    private _commandHandlers: StringDictionary<(msg: RestMessage,req: Request) => Q.Promise<RestResponse> >;

    constructor(private _SessionManager:SessionManager){
        this._logger = new Logger("ChatManager");
        this._commandHandlers = {
            "enterRoom": (msg,req) => this.handleEnterGroups(msg,req),
            "getAllGroups": (msg,req) => this.handleGetAllGroups(msg,req)
        };
    }

    public handle(message: RestMessage, req: Request): Q.Promise<RestResponse>{
        const funcName = "handle";
        this._logger.trace(funcName,": Got request:",message);
        if(!(message.methodName in this._commandHandlers)){
            this._logger.error(funcName,": Unsupported method named",message.methodName);
            Q.reject({
                status: 500,
                data: {
                    errorMessage: message.methodName + "NotImplemented"
                }
            });
        }

        return this._commandHandlers[message.methodName](message,req)
            .then((res) => {
                res.status = res.status || 200;
                return res;
            })
            .catch((e:Error) => {
                this._logger.error(funcName,": Got exception during handling ", e);
                return {
                    status: 500,
                    data: {
                        errorMesage: e.message
                    }
                };
            });
    }

    private handleGetAllGroups(message: RestMessage, req: Request): Q.Promise<RestResponse>{
        return Q.resolve({
            status: 200,
            data: {
                1: "Avishay",
                2: "Eyal",
                3: "Work Interview"
            }
        });
    }

    private handleEnterGroups(message: RestMessage, req: Request): Q.Promise<RestResponse>{
        const funcName = "handleEnterGroups";
        this._logger.trace(funcName,": Started for the following:",message.message);
        return this._SessionManager.getAllGroups()
            .then((groupsInfo) => {
                groupsInfo = groupsInfo || {};
                let groupId = message.message.groupId;
                let userID = message.message.userId;
                this._logger.trace(funcName,": Got the following available groups:",groupsInfo);
                let group = groupsInfo[message.message.groupId] || {members:[]};
                if(group.members.indexOf(userID) != -1){
                    this._logger.warn(funcName,": User already in the group do nothin");
                    return Q.resolve<void>();
                }
                this._logger.trace(funcName,": Going to add ", userID, ": to Group:", group);
                group.members.push(userID);
                groupsInfo[groupId] = group;
                this._logger.trace(funcName, ": Going to leave group ", message.message.currentGroup);
                groupsInfo[message.message.currentGroup] = groupsInfo[message.message.currentGroup] || {members:[]};
                groupsInfo[message.message.currentGroup].members = groupsInfo[message.message.currentGroup].members.filter((val) => val != userID);
                return this._SessionManager.setAllGroups(groupsInfo);
            })
            .then(() => {
                return {
                    status: 200,
                    data: {}
                }
            })
    }

}