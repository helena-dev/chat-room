export type BackMessage =
    UserList |
    UserNumChangeToast |
    NickChangeToast |
    PunishToast |
    RecievedMessage

export type FrontMessage =
    SentMessage

export interface UserList {
    type: "userList";
    users: UserInfo[];
}

export interface UserInfo {
    name: string;
    lastActivity: Date;
    own: boolean;
    cssColor: string;
}

export interface UserNumChangeToast {
    type: "toast";
    toast: "userChange";
    sign: "plus" | "minus";
    name: string;
    own: boolean;
}

export interface NickChangeToast {
    type: "toast";
    toast: "nickChange";
    oldName: string;
    newName: string;
    own: boolean;
}

export interface PunishToast {
    type: "toast";
    toast: "punish";
    text: string;
}

export interface RecievedMessage {
    type: "message";
    text: string;
    own: boolean;
    from: string;
    date: Date;
    cssColor: string;
}

export interface SentMessage {
    type: "message";
    text: string;
}
