import * as Q from "q";
import { GroupDetails } from "./group";
import { NumericDictionary } from "chat-core";

export interface SessionManager{
    getAllGroups(): Q.Promise<NumericDictionary<GroupDetails>>;
    setAllGroups(groups: NumericDictionary<GroupDetails>): Q.Promise<void>;
}