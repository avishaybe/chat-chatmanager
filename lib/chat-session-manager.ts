import * as Q from "q";
import {Logger, NumericDictionary} from "chat-core";
import { GroupDetails } from "./group";
import * as redis from "redis";
import { SessionManager } from "./session-manager";

export class ChatSessionManager implements SessionManager{
    private _logger: Logger;
    private _redisClient: redis.RedisClient;
    private _connectDefer: Q.Deferred<void>;
    
    constructor(){
        this._logger = new Logger("ChatSessionManager");
        const funcName = "c'tor";
    }

    public getAllGroups(): Q.Promise<NumericDictionary<GroupDetails>>{
        return this._connect()
            .then(() => {
                return Q.nfcall(this._redisClient.get.bind(this._redisClient,"groups"));
            })
            .then((groupsJSON:string) => {
                return JSON.parse(groupsJSON);
            })
            .catch(e => {
                this._logger.warn("failed to obtain data",e);
                return null;
            })
    }

    public setAllGroups(groups: NumericDictionary<GroupDetails>): Q.Promise<void>{
        return this._connect()
            .then(() => {                
                return Q.nfcall(this._redisClient.set.bind(this._redisClient,"groups",JSON.stringify(groups)));
            });
    }

    private _connect(): Q.Promise<void> {
        const funcName = "_connect"
        if(this._connectDefer != null && this._connectDefer.promise.isFulfilled()){
            // Already connected.
            return this._connectDefer.promise;
        }

        if(this._connectDefer != null && this._connectDefer.promise.isPending()){
            this._logger.trace(funcName,": Already connecting to redis going to return the connect promise");
            return this._connectDefer.promise;
        }
        this._logger.info(funcName,": Going to connect to redis server");
        this._redisClient = redis.createClient();
        this._connectDefer = Q.defer();
        this._redisClient.on("connect", () => {
            this._logger.info(funcName,": Got connection to the redis server going to resolve the promise");
            this._connectDefer.resolve();
        });

        this._redisClient.on("error",(e) => {
            this._logger.error(funcName,": Got error while trying to connect  to the redis server going to reject the promise");
            this._connectDefer.reject(e);
        });

        this._redisClient.on("end",() => {
            this._connectDefer = null;
        });

        return this._connectDefer.promise;
    }
}