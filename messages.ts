export type BackMessage =
    UserList |
    Toast |
    ReceivedMessage |
    UserTyping |
    DeleteMessage |
    AckMessage |
    EditMessage |
    LoginResponse |
    SignupResponse |
    UpdateBkgColor |
    UpdatePassword |
    DeleteConfirmation

export type FrontMessage =
    SentMessage |
    UserNameSubmit |
    IsOnlineCheck |
    IsTyping |
    DeleteMessage |
    EditMessage |
    LoginRequest |
    SignupRequest |
    UpdateBkgColor |
    PasswordChange |
    DeleteAccount |
    DeleteAccountYes

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
    replyNum?: number;
    edited: boolean;
}

export interface SentMessage {
    type: "message";
    text: string;
    image?: string;
    replyNum?: number;
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
    pseudoId: number;
}

export interface EditMessage {
    type: "edit";
    msgNum: number;
    text: string;
}

export interface LoginRequest {
    type: "login";
    userName: string;
    password: string;
}

export interface LoginResponse {
    type: "login";
    ok: boolean;
}

export interface SignupRequest {
    type: "signup";
    userName: string;
    password: string;
    captchaResponse: string;
}

export interface SignupResponse {
    type: "signup";
    ok: boolean;
    err: number;
}

export interface UpdateBkgColor {
    type: "bkgColor";
    color: number;
}

export interface PasswordChange {
    type: "password";
    oldPwd: string;
    newPwd: string;
}

export interface UpdatePassword {
    type: "password";
    ok: boolean;
}

export interface DeleteAccount {
    type: "deleteAccount";
    password: string;
}

export interface DeleteConfirmation {
    type: "deleteConfirmation";
}

export interface DeleteAccountYes {
    type: "deleteAccountYes"
}
