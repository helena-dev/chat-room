import { IPinfo } from "node-ipinfo"

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
    TokenAuthResponse |
    UpdateBkgColor |
    UpdatePassword |
    DeleteConfirmation |
    OwnConnections |
    MessageList

export type FrontMessage =
    SentMessage |
    UserNameSubmit |
    IsOnlineCheck |
    IsTyping |
    DeleteMessage |
    EditMessage |
    LoginRequest |
    SignupRequest |
    TokenAuthRequest |
    UpdateBkgColor |
    PasswordChange |
    DeleteAccount |
    DeleteAccountYes

export interface UserList {
    type: "userList";
    users: UserInfo[];
}

export interface UserInfo {
    id: number;
    name: string;
    lastActivity: number;
    connected: boolean;
    online: boolean;
    own: boolean;
    cssColor?: string;
    ipInfo?: {
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

export interface BasicMessage {
    text: string;
    image?: string;
    user_name: string;
    date: Date;
    msgNum: number;
    replyNum?: number;
    edited: boolean;
    from_id: number;
}

export interface ReceivedMessage extends BasicMessage{
    type: "message";
    cssColor: string;
    own: boolean;
}

export interface MessageList {
    type: "messageList";
    messages: BasicMessage[]
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
    from: number;
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
    token?: string;
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
    token?: string;
}

export interface TokenAuthRequest {
    type: "auth";
    token: string;
}

export interface TokenAuthResponse {
    type: "auth";
    ok: boolean;
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

export interface OwnConnections {
    type: "ownCons";
    connections: Connection[]
}

export interface Connection {
    conNum: number;
    own: boolean;
    currentIP: IPinfo;
    online: boolean;
    lastActivity: Date;
}
