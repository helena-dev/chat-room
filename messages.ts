export type BackMessage =
    UserList |
    Toast |
    ReceivedMessage |
    UserTyping |
    DeleteMessage |
    AckMessage

export type FrontMessage =
    SentMessage |
    UserNameSubmit |
    IsOnlineCheck |
    IsTyping |
    DeleteMessage |
    AckMessage

export interface UserList {
    type: "userList";
    users: UserInfo[];
}

export interface UserInfo {
    name: string;
    lastActivity: Date;
    online: boolean;
    own: boolean;
    cssColor: string;
    ipInfo: {
        region?: string,
        countryCode?: string,
        city?: string,
        bogon?: boolean,
    }
}

export interface ToastBase {
    type: "toast";
    toast: string;
    msgNum: number
}

export type Toast = UserNumChangeToast | NickChangeToast | PunishToast

export interface UserNumChangeToast extends ToastBase {
    toast: "userChange";
    sign: "plus" | "minus";
    name: string;
    own: boolean;
}

export interface NickChangeToast extends ToastBase {
    toast: "nickChange";
    oldName: string;
    newName: string;
    own: boolean;
}

export interface PunishToast extends ToastBase {
    toast: "punish";
    text: string;
}

export interface ReceivedMessage {
    type: "message";
    text: string;
    image?: string;
    own: boolean;
    from: string;
    date: Date;
    cssColor: string;
    msgNum: number;
    reply?: ReceivedMessage;
}

export interface SentMessage {
    type: "message";
    text: string;
    image?: string;
    reply?: ReceivedMessage;
    pseudoId: number;
}

export interface UserNameSubmit {
    type: "userName";
    text: string;
}

export interface IsOnlineCheck {
    type: "isOnline";
    online: boolean;
}

export interface IsTyping {
    type: "typing";
}

export interface UserTyping {
    type: "typing";
    from: string;
}

export interface DeleteMessage {
    type: "deleteMsg";
    msgNum: number;
}

export interface AckMessage {
    type: "ackMessage";
    date: Date;
    cssColor: string;
    msgNum: number;
    pseudoId: number
}
