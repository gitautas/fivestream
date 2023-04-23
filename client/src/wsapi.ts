import { LocalParticipant, LocalTrackPublication, Participant, ParticipantEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, Room, RoomEvent, Track, VideoPresets } from "livekit-client";
import {v4 as uuidv4} from 'uuid';


enum MessageType {
    Identify,
    SubscribeToken
}

class Message {
    public type: MessageType = MessageType.Identify;
    public data: any = "";

    constructor(type: MessageType, data: string) {
        this.type = type;
        this.data = data;
    }
}

export default class Manager {
    private connection: WebSocket;
    private room: Room;
    private jwt: string = "";

    constructor() {
        console.log("Connecting to websocket server...")
        let conn = new WebSocket("ws://localhost:7001/ws");

        conn.onmessage = (event) => this.handleEvent(event);
        conn.onclose = (event) => this.handleClose(event);
        conn.onopen = () => this.identify();
        this.connection = conn;

        this.room = new Room({
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
                resolution: VideoPresets.h1080.resolution
            }
        }).on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed)
            .on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed)
            .on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakerChange)
            .on(RoomEvent.Disconnected, this.handleDisconnect)
            .on(RoomEvent.Connected, this.handleConnected)
            .on(RoomEvent.LocalTrackUnpublished, this.handleLocalTrackUnpublished);

        this.room.localParticipant
            .on(ParticipantEvent.ParticipantPermissionsChanged, this.handleUpdatePermissions);
    }

    private handleEvent(event: MessageEvent) {
        console.log("Received event: ", event);
        if (event.data) {
            let json = JSON.parse(event.data);
            let msg = new Message(
                json["type"],
                json["data"]
            );

            console.log("Received message: ", msg);

            switch (msg.type) {
                case MessageType.SubscribeToken: {
                    console.log("Got sub token");
                    this.jwt = msg.data;
                    this.connect();
                }
            }
        }
    }

    private handleClose(event: CloseEvent) {
        console.log("Closed with event: ", event);
    }

    private sendMessage(message: Message) {
        console.log("Sending message: ", message);
        this.connection.send(JSON.stringify(message));
    }

    private identify() {
        let name = uuidv4();
        this.sendMessage(
            new Message(MessageType.Identify, name));
    }

    private connect() {
        console.log("Connecting to LiveKit");
        this.room.connect("ws://0.0.0.0:7880", this.jwt);
    }

    private handleConnected() {
        console.log("Connected to LiveKit");
        console.log(this); // what the fuck
        this.localParticipant.enableCameraAndMicrophone();
    }

    private handleTrackSubscribed(
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
    ) {
        console.log("Subscribed to track: ", track);
        if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
            // attach it to a new HTMLVideoElement or HTMLAudioElement
            const element = track.attach();
            // document.getElementById("2").appendChild(element);
            console.log(element);
        }
    }

    private handleTrackUnsubscribed(
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) {
        // remove tracks from all attached elements
        console.log("Unsubscribed to track: ", track);
        track.detach();
    }

    private handleLocalTrackUnpublished(track: LocalTrackPublication, participant: LocalParticipant) {
        // when local tracks are ended, update UI to remove them from rendering
        // track.detach();
    }

    private handleActiveSpeakerChange(speakers: Participant[]) {
    }

    private handleUpdatePermissions() {
        console.log("Upgraded");

    }

    private handleDisconnect() {
        console.log('Disconnected from room');
    }
}
