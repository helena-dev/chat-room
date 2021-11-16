export type BackMessage =
    UserList |
    Toast |
    ReceivedMessage

export type FrontMessage =
    SentMessage |
    UserNameSubmit

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

export interface ToastBase {
    type: "toast";
    toast: string;
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
    own: boolean;
    from: string;
    date: Date;
    cssColor: string;
}

export interface SentMessage {
    type: "message";
    text: string;
}

export interface UserNameSubmit {
    type: "userName";
    text: string;
}